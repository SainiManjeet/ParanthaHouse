import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DELIVERY_FEE_CENTS = 2500;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] as string);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return respond(405, { error: 'Only POST requests are accepted.' });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 16_000) {
    return respond(413, { error: 'The order request is too large.' });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return respond(400, { error: 'The order request must contain valid JSON.' });
  }

  const customerName = typeof payload.customerName === 'string' ? payload.customerName.trim() : '';
  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
  const address = typeof payload.address === 'string' ? payload.address.trim() : '';
  const paymentMethod = payload.paymentMethod;
  const requestedItems = payload.items;

  if (customerName.length < 1 || customerName.length > 100) {
    return respond(400, { error: 'Enter a name between 1 and 100 characters.' });
  }
  if (!/^[6-9][0-9]{9}$/.test(phone)) {
    return respond(400, { error: 'Enter a valid 10-digit Indian mobile number.' });
  }
  if (address.length < 5 || address.length > 500) {
    return respond(400, { error: 'Enter a delivery address between 5 and 500 characters.' });
  }
  if (paymentMethod !== 'upi' && paymentMethod !== 'cod') {
    return respond(400, { error: 'Choose UPI or Cash on Delivery.' });
  }
  if (!Array.isArray(requestedItems) || requestedItems.length < 1 || requestedItems.length > 30) {
    return respond(400, { error: 'An order must contain between 1 and 30 menu items.' });
  }

  const quantities = new Map<string, number>();
  for (const item of requestedItems) {
    if (
      !item
      || typeof item !== 'object'
      || typeof item.id !== 'string'
      || !uuidPattern.test(item.id)
      || !Number.isInteger(item.quantity)
      || item.quantity < 1
      || item.quantity > 20
      || quantities.has(item.id)
    ) {
      return respond(400, { error: 'One or more items or quantities are invalid.' });
    }
    quantities.set(item.id, item.quantity);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Order service is missing its Supabase server configuration.');
    return respond(500, { error: 'The order service is not configured.' });
  }

  try {
    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const clientIp = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0].trim();
    if (!clientIp) {
      return respond(503, { error: 'Could not verify this request. Please try again.' });
    }
    const ipHash = await sha256(clientIp);
    const { data: withinLimit, error: limitError } = await client.rpc('consume_order_rate_limit', {
      p_ip_hash: ipHash,
    });
    if (limitError) {
      console.error('Order rate-limit check failed:', limitError.message);
      return respond(503, { error: 'The order service is temporarily unavailable.' });
    }
    if (!withinLimit) {
      return respond(429, { error: 'Too many orders from this network. Please wait 15 minutes and try again.' });
    }

    const { data: menuRows, error: menuError } = await client
      .from('menu_items')
      .select('id, name, price, available')
      .in('id', [...quantities.keys()]);
    if (menuError) {
      console.error('Could not verify order menu items:', menuError.message);
      return respond(503, { error: 'Could not verify today’s menu. Please try again.' });
    }
    if (menuRows.length !== quantities.size || menuRows.some((item) => !item.available)) {
      return respond(409, { error: 'An item is no longer available. Refresh the menu and try again.' });
    }

    const menuById = new Map(menuRows.map((item) => [item.id, item]));
    const orderItems = [...quantities.entries()].map(([id, quantity]) => {
      const item = menuById.get(id)!;
      const unitPriceCents = Math.round(Number(item.price) * 100);
      return {
        id: item.id,
        name: item.name,
        quantity,
        unit_price: unitPriceCents / 100,
        line_total: (unitPriceCents * quantity) / 100,
      };
    });
    const subtotalCents = orderItems.reduce((sum, item) => sum + Math.round(item.line_total * 100), 0);
    const totalCents = subtotalCents + DELIVERY_FEE_CENTS;

    const { data: order, error: insertError } = await client
      .from('orders')
      .insert({
        customer_name: customerName,
        phone,
        address,
        items: orderItems,
        subtotal: subtotalCents / 100,
        delivery_fee: DELIVERY_FEE_CENTS / 100,
        total: totalCents / 100,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'cash_due' : 'pending',
      })
      .select('id, order_number, total, payment_method, payment_status, status, created_at')
      .single();
    if (insertError) {
      console.error('Could not save customer order:', insertError.message);
      return respond(500, { error: 'Could not save your order. Please try again.' });
    }

    let notificationSent = false;
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      const emailFrom = Deno.env.get('ORDER_EMAIL_FROM');
      if (resendApiKey && emailFrom) {
        const { data: adminRows, error: adminsError } = await client
          .from('menu_admins')
          .select('user_id');
        if (adminsError) {
          console.error('Could not find order-notification recipients:', adminsError.message);
        } else {
          const emails = new Set<string>();
          for (const admin of adminRows) {
            const { data: adminUser, error: userError } = await client.auth.admin.getUserById(admin.user_id);
            if (userError) {
              console.error('Could not load an admin email for order notification:', userError.message);
            } else if (adminUser.user.email) {
              emails.add(adminUser.user.email);
            }
          }

          if (emails.size > 0) {
            const itemsText = orderItems.map((item) =>
              `${item.quantity} x ${item.name} — ₹${item.line_total.toFixed(2)}`
            ).join('\n');
            const htmlItems = orderItems.map((item) =>
              `<li>${item.quantity} × ${escapeHtml(item.name)} — ₹${item.line_total.toFixed(2)}</li>`
            ).join('');
            const methodLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Google Pay UPI (pending confirmation)';
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: emailFrom,
                to: [...emails],
                subject: `New Parantha House order #${order.order_number}`,
                text: [
                  `New order #${order.order_number}`,
                  `Customer: ${customerName}`,
                  `Phone: ${phone}`,
                  `Address: ${address}`,
                  `Items:\n${itemsText}`,
                  `Total: ₹${Number(order.total).toFixed(2)}`,
                  `Payment: ${methodLabel}`,
                ].join('\n\n'),
                html: `<h2>New breakfast order #${order.order_number}</h2>
                  <p><strong>Customer:</strong> ${escapeHtml(customerName)}<br>
                  <strong>Phone:</strong> ${escapeHtml(phone)}<br>
                  <strong>Address:</strong> ${escapeHtml(address)}</p>
                  <h3>Items</h3><ul>${htmlItems}</ul>
                  <p><strong>Total:</strong> ₹${Number(order.total).toFixed(2)}<br>
                  <strong>Payment:</strong> ${methodLabel}</p>`,
              }),
            });
            if (emailResponse.ok) {
              notificationSent = true;
            } else {
              console.error('Order email could not be sent:', await emailResponse.text());
            }
          } else {
            console.error('No email address is attached to a menu administrator account.');
          }
        }
      } else {
        console.error('Order email is disabled: RESEND_API_KEY or ORDER_EMAIL_FROM is not set.');
      }
    } catch (emailError) {
      console.error('Order was saved, but the email notification failed:', emailError);
    }

    return respond(201, { order, notificationSent });
  } catch (error) {
    console.error('Unexpected order submission failure:', error);
    return respond(500, { error: 'An unexpected error occurred while placing the order.' });
  }
});

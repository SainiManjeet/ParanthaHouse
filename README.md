# Parantha House — Android & iOS

A React Native + Expo breakfast ordering app with a shared, Supabase-backed daily parantha menu and a separate web admin panel.

## Customer flow

- Browse available breakfast items without creating an account.
- Add paranthas to the cart and enter a name, Indian mobile number, and delivery address at checkout.
- Pay using Google Pay's UPI handoff. Payment remains pending merchant confirmation because a UPI app handoff does not verify payment in this app.

## Set up the shared menu and admin

1. Create a Supabase project.
2. In Supabase **SQL Editor**, run [`supabase/schema.sql`](./supabase/schema.sql). It creates the menu and admin tables, enables row-level security, and seeds Aloo, Paneer, Gobi, and Mooli paranthas.
3. In Supabase **Authentication → Users**, create an admin user with an email and password. Customer accounts are not required.
4. Copy that user's UUID and run this SQL, replacing the UUID with the admin user's actual ID:

   ```sql
   insert into public.menu_admins (user_id)
   values ('00000000-0000-0000-0000-000000000000');
   ```

5. Copy `.env.example` to `.env` and add the project's **Project URL** and **publishable/anon key** from Supabase project API settings. This workspace already has its local `.env` configured; `.env` is ignored by Git and must never be committed:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   ```

6. Restart Expo with `npm start`. Open the web admin panel at `http://localhost:8081/admin` and sign in with the invited admin user's email and password after accepting the Supabase invitation. The customer mobile app has no admin entry point.

The app only embeds the public Supabase key; row-level security in `schema.sql` allows public reads of available items and restricts every menu change to users in `menu_admins`. Never put a Supabase service-role key in the app.

From the web admin panel, you can add, edit, and remove paranthas, change prices, set today's special, and turn individual items on or off. Availability is shared with customers and should be updated by the admin each day; the app does not automatically reset availability on a schedule. Customer menus refresh when reopened and periodically while the app is running.

When deploying the web app, configure the host to rewrite `/admin` and `/admin/*` to the Expo web app's `index.html`; the admin panel is a web-only route in the same web deployment, not part of the iOS or Android customer navigation.

## Run the app

```bash
npm install
npm start
```

Scan the Expo QR code with Expo Go on Android or iOS. For simulators, run `npm run android` or `npm run ios` with the required native development tools installed.

## Google Pay setup and production requirements

Checkout currently routes UPI payment requests to `manjeetsaini297@okhdfcbank`. Verify that this is the correct merchant UPI ID. Android targets the Google Pay app; iOS uses the Google Pay UPI URL scheme. The customer must have Google Pay installed.

Orders are not persisted and payment is not verified by a backend. Before production, connect checkout to a trusted order/payment service that verifies payments server-side, saves orders, and confirms fulfilment. Do not rely on a customer tapping a button as proof of payment.

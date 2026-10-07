import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { supabase } from '../lib/supabase';

const DELIVERY_FEE = 25;
const MERCHANT_UPI_ID = 'manjeetsaini297@okhdfcbank';
const GOOGLE_PAY_PACKAGE = 'com.google.android.apps.nbu.paisa.user';

export default function CheckoutScreen({ navigation }) {
  const { items, totalPrice, clearCart, syncItems } = useCart();
  const { refreshMenu } = useMenu();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isOpeningPayment, setIsOpeningPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grandTotal = totalPrice + DELIVERY_FEE;
  const validPhone = /^[6-9]\d{9}$/.test(phone.trim());

  const submitOrder = async (method) => {
    if (!supabase) {
      Alert.alert('Ordering unavailable', 'The order service is not configured. Please try again later.');
      return;
    }

    setIsSubmitting(true);
    const { data, error: orderError } = await supabase.functions.invoke('create-order', {
      body: {
        customerName: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        paymentMethod: method,
        items: items.map((item) => ({ id: item.id, quantity: item.qty })),
      },
    });
    setIsSubmitting(false);
    if (orderError || data?.error) {
      Alert.alert('Could not place order', data?.error || orderError.message);
      return;
    }
    if (!data?.order) {
      Alert.alert('Could not place order', 'The order service returned an invalid response. Please try again.');
      return;
    }

    clearCart();
    navigation.replace('OrderConfirmation', {
      orderId: data.order.order_number,
      total: Number(data.order.total),
      customerName: name.trim(),
      paymentMethod: method,
      paymentStatus: method === 'cod' ? 'Cash due on delivery' : 'Pending merchant confirmation',
      notificationSent: data.notificationSent,
    });
  };

  const handlePlaceOrder = async () => {
    if (!name.trim() || !validPhone || !address.trim()) {
      Alert.alert(
        'Check your details',
        'Enter your name, a valid 10-digit Indian mobile number, and your delivery address.'
      );
      return;
    }
    if (items.length === 0) {
      Alert.alert('Your cart is empty', 'Add a parantha before placing your order.');
      navigation.navigate('Home');
      return;
    }

    const menuResult = await refreshMenu();
    if (menuResult.error) {
      Alert.alert('Menu unavailable', menuResult.error);
      return;
    }
    const currentItems = menuResult.data;
    const unavailable = items.filter((cartItem) =>
      !currentItems.some((menuItem) => menuItem.id === cartItem.id && menuItem.available)
    );
    if (unavailable.length > 0) {
      Alert.alert(
        'Item no longer available',
        `${unavailable.map((item) => item.name).join(', ')} is no longer available today. Update your cart before ordering.`
      );
      return;
    }
    const refreshedCart = items.map((cartItem) => {
      const menuItem = currentItems.find((entry) => entry.id === cartItem.id);
      return { ...menuItem, qty: cartItem.qty };
    });
    const updatedPrice = refreshedCart.some((item, index) => item.price !== items[index].price);
    if (updatedPrice) {
      syncItems(refreshedCart);
      Alert.alert('Menu prices changed', 'We updated your cart with today’s prices. Please review the total and tap pay again.');
      return;
    }
    const orderTotal = refreshedCart.reduce((sum, item) => sum + item.price * item.qty, 0) + DELIVERY_FEE;

    if (paymentMethod === 'cod') {
      await submitOrder(paymentMethod);
      return;
    }

    const paymentParams = new URLSearchParams({
      pa: MERCHANT_UPI_ID,
      pn: 'Parantha House',
      am: orderTotal.toFixed(2),
      cu: 'INR',
      tn: `Breakfast order ${Date.now()}`,
    }).toString();
    const paymentUrl = Platform.OS === 'android'
      ? `intent://pay?${paymentParams}#Intent;scheme=upi;package=${GOOGLE_PAY_PACKAGE};end`
      : `gpay://upi/pay?${paymentParams}`;

    setIsOpeningPayment(true);
    try {
      await Linking.openURL(paymentUrl);
      Alert.alert(
        'Google Pay opened',
        'Complete the payment in Google Pay, then return here. This app cannot verify UPI payments, so your order will show as pending until the merchant confirms it.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Submit order', onPress: () => submitOrder(paymentMethod) },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Could not open Google Pay',
        'Install or update Google Pay and try again. Your order has not been submitted.'
      );
    } finally {
      setIsOpeningPayment(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your details</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Almost there! Who should we deliver your breakfast to?</Text>

        <Text style={styles.sectionLabel}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your full name"
          placeholderTextColor="#A99B8F"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          textContentType="name"
          returnKeyType="next"
        />

        <Text style={styles.sectionLabel}>Phone number</Text>
        <TextInput
          style={styles.input}
          placeholder="10-digit mobile number"
          placeholderTextColor="#A99B8F"
          value={phone}
          onChangeText={(value) => setPhone(value.replace(/\D/g, '').slice(0, 10))}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          maxLength={10}
        />

        <Text style={styles.sectionLabel}>Delivery address</Text>
        <TextInput
          style={[styles.input, styles.addressInput]}
          placeholder="House number, street, area"
          placeholderTextColor="#A99B8F"
          value={address}
          onChangeText={setAddress}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.sectionLabel}>Payment</Text>
        <TouchableOpacity
          accessibilityRole="radio"
          accessibilityState={{ selected: paymentMethod === 'upi' }}
          style={[styles.paymentCard, paymentMethod === 'upi' && styles.paymentCardSelected]}
          onPress={() => setPaymentMethod('upi')}
        >
          <View style={styles.gpayIcon}><Text style={styles.gpayG}>G</Text></View>
          <View style={styles.paymentCopy}>
            <Text style={styles.paymentTitle}>Google Pay</Text>
            <Text style={styles.paymentSubtitle}>UPI · {MERCHANT_UPI_ID}</Text>
          </View>
          {paymentMethod === 'upi' && <View style={styles.selected}><Text style={styles.selectedMark}>✓</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="radio"
          accessibilityState={{ selected: paymentMethod === 'cod' }}
          style={[styles.paymentCard, paymentMethod === 'cod' && styles.paymentCardSelected]}
          onPress={() => setPaymentMethod('cod')}
        >
          <View style={styles.codIcon}><Text style={styles.codIconText}>₹</Text></View>
          <View style={styles.paymentCopy}>
            <Text style={styles.paymentTitle}>Cash on Delivery</Text>
            <Text style={styles.paymentSubtitle}>Pay when your breakfast arrives</Text>
          </View>
          {paymentMethod === 'cod' && <View style={styles.selected}><Text style={styles.selectedMark}>✓</Text></View>}
        </TouchableOpacity>
        <Text style={styles.paymentNote}>
          {paymentMethod === 'upi'
            ? 'Payment is confirmed by the merchant after you pay in Google Pay.'
            : 'Please pay the delivery person in cash when your order arrives.'}
        </Text>

        <Text style={styles.sectionLabel}>Order summary</Text>
        <View style={styles.summaryBox}>
          {items.map((item) => (
            <View key={item.id} style={styles.summaryRow}>
              <Text style={styles.summaryItemText}>{item.qty}× {item.name}</Text>
              <Text style={styles.summaryValue}>₹{item.price * item.qty}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{totalPrice}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>₹{DELIVERY_FEE}</Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="button"
          style={[(isOpeningPayment || isSubmitting) && styles.disabledButton, styles.placeOrderBtn]}
          onPress={handlePlaceOrder}
          disabled={isOpeningPayment || isSubmitting}
        >
          <Text style={styles.placeOrderBtnText}>
            {isSubmitting
              ? 'Submitting order…'
              : isOpeningPayment
              ? 'Opening Google Pay…'
              : paymentMethod === 'cod'
                ? `Place COD order · ₹${grandTotal}`
                : `Pay ₹${grandTotal} with Google Pay`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F1' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backText: { fontSize: 16, color: '#A94425', fontWeight: '700', width: 45 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#30241D' },
  content: { padding: 20, paddingBottom: 34 },
  intro: { color: '#77665A', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: '#30241D', marginTop: 17, marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#EFE5D9',
    color: '#30241D',
  },
  addressInput: { minHeight: 78 },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE5D9',
  },
  paymentCardSelected: { borderColor: '#D9A36B' },
  gpayIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F6F0E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gpayG: { fontSize: 22, fontWeight: '800', color: '#4285F4' },
  codIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F6F0E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  codIconText: { fontSize: 22, fontWeight: '800', color: '#A94425' },
  paymentCopy: { flex: 1 },
  paymentTitle: { fontSize: 14, fontWeight: '800', color: '#30241D' },
  paymentSubtitle: { fontSize: 11, color: '#8F8176', marginTop: 4 },
  selected: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#A94425', alignItems: 'center', justifyContent: 'center' },
  selectedMark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  paymentNote: { color: '#8F8176', fontSize: 11, lineHeight: 16, marginTop: 8 },
  summaryBox: { backgroundColor: '#fff', borderRadius: 14, padding: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  summaryItemText: { fontSize: 13, color: '#5E5148', flex: 1 },
  summaryLabel: { fontSize: 13, color: '#8F8176' },
  summaryValue: { fontSize: 13, color: '#30241D', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#EFE5D9', marginVertical: 5 },
  totalRow: { marginTop: 4, marginBottom: 0 },
  totalLabel: { fontSize: 15, color: '#30241D', fontWeight: '800' },
  totalValue: { fontSize: 16, color: '#A94425', fontWeight: '800' },
  footer: { padding: 18, borderTopWidth: 1, borderTopColor: '#EFE5D9', backgroundColor: '#fff' },
  placeOrderBtn: { backgroundColor: '#A94425', paddingVertical: 16, borderRadius: 15, alignItems: 'center' },
  disabledButton: { opacity: 0.65 },
  placeOrderBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

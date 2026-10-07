import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

const ORDER_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'On the way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatDate(value) {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function OrdersAdminScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const { data, error: queryError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (queryError) {
      setError(queryError.message);
    } else {
      setOrders(data);
      setError('');
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    let active = true;
    const checkAccess = async () => {
      if (!supabase) {
        navigation.replace('AdminLogin');
        return;
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        navigation.replace('AdminLogin');
        return;
      }
      const { data: isAdmin, error: accessError } = await supabase.rpc('is_menu_admin');
      if (accessError || !isAdmin) {
        await supabase.auth.signOut();
        navigation.replace('AdminLogin');
        return;
      }
      if (active) await loadOrders();
    };
    checkAccess();
    const timer = setInterval(() => {
      if (active) loadOrders();
    }, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [loadOrders, navigation]);

  const updateOrder = async (order, values) => {
    setUpdatingOrder(order.id);
    const { error: updateError } = await supabase
      .from('orders')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', order.id);
    setUpdatingOrder(null);
    if (updateError) {
      Alert.alert('Could not update order', updateError.message);
      return;
    }
    await loadOrders();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Menu</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Customer orders</Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            setRefreshing(true);
            loadOrders();
          }}
        >
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadOrders();
            }}
            tintColor="#A94425"
          />
        }
      >
        <Text style={styles.subtitle}>Newest orders first. This list refreshes automatically every 30 seconds.</Text>
        {loading && <ActivityIndicator color="#A94425" size="large" style={styles.loader} />}
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {!loading && !error && orders.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>Customer orders will appear here after they are placed.</Text>
          </View>
        )}
        {orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeading}>
              <View>
                <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
                <Text style={styles.date}>{formatDate(order.created_at)}</Text>
              </View>
              <Text style={styles.total}>₹{Number(order.total).toFixed(2)}</Text>
            </View>
            <Text style={styles.customer}>{order.customer_name}</Text>
            <Text style={styles.detail}>Phone: {order.phone}</Text>
            <Text style={styles.detail}>Address: {order.address}</Text>
            <View style={styles.itemList}>
              {order.items.map((item, index) => (
                <Text key={`${order.id}-${item.id}-${index}`} style={styles.detail}>
                  {item.quantity} × {item.name} — ₹{Number(item.line_total).toFixed(2)}
                </Text>
              ))}
            </View>
            <Text style={styles.detail}>
              Payment: {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Google Pay UPI'}
              {' · '}
              {order.payment_status === 'cash_due'
                ? 'Cash due on delivery'
                : order.payment_status === 'paid'
                  ? 'Paid'
                  : 'Pending merchant confirmation'}
            </Text>
            <Text style={styles.statusLabel}>Order status: {order.status.replaceAll('_', ' ')}</Text>
            <View style={styles.statusChoices}>
              {ORDER_STATUSES.filter((status) => status.value !== order.status).map((status) => (
                <TouchableOpacity
                  key={status.value}
                  accessibilityRole="button"
                  style={[styles.statusButton, updatingOrder === order.id && styles.disabledButton]}
                  disabled={updatingOrder === order.id}
                  onPress={() => updateOrder(order, { status: status.value })}
                >
                  <Text style={styles.statusButtonText}>{status.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {order.payment_method === 'upi' && order.payment_status !== 'paid' && (
              <TouchableOpacity
                accessibilityRole="button"
                style={[styles.paidButton, updatingOrder === order.id && styles.disabledButton]}
                disabled={updatingOrder === order.id}
                onPress={() => updateOrder(order, { payment_status: 'paid' })}
              >
                <Text style={styles.paidButtonText}>Mark UPI payment received</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F1' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE5D9',
  },
  backText: { color: '#A94425', fontSize: 14, fontWeight: '700' },
  title: { color: '#30241D', fontSize: 18, fontWeight: '800' },
  refreshText: { color: '#A94425', fontSize: 13, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 32 },
  subtitle: { color: '#8F8176', fontSize: 13, lineHeight: 19, marginBottom: 14 },
  loader: { marginTop: 30 },
  error: { color: '#B42318', paddingVertical: 16 },
  emptyCard: { padding: 24, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center' },
  emptyTitle: { color: '#30241D', fontSize: 17, fontWeight: '800' },
  emptyText: { color: '#8F8176', textAlign: 'center', lineHeight: 20, marginTop: 7 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 13 },
  orderHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  orderNumber: { color: '#30241D', fontSize: 17, fontWeight: '800' },
  date: { color: '#8F8176', fontSize: 11, marginTop: 4 },
  total: { color: '#A94425', fontSize: 17, fontWeight: '800' },
  customer: { color: '#30241D', fontSize: 15, fontWeight: '700', marginTop: 14 },
  detail: { color: '#5E5148', fontSize: 12, lineHeight: 18, marginTop: 4 },
  itemList: { borderTopWidth: 1, borderTopColor: '#EFE5D9', marginTop: 10, paddingTop: 7 },
  statusLabel: { color: '#30241D', fontSize: 12, fontWeight: '800', marginTop: 12, textTransform: 'capitalize' },
  statusChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  statusButton: { backgroundColor: '#F6E8D5', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  statusButtonText: { color: '#8D4B2D', fontSize: 11, fontWeight: '700' },
  paidButton: { backgroundColor: '#6A7D45', borderRadius: 9, padding: 11, alignItems: 'center', marginTop: 10 },
  paidButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  disabledButton: { opacity: 0.5 },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useCart } from '../context/CartContext';

export default function CartScreen({ navigation }) {
  const { items, updateQty, removeFromCart, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowEmoji}>{item.emoji}</Text>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowPrice}>₹{item.price}</Text>
            </View>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQty(item.id, item.qty - 1)}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQty(item.id, item.qty + 1)}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{totalPrice}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F3' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backText: { fontSize: 16, color: '#FF6B35', fontWeight: '600', width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  list: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  rowEmoji: { fontSize: 30, marginRight: 12 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700', color: '#222' },
  rowPrice: { fontSize: 13, color: '#888', marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1E9E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: '#222' },
  qtyValue: { fontSize: 15, fontWeight: '700', marginHorizontal: 10, minWidth: 16, textAlign: 'center' },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  totalLabel: { fontSize: 16, color: '#666', fontWeight: '600' },
  totalValue: { fontSize: 20, color: '#222', fontWeight: '800' },
  checkoutBtn: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#888', marginBottom: 20 },
  browseBtn: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: { color: '#fff', fontWeight: '700' },
});

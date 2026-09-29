import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useCart } from '../context/CartContext';

export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params;
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(item, qty);
    navigation.navigate('Cart');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>

      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.price}>₹{item.price}</Text>

        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Quantity</Text>
          <View style={styles.qtyControls}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{qty}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQty((q) => q + 1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addButtonText}>
          Add to Cart · ₹{item.price * qty}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F3' },
  backBtn: { paddingHorizontal: 20, paddingTop: 16 },
  backText: { fontSize: 16, color: '#FF6B35', fontWeight: '600' },
  emojiWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  emoji: { fontSize: 100 },
  content: { paddingHorizontal: 24, flex: 1 },
  name: { fontSize: 24, fontWeight: '800', color: '#222' },
  category: { fontSize: 13, color: '#FF6B35', fontWeight: '600', marginTop: 4 },
  description: { fontSize: 15, color: '#666', marginTop: 12, lineHeight: 22 },
  price: { fontSize: 22, fontWeight: '800', color: '#222', marginTop: 20 },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
  },
  qtyLabel: { fontSize: 16, fontWeight: '600', color: '#222' },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1E9E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 20, fontWeight: '700', color: '#222' },
  qtyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginHorizontal: 18,
    minWidth: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

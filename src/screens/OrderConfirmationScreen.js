import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

export default function OrderConfirmationScreen({ route, navigation }) {
  const { orderId, total, customerName, paymentStatus } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🫓</Text>
        <Text style={styles.title}>Order received, {customerName}!</Text>
        <Text style={styles.subtitle}>
          Your breakfast order #{orderId} is submitted. The merchant will confirm your Google Pay payment.
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Order ID</Text>
            <Text style={styles.rowValue}>#{orderId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Order total</Text>
            <Text style={styles.rowValue}>₹{total}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Payment status</Text>
            <Text style={styles.rowValue}>{paymentStatus}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.homeBtn}
        onPress={() => navigation.popToTop()}
      >
        <Text style={styles.homeBtnText}>Back to Menu</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F3', justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emoji: { fontSize: 70, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#222', textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rowLabel: { fontSize: 13, color: '#888' },
  rowValue: { fontSize: 13, color: '#222', fontWeight: '700' },
  homeBtn: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

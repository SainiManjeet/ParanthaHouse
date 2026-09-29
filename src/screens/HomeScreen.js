import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MENU } from '../data/menuData';
import { useCart } from '../context/CartContext';

export default function HomeScreen({ navigation }) {
  const { totalItems } = useCart();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={MENU}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>FRESH FROM THE TAWA</Text>
                <Text style={styles.title}>Good morning!</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Open cart, ${totalItems} items`}
                style={styles.cartButton}
                onPress={() => navigation.navigate('Cart')}
              >
                <Text style={styles.cartIcon}>🛒</Text>
                {totalItems > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalItems}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.hero}>
              <Text style={styles.heroEmoji}>🫓</Text>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>BREAKFAST, MADE DESI</Text>
                <Text style={styles.heroTitle}>Paranthas for a better morning</Text>
                <Text style={styles.heroSubtitle}>Hot, handmade & delivered to your door</Text>
              </View>
            </View>

            <View style={styles.menuHeading}>
              <View>
                <Text style={styles.menuTitle}>Today's breakfast</Text>
                <Text style={styles.menuSubtitle}>Made fresh every morning</Text>
              </View>
              <Text style={styles.menuEmoji}>☀️</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ItemDetail', { item })}
            activeOpacity={0.85}
          >
            <View style={styles.foodImage}>
              <Text style={styles.foodEmoji}>{item.emoji}</Text>
            </View>
            <View style={styles.cardInfo}>
              {item.badge ? <Text style={styles.specialBadge}>{item.badge}</Text> : null}
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.cardPrice}>₹{item.price}</Text>
            </View>
            <View style={styles.addIcon}>
              <Text style={styles.addIconText}>+</Text>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={<Text style={styles.footerNote}>That's the menu for today. See you tomorrow! 🌼</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F1' },
  list: { paddingHorizontal: 20, paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 18,
  },
  eyebrow: { color: '#B76633', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: 28, fontWeight: '800', color: '#30241D', marginTop: 4 },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#F6E8D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: { fontSize: 21 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#A94425',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4DFC3',
    borderRadius: 24,
    padding: 18,
    minHeight: 152,
  },
  heroEmoji: { fontSize: 62, marginRight: 14 },
  heroCopy: { flex: 1 },
  heroEyebrow: { color: '#8D4B2D', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: '#38251B', fontSize: 20, fontWeight: '800', marginTop: 6, lineHeight: 25 },
  heroSubtitle: { color: '#765D4C', fontSize: 12, marginTop: 6 },
  menuHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 14,
  },
  menuTitle: { fontSize: 21, fontWeight: '800', color: '#30241D' },
  menuSubtitle: { color: '#8F8176', fontSize: 13, marginTop: 3 },
  menuEmoji: { fontSize: 25 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#4D301C',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  foodImage: {
    width: 76,
    height: 82,
    borderRadius: 16,
    backgroundColor: '#FFF0DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  foodEmoji: { fontSize: 36 },
  cardInfo: { flex: 1 },
  specialBadge: { color: '#A94425', fontSize: 9, fontWeight: '800', letterSpacing: 0.7, marginBottom: 3 },
  cardName: { fontSize: 16, fontWeight: '800', color: '#30241D' },
  cardDesc: { fontSize: 11, color: '#8F8176', marginTop: 4, lineHeight: 16 },
  cardPrice: { fontSize: 15, fontWeight: '800', color: '#A94425', marginTop: 7 },
  addIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#A94425',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addIconText: { color: '#fff', fontSize: 22, lineHeight: 24, fontWeight: '500' },
  footerNote: { textAlign: 'center', color: '#9C8B7D', fontSize: 12, marginTop: 12, marginBottom: 8 },
});

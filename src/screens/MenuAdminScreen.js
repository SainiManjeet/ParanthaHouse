import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMenu } from '../context/MenuContext';
import { supabase } from '../lib/supabase';

const emptyDraft = () => ({
  name: '',
  description: '',
  price: '',
  emoji: '🫓',
  available: true,
  isSpecial: false,
  sortOrder: 0,
});

export default function MenuAdminScreen({ navigation }) {
  const { items, loading, error, refreshMenu, saveMenuItem, deleteMenuItem } = useMenu();
  const [draft, setDraft] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [saving, setSaving] = useState(false);

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
      const { data, error: accessError } = await supabase.rpc('is_menu_admin');
      if (accessError || !data) {
        await supabase.auth.signOut();
        navigation.replace('AdminLogin');
        return;
      }
      if (active) {
        setCheckingAccess(false);
        refreshMenu();
      }
    };

    checkAccess();
    return () => { active = false; };
  }, [navigation, refreshMenu]);

  const startEdit = (item) => {
    setDraft({
      ...item,
      price: String(item.price),
    });
  };

  const handleSave = async () => {
    const price = Number(draft?.price);
    if (!draft?.name.trim()) {
      Alert.alert('Name required', 'Enter the parantha name.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert('Check the price', 'Enter a price greater than ₹0.');
      return;
    }

    setSaving(true);
    const result = await saveMenuItem({ ...draft, price });
    setSaving(false);
    if (result.error) {
      Alert.alert('Could not save menu item', result.error);
      return;
    }
    setDraft(null);
  };

  const toggleAvailability = async (item) => {
    const result = await saveMenuItem({ ...item, available: !item.available });
    if (result.error) Alert.alert('Could not update availability', result.error);
  };

  const toggleSpecial = async (item) => {
    const result = await saveMenuItem({ ...item, isSpecial: !item.isSpecial });
    if (result.error) Alert.alert('Could not update today’s special', result.error);
  };

  const confirmDelete = (item) => {
    Alert.alert(
      'Remove parantha?',
      `${item.name} will be removed from the menu.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteMenuItem(item.id);
            if (result.error) Alert.alert('Could not remove item', result.error);
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      Alert.alert('Could not sign out', signOutError.message);
      return;
    }
    navigation.replace('Home');
  };

  if (checkingAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color="#A94425" size="large" />
          <Text style={styles.mutedText}>Checking admin access…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PARANTHA HOUSE</Text>
            <Text style={styles.title}>Daily menu admin</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Edit names and prices, mark items available, or choose today’s special.</Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.ordersButton}
          onPress={() => navigation.navigate('OrdersAdmin')}
        >
          <Text style={styles.addButtonText}>View customer orders</Text>
        </TouchableOpacity>

        {draft && (
          <View style={styles.formCard}>
            <View style={styles.formHeading}>
              <Text style={styles.formTitle}>{draft.id ? 'Edit parantha' : 'Add parantha'}</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => setDraft(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Parantha name"
              placeholderTextColor="#A99B8F"
              value={draft.name}
              onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor="#A99B8F"
              value={draft.description}
              onChangeText={(description) => setDraft((current) => ({ ...current, description }))}
              multiline
            />
            <View style={styles.inlineInputs}>
              <TextInput
                style={[styles.input, styles.priceInput]}
                placeholder="Price in ₹"
                placeholderTextColor="#A99B8F"
                value={draft.price}
                onChangeText={(price) => setDraft((current) => ({ ...current, price }))}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, styles.emojiInput]}
                placeholder="Emoji"
                placeholderTextColor="#A99B8F"
                value={draft.emoji}
                onChangeText={(emoji) => setDraft((current) => ({ ...current, emoji }))}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Available today</Text>
              <Switch value={draft.available} onValueChange={(available) => setDraft((current) => ({ ...current, available }))} trackColor={{ true: '#A94425' }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Today’s special</Text>
              <Switch value={draft.isSpecial} onValueChange={(isSpecial) => setDraft((current) => ({ ...current, isSpecial }))} trackColor={{ true: '#A94425' }} />
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.primaryButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryButtonText}>{draft.id ? 'Save changes' : 'Add to menu'}</Text>}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.addButton}
          onPress={() => setDraft(emptyDraft())}
        >
          <Text style={styles.addButtonText}>＋ Add a parantha</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator style={styles.loader} color="#A94425" />}
        {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}

        {items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemTopRow}>
              <Text style={styles.itemEmoji}>{item.emoji || '🫓'}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
              <TouchableOpacity accessibilityRole="button" onPress={() => startEdit(item)} style={styles.editButton}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>
            {!!item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
            {item.isSpecial && <Text style={styles.specialLabel}>TODAY’S SPECIAL</Text>}
            <View style={styles.itemControls}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{item.available ? 'Available today' : 'Unavailable'}</Text>
                <Switch value={item.available} onValueChange={() => toggleAvailability(item)} trackColor={{ true: '#A94425' }} />
              </View>
              <TouchableOpacity accessibilityRole="button" onPress={() => toggleSpecial(item)}>
                <Text style={styles.specialAction}>{item.isSpecial ? 'Remove special' : 'Make special'}</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" onPress={() => confirmDelete(item)}>
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F1' },
  content: { padding: 20, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mutedText: { color: '#8F8176', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  eyebrow: { color: '#B76633', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { fontSize: 24, fontWeight: '800', color: '#30241D', marginTop: 4 },
  subtitle: { color: '#8F8176', fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 18 },
  signOutButton: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#F6E8D5', borderRadius: 12 },
  signOutText: { color: '#8D4B2D', fontSize: 12, fontWeight: '800' },
  addButton: { paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#A94425', borderRadius: 14, alignItems: 'center', marginBottom: 14 },
  ordersButton: { paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#6A7D45', borderRadius: 14, alignItems: 'center', marginBottom: 14 },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  formCard: { backgroundColor: '#F4E8D9', borderRadius: 18, padding: 15, marginBottom: 14 },
  formHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  formTitle: { color: '#30241D', fontSize: 17, fontWeight: '800' },
  cancelText: { color: '#A94425', fontWeight: '700' },
  input: { backgroundColor: '#fff', borderRadius: 11, paddingHorizontal: 12, paddingVertical: 12, color: '#30241D', borderWidth: 1, borderColor: '#EFE5D9', marginBottom: 9 },
  inlineInputs: { flexDirection: 'row', gap: 9 },
  priceInput: { flex: 1 },
  emojiInput: { width: 82, textAlign: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42 },
  switchLabel: { color: '#5E5148', fontSize: 13, fontWeight: '600' },
  primaryButton: { backgroundColor: '#A94425', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  loader: { marginVertical: 16 },
  errorText: { color: '#B42318', fontSize: 12, marginVertical: 10 },
  itemCard: { backgroundColor: '#fff', borderRadius: 17, padding: 14, marginBottom: 11, borderWidth: 1, borderColor: '#F0E7DC' },
  itemTopRow: { flexDirection: 'row', alignItems: 'center' },
  itemEmoji: { fontSize: 31, marginRight: 11 },
  itemInfo: { flex: 1 },
  itemName: { color: '#30241D', fontSize: 15, fontWeight: '800' },
  itemPrice: { color: '#A94425', fontSize: 13, fontWeight: '700', marginTop: 3 },
  editButton: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F6E8D5' },
  editText: { color: '#8D4B2D', fontSize: 12, fontWeight: '800' },
  itemDescription: { color: '#8F8176', fontSize: 12, lineHeight: 17, marginTop: 9 },
  specialLabel: { color: '#A94425', fontSize: 10, fontWeight: '800', letterSpacing: 0.7, marginTop: 8 },
  itemControls: { borderTopWidth: 1, borderTopColor: '#F0E7DC', marginTop: 10, paddingTop: 7 },
  specialAction: { color: '#8D4B2D', fontSize: 12, fontWeight: '700', paddingVertical: 8 },
  deleteText: { color: '#B42318', fontSize: 12, fontWeight: '700', paddingVertical: 8 },
});

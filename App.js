import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CartProvider } from './src/context/CartContext';
import { MenuProvider } from './src/context/MenuContext';
import AppNavigator from './src/navigation/AppNavigator';
import AdminWebNavigator from './src/navigation/AdminWebNavigator';

export default function App() {
  const isAdminWebRoute = Platform.OS === 'web'
    && typeof window !== 'undefined'
    && window.location.pathname.replace(/\/+$/, '') === '/admin';

  if (isAdminWebRoute) {
    return (
      <MenuProvider>
        <StatusBar style="dark" />
        <AdminWebNavigator />
      </MenuProvider>
    );
  }

  return (
    <CartProvider>
      <MenuProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </MenuProvider>
    </CartProvider>
  );
}

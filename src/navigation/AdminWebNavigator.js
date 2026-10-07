import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import MenuAdminScreen from '../screens/MenuAdminScreen';
import OrdersAdminScreen from '../screens/OrdersAdminScreen';

const Stack = createNativeStackNavigator();

export default function AdminWebNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        <Stack.Screen name="MenuAdmin" component={MenuAdminScreen} />
        <Stack.Screen name="OrdersAdmin" component={OrdersAdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// /app/_layout.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { Pressable } from 'react-native';
import CustomDrawerContent from './_drawerContent';
import './globals.css';

export default function RootLayout() {
  return (
    <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen
        name="index"
        options={({ navigation }) => ({
          drawerLabel: 'Current Location',
          title: 'Current Weather',
          headerShown: true,
          headerLeft: () => (
            <Pressable onPress={() => navigation.toggleDrawer()} className="ml-4">
              <MaterialCommunityIcons name="menu" size={24} color="black" />
            </Pressable>
          ),
        })}
      />
      <Drawer.Screen
        name="manage-locations"
        options={({ navigation }) => ({ // Added ({ navigation }) wrapper
          drawerLabel: 'Manage Locations',
          title: 'Manage Locations',
          headerShown: true,
          // Added headerLeft for consistency
          headerLeft: () => (
            <Pressable onPress={() => navigation.toggleDrawer()} className="ml-4">
              <MaterialCommunityIcons name="menu" size={24} color="black" />
            </Pressable>
          ),
        })}
      />
    </Drawer>
  );
}
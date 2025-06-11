// /app/_drawerContent.tsx

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router'; // We don't need useNavigation anymore
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocations } from '../hooks/useLocations'; // Our custom hook

export default function CustomDrawerContent(props: any) {
  const { top, bottom } = useSafeAreaInsets();
  const { locations } = useLocations();

  const handleLocationPress = (location: { lat: number; lon: number }) => {
    // Close the drawer first using the navigation object from props
    props.navigation.closeDrawer();
    
    // Navigate to the index screen with lat/lon as parameters
    // Use a slight delay to allow the drawer to start closing before navigating
    setTimeout(() => {
        router.push({
          pathname: '/',
          params: { lat: location.lat, lon: location.lon },
        });
    }, 50);
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        {/* This renders the default drawer items we defined in _layout.tsx */}
        <DrawerItemList {...props} />

        {/* Divider */}
        <View className="h-px w-full bg-gray-200 my-2" />
        
        {/* Our custom list of saved locations */}
        <Text className="text-gray-500 font-bold p-4 pb-2">Saved Locations</Text>
        {locations.map((item) => (
          <Pressable 
            key={`${item.lat}-${item.lon}`} 
            className="flex-row items-center p-4"
            onPress={() => handleLocationPress(item)}
          >
            <MaterialCommunityIcons name="map-marker" size={22} color="gray" />
            <Text className="ml-4 text-base font-medium">{item.name}</Text>
          </Pressable>
        ))}
      </DrawerContentScrollView>
      
      {/* Optional: A footer for the drawer */}
      <View style={{ borderTopWidth: 1, borderTopColor: '#e0e0e0', padding: 20, paddingBottom: 20 + bottom }}>
        <Text className="text-center text-gray-500">Weather App</Text>
      </View>
    </View>
  );
}
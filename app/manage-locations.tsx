// /app/manage-locations.tsx

import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SavedLocation, useLocations } from '../hooks/useLocations'; // Import our new hook

const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const GEOCODING_ENDPOINT = (city: string) => `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${API_KEY}`;

type LocationSearchResult = SavedLocation; // The search result type is the same as our saved location type

export default function ManageLocations() {
  // Use our custom hook to get the list of saved locations and the functions to manage it
  const { locations, addLocation, removeLocation } = useLocations();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Debounced search effect (no changes here)
  useEffect(() => {
    if (searchQuery.trim().length < 3) { setSearchResults([]); setErrorMsg(null); setIsSearching(false); return; }
    setIsSearching(true); setErrorMsg(null);
    const searchTimer = setTimeout(async () => {
      try {
        const response = await fetch(GEOCODING_ENDPOINT(searchQuery));
        if (!response.ok) throw new Error("Failed to fetch data.");
        const data: LocationSearchResult[] = await response.json();
        setSearchResults(data);
        if (data.length === 0) setErrorMsg("No locations found for your query.");
      } catch (error) { console.error("Failed to fetch locations:", error); setErrorMsg("Could not fetch locations."); } 
      finally { setIsSearching(false); }
    }, 500);
    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  // The 'add' button in the search results will now call the function from our hook
  const handleAddLocation = (location: LocationSearchResult) => {
    addLocation(location);
    // Clear search to give user feedback that it was added
    setSearchQuery(''); 
  };
  
  return (
    <View className="flex-1 p-4">
      {/* Display Saved Locations List */}
      <View className="mb-6">
        <Text className="text-xl font-bold mb-2">Saved Locations</Text>
        {locations.length === 0 ? (
          <Text className="text-gray-500">You have no saved locations.</Text>
        ) : (
          <FlatList
            data={locations}
            keyExtractor={(item) => `${item.lat}-${item.lon}`}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between p-3 bg-gray-100 rounded-lg mb-2">
                <Text className="text-base">{item.name}, {item.country}</Text>
                <Pressable onPress={() => removeLocation(item)}>
                  <Text className="text-red-500 font-bold">Remove</Text>
                </Pressable>
              </View>
            )}
          />
        )}
      </View>

      <View className="border-t border-gray-200 pt-4">
        <Text className="text-xl font-bold mb-2">Add New Location</Text>
        <TextInput
          placeholder="Search for a city..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="border border-gray-300 rounded-lg p-3 text-lg mb-4"
        />

        {/* Search Results Display */}
        {isSearching && <ActivityIndicator size="large" color="#0000ff" />}
        {errorMsg && !isSearching && <Text className="text-center text-red-500 mt-4">{errorMsg}</Text>}
        {!isSearching && !errorMsg && (
          <FlatList
            data={searchResults}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <View className="flex-1 mr-2">
                  <Text className="text-lg font-bold">{item.name}</Text>
                  <Text className="text-gray-600" numberOfLines={1}>{item.state ? `${item.state}, ` : ''}{item.country}</Text>
                </View>
                <Pressable onPress={() => handleAddLocation(item)} className="bg-green-500 px-4 py-2 rounded-lg">
                  <Text className="text-white font-bold">Add</Text>
                </Pressable>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
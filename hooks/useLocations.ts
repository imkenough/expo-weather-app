// /hooks/useLocations.ts

import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

// This is the key we'll use to save the data in the device's store
const LOCATIONS_KEY = 'savedLocations';

// This is the data structure for a single saved location
export type SavedLocation = {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
};

// Our custom hook
export const useLocations = () => {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Load locations from the store when the hook is first used
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locationsJson = await SecureStore.getItemAsync(LOCATIONS_KEY);
        if (locationsJson) {
          setLocations(JSON.parse(locationsJson));
        }
      } catch (error) {
        console.error("Failed to load locations from store", error);
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, []);

  // Function to save the locations array to the store
  const saveLocationsToStore = async (newLocations: SavedLocation[]) => {
    try {
      await SecureStore.setItemAsync(LOCATIONS_KEY, JSON.stringify(newLocations));
    } catch (error) {
      console.error("Failed to save locations to store", error);
    }
  };

  // Function to add a new location
  const addLocation = (newLocation: SavedLocation) => {
    // Check if the location already exists to avoid duplicates
    if (locations.some(loc => loc.lat === newLocation.lat && loc.lon === newLocation.lon)) {
      console.log("Location already exists.");
      return; // Or show an alert to the user
    }

    const updatedLocations = [...locations, newLocation];
    setLocations(updatedLocations);
    saveLocationsToStore(updatedLocations);
  };

  // Function to remove a location
  const removeLocation = (locationToRemove: SavedLocation) => {
    const updatedLocations = locations.filter(
      loc => loc.lat !== locationToRemove.lat || loc.lon !== locationToRemove.lon
    );
    setLocations(updatedLocations);
    saveLocationsToStore(updatedLocations);
  };

  return { locations, addLocation, removeLocation, loading };
};
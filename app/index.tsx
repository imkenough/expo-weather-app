import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';

const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

const API_ENDPOINT = (lat: number, lon: number) => 
  `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

type WeatherData = {
  name: string; main: { temp: number; }; weather: { main: string; description: string; }[];
};

const weatherIcons: { [key: string]: keyof typeof MaterialCommunityIcons.glyphMap } = {
  Clear: 'weather-sunny', Clouds: 'weather-cloudy', Rain: 'weather-rainy', Drizzle: 'weather-partly-rainy', Thunderstorm: 'weather-lightning', Snow: 'weather-snowy', Mist: 'weather-fog', Smoke: 'weather-fog', Haze: 'weather-fog', Dust: 'weather-fog', Fog: 'weather-fog', Sand: 'weather-fog', Ash: 'weather-fog', Squall: 'weather-windy', Tornado: 'weather-tornado',
};

export default function Index() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- REFACTORED DATA FETCHING LOGIC ---
  const loadWeatherData = async () => {
    // Reset previous state
    setErrorMsg(null);

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return; // Exit if no permission
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      if (!API_KEY) {
        setErrorMsg('API key is missing. Please check your .env file.');
        return;
      }
      const url = API_ENDPOINT(location.coords.latitude, location.coords.longitude);
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Status: ${response.status}`);
      }
      const data: WeatherData = await response.json();
      setWeatherData(data);
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  // --- useEffect now just calls our main function ---
  useEffect(() => {
    setLoading(true);
    loadWeatherData().finally(() => setLoading(false));
  }, []);

  // --- NEW: Function to handle the refresh action ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // We add a small delay so the user can see the refresh indicator
    setTimeout(() => {
      loadWeatherData().finally(() => setRefreshing(false));
    }, 500);
  }, []); // useCallback ensures this function isn't recreated on every render

  // Loading state remains the same
  if (loading) {
    return <View className="flex-1 items-center justify-center bg-gray-900"><ActivityIndicator size="large" color="#ffffff" /><Text className="text-white mt-4 text-lg">Fetching weather...</Text></View>;
  }

  // We show an error, but now the user can pull to retry
  if (errorMsg && !weatherData) {
    return (
      <ScrollView
        contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
        className="bg-gray-900 p-4"
      >
        <Text className="text-red-400 text-center text-lg">{errorMsg}</Text>
        <Text className="text-gray-400 text-center text-base mt-2">Pull down to try again</Text>
      </ScrollView>
    );
  }

  const currentCondition = weatherData?.weather[0]?.main || 'Clear';
  const iconName = weatherIcons[currentCondition] || 'weather-sunny';

  return (
    // --- NEW: Our main view is now a ScrollView ---
    <ScrollView
      className="flex-1 bg-gray-900"
      contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />
      }
    >
      <MaterialCommunityIcons name={iconName} size={150} color="white" />
      <Text className="w-full text-white text-4xl font-extrabold mt-6 text-center">{weatherData?.name}</Text>
      <Text className="w-full text-gray-300 text-xl capitalize mt-2 text-center">{weatherData?.weather[0]?.description}</Text>
      <Text className="text-white text-8xl font-thin mt-8">{Math.round(weatherData?.main?.temp ?? 0)}°C</Text>
      {errorMsg && <Text className="text-red-400 text-center text-sm mt-4 absolute bottom-10">{errorMsg}</Text>}
    </ScrollView>
  );
}
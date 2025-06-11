import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';

const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

// --- API ENDPOINTS ---
const CURRENT_WEATHER_ENDPOINT = (lat: number, lon: number) => 
  `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
// NEW: Forecast endpoint
const FORECAST_ENDPOINT = (lat: number, lon: number) => 
  `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
// --------------------

// --- TYPESCRIPT TYPES ---
type WeatherData = { /* ... no changes ... */
  name: string; main: { temp: number; feels_like: number; humidity: number; }; weather: { main: string; description: string; }[]; wind: { speed: number; };
};
// NEW: Type for a single forecast item
type ForecastItemData = {
  dt: number;
  dt_txt: string;
  main: { temp: number };
  weather: { main: string }[];
};
// -----------------------

const weatherIcons: { [key: string]: keyof typeof MaterialCommunityIcons.glyphMap } = { /* ... no changes ... */
  Clear: 'weather-sunny', Clouds: 'weather-cloudy', Rain: 'weather-rainy', Drizzle: 'weather-partly-rainy', Thunderstorm: 'weather-lightning', Snow: 'weather-snowy', Mist: 'weather-fog', Smoke: 'weather-fog', Haze: 'weather-fog', Dust: 'weather-fog', Fog: 'weather-fog', Sand: 'weather-fog', Ash: 'weather-fog', Squall: 'weather-windy', Tornado: 'weather-tornado',
};

const DetailItem = ({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) => ( /* ... no changes ... */
  <View className="items-center"><MaterialCommunityIcons name={icon} size={24} color="white" /><Text className="text-white text-sm font-bold mt-1">{value}</Text><Text className="text-gray-400 text-xs">{label}</Text></View>
);

// --- NEW: A component to render a single forecast day item ---
const ForecastItem = ({ item }: { item: ForecastItemData }) => {
  const date = new Date(item.dt_txt);
  const day = date.toLocaleDateString('en-US', { weekday: 'short' });
  const iconName = weatherIcons[item.weather[0].main] || 'weather-sunny';

  return (
    <View className="items-center bg-gray-800/50 p-3 rounded-lg mr-3 w-24">
      <Text className="text-white font-bold">{day}</Text>
      <MaterialCommunityIcons name={iconName} size={40} color="white" style={{ marginVertical: 8 }}/>
      <Text className="text-white text-lg font-semibold">{Math.round(item.main.temp)}°</Text>
    </View>
  );
};
// -----------------------------------------------------------

export default function Index() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  // NEW: State for our forecast data list
  const [forecastData, setForecastData] = useState<ForecastItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- UPDATED: Data fetching logic now fetches BOTH current weather and forecast ---
  const loadWeatherData = async () => {
    setErrorMsg(null);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied'); return;
    }
    try {
      let location = await Location.getCurrentPositionAsync({});
      if (!API_KEY) {
        setErrorMsg('API key is missing. Please check your .env file.'); return;
      }

      // Use Promise.all to fetch both endpoints in parallel for better performance
      const [currentWeatherResponse, forecastResponse] = await Promise.all([
        fetch(CURRENT_WEATHER_ENDPOINT(location.coords.latitude, location.coords.longitude)),
        fetch(FORECAST_ENDPOINT(location.coords.latitude, location.coords.longitude)),
      ]);

      if (!currentWeatherResponse.ok || !forecastResponse.ok) {
        throw new Error('Failed to fetch weather data.');
      }

      const currentWeatherData: WeatherData = await currentWeatherResponse.json();
      const forecastResult = await forecastResponse.json();

      setWeatherData(currentWeatherData);

      // Process forecast data to get one entry per day (at noon)
      const dailyForecast = forecastResult.list.filter((item: ForecastItemData) => 
        item.dt_txt.endsWith("12:00:00")
      );
      setForecastData(dailyForecast);

    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  // useEffect and onRefresh remain the same, they just call the updated loadWeatherData
  useEffect(() => {
    setLoading(true);
    loadWeatherData().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(() => { /* ... no changes ... */
    setRefreshing(true);
    setTimeout(() => {
      loadWeatherData().finally(() => setRefreshing(false));
    }, 500);
  }, []);

  // Loading and Error UIs remain the same
  if (loading) { /* ... no changes here ... */ }
  if (errorMsg && !weatherData) { /* ... no changes here ... */ }

  const currentCondition = weatherData?.weather[0]?.main || 'Clear';
  const iconName = weatherIcons[currentCondition] || 'weather-sunny';

  return (
    // Note: We've changed the main container back to a simple ScrollView
    // because FlatList provides its own scrolling for the forecast.
    <ScrollView
      className="flex-1 bg-gray-900"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
    >
      <View className="items-center pt-16 pb-8">
        {/* Main Display */}
        <MaterialCommunityIcons name={iconName} size={150} color="white" />
        <Text className="w-full text-white text-4xl font-extrabold mt-6 text-center">{weatherData?.name}</Text>
        <Text className="w-full text-gray-300 text-xl capitalize mt-2 text-center">{weatherData?.weather[0]?.description}</Text>
        <Text className="text-white text-8xl font-thin mt-8">{Math.round(weatherData?.main?.temp ?? 0)}°C</Text>
        
        {/* Additional Details */}
        <View className="w-full px-4">
          <View className="flex-row w-full justify-around mt-8 bg-gray-800/50 p-4 rounded-lg">
            <DetailItem icon="thermometer-lines" label="Feels Like" value={`${Math.round(weatherData?.main?.feels_like ?? 0)}°`} />
            <DetailItem icon="water-percent" label="Humidity" value={`${weatherData?.main?.humidity}%`} />
            <DetailItem icon="weather-windy" label="Wind" value={`${(weatherData?.wind?.speed ?? 0).toFixed(1)} m/s`} />
          </View>
        </View>

        {/* --- NEW: 5-Day Forecast Section --- */}
        <View className="w-full mt-8">
          <Text className="text-white text-lg font-bold ml-4 mb-2">5-Day Forecast</Text>
          <FlatList
            data={forecastData}
            renderItem={({ item }) => <ForecastItem item={item} />}
            keyExtractor={(item) => item.dt.toString()}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>
        {/* --------------------------------- */}

        {errorMsg && weatherData && <Text className="text-red-400 text-center text-sm mt-4">{errorMsg}</Text>}
      </View>
    </ScrollView>
  );
}
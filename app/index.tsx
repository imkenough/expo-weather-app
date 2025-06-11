import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, RefreshControl, ScrollView, Text, View } from 'react-native';

const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const CURRENT_WEATHER_ENDPOINT = (lat: number, lon: number) => `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
const FORECAST_ENDPOINT = (lat: number, lon: number) => `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
type WeatherData = { name: string; main: { temp: number; feels_like: number; humidity: number; }; weather: { main: string; description: string; }[]; wind: { speed: number; }; };
type ForecastItemData = { dt: number; dt_txt: string; main: { temp: number }; weather: { main: string }[]; };
const weatherIcons: { [key: string]: keyof typeof MaterialCommunityIcons.glyphMap } = { Clear: 'weather-sunny', Clouds: 'weather-cloudy', Rain: 'weather-rainy', Drizzle: 'weather-partly-rainy', Thunderstorm: 'weather-lightning', Snow: 'weather-snowy', Mist: 'weather-fog', Smoke: 'weather-fog', Haze: 'weather-fog', Dust: 'weather-fog', Fog: 'weather-fog', Sand: 'weather-fog', Ash: 'weather-fog', Squall: 'weather-windy', Tornado: 'weather-tornado', };
const weatherBackgrounds = { Clear: require('../assets/backgrounds/sunny.jpg'), Clouds: require('../assets/backgrounds/cloudy.jpg'), Rain: require('../assets/backgrounds/rainy.jpg'), Drizzle: require('../assets/backgrounds/rainy.jpg'), Thunderstorm: require('../assets/backgrounds/rainy.jpg'), Snow: require('../assets/backgrounds/snowy.jpg'), Mist: require('../assets/backgrounds/foggy.jpg'), Smoke: require('../assets/backgrounds/foggy.jpg'), Haze: require('../assets/backgrounds/foggy.jpg'), Dust: require('../assets/backgrounds/foggy.jpg'), Fog: require('../assets/backgrounds/foggy.jpg'), Sand: require('../assets/backgrounds/foggy.jpg'), Ash: require('../assets/backgrounds/foggy.jpg'), Squall: require('../assets/backgrounds/cloudy.jpg'), Tornado: require('../assets/backgrounds/cloudy.jpg'), };
const DetailItem = ({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) => ( <View className="items-center"><MaterialCommunityIcons name={icon} size={24} color="white" /><Text className="text-white text-sm font-bold mt-1">{value}</Text><Text className="text-gray-400 text-xs">{label}</Text></View> );
const ForecastItem = ({ item }: { item: ForecastItemData }) => { const date = new Date(item.dt_txt); const day = date.toLocaleDateString('en-US', { weekday: 'short' }); const iconName = weatherIcons[item.weather[0].main] || 'weather-sunny'; return ( <View className="flex-1 items-center bg-gray-800/50 p-3 rounded-lg"><Text className="text-white font-bold">{day}</Text><MaterialCommunityIcons name={iconName} size={40} color="white" style={{ marginVertical: 8 }}/><Text className="text-white text-lg font-semibold">{Math.round(item.main.temp)}°</Text></View> ); };

export default function Index() {
  const params = useLocalSearchParams<{ lat?: string; lon?: string }>();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadWeatherData = async (latitude?: number, longitude?: number) => {
    setErrorMsg(null);
    let finalLat = latitude; let finalLon = longitude;
    if (!finalLat || !finalLon) {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setErrorMsg('Permission to access location was denied'); return; }
      let location = await Location.getCurrentPositionAsync({});
      finalLat = location.coords.latitude; finalLon = location.coords.longitude;
    }
    try {
      if (!API_KEY) { setErrorMsg('API key is missing.'); return; }
      const [currentWeatherResponse, forecastResponse] = await Promise.all([ fetch(CURRENT_WEATHER_ENDPOINT(finalLat, finalLon)), fetch(FORECAST_ENDPOINT(finalLat, finalLon)), ]);
      if (!currentWeatherResponse.ok || !forecastResponse.ok) throw new Error('Failed to fetch weather data.');
      const currentWeatherData: WeatherData = await currentWeatherResponse.json();
      const forecastResult = await forecastResponse.json();
      setWeatherData(currentWeatherData);
      const dailyForecast = forecastResult.list.filter((item: any) => item.dt_txt.endsWith("12:00:00"));
      setForecastData(dailyForecast);
    } catch (e: any) { setErrorMsg(e.message); }
  };

  useEffect(() => {
    setLoading(true);
    const lat = params.lat ? parseFloat(params.lat) : undefined;
    const lon = params.lon ? parseFloat(params.lon) : undefined;
    loadWeatherData(lat, lon).finally(() => setLoading(false));
  }, [params.lat, params.lon]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const lat = params.lat ? parseFloat(params.lat) : undefined;
    const lon = params.lon ? parseFloat(params.lon) : undefined;
    setTimeout(() => { loadWeatherData(lat, lon).finally(() => setRefreshing(false)); }, 500);
  }, [params.lat, params.lon]);

  if (loading) { return <View className="flex-1 items-center justify-center bg-black/50"><ActivityIndicator size="large" color="#ffffff" /></View>; }
  if (errorMsg && !weatherData) { return <View className="flex-1 items-center justify-center bg-gray-900 p-4"><Text className="text-red-400 text-center text-lg">{errorMsg}</Text></View>; }

  const currentCondition = weatherData?.weather[0]?.main || 'Clear';
  const iconName = weatherIcons[currentCondition] || 'weather-sunny';
  const backgroundImage = weatherBackgrounds[currentCondition] || weatherBackgrounds['Clear'];

  return (
    <ImageBackground source={backgroundImage} className="flex-1" resizeMode="cover" >
      <ScrollView className="flex-1 bg-black/30" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />} >
        <View className="items-center pt-8 pb-8">
          <MaterialCommunityIcons name={iconName} size={150} color="white" />
          <Text className="w-full text-white text-4xl font-extrabold mt-6 text-center">{weatherData?.name}</Text>
          <Text className="w-full text-gray-300 text-xl capitalize mt-2 text-center">{weatherData?.weather[0]?.description}</Text>
          <Text className="text-white text-8xl font-thin mt-8">{Math.round(weatherData?.main?.temp ?? 0)}°C</Text>
          <View className="w-full px-4">
            <View className="flex-row w-full justify-around mt-8 bg-gray-800/50 p-4 rounded-lg">
              <DetailItem icon="thermometer-lines" label="Feels Like" value={`${Math.round(weatherData?.main?.feels_like ?? 0)}°`} />
              <DetailItem icon="water-percent" label="Humidity" value={`${weatherData?.main?.humidity}%`} />
              <DetailItem icon="weather-windy" label="Wind" value={`${(weatherData?.wind?.speed ?? 0).toFixed(1)} m/s`} />
            </View>
          </View>
          <View className="w-full mt-8 px-4">
            <Text className="text-white text-lg font-bold mb-2">5-Day Forecast</Text>
            <View className="flex-row gap-2">
              {forecastData.map((item) => ( <ForecastItem key={item.dt} item={item} /> ))}
            </View>
          </View>
          {errorMsg && weatherData && <Text className="text-red-400 text-center text-sm mt-4">{errorMsg}</Text>}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}
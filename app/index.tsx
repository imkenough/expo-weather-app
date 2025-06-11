import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

const API_ENDPOINT = (lat: number, lon: number) => 
  `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

type WeatherData = {
  name: string;
  main: {
    temp: number;
  };
  weather: {
    main: string;
    description: string;
  }[];
};

const weatherIcons: { [key: string]: keyof typeof MaterialCommunityIcons.glyphMap } = {
  Clear: 'weather-sunny',
  Clouds: 'weather-cloudy',
  Rain: 'weather-rainy',
  Drizzle: 'weather-partly-rainy',
  Thunderstorm: 'weather-lightning',
  Snow: 'weather-snowy',
  Mist: 'weather-fog',
  Smoke: 'weather-fog',
  Haze: 'weather-fog',
  Dust: 'weather-fog',
  Fog: 'weather-fog',
  Sand: 'weather-fog',
  Ash: 'weather-fog',
  Squall: 'weather-windy',
  Tornado: 'weather-tornado',
};

export default function Index() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      if (!API_KEY) {
        setErrorMsg('API key is missing. Please check your .env file.');
        setLoading(false);
        return;
      }
      try {
        const url = API_ENDPOINT(location.coords.latitude, location.coords.longitude);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Weather data not found. Status: ${response.status}`);
        }
        const data: WeatherData = await response.json();
        setWeatherData(data);
      } catch (e: any) {
        setErrorMsg(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-gray-900"><ActivityIndicator size="large" color="#ffffff" /><Text className="text-white mt-4 text-lg">Fetching weather...</Text></View>;
  }
  if (errorMsg) {
    return <View className="flex-1 items-center justify-center bg-gray-900 p-4"><Text className="text-red-400 text-center text-lg">{errorMsg}</Text></View>;
  }
  if (!weatherData) {
    return <View className="flex-1 items-center justify-center bg-gray-900 p-4"><Text className="text-white text-center text-lg">No weather data available.</Text></View>;
  }

  const currentCondition = weatherData.weather[0].main;
  const iconName = weatherIcons[currentCondition] || 'weather-sunny';

  return (
    <View className="flex-1 items-center justify-center bg-gray-900 py-8 px-4">
      <MaterialCommunityIcons name={iconName} size={150} color="white" />
      
      {/* --- THE CHANGE IS HERE: Added w-full --- */}
      <Text className="w-full text-white text-4xl font-extrabold mt-6 text-center">{weatherData.name}</Text>
      
      {/* --- AND HERE: Added w-full for consistency --- */}
      <Text className="w-full text-gray-300 text-xl capitalize mt-2 text-center">{weatherData.weather[0].description}</Text>
      
      <Text className="text-white text-8xl font-thin mt-8">{Math.round(weatherData.main.temp)}°C</Text>
    </View>
  );
}
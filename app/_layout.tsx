import { Stack } from "expo-router";
import './globals.css';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          // Hide the header for this screen
          headerShown: false,
        }}
      />
    </Stack>
  );
}
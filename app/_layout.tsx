// Import Stack navigator from expo-router for screen navigation
import { Stack } from 'expo-router';
// Import StatusBar component to control the status bar appearance
import { StatusBar } from 'expo-status-bar';

// Main layout component that wraps all screens in the app
export default function RootLayout() {
  return (
    <>
      {/* Stack navigator component that manages screen navigation */}
      <Stack>
        {/* Configure the home screen (index.tsx) */}
        <Stack.Screen 
          name="index"  // This matches the filename index.tsx
          options={{ 
            title: 'Smashly',  // Text shown in the header
            headerStyle: { backgroundColor: '#16a34a' },  // Green background color for header
            headerTintColor: 'white'  // White color for header text and icons
          }} 
        />
        {/* Configure the login screen (login.tsx) */}
        <Stack.Screen 
          name="login"  // This matches the filename login.tsx
          options={{ 
            title: 'Iniciar Sesión',  // Spanish text for "Login" in header
            headerStyle: { backgroundColor: '#16a34a' },  // Same green header
            headerTintColor: 'white'  // White header text
          }} 
        />
        {/* Configure the register screen (register.tsx) */}
        <Stack.Screen 
          name="register"  // This matches the filename register.tsx
          options={{ 
            title: 'Registro',  // Spanish text for "Register" in header
            headerStyle: { backgroundColor: '#16a34a' },  // Same green header
            headerTintColor: 'white'  // White header text
          }} 
        />
      </Stack>
      {/* Status bar configuration - "light" means white icons on dark background */}
      <StatusBar style="light" />
    </>
  );
}
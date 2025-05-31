// Import router for navigation between screens
import { router } from 'expo-router';
// Import React and useState hook for component state management
import React, { useState } from 'react';
// Import React Native components for UI and alerts
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
// Import custom Button component
import { Button } from '../src/components/ui/button';
// Import custom Input component for text fields
import { Input } from '../src/components/ui/input';
// Import global styles shared across the app
import { globalStyles } from '../src/styles/global-styles';

// Login screen component for user authentication
export default function LoginScreen() {
  // State variable for email input - starts as empty string
  const [email, setEmail] = useState('');
  // State variable for password input - starts as empty string
  const [password, setPassword] = useState('');
  // State variable to track loading state during form submission
  const [isLoading, setIsLoading] = useState(false);
  
  // Function that handles form submission when login button is pressed
  const handleSubmit = async () => {
    // Check if email or password fields are empty
    if (!email || !password) {
      // Show error alert if fields are missing
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;  // Exit function early
    }

    // Set loading state to true to show loading indicator
    setIsLoading(true);
    
    // Simulate API call with setTimeout (replace with real API call)
    setTimeout(() => {
      // Set loading back to false after "API call" completes
      setIsLoading(false);
      // Show success alert to user
      Alert.alert('Éxito', '¡Inicio de sesión exitoso!');
    }, 2000);  // Wait 2 seconds to simulate network delay
  };

  return (
    // ScrollView allows content to scroll if keyboard appears or content is long
    <ScrollView style={[globalStyles.container, styles.container]}>
      {/* Main content container */}
      <View style={styles.content}>
        {/* Login screen title */}
        <Text style={styles.title}>Iniciar Sesión</Text>
        {/* Welcome back subtitle */}
        <Text style={styles.subtitle}>Bienvenido de vuelta</Text>
        
        {/* Form container holding all input fields and buttons */}
        <View style={styles.form}>
          {/* Email input field */}
          <Input
            label="Email"  // Label shown above input
            placeholder="tu@email.com"  // Placeholder text shown in input
            value={email}  // Current value of input (controlled component)
            onChangeText={setEmail}  // Function called when text changes
          />
          
          {/* Password input field */}
          <Input
            label="Contraseña"  // "Password" label in Spanish
            placeholder="Tu contraseña"  // "Your password" placeholder
            value={password}  // Current password value
            onChangeText={setPassword}  // Function to update password state
            secureTextEntry  // Hide password text for security
          />
          
          {/* Login submit button */}
          <Button
            title="Iniciar Sesión"  // "Login" button text in Spanish
            onPress={handleSubmit}  // Function called when button pressed
            loading={isLoading}  // Show loading indicator when true
          />
          
          {/* Navigation button to register screen */}
          <Button
            title="¿No tienes cuenta? Registrarse"  // "Don't have account? Register"
            onPress={() => router.push('/register')}  // Navigate to register screen
            variant="outline"  // Outlined button style instead of filled
          />
        </View>
      </View>
    </ScrollView>
  );
}

// StyleSheet for component-specific styles
const styles = StyleSheet.create({
  // Container style for entire screen
  container: {
    flex: 1,  // Take up all available space
  },
  // Style for main content area
  content: {
    flex: 1,  // Take up all available space
    padding: 20,  // 20px padding on all sides
    justifyContent: 'center',  // Center content vertically
  },
  // Style for main title
  title: {
    fontSize: 32,  // Large font size
    fontWeight: 'bold',  // Bold font weight
    textAlign: 'center',  // Center align text
    marginBottom: 8,  // 8px margin below title
    color: '#16a34a',  // Green color matching app theme
  },
  // Style for subtitle
  subtitle: {
    fontSize: 16,  // Medium font size
    textAlign: 'center',  // Center align text
    color: '#666',  // Gray color for secondary text
    marginBottom: 40,  // 40px margin below subtitle
  },
  // Style for form container
  form: {
    gap: 16,  // 16px space between form elements
  },
});
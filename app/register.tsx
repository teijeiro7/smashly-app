// Import router for navigation between screens
import { router } from 'expo-router';
// Import React and useState hook for state management
import React, { useState } from 'react';
// Import React Native components for UI and alerts
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
// Import custom Button component
import { Button } from '../src/components/ui/button';
// Import custom Input component
import { Input } from '../src/components/ui/input';
// Import global styles
import { globalStyles } from '../src/styles/global-styles';

// Registration screen component for new user signup
export default function RegisterScreen() {
  // State to track which step of registration user is on (1 or 2)
  const [step, setStep] = useState(1);
  // State object to hold all form data
  const [formData, setFormData] = useState({
    name: '',  // User's full name
    email: '',  // User's email address
    password: '',  // User's chosen password
    confirmPassword: '',  // Password confirmation for validation
  });
  // State to track loading during form submission
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle "Next" button or final submission
  const handleNext = () => {
    // If on step 1, validate and move to step 2
    if (step === 1) {
      // Check if name or email are empty
      if (!formData.name || !formData.email) {
        // Show error alert if required fields are missing
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;  // Exit function early
      }
      // Move to step 2 of registration
      setStep(2);
    } else {
      // If on step 2, call submit function
      handleSubmit();
    }
  };

  // Function to handle final form submission
  const handleSubmit = async () => {
    // Check if password fields are empty
    if (!formData.password || !formData.confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    // Set loading state to true
    setIsLoading(true);
    
    // Simulate API call (replace with real registration API)
    setTimeout(() => {
      // Reset loading state
      setIsLoading(false);
      // Show success alert and navigate to login on OK
      Alert.alert('Éxito', '¡Registro exitoso!', [
        { text: 'OK', onPress: () => router.push('/login') }
      ]);
    }, 2000);  // 2 second delay to simulate network request
  };

  // Helper function to update specific field in formData object
  const updateFormData = (field: string, value: string) => {
    // Use functional update to modify specific field while keeping others unchanged
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    // ScrollView for scrollable content
    <ScrollView style={[globalStyles.container, styles.container]}>
      {/* Main content container */}
      <View style={styles.content}>
        {/* Registration title */}
        <Text style={styles.title}>Registro</Text>
        {/* Step indicator showing current progress */}
        <Text style={styles.subtitle}>Paso {step} de 2</Text>
        
        {/* Form container */}
        <View style={styles.form}>
          {/* Conditional rendering based on current step */}
          {step === 1 ? (
            // Step 1: Name and Email inputs
            <>
              {/* Name input field */}
              <Input
                label="Nombre completo"  // "Full name" in Spanish
                placeholder="Tu nombre"  // "Your name" placeholder
                value={formData.name}  // Current name value from state
                onChangeText={(value) => updateFormData('name', value)}  // Update name in state
              />
              
              {/* Email input field */}
              <Input
                label="Email"  // Email label
                placeholder="tu@email.com"  // Email placeholder
                value={formData.email}  // Current email value from state
                onChangeText={(value) => updateFormData('email', value)}  // Update email in state
              />
            </>
          ) : (
            // Step 2: Password inputs
            <>
              {/* Password input field */}
              <Input
                label="Contraseña"  // "Password" in Spanish
                placeholder="Tu contraseña"  // "Your password" placeholder
                value={formData.password}  // Current password value
                onChangeText={(value) => updateFormData('password', value)}  // Update password
                secureTextEntry  // Hide password text
              />
              
              {/* Confirm password input field */}
              <Input
                label="Confirmar contraseña"  // "Confirm password" in Spanish
                placeholder="Confirma tu contraseña"  // "Confirm your password" placeholder
                value={formData.confirmPassword}  // Current confirm password value
                onChangeText={(value) => updateFormData('confirmPassword', value)}  // Update confirm password
                secureTextEntry  // Hide password text
              />
            </>
          )}
          
          {/* Main action button - text changes based on step */}
          <Button
            title={step === 1 ? "Siguiente" : "Registrarse"}  // "Next" or "Register"
            onPress={handleNext}  // Call handleNext function
            loading={isLoading}  // Show loading indicator when submitting
          />
          
          {/* Back button - only shown on step 2 */}
          {step === 2 && (
            <Button
              title="Atrás"  // "Back" in Spanish
              onPress={() => setStep(1)}  // Go back to step 1
              variant="outline"  // Outlined button style
            />
          )}
          
          {/* Navigation to login screen */}
          <Button
            title="¿Ya tienes cuenta? Iniciar sesión"  // "Already have account? Login"
            onPress={() => router.push('/login')}  // Navigate to login screen
            variant="outline"  // Outlined button style
          />
        </View>
      </View>
    </ScrollView>
  );
}

// Component-specific styles
const styles = StyleSheet.create({
  // Container for entire screen
  container: {
    flex: 1,  // Take full height
  },
  // Main content area style
  content: {
    flex: 1,  // Take full height
    padding: 20,  // 20px padding on all sides
    justifyContent: 'center',  // Center content vertically
  },
  // Title style
  title: {
    fontSize: 32,  // Large font size
    fontWeight: 'bold',  // Bold text
    textAlign: 'center',  // Center align
    marginBottom: 8,  // 8px bottom margin
    color: '#16a34a',  // Green theme color
  },
  // Subtitle style for step indicator
  subtitle: {
    fontSize: 16,  // Medium font size
    textAlign: 'center',  // Center align
    color: '#666',  // Gray color
    marginBottom: 40,  // 40px bottom margin
  },
  // Form container style
  form: {
    gap: 16,  // 16px space between form elements
  },
});
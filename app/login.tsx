// Import router for navigation between screens
import { router } from "expo-router";
// Import React and useState hook for component state management
import React, { useState } from "react";
// Import React Native components for UI and alerts
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
// Import Ionicons for modern icons
import { Ionicons } from "@expo/vector-icons";
// Import custom Button component
import { Button } from "../src/components/ui/button";
// Import custom Input component for text fields
import { Input } from "../src/components/ui/input";

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Login screen component for user authentication with compact modern design
export default function LoginScreen() {
  // State variable for email input - starts as empty string
  const [email, setEmail] = useState("");
  // State variable for password input - starts as empty string
  const [password, setPassword] = useState("");
  // State variable to track loading state during form submission
  const [isLoading, setIsLoading] = useState(false);

  // Function that handles form submission when login button is pressed
  const handleSubmit = async () => {
    // Check if email or password fields are empty
    if (!email || !password) {
      // Show error alert if fields are missing
      Alert.alert("Error", "Por favor completa todos los campos");
      return; // Exit function early
    }

    // Set loading state to true to show loading indicator
    setIsLoading(true);

    // Simulate API call with setTimeout (replace with real API call)
    setTimeout(() => {
      // Set loading back to false after "API call" completes
      setIsLoading(false);
      // Show success alert to user
      Alert.alert("Éxito", "¡Inicio de sesión exitoso!");
    }, 2000); // Wait 2 seconds to simulate network delay
  };

  return (
    // KeyboardAvoidingView prevents keyboard from covering content on iOS
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ScrollView allows content to scroll if keyboard appears */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false} // Hide scroll indicator for cleaner look
        keyboardShouldPersistTaps="handled" // Better keyboard interaction
      >
        {/* Main content card container with compact modern styling */}
        <View style={styles.loginCard}>
          {/* Compact header section with icon and welcome text */}
          <View style={styles.header}>
            {/* Smaller, more elegant icon container */}
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={24} color="#16a34a" />
            </View>

            {/* Compact welcome title */}
            <Text style={styles.title}>Iniciar Sesión</Text>
            {/* Smaller subtitle */}
            <Text style={styles.subtitle}>Bienvenido de vuelta</Text>
          </View>

          {/* Compact form container */}
          <View style={styles.form}>
            {/* Email input field with tighter spacing */}
            <Input
              label="Email" // Shorter label
              placeholder="tu@email.com" // Placeholder text shown in input
              value={email} // Current value of input (controlled component)
              onChangeText={setEmail} // Function called when text changes
            />

            {/* Password input field with tighter spacing */}
            <Input
              label="Contraseña" // "Password" label in Spanish
              placeholder="Tu contraseña" // "Your password" placeholder
              value={password} // Current password value
              onChangeText={setPassword} // Function to update password state
              secureTextEntry // Hide password text for security
            />

            {/* Compact login submit button */}
            <Button
              title="Iniciar Sesión" // "Login" button text in Spanish
              onPress={handleSubmit} // Function called when button pressed
              loading={isLoading} // Show loading indicator when true
            />

            {/* Smaller divider line with "or" text */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Compact navigation button to register screen */}
            <Button
              title="Crear cuenta" // Shorter text "Create account"
              onPress={() => router.push("/register")} // Navigate to register screen
              variant="outline" // Outlined button style instead of filled
            />
          </View>

          {/* Compact footer section */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ¿Olvidaste tu contraseña?{" "}
              <Text style={styles.linkText}>Recuperar</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Compact and modern StyleSheet for clean contemporary design
const styles = StyleSheet.create({
  // Main container for entire screen with better background
  container: {
    flex: 1, // Take up all available space
    backgroundColor: "#f8fafc", // Very light gray background
  },

  // ScrollView content container with better centering
  scrollContainer: {
    flexGrow: 1, // Allow content to grow
    justifyContent: "center", // Center content vertically
    paddingHorizontal: 24, // Horizontal padding for side margins
    paddingVertical: 40, // Moderate vertical padding
  },

  // Compact login card with optimal sizing
  loginCard: {
    backgroundColor: "white", // Clean white background
    borderRadius: 16, // Slightly smaller border radius
    paddingHorizontal: 24, // Reduced horizontal padding
    paddingVertical: 28, // Reduced vertical padding
    maxWidth: 380, // Maximum width for better proportion
    width: "100%", // Full width up to maxWidth
    alignSelf: "center", // Center the card horizontally
    // Refined shadow for iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3, // Slightly smaller shadow offset
    },
    shadowOpacity: 0.08, // Lighter shadow opacity
    shadowRadius: 10, // Refined shadow blur
    // Android shadow
    elevation: 6, // Reduced elevation for subtlety
  },

  // Compact header section
  header: {
    alignItems: "center", // Center align all header content
    marginBottom: 24, // Reduced margin below header
  },

  // Smaller icon container
  iconContainer: {
    width: 60, // Smaller width for compact design
    height: 60, // Smaller height for compact design
    borderRadius: 30, // Half of width/height for perfect circle
    backgroundColor: "#f0f9ff", // Light blue background
    justifyContent: "center", // Center icon vertically
    alignItems: "center", // Center icon horizontally
    marginBottom: 16, // Reduced margin below icon
    // Subtle refined shadow
    shadowColor: "#16a34a",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  // Compact title styling
  title: {
    fontSize: 24, // Reduced font size for compact design
    fontWeight: "700", // Bold font weight
    textAlign: "center", // Center align text
    marginBottom: 6, // Smaller margin below title
    color: "#1f2937", // Dark gray color for better readability
    letterSpacing: -0.3, // Tighter letter spacing
  },

  // Compact subtitle styling
  subtitle: {
    fontSize: 14, // Smaller font size
    textAlign: "center", // Center align text
    color: "#6b7280", // Medium gray color for secondary text
    lineHeight: 20, // Improved line height for readability
  },

  // Compact form container
  form: {
    gap: 16, // Reduced gap between form elements for tighter layout
  },

  // Refined divider section
  divider: {
    flexDirection: "row", // Arrange items horizontally
    alignItems: "center", // Center align vertically
    marginVertical: 16, // Reduced vertical margin around divider
  },

  // Divider line styling
  dividerLine: {
    flex: 1, // Take up available space
    height: 1, // Thin line
    backgroundColor: "#e5e7eb", // Light gray color
  },

  // Compact divider text
  dividerText: {
    marginHorizontal: 12, // Reduced horizontal margin around text
    fontSize: 13, // Smaller font size
    color: "#9ca3af", // Light gray color
    fontWeight: "500", // Medium font weight
  },

  // Compact footer section
  footer: {
    marginTop: 20, // Reduced top margin for separation
    alignItems: "center", // Center align content
  },

  // Compact footer text
  footerText: {
    fontSize: 13, // Smaller font size
    color: "#6b7280", // Medium gray color
    textAlign: "center", // Center align text
  },

  // Link text styling for interactive elements
  linkText: {
    color: "#16a34a", // Green color matching app theme
    fontWeight: "600", // Semi-bold font weight
    textDecorationLine: "underline", // Underline for link indication
  },
});

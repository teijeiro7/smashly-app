// Import Ionicons for vector icons from Expo
import { Ionicons } from '@expo/vector-icons';
// Import router for navigation between screens
import { router } from 'expo-router';
// Import React library for creating components
import React from 'react';
// Import React Native components for UI
import { ScrollView, StyleSheet, Text, View } from 'react-native';
// Import custom FeatureCard component from src folder
import FeatureCard from '../src/components/feature/feature-card';
// Import custom Button component from src folder
import { Button } from '../src/components/ui/button';
// Import global styles that are shared across the app
import { globalStyles } from '../src/styles/global-styles';

// Main home screen component that users see first
export default function HomeScreen() {
  // Array of objects containing data for feature cards
  const features = [
    {
      // Ionicons component with people icon, size 40px, green color
      icon: <Ionicons name="people" size={40} color="#16a34a" />,
      title: "Conecta",  // Spanish for "Connect"
      description: "Conoce personas con intereses similares"  // "Meet people with similar interests"
    },
    {
      // Location icon for discovery feature
      icon: <Ionicons name="location" size={40} color="#16a34a" />,
      title: "Descubre",  // Spanish for "Discover"
      description: "Encuentra eventos cerca de ti"  // "Find events near you"
    },
    {
      // Star icon for enjoyment feature
      icon: <Ionicons name="star" size={40} color="#16a34a" />,
      title: "Disfruta",  // Spanish for "Enjoy"
      description: "Vive experiencias únicas"  // "Live unique experiences"
    }
  ];

  return (
    // ScrollView allows content to scroll if it exceeds screen height
    <ScrollView style={globalStyles.container}>
      {/* Hero section - main promotional area at top */}
      <View style={styles.heroSection}>
        {/* Main title of the app */}
        <Text style={styles.heroTitle}>Bienvenido a Smashly</Text>
        {/* Subtitle describing the app */}
        <Text style={styles.heroSubtitle}>
          Tu plataforma para conectar y descubrir
        </Text>
        {/* Container for action buttons */}
        <View style={styles.heroButtons}>
          {/* Login button - navigates to login screen when pressed */}
          <Button
            title="Iniciar Sesión"  // "Login" in Spanish
            onPress={() => router.push('/login')}  // Navigate to login screen
          />
          {/* Register button with outline variant - navigates to register screen */}
          <Button
            title="Registrarse"  // "Register" in Spanish
            onPress={() => router.push('/register')}  // Navigate to register screen
            variant="outline"  // Different visual style (outlined instead of filled)
          />
        </View>
      </View>
      
      {/* Features section showing app capabilities */}
      <View style={styles.featuresSection}>
        {/* Section title */}
        <Text style={styles.sectionTitle}>Características</Text>
        {/* Map through features array to create FeatureCard components */}
        {features.map((feature, index) => (
          <FeatureCard
            key={index}  // Unique key for React list rendering
            icon={feature.icon}  // Pass icon component
            title={feature.title}  // Pass feature title
            description={feature.description}  // Pass feature description
          />
        ))}
      </View>
    </ScrollView>
  );
}

// StyleSheet object containing component-specific styles
const styles = StyleSheet.create({
  // Style for the hero section at top of screen
  heroSection: {
    padding: 40,  // 40px padding on all sides
    alignItems: 'center',  // Center align all child components horizontally
    backgroundColor: '#f0f9ff',  // Light blue background color
  },
  // Style for the main hero title
  heroTitle: {
    fontSize: 36,  // Large font size for prominence
    fontWeight: 'bold',  // Bold font weight
    textAlign: 'center',  // Center align text
    marginBottom: 16,  // 16px margin below title
    color: '#16a34a',  // Green color matching app theme
  },
  // Style for hero subtitle
  heroSubtitle: {
    fontSize: 18,  // Medium font size
    textAlign: 'center',  // Center align text
    color: '#666',  // Gray color for secondary text
    marginBottom: 32,  // 32px margin below subtitle
  },
  // Container style for hero buttons
  heroButtons: {
    width: '100%',  // Full width of parent container
    gap: 12,  // 12px space between buttons
  },
  // Style for features section
  featuresSection: {
    padding: 20,  // 20px padding on all sides
  },
  // Style for section title
  sectionTitle: {
    fontSize: 28,  // Large font size
    fontWeight: 'bold',  // Bold font weight
    textAlign: 'center',  // Center align text
    marginBottom: 24,  // 24px margin below title
    color: '#16a34a',  // Green color matching app theme
  },
});
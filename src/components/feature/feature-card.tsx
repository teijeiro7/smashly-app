// Import React library
import React from 'react';
// Import React Native components for styling and layout
import { StyleSheet, Text, View } from 'react-native';

// TypeScript interface defining the props this component expects
interface FeatureCardProps {
  icon: React.ReactNode;  // React component/element (like an icon)
  title: string;  // Feature title text
  description: string;  // Feature description text
}

// Component to display a feature card with icon, title, and description
export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    // Main container for the feature card
    <View style={styles.card}>
      {/* Container specifically for the icon */}
      <View style={styles.iconContainer}>{icon}</View>
      {/* Title text for the feature */}
      <Text style={styles.title}>{title}</Text>
      {/* Description text for the feature */}
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

// StyleSheet for component styling
const styles = StyleSheet.create({
  // Main card container style
  card: {
    backgroundColor: 'white',  // White background for card
    borderRadius: 12,  // 12px rounded corners
    padding: 20,  // 20px padding inside card
    marginBottom: 16,  // 16px margin below card for spacing between cards
    // Shadow properties for iOS
    shadowColor: '#000',  // Black shadow color
    shadowOffset: {
      width: 0,  // No horizontal shadow offset
      height: 2,  // 2px vertical shadow offset
    },
    shadowOpacity: 0.1,  // 10% shadow opacity (very light)
    shadowRadius: 4,  // 4px shadow blur radius
    elevation: 3,  // Android shadow elevation (equivalent to iOS shadow)
  },
  // Container style for icon positioning
  iconContainer: {
    alignItems: 'center',  // Center align icon horizontally
    marginBottom: 12,  // 12px margin below icon
  },
  // Style for feature title text
  title: {
    fontSize: 18,  // 18px font size
    fontWeight: '600',  // Semi-bold font weight
    textAlign: 'center',  // Center align text
    marginBottom: 8,  // 8px margin below title
    color: '#16a34a',  // Green color matching app theme
  },
  // Style for feature description text
  description: {
    fontSize: 14,  // 14px font size (smaller than title)
    color: '#666',  // Gray color for secondary text
    textAlign: 'center',  // Center align text
    lineHeight: 20,  // 20px line height for better readability
  },
});
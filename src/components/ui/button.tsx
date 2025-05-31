// Import React library for creating components
import React from 'react';
// Import React Native components for UI
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

// TypeScript interface defining the props this component accepts
interface ButtonProps {
  title: string;  // Text to display on button
  onPress: () => void;  // Function to call when button is pressed
  loading?: boolean;  // Optional prop to show loading indicator
  variant?: 'primary' | 'outline';  // Optional prop to change button style
}

// Reusable Button component that can be used throughout the app
export const Button: React.FC<ButtonProps> = ({ 
  title,  // Button text
  onPress,  // Press handler function
  loading,  // Loading state (optional, defaults to false)
  variant = 'primary'  // Button style variant (defaults to 'primary')
}) => {
  return (
    // TouchableOpacity makes the button pressable with opacity feedback
    <TouchableOpacity 
      style={[styles.button, styles[variant]]}  // Apply base button style + variant style
      onPress={onPress}  // Function to call when pressed
      disabled={loading}  // Disable button when loading to prevent multiple presses
    >
      {/* Conditional rendering: show loading spinner or button text */}
      {loading ? (
        // ActivityIndicator is a loading spinner component
        <ActivityIndicator color={variant === 'outline' ? '#16a34a' : 'white'} />
      ) : (
        // Text component displaying button title
        <Text style={[styles.buttonText, variant === 'outline' && styles.outlineText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// StyleSheet containing all styles for this component
const styles = StyleSheet.create({
  // Base button style applied to all button variants
  button: {
    paddingVertical: 12,  // 12px vertical padding (top and bottom)
    paddingHorizontal: 24,  // 24px horizontal padding (left and right)
    borderRadius: 8,  // 8px rounded corners
    alignItems: 'center',  // Center align content horizontally
    justifyContent: 'center',  // Center align content vertically
    minHeight: 48,  // Minimum height for accessibility (touch targets)
  },
  // Primary button variant style (filled green button)
  primary: {
    backgroundColor: '#16a34a',  // Green background color
  },
  // Outline button variant style (transparent with green border)
  outline: {
    backgroundColor: 'transparent',  // No background color
    borderWidth: 2,  // 2px border width
    borderColor: '#16a34a',  // Green border color
  },
  // Text style for button text
  buttonText: {
    color: 'white',  // White text color (for primary buttons)
    fontSize: 16,  // 16px font size
    fontWeight: '600',  // Semi-bold font weight
  },
  // Text style specifically for outline button variant
  outlineText: {
    color: '#16a34a',  // Green text color (to match border)
  },
});
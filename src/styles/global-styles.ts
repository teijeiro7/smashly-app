// Import StyleSheet from React Native for creating style objects
import { StyleSheet } from 'react-native';

// Export global styles that can be used across multiple components
export const globalStyles = StyleSheet.create({
  // Main container style used for screen backgrounds
  container: {
    flex: 1,  // Take up all available space in parent
    backgroundColor: '#f0f9ff',  // Light blue background (green-50 equivalent from Tailwind)
  },
  // Style for green primary color text (not currently used but available)
  greenPrimary: {
    color: '#16a34a',  // Green color (green-600 from Tailwind CSS)
  },
  // Generic button style (alternative to component-specific button styles)
  button: {
    backgroundColor: '#16a34a',  // Green background color
    paddingVertical: 12,  // 12px vertical padding
    paddingHorizontal: 24,  // 24px horizontal padding
    borderRadius: 8,  // 8px rounded corners
    alignItems: 'center',  // Center align content horizontally
  },
  // Text style for buttons (pairs with button style above)
  buttonText: {
    color: 'white',  // White text color
    fontSize: 16,  // 16px font size
    fontWeight: '600',  // Semi-bold font weight
  },
});
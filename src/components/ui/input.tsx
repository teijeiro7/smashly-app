// Import React library
import React from 'react';
// Import React Native components for text input and styling
import { StyleSheet, Text, TextInput, View } from 'react-native';

// TypeScript interface defining the props this component accepts
interface InputProps {
  placeholder: string;  // Placeholder text shown when input is empty
  value: string;  // Current value of the input field
  onChangeText: (text: string) => void;  // Function called when text changes
  label?: string;  // Optional label text shown above input
  secureTextEntry?: boolean;  // Optional prop to hide text (for passwords)
}

// Reusable Input component for text fields throughout the app
export const Input: React.FC<InputProps> = ({
  placeholder,  // Placeholder text
  value,  // Current input value
  onChangeText,  // Text change handler
  label,  // Optional label (undefined if not provided)
  secureTextEntry  // Optional secure entry (undefined if not provided)
}) => {
  return (
    // Container View wrapping the entire input component
    <View style={styles.inputContainer}>
      {/* Conditional rendering: only show label if one is provided */}
      {label && <Text style={styles.label}>{label}</Text>}
      {/* TextInput component for user text entry */}
      <TextInput
        style={styles.input}  // Apply input styling
        placeholder={placeholder}  // Show placeholder text
        value={value}  // Set current value (controlled component)
        onChangeText={onChangeText}  // Call function when text changes
        secureTextEntry={secureTextEntry}  // Hide text if true (for passwords)
        placeholderTextColor="#999"  // Gray color for placeholder text
      />
    </View>
  );
};

// StyleSheet for component styling
const styles = StyleSheet.create({
  // Container style for entire input component
  inputContainer: {
    marginBottom: 16,  // 16px margin below each input for spacing
  },
  // Style for label text above input
  label: {
    fontSize: 16,  // 16px font size
    fontWeight: '500',  // Medium font weight
    color: '#333',  // Dark gray text color
    marginBottom: 8,  // 8px margin below label
  },
  // Style for the actual text input field
  input: {
    borderWidth: 1,  // 1px border around input
    borderColor: '#ddd',  // Light gray border color
    borderRadius: 8,  // 8px rounded corners
    paddingHorizontal: 16,  // 16px horizontal padding inside input
    paddingVertical: 12,  // 12px vertical padding inside input
    fontSize: 16,  // 16px font size for input text
    backgroundColor: 'white',  // White background color
  },
});
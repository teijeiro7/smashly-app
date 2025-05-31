// Import Dimensions API from React Native to get screen dimensions
import { Dimensions } from 'react-native';

// Custom hook to determine if device should be considered "mobile"
export function useIsMobile() {
  // Get current window dimensions
  const { width } = Dimensions.get('window');
  
  // Return true if screen width is less than 768px (tablet breakpoint)
  // This follows common responsive design patterns where 768px+ is considered tablet/desktop
  return width < 768;
}
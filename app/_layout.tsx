// Import Stack navigator from expo-router for screen navigation
import { Stack } from "expo-router";
// Import StatusBar component to control the status bar appearance
import { StatusBar } from "expo-status-bar";
// Import React and router for navigation
import { router } from "expo-router";
import React from "react";
// Import React Native components for custom header
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
// Import usePathname to detect current route
import { usePathname } from "expo-router";

// Custom header component with modern design and navigation buttons
function CustomHeader() {
  // Get current pathname to determine active navigation item
  const pathname = usePathname();

  return (
    // Main container for the custom header
    <View style={styles.headerContainer}>
      {/* Left side - App logo/brand */}
      <View style={styles.headerLeft}>
        <Text style={styles.logoText}>Smashly</Text>
      </View>

      {/* Center navigation menu */}
      <View style={styles.headerCenter}>
        <TouchableOpacity
          style={[
            styles.navMenuItem,
            pathname === "/" && styles.activeMenuItem, // Active only when on home page
          ]}
          onPress={() => router.push("/")}
        >
          <Text
            style={[
              styles.navMenuText,
              pathname === "/" && styles.activeMenuText, // Active text styling for home
            ]}
          >
            Inicio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navMenuItem,
            pathname === "/rackets" && styles.activeMenuItem, // Active only when on rackets page
          ]}
          onPress={() => router.push("/rackets")}
        >
          <Text
            style={[
              styles.navMenuText,
              pathname === "/rackets" && styles.activeMenuText, // Active text styling for rackets
            ]}
          >
            Comparador de Palas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navMenuItem,
            pathname === "/faq" && styles.activeMenuItem, // Active only when on FAQ page
          ]}
          onPress={() => router.push("/faq")}
        >
          <Text
            style={[
              styles.navMenuText,
              pathname === "/faq" && styles.activeMenuText, // Active text styling for FAQ
            ]}
          >
            FAQ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Right side - Authentication buttons */}
      <View style={styles.headerRight}>
        {/* Login button with modern styling */}
        <TouchableOpacity
          style={[styles.navButton, styles.loginButton]}
          onPress={() => router.push("/login")} // Navigate to login screen
          activeOpacity={0.8} // Slight opacity change on press for feedback
        >
          {/* Login button text */}
          <Text style={styles.loginButtonText}>Iniciar sesión</Text>
        </TouchableOpacity>

        {/* Register button with modern styling */}
        <TouchableOpacity
          style={[styles.navButton, styles.registerButton]}
          onPress={() => router.push("/register")} // Navigate to register screen
          activeOpacity={0.8} // Slight opacity change on press for feedback
        >
          {/* Register button text */}
          <Text style={styles.registerButtonText}>Registrarse</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Main layout component that wraps all screens in the app
export default function RootLayout() {
  return (
    <>
      {/* Stack navigator component that manages screen navigation */}
      <Stack>
        {/* Configure the home screen (index.tsx) with custom header */}
        <Stack.Screen
          name="index" // This matches the filename index.tsx
          options={{
            // Custom header component instead of default header
            header: () => <CustomHeader />,
            // Remove default header styling since we're using custom header
            headerShown: true,
          }}
        />

        {/* Configure the rackets screen with custom header */}
        <Stack.Screen
          name="rackets" // This matches the filename rackets.tsx
          options={{
            // Custom header component instead of default header
            header: () => <CustomHeader />,
            // Remove default header styling since we're using custom header
            headerShown: true,
          }}
        />

        {/* Configure the login screen with custom header */}
        <Stack.Screen
          name="login" // This matches the filename login.tsx
          options={{
            // Custom header component instead of default header
            header: () => <CustomHeader />,
            // Remove default header styling since we're using custom header
            headerShown: true,
          }}
        />

        {/* Configure the register screen with custom header */}
        <Stack.Screen
          name="register" // This matches the filename register.tsx
          options={{
            // Custom header component instead of default header
            header: () => <CustomHeader />,
            // Remove default header styling since we're using custom header
            headerShown: true,
          }}
        />

        {/* Configure the FAQ screen with custom header */}
        <Stack.Screen
          name="faq" // This matches the filename faq.tsx
          options={{
            // Custom header component instead of default header
            header: () => <CustomHeader />,
            // Remove default header styling since we're using custom header
            headerShown: true,
          }}
        />

        {/* Configure the best-racket screen with custom header */}
        <Stack.Screen
          name="best-racket" // This matches the filename best-racket.tsx
          options={{
            // Custom header component instead of default header
            header: () => <CustomHeader />,
            // Remove default header styling since we're using custom header
            headerShown: true,
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

// Modern styles for the custom header and navigation
const styles = StyleSheet.create({
  // Main container for custom header
  headerContainer: {
    height: 64, // Fixed height for header
    paddingTop: 16, // Top padding for status bar
    backgroundColor: "#16a34a", // Green background matching app theme
    paddingBottom: 16, // Bottom padding
    paddingHorizontal: 20, // Horizontal padding
    flexDirection: "row", // Arrange children horizontally
    justifyContent: "space-between", // Space between left, center and right sections
    alignItems: "center", // Center align items vertically
    // Modern shadow effect
    elevation: 8, // Android shadow elevation
    shadowColor: "#000", // iOS shadow color
    shadowOffset: {
      width: 0, // No horizontal shadow offset
      height: 2, // 2px vertical shadow offset
    },
    shadowOpacity: 0.2, // 20% shadow opacity
    shadowRadius: 4, // 4px shadow blur radius
  },

  // Left section of header (logo area)
  headerLeft: {
    flexDirection: "row", // Arrange icon and text horizontally
    alignItems: "center", // Center align vertically
    flex: 1, // Take up available space
  },

  // Center section of header (navigation menu)
  headerCenter: {
    flexDirection: "row", // Arrange menu items horizontally
    alignItems: "center", // Center align vertically
    gap: 24, // Space between menu items
    flex: 2, // Take up more space than left/right sections
    justifyContent: "center", // Center the menu items
  },

  // Individual navigation menu item
  navMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },

  // Active menu item styling with whitish background
  activeMenuItem: {
    backgroundColor: "rgba(255, 255, 255, 0.15)", // More visible whitish background for active item
  },

  // Navigation menu text
  navMenuText: {
    color: "rgba(255, 255, 255, 0.8)", // Semi-transparent white for inactive items
    fontSize: 14,
    fontWeight: "500",
  },

  // Active menu text - fully white and bold
  activeMenuText: {
    color: "white", // Full white for active item
    fontWeight: "600", // Bold for active item
  },

  // Logo text styling
  logoText: {
    color: "white", // White text color
    fontSize: 24, // Large font size for brand prominence
    fontWeight: "bold", // Bold font weight
    letterSpacing: 0.5, // Slight letter spacing for modern look
  },

  // Right section of header (navigation buttons)
  headerRight: {
    flexDirection: "row", // Arrange buttons horizontally
    alignItems: "center", // Center align vertically
    gap: 8, // 8px space between buttons
    flex: 1, // Take up available space
    justifyContent: "flex-end", // Align buttons to the right
  },

  // Base style for navigation buttons
  navButton: {
    flexDirection: "row", // Arrange icon and text horizontally
    alignItems: "center", // Center align vertically
    paddingHorizontal: 16, // Increased horizontal padding
    paddingVertical: 8, // 8px vertical padding
    borderRadius: 6, // Slightly less rounded for more professional look
    justifyContent: "center", // Center content horizontally
  },

  // Login button specific styling (text only)
  loginButton: {
    backgroundColor: "transparent", // Transparent background
  },

  // Register button specific styling (filled style)
  registerButton: {
    backgroundColor: "white", // White background
  },

  // Login button text styling
  loginButtonText: {
    color: "white", // White text color
    fontSize: 14, // Medium font size
    fontWeight: "500", // Medium font weight
  },

  // Register button text styling
  registerButtonText: {
    color: "#16a34a", // Green text color (contrasts with white background)
    fontSize: 14, // Medium font size
    fontWeight: "600", // Semi-bold font weight for emphasis
  },
});

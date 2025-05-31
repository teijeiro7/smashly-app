// Import Ionicons for vector icons from Expo
// Import router for navigation between screens
import { router } from "expo-router";
// Import React library for creating components
import React from "react";
// Import React Native components for UI
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// Import custom Button component from src folder

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Main home screen component that replicates the landing page design
export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Main hero section with two-column layout */}
      <View style={styles.heroContainer}>
        {/* Left column with content */}
        <View style={styles.leftColumn}>
          {/* Green badge with app announcement */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              ¡Nueva aplicación para amantes del pádel!
            </Text>
          </View>

          {/* Main headline matching the design */}
          <Text style={styles.mainHeadline}>
            Tu compañero{"\n"}
            perfecto para el{" "}
            <Text style={styles.highlightText}>pádel{"\n"}amateur</Text>
          </Text>

          {/* Subtitle description */}
          <Text style={styles.subtitle}>
            La app de pádel hecha por y para ti.
            {"\n"}
          </Text>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/register")}
            >
              <Text style={styles.primaryButtonText}>Comenzar ahora</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                // Handle demo navigation or action
                console.log("Ver demostración");
              }}
            >
              <Text style={styles.secondaryButtonText}>Ver demostración</Text>
            </TouchableOpacity>
          </View>

          {/* Trust indicators */}
          <View style={styles.trustIndicators}>
            {/* Number indicators */}
            <View style={styles.numberIndicators}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>1</Text>
              </View>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>2</Text>
              </View>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>3</Text>
              </View>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>4</Text>
              </View>
            </View>

            {/* Trust text */}
            <Text style={styles.trustText}>
              +1,000 jugadores ya confían en nosotros
            </Text>
          </View>
        </View>

        {/* Right column with app mockup */}
        <View style={styles.rightColumn}>
          {/* Placeholder for app mockup - you can replace with actual image */}
          <View style={styles.mockupContainer}>
            <View style={styles.mockupPhone}>
              <View style={styles.mockupScreen}>
                <View style={styles.mockupHeader}>
                  <View style={styles.mockupHeaderBar}></View>
                </View>
                <View style={styles.mockupContent}>
                  <View style={styles.mockupCard}></View>
                  <View style={styles.mockupCard}></View>
                  <View style={styles.mockupCard}></View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// StyleSheet with modern landing page design
const styles = StyleSheet.create({
  // Main container with light green background
  container: {
    flex: 1,
    backgroundColor: "#f0f9f0", // Very light green background like in the image
  },

  // Hero container with two-column layout
  heroContainer: {
    flexDirection: screenWidth > 768 ? "row" : "column", // Responsive layout
    minHeight: screenHeight - 100, // Full height minus header
    paddingHorizontal: 40,
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Left column styling
  leftColumn: {
    flex: screenWidth > 768 ? 1 : undefined,
    maxWidth: screenWidth > 768 ? "50%" : "100%",
    paddingRight: screenWidth > 768 ? 40 : 0,
    marginBottom: screenWidth > 768 ? 0 : 40,
  },

  // Green badge at the top
  badge: {
    backgroundColor: "#dcfce7", // Light green background
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 24,
  },

  // Badge text styling
  badgeText: {
    color: "#16a34a", // Green text
    fontSize: 14,
    fontWeight: "500",
  },

  // Main headline styling
  mainHeadline: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#1f2937", // Dark text
    lineHeight: 56,
    marginBottom: 24,
  },

  // Highlighted text in green
  highlightText: {
    color: "#16a34a", // Green color for "pádel amateur"
  },

  // Subtitle styling
  subtitle: {
    fontSize: 18,
    color: "#6b7280", // Gray text
    lineHeight: 28,
    marginBottom: 40,
  },

  // Action buttons container
  actionButtons: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 40,
    flexWrap: "wrap",
  },

  // Primary button (green)
  primaryButton: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
    alignItems: "center",
  },

  // Primary button text
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // Secondary button (outline)
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
    alignItems: "center",
    backgroundColor: "white",
  },

  // Secondary button text
  secondaryButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "500",
  },

  // Trust indicators container
  trustIndicators: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  // Number indicators container
  numberIndicators: {
    flexDirection: "row",
    gap: 8,
  },

  // Individual number badge
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
  },

  // Number text styling
  numberText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Trust text styling
  trustText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "500",
  },

  // Right column styling
  rightColumn: {
    flex: screenWidth > 768 ? 1 : undefined,
    maxWidth: screenWidth > 768 ? "50%" : "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  // Mockup container
  mockupContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Phone mockup styling
  mockupPhone: {
    width: 280,
    height: 560,
    backgroundColor: "#1f2937",
    borderRadius: 30,
    padding: 8,
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },

  // Phone screen
  mockupScreen: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 22,
    overflow: "hidden",
  },

  // Mockup header
  mockupHeader: {
    height: 80,
    backgroundColor: "#16a34a",
    justifyContent: "flex-end",
    paddingBottom: 16,
    paddingHorizontal: 20,
  },

  // Header bar
  mockupHeaderBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    width: 60,
  },

  // Mockup content area
  mockupContent: {
    flex: 1,
    padding: 20,
    gap: 16,
  },

  // Mockup cards
  mockupCard: {
    height: 80,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
  },
});

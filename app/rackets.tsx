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
// Import Ionicons for vector icons
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get("window");

// Comparador de Palas screen component that replicates the design
export default function ComparadorScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Main hero section */}
      <View style={styles.heroSection}>
        {/* Main title */}
        <Text style={styles.mainTitle}>
          Comparador de <Text style={styles.highlightText}>Palas de Pádel</Text>
        </Text>

        {/* Subtitle description */}
        <Text style={styles.subtitle}>
          Encuentra la pala perfecta para tu estilo de juego, compara modelos y
          descubre{"\n"}
          las mejores opciones del mercado.
        </Text>
      </View>

      {/* Features grid section */}
      <View style={styles.featuresGrid}>
        {/* First feature card - Palas más vendidas */}
        <View style={styles.featureCard}>
          {/* Icon container */}
          <View style={styles.iconContainer}>
            <Ionicons name="trending-up" size={32} color="#16a34a" />
          </View>

          {/* Feature content */}
          <Text style={styles.featureTitle}>Palas más vendidas</Text>
          <Text style={styles.featureDescription}>
            Descubre las palas favoritas de la comunidad
          </Text>

          {/* Feature detailed description */}
          <Text style={styles.featureDetailText}>
            Explora el ranking de las palas más populares entre los jugadores de
            pádel amateur, con valoraciones reales y opiniones verificadas.
          </Text>

          {/* Action button */}
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Ver ranking de palas</Text>
            <Ionicons name="chevron-forward" size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* Second feature card - La mejor pala para ti (with recommended badge) */}
        <View style={[styles.featureCard, styles.recommendedCard]}>
          {/* Recommended badge */}
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedBadgeText}>Recomendado</Text>
          </View>

          {/* Icon container */}
          <View style={styles.iconContainer}>
            <Ionicons name="search" size={32} color="#16a34a" />
          </View>

          {/* Feature content */}
          <Text style={styles.featureTitle}>La mejor pala para ti</Text>
          <Text style={styles.featureDescription}>
            Recomendaciones personalizadas según tu perfil
          </Text>

          {/* Feature detailed description */}
          <Text style={styles.featureDetailText}>
            Responde a unas sencillas preguntas sobre tu nivel, estilo de juego
            y preferencias para recibir recomendaciones personalizadas.
          </Text>

          {/* Action button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // @ts-ignore - Router may not be imported yet
              router.push("best-racket");
            }}
          >
            <Text style={styles.actionButtonText}>Encontrar mi pala ideal</Text>
            <Ionicons name="chevron-forward" size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* Third feature card - Compara palas */}
        <View style={styles.featureCard}>
          {/* Icon container */}
          <View style={styles.iconContainer}>
            <Ionicons name="git-compare" size={32} color="#16a34a" />
          </View>

          {/* Feature content */}
          <Text style={styles.featureTitle}>Compara palas</Text>
          <Text style={styles.featureDescription}>
            Analiza las diferencias entre modelos
          </Text>

          {/* Feature detailed description */}
          <Text style={styles.featureDetailText}>
            Selecciona hasta 3 modelos diferentes para comparar sus
            características técnicas, precios y valoraciones de usuarios.
          </Text>

          {/* Action button */}
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Comparar palas</Text>
            <Ionicons name="chevron-forward" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// StyleSheet with design matching the provided image
const styles = StyleSheet.create({
  // Main container with light background
  container: {
    flex: 1,
    backgroundColor: "#f8faf8", // Very light green background
  },

  // Hero section at the top
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
    backgroundColor: "#f8faf8",
  },

  // Main title styling
  mainTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1f2937", // Dark text
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 40,
  },

  // Highlighted text in green (matching the image)
  highlightText: {
    color: "#16a34a", // Green color for "Palas de Pádel"
  },

  // Subtitle styling
  subtitle: {
    fontSize: 16,
    color: "#6b7280", // Gray text
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Features grid container
  featuresGrid: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 24, // Space between cards
    flexDirection: screenWidth > 1024 ? "row" : "column", // Responsive grid
    flexWrap: "wrap",
    justifyContent: "center",
  },

  // Individual feature card
  featureCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: screenWidth > 1024 ? (screenWidth - 96) / 3 : "100%", // Responsive width
    maxWidth: 400, // Maximum width for large screens
    alignItems: "center",
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: "relative", // For positioning the recommended badge
  },

  // Recommended card special styling
  recommendedCard: {
    borderWidth: 2,
    borderColor: "#16a34a", // Green border for recommended card
  },

  // Recommended badge styling
  recommendedBadge: {
    position: "absolute",
    top: -8,
    right: 16,
    backgroundColor: "#16a34a",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },

  // Recommended badge text
  recommendedBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  // Icon container styling
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f9ff", // Light background for icons
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  // Feature title styling
  featureTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },

  // Feature description styling
  featureDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
  },

  // Feature image container
  featureImageContainer: {
    width: "100%",
    marginBottom: 20,
  },

  // Feature image placeholder
  featureImagePlaceholder: {
    height: 150,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },

  // Image placeholder text
  imagePlaceholderText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
  },

  // Feature detailed description
  featureDetailText: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },

  // Action button styling
  actionButton: {
    backgroundColor: "#16a34a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    width: "100%",
  },

  // Action button text
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

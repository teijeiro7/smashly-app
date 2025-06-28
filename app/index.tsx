// Import Ionicons for vector icons from Expo
import { Ionicons } from "@expo/vector-icons";
// Import router for navigation between screens
import { router } from "expo-router";
// Import React library for creating components
import React, { useEffect, useRef } from "react";
// Import React Native components for UI
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Main home screen component with modern landing page design
export default function HomeScreen() {
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <Animated.View
        style={[
          styles.heroSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Hero Content */}
        <View style={styles.heroContent}>
          {/* Badge */}
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={16} color="#16a34a" />
            <Text style={styles.badgeText}>Impulsado por IA</Text>
          </View>

          {/* Main Headline */}
          <Text style={styles.mainHeadline}>
            Encuentra tu pala perfecta con{" "}
            <Text style={styles.highlightText}>Inteligencia Artificial</Text>
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Smashly analiza tu estilo de juego y te recomienda las mejores palas
            de pádel del mercado. Más de 200 modelos analizados por IA.
          </Text>

          {/* CTA Buttons */}
          <View style={styles.ctaButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/best-racket")}
            >
              <Ionicons name="search" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Encontrar mi pala</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/compare-rackets")}
            >
              <Ionicons name="analytics" size={20} color="#16a34a" />
              <Text style={styles.secondaryButtonText}>Comparar palas</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>200+</Text>
              <Text style={styles.statLabel}>Palas analizadas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1000+</Text>
              <Text style={styles.statLabel}>Usuarios activos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>95%</Text>
              <Text style={styles.statLabel}>Precisión IA</Text>
            </View>
          </View>
        </View>

        {/* Hero Visual */}
        <View style={styles.heroVisual}>
          <View style={styles.phoneContainer}>
            <View style={styles.phone}>
              <View style={styles.phoneScreen}>
                <View style={styles.appHeader}>
                  <Text style={styles.appHeaderText}>Smashly</Text>
                </View>
                <View style={styles.appContent}>
                  <View style={styles.searchBar}>
                    <Ionicons name="search" size={16} color="#999" />
                  </View>
                  <View style={styles.racketCard}>
                    <View style={styles.racketImage} />
                    <View style={styles.racketInfo}>
                      <View style={styles.racketTitle} />
                      <View style={styles.racketSubtitle} />
                      <View style={styles.aiMatchBadge}>
                        <Text style={styles.aiMatchText}>95% Match</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            {/* Floating elements */}
            <View style={styles.floatingElement1}>
              <Ionicons name="star" size={24} color="#fbbf24" />
            </View>
            <View style={styles.floatingElement2}>
              <Ionicons name="analytics" size={20} color="#16a34a" />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>¿Por qué elegir Smashly?</Text>
        <Text style={styles.sectionSubtitle}>
          La tecnología más avanzada para encontrar tu pala ideal
        </Text>

        <View style={styles.featuresGrid}>
          {/* Feature 1 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="bulb" size={32} color="#16a34a" />
            </View>
            <Text style={styles.featureTitle}>IA Avanzada</Text>
            <Text style={styles.featureDescription}>
              Análisis personalizado con Gemini AI para recomendaciones precisas
              según tu perfil
            </Text>
          </View>

          {/* Feature 2 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="analytics" size={32} color="#3b82f6" />
            </View>
            <Text style={styles.featureTitle}>Comparador Inteligente</Text>
            <Text style={styles.featureDescription}>
              Compara hasta 3 palas lado a lado con análisis detallado de pros y
              contras
            </Text>
          </View>

          {/* Feature 3 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="library" size={32} color="#f59e0b" />
            </View>
            <Text style={styles.featureTitle}>Base de Datos Completa</Text>
            <Text style={styles.featureDescription}>
              Más de 200 modelos de las mejores marcas con precios actualizados
              en tiempo real
            </Text>
          </View>

          {/* Feature 4 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="search" size={32} color="#ef4444" />
            </View>
            <Text style={styles.featureTitle}>Búsqueda Inteligente</Text>
            <Text style={styles.featureDescription}>
              Encuentra cualquier pala al instante con nuestro buscador global
              avanzado
            </Text>
          </View>
        </View>
      </View>

      {/* How it Works Section */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>Cómo funciona</Text>
        <Text style={styles.sectionSubtitle}>
          En 3 simples pasos encuentra tu pala perfecta
        </Text>

        <View style={styles.stepsContainer}>
          {/* Step 1 */}
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Completa tu perfil</Text>
              <Text style={styles.stepDescription}>
                Cuéntanos sobre tu nivel, estilo de juego y preferencias
              </Text>
            </View>
            <Ionicons name="person" size={40} color="#16a34a" />
          </View>

          {/* Step 2 */}
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>IA analiza y recomienda</Text>
              <Text style={styles.stepDescription}>
                Nuestra IA procesa tu información y encuentra las mejores
                opciones
              </Text>
            </View>
            <Ionicons name="hardware-chip" size={40} color="#3b82f6" />
          </View>

          {/* Step 3 */}
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Elige y compra</Text>
              <Text style={styles.stepDescription}>
                Compara opciones y compra directamente desde la app
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={40} color="#10b981" />
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaContent}>
          <Text style={styles.ctaTitle}>
            ¿Listo para encontrar tu pala perfecta?
          </Text>
          <Text style={styles.ctaSubtitle}>
            Únete a más de 1000 jugadores que ya han mejorado su juego
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push("/best-racket")}
          >
            <Text style={styles.ctaButtonText}>Comenzar ahora</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Modern styles for the landing page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  // Hero Section
  heroSection: {
    flexDirection: screenWidth > 768 ? "row" : "column",
    minHeight: screenHeight - 100,
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)",
  },

  heroContent: {
    flex: screenWidth > 768 ? 1 : undefined,
    maxWidth: screenWidth > 768 ? "50%" : "100%",
    paddingRight: screenWidth > 768 ? 20 : 0,
    marginBottom: screenWidth > 768 ? 0 : 40,
    alignItems: screenWidth > 768 ? "flex-start" : "center",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    gap: 6,
  },

  badgeText: {
    color: "#16a34a",
    fontSize: 14,
    fontWeight: "600",
  },

  mainHeadline: {
    fontSize: screenWidth > 768 ? 48 : 36,
    fontWeight: "800",
    color: "#1f2937",
    lineHeight: screenWidth > 768 ? 56 : 44,
    marginBottom: 24,
    textAlign: screenWidth > 768 ? "left" : "center",
  },

  highlightText: {
    color: "#16a34a",
  },

  subtitle: {
    fontSize: 18,
    color: "#6b7280",
    lineHeight: 28,
    marginBottom: 32,
    textAlign: screenWidth > 768 ? "left" : "center",
  },

  ctaButtons: {
    flexDirection: screenWidth > 600 ? "row" : "column",
    gap: 16,
    marginBottom: 40,
    width: "100%",
  },

  primaryButton: {
    flexDirection: "row",
    backgroundColor: "#16a34a",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: screenWidth > 600 ? 1 : undefined,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  secondaryButton: {
    flexDirection: "row",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#16a34a",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: screenWidth > 600 ? 1 : undefined,
  },

  secondaryButtonText: {
    color: "#16a34a",
    fontSize: 16,
    fontWeight: "600",
  },

  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },

  statItem: {
    alignItems: "center",
  },

  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#16a34a",
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },

  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e5e7eb",
  },

  // Hero Visual
  heroVisual: {
    flex: screenWidth > 768 ? 1 : undefined,
    maxWidth: screenWidth > 768 ? "50%" : "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  phoneContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  phone: {
    width: 280,
    height: 560,
    backgroundColor: "#1f2937",
    borderRadius: 30,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },

  phoneScreen: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 22,
    overflow: "hidden",
  },

  appHeader: {
    height: 80,
    backgroundColor: "#16a34a",
    justifyContent: "flex-end",
    paddingBottom: 16,
    paddingHorizontal: 20,
  },

  appHeaderText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  appContent: {
    flex: 1,
    padding: 20,
    gap: 16,
  },

  searchBar: {
    height: 40,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
  },

  racketCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  racketImage: {
    width: 60,
    height: 60,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },

  racketInfo: {
    flex: 1,
    gap: 4,
  },

  racketTitle: {
    height: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    width: "80%",
  },

  racketSubtitle: {
    height: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    width: "60%",
  },

  aiMatchBadge: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },

  aiMatchText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },

  floatingElement1: {
    position: "absolute",
    top: -20,
    right: -10,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  floatingElement2: {
    position: "absolute",
    bottom: 100,
    left: -20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 80,
    backgroundColor: "white",
  },

  sectionTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 16,
  },

  sectionSubtitle: {
    fontSize: 18,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 28,
  },

  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
  },

  featureCard: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: screenWidth > 768 ? (screenWidth - 120) / 2 : screenWidth - 40,
    maxWidth: 300,
    minHeight: 200,
  },

  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },

  featureDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },

  // How it Works Section
  howItWorksSection: {
    paddingHorizontal: 20,
    paddingVertical: 80,
    backgroundColor: "#f9fafb",
  },

  stepsContainer: {
    gap: 32,
  },

  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },

  stepNumberText: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },

  stepDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },

  // CTA Section
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 80,
    backgroundColor: "#16a34a",
  },

  ctaContent: {
    alignItems: "center",
  },

  ctaTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginBottom: 16,
  },

  ctaSubtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 28,
  },

  ctaButton: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },

  ctaButtonText: {
    color: "#16a34a",
    fontSize: 18,
    fontWeight: "700",
  },
});

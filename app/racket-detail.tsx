// Import React library and hooks for creating components
import React, { useEffect, useState } from "react";
// Import React Native components for UI
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// Import Ionicons for vector icons
import { Ionicons } from "@expo/vector-icons";
// Import router for navigation
import { router, useLocalSearchParams } from "expo-router";
// Import rackets data
import racketData from "../palas_padel.json";
// Import racket type
import { Racket } from "../src/utils/gemini";
// Import UI components
import { Button } from "../src/components/ui/button";
// Import comparison context
import { useComparison } from "../src/contexts/comparison-context";

// Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get("window");

// Racket Detail Screen component
export default function RacketDetailScreen() {
  // Get the racket ID from route params
  const { id } = useLocalSearchParams<{ id: string }>();

  // Get comparison context
  const { addRacket, isRacketInComparison, count } = useComparison();

  // State for racket data
  const [racket, setRacket] = useState<Racket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load racket data on component mount
  useEffect(() => {
    if (id) {
      loadRacketData(id);
    }
  }, [id]);

  // Function to load racket data by ID
  const loadRacketData = (racketId: string) => {
    try {
      // Find racket by ID (we'll use the nombre as ID for simplicity)
      const foundRacket = racketData.palas.find(
        (pala: any, index: number) =>
          index.toString() === racketId || pala.nombre === racketId
      );

      if (foundRacket) {
        const racketObject: Racket = {
          nombre: foundRacket.nombre,
          marca: foundRacket.marca,
          modelo: foundRacket.modelo,
          precio_actual: foundRacket.precio_actual,
          precio_original: foundRacket.precio_original || null,
          descuento_porcentaje: foundRacket.descuento_porcentaje,
          enlace: foundRacket.enlace,
          imagen: foundRacket.imagen,
          es_bestseller: foundRacket.es_bestseller,
          en_oferta: foundRacket.en_oferta,
          scrapeado_en: foundRacket.scrapeado_en,
          fuente: foundRacket.fuente,
        };
        setRacket(racketObject);
      } else {
        Alert.alert("Error", "No se encontró la pala solicitada");
        router.back();
      }
    } catch (error) {
      console.error("Error loading racket data:", error);
      Alert.alert("Error", "Error al cargar los datos de la pala");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  // Function to open Padel Nuestro link
  const handleOpenPadelNuestro = async () => {
    if (!racket?.enlace) {
      Alert.alert("Error", "Enlace no disponible");
      return;
    }

    try {
      const supported = await Linking.canOpenURL(racket.enlace);
      if (supported) {
        await Linking.openURL(racket.enlace);
      } else {
        Alert.alert("Error", "No se puede abrir el enlace");
      }
    } catch (error) {
      console.error("Error opening link:", error);
      Alert.alert("Error", "Error al abrir el enlace");
    }
  };

  // Function to add racket to comparison
  const handleAddToComparison = () => {
    if (!racket) return;

    // Check if racket is already in comparison
    if (isRacketInComparison(racket.nombre)) {
      Alert.alert("Info", "Esta pala ya está en el comparador");
      return;
    }

    // Try to add racket to comparison
    const success = addRacket(racket);

    if (!success) {
      if (count >= 3) {
        Alert.alert(
          "Comparador lleno",
          "Ya tienes 3 palas en el comparador. Elimina una para añadir esta."
        );
      }
      return;
    }

    // Success - show confirmation
    Alert.alert(
      "¡Añadida!",
      `${racket.marca} ${racket.modelo} se ha añadido al comparador (${
        count + 1
      }/3)`,
      [
        { text: "Continuar", style: "default" },
        {
          text: "Ir al Comparador",
          style: "default",
          onPress: () => router.push("/compare-rackets"),
        },
      ]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando pala...</Text>
      </View>
    );
  }

  // Error state
  if (!racket) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Pala no encontrada</Text>
        <Button title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#16a34a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles de la Pala</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Racket Image and Basic Info */}
        <View style={styles.mainCard}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: racket.imagen }}
              style={styles.racketImage}
              resizeMode="contain"
            />
            {racket.es_bestseller && (
              <View style={styles.bestsellerBadge}>
                <Text style={styles.badgeText}>Top</Text>
              </View>
            )}
            {racket.en_oferta && (
              <View style={styles.offerBadge}>
                <Text style={styles.badgeText}>Oferta</Text>
              </View>
            )}
          </View>

          <View style={styles.basicInfo}>
            <Text style={styles.brandText}>{racket.marca}</Text>
            <Text style={styles.modelText}>{racket.modelo}</Text>

            {/* Price Section */}
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>€{racket.precio_actual}</Text>
              {racket.en_oferta &&
                racket.precio_original &&
                racket.precio_original > 0 && (
                  <>
                    <Text style={styles.originalPrice}>
                      €{racket.precio_original}
                    </Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        -{racket.descuento_porcentaje}%
                      </Text>
                    </View>
                  </>
                )}
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresCard}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="star" size={20} color="#16a34a" /> Características
          </Text>

          <View style={styles.featureGrid}>
            <View style={styles.featureItem}>
              <Ionicons
                name="trophy"
                size={24}
                color={racket.es_bestseller ? "#f59e0b" : "#9ca3af"}
              />
              <Text style={styles.featureLabel}>Bestseller</Text>
              <Text
                style={[
                  styles.featureValue,
                  { color: racket.es_bestseller ? "#16a34a" : "#9ca3af" },
                ]}
              >
                {racket.es_bestseller ? "Sí" : "No"}
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons
                name="pricetag"
                size={24}
                color={racket.en_oferta ? "#ef4444" : "#9ca3af"}
              />
              <Text style={styles.featureLabel}>En Oferta</Text>
              <Text
                style={[
                  styles.featureValue,
                  { color: racket.en_oferta ? "#ef4444" : "#9ca3af" },
                ]}
              >
                {racket.en_oferta ? "Sí" : "No"}
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="storefront" size={24} color="#16a34a" />
              <Text style={styles.featureLabel}>Tienda</Text>
              <Text style={styles.featureValue}>Padel Nuestro</Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="time" size={24} color="#9ca3af" />
              <Text style={styles.featureLabel}>Actualizado</Text>
              <Text style={styles.featureValue}>
                {racket.scrapeado_en
                  ? new Date(racket.scrapeado_en).toLocaleDateString()
                  : "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleOpenPadelNuestro}
          >
            <Ionicons name="open" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Ver en Padel Nuestro</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              isRacketInComparison(racket.nombre) &&
                styles.secondaryButtonAdded,
            ]}
            onPress={handleAddToComparison}
            disabled={isRacketInComparison(racket.nombre)}
          >
            <Ionicons
              name={
                isRacketInComparison(racket.nombre)
                  ? "checkmark-circle"
                  : "git-compare"
              }
              size={20}
              color={
                isRacketInComparison(racket.nombre) ? "#16a34a" : "#16a34a"
              }
            />
            <Text
              style={[
                styles.secondaryButtonText,
                isRacketInComparison(racket.nombre) &&
                  styles.secondaryButtonTextAdded,
              ]}
            >
              {isRacketInComparison(racket.nombre)
                ? "En el Comparador"
                : `Añadir al Comparador (${count}/3)`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Additional Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="information-circle" size={20} color="#16a34a" />{" "}
            Información Adicional
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre completo:</Text>
            <Text style={styles.infoValue}>{racket.nombre}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fuente:</Text>
            <Text style={styles.infoValue}>
              {racket.fuente || "Padel Nuestro"}
            </Text>
          </View>

          {racket.en_oferta && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Descuento:</Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: "#ef4444", fontWeight: "600" },
                ]}
              >
                {racket.descuento_porcentaje}% de descuento
              </Text>
            </View>
          )}
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsCard}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="bulb" size={20} color="#16a34a" /> ¿Necesitas más
            opciones?
          </Text>

          <Text style={styles.recommendationText}>
            Si esta pala no es exactamente lo que buscas, puedes usar nuestro
            sistema de recomendaciones con IA para encontrar la pala perfecta
            según tu perfil de jugador.
          </Text>

          <TouchableOpacity
            style={styles.recommendationButton}
            onPress={() => router.push("/best-racket")}
          >
            <Ionicons name="sparkles" size={18} color="#16a34a" />
            <Text style={styles.recommendationButtonText}>
              Buscar mi pala ideal
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Styles for the racket detail screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8faf8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8faf8",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8faf8",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginVertical: 16,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  mainCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: screenWidth > 600 ? "row" : "column",
    alignItems: "center",
    gap: 20,
  },
  imageContainer: {
    position: "relative",
    alignItems: "center",
  },
  racketImage: {
    width: 200,
    height: 250,
    borderRadius: 12,
  },
  bestsellerBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offerBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  basicInfo: {
    flex: 1,
    alignItems: screenWidth > 600 ? "flex-start" : "center",
  },
  brandText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#16a34a",
    marginBottom: 4,
  },
  modelText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
    textAlign: screenWidth > 600 ? "left" : "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ef4444",
  },
  originalPrice: {
    fontSize: 18,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  featuresCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  featureItem: {
    flex: 1,
    minWidth: 120,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
  },
  featureLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  featureValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 2,
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#16a34a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#16a34a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: "#16a34a",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonAdded: {
    backgroundColor: "#f0f9ff",
    borderColor: "#16a34a",
    opacity: 0.8,
  },
  secondaryButtonTextAdded: {
    color: "#16a34a",
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    flex: 2,
    textAlign: "right",
  },
  recommendationsCard: {
    backgroundColor: "#f0f9ff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  recommendationText: {
    fontSize: 14,
    color: "#0f172a",
    lineHeight: 20,
    marginBottom: 16,
  },
  recommendationButton: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#16a34a",
  },
  recommendationButtonText: {
    color: "#16a34a",
    fontSize: 14,
    fontWeight: "600",
  },
});

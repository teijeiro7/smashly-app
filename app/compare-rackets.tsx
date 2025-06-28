// Import React library and hooks for creating components
import React, { useEffect, useState } from "react";
// Import React Native components for UI
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// Import Ionicons for vector icons
import { Ionicons } from "@expo/vector-icons";
// Import custom components
import { Button } from "../src/components/ui/button";
// Import Gemini API functions
import { compareRackets, Racket, RacketComparison } from "../src/utils/gemini";
// Import rackets data
import racketData from "../palas_padel.json";
// Import TextInput
import { TextInput } from "react-native";

// Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get("window");

// Compare Rackets screen component
export default function CompareRacketsScreen() {
  // State for selected rackets (maximum 3)
  const [selectedRackets, setSelectedRackets] = useState<Racket[]>([]);
  // State for rackets data
  const [rackets, setRackets] = useState<Racket[]>([]);
  // State for loading during comparison
  const [isLoading, setIsLoading] = useState(false);
  // State for showing comparison modal
  const [showComparison, setShowComparison] = useState(false);
  // State for comparison results
  const [comparisonResults, setComparisonResults] =
    useState<RacketComparison | null>(null);
  // State for search query
  const [searchQuery, setSearchQuery] = useState("");
  // State for filter by brand
  const [selectedBrand, setSelectedBrand] = useState("Todas");

  // Load rackets data on component mount
  useEffect(() => {
    // Map and filter rackets data to match our interface
    const mappedRackets: Racket[] = racketData.palas
      .slice(0, 100) // Limit to first 100 for performance
      .map((racket) => ({
        nombre: racket.nombre,
        marca: racket.marca,
        modelo: racket.modelo,
        precio_actual: racket.precio_actual,
        precio_original: racket.precio_original || 0,
        descuento_porcentaje: racket.descuento_porcentaje,
        enlace: racket.enlace,
        imagen: racket.imagen,
        es_bestseller: racket.es_bestseller,
        en_oferta: racket.en_oferta,
        scrapeado_en: racket.scrapeado_en,
        fuente: racket.fuente,
      }));
    setRackets(mappedRackets);
  }, []);

  // Filter rackets based on search and brand
  const filteredRackets = rackets.filter((racket) => {
    const matchesSearch =
      racket.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      racket.marca.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand =
      selectedBrand === "Todas" || racket.marca === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  // Get unique brands for filter
  const uniqueBrands = [
    "Todas",
    ...Array.from(new Set(rackets.map((racket) => racket.marca))),
  ];

  // Handle racket selection
  const handleRacketSelection = (racket: Racket) => {
    if (selectedRackets.find((r) => r.nombre === racket.nombre)) {
      // Remove racket if already selected
      setSelectedRackets(
        selectedRackets.filter((r) => r.nombre !== racket.nombre)
      );
    } else if (selectedRackets.length < 3) {
      // Add racket if less than 3 selected
      setSelectedRackets([...selectedRackets, racket]);
    } else {
      Alert.alert(
        "Máximo alcanzado",
        "Solo puedes comparar 3 palas como máximo"
      );
    }
  };

  // Handle comparison
  const handleCompareRackets = async () => {
    if (selectedRackets.length < 2) {
      Alert.alert("Error", "Debes seleccionar al menos 2 palas para comparar");
      return;
    }

    setIsLoading(true);
    try {
      const results = await compareRackets(selectedRackets);
      setComparisonResults(results);
      setShowComparison(true);
    } catch (error) {
      console.error("Error comparing rackets:", error);
      Alert.alert(
        "Error",
        "No se pudo realizar la comparación. Inténtalo de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedRackets([]);
  };

  // Render racket card
  const renderRacketCard = (racket: Racket) => {
    const isSelected = selectedRackets.find((r) => r.nombre === racket.nombre);

    return (
      <TouchableOpacity
        key={racket.nombre}
        style={[styles.racketCard, isSelected && styles.selectedRacketCard]}
        onPress={() => handleRacketSelection(racket)}
      >
        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          </View>
        )}

        {/* Racket image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: racket.imagen }} style={styles.racketImage} />
        </View>

        {/* Racket info */}
        <View style={styles.racketInfo}>
          <View style={styles.racketTopInfo}>
            <Text style={styles.racketBrand}>{racket.marca}</Text>
            <Text style={styles.racketName} numberOfLines={2}>
              {racket.modelo}
            </Text>
          </View>

          <View style={styles.racketBottomInfo}>
            {/* Price info */}
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>€{racket.precio_actual}</Text>
              {racket.en_oferta &&
                racket.precio_original &&
                racket.precio_original > 0 && (
                  <View style={styles.originalPriceContainer}>
                    <Text style={styles.originalPrice}>
                      €{racket.precio_original}
                    </Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        -{racket.descuento_porcentaje}%
                      </Text>
                    </View>
                  </View>
                )}
            </View>

            {/* Badges */}
            <View style={styles.badgeContainer}>
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
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render comparison modal
  const renderComparisonModal = () => {
    if (!comparisonResults) return null;

    return (
      <Modal
        visible={showComparison}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComparison(false)}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Comparación de Palas</Text>
          <TouchableOpacity
            onPress={() => setShowComparison(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* General Analysis */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisTitle}>Análisis General</Text>
            <Text style={styles.analysisText}>
              {comparisonResults.generalAnalysis}
            </Text>
          </View>

          {/* Individual Racket Analysis */}
          {comparisonResults.racketAnalysis.map((analysis, index) => (
            <View key={index} style={styles.racketAnalysisSection}>
              <View style={styles.racketHeader}>
                <View style={styles.comparisonImageContainer}>
                  <Image
                    source={{ uri: selectedRackets[index]?.imagen }}
                    style={styles.comparisonRacketImage}
                  />
                </View>
                <View style={styles.racketTitleContainer}>
                  <Text style={styles.racketTitle}>{analysis.name}</Text>
                  <Text style={styles.racketBrandSmall}>
                    {selectedRackets[index]?.marca}
                  </Text>
                </View>
              </View>

              <View style={styles.analysisDetails}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Atributos Clave</Text>
                  <Text style={styles.detailText}>
                    {analysis.keyAttributes}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Recomendado Para</Text>
                  <Text style={styles.detailText}>
                    {analysis.recommendedFor}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Por Qué Esta Pala</Text>
                  <Text style={styles.detailText}>
                    {analysis.whyThisRacket}
                  </Text>
                </View>

                <View style={styles.prosConsContainer}>
                  <View style={styles.prosSection}>
                    <Text style={styles.prosTitle}>Pros</Text>
                    {analysis.pros.map((pro, proIndex) => (
                      <View key={proIndex} style={styles.prosConsItem}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#4CAF50"
                        />
                        <Text style={styles.prosConsText}>{pro}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.consSection}>
                    <Text style={styles.consTitle}>Contras</Text>
                    {analysis.cons.map((con, conIndex) => (
                      <View key={conIndex} style={styles.prosConsItem}>
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color="#F44336"
                        />
                        <Text style={styles.prosConsText}>{con}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.priceSection}>
                  <Text style={styles.priceLabel}>Precio: </Text>
                  <Text style={styles.priceValue}>
                    €{selectedRackets[index]?.precio_actual}
                  </Text>
                  {selectedRackets[index]?.en_oferta && (
                    <Text style={styles.originalPriceSmall}>
                      €{selectedRackets[index]?.precio_original}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}

          {/* Final Recommendation */}
          <View style={styles.finalRecommendationSection}>
            <Text style={styles.finalRecommendationTitle}>
              Recomendación Final
            </Text>
            <Text style={styles.finalRecommendationText}>
              {comparisonResults.finalRecommendation}
            </Text>
          </View>
        </ScrollView>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Comparar Palas de Pádel</Text>
        <Text style={styles.subtitle}>
          Selecciona 2-3 palas para obtener una comparación detallada con IA
        </Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            onChangeText={setSearchQuery}
            value={searchQuery}
            placeholder="Buscar palas por nombre o marca..."
            placeholderTextColor="#999"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.brandFilter}
        >
          {uniqueBrands.map((brand) => (
            <TouchableOpacity
              key={brand}
              style={[
                styles.brandFilterButton,
                selectedBrand === brand && styles.activeBrandFilter,
              ]}
              onPress={() => setSelectedBrand(brand)}
            >
              <Text
                style={[
                  styles.brandFilterText,
                  selectedBrand === brand && styles.activeBrandFilterText,
                ]}
              >
                {brand}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Selected rackets indicator */}
      {selectedRackets.length > 0 && (
        <View style={styles.selectionIndicatorBar}>
          <Text style={styles.selectionText}>
            {selectedRackets.length} pala{selectedRackets.length > 1 ? "s" : ""}{" "}
            seleccionada{selectedRackets.length > 1 ? "s" : ""}
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              onPress={clearSelection}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
            <View style={styles.compareButtonContainer}>
              <Button
                title={`Comparar${
                  selectedRackets.length > 1
                    ? ` (${selectedRackets.length})`
                    : ""
                }`}
                onPress={handleCompareRackets}
                disabled={selectedRackets.length < 2 || isLoading}
              />
            </View>
          </View>
        </View>
      )}

      {/* Rackets list */}
      <ScrollView
        style={styles.racketsList}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.racketsGrid}>
          {filteredRackets.map(renderRacketCard)}
        </View>
      </ScrollView>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Analizando palas con IA...</Text>
          </View>
        </View>
      )}

      {/* Comparison modal */}
      {renderComparisonModal()}
    </View>
  );
}

// StyleSheet with modern design
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    lineHeight: 22,
  },
  searchFilterContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#2c3e50",
  },
  brandFilter: {
    flexDirection: "row",
  },
  brandFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  activeBrandFilter: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  brandFilterText: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  activeBrandFilterText: {
    color: "#fff",
  },
  selectionIndicatorBar: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  selectionActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  clearButtonText: {
    color: "#dc3545",
    fontSize: 14,
    fontWeight: "500",
  },
  compareButtonContainer: {
    minWidth: 100,
  },
  racketsList: {
    flex: 1,
  },
  racketsGrid: {
    paddingHorizontal: 8,
    paddingVertical: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    gap: 8,
  },
  racketCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
    width:
      screenWidth > 1200
        ? (screenWidth - 40) / 4 - 8
        : screenWidth > 800
        ? (screenWidth - 32) / 3 - 8
        : screenWidth > 500
        ? (screenWidth - 24) / 3 - 8
        : (screenWidth - 24) / 2 - 8,
    height: 370,
  },
  selectedRacketCard: {
    borderColor: "#4CAF50",
  },
  selectionIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 1,
  },
  imageContainer: {
    width: "100%",
    height: 190,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  racketImage: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: "contain",
  },
  racketInfo: {
    padding: 14,
    flex: 1,
    justifyContent: "space-between",
  },
  racketTopInfo: {
    marginBottom: 8,
  },
  racketBottomInfo: {
    marginTop: "auto",
  },
  racketBrand: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 2,
  },
  racketName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    lineHeight: 18,
    minHeight: 36,
  },
  priceContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e74c3c",
    marginRight: 4,
  },
  originalPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  originalPrice: {
    fontSize: 12,
    color: "#95a5a6",
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  discountBadge: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  discountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 4,
  },
  bestsellerBadge: {
    backgroundColor: "#f39c12",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  offerBadge: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  analysisSection: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 16,
    color: "#34495e",
    lineHeight: 24,
  },
  racketAnalysisSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  racketHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  comparisonImageContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  comparisonRacketImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    resizeMode: "contain",
  },
  racketTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  racketTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  racketBrandSmall: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  analysisDetails: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 15,
    color: "#34495e",
    lineHeight: 22,
  },
  prosConsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  prosSection: {
    flex: 1,
    marginRight: 10,
  },
  consSection: {
    flex: 1,
    marginLeft: 10,
  },
  prosTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 10,
  },
  consTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 10,
  },
  prosConsItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  prosConsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#34495e",
    lineHeight: 20,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  priceLabel: {
    fontSize: 16,
    color: "#34495e",
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e74c3c",
    marginRight: 8,
  },
  originalPriceSmall: {
    fontSize: 14,
    color: "#95a5a6",
    textDecorationLine: "line-through",
  },
  finalRecommendationSection: {
    backgroundColor: "#4CAF50",
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  finalRecommendationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  finalRecommendationText: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 24,
  },
});

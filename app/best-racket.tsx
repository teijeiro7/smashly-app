// Import React library and hooks for creating components
import React, { useState } from "react";
import { RacketImage } from "../src/components/ui/racket-image";
// Import React Native components for UI
import {
  Alert,
  Dimensions,
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
import { router } from "expo-router";
import { Button } from "../src/components/ui/button";
import { Input } from "../src/components/ui/input";
// Import Gemini API functions
import {
  getRacketRecommendations,
  MultipleRacketRecommendations,
  RacketRecommendation,
} from "../src/utils/gemini";

// Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get("window");

// Simplified interface for form data structure
interface FormData {
  // Game Experience
  gameLevel: "Principiante" | "Intermedio" | "Avanzado" | "";
  playingStyle: "Defensivo" | "Polivalente" | "Ofensivo" | "";

  // Physical Characteristics
  weight: string;
  height: string;

  // Budget and Preferences
  budget: string;
  shape: "Redonda" | "Lágrima" | "Diamante" | "";
}

// Interface for recommendation response
interface RecommendationResponse {
  success: boolean;
  recommendations?: MultipleRacketRecommendations;
  error?: string;
}

// Enhanced Best Racket Finder screen component with multiple recommendations
export default function BestRacketScreen() {
  // State for loading during form submission
  const [isLoading, setIsLoading] = useState(false);
  // State for showing recommendation modal
  const [showRecommendation, setShowRecommendation] = useState(false);
  // State for storing the AI recommendations
  const [recommendations, setRecommendations] =
    useState<MultipleRacketRecommendations | null>(null);
  // State for tracking which recommendation is currently selected (0, 1, or 2)
  const [selectedRecommendationIndex, setSelectedRecommendationIndex] =
    useState(0);

  // State for simplified form data
  const [formData, setFormData] = useState<FormData>({
    gameLevel: "",
    playingStyle: "",
    weight: "",
    height: "",
    budget: "",
    shape: "",
  });

  // Helper function to update form data
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Form validation function
  const validateForm = () => {
    if (!formData.gameLevel) {
      Alert.alert("Error", "Por favor selecciona tu nivel de juego");
      return false;
    }
    if (!formData.playingStyle) {
      Alert.alert("Error", "Por favor selecciona tu estilo de juego");
      return false;
    }
    if (!formData.weight) {
      Alert.alert("Error", "Por favor introduce tu peso");
      return false;
    }
    if (!formData.height) {
      Alert.alert("Error", "Por favor introduce tu altura");
      return false;
    }
    if (!formData.budget) {
      Alert.alert("Error", "Por favor introduce tu presupuesto máximo");
      return false;
    }
    if (!formData.shape) {
      Alert.alert("Error", "Por favor selecciona la forma preferida de pala");
      return false;
    }
    return true;
  };

  // Form submission handler with Gemini AI integration for multiple recommendations
  const handleSubmit = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log("Enviando datos del formulario:", formData);

      // Call Gemini API for multiple racket recommendations
      const result: RecommendationResponse = await getRacketRecommendations(
        formData
      );

      console.log("Resultado recibido:", result);

      if (result.success && result.recommendations) {
        // Show recommendations in modal
        setRecommendations(result.recommendations);
        setSelectedRecommendationIndex(0); // Start with the most recommended option
        setShowRecommendation(true);
      } else {
        // Show specific error message
        Alert.alert(
          "Error",
          result.error ||
            "No se pudo obtener recomendaciones. Inténtalo de nuevo."
        );
      }
    } catch (error: any) {
      console.error("Error inesperado:", error);
      Alert.alert(
        "Error inesperado",
        "Ocurrió un error inesperado. Por favor, verifica tu conexión e inténtalo de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to close recommendation modal
  const closeRecommendation = () => {
    setShowRecommendation(false);
    setRecommendations(null);
    setSelectedRecommendationIndex(0);
  };

  // Get the currently selected recommendation
  const selectedRecommendation =
    recommendations?.recommendations[selectedRecommendationIndex];

  // Component for recommendation selector tabs
  const RecommendationTabs = () => (
    <View style={styles.tabsContainer}>
      {recommendations?.recommendations.map((rec, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.tab,
            selectedRecommendationIndex === index && styles.activeTab,
          ]}
          onPress={() => setSelectedRecommendationIndex(index)}
        >
          <View style={styles.tabContent}>
            <Text
              style={[
                styles.tabNumber,
                selectedRecommendationIndex === index && styles.activeTabNumber,
              ]}
            >
              {index + 1}
            </Text>
            <Text
              style={[
                styles.tabLabel,
                selectedRecommendationIndex === index && styles.activeTabLabel,
              ]}
            >
              {index === 0 ? "Recomendada" : `Opción ${index + 1}`}
            </Text>
            <View
              style={[
                styles.matchBadge,
                selectedRecommendationIndex === index &&
                  styles.activeMatchBadge,
              ]}
            >
              <Text
                style={[
                  styles.matchText,
                  selectedRecommendationIndex === index &&
                    styles.activeMatchText,
                ]}
              >
                {rec.matchPercentage}%
              </Text>
            </View>
          </View>
          {index === 0 && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>TOP</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // Wider component for radio button selection with better spacing
  const RadioButton = ({
    options,
    selected,
    onSelect,
    title,
  }: {
    options: string[];
    selected: string;
    onSelect: (value: string) => void;
    title: string;
  }) => (
    <View style={styles.radioGroup}>
      <Text style={styles.radioTitle}>{title}</Text>
      <View style={styles.radioOptionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.radioOption,
              selected === option && styles.radioOptionSelected,
            ]}
            onPress={() => onSelect(option)}
          >
            <View
              style={[
                styles.radioCircle,
                selected === option && styles.radioSelected,
              ]}
            >
              {selected === option && <View style={styles.radioInner} />}
            </View>
            <Text
              style={[
                styles.radioText,
                selected === option && styles.radioTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Component for rendering technical specifications
  const TechnicalSpecs = ({
    specs,
  }: {
    specs: RacketRecommendation["technicalSpecs"];
  }) => (
    <View style={styles.specsContainer}>
      <Text style={styles.specsTitle}>Especificaciones Técnicas</Text>
      <View style={styles.specsGrid}>
        <View style={styles.specItem}>
          <Ionicons name="fitness" size={20} color="#16a34a" />
          <Text style={styles.specLabel}>Peso</Text>
          <Text style={styles.specValue}>{specs.weight}</Text>
        </View>
        <View style={styles.specItem}>
          <Ionicons name="scale" size={20} color="#16a34a" />
          <Text style={styles.specLabel}>Balance</Text>
          <Text style={styles.specValue}>{specs.balance}</Text>
        </View>
        <View style={styles.specItem}>
          <Ionicons name="shapes" size={20} color="#16a34a" />
          <Text style={styles.specLabel}>Forma</Text>
          <Text style={styles.specValue}>{specs.shape}</Text>
        </View>
        <View style={styles.specItem}>
          <Ionicons name="build" size={20} color="#16a34a" />
          <Text style={styles.specLabel}>Material</Text>
          <Text style={styles.specValue}>{specs.material}</Text>
        </View>
      </View>
    </View>
  );

  // Component for pros and cons
  const ProsAndCons = ({ pros, cons }: { pros: string[]; cons: string[] }) => (
    <View style={styles.prosConsContainer}>
      <View style={styles.prosContainer}>
        <Text style={styles.prosTitle}>
          <Ionicons name="checkmark-circle" size={18} color="#16a34a" />{" "}
          Ventajas
        </Text>
        {pros.map((pro, index) => (
          <View key={index} style={styles.proItem}>
            <Ionicons name="checkmark" size={16} color="#16a34a" />
            <Text style={styles.proText}>{pro}</Text>
          </View>
        ))}
      </View>

      <View style={styles.consContainer}>
        <Text style={styles.consTitle}>
          <Ionicons name="alert-circle" size={18} color="#f59e0b" />{" "}
          Consideraciones
        </Text>
        {cons.map((con, index) => (
          <View key={index} style={styles.conItem}>
            <Ionicons name="warning" size={16} color="#f59e0b" />
            <Text style={styles.conText}>{con}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section with more padding */}
        <View style={styles.heroSection}>
          <Text style={styles.mainTitle}>
            Encuentra tu <Text style={styles.highlightText}>Pala Ideal</Text>
          </Text>
          <Text style={styles.subtitle}>
            Completa nuestro formulario y obtén 3 recomendaciones personalizadas
            generadas por IA
          </Text>
        </View>

        {/* Wider form container (60% of screen) */}
        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            {/* Form header with icon */}
            <View style={styles.formHeader}>
              <View style={styles.formIconContainer}>
                <Ionicons name="tennisball" size={28} color="#16a34a" />
              </View>
              <Text style={styles.formTitle}>Cuéntanos sobre tu juego</Text>
              <Text style={styles.formSubtitle}>
                Nuestra IA analizará tu perfil y te recomendará las 3 mejores
                palas
              </Text>
            </View>

            {/* Form content with wider layout */}
            <View style={styles.formContent}>
              {/* Game Level Selection */}
              <RadioButton
                title="¿Cuál es tu nivel de juego?"
                options={["Principiante", "Intermedio", "Avanzado"]}
                selected={formData.gameLevel}
                onSelect={(value) => updateFormData("gameLevel", value)}
              />

              {/* Playing Style Selection */}
              <RadioButton
                title="¿Cuál es tu estilo de juego?"
                options={["Defensivo", "Polivalente", "Ofensivo"]}
                selected={formData.playingStyle}
                onSelect={(value) => updateFormData("playingStyle", value)}
              />

              {/* Physical Characteristics Section */}
              <View style={styles.physicalSection}>
                <Text style={styles.sectionTitle}>Características físicas</Text>
                <Text style={styles.sectionDescription}>
                  Estas medidas nos ayudan a recomendarte el peso y balance
                  adecuado
                </Text>

                <View style={styles.physicalInputs}>
                  <View style={styles.halfInput}>
                    <Input
                      label="Peso corporal (kg)"
                      placeholder="Ej: 75"
                      value={formData.weight}
                      onChangeText={(value) => updateFormData("weight", value)}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Input
                      label="Altura (cm)"
                      placeholder="Ej: 180"
                      value={formData.height}
                      onChangeText={(value) => updateFormData("height", value)}
                    />
                  </View>
                </View>
              </View>

              {/* Budget Section */}
              <View style={styles.budgetSection}>
                <Input
                  label="Presupuesto máximo (€)"
                  placeholder="Ej: 200"
                  value={formData.budget}
                  onChangeText={(value) => updateFormData("budget", value)}
                />
                <Text style={styles.inputHelper}>
                  Te mostraremos 3 opciones dentro de tu rango de precio
                </Text>
              </View>

              {/* Racket Shape Preference */}
              <View style={styles.shapeSection}>
                <RadioButton
                  title="¿Qué forma de pala prefieres?"
                  options={["Redonda", "Lágrima", "Diamante"]}
                  selected={formData.shape}
                  onSelect={(value) => updateFormData("shape", value)}
                />
                <Text style={styles.inputHelper}>
                  Cada forma ofrece diferentes características de control y
                  potencia
                </Text>
              </View>

              {/* Submit button with wider styling */}
              <View style={styles.submitSection}>
                <Button
                  title={
                    isLoading
                      ? "Analizando tu perfil..."
                      : "Obtener 3 Recomendaciones con IA"
                  }
                  onPress={handleSubmit}
                  loading={isLoading}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Recommendation Modal with Multiple Options */}
      <Modal
        visible={showRecommendation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeRecommendation}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeRecommendation}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>

            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="sparkles" size={32} color="#16a34a" />
              </View>
              <Text style={styles.modalTitle}>Tus Palas Ideales</Text>
              <Text style={styles.modalSubtitle}>
                3 recomendaciones personalizadas generadas por IA
              </Text>
            </View>
          </View>

          {/* Recommendation Tabs */}
          {recommendations && <RecommendationTabs />}

          {/* Summary Section */}
          {recommendations && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>{recommendations.summary}</Text>
            </View>
          )}

          {/* Modal Content */}
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContentContainer}
          >
            {selectedRecommendation && (
              <>
                {/* Racket Card */}
                <View style={styles.racketCard}>
                  <View style={styles.racketHeader}>
                    <View style={styles.racketImageContainer}>
                      <RacketImage
                        imageUrl={selectedRecommendation.imageUrl}
                        brand={selectedRecommendation.brand}
                        model={selectedRecommendation.model}
                        style={styles.racketImageStyle}
                        showLoadingIndicator={true}
                        showErrorState={true}
                      />
                      <View style={styles.priceTag}>
                        <Text style={styles.priceText}>
                          {selectedRecommendation.price}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.racketInfo}>
                      <Text style={styles.brandText}>
                        {selectedRecommendation.brand}
                      </Text>
                      <Text style={styles.modelText}>
                        {selectedRecommendation.model}
                      </Text>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>
                          {selectedRecommendation.technicalSpecs.level}
                        </Text>
                      </View>
                      <View style={styles.compatibilityBadge}>
                        <Text style={styles.compatibilityText}>
                          {selectedRecommendation.matchPercentage}% Compatible
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Why This Racket */}
                <View style={styles.sectionCard}>
                  <Text style={styles.cardTitle}>
                    <Ionicons name="bulb" size={20} color="#16a34a" /> ¿Por qué
                    esta pala?
                  </Text>
                  <Text style={styles.descriptionText}>
                    {selectedRecommendation.whyThisRacket}
                  </Text>
                </View>

                {/* Technical Specifications */}
                <View style={styles.sectionCard}>
                  <TechnicalSpecs
                    specs={selectedRecommendation.technicalSpecs}
                  />
                </View>

                {/* Pros and Cons */}
                <View style={styles.sectionCard}>
                  <ProsAndCons
                    pros={selectedRecommendation.pros}
                    cons={selectedRecommendation.cons}
                  />
                </View>
              </>
            )}
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <Button
              title="Nueva Búsqueda"
              onPress={closeRecommendation}
              variant="outline"
            />
            <Button
              title="¡Perfecto!"
              onPress={() => {
                closeRecommendation();
                router.push("/");
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

// Enhanced StyleSheet with new styles for multiple recommendations
const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: "#f8faf8",
  },

  // Scroll container for better centering
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 30,
  },

  // Hero section with more space
  heroSection: {
    paddingHorizontal: 32,
    paddingVertical: 30,
    alignItems: "center",
    backgroundColor: "#f8faf8",
  },

  // Main title with better sizing
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 36,
  },

  // Highlighted text
  highlightText: {
    color: "#16a34a",
  },

  // Subtitle with more description
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Form container with 60% width
  formContainer: {
    paddingHorizontal: 32,
    paddingBottom: 30,
    alignItems: "center",
  },

  // ✅ CORRECCIÓN: Eliminar sintaxis CSS y usar solo números
  formCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 32,
    width: Math.min(screenWidth * 0.6, 600),
    minWidth: screenWidth > 768 ? 480 : screenWidth * 0.9,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },

  // Form header section
  formHeader: {
    alignItems: "center",
    marginBottom: 28,
  },

  // Form icon container with larger size
  formIconContainer: {
    alignItems: "center",
    marginBottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignSelf: "center",
  },

  // Form title with better sizing
  formTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },

  // Form subtitle for better context
  formSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // Form content container
  formContent: {
    gap: 24,
  },

  // Radio group with more spacing
  radioGroup: {
    marginBottom: 4,
  },

  // Radio title with better sizing
  radioTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 14,
  },

  // Radio options container
  radioOptionsContainer: {
    gap: 10,
  },

  // Radio option with more padding
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "transparent",
  },

  // Selected radio option
  radioOptionSelected: {
    backgroundColor: "#f0f9ff",
    borderColor: "#16a34a",
  },

  // Radio circle with better sizing
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // Radio selected
  radioSelected: {
    borderColor: "#16a34a",
  },

  // Radio inner circle
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16a34a",
  },

  // Radio text with better sizing
  radioText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },

  // Selected radio text
  radioTextSelected: {
    color: "#16a34a",
    fontWeight: "600",
  },

  // Physical section with better spacing
  physicalSection: {
    marginBottom: 4,
  },

  // Section title with better styling
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 6,
  },

  // Section description for better UX
  sectionDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 14,
    lineHeight: 18,
  },

  // Physical inputs container
  physicalInputs: {
    flexDirection: "row",
    gap: 16,
  },

  // Half width input
  halfInput: {
    flex: 1,
  },

  // Budget section with more spacing
  budgetSection: {
    marginBottom: 4,
  },

  // Shape section
  shapeSection: {
    marginBottom: 4,
  },

  // Input helper text
  inputHelper: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
    lineHeight: 16,
    fontStyle: "italic",
  },

  // Submit section with better spacing
  submitSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },

  // Modal Container
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8faf8",
  },

  // Modal Header
  modalHeader: {
    backgroundColor: "white",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // Modal Header Content
  modalHeaderContent: {
    alignItems: "center",
  },

  // Modal Icon Container
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  // Modal Title
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },

  // Modal Subtitle
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },

  // Close Button
  closeButton: {
    position: "absolute",
    top: 60,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },

  // Tabs Container
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  // Individual Tab
  tab: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },

  // Active Tab
  activeTab: {
    backgroundColor: "#f0f9ff",
    borderColor: "#16a34a",
  },

  // Tab Content
  tabContent: {
    alignItems: "center",
    gap: 4,
  },

  // Tab Number
  tabNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6b7280",
  },

  // Active Tab Number
  activeTabNumber: {
    color: "#16a34a",
  },

  // Tab Label
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
    textAlign: "center",
  },

  // Active Tab Label
  activeTabLabel: {
    color: "#16a34a",
    fontWeight: "600",
  },

  // Match Badge
  matchBadge: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },

  // Active Match Badge
  activeMatchBadge: {
    backgroundColor: "#dcfce7",
  },

  // Match Text
  matchText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6b7280",
  },

  // Active Match Text
  activeMatchText: {
    color: "#16a34a",
  },

  // Recommended Badge (only for first option)
  recommendedBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  // Recommended Text
  recommendedText: {
    color: "white",
    fontSize: 8,
    fontWeight: "700",
  },

  // Summary Container
  summaryContainer: {
    backgroundColor: "#f0f9ff",
    margin: 24,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a",
  },

  // Summary Text
  summaryText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    fontStyle: "italic",
  },

  // Modal Content
  modalContent: {
    flex: 1,
  },

  // Modal Content Container
  modalContentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 20,
  },

  // Racket Card
  racketCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Racket Header
  racketHeader: {
    flexDirection: "row",
    gap: 20,
  },

  // Racket Image Container
  racketImageContainer: {
    position: "relative",
    width: 120,
    height: 160,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // ✅ NUEVO: Estilo para RacketImage
  racketImageStyle: {
    width: 100,
    height: 140,
    borderRadius: 8,
  },

  // Price Tag
  priceTag: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  // Price Text
  priceText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  // Racket Info
  racketInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },

  // Brand Text
  brandText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },

  // Model Text
  modelText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },

  // Level Badge
  levelBadge: {
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },

  // Level Text
  levelText: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "600",
  },

  // Compatibility Badge
  compatibilityBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },

  // Compatibility Text
  compatibilityText: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "700",
  },

  // Section Card
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Card Title
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  // Description Text
  descriptionText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },

  // Specs Container
  specsContainer: {
    gap: 16,
  },

  // Specs Title
  specsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },

  // Specs Grid
  specsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  // Spec Item
  specItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    minWidth: "45%",
    gap: 4,
  },

  // Spec Label
  specLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },

  // Spec Value
  specValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
  },

  // Pros and Cons Container
  prosConsContainer: {
    gap: 16,
  },

  // Pros Container
  prosContainer: {
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    padding: 16,
  },

  // Pros Title
  prosTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#16a34a",
    marginBottom: 12,
  },

  // Pro Item
  proItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },

  // Pro Text
  proText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    lineHeight: 20,
  },

  // Cons Container
  consContainer: {
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    padding: 16,
  },

  // Cons Title
  consTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f59e0b",
    marginBottom: 12,
  },

  // Con Item
  conItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },

  // Con Text
  conText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    lineHeight: 20,
  },

  // Modal Footer
  modalFooter: {
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    flexDirection: "row",
    gap: 12,
  },
});

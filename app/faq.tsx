// Import React library and hooks for creating components
import React, { useState } from "react";
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

// Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get("window");

// Interface for FAQ item structure
interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

// FAQ screen component with expandable questions and answers
export default function FAQScreen() {
  // State to track which FAQ item is currently expanded
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  // State to track active category filter
  const [activeCategory, setActiveCategory] = useState<string>("Todas");

  // Array of FAQ data with different categories
  const faqData: FAQItem[] = [
    {
      id: 1,
      question: "¿Qué es Smashly y cómo funciona?",
      answer:
        "Smashly es una aplicación móvil diseñada para jugadores de pádel amateur que te permite conectar con otros jugadores, reservar pistas, organizar partidos y acceder a un comparador de palas. La app utiliza tu ubicación para encontrar jugadores y pistas cercanas, y te ayuda a mejorar tu experiencia de juego.",
      category: "General",
    },
    {
      id: 2,
      question: "¿Es gratuita la aplicación?",
      answer:
        "Sí, Smashly es completamente gratuita para descargar y usar. Ofrecemos todas las funciones básicas sin costo, incluyendo la búsqueda de jugadores, el comparador de palas y la organización de partidos. Algunas funciones premium estarán disponibles en el futuro.",
      category: "General",
    },
    {
      id: 3,
      question: "¿Cómo puedo encontrar jugadores cerca de mí?",
      answer:
        "Una vez que te registres y permitas el acceso a tu ubicación, Smashly te mostrará otros jugadores de pádel en tu área. Puedes filtrar por nivel de juego, disponibilidad horaria y distancia. También puedes unirte a grupos locales y participar en eventos organizados.",
      category: "Jugadores",
    },
    {
      id: 4,
      question: "¿Puedo reservar pistas a través de la app?",
      answer:
        "Sí, trabajamos con múltiples centros deportivos y clubes de pádel para ofrecerte la posibilidad de reservar pistas directamente desde la aplicación. Puedes ver disponibilidad en tiempo real, comparar precios y confirmar tu reserva al instante.",
      category: "Reservas",
    },
    {
      id: 5,
      question: "¿Cómo funciona el comparador de palas?",
      answer:
        "Nuestro comparador de palas te permite comparar hasta 3 modelos diferentes lado a lado. Incluye especificaciones técnicas, precios, opiniones de usuarios y recomendaciones personalizadas basadas en tu nivel y estilo de juego. También puedes ver las palas más populares entre la comunidad.",
      category: "Palas",
    },
    {
      id: 6,
      question: "¿Qué información necesito para registrarme?",
      answer:
        "Solo necesitas tu nombre, email y crear una contraseña. Opcionalmente, puedes añadir información sobre tu nivel de juego, ubicación y preferencias para obtener mejores recomendaciones y conectar con jugadores compatibles.",
      category: "Cuenta",
    },
    {
      id: 7,
      question: "¿Es seguro compartir mi información personal?",
      answer:
        "La seguridad y privacidad de tus datos es nuestra prioridad. Nunca compartimos tu información personal con terceros sin tu consentimiento. Solo mostramos a otros usuarios la información que elijas hacer pública, como tu nombre y nivel de juego.",
      category: "Seguridad",
    },
    {
      id: 8,
      question: "¿Puedo cancelar una reserva o partido organizado?",
      answer:
        "Sí, puedes cancelar reservas y partidos con al menos 2 horas de anticipación sin penalización. Para cancelaciones de último minuto, pueden aplicarse políticas específicas del centro deportivo. Siempre recomendamos avisar a otros jugadores lo antes posible.",
      category: "Reservas",
    },
    {
      id: 9,
      question: "¿Qué hago si tengo problemas con otros jugadores?",
      answer:
        "Tenemos un sistema de reportes y valoraciones para mantener una comunidad segura y respetuosa. Puedes reportar comportamientos inapropiados directamente desde la app. Nuestro equipo revisa todos los reportes y toma medidas cuando es necesario.",
      category: "Seguridad",
    },
    {
      id: 10,
      question: "¿La app está disponible en iOS y Android?",
      answer:
        "Actualmente estamos en desarrollo y pronto estaremos disponibles tanto para iOS como para Android. Puedes registrarte en nuestra lista de espera para ser notificado tan pronto como lancemos la aplicación en tu plataforma.",
      category: "Técnico",
    },
  ];

  // Array of categories for filtering
  const categories = [
    "Todas",
    "General",
    "Jugadores",
    "Reservas",
    "Palas",
    "Cuenta",
    "Seguridad",
    "Técnico",
  ];

  // Filter FAQ items based on selected category
  const filteredFAQ =
    activeCategory === "Todas"
      ? faqData
      : faqData.filter((item) => item.category === activeCategory);

  // Function to toggle FAQ item expansion
  const toggleExpansion = (id: number) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero section */}
      <View style={styles.heroSection}>
        {/* Main title */}
        <Text style={styles.mainTitle}>
          Preguntas <Text style={styles.highlightText}>Frecuentes</Text>
        </Text>

        {/* Subtitle description */}
        <Text style={styles.subtitle}>
          Encuentra respuestas a las preguntas más comunes sobre Smashly
        </Text>
      </View>

      {/* Category filter section */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                activeCategory === category && styles.activeCategoryButton,
              ]}
              onPress={() => setActiveCategory(category)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  activeCategory === category &&
                    styles.activeCategoryButtonText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* FAQ items section */}
      <View style={styles.faqSection}>
        {filteredFAQ.map((item) => (
          <View key={item.id} style={styles.faqItem}>
            {/* Question header - clickable to expand/collapse */}
            <TouchableOpacity
              style={styles.questionHeader}
              onPress={() => toggleExpansion(item.id)}
              activeOpacity={0.7}
            >
              {/* Question text */}
              <Text style={styles.questionText}>{item.question}</Text>

              {/* Expand/collapse icon */}
              <Ionicons
                name={expandedItem === item.id ? "chevron-up" : "chevron-down"}
                size={24}
                color="#16a34a"
                style={styles.chevronIcon}
              />
            </TouchableOpacity>

            {/* Answer section - only visible when expanded */}
            {expandedItem === item.id && (
              <View style={styles.answerContainer}>
                {/* Category badge */}
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>

                {/* Answer text */}
                <Text style={styles.answerText}>{item.answer}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Contact section */}
      <View style={styles.contactSection}>
        <View style={styles.contactCard}>
          {/* Contact icon */}
          <View style={styles.contactIconContainer}>
            <Ionicons name="help-circle" size={32} color="#16a34a" />
          </View>

          {/* Contact content */}
          <Text style={styles.contactTitle}>¿No encuentras lo que buscas?</Text>
          <Text style={styles.contactDescription}>
            Nuestro equipo de soporte está aquí para ayudarte con cualquier
            pregunta adicional
          </Text>

          {/* Contact button */}
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="mail" size={16} color="white" />
            <Text style={styles.contactButtonText}>Contactar soporte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// StyleSheet with design matching the app's visual identity
const styles = StyleSheet.create({
  // Main container with light background
  container: {
    flex: 1,
    backgroundColor: "#f8faf8", // Very light green background matching other screens
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

  // Highlighted text in green
  highlightText: {
    color: "#16a34a", // Green color matching app theme
  },

  // Subtitle styling
  subtitle: {
    fontSize: 16,
    color: "#6b7280", // Gray text
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Category filter section
  categorySection: {
    paddingVertical: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },

  // Category scroll container
  categoryScrollContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },

  // Individual category button
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  // Active category button styling
  activeCategoryButton: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },

  // Category button text
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },

  // Active category button text
  activeCategoryButtonText: {
    color: "white",
    fontWeight: "600",
  },

  // FAQ section container
  faqSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },

  // Individual FAQ item container
  faqItem: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // Question header (clickable area)
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "white",
  },

  // Question text styling
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    lineHeight: 24,
    marginRight: 12,
  },

  // Chevron icon for expand/collapse
  chevronIcon: {
    marginLeft: 8,
  },

  // Answer container (expandable section)
  answerContainer: {
    padding: 20,
    paddingTop: 0,
    backgroundColor: "#f9fafb",
  },

  // Category badge in answer section
  categoryBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
  },

  // Category badge text
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#16a34a",
  },

  // Answer text styling
  answerText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
  },

  // Contact section at bottom
  contactSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // Contact card container
  contactCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },

  // Contact icon container
  contactIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  // Contact title
  contactTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },

  // Contact description
  contactDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },

  // Contact button
  contactButton: {
    backgroundColor: "#16a34a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },

  // Contact button text
  contactButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

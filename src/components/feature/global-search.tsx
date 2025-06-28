// Import React library and hooks for creating components
import React, { useEffect, useRef, useState } from "react";
// Import React Native components for UI
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// Import Ionicons for vector icons
import { Ionicons } from "@expo/vector-icons";
// Import router for navigation
import { router } from "expo-router";
// Import rackets data
import racketData from "../../../palas_padel.json";
// Import racket type
import { Racket } from "../../utils/gemini";

// Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get("window");

// Interface for the search component props
interface GlobalSearchProps {
  onSearchToggle?: (isOpen: boolean) => void;
}

// Global Search component with expandable search bar
export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onSearchToggle,
}) => {
  // State for search functionality
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Racket[]>([]);

  // Animation references
  const searchWidthAnim = useRef(new Animated.Value(0)).current;
  const searchOpacityAnim = useRef(new Animated.Value(0)).current;
  const dropdownOpacityAnim = useRef(new Animated.Value(0)).current;

  // Reference for TextInput
  const searchInputRef = useRef<TextInput>(null);

  // Mapped rackets data
  const [rackets] = useState<Racket[]>(() => {
    return racketData.palas.slice(0, 200).map((racket) => ({
      nombre: racket.nombre,
      marca: racket.marca,
      modelo: racket.modelo,
      precio_actual: racket.precio_actual,
      precio_original: racket.precio_original || null,
      descuento_porcentaje: racket.descuento_porcentaje,
      enlace: racket.enlace,
      imagen: racket.imagen,
      es_bestseller: racket.es_bestseller,
      en_oferta: racket.en_oferta,
      scrapeado_en: racket.scrapeado_en,
      fuente: racket.fuente,
    }));
  });

  // Handle search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      Animated.timing(dropdownOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return;
    }

    const filteredRackets = rackets.filter((racket) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        racket.nombre.toLowerCase().includes(searchLower) ||
        racket.marca.toLowerCase().includes(searchLower) ||
        racket.modelo.toLowerCase().includes(searchLower)
      );
    });

    setSearchResults(filteredRackets.slice(0, 10)); // Limit to 10 results

    // Animate dropdown appearance
    if (filteredRackets.length > 0) {
      Animated.timing(dropdownOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [searchQuery, rackets]);

  // Toggle search bar
  const toggleSearch = () => {
    if (isSearchOpen) {
      // Close search
      Animated.parallel([
        Animated.timing(searchWidthAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(searchOpacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      });
    } else {
      // Open search
      setIsSearchOpen(true);
      Animated.parallel([
        Animated.timing(searchWidthAnim, {
          toValue: screenWidth > 600 ? 300 : 200,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(searchOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => {
        searchInputRef.current?.focus();
      });
    }

    onSearchToggle?.(!isSearchOpen);
  };
  // Handle racket selection
  const handleRacketSelect = (racket: Racket) => {
    // Close search
    toggleSearch();

    // Navigate to racket detail page with the racket name as ID
    router.push(`/racket-detail?id=${encodeURIComponent(racket.nombre)}`);
  };

  // Handle search input change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  // Render search result item
  const renderSearchResult = (racket: Racket, index: number) => (
    <TouchableOpacity
      key={`${racket.nombre}-${index}`}
      style={styles.searchResultItem}
      onPress={() => handleRacketSelect(racket)}
    >
      <Image source={{ uri: racket.imagen }} style={styles.resultImage} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultBrand}>{racket.marca}</Text>
        <Text style={styles.resultName} numberOfLines={2}>
          {racket.modelo}
        </Text>
        <View style={styles.resultPriceContainer}>
          <Text style={styles.resultPrice}>€{racket.precio_actual}</Text>
          {racket.en_oferta &&
            racket.precio_original &&
            racket.precio_original > 0 && (
              <Text style={styles.resultOriginalPrice}>
                €{racket.precio_original}
              </Text>
            )}
        </View>
        <View style={styles.resultBadges}>
          {racket.es_bestseller && (
            <View style={styles.resultBestsellerBadge}>
              <Text style={styles.resultBadgeText}>Top</Text>
            </View>
          )}
          {racket.en_oferta && (
            <View style={styles.resultOfferBadge}>
              <Text style={styles.resultBadgeText}>Oferta</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        {/* Search Input - Animated */}
        <Animated.View
          style={[
            styles.searchInputContainer,
            {
              width: searchWidthAnim,
              opacity: searchOpacityAnim,
            },
          ]}
        >
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Buscar palas..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
        </Animated.View>

        {/* Search Icon/Button */}
        <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
          <Ionicons
            name={isSearchOpen ? "close" : "search"}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Search Results Dropdown - Appears directly below search */}
      {isSearchOpen &&
        searchQuery.trim().length > 0 &&
        searchResults.length > 0 && (
          <Animated.View
            style={[
              styles.searchResultsDropdown,
              {
                opacity: dropdownOpacityAnim,
              },
            ]}
          >
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsTitle}>
                Resultados ({searchResults.length})
              </Text>
            </View>

            <ScrollView
              style={styles.searchResultsList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {searchResults.map(renderSearchResult)}
            </ScrollView>
          </Animated.View>
        )}
    </View>
  );
};

// Styles for the search component
const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 8,
    paddingHorizontal: 15,
    height: 36,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    fontSize: 14,
    color: "#333",
    padding: 0,
  },
  searchButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  searchResultsDropdown: {
    position: "absolute",
    top: 45, // Appears right below the search bar
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 8,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    zIndex: 1001,
  },
  searchResultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  closeResultsButton: {
    padding: 4,
  },
  searchResultsList: {
    maxHeight: 250,
  },
  searchResultItem: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resultImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
    resizeMode: "contain",
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  resultBrand: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 2,
  },
  resultName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
    lineHeight: 18,
  },
  resultPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e74c3c",
    marginRight: 6,
  },
  resultOriginalPrice: {
    fontSize: 12,
    color: "#95a5a6",
    textDecorationLine: "line-through",
  },
  resultBadges: {
    flexDirection: "row",
    gap: 4,
  },
  resultBestsellerBadge: {
    backgroundColor: "#f39c12",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultOfferBadge: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
});

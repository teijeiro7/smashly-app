// src/components/ui/racket-image.tsx
import React, { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

interface RacketImageProps {
  imageUrl: string;
  brand: string;
  model: string;
  style?: any;
  showLoadingIndicator?: boolean;
  showErrorState?: boolean;
}

export const RacketImage: React.FC<RacketImageProps> = ({
  imageUrl,
  brand,
  model,
  style,
  showLoadingIndicator = false,
  showErrorState = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadEnd = () => setLoading(false);
  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error && showErrorState) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>{brand}</Text>
        <Text style={styles.errorSubtext}>{model}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        resizeMode="contain"
      />
      {loading && showLoadingIndicator && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#16a34a" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6b7280",
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 10,
    color: "#9ca3af",
    textAlign: "center",
  },
});

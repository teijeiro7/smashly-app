// Import React library and hooks for creating contexts
import React, { createContext, ReactNode, useContext, useState } from "react";
// Import racket type
import { Racket } from "../utils/gemini";

// Interface for comparison context
interface ComparisonContextType {
  rackets: Racket[];
  count: number;
  addRacket: (racket: Racket) => boolean;
  removeRacket: (racketName: string) => void;
  clearComparison: () => void;
  isRacketInComparison: (racketName: string) => boolean;
}

// Create comparison context
const ComparisonContext = createContext<ComparisonContextType | undefined>(
  undefined
);

// Provider component props
interface ComparisonProviderProps {
  children: ReactNode;
}

// Comparison Provider component
export const ComparisonProvider: React.FC<ComparisonProviderProps> = ({
  children,
}) => {
  const [rackets, setRackets] = useState<Racket[]>([]);

  // Add racket to comparison
  const addRacket = (racket: Racket): boolean => {
    // Check if racket is already in comparison
    if (rackets.some((r) => r.nombre === racket.nombre)) {
      return false; // Already exists
    }

    // Check if comparison is full (max 3 rackets)
    if (rackets.length >= 3) {
      return false; // Too many rackets
    }

    // Add racket
    setRackets((prev) => [...prev, racket]);
    return true; // Success
  };

  // Remove racket from comparison
  const removeRacket = (racketName: string) => {
    setRackets((prev) => prev.filter((r) => r.nombre !== racketName));
  };

  // Clear all rackets from comparison
  const clearComparison = () => {
    setRackets([]);
  };

  // Check if racket is in comparison
  const isRacketInComparison = (racketName: string): boolean => {
    return rackets.some((r) => r.nombre === racketName);
  };

  const value: ComparisonContextType = {
    rackets,
    count: rackets.length,
    addRacket,
    removeRacket,
    clearComparison,
    isRacketInComparison,
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
};

// Hook to use comparison context
export const useComparison = (): ComparisonContextType => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
};

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Racket } from "../../types/racket";

// Styled components
const SearchContainer = styled.div`
  position: relative;
  z-index: 1000;
  width: 100%;
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SearchInputContainer = styled(motion.div)<{ isInHeader?: boolean }>`
  position: relative;
  background: ${(props) =>
    props.isInHeader ? "rgba(255, 255, 255, 0.95)" : "white"};
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
  backdrop-filter: ${(props) => (props.isInHeader ? "blur(10px)" : "none")};
  border: ${(props) =>
    props.isInHeader ? "1px solid rgba(255, 255, 255, 0.3)" : "none"};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 45px 12px 16px;
  border: none;
  outline: none;
  font-size: 16px;
  color: #333;
  background: transparent;

  &::placeholder {
    color: #999;
  }
`;

const SearchButton = styled.button`
  position: relative;
  background: linear-gradient(135deg, #16a34a, #15803d);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f0f0f0;
  }
`;

const SearchResultsDropdown = styled(motion.div)`
  position: absolute;
  top: 45px;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  max-height: 400px;
  overflow: hidden;
  z-index: 1001;
`;

const SearchResultsHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SearchResultsTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const SearchResultsList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const SearchResultItem = styled(motion.div)`
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ResultImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: #f8f8f8;
  object-fit: contain;
  flex-shrink: 0;
`;

const ResultInfo = styled.div`
  flex: 1;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const ResultBrand = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
  margin-bottom: 2px;
`;

const ResultName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ResultPriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
`;

const ResultPrice = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #e74c3c;
`;

const ResultOriginalPrice = styled.span`
  font-size: 12px;
  color: #95a5a6;
  text-decoration: line-through;
`;

const ResultBadges = styled.div`
  display: flex;
  gap: 4px;
`;

const ResultBadge = styled.div<{ variant: "bestseller" | "offer" }>`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  color: white;
  background: ${(props) =>
    props.variant === "bestseller" ? "#f39c12" : "#27ae60"};
`;

const NoResults = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
`;

// Interface for component props
interface GlobalSearchProps {
  onSearchToggle?: (isOpen: boolean) => void;
  isInHeader?: boolean;
}

// Main component
export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onSearchToggle,
  isInHeader = false,
}) => {
  // State management
  const [isSearchOpen, setIsSearchOpen] = useState(isInHeader);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Racket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rackets, setRackets] = useState<Racket[]>([]);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Navigation
  const navigate = useNavigate();

  // Load rackets from JSON fallback for now
  useEffect(() => {
    const loadRackets = async () => {
      try {
        const response = await fetch("/palas_padel.json");
        const data = await response.json();
        const palas = data.palas || data;

        const mappedRackets: Racket[] = palas
          .slice(0, 500)
          .map((racket: any) => ({
            id: undefined,
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

        setRackets(mappedRackets);
      } catch (error) {
        console.error("Error loading rackets:", error);
      }
    };

    loadRackets();
  }, []);

  // Effect for header mode - auto focus when mounted
  useEffect(() => {
    if (isInHeader && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isInHeader]);

  // Handle search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);

    // Debounce search
    const timeoutId = setTimeout(() => {
      const filteredRackets = rackets.filter((racket: Racket) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          racket.nombre.toLowerCase().includes(searchLower) ||
          racket.marca.toLowerCase().includes(searchLower) ||
          racket.modelo.toLowerCase().includes(searchLower)
        );
      });

      setSearchResults(filteredRackets.slice(0, 10)); // Limit to 10 results
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, rackets]);

  // Toggle search bar
  const toggleSearch = () => {
    if (isInHeader) {
      // In header mode, close search and notify parent
      setSearchQuery("");
      setSearchResults([]);
      onSearchToggle?.(false);
      return;
    }

    const newIsOpen = !isSearchOpen;
    setIsSearchOpen(newIsOpen);

    if (newIsOpen) {
      // Focus input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Clear search when closing
      setSearchQuery("");
      setSearchResults([]);
    }

    onSearchToggle?.(newIsOpen);
  };

  // Handle racket selection
  const handleRacketSelect = (racket: Racket) => {
    // Close search
    if (isInHeader) {
      setSearchQuery("");
      setSearchResults([]);
      onSearchToggle?.(false);
    } else {
      toggleSearch();
    }

    // Navigate to racket detail page with the racket name as ID
    navigate(`/racket-detail?id=${encodeURIComponent(racket.nombre)}`);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (isInHeader) {
        onSearchToggle?.(false);
      } else {
        toggleSearch();
      }
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  return (
    <SearchContainer>
      <SearchWrapper>
        {/* Animated Search Input */}
        <AnimatePresence>
          {(isSearchOpen || isInHeader) && (
            <SearchInputContainer
              isInHeader={isInHeader}
              initial={
                isInHeader
                  ? { width: "100%", opacity: 1 }
                  : { width: 0, opacity: 0 }
              }
              animate={
                isInHeader
                  ? { width: "100%", opacity: 1 }
                  : { width: 300, opacity: 1 }
              }
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <SearchInput
                ref={searchInputRef}
                placeholder="Buscar palas..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyPress}
              />
              {searchQuery && (
                <ClearButton onClick={clearSearch}>
                  <FiX size={16} />
                </ClearButton>
              )}
            </SearchInputContainer>
          )}
        </AnimatePresence>

        {/* Search Button - Only show if not in header mode */}
        {!isInHeader && (
          <SearchButton onClick={toggleSearch}>
            {isSearchOpen ? <FiX size={20} /> : <FiSearch size={20} />}
          </SearchButton>
        )}
      </SearchWrapper>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {(isSearchOpen || isInHeader) && searchQuery.trim().length > 0 && (
          <SearchResultsDropdown
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <SearchResultsHeader>
              <SearchResultsTitle>
                {isLoading
                  ? "Buscando..."
                  : `Resultados (${searchResults.length})`}
              </SearchResultsTitle>
            </SearchResultsHeader>

            <SearchResultsList>
              {isLoading ? (
                <NoResults>Buscando palas...</NoResults>
              ) : searchResults.length > 0 ? (
                searchResults.map((racket, index) => (
                  <SearchResultItem
                    key={`${racket.nombre}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleRacketSelect(racket)}
                  >
                    <ResultImage
                      src={racket.imagen}
                      alt={racket.modelo}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-racket.svg";
                      }}
                    />
                    <ResultInfo>
                      <ResultBrand>{racket.marca}</ResultBrand>
                      <ResultName>{racket.modelo}</ResultName>
                      <ResultPriceContainer>
                        <ResultPrice>€{racket.precio_actual}</ResultPrice>
                        {racket.en_oferta &&
                          racket.precio_original &&
                          racket.precio_original > 0 && (
                            <ResultOriginalPrice>
                              €{racket.precio_original}
                            </ResultOriginalPrice>
                          )}
                      </ResultPriceContainer>
                      <ResultBadges>
                        {racket.es_bestseller && (
                          <ResultBadge variant="bestseller">Top</ResultBadge>
                        )}
                        {racket.en_oferta && (
                          <ResultBadge variant="offer">Oferta</ResultBadge>
                        )}
                      </ResultBadges>
                    </ResultInfo>
                  </SearchResultItem>
                ))
              ) : (
                <NoResults>
                  No se encontraron palas que coincidan con "{searchQuery}"
                </NoResults>
              )}
            </SearchResultsList>
          </SearchResultsDropdown>
        )}
      </AnimatePresence>
    </SearchContainer>
  );
};

export default GlobalSearch;

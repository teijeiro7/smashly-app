import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import {
  FiChevronRight,
  FiEye,
  FiLayers,
  FiSearch,
  FiStar,
  FiTag,
  FiTarget,
  FiTrendingUp,
  FiZap,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Racket } from "../types/racket";

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  padding: 2rem 0;
`;

const HeroSection = styled.div`
  text-align: center;
  padding: 3rem 0;
  max-width: 800px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
`;

const MainTitle = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 1rem;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HighlightText = styled.span`
  color: #16a34a;
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
  padding: 0 2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0 1rem;
  }
`;

const FeaturesGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
    gap: 1.5rem;
  }
`;

const FeatureCard = styled(motion.div)<{ isRecommended?: boolean }>`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(22, 163, 74, 0.1);
  border: ${(props) =>
    props.isRecommended
      ? "2px solid #16a34a"
      : "1px solid rgba(22, 163, 74, 0.1)"};
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 30px 80px rgba(22, 163, 74, 0.15);
  }
`;

const RecommendedBadge = styled.div`
  position: absolute;
  top: -12px;
  right: 2rem;
  background: #16a34a;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  z-index: 1;
`;

const IconContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: #16a34a;
`;

const FeatureTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const FeatureDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 1rem;
  font-weight: 500;
`;

const FeatureDetailText = styled.p`
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const ActionButton = styled(motion.button)`
  width: 100%;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #15803d 0%, #166534 100%);
    transform: translateY(-2px);
  }
`;

const StatsSection = styled.div`
  max-width: 800px;
  margin: 4rem auto 0;
  padding: 0 2rem;
  text-align: center;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-top: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(22, 163, 74, 0.1);
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #16a34a;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

const CatalogSection = styled.div`
  max-width: 1200px;
  margin: 4rem auto 0;
  padding: 0 2rem;
`;

const CatalogHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const CatalogTitle = styled.h3`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const CatalogSubtitle = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
`;

const SearchAndFilters = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const FilterSelect = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #16a34a;
  }
`;

const RacketsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const RacketCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
`;

const RacketImageContainer = styled.div`
  position: relative;
  height: 200px;
  background: linear-gradient(135deg, #f8fdf8 0%, #f0f9f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const RacketImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const RacketBadge = styled.div<{ variant: "bestseller" | "offer" }>`
  position: absolute;
  top: 0.5rem;
  ${(props) =>
    props.variant === "bestseller" ? "right: 0.5rem;" : "left: 0.5rem;"}
  background: ${(props) =>
    props.variant === "bestseller" ? "#f59e0b" : "#ef4444"};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const RacketInfo = styled.div`
  padding: 1.5rem;
`;

const RacketBrand = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #16a34a;
  margin-bottom: 0.25rem;
`;

const RacketName = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const RacketPriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const RacketPrice = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #ef4444;
`;

const RacketOriginalPrice = styled.div`
  font-size: 0.875rem;
  color: #9ca3af;
  text-decoration: line-through;
`;

const ViewDetailsButton = styled.button`
  width: 100%;
  background: #16a34a;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #15803d;
  }
`;

const LoadMoreButton = styled(motion.button)`
  display: block;
  margin: 2rem auto;
  background: white;
  color: #16a34a;
  border: 2px solid #16a34a;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f9ff;
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const RacketsPage: React.FC = () => {
  const navigate = useNavigate();

  // State for rackets catalog
  const [rackets, setRackets] = useState<Racket[]>([]);
  const [filteredRackets, setFilteredRackets] = useState<Racket[]>([]);
  const [displayedRackets, setDisplayedRackets] = useState<Racket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [displayCount, setDisplayCount] = useState(12);

  // Load rackets data
  useEffect(() => {
    const loadRackets = async () => {
      try {
        setLoading(true);
        const response = await fetch("/palas_padel.json");
        const data = await response.json();

        const mappedRackets: Racket[] = data.palas.map((racket: any) => ({
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
        setFilteredRackets(mappedRackets);
      } catch (error) {
        console.error("Error loading rackets:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRackets();
  }, []);

  // Filter and search effect
  useEffect(() => {
    let filtered = [...rackets];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (racket) =>
          racket.nombre.toLowerCase().includes(query) ||
          racket.marca.toLowerCase().includes(query) ||
          racket.modelo.toLowerCase().includes(query)
      );
    }

    // Apply brand filter
    if (brandFilter) {
      filtered = filtered.filter((racket) => racket.marca === brandFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.precio_actual - b.precio_actual;
        case "price-high":
          return b.precio_actual - a.precio_actual;
        case "brand":
          return a.marca.localeCompare(b.marca);
        case "bestseller":
          return b.es_bestseller ? 1 : -1;
        case "offer":
          return b.en_oferta ? 1 : -1;
        default:
          return a.modelo.localeCompare(b.modelo);
      }
    });

    setFilteredRackets(filtered);
  }, [rackets, searchQuery, brandFilter, sortBy]);

  // Update displayed rackets when filters change
  useEffect(() => {
    setDisplayedRackets(filteredRackets.slice(0, displayCount));
  }, [filteredRackets, displayCount]);

  // Get unique brands for filter
  const uniqueBrands = Array.from(new Set(rackets.map((r) => r.marca))).sort();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleRacketClick = (racket: Racket) => {
    navigate(`/racket-detail?id=${encodeURIComponent(racket.nombre)}`);
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 12);
  };

  const features = [
    {
      id: 1,
      icon: <FiTrendingUp size={32} />,
      title: "Palas más vendidas",
      description: "Descubre las palas favoritas de la comunidad",
      detail:
        "Explora el ranking de las palas más populares entre los jugadores de pádel amateur, con valoraciones reales y opiniones verificadas.",
      action: "Ver ranking de palas",
      path: "/rackets",
      available: false,
    },
    {
      id: 2,
      icon: <FiSearch size={32} />,
      title: "La mejor pala para ti",
      description: "Recomendaciones personalizadas según tu perfil",
      detail:
        "Responde a unas sencillas preguntas sobre tu nivel, estilo de juego y preferencias para recibir recomendaciones personalizadas con IA.",
      action: "Encontrar mi pala ideal",
      path: "/best-racket",
      isRecommended: true,
      available: true,
    },
    {
      id: 3,
      icon: <FiLayers size={32} />,
      title: "Compara palas",
      description: "Analiza las diferencias entre modelos",
      detail:
        "Selecciona hasta 3 modelos diferentes para comparar sus características técnicas, precios y recibir un análisis completo con IA.",
      action: "Comparar palas",
      path: "/compare-rackets",
      available: true,
    },
  ];

  return (
    <Container>
      <HeroSection>
        <MainTitle>
          Comparador de <HighlightText>Palas de Pádel</HighlightText>
        </MainTitle>
        <Subtitle>
          Encuentra la pala perfecta para tu estilo de juego, compara modelos y
          descubre las mejores opciones del mercado con inteligencia artificial.
        </Subtitle>
      </HeroSection>

      <FeaturesGrid>
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.id}
            isRecommended={feature.isRecommended}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={() => feature.available && handleNavigate(feature.path)}
            style={{
              cursor: feature.available ? "pointer" : "default",
              opacity: feature.available ? 1 : 0.7,
            }}
          >
            {feature.isRecommended && (
              <RecommendedBadge>
                <FiStar size={14} style={{ marginRight: "0.25rem" }} />
                Recomendado
              </RecommendedBadge>
            )}

            <IconContainer>{feature.icon}</IconContainer>

            <FeatureTitle>{feature.title}</FeatureTitle>
            <FeatureDescription>{feature.description}</FeatureDescription>
            <FeatureDetailText>{feature.detail}</FeatureDetailText>

            <ActionButton
              whileHover={{ scale: feature.available ? 1.02 : 1 }}
              whileTap={{ scale: feature.available ? 0.98 : 1 }}
              disabled={!feature.available}
              style={{
                background: feature.available
                  ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)"
                  : "#9ca3af",
                cursor: feature.available ? "pointer" : "not-allowed",
              }}
            >
              {feature.available ? (
                <>
                  {feature.isRecommended ? (
                    <FiZap size={16} />
                  ) : (
                    <FiTarget size={16} />
                  )}
                  {feature.action}
                  <FiChevronRight size={16} />
                </>
              ) : (
                <>
                  <FiTarget size={16} />
                  Próximamente
                </>
              )}
            </ActionButton>
          </FeatureCard>
        ))}
      </FeaturesGrid>

      <StatsSection>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            ¿Por qué elegir nuestro comparador?
          </h3>
          <p
            style={{
              fontSize: "1rem",
              color: "#6b7280",
              marginBottom: "2rem",
            }}
          >
            Datos actualizados y análisis con inteligencia artificial
          </p>

          <StatsGrid>
            <StatCard>
              <StatNumber>100+</StatNumber>
              <StatLabel>Palas analizadas</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>AI</StatNumber>
              <StatLabel>Análisis inteligente</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>24/7</StatNumber>
              <StatLabel>Disponible siempre</StatLabel>
            </StatCard>
          </StatsGrid>
        </motion.div>
      </StatsSection>

      {/* Rackets Catalog Section */}
      <CatalogSection>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <CatalogHeader>
            <CatalogTitle>Catálogo de Palas</CatalogTitle>
            <CatalogSubtitle>
              Explora todas las palas disponibles y encuentra la perfecta para
              ti
            </CatalogSubtitle>

            <SearchAndFilters>
              <SearchInput
                type="text"
                placeholder="Buscar por marca, modelo o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <FilterSelect
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
              >
                <option value="">Todas las marcas</option>
                {uniqueBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </FilterSelect>

              <FilterSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Ordenar por nombre</option>
                <option value="brand">Ordenar por marca</option>
                <option value="price-low">Precio: menor a mayor</option>
                <option value="price-high">Precio: mayor a menor</option>
                <option value="bestseller">Bestsellers primero</option>
                <option value="offer">Ofertas primero</option>
              </FilterSelect>
            </SearchAndFilters>
          </CatalogHeader>

          {loading ? (
            <NoResults>Cargando palas...</NoResults>
          ) : filteredRackets.length === 0 ? (
            <NoResults>
              No se encontraron palas que coincidan con tu búsqueda.
            </NoResults>
          ) : (
            <>
              <RacketsGrid>
                {displayedRackets.map((racket, index) => (
                  <RacketCard
                    key={racket.nombre}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => handleRacketClick(racket)}
                  >
                    <RacketImageContainer>
                      <RacketImage
                        src={racket.imagen}
                        alt={racket.modelo}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-racket.svg";
                        }}
                      />
                      {racket.es_bestseller && (
                        <RacketBadge variant="bestseller">
                          <FiStar size={12} />
                          Top
                        </RacketBadge>
                      )}
                      {racket.en_oferta && (
                        <RacketBadge variant="offer">
                          <FiTag size={12} />
                          Oferta
                        </RacketBadge>
                      )}
                    </RacketImageContainer>

                    <RacketInfo>
                      <RacketBrand>{racket.marca}</RacketBrand>
                      <RacketName>{racket.modelo}</RacketName>

                      <RacketPriceContainer>
                        <RacketPrice>€{racket.precio_actual}</RacketPrice>
                        {racket.en_oferta &&
                          racket.precio_original &&
                          racket.precio_original > 0 && (
                            <RacketOriginalPrice>
                              €{racket.precio_original}
                            </RacketOriginalPrice>
                          )}
                      </RacketPriceContainer>

                      <ViewDetailsButton>
                        <FiEye size={16} />
                        Ver detalles
                      </ViewDetailsButton>
                    </RacketInfo>
                  </RacketCard>
                ))}
              </RacketsGrid>

              {displayedRackets.length < filteredRackets.length && (
                <LoadMoreButton
                  onClick={handleLoadMore}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cargar más palas (
                  {filteredRackets.length - displayedRackets.length} restantes)
                </LoadMoreButton>
              )}
            </>
          )}
        </motion.div>
      </CatalogSection>
    </Container>
  );
};

export default RacketsPage;

import { useComparison } from "@/contexts/ComparisonContext";
import { useRackets } from "@/contexts/RacketsContext";
import { Racket } from "@/types/racket";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiExternalLink,
  FiInfo,
  FiLoader,
  FiStar,
  FiTag,
  FiTrendingUp,
} from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fdf8 0%, #f0f9f0 100%);
`;

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #16a34a;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f9ff;
    text-decoration: none;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  gap: 2rem;
`;

const MainCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
`;

const ImageSection = styled.div`
  position: relative;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #f8fdf8 0%, #f0f9f0 100%);
`;

const RacketImage = styled.img`
  width: 100%;
  max-width: 300px;
  height: 350px;
  object-fit: contain;
  border-radius: 12px;
  margin-bottom: 1rem;
`;

const Badge = styled.div<{ variant: "bestseller" | "offer" }>`
  position: absolute;
  top: 1rem;
  ${(props) =>
    props.variant === "bestseller" ? "right: 1rem;" : "left: 1rem;"}
  background: ${(props) =>
    props.variant === "bestseller" ? "#f59e0b" : "#ef4444"};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const InfoSection = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const BrandText = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #16a34a;
  margin-bottom: 0.5rem;
`;

const ModelText = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
  line-height: 1.2;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const CurrentPrice = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #ef4444;
`;

const OriginalPrice = styled.div`
  font-size: 1.25rem;
  color: #9ca3af;
  text-decoration: line-through;
`;

const DiscountBadge = styled.div`
  background: #dc2626;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: auto;
`;

const PrimaryButton = styled.a`
  background: #16a34a;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: #15803d;
    text-decoration: none;
    color: white;
    transform: translateY(-2px);
  }
`;

const SecondaryButton = styled.button<{ disabled?: boolean }>`
  background: ${(props) => (props.disabled ? "#f0f9ff" : "white")};
  color: #16a34a;
  border: 2px solid #16a34a;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  opacity: ${(props) => (props.disabled ? "0.7" : "1")};

  &:hover:not(:disabled) {
    background: #f0f9ff;
    transform: translateY(-2px);
  }
`;

const FeaturesCard = styled(motion.div)`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const FeatureItem = styled.div`
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    transform: translateY(-2px);
  }
`;

const FeatureIcon = styled.div<{ color?: string }>`
  font-size: 1.5rem;
  color: ${(props) => props.color || "#16a34a"};
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: center;
`;

const FeatureLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const FeatureValue = styled.div<{ color?: string }>`
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.color || "#1f2937"};
`;

const InfoCard = styled(motion.div)`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const InfoValue = styled.div<{ color?: string }>`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => props.color || "#1f2937"};
  text-align: right;
`;

const RecommendationCard = styled(motion.div)`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid #bae6fd;
`;

const RecommendationText = styled.p`
  color: #0f172a;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const RecommendationButton = styled(Link)`
  background: white;
  color: #16a34a;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #16a34a;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f9ff;
    text-decoration: none;
    transform: translateY(-2px);
  }
`;

const LoadingContainer = styled.div`
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const LoadingSpinner = styled(motion.div)`
  color: #16a34a;
`;

const LoadingText = styled.div`
  color: #6b7280;
  font-size: 1.125rem;
`;

const ErrorContainer = styled.div`
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  text-align: center;
  padding: 2rem;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  color: #ef4444;
`;

const ErrorText = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
`;

const ErrorDescription = styled.p`
  color: #6b7280;
  max-width: 500px;
`;

// Component
const RacketDetailPage: React.FC = () => {
  // Hooks
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addRacket, isRacketInComparison, count } = useComparison();
  const { rackets, loading } = useRackets();

  // State
  const [racket, setRacket] = useState<Racket | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get racket ID from URL params
  const racketId = searchParams.get("id");

  // Load racket data
  useEffect(() => {
    if (!racketId) {
      setError("No se especificó el ID de la pala");
      return;
    }

    // Find racket by name (for backward compatibility with existing URLs)
    const decodedRacketId = decodeURIComponent(racketId);
    const foundRacket = rackets.find((pala) => pala.nombre === decodedRacketId);

    if (!foundRacket) {
      setError("No se encontró la pala solicitada");
      return;
    }

    setRacket(foundRacket);
  }, [racketId, rackets]);

  // Handle add to comparison
  const handleAddToComparison = () => {
    if (!racket) return;

    // Check if already in comparison
    if (isRacketInComparison(racket.nombre)) {
      toast.error("Esta pala ya está en el comparador");
      return;
    }

    // Try to add
    const success = addRacket(racket);

    if (!success) {
      if (count >= 3) {
        toast.error(
          "Ya tienes 3 palas en el comparador. Elimina una para añadir esta."
        );
      }
      return;
    }

    // Success
    toast.success(
      `${racket.marca} ${racket.modelo} añadida al comparador (${count + 1}/3)`
    );
  };

  // Handle navigation to comparison
  const handleGoToComparison = () => {
    navigate("/compare-rackets");
  };

  // Loading state (check if rackets are still loading from context)
  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FiLoader size={48} />
          </LoadingSpinner>
          <LoadingText>Cargando información de la pala...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  // Error state
  if (error || !racket) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorText>Pala no encontrada</ErrorText>
          <ErrorDescription>
            {error || "No se pudo encontrar la información de esta pala."}
          </ErrorDescription>
          <BackButton to="/rackets">
            <FiArrowLeft />
            Volver a Palas
          </BackButton>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderContent>
          <BackButton to="/rackets">
            <FiArrowLeft />
            Volver
          </BackButton>
          <HeaderTitle>Detalles de la Pala</HeaderTitle>
        </HeaderContent>
      </Header>

      {/* Content */}
      <Content>
        {/* Main Card */}
        <MainCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ImageSection>
            <RacketImage
              src={racket.imagen}
              alt={racket.modelo}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-racket.svg";
              }}
            />
            {racket.es_bestseller && (
              <Badge variant="bestseller">
                <FiStar size={16} />
                Top
              </Badge>
            )}
            {racket.en_oferta && (
              <Badge variant="offer">
                <FiTag size={16} />
                Oferta
              </Badge>
            )}
          </ImageSection>

          <InfoSection>
            <div>
              <BrandText>{racket.marca}</BrandText>
              <ModelText>{racket.modelo}</ModelText>

              <PriceContainer>
                <CurrentPrice>€{racket.precio_actual}</CurrentPrice>
                {racket.en_oferta &&
                  racket.precio_original &&
                  racket.precio_original > 0 && (
                    <>
                      <OriginalPrice>€{racket.precio_original}</OriginalPrice>
                      <DiscountBadge>
                        -{racket.descuento_porcentaje}%
                      </DiscountBadge>
                    </>
                  )}
              </PriceContainer>
            </div>

            <ActionButtons>
              <PrimaryButton
                href={racket.enlace}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FiExternalLink />
                Ver en Padel Nuestro
              </PrimaryButton>

              <SecondaryButton
                onClick={handleAddToComparison}
                disabled={isRacketInComparison(racket.nombre)}
              >
                {isRacketInComparison(racket.nombre) ? (
                  <>
                    <FiTrendingUp />
                    En el Comparador
                  </>
                ) : (
                  <>
                    <FiTrendingUp />
                    Añadir al Comparador ({count}/3)
                  </>
                )}
              </SecondaryButton>

              {count > 0 && (
                <SecondaryButton onClick={handleGoToComparison}>
                  Ir al Comparador ({count})
                </SecondaryButton>
              )}
            </ActionButtons>
          </InfoSection>
        </MainCard>

        {/* Features Card */}
        <FeaturesCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <SectionTitle>
            <FiStar />
            Características
          </SectionTitle>

          <FeatureGrid>
            <FeatureItem>
              <FeatureIcon color={racket.es_bestseller ? "#f59e0b" : "#9ca3af"}>
                🏆
              </FeatureIcon>
              <FeatureLabel>Bestseller</FeatureLabel>
              <FeatureValue
                color={racket.es_bestseller ? "#16a34a" : "#9ca3af"}
              >
                {racket.es_bestseller ? "Sí" : "No"}
              </FeatureValue>
            </FeatureItem>

            <FeatureItem>
              <FeatureIcon color={racket.en_oferta ? "#ef4444" : "#9ca3af"}>
                🏷️
              </FeatureIcon>
              <FeatureLabel>En Oferta</FeatureLabel>
              <FeatureValue color={racket.en_oferta ? "#ef4444" : "#9ca3af"}>
                {racket.en_oferta ? "Sí" : "No"}
              </FeatureValue>
            </FeatureItem>

            <FeatureItem>
              <FeatureIcon>🏪</FeatureIcon>
              <FeatureLabel>Tienda</FeatureLabel>
              <FeatureValue>Padel Nuestro</FeatureValue>
            </FeatureItem>

            <FeatureItem>
              <FeatureIcon color="#9ca3af">⏰</FeatureIcon>
              <FeatureLabel>Actualizado</FeatureLabel>
              <FeatureValue>
                {racket.scrapeado_en
                  ? new Date(racket.scrapeado_en).toLocaleDateString("es-ES")
                  : "N/A"}
              </FeatureValue>
            </FeatureItem>
          </FeatureGrid>
        </FeaturesCard>

        {/* Additional Info Card */}
        <InfoCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SectionTitle>
            <FiInfo />
            Información Adicional
          </SectionTitle>

          <InfoRow>
            <InfoLabel>Nombre completo:</InfoLabel>
            <InfoValue>{racket.nombre}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Fuente:</InfoLabel>
            <InfoValue>{racket.fuente || "Padel Nuestro"}</InfoValue>
          </InfoRow>

          {racket.en_oferta && (
            <InfoRow>
              <InfoLabel>Descuento:</InfoLabel>
              <InfoValue color="#ef4444">
                {racket.descuento_porcentaje}% de descuento
              </InfoValue>
            </InfoRow>
          )}

          <InfoRow>
            <InfoLabel>Última actualización:</InfoLabel>
            <InfoValue>
              {racket.scrapeado_en
                ? new Date(racket.scrapeado_en).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "No disponible"}
            </InfoValue>
          </InfoRow>
        </InfoCard>

        {/* Recommendation Card */}
        <RecommendationCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <SectionTitle>💡 ¿Necesitas más opciones?</SectionTitle>

          <RecommendationText>
            Si esta pala no es exactamente lo que buscas, puedes usar nuestro
            sistema de recomendaciones con IA para encontrar la pala perfecta
            según tu perfil de jugador.
          </RecommendationText>

          <RecommendationButton to="/rackets">
            ✨ Buscar mi pala ideal
          </RecommendationButton>
        </RecommendationCard>
      </Content>
    </Container>
  );
};

export default RacketDetailPage;

import React, { memo, useState, useEffect } from 'react';
import { FiEye, FiTag, FiHeart } from 'react-icons/fi';
import styled from 'styled-components';
import { Racket } from '../../types/racket';
import { getLowestPrice } from '../../utils/priceUtils';
import { racketImageUrl } from '../../utils/imageUrl';

// Styled Components
const RacketCardContainer = styled.li<{ $view: 'grid' | 'list'; $index: number }>`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e5e7eb;
  contain: layout style paint;
  will-change: transform, opacity;
  display: flex;
  flex-direction: ${props => (props.$view === 'list' ? 'row' : 'column')};
  height: ${props => (props.$view === 'grid' ? '100%' : 'auto')};
  animation: ${props => props.$index < 12 ? 'cardFadeIn 0.4s ease forwards' : 'none'};
  animation-delay: ${props => props.$index < 12 ? `${Math.min(props.$index * 0.05, 0.5)}s` : '0s'};
  opacity: ${props => props.$index < 12 ? 0 : 1};

  @keyframes cardFadeIn {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-color: #15803d;
  }
`;

const RacketImageContainer = styled.div<{ $view: 'grid' | 'list' }>`
  position: relative;
  height: ${props => (props.$view === 'grid' ? '220px' : 'auto')};
  width: ${props => (props.$view === 'list' ? '160px' : '100%')};
  flex-shrink: 0;
  align-self: ${props => (props.$view === 'list' ? 'stretch' : 'auto')};
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => (props.$view === 'list' ? '0.75rem' : '1rem')};
  border-right: ${props => (props.$view === 'list' ? '1px solid #f3f4f6' : 'none')};
  overflow: hidden;
`;

const RacketImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  aspect-ratio: 1 / 1;
  width: 100%;
  height: 100%;
  transition: opacity 0.3s ease-in-out;
`;

const RacketBadge = styled.div<{ $variant: 'bestseller' | 'offer' | 'comparison' }>`
  position: absolute;
  top: 0.75rem;
  ${props => {
    if (props.$variant === 'bestseller') return 'right: 0.75rem;';
    if (props.$variant === 'comparison') return 'right: 0.75rem;';
    return 'left: 0.75rem;';
  }}
  background: ${props => {
    if (props.$variant === 'bestseller') return '#f59e0b';
    if (props.$variant === 'comparison') return '#64748b'; // Gray-Slate for comparison
    return '#ef4444'; // Offer
  }};
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  z-index: 2;
`;

const RacketInfo = styled.div<{ $view: 'grid' | 'list' }>`
  padding: ${props => (props.$view === 'grid' ? '1.5rem' : '1rem')};
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
`;

const RacketBrand = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #15803d;
  margin-bottom: 0.25rem;
`;

const RacketName = styled.h3<{ $view: 'grid' | 'list' }>`
  font-size: ${props => (props.$view === 'grid' ? '1.125rem' : '1rem')};
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PriceContainer = styled.div<{ $view: 'grid' | 'list' }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: ${props => (props.$view === 'grid' ? '0.5rem' : '0.5rem')};
  flex-wrap: wrap;
  min-height: auto;
  margin-top: auto;
`;

const CurrentPrice = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #15803d;
`;

const OriginalPrice = styled.div`
  font-size: 0.875rem;
  color: #9ca3af;
  text-decoration: line-through;
`;

const DiscountBadge = styled.div`
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ActionButtons = styled.div<{ $view: 'grid' | 'list' }>`
  display: flex;
  gap: 0.5rem;
  flex-direction: ${props => (props.$view === 'list' ? 'row' : 'column')};

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ViewDetailsButton = styled.button`
  flex: 1;
  background: #15803d;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: #166534;
    transform: translateY(-1px);
  }
`;

const MetricsSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  margin-top: 0.5rem;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
`;

const MetricBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 60px;
`;

const MetricLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const MetricValue = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
`;

// Helper function to capitalize first letter of each word
const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface RacketCardProps {
  racket: Racket;
  view: 'grid' | 'list';
  index: number;
  onClick: (racket: Racket) => void;
  onAddToList?: (racket: Racket) => void;
  isAuthenticated?: boolean;
}

const RacketCardComponent: React.FC<RacketCardProps> = memo(
  ({ racket, view, index, onClick, onAddToList, isAuthenticated = false }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Efecto para cambiar imágenes automáticamente en hover
    useEffect(() => {
      if (!isHovered || !racket.imagenes || racket.imagenes.length <= 1) {
        return;
      }

      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1 >= racket.imagenes!.length ? 0 : prev + 1));
      }, 2000); // Cambia cada 2 segundos

      return () => clearInterval(interval);
    }, [isHovered, racket.imagenes]);

    // Reset al índice 0 cuando se sale del hover
    useEffect(() => {
      if (!isHovered) {
        setCurrentImageIndex(0);
      }
    }, [isHovered]);

    if (!racket?.nombre) {
      return null;
    }

    const lowestPrice = getLowestPrice(racket);

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.target as HTMLImageElement;
      target.src = '/placeholder-racket.svg';
    };

    const handleAddToList = (e: React.MouseEvent) => {
      e.stopPropagation();
      onAddToList?.(racket);
    };

    return (
      <RacketCardContainer
        $view={view}
        $index={index}
        onClick={() => onClick(racket)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <RacketImageContainer $view={view}>
          <RacketImage
            src={(() => {
              return racketImageUrl(racket.imagenes?.[currentImageIndex] || racket.imagenes?.[0]);
            })()}
            alt={racket.modelo}
            onError={handleImageError}
            loading={index < 4 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
            decoding={index < 4 ? 'sync' : 'async'}
            width="200"
            height="200"
          />
          {racket.view_count !== undefined && racket.view_count > 10 && (
            <RacketBadge $variant='bestseller'>
              <FiEye size={12} />
              Popular
            </RacketBadge>
          )}
          {racket.en_oferta && !racket.solo_comparacion && (
            <RacketBadge $variant='offer'>
              <FiTag size={12} />
              Oferta
            </RacketBadge>
          )}
          {racket.solo_comparacion && (
            <RacketBadge $variant='comparison'>
              <FiTag size={12} />
              Solo comparación
            </RacketBadge>
          )}
        </RacketImageContainer>

        <RacketInfo $view={view}>
          <div>
            <RacketBrand>{racket.marca}</RacketBrand>
            <RacketName $view={view}>{toTitleCase(racket.modelo)}</RacketName>
          </div>

          <PriceContainer $view={view}>
            {racket.solo_comparacion ? (
              <CurrentPrice style={{ color: '#64748b', fontSize: '1rem' }}>
                No disponible para venta
              </CurrentPrice>
            ) : lowestPrice ? (
              <>
                <CurrentPrice>{lowestPrice.price.toFixed(2)}€</CurrentPrice>
                {lowestPrice.originalPrice > lowestPrice.price && (
                  <>
                    <OriginalPrice>€{lowestPrice.originalPrice.toFixed(2)}</OriginalPrice>
                    {lowestPrice.discount > 0 && (
                      <DiscountBadge>-{lowestPrice.discount}%</DiscountBadge>
                    )}
                  </>
                )}
              </>
            ) : (
              <CurrentPrice>
                {racket.precio_actual > 0 ? `${racket.precio_actual}€` : 'Consultar'}
              </CurrentPrice>
            )}
          </PriceContainer>

          {racket.radar_potencia && (
            <MetricsSummary>
              <MetricBadge title="Potencia">
                <MetricLabel>⚡ Pot</MetricLabel>
                <MetricValue>{racket.radar_potencia.toFixed(1)}</MetricValue>
              </MetricBadge>
              <MetricBadge title="Control">
                <MetricLabel>🎯 Ctrl</MetricLabel>
                <MetricValue>{racket.radar_control?.toFixed(1)}</MetricValue>
              </MetricBadge>
              <MetricBadge title="Manejabilidad">
                <MetricLabel>☁️ Man</MetricLabel>
                <MetricValue>{racket.radar_manejabilidad?.toFixed(1)}</MetricValue>
              </MetricBadge>
              <MetricBadge title="Salida de Bola">
                <MetricLabel>🚀 Sal</MetricLabel>
                <MetricValue>{racket.radar_salida_bola?.toFixed(1)}</MetricValue>
              </MetricBadge>
              <MetricBadge title="Punto Dulce">
                <MetricLabel>✨ Dul</MetricLabel>
                <MetricValue>{racket.radar_punto_dulce?.toFixed(1)}</MetricValue>
              </MetricBadge>
            </MetricsSummary>
          )}

          <ActionButtons $view={view}>
            <ViewDetailsButton onClick={() => onClick(racket)}>Ver detalles</ViewDetailsButton>
            {isAuthenticated && onAddToList && (
              <ViewDetailsButton onClick={handleAddToList} style={{ background: '#15803d' }}>
                <FiHeart size={14} />
                Mis listas
              </ViewDetailsButton>
            )}
          </ActionButtons>
        </RacketInfo>
      </RacketCardContainer>
    );
  }
);

RacketCardComponent.displayName = 'RacketCard';

export default RacketCardComponent;

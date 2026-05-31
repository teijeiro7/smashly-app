import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { FiGrid, FiList, FiSearch, FiX, FiChevronDown, FiFilter, FiTag } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useComparison } from '../contexts/ComparisonContext';
import { useRackets } from '../contexts/RacketsContext';
import { RacketService } from '../services/racketService';
import { useAuth } from '../contexts/AuthContext';
import { Racket } from '../types/racket';
import { AddToListModal } from '../components/features/AddToListModal';
import RacketCard from '../components/features/RacketCard';
import { getLowestPrice } from '../utils/priceUtils';

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at 5% 0%, rgba(22, 163, 74, 0.08) 0%, transparent 42%),
    linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
`;

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: clamp(1.5rem, 4vw, 2.5rem) 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 3vw, 2rem);
  text-align: center;
`;

const Title = styled.h1`
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 0.75rem;
  line-height: 1.1;
  letter-spacing: -0.02em;

  .highlight {
    color: #15803d;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 1.4rem;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    gap: 1rem;
    flex-wrap: wrap;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #15803d;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
`;

const FiltersSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: clamp(1rem, 2vw, 1.5rem);
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const SearchContainer = styled.div`
  flex: 1;
  position: relative;
  min-width: 0;
`;

const SearchInput = styled.input`
  width: 100%;
  min-height: 46px;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:focus {
    outline: none;
    border-color: #15803d;
    box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 46px;
  padding: 0.5rem 1rem;
  border: 1.5px solid ${props => (props.$active ? '#15803d' : '#e5e7eb')};
  border-radius: 8px;
  background: ${props => (props.$active ? '#f0fdf4' : 'white')};
  color: ${props => (props.$active ? '#15803d' : '#6b7280')};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #15803d;
    color: #15803d;
    background: ${props => (props.$active ? '#f0fdf4' : '#f9fafb')};
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const FilterSelect = styled.select`
  min-height: 46px;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 16px;

  &:hover {
    border-color: #15803d;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2315803d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  }

  &:focus {
    outline: none;
    border-color: #15803d;
    box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2315803d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const AdvancedFiltersToggle = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  min-height: 46px;
  margin-top: 1rem;
  width: 100%;
  border: 1.5px dashed ${props => (props.$active ? '#15803d' : '#e5e7eb')};
  border-radius: 8px;
  background: ${props => (props.$active ? '#f0fdf4' : 'white')};
  color: ${props => (props.$active ? '#15803d' : '#6b7280')};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #15803d;
    color: #15803d;
    background: #f0fdf4;
  }

  svg:last-child {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: ${props => (props.$active ? 'rotate(180deg)' : 'rotate(0deg)')};
  }
`;

const QuickFiltersRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const AdvancedFiltersPanel = styled.div<{ $isOpen: boolean }>`
  overflow: hidden;
  margin-top: 1rem;
  max-height: ${props => props.$isOpen ? '1200px' : '0'};
  opacity: ${props => props.$isOpen ? 1 : 0};
  transition: max-height 0.4s ease, opacity 0.3s ease;

  @media (prefers-reduced-motion: reduce) {
    max-height: ${props => props.$isOpen ? '1200px' : '0'};
    transition: none;
  }
`;

const FilterGroupLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
  margin-bottom: 0.5rem;
`;

const AdvancedFiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 0.85rem;

  @media (max-width: 768px) {
    align-items: stretch;
    margin-bottom: 1.2rem;
  }
`;

const ResultsCount = styled.div`
  font-size: 1rem;
  color: #6b7280;
`;

const ResultsToolbar = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    gap: 0.5rem;

    & > button {
      width: auto;
      flex-shrink: 0;
      white-space: nowrap;
    }
  }
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 0.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.125rem;
  background: white;
  min-height: 46px;
  align-items: center;
  flex-shrink: 0;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const ViewButton = styled.button<{ $active: boolean }>`
  min-width: 36px;
  height: 36px;
  padding: 0.25rem;
  border: none;
  border-radius: 6px;
  background: ${props => (props.$active ? '#15803d' : 'transparent')};
  color: ${props => (props.$active ? 'white' : '#6b7280')};
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: ${props => (props.$active ? 'white' : '#15803d')};
  }
`;

const SortSelect = styled.select`
  min-height: 46px;
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #15803d;
  }

  @media (max-width: 768px) {
    flex: 1;
    min-width: 0;
  }
`;

const RacketsGrid = styled.ul<{ $view: 'grid' | 'list' }>`
  display: grid;
  grid-template-columns: ${props =>
    props.$view === 'grid' ? 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))' : '1fr'};
  gap: ${props => (props.$view === 'grid' ? '1.5rem' : '1rem')};
  list-style: none;
  padding: 0;
  margin: 0;

  @media (max-width: 640px) {
    gap: 1rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1.5rem;
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const EmptyDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const ClearFiltersButton = styled.button`
  background: #15803d;
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #166534;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(21, 128, 61, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Floating comparison panel
const FloatingPanel = styled(motion.div)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: white;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: 1.5px solid #15803d;
  z-index: 50;

  @media (max-width: 768px) {
    bottom: calc(78px + env(safe-area-inset-bottom, 0px) + 0.75rem);
    right: 1rem;
    left: 1rem;
  }
`;

const PanelContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PanelText = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
`;

const CompareButton = styled.button`
  background: #15803d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: #166534;
    transform: translateY(-1px);
  }
`;

const ClearFiltersIconButton = styled(FilterButton)`
  white-space: nowrap;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: auto;
  }
`;

// Component
const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { rackets, loading } = useRackets();
  const { count } = useComparison();
  const { isAuthenticated } = useAuth();

  // State
  const [filteredRackets, setFilteredRackets] = useState<Racket[]>([]);
  const [displayedRackets, setDisplayedRackets] = useState<Racket[]>([]);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [showMostViewed, setShowMostViewed] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [sortBy, setSortBy] = useState('most-viewed');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [displayCount, setDisplayCount] = useState(9);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [selectedRacket, setSelectedRacket] = useState<Racket | null>(null);

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedShape, setSelectedShape] = useState('Todas');
  const [selectedBalance, setSelectedBalance] = useState('Todos');
  const [selectedCore, setSelectedCore] = useState('Todos');
  const [selectedFace, setSelectedFace] = useState('Todas');
  const [selectedLevel, setSelectedLevel] = useState('Todos');
  const [selectedGameType, setSelectedGameType] = useState('Todos');
  const [selectedHardness, setSelectedHardness] = useState('Todas');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  const ITEMS_PER_PAGE = 9;

  // Initialize state from URL params
  useEffect(() => {
    const queryParam = searchParams.get('search') || '';
    const brandParam = searchParams.get('brand') || 'Todas';
    const shapeParam = searchParams.get('shape') || 'Todas';
    const balanceParam = searchParams.get('balance') || 'Todos';
    const coreParam = searchParams.get('core') || 'Todos';
    const faceParam = searchParams.get('face') || 'Todas';
    const levelParam = searchParams.get('level') || 'Todos';
    const gameTypeParam = searchParams.get('gameType') || 'Todos';
    const hardnessParam = searchParams.get('hardness') || 'Todas';
    const offersParam = searchParams.get('offers');
    const mostViewedParam = searchParams.get('mostViewed');
    const sortParam = searchParams.get('sort') || 'most-viewed';

    setSearchQuery(queryParam);
    setSelectedBrand(brandParam);
    setSelectedShape(shapeParam);
    setSelectedBalance(balanceParam);
    setSelectedCore(coreParam);
    setSelectedFace(faceParam);
    setSelectedLevel(levelParam);
    setSelectedGameType(gameTypeParam);
    setSelectedHardness(hardnessParam);
    setShowOffers(offersParam === 'true');
    setShowMostViewed(mostViewedParam === 'true');
    setShowAvailableOnly(searchParams.get('availableOnly') === 'true');
    setSortBy(sortParam);
  }, [searchParams]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set('search', searchQuery);
    if (selectedBrand !== 'Todas') params.set('brand', selectedBrand);
    if (selectedShape !== 'Todas') params.set('shape', selectedShape);
    if (selectedBalance !== 'Todos') params.set('balance', selectedBalance);
    if (selectedCore !== 'Todos') params.set('core', selectedCore);
    if (selectedFace !== 'Todas') params.set('face', selectedFace);
    if (selectedLevel !== 'Todos') params.set('level', selectedLevel);
    if (selectedGameType !== 'Todos') params.set('gameType', selectedGameType);
    if (selectedHardness !== 'Todas') params.set('hardness', selectedHardness);
    if (showOffers) params.set('offers', 'true');
    if (showMostViewed) params.set('mostViewed', 'true');
    if (showAvailableOnly) params.set('availableOnly', 'true');
    if (sortBy !== 'most-viewed') params.set('sort', sortBy);

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    navigate(newUrl, { replace: true });
  }, [
    searchQuery,
    selectedBrand,
    selectedShape,
    selectedBalance,
    selectedCore,
    selectedFace,
    selectedLevel,
    selectedGameType,
    selectedHardness,
    showOffers,
    showMostViewed,
    sortBy,
    navigate,
  ]);

  // Fetch server-side total count
  useEffect(() => {
    (async () => {
      try {
        const stats = await RacketService.getStats();
        setServerTotal(stats.total);
      } catch (e) {
        // Ignorar errores; fallback al total del contexto
      }
    })();
  }, []);

  // Filter and search effect - uses API fuzzy search when there's a search query
  useEffect(() => {
    const performSearch = async () => {
      // If there's a search query, use API-based fuzzy search
      if (searchQuery.trim().length >= 2) {
        try {
          const filters: Record<string, string> = {};
          
          if (selectedBrand !== 'Todas') filters.brand = selectedBrand;
          if (selectedShape !== 'Todas') filters.shape = selectedShape;
          if (selectedBalance !== 'Todos') filters.balance = selectedBalance;
          if (selectedCore !== 'Todos') filters.core = selectedCore;
          if (selectedFace !== 'Todas') filters.face = selectedFace;
          if (selectedLevel !== 'Todos') filters.level = selectedLevel;
          if (selectedGameType !== 'Todos') filters.game_type = selectedGameType;
          if (selectedHardness !== 'Todas') filters.hardness = selectedHardness;
          if (showOffers) filters.on_sale = 'true';
          if (showAvailableOnly) filters.available_only = 'true';
          if (showMostViewed) filters.most_viewed = 'true';

          const result = await RacketService.searchRackets(searchQuery, filters);
          
          if (result?.data) {
            // Apply local sorting since API returns sorted by relevance
            const sorted = [...result.data];
            try {
              sorted.sort((a, b) => {
                switch (sortBy) {
                  case 'price-low':
                    const priceA = getLowestPrice(a)?.price || a.precio_actual || 0;
                    const priceB = getLowestPrice(b)?.price || b.precio_actual || 0;
                    return priceA - priceB;
                  case 'price-high':
                    const priceHighA = getLowestPrice(a)?.price || a.precio_actual || 0;
                    const priceHighB = getLowestPrice(b)?.price || b.precio_actual || 0;
                    return priceHighB - priceHighA;
                  case 'brand':
                    return (a.marca || '').localeCompare(b.marca || '');
                  case 'offer':
                    if (a.en_oferta && !b.en_oferta) return -1;
                    if (!a.en_oferta && b.en_oferta) return 1;
                    return 0;
                  default:
                    return (b.view_count || 0) - (a.view_count || 0);
                }
              });
            } catch (error) {
              console.error('Error sorting search results:', error);
            }
            setFilteredRackets(sorted);
          } else {
            setFilteredRackets([]);
          }
        } catch (error) {
          console.error('Fuzzy search error, falling back to local:', error);
          // Fall back to local filtering on error
          filterLocally();
        }
      } else {
        // No search query - use local filtering
        filterLocally();
      }
    };

    const filterLocally = () => {
      let filtered = [...rackets];

      // Apply brand filter
      if (selectedBrand !== 'Todas') {
        filtered = filtered.filter(racket => racket.marca === selectedBrand);
      }

      // Apply most viewed filter (top 20% by view count)
      if (showMostViewed) {
        const sortedByViews = [...filtered].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        const topCount = Math.ceil(sortedByViews.length * 0.2);
        const topViewedIds = new Set(sortedByViews.slice(0, topCount).map(r => r.id));
        filtered = filtered.filter(racket => topViewedIds.has(racket.id));
      }

      // Apply offers filter
      if (showOffers) {
        filtered = filtered.filter(racket => racket.en_oferta);
      }

      // Apply available only filter
      if (showAvailableOnly) {
        filtered = filtered.filter(racket => !racket.solo_comparacion);
      }

      // Apply advanced filters
      if (selectedShape !== 'Todas') {
        filtered = filtered.filter(
          r => (r.caracteristicas_forma || r.especificaciones?.forma) === selectedShape
        );
      }

      if (selectedBalance !== 'Todos') {
        filtered = filtered.filter(
          r => (r.caracteristicas_balance || r.especificaciones?.balance) === selectedBalance
        );
      }

      if (selectedCore !== 'Todos') {
        filtered = filtered.filter(
          r => (r.caracteristicas_nucleo || r.especificaciones?.nucleo) === selectedCore
        );
      }

      if (selectedFace !== 'Todas') {
        filtered = filtered.filter(
          r => (r.caracteristicas_cara || r.especificaciones?.cara) === selectedFace
        );
      }

      if (selectedLevel !== 'Todos') {
        filtered = filtered.filter(
          r =>
            (r.caracteristicas_nivel_de_juego || r.especificaciones?.nivel_de_juego) === selectedLevel
        );
      }

      if (selectedGameType !== 'Todos') {
        filtered = filtered.filter(
          r =>
            (r.caracteristicas_tipo_de_juego || r.especificaciones?.tipo_de_juego) ===
            selectedGameType
        );
      }

      if (selectedHardness !== 'Todas') {
        filtered = filtered.filter(
          r => (r.caracteristicas_dureza || r.especificaciones?.dureza) === selectedHardness
        );
      }

      // Apply sorting
      try {
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'price-low':
              const priceA = getLowestPrice(a)?.price || a.precio_actual || 0;
              const priceB = getLowestPrice(b)?.price || b.precio_actual || 0;
              return priceA - priceB;
            case 'price-high':
              const priceHighA = getLowestPrice(a)?.price || a.precio_actual || 0;
              const priceHighB = getLowestPrice(b)?.price || b.precio_actual || 0;
              return priceHighB - priceHighA;
            case 'brand':
              const brandA = a.marca || '';
              const brandB = b.marca || '';
              return brandA.localeCompare(brandB);
            case 'most-viewed':
              const viewsA = a.view_count || 0;
              const viewsB = b.view_count || 0;
              return viewsB - viewsA;
            case 'offer':
              if (a.en_oferta && !b.en_oferta) return -1;
              if (!a.en_oferta && b.en_oferta) return 1;
              return 0;
            default:
              const modelA = a.modelo || '';
              const modelB = b.modelo || '';
              return modelA.localeCompare(modelB);
          }
        });
      } catch (error) {
        console.error('Error sorting rackets:', error);
      }

      setFilteredRackets(filtered);
    };

    // Debounce search to avoid too many API calls
    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [
rackets,
    searchQuery,
    selectedBrand,
    showMostViewed,
    showOffers,
    showAvailableOnly,
    sortBy,
    selectedShape,
    selectedBalance,
    selectedCore,
    selectedFace,
    selectedLevel,
    selectedGameType,
    selectedHardness,
  ]);

  // Update displayed rackets when filters change
  useEffect(() => {
    const newDisplayed = filteredRackets.slice(0, displayCount);
    setDisplayedRackets(newDisplayed);
    setHasMore(newDisplayed.length < filteredRackets.length);
  }, [filteredRackets, displayCount]);

  // Get unique brands - memoized
  const uniqueBrands = useMemo(
    () => ['Todas', ...Array.from(new Set(rackets.map(racket => racket.marca))).sort()],
    [rackets]
  );

  // Get unique values for advanced filters - memoized
  const uniqueShapes = useMemo(
    () =>
      [
        'Todas',
        ...Array.from(
          new Set(
            rackets.map(r => r.caracteristicas_forma || r.especificaciones?.forma).filter(Boolean)
          )
        ),
      ].sort(),
    [rackets]
  );

  const uniqueBalances = useMemo(
    () =>
      [
        'Todos',
        ...Array.from(
          new Set(
            rackets
              .map(r => r.caracteristicas_balance || r.especificaciones?.balance)
              .filter(Boolean)
          )
        ),
      ].sort(),
    [rackets]
  );

  const uniqueCores = useMemo(
    () =>
      [
        'Todos',
        ...Array.from(
          new Set(
            rackets.map(r => r.caracteristicas_nucleo || r.especificaciones?.nucleo).filter(Boolean)
          )
        ),
      ].sort(),
    [rackets]
  );

  const uniqueFaces = useMemo(
    () =>
      [
        'Todas',
        ...Array.from(
          new Set(
            rackets.map(r => r.caracteristicas_cara || r.especificaciones?.cara).filter(Boolean)
          )
        ),
      ].sort(),
    [rackets]
  );

  const uniqueLevels = useMemo(
    () =>
      [
        'Todos',
        ...Array.from(
          new Set(
            rackets
              .map(r => r.caracteristicas_nivel_de_juego || r.especificaciones?.nivel_de_juego)
              .filter(Boolean)
          )
        ),
      ].sort(),
    [rackets]
  );

  const uniqueGameTypes = useMemo(
    () =>
      [
        'Todos',
        ...Array.from(
          new Set(
            rackets
              .map(r => r.caracteristicas_tipo_de_juego || r.especificaciones?.tipo_de_juego)
              .filter(Boolean)
          )
        ),
      ].sort(),
    [rackets]
  );

  const uniqueHardness = useMemo(
    () =>
      [
        'Todas',
        ...Array.from(
          new Set(
            rackets.map(r => r.caracteristicas_dureza || r.especificaciones?.dureza).filter(Boolean)
          )
        ),
      ].sort(),
    [rackets]
  );

  // Get stats
  const totalRackets = serverTotal ?? rackets.length;
  const offersCount = rackets.filter(r => r.en_oferta).length;

  // Handlers
  const handleRacketClick = (racket: Racket) => {
    navigate(`/racket-detail?id=${racket.id}`);
  };

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    // Simular un pequeño delay para mejor UX
    setTimeout(() => {
      setDisplayCount(prev => prev + ITEMS_PER_PAGE);
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMore]);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, handleLoadMore]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBrand('Todas');
    setShowMostViewed(false);
    setShowOffers(false);
    setSortBy('most-viewed');

    // Clear advanced filters
    setSelectedShape('Todas');
    setSelectedBalance('Todos');
    setSelectedCore('Todos');
    setSelectedFace('Todas');
    setSelectedLevel('Todos');
    setSelectedGameType('Todos');
    setSelectedHardness('Todas');
  };

  const goToComparison = () => {
    navigate('/compare-rackets');
  };

  if (loading) {
    return (
      <Container>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
            <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ color: '#15803d' }}
          >
            <FiGrid size={48} />
          </motion.div>
          <div style={{ color: '#6b7280', fontSize: '1.125rem' }}>Cargando catálogo...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderContent>
          <Title data-testid='catalog-title'>
            Catálogo de <span className='highlight'>Palas</span>
          </Title>
          <Subtitle>
            Descubre nuestra colección completa de palas de pádel con las mejores marcas y precios
          </Subtitle>
          <StatsContainer>
            <StatItem>
              <StatNumber>{totalRackets}</StatNumber>
              <StatLabel>Palas</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{offersCount}</StatNumber>
              <StatLabel>En Oferta</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{uniqueBrands.length - 1}</StatNumber>
              <StatLabel>Marcas</StatLabel>
            </StatItem>
          </StatsContainer>
        </HeaderContent>
      </Header>
      {/* Main Content */}
      <MainContent>
        {/* Filters */}
        <FiltersSection>
          <FiltersRow>
            <SearchContainer>
              <SearchIcon />
              <SearchInput
                type='text'
                placeholder='Buscar por nombre, marca o modelo...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </SearchContainer>

            <ClearFiltersIconButton onClick={clearFilters}>
              <FiX />
              Limpiar
            </ClearFiltersIconButton>
          </FiltersRow>

          {/* Advanced Filters Toggle */}
          <AdvancedFiltersToggle
            $active={showAdvancedFilters}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <FiFilter />
            Filtros Avanzados
            <FiChevronDown />
          </AdvancedFiltersToggle>

          {/* Advanced Filters Panel */}
          <AdvancedFiltersPanel $isOpen={showAdvancedFilters}>
                <FilterGroupLabel>Filtros generales</FilterGroupLabel>
                <QuickFiltersRow>
                  <FilterSelect value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}>
                    {uniqueBrands.map(brand => (
                      <option key={brand} value={brand}>
                        {brand === 'Todas' ? 'Todas las marcas' : brand}
                      </option>
                    ))}
                  </FilterSelect>

                  <FilterButton $active={showOffers} onClick={() => setShowOffers(!showOffers)}>
                    <FiTag />
                    Ofertas
                  </FilterButton>

                  <FilterButton $active={showAvailableOnly} onClick={() => setShowAvailableOnly(!showAvailableOnly)}>
                    <FiFilter size={16} />
                    En Stock
                  </FilterButton>
                </QuickFiltersRow>

                <FilterGroupLabel style={{ marginTop: '1rem' }}>Características técnicas</FilterGroupLabel>
                <AdvancedFiltersGrid>
                  <FilterSelect
                    value={selectedShape}
                    onChange={e => setSelectedShape(e.target.value)}
                  >
                    {uniqueShapes.map(shape => (
                      <option key={shape} value={shape}>
                        {shape === 'Todas' ? 'Todas las formas' : shape}
                      </option>
                    ))}
                  </FilterSelect>

                  <FilterSelect
                    value={selectedBalance}
                    onChange={e => setSelectedBalance(e.target.value)}
                  >
                    {uniqueBalances.map(balance => (
                      <option key={balance} value={balance}>
                        {balance === 'Todos' ? 'Todos los balances' : balance}
                      </option>
                    ))}
                  </FilterSelect>

                  <FilterSelect
                    value={selectedCore}
                    onChange={e => setSelectedCore(e.target.value)}
                  >
                    {uniqueCores.map(core => (
                      <option key={core} value={core}>
                        {core === 'Todos' ? 'Todos los núcleos' : core}
                      </option>
                    ))}
                  </FilterSelect>

                  <FilterSelect
                    value={selectedFace}
                    onChange={e => setSelectedFace(e.target.value)}
                  >
                    {uniqueFaces.map(face => (
                      <option key={face} value={face}>
                        {face === 'Todas' ? 'Todas las caras' : face}
                      </option>
                    ))}
                  </FilterSelect>

                  <FilterSelect
                    value={selectedLevel}
                    onChange={e => setSelectedLevel(e.target.value)}
                  >
                    {uniqueLevels.map(level => (
                      <option key={level} value={level}>
                        {level === 'Todos' ? 'Todos los niveles' : level}
                      </option>
                    ))}
                  </FilterSelect>

                  <FilterSelect
                    value={selectedGameType}
                    onChange={e => setSelectedGameType(e.target.value)}
                  >
                    {uniqueGameTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'Todos' ? 'Todos los tipos' : type}
                      </option>
                    ))}
                  </FilterSelect>

                  <FilterSelect
                    value={selectedHardness}
                    onChange={e => setSelectedHardness(e.target.value)}
                  >
                    {uniqueHardness.map(hardness => (
                      <option key={hardness} value={hardness}>
                        {hardness === 'Todas' ? 'Todas las durezas' : hardness}
                      </option>
                    ))}
                  </FilterSelect>
                </AdvancedFiltersGrid>
          </AdvancedFiltersPanel>
        </FiltersSection>

        {/* Results Header */}
        <ResultsHeader>
          <ResultsCount>
            Mostrando {displayedRackets.length} de {totalRackets} palas
          </ResultsCount>

          <ResultsToolbar>
            <SortSelect value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value='most-viewed'>Más vistas primero</option>
              <option value='name'>Ordenar por nombre</option>
              <option value='brand'>Ordenar por marca</option>
              <option value='price-low'>Precio: menor a mayor</option>
              <option value='price-high'>Precio: mayor a menor</option>
              <option value='offer'>Ofertas primero</option>
            </SortSelect>

            <ViewToggle>
              <ViewButton $active={viewMode === 'grid'} onClick={() => setViewMode('grid')}>
                <FiGrid />
              </ViewButton>
              <ViewButton $active={viewMode === 'list'} onClick={() => setViewMode('list')}>
                <FiList />
              </ViewButton>
            </ViewToggle>
          </ResultsToolbar>
        </ResultsHeader>

        {/* Results */}
        {filteredRackets.length === 0 ? (
          <EmptyState>
            <EmptyIcon>🎾</EmptyIcon>
            <EmptyTitle>No se encontraron palas</EmptyTitle>
            <EmptyDescription>Prueba ajustando los filtros o términos de búsqueda</EmptyDescription>
            <ClearFiltersButton onClick={clearFilters}>Limpiar filtros</ClearFiltersButton>
          </EmptyState>
        ) : (
          <>
            <RacketsGrid $view={viewMode}>
              {displayedRackets.map((racket, index) => (
                <RacketCard
                  key={`${racket.id}-${racket.nombre}-${index}`}
                  racket={racket}
                  view={viewMode}
                  index={index}
                  onClick={handleRacketClick}
                  onAddToList={
                    isAuthenticated
                      ? racket => {
                          setSelectedRacket(racket);
                          setShowAddToListModal(true);
                        }
                      : undefined
                  }
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </RacketsGrid>

            {/* Counter for E2E tests - visually hidden but accessible to screen readers and Selenium */}
            <p
              data-testid='rackets-count'
              style={{
                clip: 'rect(0 0 0 0)',
                clipPath: 'inset(50%)',
                height: '1px',
                overflow: 'hidden',
                position: 'absolute',
                whiteSpace: 'nowrap',
                width: '1px',
              }}
            >
              Total de palas mostradas: {displayedRackets.length}
            </p>

            {/* Elemento observador para scroll infinito */}
            <div ref={observerTarget} style={{ height: '20px', margin: '2rem 0' }} />

            {/* Indicador de carga */}
            {loadingMore && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Cargando más palas...
              </div>
            )}

            {/* Mensaje de fin */}
            {!hasMore && displayedRackets.length > 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                }}
              >
                Has visto todas las palas del catálogo
              </div>
            )}
          </>
        )}
      </MainContent>
      <AnimatePresence>
        {count > 0 && (
          <FloatingPanel
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
          >
            <PanelContent>
              <PanelText>
                {count} pala{count > 1 ? 's' : ''} seleccionada
                {count > 1 ? 's' : ''} para comparar
              </PanelText>
              <CompareButton onClick={goToComparison}>Comparar ahora</CompareButton>
            </PanelContent>
          </FloatingPanel>
        )}
      </AnimatePresence>
      {/* Modal para añadir a listas */}
      {selectedRacket && (
        <AddToListModal
          isOpen={showAddToListModal}
          onClose={() => {
            setShowAddToListModal(false);
            setSelectedRacket(null);
          }}
          racketId={selectedRacket.id || 0}
          racketName={`${selectedRacket.marca} ${selectedRacket.modelo}`}
        />
      )}
    </Container>
  );
};

export default CatalogPage;

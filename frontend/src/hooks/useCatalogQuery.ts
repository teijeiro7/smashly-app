import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Racket } from '../types/racket';
import racketService from '../services/racketService';
import { useDebounce } from './useDebounce';
import { getLowestPrice } from '../utils/priceUtils';

interface UseCatalogQueryOptions {
  rackets: Racket[];
  searchParams: Record<string, any>;
  itemsPerPage?: number;
}

export function useCatalogQuery({
  rackets,
  searchParams,
  itemsPerPage = 9,
}: UseCatalogQueryOptions) {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [showMostViewed, setShowMostViewed] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [displayCount, setDisplayCount] = useState(itemsPerPage);

  // Advanced filters state
  const [selectedShape, setSelectedShape] = useState('Todas');
  const [selectedBalance, setSelectedBalance] = useState('Todos');
  const [selectedCore, setSelectedCore] = useState('Todos');
  const [selectedFace, setSelectedFace] = useState('Todas');
  const [selectedLevel, setSelectedLevel] = useState('Todos');
  const [selectedGameType, setSelectedGameType] = useState('Todos');
  const [selectedHardness, setSelectedHardness] = useState('Todas');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const [filteredRackets, setFilteredRackets] = useState<Racket[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Initialize state from URL search params
  useEffect(() => {
    const queryParam = searchParams['search'] || '';
    const brandParam = searchParams['brand'] || 'Todas';
    const shapeParam = searchParams['shape'] || 'Todas';
    const balanceParam = searchParams['balance'] || 'Todos';
    const coreParam = searchParams['core'] || 'Todos';
    const faceParam = searchParams['face'] || 'Todas';
    const levelParam = searchParams['level'] || 'Todos';
    const gameTypeParam = searchParams['gameType'] || 'Todos';
    const hardnessParam = searchParams['hardness'] || 'Todas';
    const offersParam = searchParams['offers'];
    const mostViewedParam = searchParams['mostViewed'];
    const sortParam = searchParams['sort'] || 'name';

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
    setShowAvailableOnly(searchParams['availableOnly'] === 'true');
    setSortBy(sortParam);
  }, [searchParams]);

  // Sync state back to URL parameters safely without cyclic loops
  useEffect(() => {
    const params = new URLSearchParams();

    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
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
    if (sortBy !== 'name') params.set('sort', sortBy);

    const searchObj = Object.fromEntries(params.entries());
    const currentStr = JSON.stringify(searchParams);
    const newStr = JSON.stringify(searchObj);

    if (currentStr !== newStr) {
      navigate({ to: '/catalog', search: searchObj, replace: true });
    }
  }, [
    debouncedSearchQuery,
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
    showAvailableOnly,
    sortBy,
    searchParams,
    navigate,
  ]);

  // Execute fuzzy search or local filtering
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.trim().length >= 2) {
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

          const result = await racketService.searchRackets(debouncedSearchQuery, filters);

          if (result?.data && result.data.length > 0) {
            const sorted = [...result.data];
            sortRacketsList(sorted, sortBy);
            setFilteredRackets(sorted);
            return;
          }
        } catch (e) {
          // Fallback to local filter on search error
        }
      }

      // Local filtering fallback
      let filtered = [...rackets];
      if (debouncedSearchQuery.trim().length > 0) {
        const queryLower = debouncedSearchQuery.toLowerCase();
        filtered = filtered.filter(
          r =>
            r.modelo?.toLowerCase().includes(queryLower) ||
            r.marca?.toLowerCase().includes(queryLower)
        );
      }
      if (selectedBrand !== 'Todas') {
        filtered = filtered.filter(r => r.marca === selectedBrand);
      }
      if (showOffers) {
        filtered = filtered.filter(r => r.en_oferta);
      }
      if (showAvailableOnly) {
        filtered = filtered.filter(r => !r.solo_comparacion);
      }
      sortRacketsList(filtered, sortBy);
      setFilteredRackets(filtered);
    };

    const timer = setTimeout(performSearch, 50);
    return () => clearTimeout(timer);
  }, [
    rackets,
    debouncedSearchQuery,
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
    showAvailableOnly,
    sortBy,
  ]);

  const displayedRackets = useMemo(() => {
    return filteredRackets.slice(0, displayCount);
  }, [filteredRackets, displayCount]);

  const hasMore = displayedRackets.length < filteredRackets.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setDisplayCount(prev => prev + itemsPerPage);
    }
  }, [hasMore, itemsPerPage]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedBrand('Todas');
    setSelectedShape('Todas');
    setSelectedBalance('Todos');
    setSelectedCore('Todos');
    setSelectedFace('Todas');
    setSelectedLevel('Todos');
    setSelectedGameType('Todos');
    setSelectedHardness('Todas');
    setShowOffers(false);
    setShowMostViewed(false);
    setShowAvailableOnly(false);
    setSortBy('name');
    setDisplayCount(itemsPerPage);
  }, [itemsPerPage]);

  return {
    searchQuery,
    setSearchQuery,
    selectedBrand,
    setSelectedBrand,
    selectedShape,
    setSelectedShape,
    selectedBalance,
    setSelectedBalance,
    selectedCore,
    setSelectedCore,
    selectedFace,
    setSelectedFace,
    selectedLevel,
    setSelectedLevel,
    selectedGameType,
    setSelectedGameType,
    selectedHardness,
    setSelectedHardness,
    showOffers,
    setShowOffers,
    showMostViewed,
    setShowMostViewed,
    showAvailableOnly,
    setShowAvailableOnly,
    sortBy,
    setSortBy,
    filteredRackets,
    displayedRackets,
    hasMore,
    loadMore,
    resetFilters,
    debouncedSearchQuery,
  };
}

function sortRacketsList(list: Racket[], sortBy: string) {
  try {
    list.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': {
          const aComp = a.solo_comparacion ? 1 : 0;
          const bComp = b.solo_comparacion ? 1 : 0;
          if (aComp !== bComp) return aComp - bComp;
          const priceA = getLowestPrice(a)?.price || a.precio_actual || 0;
          const priceB = getLowestPrice(b)?.price || b.precio_actual || 0;
          return priceA - priceB;
        }
        case 'price-high': {
          const priceHighA = getLowestPrice(a)?.price || a.precio_actual || 0;
          const priceHighB = getLowestPrice(b)?.price || b.precio_actual || 0;
          return priceHighB - priceHighA;
        }
        case 'brand':
          return (a.marca || '').localeCompare(b.marca || '');
        case 'offer':
          if (a.en_oferta && !b.en_oferta) return -1;
          if (!a.en_oferta && b.en_oferta) return 1;
          return 0;
        default:
          return (a.modelo || '').localeCompare(b.modelo || '');
      }
    });
  } catch (error) {
    // Fail-safe sorting fallback
  }
}

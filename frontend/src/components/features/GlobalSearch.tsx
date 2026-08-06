import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState, useMemo, useDeferredValue } from 'react';
import { FiX, FiTag, FiGrid, FiBox, FiClock, FiTrendingUp, FiPlus, FiCheck } from 'react-icons/fi';
import { useNavigate } from '@tanstack/react-router';
import styled from 'styled-components';
import { useRackets } from '../../contexts/RacketsContext';
import { useComparison } from '../../contexts/ComparisonContext';
import racketService from '../../services/racketService';
import { Racket } from '../../types/racket';
import { toTitleCase, formatBrandName, formatRacketName } from '../../utils/textUtils';

const SearchContainer = styled.div`
  position: relative;
  z-index: 1000;
  width: 100%;
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const SearchInputContainer = styled(motion.div)<{
  $isInHeader?: boolean;
  $isMobileContext?: boolean;
}>`
  position: relative;
  background: ${props => {
    if (props.$isMobileContext) return 'var(--surface-2)';
    if (props.$isInHeader) return 'rgba(255, 255, 255, 0.12)';
    return 'var(--surface-2)';
  }};
  border-radius: 24px;
  overflow: hidden;
  width: ${props => (props.$isInHeader ? '100%' : '280px')};
  border: 1px solid
    ${props => {
      if (props.$isMobileContext) return 'var(--border)';
      if (props.$isInHeader) return 'rgba(255, 255, 255, 0.15)';
      return 'transparent';
    }};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => {
      if (props.$isMobileContext) return 'var(--surface-3)';
      if (props.$isInHeader) return 'rgba(255, 255, 255, 0.16)';
      return 'var(--surface-3)';
    }};
  }

  &:focus-within {
    background: ${props => {
      if (props.$isMobileContext) return 'var(--surface)';
      if (props.$isInHeader) return 'rgba(255, 255, 255, 0.2)';
      return 'var(--surface)';
    }};
    border-color: ${props => {
      if (props.$isMobileContext) return 'var(--primary)';
      if (props.$isInHeader) return 'rgba(255, 255, 255, 0.25)';
      return 'rgba(var(--primary-rgb), 0.20)';
    }};
    box-shadow: ${props => {
      if (props.$isMobileContext) return '0 0 0 3px rgba(var(--primary-rgb), 0.20)';
      if (props.$isInHeader) return '0 0 0 3px rgba(255, 255, 255, 0.1)';
      return '0 0 0 3px rgba(var(--primary-rgb), 0.10)';
    }};
  }

  @media (max-width: 600px) {
    border-radius: 16px;
    width: 100%;
  }
`;

const SearchInput = styled.input<{ $isInHeader?: boolean; $isMobileContext?: boolean }>`
  width: 100%;
  padding: 10px 70px 10px 16px;
  border: none;
  outline: none;
  font-size: 14px;
  color: ${props => {
    if (props.$isMobileContext) return 'var(--text)';
    if (props.$isInHeader) return 'var(--brand-on-surface)';
    return 'var(--text)';
  }};
  background: transparent;
  font-weight: 400;

  &::placeholder {
    color: ${props => {
      if (props.$isMobileContext) return 'var(--text-subtle)';
      if (props.$isInHeader) return 'rgba(255, 255, 255, 0.6)';
      return 'var(--text-subtle)';
    }};
  }

  @media (max-width: 480px) {
    font-size: 15px;
    padding: 12px 40px 12px 14px;
  }
`;

const KbdBadge = styled.span<{ $isInHeader?: boolean }>`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
  background: ${props => (props.$isInHeader ? 'rgba(255, 255, 255, 0.2)' : 'var(--surface-3)')};
  color: ${props => (props.$isInHeader ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-subtle)')};
  border: 1px solid ${props => (props.$isInHeader ? 'rgba(255, 255, 255, 0.25)' : 'var(--border)')};
  font-family: inherit;

  @media (max-width: 600px) {
    display: none;
  }
`;

const ClearButton = styled.button<{ $isInHeader?: boolean; $isMobileContext?: boolean }>`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${props => {
    if (props.$isMobileContext) return 'var(--text-subtle)';
    if (props.$isInHeader) return 'rgba(255, 255, 255, 0.7)';
    return 'var(--text-subtle)';
  }};
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => {
      if (props.$isMobileContext) return 'var(--surface-3)';
      if (props.$isInHeader) return 'rgba(255, 255, 255, 0.15)';
      return 'var(--surface-3)';
    }};
    color: ${props => {
      if (props.$isMobileContext) return 'var(--text-muted)';
      if (props.$isInHeader) return 'var(--brand-on-surface)';
      return 'var(--text-muted)';
    }};
  }

  @media (max-width: 480px) {
    right: 10px;
    padding: 6px;
  }
`;

const SearchResultsDropdown = styled(motion.div)`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--surface);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.14);
  border: 1px solid var(--border);
  max-height: 440px;
  overflow: hidden;
  z-index: 1001;

  @media (max-width: 600px) {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 80vh;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
`;

const ResultsGroup = styled.div`
  &:not(:last-child) {
    border-bottom: 1px solid var(--surface-3);
  }
`;

const ResultsGroupHeader = styled.div`
  padding: 10px 16px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-2);
`;

const ResultsGroupTitle = styled.span`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-subtle);
`;

const ResultsGroupCount = styled.span`
  font-size: 11px;
  color: var(--text-subtle);
  margin-left: auto;
`;

const SearchResultsList = styled.div`
  max-height: 320px;
  overflow-y: auto;
`;

const SearchResultItem = styled.div<{
  $variant?: 'racket' | 'brand' | 'category';
  $isFocused?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  background: ${props => (props.$isFocused ? 'var(--surface-3)' : 'transparent')};
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--surface-2);
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 600px) {
    padding: 14px 16px;
    gap: 14px;
    position: relative;
  }
`;

const ResultIcon = styled.div<{ $variant?: 'racket' | 'brand' | 'category' }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${props => {
    switch (props.$variant) {
      case 'brand':
        return 'var(--primary-subtle)';
      case 'category':
        return 'rgba(13, 148, 136, 0.10)';
      default:
        return 'var(--surface-3)';
    }
  }};
  color: ${props => {
    switch (props.$variant) {
      case 'brand':
        return 'var(--primary)';
      case 'category':
        return '#0d9488';
      default:
        return 'transparent';
    }
  }};

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 10px;
  }
`;

const ResultImage = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--racket-image-bg);
  border: var(--racket-image-border);
  box-shadow: var(--racket-image-shadow);
  object-fit: contain;
  flex-shrink: 0;
  padding: 0.125rem;
`;

const ResultInfo = styled.div`
  flex: 1;
  min-width: 0;

  @media (max-width: 480px) {
    max-width: 140px;
  }
`;

const ResultName = styled.div<{ $variant?: 'racket' | 'brand' | 'category' }>`
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 600px) {
    font-size: 15px;
  }
`;

const ResultSubtext = styled.div`
  font-size: 12px;
  color: var(--text-subtle);
  margin-top: 2px;

  @media (max-width: 600px) {
    font-size: 13px;
  }
`;

const ResultPrice = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  white-space: nowrap;
`;

const CompareButton = styled.button<{ $inComparison?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid ${props => (props.$inComparison ? 'var(--primary)' : 'var(--border)')};
  background: ${props => (props.$inComparison ? 'var(--primary-subtle)' : 'var(--surface-2)')};
  color: ${props => (props.$inComparison ? 'var(--primary)' : 'var(--text-muted)')};
  cursor: pointer;
  transition: all 0.15s ease;
  margin-left: 8px;

  &:hover {
    background: var(--primary-subtle);
    border-color: var(--primary);
    color: var(--primary);
  }
`;

const NoResults = styled.div`
  padding: 24px 16px;
  text-align: center;

  @media (max-width: 600px) {
    padding: 32px 16px;
  }
`;

const NoResultsText = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  margin: 0 0 8px 0;
`;

const NoResultsHint = styled.span`
  font-size: 12px;
  color: var(--text-subtle);
`;

const ViewAllLink = styled.span`
  display: block;
  padding: 12px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--primary);
  font-weight: 500;
  cursor: pointer;
  border-top: 1px solid var(--surface-3);
  transition: background 0.15s ease;

  &:hover {
    background: var(--surface-2);
  }
`;

const PreSearchContainer = styled.div`
  padding: 12px 16px;
`;

const PreSearchTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-subtle);
  margin-bottom: 8px;
`;

const TagChipGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
`;

const TagChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 20px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--primary-subtle);
    border-color: var(--primary);
    color: var(--primary);
  }
`;

const RecentSearchItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;

  &:hover {
    color: var(--primary);
  }
`;

interface SearchResult {
  type: 'racket' | 'brand' | 'category';
  data: Racket | string;
}

interface GlobalSearchProps {
  onSearchToggle?: (isOpen: boolean) => void;
  isInHeader?: boolean;
  isMobileContext?: boolean;
}

const POPULAR_SEARCHES = [
  'Babolat Technical Viper',
  'Bullpadel Vertex',
  'Nox AT10',
  'Forma Diamante',
  'Palas de Control',
];

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onSearchToggle,
  isInHeader = false,
  isMobileContext = false,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(isInHeader);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('smashly_recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { rackets } = useRackets();
  const comparison = useComparison();

  const addRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const clean = query.trim();
    const updated = [
      clean,
      ...recentSearches.filter(q => q.toLowerCase() !== clean.toLowerCase()),
    ].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('smashly_recent_searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, queryToRemove: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(q => q !== queryToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem('smashly_recent_searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const uniqueBrands = useMemo(
    () => Array.from(new Set(rackets.map(r => r.marca).filter(Boolean))).sort(),
    [rackets]
  );

  const uniqueShapes = useMemo(
    () =>
      Array.from(
        new Set(
          rackets.map(r => r.caracteristicas_forma || r.especificaciones?.forma).filter(Boolean)
        )
      ).sort(),
    [rackets]
  );

  const searchReadyRackets = useMemo(() => {
    return rackets.map(r => ({
      ...r,
      _lowName: (r.nombre || '').toLowerCase(),
      _lowBrand: (r.marca || '').toLowerCase(),
      _lowModel: (r.modelo || '').toLowerCase(),
    }));
  }, [rackets]);

  // Global hotkey Cmd+K / Ctrl+K / /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        onSearchToggle?.(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        setIsSearchOpen(true);
        onSearchToggle?.(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchToggle]);

  useEffect(() => {
    if (deferredQuery.trim() === '') {
      setSearchResults([]);
      setSelectedIndex(-1);
      return;
    }

    const query = deferredQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    const brandResults = uniqueBrands
      .filter(brand => brand.toLowerCase().includes(query))
      .slice(0, 3);
    brandResults.forEach(brand => {
      results.push({ type: 'brand', data: brand });
    });

    const categoryResults = uniqueShapes
      .filter(shape => shape.toLowerCase().includes(query))
      .slice(0, 3);
    categoryResults.forEach(shape => {
      results.push({ type: 'category', data: shape });
    });

    const searchRackets = async () => {
      setIsLoading(true);
      try {
        const result = await racketService.searchRackets(query, {}, { limit: 6 });
        if (result?.data && result.data.length > 0) {
          result.data.forEach((racket: Racket) => {
            results.push({ type: 'racket', data: racket });
          });
        } else {
          const racketResults = searchReadyRackets
            .filter(racket => {
              const queryWords = query.split(/\s+/);
              return queryWords.every(
                word =>
                  racket._lowName.includes(word) ||
                  racket._lowBrand.includes(word) ||
                  racket._lowModel.includes(word)
              );
            })
            .slice(0, 6);
          racketResults.forEach(racket => {
            results.push({ type: 'racket', data: racket });
          });
        }
      } catch (error) {
        console.error('Error in global search:', error);
        const racketResults = searchReadyRackets
          .filter(racket => {
            const queryWords = query.split(/\s+/);
            return queryWords.every(
              word =>
                racket._lowName.includes(word) ||
                racket._lowBrand.includes(word) ||
                racket._lowModel.includes(word)
            );
          })
          .slice(0, 6);
        racketResults.forEach(racket => {
          results.push({ type: 'racket', data: racket });
        });
      } finally {
        setSearchResults(results);
        setIsLoading(false);
        setSelectedIndex(-1);
      }
    };

    if (query.length >= 2) {
      searchRackets();
    } else {
      setSearchResults(results);
      setIsLoading(false);
      setSelectedIndex(-1);
    }
  }, [deferredQuery, rackets, uniqueBrands, uniqueShapes, searchReadyRackets]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSearch = () => {
    if (isInHeader) {
      setSearchQuery('');
      setSearchResults([]);
      onSearchToggle?.(false);
      return;
    }

    const newIsOpen = !isSearchOpen;
    setIsSearchOpen(newIsOpen);

    if (newIsOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }

    onSearchToggle?.(newIsOpen);
  };

  const handleRacketSelect = (racket: Racket) => {
    addRecentSearch(racket.nombre);
    if (isInHeader) {
      setSearchQuery('');
      setSearchResults([]);
      onSearchToggle?.(false);
    } else {
      toggleSearch();
    }
    navigate({ to: '/palas/$slug', params: { slug: racket.slug } });
  };

  const handleBrandSelect = (brand: string) => {
    addRecentSearch(brand);
    if (isInHeader) {
      setSearchQuery('');
      setSearchResults([]);
      onSearchToggle?.(false);
    } else {
      toggleSearch();
    }
    navigate({ to: '/catalog', search: { brand: encodeURIComponent(brand) } });
  };

  const handleCategorySelect = (shape: string) => {
    addRecentSearch(shape);
    if (isInHeader) {
      setSearchQuery('');
      setSearchResults([]);
      onSearchToggle?.(false);
    } else {
      toggleSearch();
    }
    navigate({ to: '/catalog', search: { shape: encodeURIComponent(shape) } });
  };

  const handleQuickTagSelect = (text: string) => {
    setSearchQuery(text);
    addRecentSearch(text);
    setShowDropdown(true);
    searchInputRef.current?.focus();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  const flattenedResults = useMemo(() => searchResults, [searchResults]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flattenedResults.length > 0) {
        setSelectedIndex(prev => (prev < flattenedResults.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flattenedResults.length > 0) {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : flattenedResults.length - 1));
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      if (isInHeader) {
        onSearchToggle?.(false);
      } else {
        toggleSearch();
      }
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < flattenedResults.length) {
        e.preventDefault();
        const selected = flattenedResults[selectedIndex];
        if (selected.type === 'racket') handleRacketSelect(selected.data as Racket);
        else if (selected.type === 'brand') handleBrandSelect(selected.data as string);
        else if (selected.type === 'category') handleCategorySelect(selected.data as string);
      } else if (searchQuery.trim()) {
        e.preventDefault();
        addRecentSearch(searchQuery);
        setShowDropdown(false);
        if (isInHeader) {
          onSearchToggle?.(false);
        } else {
          toggleSearch();
        }
        navigate({ to: '/catalog', search: { search: encodeURIComponent(searchQuery.trim()) } });
        setSearchQuery('');
        setSearchResults([]);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const handleViewAll = () => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery);
    }
    if (isInHeader) {
      onSearchToggle?.(false);
    } else {
      toggleSearch();
    }
    navigate({ to: '/catalog', search: { search: encodeURIComponent(searchQuery.trim()) } });
    setSearchQuery('');
    setSearchResults([]);
  };

  const groupResults = () => {
    const groups: { [key: string]: SearchResult[] } = {
      brand: [],
      category: [],
      racket: [],
    };

    searchResults.forEach(result => {
      groups[result.type].push(result);
    });

    return groups;
  };

  const groupedResults = groupResults();
  const hasResults = searchResults.length > 0;

  let currentIndexTracker = 0;

  return (
    <SearchContainer ref={containerRef}>
      <SearchWrapper>
        <AnimatePresence>
          {(isSearchOpen || isInHeader) && (
            <SearchInputContainer
              $isInHeader={isInHeader}
              $isMobileContext={isMobileContext}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SearchInput
                ref={searchInputRef}
                placeholder={isInHeader ? 'Buscar palas, marcas, formas...' : 'Buscar...'}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyPress}
                onFocus={() => setShowDropdown(true)}
                $isInHeader={isInHeader}
                $isMobileContext={isMobileContext}
              />
              {!searchQuery ? (
                <KbdBadge $isInHeader={isInHeader}>⌘K</KbdBadge>
              ) : (
                <ClearButton
                  onClick={clearSearch}
                  $isInHeader={isInHeader}
                  $isMobileContext={isMobileContext}
                  aria-label='Limpiar búsqueda'
                >
                  <FiX size={14} />
                </ClearButton>
              )}
            </SearchInputContainer>
          )}
        </AnimatePresence>
      </SearchWrapper>

      <AnimatePresence>
        {(isSearchOpen || isInHeader) && showDropdown && (
          <SearchResultsDropdown
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {/* Pre-search view: Recent & Popular */}
            {!searchQuery.trim() && (
              <PreSearchContainer>
                {recentSearches.length > 0 && (
                  <>
                    <PreSearchTitle>
                      <FiClock size={12} /> Búsquedas recientes
                    </PreSearchTitle>
                    {recentSearches.map(q => (
                      <RecentSearchItem key={q} onClick={() => handleQuickTagSelect(q)}>
                        <span>{q}</span>
                        <FiX
                          size={12}
                          style={{ cursor: 'pointer', opacity: 0.6 }}
                          onClick={e => removeRecentSearch(e, q)}
                          aria-label='Eliminar búsqueda reciente'
                        />
                      </RecentSearchItem>
                    ))}
                  </>
                )}

                <PreSearchTitle style={{ marginTop: recentSearches.length > 0 ? 12 : 0 }}>
                  <FiTrendingUp size={12} /> Búsquedas populares
                </PreSearchTitle>
                <TagChipGrid>
                  {POPULAR_SEARCHES.map(tag => (
                    <TagChip key={tag} onClick={() => handleQuickTagSelect(tag)}>
                      {tag}
                    </TagChip>
                  ))}
                </TagChipGrid>
              </PreSearchContainer>
            )}

            {/* Results view */}
            {searchQuery.trim().length > 0 && !isLoading && !hasResults && (
              <NoResults>
                <NoResultsText>No se encontraron resultados para "{searchQuery}"</NoResultsText>
                <NoResultsHint>
                  Presiona <strong>Enter</strong> para buscar en el catálogo completo
                </NoResultsHint>
              </NoResults>
            )}

            {searchQuery.trim().length > 0 && hasResults && (
              <>
                {groupedResults.brand.length > 0 && (
                  <ResultsGroup>
                    <ResultsGroupHeader>
                      <FiTag size={12} />
                      <ResultsGroupTitle>Marcas</ResultsGroupTitle>
                      <ResultsGroupCount>{groupedResults.brand.length}</ResultsGroupCount>
                    </ResultsGroupHeader>
                    <SearchResultsList>
                      {groupedResults.brand.map(result => {
                        const itemIdx = currentIndexTracker++;
                        const isFocused = selectedIndex === itemIdx;
                        return (
                          <SearchResultItem
                            key={`brand-${result.data}`}
                            $variant='brand'
                            $isFocused={isFocused}
                            onClick={() => handleBrandSelect(result.data as string)}
                          >
                            <ResultIcon $variant='brand'>
                              <FiTag size={16} />
                            </ResultIcon>
                            <ResultInfo>
                              <ResultName $variant='brand'>
                                {formatBrandName(result.data as string)}
                              </ResultName>
                            </ResultInfo>
                          </SearchResultItem>
                        );
                      })}
                    </SearchResultsList>
                  </ResultsGroup>
                )}

                {groupedResults.category.length > 0 && (
                  <ResultsGroup>
                    <ResultsGroupHeader>
                      <FiGrid size={12} />
                      <ResultsGroupTitle>Formas</ResultsGroupTitle>
                      <ResultsGroupCount>{groupedResults.category.length}</ResultsGroupCount>
                    </ResultsGroupHeader>
                    <SearchResultsList>
                      {groupedResults.category.map(result => {
                        const itemIdx = currentIndexTracker++;
                        const isFocused = selectedIndex === itemIdx;
                        return (
                          <SearchResultItem
                            key={`category-${result.data}`}
                            $variant='category'
                            $isFocused={isFocused}
                            onClick={() => handleCategorySelect(result.data as string)}
                          >
                            <ResultIcon $variant='category'>
                              <FiGrid size={16} />
                            </ResultIcon>
                            <ResultInfo>
                              <ResultName $variant='category'>
                                {toTitleCase(result.data as string)}
                              </ResultName>
                              <ResultSubtext>Forma de pala</ResultSubtext>
                            </ResultInfo>
                          </SearchResultItem>
                        );
                      })}
                    </SearchResultsList>
                  </ResultsGroup>
                )}

                {groupedResults.racket.length > 0 && (
                  <ResultsGroup>
                    <ResultsGroupHeader>
                      <FiBox size={12} />
                      <ResultsGroupTitle>Palas</ResultsGroupTitle>
                      <ResultsGroupCount>{groupedResults.racket.length}</ResultsGroupCount>
                    </ResultsGroupHeader>
                    <SearchResultsList>
                      {groupedResults.racket.map(result => {
                        const racket = result.data as Racket;
                        const itemIdx = currentIndexTracker++;
                        const isFocused = selectedIndex === itemIdx;
                        const inComp = comparison?.isRacketInComparison?.(racket.nombre) || false;

                        return (
                          <SearchResultItem
                            key={`racket-${racket.nombre}-${racket.id}`}
                            $variant='racket'
                            $isFocused={isFocused}
                            onClick={() => handleRacketSelect(racket)}
                          >
                            <ResultImage
                              src={racket.imagenes?.[0] || ''}
                              alt={formatRacketName(racket)}
                              onError={e => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <ResultInfo>
                              <ResultName $variant='racket'>{formatRacketName(racket)}</ResultName>
                              <ResultSubtext>
                                {formatBrandName(racket.marca)} •{' '}
                                {racket.caracteristicas_forma ||
                                  racket.especificaciones?.forma ||
                                  'Forma no especificada'}
                              </ResultSubtext>
                            </ResultInfo>

                            {racket.precio_actual && (
                              <ResultPrice>€{racket.precio_actual}</ResultPrice>
                            )}

                            {comparison && (
                              <CompareButton
                                $inComparison={inComp}
                                onClick={e => {
                                  e.stopPropagation();
                                  if (inComp) {
                                    comparison.removeRacket(racket.nombre);
                                  } else {
                                    comparison.addRacket(racket);
                                  }
                                }}
                              >
                                {inComp ? <FiCheck size={12} /> : <FiPlus size={12} />}
                                {inComp ? 'Añadida' : 'Comparar'}
                              </CompareButton>
                            )}
                          </SearchResultItem>
                        );
                      })}
                    </SearchResultsList>
                  </ResultsGroup>
                )}

                <ViewAllLink onClick={handleViewAll}>
                  Ver todos los resultados en catálogo →
                </ViewAllLink>
              </>
            )}
          </SearchResultsDropdown>
        )}
      </AnimatePresence>
    </SearchContainer>
  );
};

export default GlobalSearch;

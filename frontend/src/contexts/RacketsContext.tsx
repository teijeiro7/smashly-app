import React, { createContext, ReactNode, useContext, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RacketService } from '../services/racketService';
import { Racket } from '../types/racket';

interface RacketsContextType {
  rackets: Racket[];
  loading: boolean;
  error: string | null;
  fetchRackets: () => Promise<void>;
  getRacketById: (id: string | number) => Racket | undefined;
  getRacketsByCategory: (category: string) => Racket[];
  searchRackets: (query: string) => Racket[];
  refreshRackets: () => Promise<void>;
}

interface RacketsProviderProps {
  children: ReactNode;
}

const RacketsContext = createContext<RacketsContextType | null>(null);

export const useRackets = (): RacketsContextType => {
  const context = useContext(RacketsContext);
  if (!context) throw new Error('useRackets debe usarse dentro de RacketsProvider');
  return context;
};

export const RacketsProvider: React.FC<RacketsProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();

  const { data: rackets = [], isLoading, error, refetch } = useQuery({
    queryKey: ['rackets', 'all'],
    queryFn: () => RacketService.getAllRackets(),
    staleTime: 1000 * 60 * 30, // 30 min — replaces ETag/localStorage weekly expiry
    gcTime: 1000 * 60 * 60,    // 1 hour in cache
  });

  const fetchRackets = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const refreshRackets = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['rackets', 'all'] });
    await refetch();
  }, [queryClient, refetch]);

  const getRacketById = useCallback((id: string | number): Racket | undefined => {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return rackets.find(r => r.id === numericId);
  }, [rackets]);

  const getRacketsByCategory = useCallback((category: string): Racket[] => {
    return rackets.filter(r => r.marca === category);
  }, [rackets]);

  const searchRackets = useCallback((query: string): Racket[] => {
    const q = query.toLowerCase();
    return rackets.filter(r =>
      (r.nombre || '').toLowerCase().includes(q) ||
      (r.marca || '').toLowerCase().includes(q) ||
      (r.modelo || '').toLowerCase().includes(q)
    );
  }, [rackets]);

  const value = useMemo<RacketsContextType>(() => ({
    rackets,
    loading: isLoading,
    error: error ? String(error) : null,
    fetchRackets,
    getRacketById,
    getRacketsByCategory,
    searchRackets,
    refreshRackets,
  }), [rackets, isLoading, error, fetchRackets, getRacketById, getRacketsByCategory, searchRackets, refreshRackets]);

  return <RacketsContext.Provider value={value}>{children}</RacketsContext.Provider>;
};

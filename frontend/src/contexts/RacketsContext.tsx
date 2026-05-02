import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { RacketService } from "../services/racketService";
import { Racket } from "../types/racket";

// Interfaz para el contexto
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

// Interfaz para las props del provider
interface RacketsProviderProps {
  children: ReactNode;
}

const RacketsContext = createContext<RacketsContextType | null>(null);

export const useRackets = (): RacketsContextType => {
  const context = useContext(RacketsContext);
  if (!context) {
    throw new Error("useRackets debe usarse dentro de RacketsProvider");
  }
  return context;
};

export const RacketsProvider: React.FC<RacketsProviderProps> = ({
  children,
}) => {
  const [rackets, setRackets] = useState<Racket[]>(() => {
    try {
      const cached = localStorage.getItem('smashly_catalog');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return !localStorage.getItem('smashly_catalog');
  });
  const [error, setError] = useState<string | null>(null);

  const fetchRackets = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      // Usar carga cacheada: checkea versión, carga de localStorage si coincide, API si cambió
      const data = await RacketService.getAllRacketsCached();
      setRackets(data);
      console.log(`Loaded ${data.length} rackets (cached: ${!!localStorage.getItem('smashly_catalog_version')})`);
    } catch (error: any) {
      setError(error.message || "Error al cargar las palas");
      console.error("Error fetching rackets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRackets = useCallback(async (): Promise<void> => {
    // refresh forza recarga del servidor (invalida caché local)
    localStorage.removeItem('smashly_catalog');
    localStorage.removeItem('smashly_catalog_version');
    await fetchRackets();
  }, [fetchRackets]);

  const getRacketById = useCallback((id: string | number): Racket | undefined => {
    const numericId = typeof id === "string" ? parseInt(id) : id;
    return rackets.find((racket) => racket.id === numericId);
  }, [rackets]);

  const getRacketsByCategory = useCallback((category: string): Racket[] => {
    return rackets.filter((racket) => racket.marca === category);
  }, [rackets]);

  const searchRackets = useCallback((query: string): Racket[] => {
    const lowerQuery = query.toLowerCase();
    return rackets.filter(
      (racket) =>
        (racket.nombre || '').toLowerCase().includes(lowerQuery) ||
        (racket.marca || '').toLowerCase().includes(lowerQuery) ||
        (racket.modelo || '').toLowerCase().includes(lowerQuery)
    );
  }, [rackets]);

  useEffect(() => {
    // Si ya tenemos datos en localStorage, validar versión en background
    if (rackets.length > 0) {
      RacketService.getCatalogVersion().then(serverVersion => {
        const localVersion = localStorage.getItem('smashly_catalog_version');
        if (localVersion !== serverVersion) {
          console.log('Catálogo desactualizado, recargando...');
          fetchRackets();
        }
      }).catch(console.error);
    } else {
      // Sin caché local, cargar desde API
      fetchRackets();
    }
  }, []);

  const value = useMemo<RacketsContextType>(() => ({
    rackets,
    loading,
    error,
    fetchRackets,
    getRacketById,
    getRacketsByCategory,
    searchRackets,
    refreshRackets,
  }), [rackets, loading, error, fetchRackets, getRacketById, getRacketsByCategory, searchRackets, refreshRackets]);

  return (
    <RacketsContext.Provider value={value}>{children}</RacketsContext.Provider>
  );
};

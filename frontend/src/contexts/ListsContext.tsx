import React, { createContext, ReactNode, useContext, useCallback, useMemo } from 'react';
import { sileo } from 'sileo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List, ListWithRackets, CreateListRequest } from '../types/list';
import { ListService } from '../services/listService';
import { useAuth } from './AuthContext';

interface ListsContextType {
  lists: List[];
  loading: boolean;
  fetchLists: () => Promise<void>;
  createList: (data: CreateListRequest) => Promise<List | null>;
  updateList: (listId: string, name: string, description?: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  getListById: (listId: string) => Promise<ListWithRackets | null>;
  addRacketToList: (listId: string, racketId: number) => Promise<void>;
  removeRacketFromList: (listId: string, racketId: number) => Promise<void>;
}

const ListsContext = createContext<ListsContextType | undefined>(undefined);

export const useList = (): ListsContextType => {
  const context = useContext(ListsContext);
  if (!context) throw new Error('useList debe usarse dentro de ListsProvider');
  return context;
};

interface ListsProviderProps { children: ReactNode }

export const ListsProvider: React.FC<ListsProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: lists = [], isLoading, refetch } = useQuery({
    queryKey: ['lists'],
    queryFn: () => ListService.getUserLists(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const fetchLists = useCallback(async () => { await refetch(); }, [refetch]);

  const createMutation = useMutation({
    mutationFn: (data: CreateListRequest) => ListService.createList(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: string; name: string; description?: string }) =>
      ListService.updateList(id, { name, description }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (listId: string) => ListService.deleteList(listId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] }),
  });

  const addRacketMutation = useMutation({
    mutationFn: ({ listId, racketId }: { listId: string; racketId: number }) =>
      ListService.addRacketToList(listId, racketId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] }),
  });

  const removeRacketMutation = useMutation({
    mutationFn: ({ listId, racketId }: { listId: string; racketId: number }) =>
      ListService.removeRacketFromList(listId, racketId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] }),
  });

  const createList = useCallback(async (data: CreateListRequest): Promise<List | null> => {
    try {
      const list = await createMutation.mutateAsync(data);
      sileo.success({ title: 'Éxito', description: 'Lista creada exitosamente' });
      return list;
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message || 'Error al crear la lista' });
      return null;
    }
  }, [createMutation]);

  const updateList = useCallback(async (listId: string, name: string, description?: string) => {
    try {
      await updateMutation.mutateAsync({ id: listId, name, description });
      sileo.success({ title: 'Éxito', description: 'Lista actualizada exitosamente' });
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message || 'Error al actualizar la lista' });
      throw error;
    }
  }, [updateMutation]);

  const deleteList = useCallback(async (listId: string) => {
    try {
      await deleteMutation.mutateAsync(listId);
      sileo.success({ title: 'Éxito', description: 'Lista eliminada exitosamente' });
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message || 'Error al eliminar la lista' });
      throw error;
    }
  }, [deleteMutation]);

  const getListById = useCallback(async (listId: string): Promise<ListWithRackets | null> => {
    try {
      return await ListService.getListById(listId);
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message || 'Error al obtener la lista' });
      return null;
    }
  }, []);

  const addRacketToList = useCallback(async (listId: string, racketId: number) => {
    try {
      await addRacketMutation.mutateAsync({ listId, racketId });
      sileo.success({ title: 'Éxito', description: 'Pala añadida a la lista' });
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message || 'Error al añadir pala a la lista' });
      throw error;
    }
  }, [addRacketMutation]);

  const removeRacketFromList = useCallback(async (listId: string, racketId: number) => {
    try {
      await removeRacketMutation.mutateAsync({ listId, racketId });
      sileo.success({ title: 'Éxito', description: 'Pala eliminada de la lista' });
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message || 'Error al eliminar pala de la lista' });
      throw error;
    }
  }, [removeRacketMutation]);

  const value = useMemo<ListsContextType>(() => ({
    lists,
    loading: isLoading,
    fetchLists,
    createList,
    updateList,
    deleteList,
    getListById,
    addRacketToList,
    removeRacketFromList,
  }), [lists, isLoading, fetchLists, createList, updateList, deleteList, getListById, addRacketToList, removeRacketFromList]);

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
};

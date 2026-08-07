import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ListsProvider, useList } from '../../../contexts/ListsContext';
import { ListService } from '../../../services/listService';
import { sileo } from 'sileo';

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../../../services/listService');
vi.mock('sileo', () => ({
  sileo: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ListsProvider>{children}</ListsProvider>
      </QueryClientProvider>
    );
  }
  return Wrapper;
}

describe('ListsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLists = [
    { id: '1', name: 'Mis Favoritas', user_id: 'user1', racket_count: 5 },
    { id: '2', name: 'Para Comprar', user_id: 'user1', racket_count: 3 },
  ];

  it('should initialize with empty lists', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    const wrapper = createWrapper();
    const { result } = renderHook(() => useList(), { wrapper });

    expect(result.current.lists).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch lists when fetchLists is called', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    (ListService.getUserLists as any).mockResolvedValue([]);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useList(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    (ListService.getUserLists as any).mockResolvedValueOnce(mockLists);

    await act(async () => {
      await result.current.fetchLists();
    });

    await waitFor(() => expect(result.current.lists).toEqual(mockLists));
  });

  it('should handle fetch error', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    (ListService.getUserLists as any).mockRejectedValue(new Error('Network error'));
    const wrapper = createWrapper();
    const { result } = renderHook(() => useList(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.lists).toEqual([]);
  });

  it('should create new list', async () => {
    const newList = { id: '3', name: 'Nueva Lista', user_id: 'user1', racket_count: 0 };
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    (ListService.getUserLists as any).mockResolvedValue([]);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useList(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    (ListService.createList as any).mockResolvedValueOnce(newList);

    let createdList: any = null;
    await act(async () => {
      createdList = await result.current.createList({ name: 'Nueva Lista' });
    });

    expect(createdList).toEqual(newList);
    expect(ListService.createList).toHaveBeenCalledWith({ name: 'Nueva Lista' });
    expect(sileo.success).toHaveBeenCalledWith(expect.objectContaining({ title: 'Éxito' }));
  });

  it('should update list', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    (ListService.getUserLists as any).mockResolvedValue([]);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useList(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    (ListService.updateList as any).mockResolvedValueOnce({ id: '1', name: 'Updated Name' });

    await act(async () => {
      await result.current.updateList('1', 'Updated Name');
    });

    expect(ListService.updateList).toHaveBeenCalledWith('1', {
      name: 'Updated Name',
      description: undefined,
    });
    expect(sileo.success).toHaveBeenCalledWith(expect.objectContaining({ title: 'Éxito' }));
  });

  it('should add racket to list', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    (ListService.getUserLists as any).mockResolvedValue([]);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useList(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    (ListService.addRacketToList as any).mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.addRacketToList('1', 123);
    });

    expect(ListService.addRacketToList).toHaveBeenCalledWith('1', 123);
    expect(sileo.success).toHaveBeenCalledWith(expect.objectContaining({ title: 'Éxito' }));
  });

  it('should remove racket from list', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    (ListService.getUserLists as any).mockResolvedValue([]);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useList(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    (ListService.removeRacketFromList as any).mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.removeRacketFromList('1', 123);
    });

    expect(ListService.removeRacketFromList).toHaveBeenCalledWith('1', 123);
    expect(sileo.success).toHaveBeenCalledWith(expect.objectContaining({ title: 'Éxito' }));
  });

  it('should delete list', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    (ListService.getUserLists as any).mockResolvedValue([]);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useList(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    (ListService.deleteList as any).mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.deleteList('1');
    });

    expect(ListService.deleteList).toHaveBeenCalledWith('1');
    expect(sileo.success).toHaveBeenCalledWith(expect.objectContaining({ title: 'Éxito' }));
  });
});

import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import { PlayerDashboard } from '../../../pages/PlayerDashboard';

const mocks = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGetLast: vi.fn(),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      full_name: 'Teije',
      game_level: 'Intermedio',
      current_racket: 'Nox ML10',
    },
  }),
}));

vi.mock('../../../contexts/RacketsContext', () => ({
  useRackets: () => ({
    rackets: [],
    loading: false,
  }),
}));

vi.mock('../../../components/dashboard/QuickActionCard', () => ({
  QuickActionCard: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('../../../components/features/CurrentRacketFinderModal', () => ({
  default: () => null,
}));

vi.mock('../../../services/listService', () => ({
  ListService: {
    getUserLists: vi.fn().mockResolvedValue([]),
    getListById: vi.fn(),
  },
}));

vi.mock('../../../services/racketService', () => ({
  RacketService: {
    getAllRackets: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../services/racketViewService', () => ({
  RacketViewService: {
    getRecentlyViewed: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../services/recommendationService', () => ({
  RecommendationService: {
    getLast: mocks.mockGetLast,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mocks.mockNavigate,
  };
});

const recommendation = {
  id: 'rec-1',
  user_id: 'user-1',
  form_type: 'advanced',
  form_data: {},
  created_at: '2026-05-09T00:00:00.000Z',
  recommendation_result: {
    rackets: [
      {
        id: 101,
        name: 'nox x-zero red 2026 (pala)',
        brand: 'Nox',
        image: 'https://example.com/1.png',
        match_score: 88,
        price: 74.95,
        reason:
          'La Nox X-Zero Red 2026 combina control y manejabilidad para defender con seguridad y acelerar la transición al ataque.',
      },
      {
        id: 102,
        name: 'wilson optix v2 power blue 2026',
        brand: 'Wilson',
        image: 'https://example.com/2.png',
        match_score: 86,
        price: 129.95,
        reason:
          'La Wilson Optix V2 Power Blue equilibra potencia y control en una pala cómoda para jugadores de nivel intermedio.',
      },
      {
        id: 103,
        name: 'drop shot explorer pro comfort 2.0 2026 l. campagnolo',
        brand: 'Drop Shot',
        image: 'https://example.com/3.png',
        match_score: 85,
        price: 219.95,
        reason:
          'La Drop Shot Explorer Pro Comfort 2.0 ofrece un punto dulce amplio y sensaciones cómodas para el juego de fondo.',
      },
    ],
  },
};

describe('PlayerDashboard recommendation cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetLast.mockResolvedValue(recommendation as any);
  });

  const renderDashboard = async () => {
    render(
      <MemoryRouter>
        <PlayerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Tus próximas palas/i })).toBeInTheDocument();
    });
  };

  it('renders only the model name in title case for each recommendation', async () => {
    await renderDashboard();

    expect(screen.getByRole('heading', { name: 'X-Zero Red 2026' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Optix V2 Power Blue 2026' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Explorer Pro Comfort 2.0 2026 L. Campagnolo' })
    ).toBeInTheDocument();

    expect(screen.queryByRole('heading', { name: /Nox x-zero red 2026/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Wilson optix v2 power blue 2026/i })).not.toBeInTheDocument();
  });

  it('keeps the detail CTA anchored as the last element inside each card and links to detail pages', async () => {
    await renderDashboard();

    const detailLinks = screen.getAllByRole('link', { name: /ver detalle/i });
    expect(detailLinks).toHaveLength(3);

    expect(detailLinks[0]).toHaveAttribute('href', '/racket-detail?id=101');
    expect(detailLinks[1]).toHaveAttribute('href', '/racket-detail?id=102');
    expect(detailLinks[2]).toHaveAttribute('href', '/racket-detail?id=103');

    detailLinks.forEach(link => {
      expect(link.parentElement?.lastElementChild).toBe(link);
      expect(within(link.parentElement as HTMLElement).getByRole('link', { name: /ver detalle/i })).toBe(link);
    });
  });
});
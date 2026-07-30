import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ErrorPage from '../../../pages/ErrorPage';

const mockNavigate = vi.fn();
let mockSearchState = { type: 'default', message: undefined as string | undefined };

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useSearch: () => mockSearchState,
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('../../../components/seo/SEO', () => ({
  default: ({ title }: { title: string }) => <title>{title}</title>,
}));

describe('ErrorPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchState = { type: 'default', message: undefined };
  });

  it('renders default error information correctly', () => {
    render(<ErrorPage />);

    expect(screen.getByText('ERROR')).toBeInTheDocument();
    expect(screen.getByText('Ha ocurrido un error inesperado')).toBeInTheDocument();
    expect(
      screen.getByText('Algo no salió como esperábamos. Por favor, intenta nuevamente más tarde.')
    ).toBeInTheDocument();
    expect(screen.getByText('Ir a Inicio')).toBeInTheDocument();
    expect(screen.getByText('Volver Atrás')).toBeInTheDocument();
  });

  it('renders 404 error type correctly', () => {
    mockSearchState = { type: '404', message: undefined };
    render(<ErrorPage />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Página o recurso no encontrado')).toBeInTheDocument();
    expect(screen.getByText('No Encontrado')).toBeInTheDocument();
  });

  it('renders 403 error type correctly', () => {
    mockSearchState = { type: '403', message: undefined };
    render(<ErrorPage />);

    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.getByText('No tienes permisos suficientes')).toBeInTheDocument();
    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
  });

  it('renders 500 error type correctly', () => {
    mockSearchState = { type: '500', message: undefined };
    render(<ErrorPage />);

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Algo falló en nuestros servidores')).toBeInTheDocument();
  });

  it('renders unauthorized error type correctly', () => {
    mockSearchState = { type: 'unauthorized', message: undefined };
    render(<ErrorPage />);

    expect(screen.getByText('401')).toBeInTheDocument();
    expect(screen.getByText('Identificación requerida')).toBeInTheDocument();
    expect(screen.getByText('Ir a Inicio')).toBeInTheDocument();
  });

  it('displays custom message when provided in search params', () => {
    mockSearchState = { type: '500', message: 'Mensaje de error personalizado' };
    render(<ErrorPage />);

    expect(screen.getByText('Mensaje de error personalizado')).toBeInTheDocument();
  });

  it('navigates to home when "Ir a Inicio" button is clicked', () => {
    render(<ErrorPage />);

    const homeButton = screen.getByText('Ir a Inicio');
    fireEvent.click(homeButton);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('triggers history back when "Volver Atrás" button is clicked', () => {
    const historySpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    render(<ErrorPage />);

    const backButton = screen.getByText('Volver Atrás');
    fireEvent.click(backButton);

    expect(historySpy).toHaveBeenCalled();
  });

  it('renders quick links section', () => {
    render(<ErrorPage />);

    expect(screen.getByText('Catálogo')).toBeInTheDocument();
    expect(screen.getByText('Comparador')).toBeInTheDocument();
    expect(screen.getByText('Tiendas')).toBeInTheDocument();
  });
});

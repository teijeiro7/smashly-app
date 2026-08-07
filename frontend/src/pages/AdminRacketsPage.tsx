import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { Link } from '@tanstack/react-router';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiPackage,
  FiTag,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { Racket } from '@/types/racket';
import { racketImageUrl } from '../utils/imageUrl';
import { formatBrandName, formatRacketName } from '../utils/textUtils';
import racketService from '@/services/racketService';
import { EditRacketModal } from '@/components/admin/EditRacketModal';
import { useDebounce } from '@/hooks/useDebounce';
import { sileo } from 'sileo';

const PAGE_SIZE = 50;

const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--surface-2);
  padding: 2rem;
`;

const Header = styled.div`
  max-width: 1400px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: var(--surface);
  border-radius: 8px;
  box-shadow: 0 1px 3px var(--shadow-color);
  transition: all 0.2s;

  &:hover {
    background: var(--surface-3);
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px var(--shadow-color);
  flex: 1;
  max-width: 400px;
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.875rem;
  color: var(--text);

  &::placeholder {
    color: var(--text-subtle);
  }
`;

const SearchIcon = styled.div`
  color: var(--text-subtle);
  display: flex;
  align-items: center;
`;

const FiltersContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto 1rem;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: flex-end;
  padding: 1rem;
  background: var(--surface);
  border-radius: 8px;
  box-shadow: 0 1px 3px var(--shadow-color);
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const FilterLabel = styled.label`
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const FilterSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--text);
  background: var(--surface);
  min-width: 140px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
  }
`;

const ClearFiltersButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-3);
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
  cursor: pointer;
  align-self: flex-end;
  transition: all 0.2s;

  &:hover {
    background: var(--border);
    color: var(--text);
  }
`;

const ResultsInfo = styled.span`
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-left: auto;
  align-self: flex-end;
  white-space: nowrap;
`;

const BulkReplaceButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: var(--primary);
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  color: white;
  cursor: pointer;
  align-self: flex-end;
  transition: all 0.2s;
  font-weight: 500;

  &:hover {
    background: var(--primary-hover);
  }

  &:disabled {
    background: var(--text-subtle);
    cursor: not-allowed;
  }
`;

const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const TableContainer = styled.div`
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 4px 6px var(--shadow-color);
  overflow: hidden;
  border: 1px solid var(--border);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 1rem;
  background: var(--surface-2);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.875rem;
  color: var(--text);
  vertical-align: middle;
`;

const RacketInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const RacketImage = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 8px;
  background: var(--racket-image-bg);
  border: var(--racket-image-border);
  box-shadow: var(--racket-image-shadow);
  padding: 0.125rem;
`;

const RacketName = styled.div`
  font-weight: 600;
  color: var(--text);
`;

const RacketDetails = styled.div`
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
`;

interface PriceProps {
  sale?: boolean;
  isBest?: boolean;
}

const Price = styled.span<PriceProps>`
  font-weight: ${props => (props.isBest ? '700' : '600')};
  color: ${props =>
    props.isBest ? 'var(--success)' : props.sale ? 'var(--error)' : 'var(--text)'};
  font-size: ${props => (props.isBest ? '1rem' : '0.875rem')};
  background: ${props => (props.isBest ? 'var(--primary-subtle)' : 'transparent')};
  padding: ${props => (props.isBest ? '2px 6px' : '0')};
  border-radius: ${props => (props.isBest ? '4px' : '0')};
  border: ${props => (props.isBest ? '1px solid var(--primary-subtle)' : 'none')};
`;

const Badge = styled.span<{ variant: 'success' | 'warning' | 'default' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;

  ${props => {
    switch (props.variant) {
      case 'success':
        return `
          background: var(--primary-subtle);
          color: var(--primary-hover);
        `;
      case 'warning':
        return `
          background: #fef3c7;
          color: #92400e;
        `;
      default:
        return `
          background: var(--surface-3);
          color: var(--text);
        `;
    }
  }}
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ variant?: 'edit' | 'delete' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  ${props =>
    props.variant === 'edit'
      ? `
        background: #eff6ff;
        color: var(--info);
        &:hover { background: #dbeafe; }
      `
      : `
        background: var(--danger-subtle);
        color: var(--error);
        &:hover { background: var(--danger-subtle); }
      `}
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  color: var(--text-muted);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem;
  color: var(--text-muted);
`;

const StatsBar = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: 8px;
  box-shadow: 0 1px 3px var(--shadow-color);
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-muted);

  span {
    font-weight: 600;
    color: var(--text);
  }
`;

const PaginationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem 0;
`;

const PageButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--surface-3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageIndicator = styled.span`
  font-size: 0.875rem;
  color: var(--text-muted);
`;

const AdminRacketsPage: React.FC = () => {
  const [rackets, setRackets] = useState<Racket[]>([]);
  // null = unknown total (unfiltered getRacketsWithPagination doesn't return
  // a count) — pagination then falls back to a "got a full page" heuristic.
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [editingRacket, setEditingRacket] = useState<Racket | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filtros
  const [filterMarca, setFilterMarca] = useState('');
  const [filterForma, setFilterForma] = useState('');
  const [filterNivel, setFilterNivel] = useState('');
  const [filterOferta, setFilterOferta] = useState('');

  // ponytail: filter dropdown options are page-scoped now (previously
  // computed from a full 1333-row download). Wire a distinct-values
  // endpoint if an incomplete brand/shape/level list becomes a real
  // complaint — for now this avoids re-introducing the full-table fetch
  // pagination was added to remove.
  const uniqueMarcas = useMemo(() => {
    const marcas = new Set(rackets.map(r => r.marca).filter(Boolean));
    return Array.from(marcas).sort();
  }, [rackets]);

  const uniqueFormas = useMemo(() => {
    const formas = new Set(rackets.map(r => r.caracteristicas_forma).filter(Boolean));
    return Array.from(formas).sort();
  }, [rackets]);

  const uniqueNiveles = useMemo(() => {
    const niveles = new Set(rackets.map(r => r.caracteristicas_nivel_de_juego).filter(Boolean));
    return Array.from(niveles).sort();
  }, [rackets]);

  // Oferta no tiene equivalente server-side limpio (on_offer=false excluiría
  // filas NULL que sí deben contarse como "sin oferta") — se sigue aplicando
  // en cliente, pero ahora solo sobre la página actual, no sobre las 1333
  // palas.
  const filteredRackets = useMemo(() => {
    if (filterOferta === 'oferta') return rackets.filter(r => r.en_oferta === true);
    if (filterOferta === 'no-oferta') return rackets.filter(r => r.en_oferta !== true);
    return rackets;
  }, [rackets, filterOferta]);

  const clearFilters = () => {
    setFilterMarca('');
    setFilterForma('');
    setFilterNivel('');
    setFilterOferta('');
    setSearchQuery('');
  };

  const hasActiveFilters = filterMarca || filterForma || filterNivel || filterOferta || searchQuery;
  const hasServerQuery = Boolean(
    debouncedSearchQuery.trim() || filterMarca || filterForma || filterNivel
  );

  // Cualquier cambio de búsqueda/filtro server-side vuelve a la primera página.
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery, filterMarca, filterForma, filterNivel]);

  useEffect(() => {
    loadRackets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearchQuery, filterMarca, filterForma, filterNivel]);

  const loadRackets = async () => {
    try {
      setLoading(true);
      if (hasServerQuery) {
        const filters: Record<string, string> = {};
        if (filterMarca) filters.marca = filterMarca;
        if (filterForma) filters.forma = filterForma;
        if (filterNivel) filters.nivel = filterNivel;

        const { data, pagination } = await racketService.searchRackets(
          debouncedSearchQuery,
          filters,
          {
            page,
            limit: PAGE_SIZE,
          }
        );
        setRackets(data);
        setTotalCount(pagination?.total ?? null);
      } else {
        const data = await racketService.getRacketsWithPagination(page, PAGE_SIZE);
        setRackets(data);
        setTotalCount(null);
      }
    } catch (error) {
      console.error('Error loading rackets:', error);
      sileo.error({ title: 'Error', description: 'Error al cargar las palas' });
    } finally {
      setLoading(false);
    }
  };

  const hasNextPage =
    totalCount !== null ? (page + 1) * PAGE_SIZE < totalCount : rackets.length === PAGE_SIZE;
  const hasPrevPage = page > 0;

  const handleEdit = (racket: Racket) => {
    setEditingRacket(racket);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (updatedRacket: Racket) => {
    setRackets(prev => prev.map(r => (r.id === updatedRacket.id ? updatedRacket : r)));
  };

  const handleDelete = async (racket: Racket) => {
    if (!racket.id) return;

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar la pala "${racket.nombre || racket.modelo}"?`
    );
    if (!confirmed) return;

    try {
      await racketService.deleteRacket(racket.id);
      setRackets(prev => prev.filter(r => r.id !== racket.id));
      sileo.success({ title: 'Éxito', description: 'Pala eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting racket:', error);
      sileo.error({ title: 'Error', description: 'Error al eliminar la pala' });
    }
  };

  const handleBulkReplace = async (field: string, oldValue: string) => {
    if (!oldValue) return;

    const newValue = window.prompt(
      `Reemplazar todas las palas donde "${field}" es "${oldValue}" por:`,
      oldValue
    );

    if (newValue === null || newValue === oldValue) return;

    try {
      setIsUpdating(true);
      const fieldMapping: Record<string, string> = {
        Marca: 'marca',
        Forma: 'caracteristicas_forma',
        Nivel: 'caracteristicas_nivel_de_juego',
      };

      const backendField = fieldMapping[field];
      if (!backendField) return;

      const result = await racketService.bulkUpdateRackets(backendField, oldValue, newValue);
      sileo.success({
        title: 'Éxito',
        description: `${result.updatedCount} palas actualizadas de "${oldValue}" a "${newValue}"`,
      });

      // Recargar palas para ver los cambios
      await loadRackets();
    } catch (error) {
      console.error('Error in bulk replace:', error);
      sileo.error({ title: 'Error', description: 'Error al realizar la actualización masiva' });
    } finally {
      setIsUpdating(false);
    }
  };

  const totalOnSale = rackets.filter(r => r.en_oferta).length;
  const totalBrands = new Set(rackets.map(r => r.marca).filter(Boolean)).size;

  if (loading) {
    return (
      <PageContainer>
        <LoadingContainer>Cargando palas...</LoadingContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <HeaderLeft>
          <BackButton to='/admin'>
            <FiArrowLeft /> Volver
          </BackButton>
          <Title>Gestión de Palas{totalCount !== null ? ` (${totalCount})` : ''}</Title>
        </HeaderLeft>
        <SearchContainer>
          <SearchIcon>
            <FiSearch />
          </SearchIcon>
          <SearchInput
            placeholder='Buscar por marca, modelo o nombre...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
      </Header>

      <FiltersContainer>
        <FilterGroup>
          <FilterLabel>Marca</FilterLabel>
          <FilterSelect value={filterMarca} onChange={e => setFilterMarca(e.target.value)}>
            <option value=''>Todas</option>
            {uniqueMarcas.map(marca => (
              <option key={marca} value={marca}>
                {formatBrandName(marca)}
              </option>
            ))}
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Forma</FilterLabel>
          <FilterSelect value={filterForma || ''} onChange={e => setFilterForma(e.target.value)}>
            <option value=''>Todas</option>
            {uniqueFormas.map(forma => (
              <option key={forma} value={forma || ''}>
                {forma}
              </option>
            ))}
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Nivel</FilterLabel>
          <FilterSelect value={filterNivel || ''} onChange={e => setFilterNivel(e.target.value)}>
            <option value=''>Todos</option>
            {uniqueNiveles.map(nivel => (
              <option key={nivel} value={nivel || ''}>
                {nivel}
              </option>
            ))}
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Oferta</FilterLabel>
          <FilterSelect value={filterOferta} onChange={e => setFilterOferta(e.target.value)}>
            <option value=''>Todas</option>
            <option value='oferta'>En oferta</option>
            <option value='no-oferta'>Sin oferta</option>
          </FilterSelect>
        </FilterGroup>

        {filterForma && (
          <BulkReplaceButton
            onClick={() => handleBulkReplace('Forma', filterForma)}
            disabled={isUpdating}
          >
            Reemplazar Todo ({filterForma})
          </BulkReplaceButton>
        )}

        {filterMarca && (
          <BulkReplaceButton
            onClick={() => handleBulkReplace('Marca', filterMarca)}
            disabled={isUpdating}
          >
            Reemplazar Todo ({filterMarca})
          </BulkReplaceButton>
        )}

        {filterNivel && (
          <BulkReplaceButton
            onClick={() => handleBulkReplace('Nivel', filterNivel)}
            disabled={isUpdating}
          >
            Reemplazar Todo ({filterNivel})
          </BulkReplaceButton>
        )}

        {hasActiveFilters && (
          <ClearFiltersButton onClick={clearFilters}>
            <FiX size={14} /> Limpiar
          </ClearFiltersButton>
        )}

        <ResultsInfo>
          {filteredRackets.length} palas en esta página
          {totalCount !== null ? ` de ${totalCount} total` : ''}
        </ResultsInfo>
      </FiltersContainer>

      <Content>
        <StatsBar>
          <Stat>
            <FiPackage size={16} />
            <span>{rackets.length}</span> En esta página
          </Stat>
          <Stat>
            <FiTag size={16} />
            <span>{totalOnSale}</span> En Oferta
          </Stat>
          <Stat>
            <span>{totalBrands}</span> Marcas
          </Stat>
        </StatsBar>

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th>Pala</Th>
                <Th>Marca</Th>
                <Th>PadelNuestro</Th>
                <Th>PadelMarket</Th>
                <Th>PadelProShop</Th>
                <Th>Precio Actual</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {filteredRackets.length === 0 ? (
                <tr>
                  <Td colSpan={8}>
                    <EmptyState>
                      {searchQuery ? 'No se encontraron palas' : 'No hay palas disponibles'}
                    </EmptyState>
                  </Td>
                </tr>
              ) : (
                filteredRackets.map(racket => (
                  <tr key={racket.id}>
                    <Td>
                      <RacketInfo>
                        {racket.imagenes && racket.imagenes.length > 0 && racket.imagenes[0] ? (
                          <RacketImage
                            src={racketImageUrl(racket.imagenes[0])}
                            alt={racket.modelo || 'Pala'}
                          />
                        ) : (
                          <RacketImage src='/placeholder-racket.svg' alt='Sin imagen' />
                        )}
                        <div>
                          <RacketName>{formatRacketName(racket) || 'Sin nombre'}</RacketName>
                          <RacketDetails>
                            {racket.caracteristicas_forma || '-'} •{' '}
                            {racket.caracteristicas_balance || '-'}
                          </RacketDetails>
                        </div>
                      </RacketInfo>
                    </Td>
                    <Td>{formatBrandName(racket.marca) || '-'}</Td>
                    <Td>
                      {racket.padelnuestro_precio_actual != null ? (
                        <Price sale={racket.en_oferta}>
                          {Number(racket.padelnuestro_precio_actual).toFixed(2)}€
                        </Price>
                      ) : (
                        '-'
                      )}
                    </Td>
                    <Td>
                      {racket.padelmarket_precio_actual != null ? (
                        <Price sale={racket.en_oferta}>
                          {Number(racket.padelmarket_precio_actual).toFixed(2)}€
                        </Price>
                      ) : (
                        '-'
                      )}
                    </Td>
                    <Td>
                      {racket.padelproshop_precio_actual != null ? (
                        <Price sale={racket.en_oferta}>
                          {Number(racket.padelproshop_precio_actual).toFixed(2)}€
                        </Price>
                      ) : (
                        '-'
                      )}
                    </Td>
                    <Td>
                      {racket.precio_actual != null ? (
                        <Price sale={racket.en_oferta} isBest={true}>
                          {Number(racket.precio_actual).toFixed(2)}€
                        </Price>
                      ) : (
                        '-'
                      )}
                    </Td>
                    <Td>
                      {racket.en_oferta ? (
                        <Badge variant='success'>
                          <FiTag size={12} /> En Oferta
                        </Badge>
                      ) : (
                        <Badge variant='default'>Normal</Badge>
                      )}
                    </Td>
                    <Td>
                      <Actions>
                        <ActionButton
                          variant='edit'
                          onClick={() => handleEdit(racket)}
                          title='Editar'
                        >
                          <FiEdit2 size={16} />
                        </ActionButton>
                        <ActionButton
                          variant='delete'
                          onClick={() => handleDelete(racket)}
                          title='Eliminar'
                        >
                          <FiTrash2 size={16} />
                        </ActionButton>
                      </Actions>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableContainer>

        <PaginationBar>
          <PageButton
            onClick={() => setPage(p => Math.max(p - 1, 0))}
            disabled={!hasPrevPage || loading}
          >
            <FiChevronLeft size={16} /> Anterior
          </PageButton>
          <PageIndicator>Página {page + 1}</PageIndicator>
          <PageButton onClick={() => setPage(p => p + 1)} disabled={!hasNextPage || loading}>
            Siguiente <FiChevronRight size={16} />
          </PageButton>
        </PaginationBar>
      </Content>

      {editingRacket && (
        <EditRacketModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRacket(null);
          }}
          racket={editingRacket}
          onUpdate={handleUpdate}
        />
      )}
    </PageContainer>
  );
};

export default AdminRacketsPage;

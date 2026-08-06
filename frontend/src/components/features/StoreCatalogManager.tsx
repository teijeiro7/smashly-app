import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiPackage, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { sileo } from 'sileo';
import catalogService, { StorePrice } from '../../services/catalogService';
import AddRacketModal from './AddRacketModal';

const Container = styled.div`
  background: var(--surface);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, var(--brand-surface) 0%, var(--success) 100%);
  color: var(--brand-on-surface);
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(var(--primary-rgb), 0.3);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
`;

const EmptyIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--text-subtle);
`;

const EmptyText = styled.p`
  font-size: 0.95rem;
  margin: 0 0 1.5rem;
  line-height: 1.6;
`;

const RacketList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RacketRow = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-2);
  border-radius: 12px;
  border: 1px solid var(--border);
`;

const RacketImage = styled.img`
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 8px;
  background: var(--surface);
  flex-shrink: 0;
`;

const RacketInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const RacketName = styled.div`
  font-weight: 600;
  color: var(--text);
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RacketBrand = styled.div`
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.125rem;
`;

const PriceSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex-shrink: 0;
`;

const PriceDisplay = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-hover);
`;

const OriginalPrice = styled.div`
  font-size: 0.75rem;
  color: var(--text-muted);
  text-decoration: line-through;
`;

const LinkDisplay = styled.a`
  font-size: 0.75rem;
  color: var(--primary);
  text-decoration: none;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    text-decoration: underline;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
`;

const IconButton = styled.button<{ $danger?: boolean }>`
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  background: ${({ $danger }) => ($danger ? 'rgba(220, 38, 38, 0.10)' : 'var(--primary-subtle)')};
  color: ${({ $danger }) => ($danger ? 'var(--danger)' : 'var(--primary-hover)')};
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    background: ${({ $danger }) => ($danger ? 'var(--danger)' : 'var(--brand-surface)')};
    color: ${({ $danger }) => ($danger ? 'white' : 'var(--brand-on-surface)')};
  }
`;

const EditRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const PriceInput = styled.input`
  width: 80px;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.85rem;
  text-align: right;
  background: var(--surface);
  color: var(--text);

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const LinkInput = styled.input`
  width: 140px;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.8rem;
  background: var(--surface);
  color: var(--text);

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const PaginationRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  padding: 0.375rem 0.75rem;
  border: 1px solid ${({ $active }) => ($active ? 'var(--primary)' : 'var(--border)')};
  border-radius: 6px;
  background: ${({ $active }) => ($active ? 'var(--primary-subtle)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--primary-hover)' : 'var(--text-muted)')};
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    border-color: var(--primary);
  }
`;

interface StoreCatalogManagerProps {
  storeId: string;
}

const StoreCatalogManager: React.FC<StoreCatalogManagerProps> = ({ storeId }) => {
  const [prices, setPrices] = useState<StorePrice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editLink, setEditLink] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const result = await catalogService.list(storeId, page);
      setPrices(result.data);
      setTotal(result.total);
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [storeId, page]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleStartEdit = (item: StorePrice) => {
    setEditingId(item.id);
    setEditPrice(item.price?.toString() || '');
    setEditLink(item.link || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (item: StorePrice) => {
    setSavingEdit(true);
    try {
      const updated = await catalogService.update(storeId, item.id, {
        price: editPrice ? parseFloat(editPrice) : undefined,
        link: editLink || undefined,
      });
      setPrices(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      setEditingId(null);
      sileo.success({ title: 'Actualizado' });
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRemove = async (priceId: string) => {
    try {
      await catalogService.remove(storeId, priceId);
      setPrices(prev => prev.filter(p => p.id !== priceId));
      setTotal(prev => prev - 1);
      sileo.success({ title: 'Eliminado del catálogo' });
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message });
    }
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <Container>
      <Header>
        <Title>Catálogo de palas ({total})</Title>
        <AddButton onClick={() => setShowAddModal(true)}>
          <FiPlus /> Añadir pala
        </AddButton>
      </Header>

      {loading ? (
        <EmptyState>
          <p>Cargando catálogo...</p>
        </EmptyState>
      ) : prices.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FiPackage />
          </EmptyIcon>
          <EmptyText>
            Aún no has añadido ninguna pala a tu catálogo. Busca en nuestra base de datos las palas
            que vendes y añade tu precio.
          </EmptyText>
          <AddButton onClick={() => setShowAddModal(true)}>
            <FiSearch /> Buscar y añadir
          </AddButton>
        </EmptyState>
      ) : (
        <RacketList>
          <AnimatePresence>
            {prices.map(item => (
              <RacketRow
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {item.racket?.images?.[0] ? (
                  <RacketImage src={item.racket.images[0]} alt={item.racket.name} />
                ) : (
                  <RacketImage
                    src=''
                    alt=''
                    style={{
                      background: 'var(--surface-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                    }}
                  />
                )}

                <RacketInfo>
                  <RacketName>{item.racket?.name || `Racket #${item.racket_id}`}</RacketName>
                  {item.racket?.brand && <RacketBrand>{item.racket.brand}</RacketBrand>}
                </RacketInfo>

                {editingId === item.id ? (
                  <EditRow>
                    <PriceInput
                      type='number'
                      step='0.01'
                      placeholder='€'
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                    />
                    <LinkInput
                      placeholder='URL (opcional)'
                      value={editLink}
                      onChange={e => setEditLink(e.target.value)}
                    />
                    <IconButton
                      onClick={() => handleSaveEdit(item)}
                      disabled={savingEdit}
                      aria-label='Guardar'
                    >
                      <FiSave />
                    </IconButton>
                    <IconButton onClick={handleCancelEdit} aria-label='Cancelar'>
                      <FiX />
                    </IconButton>
                  </EditRow>
                ) : (
                  <>
                    <PriceSection>
                      {item.price ? <PriceDisplay>{item.price}€</PriceDisplay> : null}
                      {item.original_price ? (
                        <OriginalPrice>{item.original_price}€</OriginalPrice>
                      ) : null}
                      {item.link && (
                        <LinkDisplay href={item.link} target='_blank' rel='noopener'>
                          {item.link}
                        </LinkDisplay>
                      )}
                    </PriceSection>
                    <Actions>
                      <IconButton onClick={() => handleStartEdit(item)} aria-label='Editar'>
                        <FiEdit2 />
                      </IconButton>
                      <IconButton
                        $danger
                        onClick={() => handleRemove(item.id)}
                        aria-label='Eliminar'
                      >
                        <FiTrash2 />
                      </IconButton>
                    </Actions>
                  </>
                )}
              </RacketRow>
            ))}
          </AnimatePresence>
        </RacketList>
      )}

      {totalPages > 1 && (
        <PaginationRow>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <PageButton key={p} $active={p === page} onClick={() => setPage(p)}>
              {p}
            </PageButton>
          ))}
        </PaginationRow>
      )}

      <AddRacketModal
        storeId={storeId}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={() => {
          setShowAddModal(false);
          loadCatalog();
        }}
      />
    </Container>
  );
};

export default StoreCatalogManager;

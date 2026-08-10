import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiSearch, FiCheck, FiPackage } from 'react-icons/fi';
import { sileo } from 'sileo';
import catalogService, { CatalogSearchResult } from '../../services/catalogService';
import { onActivationKeyDown } from '../../utils/a11y';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--surface-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Modal = styled.div`
  background: var(--surface);
  border-radius: 20px;
  max-width: 560px;
  width: 95%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  animation: slideUp 0.3s ease;
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 6px;
  &:hover {
    background: var(--surface-3);
    color: var(--text);
  }
`;

const SearchBar = styled.div`
  padding: 1rem 1.5rem;
  position: relative;
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 2rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-subtle);
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 0.95rem;
  background: var(--surface);
  color: var(--text);
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
  }
`;

const ResultsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 1.5rem 1rem;
`;

const ResultRow = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  background: ${({ $selected }) => ($selected ? 'var(--primary-subtle)' : 'transparent')};
  border: 1px solid ${({ $selected }) => ($selected ? 'var(--primary)' : 'transparent')};

  &:hover {
    background: ${({ $selected }) => ($selected ? 'var(--primary-subtle)' : 'var(--surface-2)')};
  }

  & + & {
    margin-top: 0.5rem;
  }
`;

const ResultImg = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 8px;
  background: var(--surface);
  flex-shrink: 0;
`;

const ResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ResultName = styled.div`
  font-weight: 600;
  color: var(--text);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ResultBrand = styled.div`
  font-size: 0.8rem;
  color: var(--text-muted);
`;

const ResultScore = styled.span`
  font-size: 0.7rem;
  color: var(--text-subtle);
`;

const SelectCheck = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const PriceForm = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PriceRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const FormInput = styled.input`
  flex: 1;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--surface);
  color: var(--text);
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const AddToCatalogBtn = styled.button`
  padding: 0.75rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--brand-surface) 0%, var(--success) 100%);
  color: var(--brand-on-surface);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(var(--primary-rgb), 0.3);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Spinner = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
`;

const NoResults = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
`;

interface AddRacketModalProps {
  storeId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const AddRacketModal: React.FC<AddRacketModalProps> = ({ storeId, isOpen, onClose, onAdded }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [adding, setAdding] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearched(true);
    setSelectedId(null);
    try {
      const result = await catalogService.search(storeId, q);
      setResults(result.data);
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message });
    } finally {
      setSearching(false);
    }
  }, [query, storeId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelect = (id: number) => {
    setSelectedId(id === selectedId ? null : id);
    setPrice('');
    setLink('');
  };

  const handleAdd = async () => {
    if (!selectedId) return;
    setAdding(true);
    try {
      await catalogService.add(storeId, {
        racket_id: selectedId,
        price: price ? parseFloat(price) : undefined,
        link: link || undefined,
      });
      sileo.success({ title: 'Añadida al catálogo' });
      onAdded();
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message });
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  const selectedRacket = results.find(r => r.id === selectedId);

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>Añadir pala al catálogo</Title>
          <CloseBtn onClick={onClose} aria-label='Cerrar'>
            <FiX size={22} />
          </CloseBtn>
        </Header>

        <SearchBar>
          <SearchIcon />
          <SearchInput
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Buscar por nombre, marca o modelo...'
          />
        </SearchBar>

        {searching ? (
          <Spinner>Buscando...</Spinner>
        ) : results.length > 0 ? (
          <ResultsList>
            {results.map(r => (
              <ResultRow
                key={r.id}
                $selected={r.id === selectedId}
                role='button'
                tabIndex={0}
                onClick={() => handleSelect(r.id)}
                onKeyDown={onActivationKeyDown(() => handleSelect(r.id))}
              >
                {r.images?.[0] ? (
                  <ResultImg src={r.images[0]} alt={r.name} />
                ) : (
                  <ResultImg src='' alt='' style={{ background: 'var(--surface-3)' }} />
                )}
                <ResultInfo>
                  <ResultName>{r.name}</ResultName>
                  <ResultBrand>
                    {r.brand} {r.model ? `- ${r.model}` : ''}{' '}
                    <ResultScore>({r._score}%)</ResultScore>
                  </ResultBrand>
                </ResultInfo>
                {r.id === selectedId && (
                  <SelectCheck>
                    <FiCheck size={16} />
                  </SelectCheck>
                )}
              </ResultRow>
            ))}
          </ResultsList>
        ) : searched ? (
          <NoResults>
            <FiPackage size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
            <p>No se encontraron palas para "{query}"</p>
          </NoResults>
        ) : (
          <NoResults>
            <p>Escribe al menos 2 caracteres para buscar en nuestra base de datos.</p>
          </NoResults>
        )}

        {selectedRacket && (
          <PriceForm>
            <PriceRow>
              <FormInput
                type='number'
                step='0.01'
                placeholder='Precio (€)'
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
              <FormInput
                placeholder='URL de tu tienda (opcional)'
                value={link}
                onChange={e => setLink(e.target.value)}
              />
            </PriceRow>
            <AddToCatalogBtn onClick={handleAdd} disabled={adding}>
              <FiCheck /> {adding ? 'Añadiendo...' : `Añadir ${selectedRacket.name}`}
            </AddToCatalogBtn>
          </PriceForm>
        )}
      </Modal>
    </Overlay>
  );
};

export default AddRacketModal;

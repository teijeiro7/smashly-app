import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiList,
  FiGitBranch,
  FiPlus,
  FiTrash2,
  FiLock,
  FiGlobe,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import { Link } from '@tanstack/react-router';
import { sileo } from 'sileo';
import { ListService } from '../../services/listService';
import { ComparisonService, SavedComparison } from '../../services/comparisonService';
import { RacketService } from '../../services/racketService';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  background: var(--surface);
  padding: 0.375rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  width: fit-content;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => (props.$active ? 'var(--primary)' : 'transparent')};
  color: ${props => (props.$active ? 'var(--text-inverse)' : 'var(--text-muted)')};

  &:hover {
    background: ${props => (props.$active ? 'var(--primary)' : 'var(--surface-3)')};
    color: ${props => (props.$active ? 'var(--text-inverse)' : 'var(--primary)')};
  }
`;

const ContentCard = styled.div`
  background: var(--surface);
  border-radius: 16px;
  border: 1px solid var(--border);
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--surface-3);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AddButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--brand-surface);
  color: var(--brand-on-surface);
  border: none;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--text);
  }
`;

const CardContent = styled.div`
  padding: 1rem;
`;

const ListGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const ListCard = styled(motion.div)`
  background: var(--surface-2);
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: var(--surface);
    border-color: var(--border);
  }
`;

const ListHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const ListInfo = styled.div`
  flex: 1;
`;

const ListName = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary);
  margin: 0 0 0.25rem 0;
`;

const ListMeta = styled.div`
  font-size: 0.8125rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ListActions = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const ActionButton = styled(motion.button)<{ $danger?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  background: ${props => props.$danger ? 'rgba(220, 38, 38, 0.10)' : 'transparent'};
  color: ${props => props.$danger ? 'var(--danger)' : 'var(--text-muted)'};

  &:hover {
    background: ${props => props.$danger ? 'var(--danger)' : 'var(--surface-3)'};
    color: ${props => props.$danger ? 'var(--text-inverse)' : 'var(--primary)'};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--text-subtle);
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--surface-3);
  color: var(--border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
`;

const CreateForm = styled(motion.div)`
  background: var(--surface-2);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid var(--border);
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.375rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const FormCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text);
  cursor: pointer;
`;

const FormActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const Button = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: ${props => props.$primary ? 'var(--primary)' : 'var(--surface-3)'};
  color: ${props => props.$primary ? 'var(--text-inverse)' : 'var(--text-muted)'};
`;

const UserCollections: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lists' | 'comparisons'>('lists');
  const [lists, setLists] = useState<any[]>([]);
  const [comparisons, setComparisons] = useState<SavedComparison[]>([]);
  const [racketsCache, setRacketsCache] = useState<Record<number, any>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListPublic, setNewListPublic] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const listsData = await ListService.getUserLists();
      setLists(listsData as any);
      
      const comparisonsData = await ComparisonService.getUserComparisons();
      
      const allRacketIds = [...new Set(comparisonsData.flatMap(c => c.racket_ids))];
      const rackets: Record<number, any> = {};
      await Promise.all(
        allRacketIds.map(async (id: number) => {
          try {
            const racket = await RacketService.getRacketById(id);
            rackets[id] = racket;
          } catch {
            rackets[id] = { nombre: `Pala ${id}` };
          }
        })
      );
      setRacketsCache(rackets);
      setComparisons(comparisonsData);
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      sileo.error({ title: 'Error', description: 'El nombre es obligatorio' });
      return;
    }

    try {
      await ListService.createList({
        name: newListName,
      } as any);
      setNewListName('');
      setNewListPublic(false);
      setShowCreateForm(false);
      sileo.success({ title: 'Éxito', description: 'Lista creada correctamente' });
      loadData();
    } catch (error) {
      sileo.error({ title: 'Error', description: 'Error al crear la lista' });
    }
  };

  const handleDeleteList = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('¿Eliminar esta lista?')) return;

    try {
      await ListService.deleteList(id);
      setLists(lists.filter(l => l.id !== id));
      sileo.success({ title: 'Éxito', description: 'Lista eliminada' });
    } catch (error) {
      sileo.error({ title: 'Error', description: 'Error al eliminar la lista' });
    }
  };

  return (
    <Container>
      <TabsContainer>
        <Tab $active={activeTab === 'lists'} onClick={() => setActiveTab('lists')}>
          <FiList size={16} /> Listas ({lists.length})
        </Tab>
        <Tab $active={activeTab === 'comparisons'} onClick={() => setActiveTab('comparisons')}>
          <FiGitBranch size={16} /> Comparaciones ({comparisons.length})
        </Tab>
      </TabsContainer>

      <AnimatePresence mode="wait">
        {activeTab === 'lists' && (
          <motion.div
            key="lists"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ContentCard>
              <CardHeader>
                <CardTitle><FiList /> Mis Listas</CardTitle>
                <AddButton
                  onClick={() => setShowCreateForm(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiPlus size={16} /> Nueva Lista
                </AddButton>
              </CardHeader>
              <CardContent>
                <AnimatePresence>
                  {showCreateForm && (
                    <CreateForm
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <FormGroup>
                        <FormLabel>Nombre de la lista</FormLabel>
                        <FormInput
                          placeholder="Ej: Mis favoritas"
                          value={newListName}
                          onChange={e => setNewListName(e.target.value)}
                          autoFocus
                        />
                      </FormGroup>
                      <FormCheckbox>
                        <input
                          type="checkbox"
                          checked={newListPublic}
                          onChange={e => setNewListPublic(e.target.checked)}
                        />
                        <FiGlobe size={14} /> Hacer pública
                      </FormCheckbox>
                      <FormActions style={{ marginTop: '1rem' }}>
                        <Button onClick={() => setShowCreateForm(false)}>
                          <FiX size={14} /> Cancelar
                        </Button>
                        <Button $primary onClick={handleCreateList}>
                          <FiCheck size={14} /> Crear
                        </Button>
                      </FormActions>
                    </CreateForm>
                  )}
                </AnimatePresence>

                {lists.length === 0 ? (
                  <EmptyState>
                    <EmptyIcon><FiList /></EmptyIcon>
                    <p>No tienes listas creadas</p>
                    <Button
                      $primary
                      onClick={() => setShowCreateForm(true)}
                      style={{ marginTop: '1rem' }}
                    >
                      <FiPlus size={16} /> Crear primera lista
                    </Button>
                  </EmptyState>
                ) : (
                  <ListGrid>
                    {lists.map(list => (
                      <ListCard
                        key={list.id}
                        as={Link}
                        to={`/lists/${list.id}`}
                        whileHover={{ y: -2 }}
                      >
                        <ListHeader>
                          <ListInfo>
                            <ListName>{list.name}</ListName>
                            <ListMeta>
                              {list.is_public ? <FiGlobe size={12} /> : <FiLock size={12} />}
                              {list.is_public ? 'Pública' : 'Privada'}
                            </ListMeta>
                          </ListInfo>
                          <ListActions>
                            <ActionButton
                              $danger
                              onClick={(e) => handleDeleteList(list.id, e)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <FiTrash2 size={14} />
                            </ActionButton>
                          </ListActions>
                        </ListHeader>
                      </ListCard>
                    ))}
                  </ListGrid>
                )}
              </CardContent>
            </ContentCard>
          </motion.div>
        )}

        {activeTab === 'comparisons' && (
          <motion.div
            key="comparisons"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ContentCard>
              <CardHeader>
                <CardTitle><FiGitBranch /> Mis Comparaciones</CardTitle>
              </CardHeader>
              <CardContent>
                {comparisons.length === 0 ? (
                  <EmptyState>
                    <EmptyIcon><FiGitBranch /></EmptyIcon>
                    <p>No tienes comparaciones guardadas</p>
                    <Button
                      $primary
                      as={Link}
                      to="/compare"
                      style={{ marginTop: '1rem' }}
                    >
                      <FiPlus size={16} /> Crear comparación
                    </Button>
                  </EmptyState>
                ) : (
                  <ListGrid>
                    {comparisons.map(comp => {
                      const racketNames = comp.racket_ids
                        .map((id: number) => racketsCache[id]?.nombre || `Pala ${id}`)
                        .join(' vs ');
                      return (
                        <ListCard
                          key={comp.id}
                          as={Link}
                          to={`/compare/${comp.id}`}
                          whileHover={{ y: -2 }}
                        >
                          <ListHeader>
                            <ListInfo>
                              <ListName>{racketNames || 'Comparación'}</ListName>
                              <ListMeta>
                                {comp.is_public ? <FiGlobe size={12} /> : <FiLock size={12} />}
                                {comp.is_public ? 'Compartida' : 'Privada'}
                              </ListMeta>
                            </ListInfo>
                          </ListHeader>
                        </ListCard>
                      );
                    })}
                  </ListGrid>
                )}
              </CardContent>
            </ContentCard>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default UserCollections;

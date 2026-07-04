import React, { useEffect } from "react";
import styled from "styled-components";
import { FiX, FiPlus, FiList, FiCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useList } from "../../contexts/ListsContext";
import { CreateListModal } from "./CreateListModal";

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  racketId: number;
  racketName: string;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Modal = styled(motion.div)`
  background: var(--surface);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--surface-3);
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 8px;

  &:hover {
    background: var(--surface-3);
    color: var(--text);
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  margin: 0 -2rem;
  padding: 0 2rem;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--surface-3);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-strong);
    border-radius: 4px;

    &:hover {
      background: var(--text-subtle);
    }
  }
`;

const CreateNewButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--brand-surface) 0%, var(--brand-surface-hover) 100%);
  color: var(--brand-on-surface);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
  font-size: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
  }
`;

const ListsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ListItem = styled.button<{ isAdded?: boolean }>`
  width: 100%;
  padding: 1rem;
  background: ${(props) => (props.isAdded ? "var(--primary-subtle)" : "var(--surface)")};
  border: 2px solid ${(props) => (props.isAdded ? "var(--primary)" : "var(--border)")};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: left;

  &:hover {
    border-color: var(--primary);
    background: var(--primary-subtle);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ListIcon = styled.div<{ isAdded?: boolean }>`
  width: 40px;
  height: 40px;
  background: ${(props) => (props.isAdded ? "var(--primary)" : "var(--surface-3)")};
  color: ${(props) => (props.isAdded ? "var(--brand-on-surface)" : "var(--text-muted)")};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ListInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ListName = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ListMeta = styled.div`
  font-size: 0.75rem;
  color: var(--text-muted);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-muted);
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: 0.95rem;
  margin: 0;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-muted);
`;

export const AddToListModal: React.FC<AddToListModalProps> = ({
  isOpen,
  onClose,
  racketId,
  racketName,
}) => {
  const { lists, loading, fetchLists, addRacketToList, createList } = useList();
  const [addingToListId, setAddingToListId] = React.useState<string | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLists();
    }
  }, [isOpen]);

  const handleAddToList = async (listId: string) => {
    if (addingToListId) return;

    setAddingToListId(listId);
    try {
      await addRacketToList(listId, racketId);
      // No cerrar el modal para que el usuario pueda añadir a más listas
    } catch (error) {
      // Error handled by context
    } finally {
      setAddingToListId(null);
    }
  };

  const handleCreateNewList = () => {
    setShowCreateModal(true);
  };

  const handleCreateList = async (name: string, description?: string) => {
    try {
      const newList = await createList({ name, description });
      setShowCreateModal(false);
      await fetchLists();
      // Automatically add the racket to the newly created list
      if (newList?.id) {
        await addRacketToList(newList.id, racketId);
      }
    } catch (error) {
      // Error handled by context
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showCreateModal && (
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <Modal
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Header>
                <HeaderContent>
                  <Title>Añadir a mis listas</Title>
                  <Subtitle>{racketName}</Subtitle>
                </HeaderContent>
                <CloseButton onClick={onClose}>
                  <FiX size={24} />
                </CloseButton>
              </Header>

              <Content>
                <CreateNewButton onClick={handleCreateNewList}>
                  <FiPlus size={20} />
                  Crear Nueva Lista
                </CreateNewButton>

                {loading ? (
                  <LoadingState>Cargando tus listas...</LoadingState>
                ) : lists.length === 0 ? (
                  <EmptyState>
                    <EmptyIcon>📋</EmptyIcon>
                    <EmptyText>
                      Aún no tienes listas. Crea una para empezar.
                    </EmptyText>
                  </EmptyState>
                ) : (
                  <ListsGrid>
                    {lists.map((list) => {
                      const isAdded = false; // TODO: Implementar lógica para saber si ya está añadida
                      return (
                        <ListItem
                          key={list.id}
                          isAdded={isAdded}
                          onClick={() => handleAddToList(list.id)}
                          disabled={addingToListId === list.id}
                        >
                          <ListIcon isAdded={isAdded}>
                            {isAdded ? (
                              <FiCheck size={20} />
                            ) : (
                              <FiList size={20} />
                            )}
                          </ListIcon>
                          <ListInfo>
                            <ListName>{list.name}</ListName>
                            <ListMeta>
                              {list.racket_count || 0}{" "}
                              {list.racket_count === 1 ? "pala" : "palas"}
                            </ListMeta>
                          </ListInfo>
                        </ListItem>
                      );
                    })}
                  </ListsGrid>
                )}
              </Content>
            </Modal>
          </Overlay>
        )}
      </AnimatePresence>

      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateList={handleCreateList}
      />
    </>
  );
};

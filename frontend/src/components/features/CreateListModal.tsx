import React, { useState } from "react";
import styled from "styled-components";
import { FiX, FiPlus } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateList: (name: string, description?: string) => Promise<void>;
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
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button<{ variant?: "primary" | "secondary" }>`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  ${(props) =>
    props.variant === "primary"
      ? `
    background: var(--brand-surface);
    color: var(--brand-on-surface);
    &:hover {
      background: var(--primary-hover);
    }
    &:disabled {
      background: var(--text-subtle);
      cursor: not-allowed;
    }
  `
      : `
    background: var(--surface-3);
    color: var(--text);
    &:hover {
      background: var(--border);
    }
  `}
`;

export const CreateListModal: React.FC<CreateListModalProps> = ({
  isOpen,
  onClose,
  onCreateList,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateList(name.trim(), description.trim() || undefined);
      setName("");
      setDescription("");
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName("");
      setDescription("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <Modal
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Header>
              <Title>Crear Nueva Lista</Title>
              <CloseButton onClick={handleClose} disabled={isSubmitting}>
                <FiX size={24} />
              </CloseButton>
            </Header>

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="name">Nombre de la lista *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ej: Mis palas favoritas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                  maxLength={100}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="description">Descripción (opcional)</Label>
                <TextArea
                  id="description"
                  placeholder="Describe tu lista..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={500}
                />
              </FormGroup>

              <ButtonGroup>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!name.trim() || isSubmitting}
                >
                  <FiPlus size={20} />
                  {isSubmitting ? "Creando..." : "Crear Lista"}
                </Button>
              </ButtonGroup>
            </Form>
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

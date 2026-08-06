import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX, FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Store } from '../../services/storeService';

const Overlay = styled.div`
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

const ModalContainer = styled.div`
  background: var(--surface);
  border-radius: 20px;
  max-width: 640px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--surface);
  border-radius: 20px 20px 0 0;
  z-index: 1;
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
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: var(--surface-3);
    color: var(--text);
  }
`;

const Body = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 0.95rem;
  background: var(--surface);
  color: var(--text);
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--surface-3);
  }
`;

const TextArea = styled.textarea<{ $minHeight?: number }>`
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 0.95rem;
  background: var(--surface);
  color: var(--text);
  resize: vertical;
  min-height: ${p => p.$minHeight || 80}px;
  font-family: inherit;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SpecialtyGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SpecialtyChip = styled.button<{ $selected: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 100px;
  border: 1px solid ${({ $selected }) => ($selected ? 'var(--primary)' : 'var(--border)')};
  background: ${({ $selected }) => ($selected ? 'var(--primary-subtle)' : 'transparent')};
  color: ${({ $selected }) => ($selected ? 'var(--primary-hover)' : 'var(--text-muted)')};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary);
    color: ${({ $selected }) => ($selected ? 'var(--primary-hover)' : 'var(--text)')};
  }
`;

const GalleryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const GalleryUrlTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--primary-subtle);
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--primary-hover);
  word-break: break-all;
  max-width: 100%;
`;

const RemoveUrlButton = styled.button`
  background: none;
  border: none;
  color: var(--danger);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  font-size: 0.85rem;
`;

const AddUrlRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const AddUrlInput = styled.input`
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.85rem;
  background: var(--surface);
  color: var(--text);

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const AddUrlButton = styled.button`
  padding: 0.5rem 0.75rem;
  background: var(--primary-subtle);
  color: var(--primary-hover);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;

  &:hover {
    background: var(--brand-surface);
    color: var(--brand-on-surface);
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border);
  position: sticky;
  bottom: 0;
  background: var(--surface);
  border-radius: 0 0 20px 20px;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--surface-3);
  }
`;

const SaveButton = styled.button`
  padding: 0.75rem 2rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, var(--brand-surface) 0%, var(--success) 100%);
  color: var(--brand-on-surface);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(var(--primary-rgb), 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SPECIALTIES = [
  'Paletería general',
  'Raquetería general',
  'Encordados',
  'Personalización',
  'Venta online',
  'Tienda física',
  'Complementos',
  'Accesorios',
];

interface StoreProfileFormProps {
  store: Store;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Store>) => Promise<void>;
}

const StoreProfileForm: React.FC<StoreProfileFormProps> = ({ store, isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    legal_name: store.legal_name,
    cif_nif: store.cif_nif,
    contact_email: store.contact_email,
    phone_number: store.phone_number,
    website_url: store.website_url || '',
    logo_url: store.logo_url || '',
    cover_image_url: store.cover_image_url || '',
    short_description: store.short_description || '',
    description: store.description || '',
    location: store.location,
    specialties: store.specialties || [],
    gallery_images: store.gallery_images || [],
  });
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const toggleSpecialty = (s: string) => {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter(x => x !== s)
        : [...prev.specialties, s],
    }));
  };

  const addGalleryUrl = () => {
    const url = newGalleryUrl.trim();
    if (!url) return;
    setForm(prev => ({ ...prev, gallery_images: [...prev.gallery_images, url] }));
    setNewGalleryUrl('');
  };

  const removeGalleryUrl = (idx: number) => {
    setForm(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        legal_name: form.legal_name,
        cif_nif: form.cif_nif,
        contact_email: form.contact_email,
        phone_number: form.phone_number,
        website_url: form.website_url || undefined,
        logo_url: form.logo_url || undefined,
        cover_image_url: form.cover_image_url || undefined,
        short_description: form.short_description || undefined,
        description: form.description || undefined,
        location: form.location,
        specialties: form.specialties,
        gallery_images: form.gallery_images,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <Header>
          <Title>Editar perfil de tienda</Title>
          <CloseButton onClick={onClose} aria-label='Cerrar'>
            <FiX size={24} />
          </CloseButton>
        </Header>

        <Body>
          <FieldGroup>
            <Label>Nombre de la tienda</Label>
            <Input value={store.store_name} disabled />
          </FieldGroup>

          <Row>
            <FieldGroup>
              <Label>Razón social</Label>
              <Input
                value={form.legal_name}
                onChange={e => setForm(p => ({ ...p, legal_name: e.target.value }))}
              />
            </FieldGroup>
            <FieldGroup>
              <Label>CIF/NIF</Label>
              <Input
                value={form.cif_nif}
                onChange={e => setForm(p => ({ ...p, cif_nif: e.target.value }))}
              />
            </FieldGroup>
          </Row>

          <Row>
            <FieldGroup>
              <Label>Email de contacto</Label>
              <Input
                type='email'
                value={form.contact_email}
                onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))}
              />
            </FieldGroup>
            <FieldGroup>
              <Label>Teléfono</Label>
              <Input
                value={form.phone_number}
                onChange={e => setForm(p => ({ ...p, phone_number: e.target.value }))}
              />
            </FieldGroup>
          </Row>

          <FieldGroup>
            <Label>Ubicación</Label>
            <Input
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Sitio web</Label>
            <Input
              value={form.website_url}
              onChange={e => setForm(p => ({ ...p, website_url: e.target.value }))}
              placeholder='https://...'
            />
          </FieldGroup>

          <FieldGroup>
            <Label>URL del logo</Label>
            <Input
              value={form.logo_url}
              onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))}
              placeholder='https://...'
            />
          </FieldGroup>

          <FieldGroup>
            <Label>URL de imagen de portada</Label>
            <Input
              value={form.cover_image_url}
              onChange={e => setForm(p => ({ ...p, cover_image_url: e.target.value }))}
              placeholder='https://...'
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Descripción corta</Label>
            <TextArea
              value={form.short_description}
              onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))}
              maxLength={300}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Descripción completa</Label>
            <TextArea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              $minHeight={120}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Especialidades</Label>
            <SpecialtyGrid>
              {SPECIALTIES.map(s => (
                <SpecialtyChip
                  key={s}
                  $selected={form.specialties.includes(s)}
                  onClick={() => toggleSpecialty(s)}
                >
                  {s}
                </SpecialtyChip>
              ))}
            </SpecialtyGrid>
          </FieldGroup>

          <FieldGroup>
            <Label>Galería de imágenes (URLs)</Label>
            {form.gallery_images.length > 0 && (
              <GalleryRow>
                {form.gallery_images.map((url, i) => (
                  <GalleryUrlTag key={i}>
                    <span>{url}</span>
                    <RemoveUrlButton
                      onClick={() => removeGalleryUrl(i)}
                      aria-label='Eliminar URL'
                    >
                      <FiTrash2 size={14} />
                    </RemoveUrlButton>
                  </GalleryUrlTag>
                ))}
              </GalleryRow>
            )}
            <AddUrlRow>
              <AddUrlInput
                value={newGalleryUrl}
                onChange={e => setNewGalleryUrl(e.target.value)}
                placeholder='https://...'
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addGalleryUrl();
                  }
                }}
              />
              <AddUrlButton onClick={addGalleryUrl}>
                <FiPlus /> Añadir
              </AddUrlButton>
            </AddUrlRow>
          </FieldGroup>
        </Body>

        <Footer>
          <CancelButton onClick={onClose}>Cancelar</CancelButton>
          <SaveButton onClick={handleSave} disabled={saving}>
            <FiSave />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </SaveButton>
        </Footer>
      </ModalContainer>
    </Overlay>
  );
};

export default StoreProfileForm;

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from '@tanstack/react-router';
import { FaStore, FaEdit, FaGlobe, FaBox, FaChartLine, FaPlus } from 'react-icons/fa';
import { FiPackage } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import storeService, { Store, CreateStoreRequest } from '../services/storeService';
import { QuickActionCard } from '../components/dashboard/QuickActionCard';
import StoreStatusCard from '../components/features/StoreStatusCard';
import StoreProfileForm from '../components/features/StoreProfileForm';
import StoreCatalogManager from '../components/features/StoreCatalogManager';
import { sileo } from 'sileo';

const Container = styled.div`
  min-height: 100dvh;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 40%),
    linear-gradient(135deg, var(--primary-faint) 0%, var(--surface) 100%);
  padding: 1rem;
  padding-bottom: calc(6.5rem + env(safe-area-inset-bottom, 0));

  @media (min-width: 1025px) {
    padding: 2rem;
    padding-bottom: 2rem;
  }
`;

const MaxWidth = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const HeroSection = styled.div`
  background: linear-gradient(135deg, var(--surface) 60%, var(--primary-faint) 100%);
  border-radius: 24px;
  padding: clamp(1.25rem, 3vw, 3rem);
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid rgba(59, 130, 246, 0.15);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary), #6366f1);
    border-radius: 24px 24px 0 0;
  }
`;

const Greeting = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 0.5rem 0;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const SubGreeting = styled.p`
  font-size: 1.125rem;
  color: var(--text-muted);
  margin: 0;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
`;

const InfoCard = styled.div`
  background: var(--surface);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border);
`;

const InfoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
`;

const InfoTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--primary-subtle);
  color: var(--primary-hover);
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--brand-surface);
    color: var(--brand-on-surface);
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
`;

const InfoValue = styled.span`
  font-size: 0.95rem;
  color: var(--text);
`;

const DescriptionBlock = styled.p`
  font-size: 0.95rem;
  color: var(--text);
  line-height: 1.6;
  margin: 0.5rem 0 0;
`;

const SpecialtyTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
`;

const SpecialtyTag = styled.span`
  padding: 0.25rem 0.625rem;
  background: var(--primary-subtle);
  color: var(--primary-hover);
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  color: var(--text-muted);
  font-size: 1.125rem;
`;

const EmptyState = styled.div`
  background: var(--surface);
  border-radius: 24px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border);
  max-width: 480px;
  margin: 4rem auto;
`;

const EmptyIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--primary-subtle);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 1.5rem;
`;

const EmptyTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 0.5rem;
`;

const EmptyMessage = styled.p`
  font-size: 0.95rem;
  color: var(--text-muted);
  margin: 0 0 2rem;
  line-height: 1.6;
`;

const CreateStoreButton = styled.button`
  padding: 0.875rem 2rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, var(--brand-surface) 0%, var(--success) 100%);
  color: var(--brand-on-surface);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(var(--primary-rgb), 0.3);
  }
`;

const CreateStoreForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
  margin-top: 1.5rem;
`;

const FormInput = styled.input`
  padding: 0.75rem 1rem;
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

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SubmitButton = styled.button`
  padding: 0.875rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, var(--brand-surface) 0%, var(--success) 100%);
  color: var(--brand-on-surface);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
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

const ToggleCreateButton = styled.button`
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  margin-top: 1rem;

  &:hover {
    color: var(--primary-hover);
  }
`;

export const StoreDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateStoreRequest>({
    store_name: '',
    legal_name: '',
    cif_nif: '',
    contact_email: '',
    phone_number: '',
    location: '',
    website_url: '',
    logo_url: '',
    short_description: '',
  });
  const [creating, setCreating] = useState(false);

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  }, []);

  const loadStore = useCallback(async () => {
    try {
      const token = await getToken();
      const myStore = await storeService.getMyStore(token);
      setStore(myStore);
    } catch (error) {
      console.error('Error loading store:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  const handleSaveProfile = async (updates: Partial<Store>) => {
    if (!store) return;
    const token = await getToken();
    const updated = await storeService.updateStore(store.id, updates, token);
    setStore(updated);
    sileo.success({ title: 'Perfil actualizado', description: 'Los cambios se han guardado correctamente.' });
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = await getToken();
      const newStore = await storeService.createStoreRequest(createForm, token);
      setStore(newStore);
      setShowCreateForm(false);
      sileo.success({ title: 'Solicitud enviada', description: 'Tu solicitud de tienda ha sido registrada.' });
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message || 'Error al crear la tienda' });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <MaxWidth>
          <LoadingContainer>Cargando tu tienda...</LoadingContainer>
        </MaxWidth>
      </Container>
    );
  }

  if (!store) {
    return (
      <Container>
        <MaxWidth>
          <EmptyState>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <EmptyIcon>
                <FaStore />
              </EmptyIcon>
              <EmptyTitle>Aún no tienes una tienda</EmptyTitle>
              <EmptyMessage>
                No encontramos una tienda asociada a tu cuenta. Crea una para
                empezar a gestionar tu catálogo y aparecer en Smashly.
              </EmptyMessage>

              {showCreateForm ? (
                <CreateStoreForm onSubmit={handleCreateStore}>
                  <FormInput
                    placeholder="Nombre de la tienda *"
                    value={createForm.store_name}
                    onChange={e => setCreateForm(p => ({ ...p, store_name: e.target.value }))}
                    required
                  />
                  <FormRow>
                    <FormInput
                      placeholder="Razón social *"
                      value={createForm.legal_name}
                      onChange={e => setCreateForm(p => ({ ...p, legal_name: e.target.value }))}
                      required
                    />
                    <FormInput
                      placeholder="CIF/NIF *"
                      value={createForm.cif_nif}
                      onChange={e => setCreateForm(p => ({ ...p, cif_nif: e.target.value }))}
                      required
                    />
                  </FormRow>
                  <FormRow>
                    <FormInput
                      placeholder="Email de contacto *"
                      type="email"
                      value={createForm.contact_email}
                      onChange={e => setCreateForm(p => ({ ...p, contact_email: e.target.value }))}
                      required
                    />
                    <FormInput
                      placeholder="Teléfono *"
                      value={createForm.phone_number}
                      onChange={e => setCreateForm(p => ({ ...p, phone_number: e.target.value }))}
                      required
                    />
                  </FormRow>
                  <FormInput
                    placeholder="Ubicación *"
                    value={createForm.location}
                    onChange={e => setCreateForm(p => ({ ...p, location: e.target.value }))}
                    required
                  />
                  <FormInput
                    placeholder="Sitio web (opcional)"
                    value={createForm.website_url || ''}
                    onChange={e => setCreateForm(p => ({ ...p, website_url: e.target.value }))}
                  />
                  <SubmitButton disabled={creating}>
                    {creating ? 'Enviando...' : 'Crear tienda'}
                  </SubmitButton>
                  <ToggleCreateButton type="button" onClick={() => setShowCreateForm(false)}>
                    Cancelar
                  </ToggleCreateButton>
                </CreateStoreForm>
              ) : (
                <CreateStoreButton onClick={() => setShowCreateForm(true)}>
                  <FaPlus />
                  Crear tienda
                </CreateStoreButton>
              )}
            </motion.div>
          </EmptyState>
        </MaxWidth>
      </Container>
    );
  }

  const quickActions = [
    {
      icon: FaEdit,
      title: 'Editar perfil',
      description: 'Actualiza la información de tu tienda',
      onClick: () => setShowEditForm(true),
    },
    {
      icon: FaGlobe,
      title: 'Ver página pública',
      description: 'Cómo ven los usuarios tu tienda',
      onClick: () => navigate({ to: `/store/${store.slug}` as any }),
    },
    {
      icon: FaBox,
      title: 'Catálogo de palas',
      description: 'Gestiona tu inventario',
      onClick: () => sileo.info({ title: 'Próximamente', description: 'El catálogo estará disponible pronto.' }),
    },
    {
      icon: FaChartLine,
      title: 'Analíticas',
      description: 'Visitas, clics y valoraciones',
      onClick: () => sileo.info({ title: 'Próximamente', description: 'Las analíticas estarán disponibles pronto.' }),
    },
  ];

  return (
    <Container>
      <MaxWidth>
        <HeroSection>
          <Greeting>¡Hola, {store.store_name}!</Greeting>
          <SubGreeting>Panel de gestión de tu tienda en Smashly</SubGreeting>
        </HeroSection>

        <Section>
          <StoreStatusCard
            status={store.status}
            storeName={store.store_name}
            rejectionReason={store.rejection_reason}
          />
        </Section>

        <Section>
          <SectionTitle><FaStore /> Acciones rápidas</SectionTitle>
          <QuickActionsGrid>
            {quickActions.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <QuickActionCard {...action} />
              </motion.div>
            ))}
          </QuickActionsGrid>
        </Section>

        <Section>
          <InfoCard>
            <InfoHeader>
              <InfoTitle>Información de la tienda</InfoTitle>
              <EditButton onClick={() => setShowEditForm(true)}>
                <FaEdit /> Editar
              </EditButton>
            </InfoHeader>

            <InfoGrid>
              <InfoItem>
                <InfoLabel>Nombre</InfoLabel>
                <InfoValue>{store.store_name}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Razón social</InfoLabel>
                <InfoValue>{store.legal_name}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>CIF/NIF</InfoLabel>
                <InfoValue>{store.cif_nif}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Email</InfoLabel>
                <InfoValue>{store.contact_email}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Teléfono</InfoLabel>
                <InfoValue>{store.phone_number}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Ubicación</InfoLabel>
                <InfoValue>{store.location}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Slug</InfoLabel>
                <InfoValue>{store.slug}</InfoValue>
              </InfoItem>
              {store.website_url && (
                <InfoItem>
                  <InfoLabel>Sitio web</InfoLabel>
                  <InfoValue>{store.website_url}</InfoValue>
                </InfoItem>
              )}
            </InfoGrid>

            {store.short_description && (
              <>
                <InfoLabel style={{ marginTop: '1rem', display: 'block' }}>Descripción</InfoLabel>
                <DescriptionBlock>{store.short_description}</DescriptionBlock>
              </>
            )}

            {store.specialties && store.specialties.length > 0 && (
              <>
                <InfoLabel style={{ marginTop: '1rem', display: 'block' }}>Especialidades</InfoLabel>
                <SpecialtyTags>
                  {store.specialties.map((s, i) => (
                    <SpecialtyTag key={i}>{s}</SpecialtyTag>
                  ))}
                </SpecialtyTags>
              </>
            )}
          </InfoCard>
        </Section>

        <Section>
          <SectionTitle><FiPackage /> Catálogo</SectionTitle>
          <StoreCatalogManager storeId={store.id} />
        </Section>
      </MaxWidth>

      <StoreProfileForm
        store={store}
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSave={handleSaveProfile}
      />
    </Container>
  );
};

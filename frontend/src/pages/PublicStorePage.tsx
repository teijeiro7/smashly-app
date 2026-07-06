import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from '@tanstack/react-router';
import { FiMapPin, FiMail, FiPhone, FiGlobe, FiArrowLeft, FiStar, FiEye, FiShoppingCart, FiMessageSquare } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { API_URL, API_ENDPOINTS } from '../config/api';
import { Store } from '../services/storeService';
import { StorePrice } from '../services/catalogService';

const Page = styled.div`
  min-height: 100dvh;
  background: var(--surface);
`;

const BackBar = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
`;

const BackLink = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem 0;
  transition: color 0.2s;

  &:hover { color: var(--primary); }
`;

const Hero = styled.div<{ $cover?: string }>`
  background: ${({ $cover }) =>
    $cover
      ? `url(${$cover}) center/cover`
      : 'linear-gradient(135deg, var(--primary-faint) 0%, var(--surface) 100%)'};
  height: 280px;
  position: relative;
  display: flex;
  align-items: flex-end;
`;

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 40%, rgba(0,0,0,0.6));
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
`;

const Logo = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 20px;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  background: white;
`;

const HeroText = styled.div`
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
`;

const StoreTitle = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
`;

const StoreStatus = styled.span`
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(255,255,255,0.2);
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const Body = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MainCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SideCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Section = styled.div``;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 1rem;
`;

const Description = styled.p`
  font-size: 0.95rem;
  color: var(--text-muted);
  line-height: 1.7;
  margin: 0;
`;

const SpecialtyTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SpecialtyTag = styled.span`
  padding: 0.375rem 0.75rem;
  background: var(--primary-subtle);
  color: var(--primary-hover);
  border-radius: 100px;
  font-size: 0.85rem;
  font-weight: 500;
`;

const InfoCard = styled.div`
  background: var(--surface);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--border);
  box-shadow: 0 2px 12px var(--shadow-color);
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  color: var(--text);
  font-size: 0.9rem;

  svg { color: var(--primary); flex-shrink: 0; }

  & + & { border-top: 1px solid var(--border); }
`;

const InfoLink = styled.a`
  color: var(--primary);
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
`;

const GalleryImage = styled.img`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--border);
`;

const CatalogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const RacketCard = styled(motion.div)`
  background: var(--surface);
  border-radius: 14px;
  padding: 1rem;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 16px var(--shadow-color);
  }
`;

const RacketImg = styled.img`
  width: 100%;
  height: 120px;
  object-fit: contain;
  border-radius: 8px;
  background: var(--surface-2);
`;

const RacketName = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
  line-height: 1.3;
`;

const RacketPrice = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--primary-hover);
`;

const RacketLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--primary-subtle);
  color: var(--primary-hover);
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: var(--brand-surface);
    color: var(--brand-on-surface);
  }
`;

const StatRow = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--text-muted);
  font-size: 0.85rem;

  svg { color: var(--primary); }
`;

const Spinner = styled.div`
  padding: 4rem;
  text-align: center;
  color: var(--text-muted);
`;

const NotFound = styled.div`
  padding: 4rem;
  text-align: center;
  color: var(--text-muted);
`;

const PublicStorePage: React.FC = () => {
  const params = useParams({ from: '/store/$slug' });
  const navigate = useNavigate();
  const slug = (params as any).slug;
  const [store, setStore] = useState<Store | null>(null);
  const [catalog, setCatalog] = useState<StorePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchStore = async () => {
      try {
        const res = await fetch(`${API_URL}${API_ENDPOINTS.STORES_BY_ID(slug)}`);
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setStore(data);

        // Fetch catalog
        try {
          const catRes = await fetch(`${API_URL}${API_ENDPOINTS.STORES_CATALOG(slug)}`);
          if (catRes.ok) {
            const catData = await catRes.json();
            setCatalog(catData.data || []);
          }
        } catch { /* catalog optional */ }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [slug]);

  if (loading) return <Spinner>Cargando tienda...</Spinner>;
  if (notFound || !store) return <NotFound><p>Tienda no encontrada</p></NotFound>;

  return (
    <Page>
      <BackBar>
        <BackLink onClick={() => navigate({ to: '/' })}>
          <FiArrowLeft /> Volver a Smashly
        </BackLink>
      </BackBar>

      <Hero $cover={store.cover_image_url || undefined}>
        {store.cover_image_url && <HeroOverlay />}
        <HeroContent>
          {store.logo_url ? (
            <Logo src={store.logo_url} alt={store.store_name} />
          ) : (
            <Logo as="div" style={{ background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800 }}>
              {store.store_name.charAt(0)}
            </Logo>
          )}
          <HeroText>
            <StoreTitle>{store.store_name}</StoreTitle>
            {store.location && <StoreStatus>{store.location}</StoreStatus>}
            <StatRow>
              <Stat><FiEye /> {store.views_count} visitas</Stat>
              <Stat><FiStar /> {store.rating_avg > 0 ? store.rating_avg.toFixed(1) : '—'} ({store.rating_count})</Stat>
            </StatRow>
          </HeroText>
        </HeroContent>
      </Hero>

      <Body>
        <MainCol>
          {store.short_description && (
            <Section>
              <SectionTitle>Sobre nosotros</SectionTitle>
              <Description>{store.short_description}</Description>
              {store.description && <Description style={{ marginTop: '1rem' }}>{store.description}</Description>}
            </Section>
          )}

          {store.specialties && store.specialties.length > 0 && (
            <Section>
              <SectionTitle>Especialidades</SectionTitle>
              <SpecialtyTags>
                {store.specialties.map((s, i) => <SpecialtyTag key={i}>{s}</SpecialtyTag>)}
              </SpecialtyTags>
            </Section>
          )}

          {store.gallery_images && store.gallery_images.length > 0 && (
            <Section>
              <SectionTitle>Galería</SectionTitle>
              <GalleryGrid>
                {store.gallery_images.map((url, i) => (
                  <GalleryImage key={i} src={url} alt={`${store.store_name} ${i + 1}`} />
                ))}
              </GalleryGrid>
            </Section>
          )}

          {catalog.length > 0 && (
            <Section>
              <SectionTitle>Catálogo ({catalog.length})</SectionTitle>
              <CatalogGrid>
                {catalog.map(item => (
                  <RacketCard key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {item.racket?.images?.[0] ? (
                      <RacketImg src={item.racket.images[0]} alt={item.racket.name} />
                    ) : (
                      <RacketImg as="div" style={{ background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--text-subtle)' }} />
                    )}
                    <RacketName>{item.racket?.name || `Pala #${item.racket_id}`}</RacketName>
                    {item.price && <RacketPrice>{item.price}€</RacketPrice>}
                    {item.link && (
                      <RacketLink href={item.link} target="_blank" rel="noopener">
                        <FiShoppingCart /> Ver en tienda
                      </RacketLink>
                    )}
                  </RacketCard>
                ))}
              </CatalogGrid>
            </Section>
          )}
        </MainCol>

        <SideCol>
          <InfoCard>
            <SectionTitle>Contacto</SectionTitle>
            <InfoItem>
              <FiMessageSquare />
              <InfoLink as="button" onClick={() => navigate({ to: '/messages' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600, padding: 0 }}>
                Enviar mensaje
              </InfoLink>
            </InfoItem>
            <SectionTitle style={{ marginTop: '1rem' }}>Información</SectionTitle>
            <InfoItem><FiMapPin /> {store.location}</InfoItem>
            <InfoItem><FiMail /> <InfoLink href={`mailto:${store.contact_email}`}>{store.contact_email}</InfoLink></InfoItem>
            <InfoItem><FiPhone /> {store.phone_number}</InfoItem>
            {store.website_url && (
              <InfoItem><FiGlobe /> <InfoLink href={store.website_url} target="_blank" rel="noopener">{store.website_url}</InfoLink></InfoItem>
            )}
          </InfoCard>
        </SideCol>
      </Body>
    </Page>
  );
};

export default PublicStorePage;

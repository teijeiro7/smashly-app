import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { racketImageUrl } from '../utils/imageUrl';
import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { QuickActionCard } from '../components/dashboard/QuickActionCard';
import { FaLightbulb, FaBalanceScale, FaChartBar, FaUser, FaBullseye, FaHeart, FaFire, FaStar } from 'react-icons/fa';
import { RacketService } from '../services/racketService';
import { RacketViewService, RecentlyViewedRacket } from '../services/racketViewService';
import { Racket } from '../types/racket';
import { ListService } from '../services/listService';
import { RecommendationService } from '../services/recommendationService';
import { Recommendation } from '../types/recommendation';
import CurrentRacketFinderModal from '../components/features/CurrentRacketFinderModal';

const Container = styled.div`
  min-height: 100dvh;
  background:
    radial-gradient(circle at top right, rgba(22, 163, 74, 0.08), transparent 40%),
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
  border: 1px solid rgba(22, 163, 74, 0.15);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary), var(--primary-light));
    border-radius: 24px 24px 0 0;
  }

  @media (max-width: 768px) {
    border-radius: 18px;

    &::before {
      border-radius: 18px 18px 0 0;
    }
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
  margin: 0 0 1.5rem 0;

  @media (max-width: 768px) {
    font-size: 0.95rem;
    margin-bottom: 1.25rem;
  }
`;

const Stats = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    background: rgba(22, 163, 74, 0.06);
    border: 1px solid rgba(22, 163, 74, 0.15);
    border-radius: 14px;
    padding: 0.875rem 1rem;
  }
`;

const StatValue = styled.span`
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const StatLabel = styled.span`
  font-size: 0.875rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
`;

const RacketsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 1rem;
`;

const RacketCard = styled.div`
  background: var(--surface);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 2px 10px var(--shadow-color);
  border: 1px solid rgba(22, 163, 74, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(22, 163, 74, 0.15);
    border-color: var(--primary);
  }
`;

const RacketImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: contain;
  margin-bottom: 1rem;
  border-radius: var(--racket-image-radius-card);
  background: var(--racket-image-bg);
  border: var(--racket-image-border);
  box-shadow: var(--racket-image-shadow);
  padding: 0.5rem;
`;

const RacketName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 0.5rem 0;
`;

const RacketBrand = styled.p`
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0 0 0.5rem 0;
`;

const RacketPrice = styled.p`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
`;

const ViewAllButton = styled.button`
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  min-height: 44px;
  background: var(--primary-faint);
  border: 1px solid var(--primary);
  color: var(--primary);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--primary-subtle);
  }
`;

const RecommendationSection = styled.section`
  margin-bottom: 2rem;
`;

const RecommendationHero = styled.div`
  background: linear-gradient(135deg, var(--brand-surface-deep) 0%, var(--brand-surface-strong) 55%, var(--brand-surface) 100%);
  border-radius: 24px;
  padding: clamp(1.25rem, 3vw, 2rem);
  color: white;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 1.25rem;
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    border-radius: 18px;
  }
`;

const RecommendationCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Eyebrow = styled.span`
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.72);
`;

const RecommendationTitle = styled.h3`
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  line-height: 1.05;
`;

const RecommendationText = styled.p`
  margin: 0;
  max-width: 62ch;
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.6;
`;

const RecommendationMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const MetaPill = styled.span`
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 0.875rem;
`;

const RecommendationActionButton = styled.button`
  border: none;
  border-radius: 14px;
  min-height: 48px;
  padding: 0.9rem 1rem;
  background: var(--surface);
  color: var(--brand-surface-strong);
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 20px rgba(15, 23, 42, 0.15);
  }
`;

const RecommendationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
  gap: 1rem;
`;

const RecommendedRacketCard = styled.div`
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%);
  border-radius: 20px;
  padding: 1rem;
  border: 1px solid rgba(22, 163, 74, 0.12);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
`;

const RacketPosition = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--primary-subtle);
  color: var(--primary-hover);
  font-weight: 800;
`;

const RacketImageWrap = styled.div`
  border-radius: var(--racket-image-radius-detail);
  overflow: hidden;
  background: var(--racket-image-bg);
  border: var(--racket-image-border);
  box-shadow: var(--racket-image-shadow);
  min-height: 180px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RacketImageSmall = styled.img`
  width: 100%;
  height: 180px;
  object-fit: contain;
`;


const ScoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0.15rem 0;
`;

const ScoreLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
`;

const ScoreBarTrack = styled.div`
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: 99px;
  overflow: hidden;
`;

const ScoreBarFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${p => p.$pct}%;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
  border-radius: 99px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
`;

const ScoreValue = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--primary-hover);
  min-width: 2.8rem;
  text-align: right;
`;

const PriceTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--primary-hover);
`;

const NoPriceTag = styled.div`
  display: inline-flex;
  align-items: center;
  margin-top: 0.25rem;
  padding: 0.2rem 0.55rem;
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 500;
`;

const RecommendedRacketBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
`;

const RacketReason = styled.p`
  margin: 0;
  color: var(--text);
  line-height: 1.6;
`;

const DetailLinkButton = styled(Link)`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.75rem 1rem;
  border-radius: 14px;
  background: var(--primary);
  color: white;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    background: var(--primary-hover);
    box-shadow: 0 10px 18px rgba(22, 163, 74, 0.2);
  }
`;

const ChangeDataCard = styled.div`
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 20px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  justify-content: space-between;
`;

const titleCase = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\b([a-záéíóúüñ])/g, letter => letter.toUpperCase())
    .trim();

const formatRecommendationModelName = (name?: string | null, brand?: string | null): string => {
  const rawName = (name || '').trim();
  const rawBrand = (brand || '').trim();

  if (!rawName && !rawBrand) {
    return 'Pala sin nombre';
  }

  let normalized = rawName || rawBrand;
  normalized = normalized.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

  if (rawBrand) {
    const lowerBrand = rawBrand.toLowerCase();
    const lowerNormalized = normalized.toLowerCase();

    if (lowerNormalized.startsWith(`${lowerBrand} `)) {
      normalized = normalized.slice(rawBrand.length).trim();
    } else if (lowerNormalized.startsWith(`${lowerBrand}-`)) {
      normalized = normalized.slice(rawBrand.length + 1).trim();
    }
  }

  return titleCase(normalized || rawName || rawBrand);
};

export const PlayerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();
  const [favorites, setFavorites] = useState<Racket[]>([]);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [offers, setOffers] = useState<Racket[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedRacket[]>([]);
  const [lastRecommendation, setLastRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [_recommendationLoading, setRecommendationLoading] = useState(true);
  const [showFinderModal, setShowFinderModal] = useState(false);
  const hasRecommendation = Boolean(lastRecommendation?.recommendation_result?.rackets?.length);

  const loadLastRecommendation = async () => {
    try {
      setRecommendationLoading(true);
      const recommendation = await RecommendationService.getLast();
      setLastRecommendation(recommendation);
    } catch (error) {
      console.error('Error fetching last recommendation:', error);
      setLastRecommendation(null);
    } finally {
      setRecommendationLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch favorites count from "Favoritas" list
        const lists = await ListService.getUserLists();
        const favoritasList = lists.find(list => list.name === 'Favoritas');
        if (favoritasList) {
          setFavoritesCount(favoritasList.racket_count || 0);

          // If we want to show the rackets, fetch the list with details
          if (favoritasList.racket_count && favoritasList.racket_count > 0) {
            const listWithRackets = await ListService.getListById(favoritasList.id);
            if (listWithRackets?.rackets) {
              setFavorites(listWithRackets.rackets.slice(0, 4));
            }
          }
        }

        // Fetch recommendations based on user profile
        // const recs = await racketService.getRecommendedRackets(user?.game_level);
        // setRecommendations(recs.slice(0, 3));

        // Fetch offers and recently viewed in parallel
        const [allRackets, recentlyViewedData] = await Promise.all([
          RacketService.getAllRackets(),
          RacketViewService.getRecentlyViewed(4).catch(() => []), // Obtener últimas 4 palas vistas
        ]);

        // Filter offers and shuffle them to show different ones each time
        const onOffer = allRackets.filter((r: Racket) => r.en_oferta);

        // Shuffle array using Fisher-Yates algorithm
        const shuffled = [...onOffer].sort(() => Math.random() - 0.5);

        setOffers(shuffled.slice(0, 4));
        setRecentlyViewed(recentlyViewedData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    if (user) {
      loadLastRecommendation();
    }
  }, [user]);

  useEffect(() => {
    if (location.hash === '#next-rackets' && hasRecommendation) {
      const target = document.getElementById('next-rackets');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, hasRecommendation, lastRecommendation]);

  const quickActions = [
    {
      icon: FaLightbulb,
      title: 'Mejor pala para ti',
      description: 'Encuentra tu pala ideal con IA',
      onClick: () => navigate({ to: '/best-racket' }),
    },
    {
      icon: FaBalanceScale,
      title: 'Comparar palas',
      description: 'Compara hasta 3 palas',
      onClick: () => navigate({ to: '/compare-rackets' }),
    },
    {
      icon: FaChartBar,
      title: 'Mis comparaciones',
      description: 'Historial de comparaciones',
      onClick: () => navigate({ to: '/comparisons' }),
    },
    {
      icon: FaUser,
      title: 'Mi Cuenta',
      description: 'Ver y editar perfil',
      onClick: () => navigate({ to: '/profile' }),
    },
  ];

  return (
    <Container>
      <MaxWidth>
        {/* Hero Section */}
        <HeroSection>
          <Greeting>¡Hola, {user?.full_name || 'Jugador'}!</Greeting>
          <SubGreeting>Bienvenido de vuelta a Smashly</SubGreeting>
          <Stats>
            <Stat>
              <StatValue>{favoritesCount}</StatValue>
              <StatLabel>Favoritas</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{user?.game_level || 'Intermedio'}</StatValue>
              <StatLabel>Nivel</StatLabel>
            </Stat>
          </Stats>
        </HeroSection>

        {/* Quick Actions */}
        <Section>
          <SectionTitle><FaBullseye /> Accesos Rápidos</SectionTitle>
          <QuickActionsGrid>
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </QuickActionsGrid>
        </Section>

        {/* Favorites Preview */}
        {favorites.length > 0 && (
          <Section>
            <SectionTitle><FaHeart /> Tus Favoritas</SectionTitle>
            <RacketsGrid>
              {favorites.map(racket => (
                <RacketCard
                  key={racket.id}
                  onClick={() => navigate({ to: '/racket-detail', search: { id: racket.id } })}
                >
                  {racket.imagenes?.[0] && (
                    <RacketImage src={racketImageUrl(racket.imagenes[0])} alt={racket.nombre} />
                  )}
                  <RacketName>{racket.nombre}</RacketName>
                  <RacketBrand>{racket.marca}</RacketBrand>
                  {racket.precio_actual && <RacketPrice>{racket.precio_actual}€</RacketPrice>}
                </RacketCard>
              ))}
            </RacketsGrid>
            <ViewAllButton onClick={() => navigate({ to: '/favorites' as any })}>Ver todas →</ViewAllButton>
          </Section>
        )}

        {/* Recently Viewed Rackets */}
        {recentlyViewed.length > 0 && (
          <Section>
            <SectionTitle><FaStar /> Últimas Palas Vistas</SectionTitle>
            <RacketsGrid>
              {recentlyViewed.slice(0, 4).map(racket => (
                <RacketCard
                  key={racket.id}
                  onClick={() => navigate({ to: '/racket-detail', search: { id: racket.id } })}
                >
                  {racket.imagenes?.[0] && (
                    <RacketImage src={racketImageUrl(racket.imagenes[0])} alt={racket.nombre} />
                  )}
                  <RacketName>{racket.nombre}</RacketName>
                  <RacketBrand>{racket.marca}</RacketBrand>
                  {racket.precio_actual && <RacketPrice>{racket.precio_actual}€</RacketPrice>}
                </RacketCard>
              ))}
            </RacketsGrid>
          </Section>
        )}

        {/* Offers */}
        {offers.length > 0 && (
          <Section>
            <SectionTitle><FaFire /> Ofertas que te pueden interesar</SectionTitle>
            <RacketsGrid>
              {offers.map(racket => (
                <RacketCard
                  key={racket.id}
                  onClick={() => navigate({ to: '/racket-detail', search: { id: racket.id } })}
                >
                  {racket.imagenes?.[0] && (
                    <RacketImage src={racketImageUrl(racket.imagenes[0])} alt={racket.nombre} />
                  )}
                  <RacketName>{racket.nombre}</RacketName>
                  <RacketBrand>{racket.marca}</RacketBrand>
                  {racket.precio_actual && <RacketPrice>{racket.precio_actual}€</RacketPrice>}
                </RacketCard>
              ))}
            </RacketsGrid>
          </Section>
        )}

        <RecommendationSection id='next-rackets'>
          <RecommendationHero>
            <RecommendationCopy>
              <Eyebrow>Encuentra tu nueva pala</Eyebrow>
              <RecommendationTitle>Tu próximo paso, siempre a mano</RecommendationTitle>
              <RecommendationText>
                Revisa tus tres opciones más recientes y vuelve a afinar los datos cuando quieras.
                La recomendación se actualiza sin salir del dashboard.
              </RecommendationText>
              <RecommendationMeta>
                <MetaPill>Pala actual: {user?.current_racket || 'Pendiente de completar'}</MetaPill>
                <MetaPill>Presupuesto: 50€ - 700€</MetaPill>
                <MetaPill>3 opciones guardadas</MetaPill>
              </RecommendationMeta>
            </RecommendationCopy>

            <ChangeDataCard>
              {hasRecommendation ? (
                <>
                  <strong>¿Quieres cambiar datos?</strong>
                  <span>
                    Vuelve a abrir el formulario, ajusta tu objetivo o presupuesto y genera una
                    nueva terna de palas.
                  </span>
                  <RecommendationActionButton onClick={() => setShowFinderModal(true)}>
                    Cambiar datos
                  </RecommendationActionButton>
                </>
              ) : (
                <>
                  <strong>Averigua cuál es tu siguiente pala</strong>
                  <span>
                    Completa el formulario y guardaremos tus 3 primeras recomendaciones para que
                    las tengas siempre a mano.
                  </span>
                  <RecommendationActionButton onClick={() => setShowFinderModal(true)}>
                    Averigua cuál es tu siguiente pala
                  </RecommendationActionButton>
                </>
              )}
            </ChangeDataCard>
          </RecommendationHero>
        </RecommendationSection>

        {hasRecommendation && (
          <Section>
            <SectionTitle><FaStar /> Tus próximas palas</SectionTitle>
            <RecommendationsGrid>
              {lastRecommendation!.recommendation_result.rackets.slice(0, 3).map((racket, index) => (
                <RecommendedRacketCard key={racket.id}>
                  <RacketPosition>#{index + 1}</RacketPosition>
                  <RacketImageWrap>
                    {racket.image ? <RacketImageSmall src={racket.image} alt={racket.name} /> : null}
                  </RacketImageWrap>
                  <RecommendedRacketBody>
                    <div>
                      <RacketName>{formatRecommendationModelName(racket.name, racket.brand)}</RacketName>
                      <ScoreRow>
                        <ScoreLabel>Match</ScoreLabel>
                        <ScoreBarTrack>
                          <ScoreBarFill $pct={racket.match_score} />
                        </ScoreBarTrack>
                        <ScoreValue>{(racket.match_score / 10).toFixed(1)}/10</ScoreValue>
                      </ScoreRow>
                      {racket.price
                        ? <PriceTag>€{racket.price.toFixed(2)}</PriceTag>
                        : <NoPriceTag>Solo para recomendación</NoPriceTag>
                      }
                    </div>
                    <RacketReason>{racket.reason}</RacketReason>
                  </RecommendedRacketBody>
                  <DetailLinkButton to={`/racket-detail?id=${racket.id}`}>
                    Ver detalle
                  </DetailLinkButton>
                </RecommendedRacketCard>
              ))}
            </RecommendationsGrid>
          </Section>
        )}

        <CurrentRacketFinderModal
          isOpen={showFinderModal}
          onClose={() => setShowFinderModal(false)}
          onGenerated={loadLastRecommendation}
        />

        {loading && (
          <EmptyState>
            <p>Cargando tu dashboard personalizado...</p>
          </EmptyState>
        )}
      </MaxWidth>
    </Container>
  );
};

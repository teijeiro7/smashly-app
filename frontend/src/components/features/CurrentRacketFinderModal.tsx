import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiDollarSign, FiCheckCircle, FiTarget, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useRackets } from '../../contexts/RacketsContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useBackgroundTasks } from '../../contexts/BackgroundTasksContext';
import { PriceRangeSlider } from '../recommendation/PriceRangeSlider';
import { RecommendationService } from '../../services/recommendationService';
import { NotificationService } from '../../services/notificationService';
import { sileo } from 'sileo';

interface CurrentRacketFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated?: () => void;
}

// ── Overlay ─────────────────────────────────────────────────────────────────
const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  contain: layout paint;
  transform: translateZ(0);
`;

// ── Modal Container ─────────────────────────────────────────────────────────
const Modal = styled(motion.div)`
  width: min(640px, 100%);
  max-height: min(92vh, 880px);
  overflow: auto;
  border-radius: 20px;
  background: var(--surface);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.02),
    0 4px 8px rgba(0, 0, 0, 0.03),
    0 12px 24px rgba(0, 0, 0, 0.04),
    0 24px 48px rgba(0, 0, 0, 0.06);
  will-change: transform, opacity;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }
`;

// ── Header ──────────────────────────────────────────────────────────────────
const Header = styled.div`
  padding: 1.5rem 1.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--surface-3);
`;

const TitleWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Eyebrow = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--primary);
  font-weight: 700;
`;

const Title = styled.h2`
  margin: 0;
  color: var(--text);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
`;

const Description = styled.p`
  margin: 0.25rem 0 0;
  color: var(--text-muted);
  line-height: 1.5;
  font-size: 0.9rem;
`;

const CloseButton = styled.button`
  border: none;
  background: var(--surface-2);
  color: var(--text-muted);
  border-radius: 10px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: var(--surface-3);
    color: var(--text);
  }
`;

// ── Form ────────────────────────────────────────────────────────────────────
const Form = styled.form`
  padding: 1.5rem 1.75rem;
  display: grid;
  gap: 1.5rem;
`;

// ── Summary Card ────────────────────────────────────────────────────────────
const SummaryCard = styled.div`
  border-radius: 14px;
  padding: 1rem 1.25rem;
  background: var(--surface-2);
  border: 1px solid var(--surface-3);
  display: grid;
  gap: 0.3rem;
`;

const SummaryLabel = styled.span`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  font-weight: 700;
`;

const SummaryValue = styled.div`
  color: var(--text);
  font-size: 1rem;
  font-weight: 700;
`;

// ── Form Group ──────────────────────────────────────────────────────────────
const FormGroup = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  letter-spacing: -0.01em;
`;

const Select = styled.select`
  width: 100%;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 0.8rem 1rem;
  font-size: 0.95rem;
  background: var(--surface);
  color: var(--text);
  font-weight: 500;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
  cursor: pointer;

  &:hover {
    border-color: var(--border-strong);
  }

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.08);
  }
`;

// ── Budget Card ─────────────────────────────────────────────────────────────
const BudgetCard = styled.div`
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  background: var(--surface);
  display: grid;
  gap: 0.75rem;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: var(--border-strong);
  }
`;

const BudgetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
`;

const BudgetValue = styled.strong`
  color: var(--primary-hover);
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

// ── Buttons ─────────────────────────────────────────────────────────────────
const ActionRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const PrimaryButton = styled.button`
  border: none;
  border-radius: 12px;
  min-height: 48px;
  padding: 0.85rem 1.5rem;
  cursor: pointer;
  background: var(--brand-surface);
  color: var(--brand-on-surface);
  font-weight: 700;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: transform 0.15s ease, background 0.15s ease;
  flex: 1;
  letter-spacing: -0.01em;

  &:hover {
    background: var(--brand-surface-hover);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled.button`
  border: 1.5px solid var(--border);
  border-radius: 12px;
  min-height: 48px;
  padding: 0.85rem 1.5rem;
  cursor: pointer;
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
  font-size: 0.95rem;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease;

  &:hover {
    background: var(--surface-2);
    border-color: var(--border-strong);
    color: var(--text);
  }

  &:active {
    transform: scale(0.98);
  }
`;

// ── Helper Text ─────────────────────────────────────────────────────────────
const HelperText = styled.p`
  margin: 0;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.5;
`;

// ── Section Divider ──────────────────────────────────────────────────────────
const SectionDivider = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--primary);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--primary-subtle);
  margin-top: 0.5rem;
`;

// ── Form Grid ────────────────────────────────────────────────────────────────
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

// ── Stock Toggle Row ─────────────────────────────────────────────────────────
const StockToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
  transition: border-color 0.15s;
  &:hover { border-color: var(--primary); }
  input { accent-color: var(--primary); width: 18px; height: 18px; }
`;

// ── Objective Options ───────────────────────────────────────────────────────
const objectiveOptions = [
  { value: 'potencia', label: 'Subir potencia' },
  { value: 'control', label: 'Subir control' },
  { value: 'equilibrio', label: 'Buscar equilibrio' },
] as const;

// ── Helpers ─────────────────────────────────────────────────────────────────
const normalizeLevel = (gameLevel?: string): string => {
  const value = (gameLevel || 'intermedio').toLowerCase();
  if (value.includes('princip')) return 'principiante';
  if (value.includes('avanz')) return 'avanzado';
  if (value.includes('profes')) return 'profesional';
  return 'intermedio';
};

const normalizeInjuries = (limitations?: string[]): string => {
  const text = limitations?.join(' ').toLowerCase() || '';
  if (text.includes('codo')) return 'codo';
  if (text.includes('hombro')) return 'hombro';
  if (text.includes('muñeca') || text.includes('muneca')) return 'muneca';
  return 'no';
};

const getPriorityOrder = (
  objective: string
): Array<'potencia' | 'control' | 'manejabilidad' | 'salida_de_bola' | 'punto_dulce'> => {
  if (objective === 'potencia') {
    return ['potencia', 'salida_de_bola', 'manejabilidad', 'control', 'punto_dulce'];
  }
  if (objective === 'control') {
    return ['control', 'punto_dulce', 'manejabilidad', 'salida_de_bola', 'potencia'];
  }
  return ['control', 'manejabilidad', 'punto_dulce', 'potencia', 'salida_de_bola'];
};

const getBalancePreference = (objective: string): string => {
  if (objective === 'potencia') return 'alto';
  if (objective === 'control') return 'bajo';
  return 'medio';
};

const getShapePreference = (objective: string): string => {
  if (objective === 'potencia') return 'diamante';
  if (objective === 'control') return 'redonda';
  return 'lagrima';
};

// ── Component ───────────────────────────────────────────────────────────────
const CurrentRacketFinderModal: React.FC<CurrentRacketFinderModalProps> = ({
  isOpen,
  onClose,
  onGenerated,
}) => {
  const { user } = useAuth();
  const { rackets, loading: racketsLoading } = useRackets();
  const { addNotification } = useNotifications();
  const { addTask, completeTask, failTask } = useBackgroundTasks();
  const [currentRacket, setCurrentRacket] = useState('');
  const [objective, setObjective] = useState<'potencia' | 'control' | 'equilibrio'>('equilibrio');
  const [budget, setBudget] = useState({ min: 50, max: 300 });
  const [loading, setLoading] = useState(false);
  const mountedRef = React.useRef(true);

  // New player preference states
  const [level, setLevel] = useState('');
  const [frequency, setFrequency] = useState('');
  const [injuries, setInjuries] = useState('no');
  const [gender, setGender] = useState<'masculino' | 'femenino' | ''>('');
  const [physicalCondition, setPhysicalCondition] = useState('');
  const [position, setPosition] = useState('');
  const [touchPreference, setTouchPreference] = useState('');
  const [weightPreference, setWeightPreference] = useState('no_se');
  const [balancePreference, setBalancePreference] = useState('no_se');
  const [shapePreference, setShapePreference] = useState('no_se');
  const [onlyInStock, setOnlyInStock] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentRacket(user?.current_racket || '');
      setObjective('equilibrio');
      setBudget({ min: 50, max: 300 });
      // Pre-fill from user profile
      setLevel(normalizeLevel(user?.game_level));
      setFrequency(user?.frequency || '');
      setGender((user?.gender as 'masculino' | 'femenino' | '') || '');
      setPhysicalCondition(user?.physical_condition || '');
      setPosition(user?.position || '');
      setTouchPreference(user?.touch_preference || '');
      setWeightPreference(user?.weight_preference || 'no_se');
      setBalancePreference(user?.balance_preference || 'no_se');
      setShapePreference(user?.shape_preference || 'no_se');
      setInjuries(normalizeInjuries(user?.limitations));
      setOnlyInStock(false);
    }
  }, [isOpen, user]);

  const currentRacketLabel = useMemo(() => {
    if (currentRacket) return currentRacket;
    return user?.current_racket || 'No has indicado tu pala actual';
  }, [currentRacket, user?.current_racket]);

  const racketOptions = useMemo(() => {
    return rackets.map(racket => {
      const displayName = `${racket.marca} ${racket.modelo || racket.nombre}`.trim();
      return (
        <option key={racket.id} value={displayName}>
          {displayName}
        </option>
      );
    });
  }, [rackets]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const taskId = addTask(
      'recommendation',
      {
        formData: {
          current_racket: currentRacket,
          objective,
          budget,
        },
      },
      '/dashboard'
    );

    setLoading(true);
    onClose();

    try {
      const formData = {
        level: level || normalizeLevel(user?.game_level),
        frequency: frequency || '2-3',
        injuries: injuries,
        gender: (gender || undefined) as 'masculino' | 'femenino' | undefined,
        physical_condition: (physicalCondition || undefined) as 'asiduo' | 'ocasional' | undefined,
        budget,
        current_racket: currentRacket,
        play_style: objective,
        position: position || 'ambos',
        touch_preference: (touchPreference || undefined) as 'duro' | 'medio' | 'blando' | undefined,
        weight_preference: weightPreference || 'no_se',
        balance_preference: balancePreference || getBalancePreference(objective),
        shape_preference: shapePreference || getShapePreference(objective),
        years_playing: '2',
        best_shot: '',
        weak_shot: '',
        current_racket_likes: '',
        current_racket_dislikes: '',
        style: objective,
        weakest_shot: '',
        goals: [objective === 'potencia' ? 'Más potencia' : objective === 'control' ? 'Más control' : 'Más equilibrio'],
        objectives: [objective === 'potencia' ? 'Más potencia' : objective === 'control' ? 'Más control' : 'Más equilibrio'],
        characteristic_priorities: getPriorityOrder(objective),
        only_in_stock: onlyInStock,
      };

      const result = await RecommendationService.generate('advanced', formData);
      await RecommendationService.save('advanced', formData, result);

      const notification = await NotificationService.createNotification(
        'recommendation_complete',
        'Comparación de siguiente pala terminada',
        'Ya tienes tus 3 palas recomendadas. Pulsa para verlas en el dashboard.',
        {
          link: '/dashboard#next-rackets',
          recommendationType: 'advanced',
          budget,
        }
      );

      if (notification) {
        addNotification(notification);
      }

      completeTask(taskId, result);

      sileo.success({ title: 'Éxito', description: 'Recomendación generada correctamente' });
      onGenerated?.();
    } catch (error) {
      console.error('Error generating recommendation:', error);
      failTask(taskId, 'No hemos podido generar la recomendación');
      sileo.error({
        title: 'Error',
        description: 'No hemos podido generar la recomendación. Inténtalo de nuevo.',
      });
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <Modal
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <Header>
              <TitleWrap>
                <Eyebrow>Encuentra tu nueva pala</Eyebrow>
                <Title>Tu ajuste rápido para la siguiente compra</Title>
                <Description>
                  Indícanos tu pala actual, qué quieres mejorar y cuánto quieres invertir.
                </Description>
              </TitleWrap>
              <CloseButton type="button" onClick={onClose} aria-label="Cerrar">
                <FiX size={18} />
              </CloseButton>
            </Header>

            <Form onSubmit={handleSubmit}>
              <SummaryCard>
                <SummaryLabel>Tu pala actual</SummaryLabel>
                <SummaryValue>{currentRacketLabel}</SummaryValue>
                <HelperText>
                  Puedes cambiarla aquí si has empezado a usar otra pala.
                </HelperText>
              </SummaryCard>

              <FormGroup>
                <Label htmlFor="current_racket">
                  <FiTarget size={14} /> Selecciona tu pala actual
                </Label>
                <Select
                  id="current_racket"
                  value={currentRacket}
                  onChange={e => setCurrentRacket(e.target.value)}
                  disabled={racketsLoading}
                  required
                >
                  <option value="">Selecciona una pala del catálogo</option>
                  {racketOptions}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="objective">
                  <FiTrendingUp size={14} /> ¿Qué quieres mejorar?
                </Label>
                <Select
                  id="objective"
                  value={objective}
                  onChange={e => setObjective(e.target.value as typeof objective)}
                  required
                >
                  {objectiveOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>

              <div>
                <SectionDivider>Tu perfil de juego</SectionDivider>
              </div>

              <FormGrid>
                <FormGroup>
                  <Label htmlFor="level">Nivel de juego</Label>
                  <Select
                    id="level"
                    value={level}
                    onChange={e => setLevel(e.target.value)}
                  >
                    <option value="">Selecciona tu nivel</option>
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                    <option value="profesional">Profesional</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="frequency">Frecuencia</Label>
                  <Select
                    id="frequency"
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                  >
                    <option value="">Selecciona frecuencia</option>
                    <option value="1">1 vez/semana o menos</option>
                    <option value="2-3">2-3 veces/semana</option>
                    <option value="4+">4+ veces/semana</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="position">Posición</Label>
                  <Select
                    id="position"
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                  >
                    <option value="">Selecciona posición</option>
                    <option value="reves">Revés</option>
                    <option value="drive">Drive</option>
                    <option value="ambos">Indiferente</option>
                  </Select>
                </FormGroup>
              </FormGrid>

              <div>
                <SectionDivider>Perfil físico</SectionDivider>
              </div>

              <FormGrid>
                <FormGroup>
                  <Label htmlFor="gender">Género</Label>
                  <Select
                    id="gender"
                    value={gender}
                    onChange={e => setGender(e.target.value as 'masculino' | 'femenino' | '')}
                  >
                    <option value="">Selecciona género</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="physicalCondition">Condición física</Label>
                  <Select
                    id="physicalCondition"
                    value={physicalCondition}
                    onChange={e => setPhysicalCondition(e.target.value)}
                  >
                    <option value="">Selecciona condición</option>
                    <option value="asiduo">Asiduo al deporte</option>
                    <option value="ocasional">Ocasional</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="injuries">Lesiones</Label>
                  <Select
                    id="injuries"
                    value={injuries}
                    onChange={e => setInjuries(e.target.value)}
                  >
                    <option value="no">No</option>
                    <option value="codo">Codo (epicondilitis)</option>
                    <option value="hombro">Hombro</option>
                    <option value="muneca">Muñeca</option>
                  </Select>
                </FormGroup>
              </FormGrid>

              <div>
                <SectionDivider>Preferencias de pala</SectionDivider>
              </div>

              <FormGrid>
                <FormGroup>
                  <Label htmlFor="touchPreference">Tacto</Label>
                  <Select
                    id="touchPreference"
                    value={touchPreference}
                    onChange={e => setTouchPreference(e.target.value)}
                  >
                    <option value="">Selecciona tacto</option>
                    <option value="duro">Duro</option>
                    <option value="medio">Medio</option>
                    <option value="blando">Blando</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="weightPreference">Peso pala</Label>
                  <Select
                    id="weightPreference"
                    value={weightPreference}
                    onChange={e => setWeightPreference(e.target.value)}
                  >
                    <option value="no_se">No sé</option>
                    <option value="ligera">Ligera (&lt;360g)</option>
                    <option value="media">Media (360-375g)</option>
                    <option value="pesada">Pesada (&gt;375g)</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="balancePreference">Balance</Label>
                  <Select
                    id="balancePreference"
                    value={balancePreference}
                    onChange={e => setBalancePreference(e.target.value)}
                  >
                    <option value="no_se">No sé</option>
                    <option value="bajo">Bajo (Manejable)</option>
                    <option value="medio">Medio (Equilibrado)</option>
                    <option value="alto">Alto (Potencia)</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="shapePreference">Forma</Label>
                  <Select
                    id="shapePreference"
                    value={shapePreference}
                    onChange={e => setShapePreference(e.target.value)}
                  >
                    <option value="no_se">No sé</option>
                    <option value="redonda">Redonda</option>
                    <option value="lagrima">Lágrima</option>
                    <option value="diamante">Diamante</option>
                  </Select>
                </FormGroup>
              </FormGrid>

              <BudgetCard>
                <BudgetHeader>
                  <Label>
                    <FiDollarSign size={14} /> Presupuesto
                  </Label>
                  <BudgetValue>
                    {budget.min}€ – {budget.max}€
                  </BudgetValue>
                </BudgetHeader>
                <PriceRangeSlider min={50} max={700} step={10} value={budget} onChange={setBudget} />
                <HelperText>
                  El mínimo recomendado es 50€ y el máximo 700€.
                </HelperText>
              </BudgetCard>

              <StockToggleRow>
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={e => setOnlyInStock(e.target.checked)}
                />
                Mostrar solo palas en stock (con precio conocido)
              </StockToggleRow>

              <ActionRow>
                <SecondaryButton type="button" onClick={onClose}>
                  Cancelar
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={loading}>
                  {loading ? 'Generando...' : 'Encontrar mi nueva pala'}
                  <FiCheckCircle size={16} />
                </PrimaryButton>
              </ActionRow>
            </Form>
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default CurrentRacketFinderModal;

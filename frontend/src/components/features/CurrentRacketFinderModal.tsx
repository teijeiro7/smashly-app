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
  background: #ffffff;
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
    background: #e2e8f0;
    border-radius: 3px;
  }
`;

// ── Header ──────────────────────────────────────────────────────────────────
const Header = styled.div`
  padding: 1.5rem 1.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f1f5f9;
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
  color: #16a34a;
  font-weight: 700;
`;

const Title = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
`;

const Description = styled.p`
  margin: 0.25rem 0 0;
  color: #64748b;
  line-height: 1.5;
  font-size: 0.9rem;
`;

const CloseButton = styled.button`
  border: none;
  background: #f8fafc;
  color: #64748b;
  border-radius: 10px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: #f1f5f9;
    color: #334155;
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
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  display: grid;
  gap: 0.3rem;
`;

const SummaryLabel = styled.span`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
  font-weight: 700;
`;

const SummaryValue = styled.div`
  color: #0f172a;
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
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  letter-spacing: -0.01em;
`;

const Select = styled.select`
  width: 100%;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.8rem 1rem;
  font-size: 0.95rem;
  background: #ffffff;
  color: #0f172a;
  font-weight: 500;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
  cursor: pointer;

  &:hover {
    border-color: #cbd5e1;
  }

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08);
  }
`;

// ── Budget Card ─────────────────────────────────────────────────────────────
const BudgetCard = styled.div`
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 1rem 1.25rem;
  background: #ffffff;
  display: grid;
  gap: 0.75rem;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: #cbd5e1;
  }
`;

const BudgetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
`;

const BudgetValue = styled.strong`
  color: #14532d;
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
  background: #111111;
  color: #ffffff;
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
    background: #333333;
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
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  min-height: 48px;
  padding: 0.85rem 1.5rem;
  cursor: pointer;
  background: #ffffff;
  color: #475569;
  font-weight: 600;
  font-size: 0.95rem;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease;

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #334155;
  }

  &:active {
    transform: scale(0.98);
  }
`;

// ── Helper Text ─────────────────────────────────────────────────────────────
const HelperText = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.5;
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
        level: normalizeLevel(user?.game_level),
        frequency: '2-3',
        injuries: normalizeInjuries(user?.limitations),
        budget,
        current_racket: currentRacket,
        play_style: objective,
        years_playing: 2,
        position: 'ambos',
        best_shot: '',
        weak_shot: '',
        weight_preference: 'no_se',
        balance_preference: getBalancePreference(objective),
        shape_preference: getShapePreference(objective),
        current_racket_likes: '',
        current_racket_dislikes: '',
        objectives: [objective === 'potencia' ? 'Más potencia' : objective === 'control' ? 'Más control' : 'Más equilibrio'],
        characteristic_priorities: getPriorityOrder(objective),
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

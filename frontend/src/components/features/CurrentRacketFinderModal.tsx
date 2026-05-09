import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
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

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const Modal = styled(motion.div)`
  width: min(760px, 100%);
  max-height: min(92vh, 920px);
  overflow: auto;
  border-radius: 28px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(22, 163, 74, 0.12);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.35);
`;

const Header = styled.div`
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #e2e8f0;
`;

const TitleWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Eyebrow = styled.span`
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #16a34a;
  font-weight: 700;
`;

const Title = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 1.5rem;
`;

const Description = styled.p`
  margin: 0;
  color: #475569;
  line-height: 1.5;
`;

const CloseButton = styled.button`
  border: none;
  background: #f1f5f9;
  color: #475569;
  border-radius: 12px;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const Form = styled.form`
  padding: 1.5rem;
  display: grid;
  gap: 1.25rem;
`;

const SummaryCard = styled.div`
  border-radius: 22px;
  padding: 1rem 1.1rem;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  border: 1px solid #bbf7d0;
  display: grid;
  gap: 0.35rem;
`;

const SummaryLabel = styled.span`
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #166534;
  font-weight: 700;
`;

const SummaryValue = styled.div`
  color: #052e16;
  font-size: 1.05rem;
  font-weight: 700;
`;

const FormGroup = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.925rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.45rem;
`;

const Select = styled.select`
  width: 100%;
  border: 1px solid #dbe4ef;
  border-radius: 14px;
  padding: 0.9rem 1rem;
  font-size: 1rem;
  background: white;
  color: #0f172a;
`;

const BudgetCard = styled.div`
  border: 1px solid #dbe4ef;
  border-radius: 20px;
  padding: 1rem;
  background: white;
  display: grid;
  gap: 0.5rem;
`;

const BudgetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
`;

const BudgetValue = styled.strong`
  color: #14532d;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const PrimaryButton = styled.button`
  border: none;
  border-radius: 16px;
  min-height: 48px;
  padding: 0.9rem 1.25rem;
  cursor: pointer;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 14px 28px rgba(22, 163, 74, 0.24);
`;

const SecondaryButton = styled.button`
  border: 1px solid #dbe4ef;
  border-radius: 16px;
  min-height: 48px;
  padding: 0.9rem 1.25rem;
  cursor: pointer;
  background: white;
  color: #475569;
  font-weight: 700;
`;

const HelperText = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const objectiveOptions = [
  { value: 'potencia', label: 'Subir potencia' },
  { value: 'control', label: 'Subir control' },
  { value: 'equilibrio', label: 'Buscar equilibrio' },
] as const;

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
          onClick={onClose}
        >
          <Modal
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            onClick={e => e.stopPropagation()}
          >
            <Header>
              <TitleWrap>
                <Eyebrow>Encuentra tu nueva pala</Eyebrow>
                <Title>Tu ajuste rápido para la siguiente compra</Title>
                <Description>
                  Indícanos tu pala actual, qué quieres mejorar y cuánto quieres invertir. Con eso
                  generamos una recomendación más afinada.
                </Description>
              </TitleWrap>
              <CloseButton type='button' onClick={onClose} aria-label='Cerrar'>
                <FiX size={20} />
              </CloseButton>
            </Header>

            <Form onSubmit={handleSubmit}>
              <SummaryCard>
                <SummaryLabel>Tu pala actual</SummaryLabel>
                <SummaryValue>{currentRacketLabel}</SummaryValue>
                <HelperText>
                  Puedes cambiarla aquí si has empezado a usar otra pala o si todavía no la habías
                  guardado en tu cuenta.
                </HelperText>
              </SummaryCard>

              <FormGroup>
                <Label htmlFor='current_racket'>Selecciona tu pala actual</Label>
                <Select
                  id='current_racket'
                  value={currentRacket}
                  onChange={e => setCurrentRacket(e.target.value)}
                  disabled={racketsLoading}
                  required
                >
                  <option value=''>Selecciona una pala del catálogo</option>
                  {rackets.map(racket => {
                    const displayName = `${racket.marca} ${racket.modelo || racket.nombre}`.trim();
                    return (
                      <option key={racket.id} value={displayName}>
                        {displayName}
                      </option>
                    );
                  })}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor='objective'>¿Qué quieres mejorar?</Label>
                <Select
                  id='objective'
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
                    <FiDollarSign /> Presupuesto
                  </Label>
                  <BudgetValue>
                    {budget.min}€ - {budget.max}€
                  </BudgetValue>
                </BudgetHeader>
                <PriceRangeSlider min={50} max={700} step={10} value={budget} onChange={setBudget} />
                <HelperText>
                  El mínimo recomendado es 50€ y el máximo 700€. Ajusta el rango que tenga sentido
                  para ti.
                </HelperText>
              </BudgetCard>

              <ActionRow>
                <SecondaryButton type='button' onClick={onClose}>
                  Cancelar
                </SecondaryButton>
                <PrimaryButton type='submit' disabled={loading}>
                  {loading ? 'Generando...' : 'Encontrar mi nueva pala'}
                  <FiCheckCircle />
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

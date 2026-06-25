import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { BasicFormData, AdvancedFormData } from '../../types/recommendation';
import { PriceRangeSlider } from './PriceRangeSlider';
import { RacketSearchInput, RacketSearchResult } from './RacketSearchInput';

const WizardContainer = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--surface);
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.02),
    0 4px 8px rgba(0, 0, 0, 0.03),
    0 12px 24px rgba(0, 0, 0, 0.04),
    0 24px 48px rgba(0, 0, 0, 0.06);
`;

const ProgressBarContainer = styled.div`
  margin-bottom: 2.5rem;
`;

const ProgressBar = styled.div`
  position: relative;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: var(--primary-hover);
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const ProgressCounter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
`;

const ProgressText = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const QuestionContainer = styled(motion.div)`
  min-height: 280px;
`;

const QuestionTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.4rem;
  text-align: center;
  letter-spacing: -0.01em;
  line-height: 1.3;
`;

const QuestionSubtitle = styled.p`
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 2rem;
  text-align: center;
  line-height: 1.5;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const OptionCard = styled.button<{ $selected: boolean }>`
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1.5px solid ${props => (props.$selected ? 'var(--primary-hover)' : 'var(--border)')};
  background: ${props => (props.$selected ? 'var(--surface-2)' : 'var(--surface)')};
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease;
  text-align: left;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${props => (props.$selected ? 'var(--text)' : 'var(--text)')};

  &:hover {
    border-color: ${props => (props.$selected ? 'var(--text)' : 'var(--text-subtle)')};
    background: ${props => (props.$selected ? 'var(--surface-2)' : 'var(--surface-2)')};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 500;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder { color: var(--text-subtle); }

  &:focus {
    outline: none;
    border-color: var(--text);
    box-shadow: 0 0 0 3px var(--shadow-color);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 500;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder { color: var(--text-subtle); }

  &:focus {
    outline: none;
    border-color: var(--text);
    box-shadow: 0 0 0 3px var(--shadow-color);
  }
`;

const SliderContainer = styled.div`
  padding: 1rem 0;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2.5rem;
  gap: 0.75rem;
`;

const NavButton = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.5rem;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  background: ${props => (props.$primary ? 'var(--primary-hover)' : 'var(--surface-3)')};
  color: ${props => (props.$primary ? 'var(--brand-on-surface)' : 'var(--text)')};
  transition: background-color 0.15s ease, transform 0.15s ease, color 0.15s ease;
  font-size: 0.95rem;
  flex: 1;
  letter-spacing: -0.01em;
  min-height: 48px;

  &:hover {
    background: ${props => (props.$primary ? 'var(--text)' : 'var(--border)')};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
`;

const OptionalBadge = styled.span`
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.2rem 0.5rem;
  background: var(--surface-3);
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  vertical-align: middle;
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  font-weight: 500;
  color: var(--text);
  font-size: 0.95rem;

  &:hover {
    border-color: var(--text-subtle);
    background: var(--surface-2);
  }

  input {
    accent-color: var(--text);
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

interface WizardFormProps {
  mode: 'basic' | 'advanced';
  onSubmit: (data: BasicFormData | AdvancedFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<BasicFormData & AdvancedFormData>;
}

type Question = {
  id: string;
  key: keyof (BasicFormData & AdvancedFormData);
  title: string;
  subtitle?: string;
  type: 'single' | 'multi' | 'number' | 'text' | 'textarea' | 'slider' | 'racket-search';
  options?: { value: string; label: string }[];
  required?: boolean;
  optional?: boolean;
};

const BASIC_QUESTIONS: Question[] = [
  {
    id: 'level',
    key: 'level',
    title: '¿Cuál es tu nivel de juego?',
    subtitle: 'Esto nos ayuda a recomendarte palas apropiadas para tu experiencia',
    type: 'single',
    required: true,
    options: [
      { value: 'principiante', label: 'Principiante' },
      { value: 'intermedio', label: 'Intermedio' },
      { value: 'avanzado', label: 'Avanzado' },
      { value: 'profesional', label: 'Profesional' },
    ],
  },
  {
    id: 'frequency',
    key: 'frequency',
    title: '¿Con qué frecuencia juegas?',
    type: 'single',
    required: true,
    options: [
      { value: '1', label: '1 vez/semana o menos' },
      { value: '2-3', label: '2-3 veces/semana' },
      { value: '4+', label: '4+ veces/semana' },
    ],
  },
  {
    id: 'injuries',
    key: 'injuries',
    title: '¿Has tenido lesiones?',
    subtitle: 'Priorizaremos palas que protejan tu salud',
    type: 'single',
    required: true,
    options: [
      { value: 'no', label: 'No' },
      { value: 'codo', label: 'Codo (epicondilitis)' },
      { value: 'hombro', label: 'Hombro' },
      { value: 'muneca', label: 'Muñeca' },
    ],
  },
  {
    id: 'gender',
    key: 'gender',
    title: '¿Cuál es tu género?',
    subtitle: 'Afecta al peso y características recomendadas',
    type: 'single',
    required: true,
    options: [
      { value: 'masculino', label: 'Masculino' },
      { value: 'femenino', label: 'Femenino' },
    ],
  },
  {
    id: 'physical_condition',
    key: 'physical_condition',
    title: '¿Cuál es tu condición física?',
    type: 'single',
    required: true,
    options: [
      { value: 'asiduo', label: 'Asiduo al deporte' },
      { value: 'ocasional', label: 'Ocasional' },
    ],
  },
  {
    id: 'budget',
    key: 'budget',
    title: '¿Cuál es tu presupuesto?',
    subtitle: 'Ajusta el rango según tu preferencia',
    type: 'slider',
    required: true,
  },
  {
    id: 'touch_preference',
    key: 'touch_preference',
    title: '¿Qué tacto prefieres?',
    subtitle: 'La sensación al golpear la bola',
    type: 'single',
    required: true,
    options: [
      { value: 'duro', label: 'Duro' },
      { value: 'medio', label: 'Medio' },
      { value: 'blando', label: 'Blando' },
    ],
  },
  {
    id: 'current_racket',
    key: 'current_racket',
    title: '¿Cuál es tu pala actual?',
    subtitle: 'Búscala en nuestro catálogo (opcional)',
    type: 'racket-search',
    required: false,
    optional: true,
  },
];

const ADVANCED_QUESTIONS: Question[] = [
  {
    id: 'level',
    key: 'level',
    title: '¿Cuál es tu nivel de juego?',
    subtitle: 'Esto nos ayuda a recomendarte palas apropiadas para tu experiencia',
    type: 'single',
    required: true,
    options: [
      { value: 'principiante', label: 'Principiante' },
      { value: 'intermedio', label: 'Intermedio' },
      { value: 'avanzado', label: 'Avanzado' },
      { value: 'profesional', label: 'Profesional' },
    ],
  },
  {
    id: 'frequency',
    key: 'frequency',
    title: '¿Con qué frecuencia juegas?',
    type: 'single',
    required: true,
    options: [
      { value: '1', label: '1 vez/semana o menos' },
      { value: '2-3', label: '2-3 veces/semana' },
      { value: '4+', label: '4+ veces/semana' },
    ],
  },
  {
    id: 'style',
    key: 'style',
    title: '¿Cuál es tu estilo de juego?',
    type: 'single',
    required: true,
    options: [
      { value: 'control', label: 'Control (Defensivo)' },
      { value: 'potencia', label: 'Potencia (Ofensivo)' },
      { value: 'equilibrado', label: 'Equilibrado' },
    ],
  },
  {
    id: 'years_playing',
    key: 'years_playing',
    title: '¿Cuántos años llevas jugando?',
    type: 'number',
    required: true,
  },
  {
    id: 'injuries',
    key: 'injuries',
    title: '¿Has tenido lesiones?',
    subtitle: 'Priorizaremos palas que protejan tu salud',
    type: 'single',
    required: true,
    options: [
      { value: 'no', label: 'No' },
      { value: 'codo', label: 'Codo (epicondilitis)' },
      { value: 'hombro', label: 'Hombro' },
      { value: 'muneca', label: 'Muñeca' },
    ],
  },
  {
    id: 'gender',
    key: 'gender',
    title: '¿Cuál es tu género?',
    subtitle: 'Afecta al peso y características recomendadas',
    type: 'single',
    required: true,
    options: [
      { value: 'masculino', label: 'Masculino' },
      { value: 'femenino', label: 'Femenino' },
    ],
  },
  {
    id: 'physical_condition',
    key: 'physical_condition',
    title: '¿Cuál es tu condición física?',
    type: 'single',
    required: true,
    options: [
      { value: 'asiduo', label: 'Asiduo al deporte' },
      { value: 'ocasional', label: 'Ocasional' },
    ],
  },
  {
    id: 'budget',
    key: 'budget',
    title: '¿Cuál es tu presupuesto máximo?',
    type: 'slider',
    required: true,
  },
  {
    id: 'touch_preference',
    key: 'touch_preference',
    title: '¿Qué tacto prefieres?',
    subtitle: 'La sensación al golpear la bola',
    type: 'single',
    required: true,
    options: [
      { value: 'duro', label: 'Duro' },
      { value: 'medio', label: 'Medio' },
      { value: 'blando', label: 'Blando' },
    ],
  },
  {
    id: 'weight_preference',
    key: 'weight_preference',
    title: '¿Qué peso prefieres?',
    type: 'single',
    required: true,
    options: [
      { value: 'no_se', label: 'No sé' },
      { value: 'ligera', label: 'Ligera (<360g)' },
      { value: 'media', label: 'Media (360-375g)' },
      { value: 'pesada', label: 'Pesada (>375g)' },
    ],
  },
  {
    id: 'balance_preference',
    key: 'balance_preference',
    title: '¿Qué balance prefieres?',
    type: 'single',
    required: true,
    options: [
      { value: 'no_se', label: 'No sé' },
      { value: 'bajo', label: 'Bajo (Manejable)' },
      { value: 'medio', label: 'Medio (Equilibrado)' },
      { value: 'alto', label: 'Alto (Potencia)' },
    ],
  },
  {
    id: 'shape_preference',
    key: 'shape_preference',
    title: '¿Qué forma prefieres?',
    type: 'single',
    required: true,
    options: [
      { value: 'no_se', label: 'No sé' },
      { value: 'redonda', label: 'Redonda' },
      { value: 'lagrima', label: 'Lágrima' },
      { value: 'diamante', label: 'Diamante' },
    ],
  },
  {
    id: 'current_racket',
    key: 'current_racket',
    title: '¿Cuál es tu pala actual?',
    subtitle: 'Búscala en nuestro catálogo (opcional)',
    type: 'racket-search',
    required: false,
    optional: true,
  },
  {
    id: 'likes_current_racket',
    key: 'likes_current_racket',
    title: '¿Qué te GUSTA de tu pala actual?',
    subtitle: 'Cuéntanos sus puntos fuertes (opcional)',
    type: 'textarea',
    required: false,
    optional: true,
  },
  {
    id: 'dislikes_current_racket',
    key: 'dislikes_current_racket',
    title: '¿Qué cambiarías de tu pala actual?',
    subtitle: 'Cuéntanos qué no te gusta (opcional)',
    type: 'textarea',
    required: false,
    optional: true,
  },
  {
    id: 'goals',
    key: 'goals',
    title: '¿Cuáles son tus objetivos?',
    subtitle: 'Selecciona todos los que apliquen',
    type: 'multi',
    required: true,
    options: [
      { value: 'Más potencia', label: 'Más potencia' },
      { value: 'Más control', label: 'Más control' },
      { value: 'Menos lesiones', label: 'Menos lesiones' },
      { value: 'Mejorar técnica', label: 'Mejorar técnica' },
      { value: 'Subir de nivel', label: 'Subir de nivel' },
      { value: 'Durabilidad', label: 'Durabilidad' },
    ],
  },
];

export const WizardForm: React.FC<WizardFormProps> = ({ mode, onSubmit, isLoading, initialData }) => {
  const questions = mode === 'basic' ? BASIC_QUESTIONS : ADVANCED_QUESTIONS;
  const [currentIndex, setCurrentIndex] = useState(0);

  const getInitialData = () => {
    if (mode === 'basic') {
      return {
        level: '',
        frequency: '',
        injuries: '',
        budget: { min: 50, max: 200 },
        current_racket: '',
        gender: undefined,
        physical_condition: undefined,
        touch_preference: undefined,
        ...initialData,
      } as BasicFormData;
    }
    return {
      level: '',
      frequency: '',
      injuries: '',
      budget: { min: 30, max: 300 },
      current_racket: '',
      style: '',
      years_playing: '',
      position: '',
      best_shot: '',
      weakest_shot: '',
      weight_preference: '',
      balance_preference: '',
      shape_preference: '',
      likes_current_racket: '',
      dislikes_current_racket: '',
      goals: [],
      gender: undefined,
      physical_condition: undefined,
      touch_preference: undefined,
      ...initialData,
    } as AdvancedFormData;
  };

  const [formData, setFormData] = useState<BasicFormData | AdvancedFormData>(getInitialData());

  useEffect(() => {
    setFormData(getInitialData());
    setCurrentIndex(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const currentQuestion = questions[currentIndex];
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (isLastQuestion) {
      onSubmit(formData);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstQuestion) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleValueChange = (value: any) => {
    setFormData(prev => ({ ...prev, [currentQuestion.key]: value }) as any);
  };

  const canProceed = () => {
    if (currentQuestion.optional) return true;
    const value = (formData as any)[currentQuestion.key];
    if (currentQuestion.type === 'multi') {
      return Array.isArray(value) && value.length > 0;
    }
    if (currentQuestion.type === 'slider') {
      if (mode === 'basic') {
        const budget = value as { min: number; max: number };
        return budget && budget.max > 0;
      }
      return value !== undefined && value !== '';
    }
    return value !== undefined && value !== '' && value !== null;
  };

  const getValue = () => {
    return (formData as any)[currentQuestion.key];
  };

  return (
    <WizardContainer>
      <ProgressBarContainer>
        <ProgressBar>
          <ProgressFill style={{ width: `${progress}%` }} />
        </ProgressBar>
        <ProgressCounter>
          <ProgressText>Pregunta {currentIndex + 1} de {questions.length}</ProgressText>
          <ProgressText>{Math.round(progress)}%</ProgressText>
        </ProgressCounter>
      </ProgressBarContainer>

      <AnimatePresence mode='wait'>
        <QuestionContainer
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <QuestionTitle>
            {currentQuestion.title}
            {currentQuestion.optional && <OptionalBadge>Opcional</OptionalBadge>}
          </QuestionTitle>
          {currentQuestion.subtitle && (
            <QuestionSubtitle>{currentQuestion.subtitle}</QuestionSubtitle>
          )}

          {currentQuestion.type === 'single' && (
            <OptionsGrid>
              {currentQuestion.options?.map(option => (
                <OptionCard
                  key={option.value}
                  $selected={getValue() === option.value}
                  onClick={() => handleValueChange(option.value)}
                  type='button'
                >
                  {option.label}
                </OptionCard>
              ))}
            </OptionsGrid>
          )}

          {currentQuestion.type === 'multi' && (
            <CheckboxGroup>
              {currentQuestion.options?.map(option => (
                <CheckboxLabel key={option.value}>
                  <input
                    type='checkbox'
                    checked={(getValue() as string[])?.includes(option.value) || false}
                    onChange={e => {
                      const current = (getValue() as string[]) || [];
                      if (e.target.checked) {
                        handleValueChange([...current, option.value]);
                      } else {
                        handleValueChange(current.filter((v: string) => v !== option.value));
                      }
                    }}
                  />
                  {option.label}
                </CheckboxLabel>
              ))}
            </CheckboxGroup>
          )}

          {currentQuestion.type === 'number' && (
            <Input
              type='number'
              value={(getValue() as string) || ''}
              onChange={e => handleValueChange(e.target.value)}
              placeholder='Ej: 2'
            />
          )}

          {currentQuestion.type === 'text' && (
            <Input
              type='text'
              value={(getValue() as string) || ''}
              onChange={e => handleValueChange(e.target.value)}
              placeholder='Escribe tu respuesta...'
            />
          )}

          {currentQuestion.type === 'textarea' && (
            <TextArea
              value={(getValue() as string) || ''}
              onChange={e => handleValueChange(e.target.value)}
              placeholder='Escribe tu respuesta...'
            />
          )}

          {currentQuestion.type === 'racket-search' && (
            <RacketSearchInput
              value={(getValue() as RacketSearchResult) || null}
              onChange={racket => handleValueChange(racket)}
              placeholder='Buscar en el catálogo...'
            />
          )}

          {currentQuestion.type === 'slider' && (
            <SliderContainer>
              {mode === 'basic' ? (
                <PriceRangeSlider
                  min={50}
                  max={500}
                  step={10}
                  value={(getValue() as { min: number; max: number }) || { min: 50, max: 200 }}
                  onChange={range => handleValueChange(range)}
                />
              ) : (
                <PriceRangeSlider
                  min={30}
                  max={700}
                  step={10}
                  value={(getValue() as { min: number; max: number }) || { min: 30, max: 300 }}
                  onChange={range => handleValueChange(range)}
                />
              )}
            </SliderContainer>
          )}
        </QuestionContainer>
      </AnimatePresence>

      <NavigationButtons>
        <NavButton onClick={handleBack} disabled={isFirstQuestion || isLoading}>
          <FiChevronLeft /> Anterior
        </NavButton>
        <NavButton $primary onClick={handleNext} disabled={!canProceed() || isLoading}>
          {isLastQuestion ? (isLoading ? 'Analizando...' : 'Finalizar') : 'Siguiente'}
          {!isLastQuestion && <FiChevronRight />}
        </NavButton>
      </NavigationButtons>
    </WizardContainer>
  );
};

export default WizardForm;

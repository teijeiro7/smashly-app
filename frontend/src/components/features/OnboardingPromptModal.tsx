import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUserCheck,
  FiArrowRight,
  FiX,
  FiActivity,
  FiCalendar,
  FiTrendingUp,
  FiAlertCircle,
  FiCheck,
} from 'react-icons/fi';
import { GiTennisRacket } from 'react-icons/gi';
import { UserProfileService } from '../../services/userProfileService';
import { sileo } from 'sileo';
import { useAuth } from '../../contexts/AuthContext';
import RacketSearchInput, { RacketSearchResult } from '../recommendation/RacketSearchInput';

interface OnboardingPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Modal = styled(motion.div)`
  background: var(--surface);
  border-radius: 20px;
  padding: 2rem;
  max-width: 580px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: var(--surface-3); border-radius: 3px; }
  &::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }
`;

const IconContainer = styled.div`
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, var(--primary-subtle) 0%, var(--primary-faint) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  color: var(--primary);
`;

const Title = styled.h2`
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 0.75rem;
  line-height: 1.2;
  text-align: center;
`;

const Description = styled.p`
  color: var(--text);
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 1.5rem;
  text-align: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const PrimaryButton = styled.button`
  background: linear-gradient(135deg, var(--brand-surface) 0%, var(--brand-surface-hover) 100%);
  color: var(--text-inverse);
  border: none;
  padding: 0.875rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  transition: opacity 0.15s ease;

  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: var(--text-muted);
  border: none;
  padding: 0.625rem;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;

  &:hover { color: var(--text); background: var(--surface-2); }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: none;
  border: none;
  color: var(--text-subtle);
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover { background: var(--surface-3); color: var(--text); }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  text-align: left;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const Label = styled.label`
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const Input = styled.input`
  padding: 0.625rem 0.875rem;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  font-size: 0.9375rem;
  width: 100%;
  transition: border-color 0.15s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.08);
  }
`;

const Select = styled.select`
  padding: 0.625rem 0.875rem;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  font-size: 0.9375rem;
  background: var(--surface);
  cursor: pointer;
  width: 100%;
  transition: border-color 0.15s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.08);
  }
`;

const TextArea = styled.textarea`
  padding: 0.625rem 0.875rem;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  font-size: 0.9375rem;
  resize: vertical;
  min-height: 70px;
  width: 100%;
  font-family: inherit;
  transition: border-color 0.15s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.08);
  }
`;

const HelperText = styled.span`
  font-size: 0.75rem;
  color: var(--text-subtle);
`;

const SectionLabel = styled.p`
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0 0 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const RacketSearchWrapper = styled.div`
  input {
    padding: 0.625rem 0.875rem !important;
    border-radius: 10px !important;
    border: 1.5px solid var(--border) !important;
    font-size: 0.9375rem !important;
  }
`;

const OnboardingPromptModal: React.FC<OnboardingPromptModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'prompt' | 'form'>('prompt');
  const [loading, setLoading] = useState(false);
  const { refreshUserProfile } = useAuth();
  const [currentRacket, setCurrentRacket] = useState<RacketSearchResult | null>(null);
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    birthdate: '',
    game_level: '',
    limitations: '',
    gender: '',
    physical_condition: '',
    position: '',
    frequency: '',
    touch_preference: '',
    balance_preference: '',
    shape_preference: '',
    weight_preference: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const current_racket = currentRacket
        ? `${currentRacket.marca} ${currentRacket.name}`.trim()
        : undefined;

      await UserProfileService.updateUserProfile({
        current_racket,
        weight: formData.weight ? Number(formData.weight) : undefined,
        height: formData.height ? Number(formData.height) : undefined,
        birthdate: formData.birthdate || undefined,
        game_level: formData.game_level || undefined,
        limitations: formData.limitations ? [formData.limitations] : undefined,
        gender: (formData.gender as any) || undefined,
        physical_condition: (formData.physical_condition as any) || undefined,
        position: (formData.position as any) || undefined,
        frequency: (formData.frequency as any) || undefined,
        touch_preference: (formData.touch_preference as any) || undefined,
        balance_preference: (formData.balance_preference as any) || undefined,
        shape_preference: (formData.shape_preference as any) || undefined,
        weight_preference: (formData.weight_preference as any) || undefined,
      });

      await refreshUserProfile();
      sileo.success({ title: 'Éxito', description: '¡Perfil completado!' });
      onClose();
    } catch (error) {
      sileo.error({ title: 'Error', description: 'Error al guardar. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Modal
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <CloseButton onClick={onClose}>
              <FiX size={20} />
            </CloseButton>

            {step === 'prompt' ? (
              <>
                <IconContainer>
                  <FiUserCheck size={36} />
                </IconContainer>

                <Title>¡Bienvenido a Smashly!</Title>

                <Description>
                  Completa tu perfil deportivo para recibir recomendaciones personalizadas de palas.
                  Solo te tomará un minuto.
                </Description>

                <ButtonGroup>
                  <PrimaryButton onClick={() => setStep('form')}>
                    Completar mi perfil ahora
                    <FiArrowRight />
                  </PrimaryButton>
                  <SecondaryButton onClick={onClose}>Quizás más tarde</SecondaryButton>
                </ButtonGroup>
              </>
            ) : (
              <Form onSubmit={handleSubmit}>
                <Title style={{ textAlign: 'left', fontSize: '1.375rem' }}>Completa tu Perfil</Title>

                {/* Físico */}
                <div>
                  <SectionLabel>Datos físicos</SectionLabel>
                  <FormGrid>
                    <FormGroup>
                      <Label htmlFor='weight'><FiActivity size={13} /> Peso (kg)</Label>
                      <Input id='weight' name='weight' type='number' placeholder='Ej: 75' value={formData.weight} onChange={handleChange} min='20' max='200' step='0.1' />
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor='height'><FiActivity size={13} /> Altura (cm)</Label>
                      <Input id='height' name='height' type='number' placeholder='Ej: 180' value={formData.height} onChange={handleChange} min='100' max='250' />
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor='birthdate'><FiCalendar size={13} /> Fecha de nacimiento</Label>
                      <Input id='birthdate' name='birthdate' type='date' value={formData.birthdate} onChange={handleChange} />
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor='gender'>Género</Label>
                      <Select id='gender' name='gender' value={formData.gender} onChange={handleChange}>
                        <option value=''>Selecciona</option>
                        <option value='masculino'>Masculino</option>
                        <option value='femenino'>Femenino</option>
                      </Select>
                    </FormGroup>
                  </FormGrid>
                </div>

                {/* Juego */}
                <div>
                  <SectionLabel>Tu juego</SectionLabel>
                  <FormGrid>
                    <FormGroup>
                      <Label htmlFor='game_level'><FiTrendingUp size={13} /> Nivel</Label>
                      <Select id='game_level' name='game_level' value={formData.game_level} onChange={handleChange}>
                        <option value=''>Selecciona</option>
                        <option value='Principiante'>Principiante (1.0–2.5)</option>
                        <option value='Intermedio'>Intermedio (3.0–4.5)</option>
                        <option value='Avanzado'>Avanzado (5.0–6.5)</option>
                        <option value='Profesional'>Profesional (7.0+)</option>
                      </Select>
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor='position'>Posición en pista</Label>
                      <Select id='position' name='position' value={formData.position} onChange={handleChange}>
                        <option value=''>Selecciona</option>
                        <option value='reves'>Revés</option>
                        <option value='drive'>Drive</option>
                        <option value='ambos'>Indiferente</option>
                      </Select>
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor='frequency'>Frecuencia de juego</Label>
                      <Select id='frequency' name='frequency' value={formData.frequency} onChange={handleChange}>
                        <option value=''>Selecciona</option>
                        <option value='1'>1 vez/semana o menos</option>
                        <option value='2-3'>2–3 veces/semana</option>
                        <option value='4+'>4+ veces/semana</option>
                      </Select>
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor='physical_condition'>Condición física</Label>
                      <Select id='physical_condition' name='physical_condition' value={formData.physical_condition} onChange={handleChange}>
                        <option value=''>Selecciona</option>
                        <option value='asiduo'>Asiduo al deporte</option>
                        <option value='ocasional'>Ocasional</option>
                      </Select>
                    </FormGroup>
                  </FormGrid>
                </div>

                {/* Preferencias de pala */}
                <div>
                  <SectionLabel>Preferencias de pala</SectionLabel>
                  <FormGrid>
                    <FormGroup>
                      <Label htmlFor='touch_preference'>Tacto</Label>
                      <Select id='touch_preference' name='touch_preference' value={formData.touch_preference} onChange={handleChange}>
                        <option value=''>No sé</option>
                        <option value='duro'>Duro</option>
                        <option value='medio'>Medio</option>
                        <option value='blando'>Blando</option>
                      </Select>
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor='weight_preference'>Peso de pala</Label>
                      <Select id='weight_preference' name='weight_preference' value={formData.weight_preference} onChange={handleChange}>
                        <option value=''>No sé</option>
                        <option value='ligera'>Ligera (&lt;360g)</option>
                        <option value='media'>Media (360–375g)</option>
                        <option value='pesada'>Pesada (&gt;375g)</option>
                      </Select>
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor='balance_preference'>Balance</Label>
                      <Select id='balance_preference' name='balance_preference' value={formData.balance_preference} onChange={handleChange}>
                        <option value=''>No sé</option>
                        <option value='bajo'>Bajo (manejable)</option>
                        <option value='medio'>Medio (equilibrado)</option>
                        <option value='alto'>Alto (potencia)</option>
                      </Select>
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor='shape_preference'>Forma</Label>
                      <Select id='shape_preference' name='shape_preference' value={formData.shape_preference} onChange={handleChange}>
                        <option value=''>No sé</option>
                        <option value='redonda'>Redonda</option>
                        <option value='lagrima'>Lágrima</option>
                        <option value='diamante'>Diamante</option>
                      </Select>
                    </FormGroup>
                  </FormGrid>
                </div>

                {/* Pala actual + lesiones */}
                <div>
                  <SectionLabel>Tu equipamiento</SectionLabel>
                  <FormGroup style={{ marginBottom: '1rem' }}>
                    <Label><GiTennisRacket size={14} /> Pala actual</Label>
                    <RacketSearchWrapper>
                      <RacketSearchInput
                        value={currentRacket}
                        onChange={setCurrentRacket}
                      />
                    </RacketSearchWrapper>
                    <HelperText>Búscala por nombre o marca</HelperText>
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor='limitations'><FiAlertCircle size={13} /> Limitaciones o lesiones</Label>
                    <TextArea
                      id='limitations'
                      name='limitations'
                      placeholder='Ej: Codo, rodilla, espalda...'
                      value={formData.limitations}
                      onChange={handleChange}
                    />
                    <HelperText>Opcional</HelperText>
                  </FormGroup>
                </div>

                <ButtonGroup style={{ marginTop: '0.5rem' }}>
                  <PrimaryButton type='submit' disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar y Continuar'}
                    {!loading && <FiCheck />}
                  </PrimaryButton>
                  <SecondaryButton type='button' onClick={onClose}>
                    Omitir por ahora
                  </SecondaryButton>
                </ButtonGroup>
              </Form>
            )}
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default OnboardingPromptModal;

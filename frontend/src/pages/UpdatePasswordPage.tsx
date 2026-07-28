import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiLoader, FiShield } from 'react-icons/fi';
import { useNavigate } from '@tanstack/react-router';
import { sileo } from 'sileo';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { passwordChecklist } from '../schemas/auth';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%);
`;

const Card = styled(motion.div)`
  background: var(--surface);
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow:
    0 10px 25px -5px var(--shadow-color),
    0 8px 10px -6px var(--shadow-color);
  width: 100%;
  max-width: 450px;
  border: 1px solid var(--surface-3);
`;

const HeaderIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--primary-faint);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 0.75rem;
`;

const Description = styled.p`
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

const InputWrapper = styled.div<{ $hasError?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: 1rem;
    color: ${props => (props.$hasError ? 'var(--error)' : 'var(--text-subtle)')};
    transition: color 0.2s ease;
  }
`;

const Input = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border-radius: 12px;
  border: 1.5px solid ${props => (props.$hasError ? '#fca5a5' : 'var(--border)')};
  background: ${props => (props.$hasError ? 'var(--danger-subtle)' : 'var(--surface)')};
  font-size: 1rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  color: var(--text);

  &:focus {
    outline: none;
    border-color: ${props => (props.$hasError ? 'var(--error)' : 'var(--primary)')};
    box-shadow: 0 0 0 4px
      ${props => (props.$hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(22, 163, 74, 0.1)')};
  }

  &::placeholder {
    color: var(--text-subtle);
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: var(--text-subtle);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    color: var(--text-muted);
  }
`;

const SubmitButton = styled.button`
  background: var(--brand-surface);
  color: var(--brand-on-surface);
  padding: 0.875rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    background: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.span`
  font-size: 0.75rem;
  color: var(--error);
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const PasswordStrength = styled.div<{ $strength: number }>`
  height: 4px;
  width: 100%;
  background: var(--border);
  border-radius: 2px;
  margin-top: 0.5rem;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => (props.$strength / 4) * 100}%;
    background: ${props => {
      if (props.$strength <= 1) return 'var(--error)';
      if (props.$strength <= 2) return 'var(--accent)';
      if (props.$strength <= 3) return 'var(--info)';
      return 'var(--primary)';
    }};
    transition: all 0.3s ease;
  }
`;

const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { isPasswordRecovery, loading: authLoading } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // AuthContext's onAuthStateChange listener is subscribed at app boot
    // (long before this lazy-loaded route mounts) and sets
    // isPasswordRecovery when it catches the PASSWORD_RECOVERY event fired
    // by supabase-js after it parses the recovery link's URL fragment. By
    // the time this effect runs, that parsing has normally already
    // happened — give it one tick past the initial auth-loading phase
    // before deciding the link is invalid.
    if (!authLoading && !isPasswordRecovery) {
      setError('El enlace de recuperación es inválido o ha expirado.');
    }
  }, [authLoading, isPasswordRecovery]);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 6) score++;
    if (pass.length > 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Z0-9]/i.test(pass)) score++;
    return score;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordRecovery) {
      setError('El enlace de recuperación es inválido o ha expirado.');
      return;
    }

    if (!Object.values(passwordChecklist(newPassword)).every(Boolean)) {
      setError(
        'La contraseña no cumple los requisitos de seguridad (8+ caracteres, mayúscula, minúscula, número y símbolo).'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        throw new Error(updateError.message || 'Error al actualizar la contraseña');
      }

      sileo.success({
        title: '¡Contraseña actualizada!',
        description: 'Tu contraseña se ha cambiado correctamente. Ya puedes iniciar sesión.',
      });

      navigate({ to: '/' });
    } catch (err: any) {
      setError(err.message);
      sileo.error({
        title: 'Error',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <Card
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <HeaderIcon>
          <FiShield />
        </HeaderIcon>

        <Title>Nueva Contraseña</Title>
        <Description>
          Introduce tu nueva contraseña a continuación. Asegúrate de que sea segura y difícil de
          adivinar.
        </Description>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor='new-password'>Nueva Contraseña</Label>
            <InputWrapper $hasError={!!error && error.includes('contraseña')}>
              <FiLock />
              <Input
                id='new-password'
                type={showPassword ? 'text' : 'password'}
                placeholder='8+ caracteres, mayúscula, número y símbolo'
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                $hasError={!!error && error.includes('contraseña')}
                disabled={loading || !isPasswordRecovery}
              />
              <PasswordToggle type='button' onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </PasswordToggle>
            </InputWrapper>
            <PasswordStrength $strength={calculateStrength(newPassword)} />
          </FormGroup>

          <FormGroup>
            <Label htmlFor='confirm-password'>Confirmar Contraseña</Label>
            <InputWrapper $hasError={!!error && error.includes('coinciden')}>
              <FiLock />
              <Input
                id='confirm-password'
                type={showPassword ? 'text' : 'password'}
                placeholder='Repite tu contraseña'
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                $hasError={!!error && error.includes('coinciden')}
                disabled={loading || !isPasswordRecovery}
              />
            </InputWrapper>
            {error && (
              <ErrorText>
                <FiAlertCircle size={12} /> {error}
              </ErrorText>
            )}
          </FormGroup>

          <SubmitButton type='submit' disabled={loading || !isPasswordRecovery}>
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <FiLoader />
                </motion.div>
                Actualizando...
              </>
            ) : (
              'Cambiar contraseña'
            )}
          </SubmitButton>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default UpdatePasswordPage;

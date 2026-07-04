import React, { useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { z } from 'zod';
import { sileo } from 'sileo';
import { FiLock, FiMail } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext.tsx';
import styled from 'styled-components';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  Form,
  Divider,
  SocialButtons,
  SocialButton,
  FooterText,
  SubmitButton,
  ForgotPasswordLink,
} from './AuthStyles';
import { emailValidator } from '../../schemas/auth';
import TextField from '../form/TextField';

const TermsLink = styled(Link)`
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
`;

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onRegisterClick }) => {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as Record<string, string>;
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectTo = searchParams['redirect'] || '/';

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      const { error, errorCode } = await signIn(value.email, value.password);
      if (error) {
        if (errorCode === 'USER_NOT_FOUND') {
          sileo.warning({ title: 'Cuenta no encontrada', description: error });
        } else if (errorCode === 'INVALID_PASSWORD') {
          sileo.error({ title: 'Error', description: error });
        } else {
          sileo.error({ title: 'Error', description: error });
        }
        return;
      }
      sileo.success({ title: 'Éxito', description: '¡Bienvenido de nuevo!' });
      if (onSuccess) onSuccess();
      else navigate({ to: redirectTo as any });
    },
  });

  const isSubmitting = useStore(form.store, s => s.isSubmitting);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        sileo.error({ title: 'Error', description: error });
      }
    } catch (err: any) {
      sileo.error({ title: 'Error', description: err?.message || 'Error inesperado con Google' });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Form
        onSubmit={e => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name='email' validators={{ onSubmit: emailValidator }}>
          {field => (
            <TextField
              label='Correo Electrónico'
              id='email'
              name='email'
              type='email'
              placeholder='padel@ejemplo.com'
              value={field.state.value}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
              icon={<FiMail />}
              autoComplete='email'
            />
          )}
        </form.Field>

        <form.Field name='password' validators={{ onSubmit: z.string().min(1, 'Requerido') }}>
          {field => (
            <TextField
              label='Contraseña'
              id='password'
              name='password'
              value={field.state.value}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
              icon={<FiLock />}
              showPasswordToggle
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(p => !p)}
              autoComplete='current-password'
              labelSuffix={
                <ForgotPasswordLink to='/forgot-password' onClick={onSuccess}>
                  ¿Has olvidado tu contraseña?
                </ForgotPasswordLink>
              }
            />
          )}
        </form.Field>

        <SubmitButton type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
        </SubmitButton>

        <div
          style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}
        >
          ¿No tienes cuenta?{' '}
          <button
            type='button'
            onClick={onRegisterClick}
            style={{
              color: 'var(--primary)',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Regístrate
          </button>
        </div>
      </Form>

      <Divider>O continúa con</Divider>

      <SocialButtons>
        <SocialButton type='button' onClick={handleGoogleSignIn} disabled={googleLoading}>
          <FcGoogle />
          {googleLoading ? 'Conectando...' : 'Google'}
        </SocialButton>
      </SocialButtons>

      <FooterText>
        Al continuar, aceptas nuestros{' '}
        <TermsLink to='/terms-and-conditions'>Términos de Servicio</TermsLink> y{' '}
        <TermsLink to='/privacy-policy'>Política de Privacidad</TermsLink>.
      </FooterText>
    </>
  );
};

export default LoginForm;

import React, { useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { sileo } from 'sileo';
import {
  FiFileText,
  FiGlobe,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShoppingBag,
  FiUser,
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext.tsx';
import storeService from '../../services/storeService';
import OnboardingPromptModal from '../features/OnboardingPromptModal';
import StoreRequestModal from '../features/StoreRequestModal';
import {
  Form,
  SubmitButton,
  Divider,
  SocialButtons,
  SocialButton,
} from './AuthStyles';
import { emailValidator, requiredStringValidator, passwordChecklist } from '../../schemas/auth';
import TextField from '../form/TextField';
import CheckboxField from '../form/CheckboxField';

// ─── Local styled components ─────────────────────────────────────────────────

const RegistrationTypeSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TypeCard = styled.button<{ $isSelected: boolean }>`
  flex: 1;
  padding: 1rem;
  border: 2px solid ${props => (props.$isSelected ? 'var(--accent)' : 'var(--border)')};
  border-radius: 12px;
  background: ${props => (props.$isSelected ? 'var(--surface-2)' : 'var(--surface)')};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  outline: none;

  &:hover {
    border-color: var(--accent);
    background: var(--surface-2);
  }
`;

const TypeIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
`;

const TypeTitle = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
`;

const PasswordRequirements = styled.div`
  background: var(--surface-2);
  padding: 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  border-left: 4px solid var(--accent);
`;

const RequirementsList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  color: var(--text-muted);
  font-size: 0.875rem;
`;

const RequirementItem = styled.li<{ $met: boolean }>`
  color: ${props => (props.$met ? 'var(--primary)' : 'var(--text-muted)')};
  margin: 0.25rem 0;
`;

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

// ─── Types ───────────────────────────────────────────────────────────────────

type RegistrationType = 'player' | 'store';

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onLoginClick }) => {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as Record<string, string>;
  const { signUp, signInWithGoogle } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectTo = searchParams['redirect'] || '/';

  const form = useForm({
    defaultValues: {
      registrationType: 'player' as RegistrationType,
      fullName: '',
      nickname: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
      // Store-specific
      storeName: '',
      legalName: '',
      cifNif: '',
      contactEmail: '',
      phoneNumber: '',
      websiteUrl: '',
      logoUrl: '',
      shortDescription: '',
      location: '',
    },
    onSubmit: async ({ value }) => {
      const { error, token } = await signUp(
        value.email.trim(),
        value.password,
        value.nickname.trim(),
        value.fullName.trim() || undefined,
        value.registrationType === 'store' ? 'store_owner' : 'player'
      );

      if (error) {
        sileo.error({ title: 'Error', description: error || 'Error al crear la cuenta' });
        return;
      }

      if (value.registrationType === 'store') {
        try {
          await storeService.createStoreRequest(
            {
              store_name: value.storeName!,
              legal_name: value.legalName!,
              cif_nif: value.cifNif!,
              contact_email: value.contactEmail!,
              phone_number: value.phoneNumber!,
              website_url: value.websiteUrl || undefined,
              logo_url: value.logoUrl || undefined,
              short_description: value.shortDescription || undefined,
              location: value.location!,
            },
            token!
          );
          setShowStoreModal(true);
        } catch (storeError: any) {
          sileo.error({
            title: 'Error',
            description: `Cuenta creada pero el registro de tienda falló: ${storeError.message}`,
          });
          setTimeout(() => {
            if (onSuccess) onSuccess();
            else navigate({ to: '/login' });
          }, 3000);
        }
      } else {
        sileo.success({
          title: 'Éxito',
          description: '¡Cuenta creada! Revisa tu correo.',
        });
        setShowOnboardingModal(true);
      }
    },
  });

  // Reactive form state
  const isSubmitting = useStore(form.store, s => s.isSubmitting);
  const registrationType = useStore(form.store, s => s.values.registrationType);
  const passwordValue = useStore(form.store, s => s.values.password);

  const pwdChecklist = passwordChecklist(passwordValue);
  const isPasswordValid = Object.values(pwdChecklist).every(Boolean);

  const handleModalClose = () => {
    setShowStoreModal(false);
    if (onSuccess) onSuccess();
    else navigate({ to: redirectTo as any });
  };

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

  const handleOnboardingClose = () => {
    setShowOnboardingModal(false);
    if (onSuccess) onSuccess();
    else navigate({ to: '/' });
  };

  return (
    <>
      <OnboardingPromptModal isOpen={showOnboardingModal} onClose={handleOnboardingClose} />

      <Form
        onSubmit={e => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        {/* Registration type selector */}
        <RegistrationTypeSelector>
          <TypeCard
            type='button'
            $isSelected={registrationType === 'player'}
            onClick={() => form.setFieldValue('registrationType', 'player')}
          >
            <TypeIcon>👤</TypeIcon>
            <TypeTitle>Jugador</TypeTitle>
          </TypeCard>
          <TypeCard
            type='button'
            $isSelected={registrationType === 'store'}
            onClick={() => form.setFieldValue('registrationType', 'store')}
          >
            <TypeIcon>🏪</TypeIcon>
            <TypeTitle>Tienda</TypeTitle>
          </TypeCard>
        </RegistrationTypeSelector>

        {/* Common fields */}
        <form.Field name='fullName' validators={{ onSubmit: requiredStringValidator }}>
          {field => (
            <TextField
              label='Nombre Completo'
              id='fullName'
              name='fullName'
              type='text'
              placeholder='Tu nombre'
              value={field.state.value}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
              icon={<FiUser />}
            />
          )}
        </form.Field>

        <form.Field name='nickname' validators={{ onSubmit: requiredStringValidator }}>
          {field => (
            <TextField
              label='Apodo'
              id='nickname'
              name='nickname'
              type='text'
              placeholder='Tu apodo'
              value={field.state.value}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
              icon={<FiUser />}
            />
          )}
        </form.Field>

        <form.Field name='email' validators={{ onSubmit: emailValidator }}>
          {field => (
            <TextField
              label='Correo Electrónico'
              id='email'
              name='email'
              type='email'
              placeholder='tu@email.com'
              value={field.state.value}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
              icon={<FiMail />}
              autoComplete='email'
            />
          )}
        </form.Field>

        <form.Field
          name='password'
          validators={{
            onSubmit: ({ value }) => {
              if (!value) return 'Requerido';
              const checks = passwordChecklist(value);
              if (!checks.length) return 'Al menos 8 caracteres';
              if (!checks.uppercase) return 'Necesita una letra mayúscula';
              if (!checks.lowercase) return 'Necesita una letra minúscula';
              if (!checks.number) return 'Necesita un número';
              if (!checks.special) return 'Necesita un carácter especial';
              return undefined;
            },
          }}
        >
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
              autoComplete='new-password'
            />
          )}
        </form.Field>

        {/* Live password requirements indicator */}
        {passwordValue && !isPasswordValid && (
          <PasswordRequirements>
            <RequirementsList>
              <RequirementItem $met={pwdChecklist.length}>Al menos 8 caracteres</RequirementItem>
              <RequirementItem $met={pwdChecklist.uppercase}>Una letra mayúscula</RequirementItem>
              <RequirementItem $met={pwdChecklist.lowercase}>Una letra minúscula</RequirementItem>
              <RequirementItem $met={pwdChecklist.number}>Un número</RequirementItem>
              <RequirementItem $met={pwdChecklist.special}>Un carácter especial</RequirementItem>
            </RequirementsList>
          </PasswordRequirements>
        )}

        <form.Field
          name='confirmPassword'
          validators={{
            onSubmit: ({ value, fieldApi }) => {
              if (!value) return 'Requerido';
              const pwd = fieldApi.form.getFieldValue('password');
              if (value !== pwd) return 'Las contraseñas no coinciden';
              return undefined;
            },
          }}
        >
          {field => (
            <TextField
              label='Confirmar Contraseña'
              id='confirmPassword'
              name='confirmPassword'
              value={field.state.value}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
              icon={<FiLock />}
              showPasswordToggle
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(p => !p)}
              autoComplete='new-password'
            />
          )}
        </form.Field>

        {/* Store-specific fields */}
        {registrationType === 'store' && (
          <>
            <form.Field
              name='storeName'
              validators={{
                onSubmit: ({ value, fieldApi }) => {
                  const regType = fieldApi.form.getFieldValue('registrationType');
                  if (regType === 'store' && !value?.trim()) return 'Requerido';
                  return undefined;
                },
              }}
            >
              {field => (
                <TextField
                  label='Nombre Tienda'
                  id='storeName'
                  name='storeName'
                  value={field.state.value ?? ''}
                  onChange={field.handleChange}
                  errors={field.state.meta.errors}
                  icon={<FiShoppingBag />}
                />
              )}
            </form.Field>

            <form.Field
              name='cifNif'
              validators={{
                onSubmit: ({ value, fieldApi }) => {
                  const regType = fieldApi.form.getFieldValue('registrationType');
                  if (regType === 'store' && !value?.trim()) return 'Requerido';
                  return undefined;
                },
              }}
            >
              {field => (
                <TextField
                  label='CIF/NIF'
                  id='cifNif'
                  name='cifNif'
                  value={field.state.value ?? ''}
                  onChange={field.handleChange}
                  errors={field.state.meta.errors}
                  icon={<FiFileText />}
                />
              )}
            </form.Field>

            <form.Field
              name='legalName'
              validators={{
                onSubmit: ({ value, fieldApi }) => {
                  const regType = fieldApi.form.getFieldValue('registrationType');
                  if (regType === 'store' && !value?.trim()) return 'Requerido';
                  return undefined;
                },
              }}
            >
              {field => (
                <TextField
                  label='Razón Social'
                  id='legalName'
                  name='legalName'
                  value={field.state.value ?? ''}
                  onChange={field.handleChange}
                  errors={field.state.meta.errors}
                  icon={<FiFileText />}
                />
              )}
            </form.Field>

            <form.Field
              name='contactEmail'
              validators={{
                onSubmit: ({ value, fieldApi }) => {
                  const regType = fieldApi.form.getFieldValue('registrationType');
                  if (regType !== 'store') return undefined;
                  if (!value?.trim()) return 'Requerido';
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
                  return undefined;
                },
              }}
            >
              {field => (
                <TextField
                  label='Email Contacto'
                  id='contactEmail'
                  name='contactEmail'
                  type='email'
                  value={field.state.value ?? ''}
                  onChange={field.handleChange}
                  errors={field.state.meta.errors}
                  icon={<FiMail />}
                />
              )}
            </form.Field>

            <form.Field
              name='phoneNumber'
              validators={{
                onSubmit: ({ value, fieldApi }) => {
                  const regType = fieldApi.form.getFieldValue('registrationType');
                  if (regType === 'store' && !value?.trim()) return 'Requerido';
                  return undefined;
                },
              }}
            >
              {field => (
                <TextField
                  label='Teléfono'
                  id='phoneNumber'
                  name='phoneNumber'
                  value={field.state.value ?? ''}
                  onChange={field.handleChange}
                  errors={field.state.meta.errors}
                  icon={<FiPhone />}
                />
              )}
            </form.Field>

            <form.Field
              name='location'
              validators={{
                onSubmit: ({ value, fieldApi }) => {
                  const regType = fieldApi.form.getFieldValue('registrationType');
                  if (regType === 'store' && !value?.trim()) return 'Requerido';
                  return undefined;
                },
              }}
            >
              {field => (
                <TextField
                  label='Ubicación'
                  id='location'
                  name='location'
                  value={field.state.value ?? ''}
                  onChange={field.handleChange}
                  errors={field.state.meta.errors}
                  icon={<FiMapPin />}
                />
              )}
            </form.Field>

            <form.Field name='websiteUrl'>
              {field => (
                <TextField
                  label='Sitio Web'
                  id='websiteUrl'
                  name='websiteUrl'
                  value={field.state.value ?? ''}
                  onChange={field.handleChange}
                  errors={field.state.meta.errors}
                  icon={<FiGlobe />}
                />
              )}
            </form.Field>
          </>
        )}

        {/* Terms & conditions */}
        <form.Field
          name='acceptedTerms'
          validators={{
            onSubmit: ({ value }) =>
              !value ? 'Debes aceptar los términos y condiciones para continuar' : undefined,
          }}
        >
          {field => (
            <CheckboxField
              label={
                <span>
                  Acepto los{' '}
                  <TermsLink to='/terms-and-conditions' target='_blank'>
                    Términos de Servicio
                  </TermsLink>{' '}
                  y la{' '}
                  <TermsLink to='/privacy-policy' target='_blank'>
                    Política de Privacidad
                  </TermsLink>
                </span>
              }
              checked={field.state.value}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <SubmitButton type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
        </SubmitButton>

        <div
          style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}
        >
          ¿Ya tienes cuenta?{' '}
          <button
            type='button'
            onClick={onLoginClick}
            style={{
              color: 'var(--primary)',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Inicia sesión
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

      {registrationType === 'store' && (
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '-0.5rem',
          }}
        >
          Al registrarte con Google serás registrado como Jugador
        </p>
      )}

      <StoreRequestModal
        isOpen={showStoreModal}
        onClose={handleModalClose}
        onContinue={handleModalClose}
        storeName={form.getFieldValue('storeName') || 'tu tienda'}
      />
    </>
  );
};

export default RegisterForm;

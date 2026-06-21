import React from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import {
  FormGroup,
  Label,
  InputWrapper,
  IconWrapper,
  Input,
  PasswordToggle,
  ErrorText,
} from '../auth/AuthStyles';

// Extracts a human-readable string from a TanStack Form error entry, which can
// be a plain string, a StandardSchemaV1Issue ({ message: string, path? }), or
// a falsy value produced by field-less validators.
function extractMessage(err: unknown): string | null {
  if (!err) return null;
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

interface TextFieldProps {
  label: React.ReactNode;
  id?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  /** TanStack Form errors — may contain strings, StandardSchemaV1Issue objects, or falsy values */
  errors?: unknown[];
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  /** Optional slot rendered next to the label (e.g. ForgotPasswordLink in LoginForm) */
  labelSuffix?: React.ReactNode;
  disabled?: boolean;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  autoComplete,
  value,
  onChange,
  errors,
  icon,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
  labelSuffix,
  disabled,
}) => {
  const errorMessages = errors?.map(extractMessage).filter((m): m is string => m !== null) ?? [];
  const hasError = errorMessages.length > 0;
  const resolvedType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <FormGroup>
      {labelSuffix ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label htmlFor={id}>{label}</Label>
          {labelSuffix}
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
      <InputWrapper>
        {icon && <IconWrapper>{icon}</IconWrapper>}
        <Input
          id={id}
          name={name}
          type={resolvedType}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          $hasError={hasError}
          autoComplete={autoComplete}
          disabled={disabled}
          style={!icon ? { paddingLeft: '16px' } : undefined}
        />
        {showPasswordToggle && (
          <PasswordToggle type='button' onClick={onTogglePassword} aria-label='Mostrar contraseña'>
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </PasswordToggle>
        )}
      </InputWrapper>
      {hasError && <ErrorText>{errorMessages[0]}</ErrorText>}
    </FormGroup>
  );
};

export default TextField;

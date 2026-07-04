import React from 'react';
import { FormGroup, ErrorText } from '../auth/AuthStyles';

function extractMessage(err: unknown): string | null {
  if (!err) return null;
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

interface CheckboxFieldProps {
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** TanStack Form errors — may contain strings, StandardSchemaV1Issue objects, or falsy values */
  errors?: unknown[];
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({ label, checked, onChange, errors }) => {
  const errorMessages = errors?.map(extractMessage).filter((m): m is string => m !== null) ?? [];

  return (
    <FormGroup>
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.625rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          color: '#374151',
        }}
      >
        <input
          type='checkbox'
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={{
            marginTop: '0.125rem',
            accentColor: '#16a34a',
            width: '1rem',
            height: '1rem',
            flexShrink: 0,
          }}
        />
        <span>{label}</span>
      </label>
      {errorMessages.length > 0 && <ErrorText>{errorMessages[0]}</ErrorText>}
    </FormGroup>
  );
};

export default CheckboxField;

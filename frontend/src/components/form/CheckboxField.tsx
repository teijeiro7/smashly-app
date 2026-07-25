import React, { useEffect, useState } from 'react';
import { FormGroup, ErrorText } from '../auth/AuthStyles';

function extractMessage(err: unknown): string | null {
  if (!err) return null;
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [breakpoint]);

  return isMobile;
}

interface CheckboxFieldProps {
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** TanStack Form errors — may contain strings, StandardSchemaV1Issue objects, or falsy values */
  errors?: unknown[];
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({ label, checked, onChange, errors }) => {
  const isMobile = useIsMobile();
  const errorMessages = errors?.map(extractMessage).filter((m): m is string => m !== null) ?? [];

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: isMobile ? '0.5rem' : '0.625rem',
    cursor: 'pointer',
    fontSize: isMobile ? '0.8125rem' : '0.875rem',
    color: '#374151',
  };

  const checkboxStyle: React.CSSProperties = {
    marginTop: '0.125rem',
    accentColor: '#16a34a',
    width: isMobile ? '0.875rem' : '1rem',
    height: isMobile ? '0.875rem' : '1rem',
    flexShrink: 0,
  };

  return (
    <FormGroup>
      <label style={labelStyle}>
        <input
          type='checkbox'
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={checkboxStyle}
        />
        <span>{label}</span>
      </label>
      {errorMessages.length > 0 && <ErrorText>{errorMessages[0]}</ErrorText>}
    </FormGroup>
  );
};

export default CheckboxField;

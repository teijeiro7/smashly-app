import { z } from 'zod';

// Password strength checklist — used for the visual indicator in RegisterForm
export function passwordChecklist(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
}

// Reusable zod field validators (validate a single string value)
export const emailValidator = z
  .string()
  .min(1, 'Requerido')
  .email('Email inválido');

export const requiredStringValidator = z.string().min(1, 'Requerido');

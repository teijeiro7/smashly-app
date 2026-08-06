import React from 'react';
import styled, { css } from 'styled-components';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'tertiary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  $inverse?: boolean;
  as?: React.ElementType;
  to?: string;
  href?: string;
}

const sizeMap: Record<
  ButtonSize,
  { height: string; padding: string; fontSize: string; radius: string }
> = {
  sm: { height: '32px', padding: '0 0.75rem', fontSize: '0.875rem', radius: '8px' },
  md: { height: '44px', padding: '0 1rem', fontSize: '1rem', radius: '14px' },
  lg: { height: '56px', padding: '0 1.25rem', fontSize: '1.125rem', radius: '14px' },
};

const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $inverse?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  letter-spacing: -0.01em;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;

  height: ${props => sizeMap[props.$size].height};
  padding: ${props => sizeMap[props.$size].padding};
  font-size: ${props => sizeMap[props.$size].fontSize};
  border-radius: ${props => sizeMap[props.$size].radius};

  ${props =>
    props.$variant === 'primary' &&
    css`
      background: var(--brand-surface);
      color: var(--brand-on-surface);
      border: none;
      box-shadow: 0 4px 24px var(--shadow-color);

      &:hover {
        background: var(--brand-surface-hover);
        transform: translateY(-1px);
        box-shadow: 0 8px 32px var(--shadow-color);
      }
    `}

  ${props =>
    props.$variant === 'secondary' &&
    css`
      background: transparent;
      color: ${props.$inverse ? 'var(--on-brand)' : 'var(--text)'};
      border: 1.5px solid ${props.$inverse ? 'rgba(var(--on-brand-rgb), 0.25)' : 'var(--border)'};

      &:hover {
        background: ${props.$inverse ? 'rgba(var(--on-brand-rgb), 0.08)' : 'var(--surface-2)'};
        border-color: ${props.$inverse ? 'rgba(var(--on-brand-rgb), 0.4)' : 'var(--primary-hover)'};
        color: ${props.$inverse ? 'var(--on-brand)' : 'var(--primary-hover)'};
        transform: translateY(-1px);
      }
    `}

  ${props =>
    props.$variant === 'ghost' &&
    css`
      background: transparent;
      color: ${props.$inverse ? 'var(--on-brand)' : 'var(--text)'};
      border: none;

      &:hover {
        background: ${props.$inverse ? 'rgba(var(--on-brand-rgb), 0.08)' : 'var(--surface-2)'};
        color: ${props.$inverse ? 'var(--on-brand)' : 'var(--primary-hover)'};
        transform: translateY(-1px);
      }
    `}

  ${props =>
    props.$variant === 'tertiary' &&
    css`
      background: transparent;
      color: ${props.$inverse ? 'var(--on-brand)' : 'var(--primary-hover)'};
      border: none;
      padding: 0;
      height: auto;
      border-radius: 0;
      font-weight: 500;
      text-decoration: underline;

      &:hover {
        opacity: 0.8;
      }
    `}

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }
`;

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  $inverse,
  children,
  ...props
}) => {
  return (
    <StyledButton $variant={variant} $size={size} $inverse={$inverse} {...props}>
      {children}
    </StyledButton>
  );
};

export default Button;

import React, { useEffect, useRef, useState } from 'react';
import { FiMonitor, FiMoon, FiSun } from 'react-icons/fi';
import styled from 'styled-components';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  border: 1px solid var(--text);
  color: var(--text);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;

  &:hover {
    background: var(--primary-subtle);
    color: var(--primary);
    border-color: var(--primary);
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: 3px solid var(--primary);
    outline-offset: 2px;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 6px;
  z-index: 100;
`;

const MenuItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: ${p => (p.$active ? 'var(--surface-2)' : 'transparent')};
  color: ${p => (p.$active ? 'var(--primary)' : 'var(--text)')};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--surface-2);
  }

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const ICON_FOR_MODE: Record<ThemeMode, React.ReactNode> = {
  light: <FiSun aria-hidden />,
  dark: <FiMoon aria-hidden />,
  auto: <FiMonitor aria-hidden />,
};

const LABEL_FOR_MODE: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto (system)',
};

const ARIA_LABEL: Record<ThemeMode, string> = {
  light: 'Theme: light. Click to change.',
  dark: 'Theme: dark. Click to change.',
  auto: 'Theme: follows system. Click to change.',
};

/**
 * Compact theme toggle with a 3-state popover (light / dark / auto).
 * Renders a single button showing the icon of the current mode; click opens
 * the popover with explicit choices. Persists the choice in localStorage.
 */
const ThemeToggle: React.FC = () => {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <Wrapper ref={wrapperRef}>
      <Button
        type='button'
        aria-label={ARIA_LABEL[mode]}
        aria-haspopup='menu'
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
      >
        {ICON_FOR_MODE[mode]}
      </Button>
      {open && (
        <Menu role='menu'>
          {(['light', 'dark', 'auto'] as ThemeMode[]).map(m => (
            <MenuItem
              key={m}
              type='button'
              role='menuitemradio'
              aria-checked={mode === m}
              $active={mode === m}
              onClick={() => {
                setMode(m);
                setOpen(false);
              }}
            >
              {ICON_FOR_MODE[m]}
              {LABEL_FOR_MODE[m]}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Wrapper>
  );
};

export default ThemeToggle;

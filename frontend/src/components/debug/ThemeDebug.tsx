import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../contexts/ThemeContext';

const Panel = styled.div`
  position: fixed;
  bottom: 12px;
  left: 12px;
  z-index: 99999;
  background: #000;
  color: #fff;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.45;
  padding: 8px 10px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  white-space: pre;
  max-width: 60vw;
  overflow: hidden;
`;

const Row = styled.div<{ $ok?: boolean | null }>`
  color: ${p => (p.$ok === true ? '#4ade80' : p.$ok === false ? '#f87171' : '#fff')};
`;

/**
 * TEMPORARY debug overlay that visualizes the current theme state.
 * Renders only when VITE_DEBUG_THEME === 'true'. Remove once dark mode
 * is verified working.
 */
export const ThemeDebug: React.FC = () => {
  const { mode, resolved } = useTheme();
  const [domTheme, setDomTheme] = useState<string>('?');
  const [bgColor, setBgColor] = useState<string>('?');
  const [cssBg, setCssBg] = useState<string>('?');

  useEffect(() => {
    const tick = () => {
      const dt = document.documentElement.getAttribute('data-theme') ?? '(none)';
      const bc = getComputedStyle(document.body).backgroundColor;
      const bgVar = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      setDomTheme(dt);
      setBgColor(bc);
      setCssBg(bgVar);
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, []);

  // Only render when explicitly enabled via env
  if (import.meta.env.VITE_DEBUG_THEME !== 'true') return null;

  const isDark = domTheme === 'dark';

  return (
    <Panel>
      <Row>mode={mode} resolved={resolved}</Row>
      <Row $ok={domTheme === resolved}>html[data-theme]={domTheme}</Row>
      <Row $ok={isDark}>expected dark? {isDark ? 'YES' : 'no'}</Row>
      <Row>--bg = {cssBg || '(empty)'}</Row>
      <Row>body bg = {bgColor}</Row>
    </Panel>
  );
};

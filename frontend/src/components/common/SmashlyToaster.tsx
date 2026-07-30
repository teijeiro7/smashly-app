import React from 'react';
import { Toaster } from 'sileo';
import { useTheme } from '../../contexts/ThemeContext';

export const SmashlyToaster: React.FC = () => {
  const { resolved } = useTheme();
  const isDark = resolved === 'dark';

  return (
    <Toaster
      position='top-center'
      theme={isDark ? 'dark' : 'light'}
      options={{
        fill: isDark ? '#16221b' : '#ffffff',
        duration: 4000,
      }}
    />
  );
};

export default SmashlyToaster;

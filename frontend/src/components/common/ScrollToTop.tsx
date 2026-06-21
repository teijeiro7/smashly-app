import { useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';

export const ScrollToTop = () => {
  const { location } = useRouterState();
  const { pathname } = location;

  useEffect(() => {
    // Scroll to top when pathname changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // Use 'instant' for immediate scroll, 'smooth' for animated
    });
  }, [pathname]);

  return null;
};

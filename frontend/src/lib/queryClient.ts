import { QueryClient } from '@tanstack/react-query';

// Extracted from main.tsx so AuthContext can call queryClient.clear() on
// sign-out without a circular import (main.tsx -> AuthProvider -> AuthContext).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

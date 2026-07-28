import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { vi } from 'vitest';

const mockUser = { id: 'u1', email: 'user@test.com', user_metadata: { nickname: 'user' } };
const mockSession = {
  access_token: 'token123',
  refresh_token: 'refresh123',
  expires_at: 123456,
  user: mockUser,
};
const mockProfile = { id: 'u1', email: 'user@test.com', nickname: 'user', role: 'player' };

const mock = vi.hoisted(() => {
  const user = { id: 'u1', email: 'user@test.com', user_metadata: { nickname: 'user' } };
  const session = {
    access_token: 'token123',
    refresh_token: 'refresh123',
    expires_at: 123456,
    user,
  };
  const profile = { id: 'u1', email: 'user@test.com', nickname: 'user', role: 'player' };
  return {
    signInResult: { data: { user, session }, error: null },
    sessionResult: { data: { session } },
    signOutError: null as any,
    signOutScope: null as string | null,
    profileData: [profile] as any[],
    onAuthCallbacks: [] as Array<(event: string, session: any) => void>,
  };
});

function qb(data: any) {
  const c: any = new Proxy(
    { _d: data, _e: null },
    {
      get(t, p) {
        if (p === 'then')
          return (r: (v: any) => void) => r({ data: t._d, error: t._e, count: null });
        if (p === 'catch' || p === 'finally') return undefined;
        return () => c;
      },
    }
  );
  return c;
}

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(() => Promise.resolve(mock.signInResult)),
      signOut: vi.fn((options?: { scope?: string }) => {
        mock.signOutScope = options?.scope ?? null;
        return Promise.resolve({ error: mock.signOutError });
      }),
      getSession: vi.fn(() => Promise.resolve(mock.sessionResult)),
      onAuthStateChange: vi.fn((cb: any) => {
        mock.onAuthCallbacks.push(cb);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => qb(mock.profileData[0] ?? null)),
        })),
      })),
    })),
  },
}));

const AuthActionsProbe: React.FC = () => {
  const { signIn, signOut, isAuthenticated, userProfile } = useAuth();
  return (
    <div>
      <button data-testid='login' onClick={() => signIn('User@Test.com', 'secret')}>
        Login
      </button>
      <button data-testid='logout' onClick={() => signOut()}>
        Logout
      </button>
      <div data-testid='status'>{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid='nickname'>{userProfile?.nickname || ''}</div>
    </div>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  mock.onAuthCallbacks.length = 0;
  mock.signOutError = null;
  mock.signOutScope = null;
  mock.signInResult = { data: { user: mockUser, session: mockSession }, error: null };
  mock.profileData = [mockProfile];
  mock.sessionResult = { data: { session: mockSession } };
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('signIn stores token, loads profile and sets authenticated state', async () => {
  render(
    <AuthProvider>
      <AuthActionsProbe />
    </AuthProvider>
  );

  expect(screen.getByTestId('status').textContent).toBe('no');

  await act(async () => {
    await userEvent.click(screen.getByTestId('login'));
  });

  await waitFor(() => {
    expect(screen.getByTestId('status').textContent).toBe('yes');
    expect(screen.getByTestId('nickname').textContent).toBe('user');
  });
});

test('isAuthenticated stays true even when the profile row cannot be loaded', async () => {
  // Simulates an orphaned auth.users row with no user_profiles row (or an
  // RLS/network hiccup): a valid session exists but the profile fetch
  // resolves to null. isAuthenticated must track the session, not the
  // profile — otherwise a real session holder gets treated as logged out.
  mock.profileData = [];

  render(
    <AuthProvider>
      <AuthActionsProbe />
    </AuthProvider>
  );

  await act(async () => {
    await userEvent.click(screen.getByTestId('login'));
  });

  await waitFor(() => {
    expect(screen.getByTestId('status').textContent).toBe('yes');
    expect(screen.getByTestId('nickname').textContent).toBe('');
  });
});

test('signOut clears session and resets authenticated state', async () => {
  render(
    <AuthProvider>
      <AuthActionsProbe />
    </AuthProvider>
  );

  await act(async () => {
    await userEvent.click(screen.getByTestId('login'));
  });
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('yes'));

  await act(async () => {
    await userEvent.click(screen.getByTestId('logout'));
  });

  await waitFor(() => {
    expect(mock.signOutScope).toBe('local');
    expect(screen.getByTestId('status').textContent).toBe('no');
    expect(screen.getByTestId('nickname').textContent).toBe('');
  });
});

test('signIn returns friendly error on invalid credentials', async () => {
  mock.signInResult = {
    data: { user: null, session: null },
    error: { message: 'Invalid login credentials', code: 'INVALID_PASSWORD' },
  };
  mock.sessionResult = { data: { session: null } };

  const ProbeWithErrorCapture: React.FC = () => {
    const { signIn } = useAuth();
    const [error, setError] = React.useState<string | null>(null);
    return (
      <div>
        <button
          data-testid='login-invalid'
          onClick={async () => {
            const result = await signIn('bad@test.com', 'wrong');
            setError(result.error);
          }}
        >
          Login Invalid
        </button>
        <div data-testid='error'>{error || ''}</div>
      </div>
    );
  };

  render(
    <AuthProvider>
      <ProbeWithErrorCapture />
    </AuthProvider>
  );

  await act(async () => {
    await userEvent.click(screen.getByTestId('login-invalid'));
  });

  await waitFor(() => {
    expect(screen.getByTestId('error').textContent).toMatch('Credenciales inválidas');
  });
});

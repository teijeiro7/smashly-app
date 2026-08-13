import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
    signUpResult: { data: { user, session }, error: null },
    sessionResult: { data: { session } },
    signOutError: null as any,
    signOutScope: null as string | null,
    profileData: [profile] as any[],
    onAuthCallbacks: [] as Array<(event: string, session: any) => void>,
    fromCalls: [] as string[],
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
      signUp: vi.fn(() => Promise.resolve(mock.signUpResult)),
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
    from: vi.fn((table: string) => {
      mock.fromCalls.push(table);
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => qb(mock.profileData[0] ?? null)),
          })),
        })),
      };
    }),
  },
}));

const AuthActionsProbe: React.FC = () => {
  const { signIn, signOut, isAuthenticated, isSigningOut, userProfile } = useAuth();
  return (
    <div>
      <button data-testid='login' onClick={() => signIn('User@Test.com', 'secret')}>
        Login
      </button>
      <button data-testid='logout' onClick={() => signOut()}>
        Logout
      </button>
      <div data-testid='status'>{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid='signingOut'>{isSigningOut ? 'true' : 'false'}</div>
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
  mock.signUpResult = { data: { user: mockUser, session: mockSession }, error: null };
  mock.profileData = [mockProfile];
  mock.sessionResult = { data: { session: mockSession } };
  mock.fromCalls.length = 0;
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

test('signOut sets isSigningOut while the logout is settling, so guards redirect clean', async () => {
  render(
    <AuthProvider>
      <AuthActionsProbe />
    </AuthProvider>
  );

  await act(async () => {
    await userEvent.click(screen.getByTestId('login'));
  });
  await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('yes'));
  expect(screen.getByTestId('signingOut').textContent).toBe('false');

  await act(async () => {
    await userEvent.click(screen.getByTestId('logout'));
  });

  // Right after signOut the session is cleared but the flag is still set —
  // exactly the state the guards need to skip the `?next=` login-modal bounce.
  await waitFor(() => {
    expect(screen.getByTestId('status').textContent).toBe('no');
    expect(screen.getByTestId('signingOut').textContent).toBe('true');
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

test('ready resolves even when the provider re-renders before the session settles', async () => {
  // Regression: `ready` is the promise every router beforeLoad guard awaits
  // before deciding whether to let a request through. It used to be built
  // with `useRef(new Promise(...))` — whose argument React re-evaluates on
  // EVERY render, rebinding the captured `resolve` to a fresh throwaway
  // promise while `readyRef.current` kept the original. Any re-render before
  // the session settled (StrictMode, or any of this provider's own setState
  // calls) therefore orphaned the promise the guards were already awaiting:
  // it never resolved, requireAdmin hung forever, the router never finished
  // its initial load, and RouterProvider rendered null — a black screen with
  // an empty #root and no error anywhere.
  let releaseSession: (value: unknown) => void = () => {};
  const pendingSession = new Promise(resolve => {
    releaseSession = resolve;
  });
  const { supabase } = await import('../../lib/supabase');
  (supabase.auth.getSession as any).mockImplementationOnce(() => pendingSession);

  let capturedReady: Promise<void> | undefined;
  const ReadyProbe: React.FC = () => {
    const { ready } = useAuth();
    // Capture what a guard would have grabbed on the very first render.
    if (!capturedReady) capturedReady = ready;
    return null;
  };

  const { rerender } = render(
    <AuthProvider>
      <ReadyProbe />
    </AuthProvider>
  );

  // Re-render while getSession() is still in flight.
  rerender(
    <AuthProvider>
      <ReadyProbe />
      <span />
    </AuthProvider>
  );

  await act(async () => {
    releaseSession({ data: { session: mockSession } });
    await pendingSession;
  });

  // Fail fast instead of hanging the suite if the promise was orphaned.
  const timedOut = Symbol('timed-out');
  const outcome = await Promise.race([
    capturedReady!.then(() => 'resolved'),
    new Promise(resolve => setTimeout(() => resolve(timedOut), 1000)),
  ]);

  expect(outcome).toBe('resolved');
});

test('signUp succeeds without upserting user_profiles — the row is created server-side by the handle_new_user trigger', async () => {
  // Regression for hallazgo P0 #3 (docs/qa/main-2026-08-13.md): the client
  // used to upsert `id`/`email` into user_profiles after signUp, columns
  // outside the GRANT UPDATE (...) from
  // supabase/migrations/20260728000001_fix_role_privilege_escalation.sql,
  // producing a 403 on every registration.
  const ProbeWithSignUp: React.FC = () => {
    const { signUp } = useAuth();
    const [error, setError] = React.useState<string | null | undefined>(undefined);
    return (
      <div>
        <button
          data-testid='register'
          onClick={async () => {
            const result = await signUp('new@test.com', 'secret', 'newnick', 'New User');
            setError(result.error);
          }}
        >
          Register
        </button>
        <div data-testid='signup-error'>{error === undefined ? '' : error ?? 'null'}</div>
      </div>
    );
  };

  render(
    <AuthProvider>
      <ProbeWithSignUp />
    </AuthProvider>
  );

  // Mount already loads a profile for the default mock session before we
  // even register — drain that first, unrelated `from('user_profiles')` call
  // so the count below reflects only what `signUp` itself triggers.
  await waitFor(() => expect(mock.fromCalls).toHaveLength(1));
  mock.fromCalls.length = 0;

  await act(async () => {
    await userEvent.click(screen.getByTestId('register'));
  });

  await waitFor(() => {
    expect(screen.getByTestId('signup-error').textContent).toBe('null');
  });

  // Exactly one call to from('user_profiles') — the profile load, not an
  // extra upsert. (The mock's `from()` doesn't even expose `.upsert`, so a
  // reintroduced upsert call would also throw synchronously and fail this
  // test via the assertion above.)
  expect(mock.fromCalls.filter(table => table === 'user_profiles')).toHaveLength(1);
});

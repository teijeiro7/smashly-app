import { describe, expect, it, vi } from 'vitest';
import {
  ensureAuthenticated,
  normalizeRole,
  requireAdmin,
  requireAuth,
  requireStoreOwner,
  redirectStoreOwnerToDashboard,
  resolveRole,
  type RouterContext,
} from '../../router';

/** Minimal stand-in for AuthContextType — only the fields the guards read. */
function mockAuth(
  overrides: {
    isAuthenticated?: boolean;
    role?: string | null;
    refreshedRole?: string | null;
    isSigningOut?: boolean;
  } = {}
) {
  const { isAuthenticated = true, role = null, refreshedRole = null, isSigningOut = false } = overrides;
  return {
    ready: Promise.resolve(),
    isAuthenticated,
    isSigningOut,
    user: role ? ({ role } as any) : null,
    refreshUserProfile: vi.fn().mockResolvedValue(refreshedRole ? { role: refreshedRole } : null),
  } as any;
}

/** Guards throw a TanStack redirect Response with `.options.{to,search}`. */
async function captureRedirect(fn: () => Promise<void>): Promise<{ to: string; search?: any }> {
  try {
    await fn();
  } catch (thrown) {
    return (thrown as Response & { options: { to: string; search?: any } }).options;
  }
  throw new Error('expected a redirect to be thrown, but the guard resolved without one');
}

describe('normalizeRole', () => {
  it('lowercases a role string', () => {
    expect(normalizeRole('Admin')).toBe('admin');
    expect(normalizeRole('Store')).toBe('store');
    expect(normalizeRole('Player')).toBe('player');
  });

  it('returns undefined for null/undefined', () => {
    expect(normalizeRole(null)).toBeUndefined();
    expect(normalizeRole(undefined)).toBeUndefined();
  });
});

describe('resolveRole', () => {
  it('returns the normalized role straight from context.auth.user when present', async () => {
    const auth = mockAuth({ role: 'Admin' });
    await expect(resolveRole(auth)).resolves.toBe('admin');
    expect(auth.refreshUserProfile).not.toHaveBeenCalled();
  });

  it('retries via refreshUserProfile() when the session is valid but the profile is missing', async () => {
    const auth = mockAuth({ role: null, refreshedRole: 'Store' });
    await expect(resolveRole(auth)).resolves.toBe('store');
    expect(auth.refreshUserProfile).toHaveBeenCalledOnce();
  });

  it('returns undefined when the retry also comes back empty (role genuinely unreadable)', async () => {
    const auth = mockAuth({ role: null, refreshedRole: null });
    await expect(resolveRole(auth)).resolves.toBeUndefined();
  });
});

describe('ensureAuthenticated', () => {
  it('resolves without throwing for an authenticated session', async () => {
    const auth = mockAuth({ isAuthenticated: true });
    await expect(ensureAuthenticated(auth, '/profile')).resolves.toBeUndefined();
  });

  it('redirects an anonymous session to `/` with the original destination in `next`', async () => {
    const auth = mockAuth({ isAuthenticated: false });
    const redirectOpts = await captureRedirect(() => ensureAuthenticated(auth, '/admin'));
    expect(redirectOpts.to).toBe('/');
    expect(redirectOpts.search).toEqual({ next: '/admin' });
  });

  it('redirects to a clean `/` WITHOUT `?next=` while a logout is in progress', async () => {
    // Right after sign-out the session is cleared but `isSigningOut` is still
    // true; the invalidate re-runs this guard on the current (protected) route.
    // Attaching `?next=` here would reopen the login modal the instant the user
    // logged out.
    const auth = mockAuth({ isAuthenticated: false, isSigningOut: true });
    const redirectOpts = await captureRedirect(() => ensureAuthenticated(auth, '/dashboard'));
    expect(redirectOpts.to).toBe('/');
    expect(redirectOpts.search).toBeUndefined();
  });

  it('awaits auth.ready before checking isAuthenticated — never fires on the pre-hydration flash', async () => {
    let resolveReady!: () => void;
    const auth = mockAuth({ isAuthenticated: true });
    auth.ready = new Promise<void>(resolve => {
      resolveReady = resolve;
    });

    let settled = false;
    const promise = ensureAuthenticated(auth, '/profile').then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    resolveReady();
    await promise;
    expect(settled).toBe(true);
  });
});

describe('requireAuth', () => {
  const args = (auth: any) => ({
    context: { auth } as RouterContext,
    location: { href: '/messages' },
  });

  it('lets an authenticated request through', async () => {
    await expect(requireAuth(args(mockAuth({ isAuthenticated: true })))).resolves.toBeUndefined();
  });

  it('redirects an anonymous request to `/` with `next`', async () => {
    const redirectOpts = await captureRedirect(() =>
      requireAuth(args(mockAuth({ isAuthenticated: false })))
    );
    expect(redirectOpts.to).toBe('/');
    expect(redirectOpts.search).toEqual({ next: '/messages' });
  });

  it('redirects a signing-out request to a clean `/` (no `?next=`)', async () => {
    const redirectOpts = await captureRedirect(() =>
      requireAuth(args(mockAuth({ isAuthenticated: false, isSigningOut: true })))
    );
    expect(redirectOpts.to).toBe('/');
    expect(redirectOpts.search).toBeUndefined();
  });
});

describe('requireAdmin', () => {
  const args = (auth: any) => ({
    context: { auth } as RouterContext,
    location: { href: '/admin' },
  });

  it('lets an Admin through', async () => {
    await expect(
      requireAdmin(args(mockAuth({ isAuthenticated: true, role: 'Admin' })))
    ).resolves.toBeUndefined();
  });

  it('redirects a non-admin (e.g. Player) to /error?type=forbidden', async () => {
    const redirectOpts = await captureRedirect(() =>
      requireAdmin(args(mockAuth({ isAuthenticated: true, role: 'Player' })))
    );
    expect(redirectOpts.to).toBe('/error');
    expect(redirectOpts.search).toEqual({ type: 'forbidden' });
  });

  it('redirects an unreadable role (session valid, profile fetch failed twice) to /error?type=auth — distinct from "no permission"', async () => {
    const redirectOpts = await captureRedirect(() =>
      requireAdmin(args(mockAuth({ isAuthenticated: true, role: null, refreshedRole: null })))
    );
    expect(redirectOpts.to).toBe('/error');
    expect(redirectOpts.search).toEqual({ type: 'auth' });
  });

  it('redirects an anonymous request to `/` with `next` before ever checking role', async () => {
    const auth = mockAuth({ isAuthenticated: false });
    const redirectOpts = await captureRedirect(() => requireAdmin(args(auth)));
    expect(redirectOpts.to).toBe('/');
    expect(redirectOpts.search).toEqual({ next: '/admin' });
    expect(auth.refreshUserProfile).not.toHaveBeenCalled();
  });
});

describe('requireStoreOwner', () => {
  const args = (auth: any) => ({
    context: { auth } as RouterContext,
    location: { href: '/store/dashboard' },
  });

  it('lets a Store account through (role comparison is case-insensitive)', async () => {
    await expect(
      requireStoreOwner(args(mockAuth({ isAuthenticated: true, role: 'Store' })))
    ).resolves.toBeUndefined();
  });

  it('redirects a non-store role to /dashboard', async () => {
    const redirectOpts = await captureRedirect(() =>
      requireStoreOwner(args(mockAuth({ isAuthenticated: true, role: 'Player' })))
    );
    expect(redirectOpts.to).toBe('/dashboard');
  });

  it('redirects an unreadable role to /error?type=auth rather than silently to /dashboard', async () => {
    const redirectOpts = await captureRedirect(() =>
      requireStoreOwner(args(mockAuth({ isAuthenticated: true, role: null, refreshedRole: null })))
    );
    expect(redirectOpts.to).toBe('/error');
    expect(redirectOpts.search).toEqual({ type: 'auth' });
  });
});

describe('redirectStoreOwnerToDashboard (the /dashboard guard)', () => {
  const args = (auth: any) => ({
    context: { auth } as RouterContext,
    location: { href: '/dashboard' },
  });

  it('lets a Player through to PlayerDashboard', async () => {
    await expect(
      redirectStoreOwnerToDashboard(args(mockAuth({ isAuthenticated: true, role: 'Player' })))
    ).resolves.toBeUndefined();
  });

  it('redirects a Store account to /store/dashboard', async () => {
    const redirectOpts = await captureRedirect(() =>
      redirectStoreOwnerToDashboard(args(mockAuth({ isAuthenticated: true, role: 'Store' })))
    );
    expect(redirectOpts.to).toBe('/store/dashboard');
  });

  it('is lenient on an unreadable role — falls through to PlayerDashboard instead of erroring', async () => {
    // Deliberate asymmetry vs requireAdmin/requireStoreOwner: this route
    // doesn't gate membership in a role, it only redirects Store owners
    // elsewhere, so a transient profile-fetch hiccup shouldn't block a
    // legitimate Player from their own dashboard.
    await expect(
      redirectStoreOwnerToDashboard(
        args(mockAuth({ isAuthenticated: true, role: null, refreshedRole: null }))
      )
    ).resolves.toBeUndefined();
  });

  it('redirects an anonymous request to `/` with `next`', async () => {
    const redirectOpts = await captureRedirect(() =>
      redirectStoreOwnerToDashboard(args(mockAuth({ isAuthenticated: false })))
    );
    expect(redirectOpts.to).toBe('/');
    expect(redirectOpts.search).toEqual({ next: '/dashboard' });
  });
});

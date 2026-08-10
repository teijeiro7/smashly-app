// supabase-js serializes getSession()/refreshSession() through a single
// in-process lock (see lib/supabase.ts's `processLock` comment — chosen to
// avoid a documented navigator.locks hang, but the lock's own queue can still
// stall forever if one call in it never settles, e.g. a refresh stuck on a
// network condition). Nothing upstream of that lock has a timeout, so a
// stuck call freezes every subsequent auth-gated request/route in the app
// with no error and no log. This bounds any single call to `ms`, falling
// back to `onTimeout()` instead of hanging — same "fail open" shape as an
// existing rejection handler, just reachable when the promise never settles
// at all.
export function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => T): Promise<T> {
  return new Promise<T>(resolve => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(onTimeout());
    }, ms);

    promise.then(
      value => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(onTimeout());
      }
    );
  });
}

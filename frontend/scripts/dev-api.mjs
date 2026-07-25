#!/usr/bin/env node
/**
 * Dev launcher for the Vercel API serverless functions during local development.
 *
 * Why a wrapper instead of `"dev:api": "vercel dev ..."`?
 *   `vercel dev` refuses to run if any ancestor process was itself `vercel dev`
 *   (recursive-invocation guard). By spawning from this Node wrapper, the
 *   parent process is `node`, not `vercel`, so the guard passes when this is
 *   invoked from `concurrently` in the frontend `dev` script.
 *
 * Why a separate config (`vercel.dev.api.json`) without `devCommand`?
 *   The shared `vercel.dev.json` declares a `devCommand` of
 *   `pnpm --prefix frontend dev --port $PORT` so a single Vercel process can
 *   serve both the SPA and the API. When Vite is already being launched by
 *   `concurrently` we do NOT want Vercel to spawn a second copy — doing so
 *   would either recursively invoke `vercel dev` again (if the spawned
 *   `devCommand` reached the wrapper) or start a duplicate Vite on a different
 *   port. The API-only config strips the `devCommand` so Vercel just serves
 *   `/api/*` on port 4001 and nothing else.
 *
 * Listens on port 4001 (the Vite proxy target) and reads the config from the
 * repo root regardless of the caller's cwd.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

const child = spawn(
  'vercel',
  [
    'dev',
    '--listen',
    '4001',
    '--local-config',
    resolve(repoRoot, 'vercel.dev.api.json'),
  ],
  {
    cwd: repoRoot,
    stdio: 'inherit',
    // Tell Vercel to use the same package manager we already have installed.
    // Without this, the framework-detection step can fail with
    // `sh: yarn: command not found` on machines that don't have yarn.
    env: { ...process.env, VERCEL_INSTALL_PACKAGE_MANAGER: 'pnpm' },
  },
);

const forward = (sig) => child.kill(sig);
process.on('SIGINT', () => forward('SIGINT'));
process.on('SIGTERM', () => forward('SIGTERM'));

child.on('exit', (code) => process.exit(code ?? 0));


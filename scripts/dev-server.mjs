#!/usr/bin/env node
/**
 * Dev launcher for `pnpm dev`.
 *
 * Spawns a single `vercel dev` that serves BOTH the serverless API functions
 * (under /api) and the Vite frontend on http://localhost:3000.
 *
 * Why a wrapper instead of `"dev": "vercel dev"`?
 *   `vercel dev` refuses to run if the package.json `dev` script literally
 *   contains `vercel dev` (recursive-invocation guard). By launching from this
 *   wrapper, the `dev` script is `node scripts/dev-server.mjs`, so the guard
 *   passes. Vercel then reads `devCommand` from vercel.json to start Vite on the
 *   port it assigns ($PORT) and proxies everything together.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const child = spawn('vercel', ['dev', '--listen', '3000'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

const forward = (sig) => child.kill(sig);
process.on('SIGINT', () => forward('SIGINT'));
process.on('SIGTERM', () => forward('SIGTERM'));

child.on('exit', (code) => process.exit(code ?? 0));

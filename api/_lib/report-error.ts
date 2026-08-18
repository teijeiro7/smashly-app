import { computeFingerprint, normalizeMessage } from './fingerprint';
import { supabaseAdmin } from './supabase';

interface ReportApiErrorContext {
  urlPath?: string;
  /**
   * Repo-relative source file for this call site (e.g. 'api/comparison.ts').
   * Vercel bundles serverless functions before deploying them, so a deployed
   * stack trace's file path doesn't reliably map back to a repo path the
   * way it does in local dev — passing it explicitly here is what lets
   * scripts/error-triage.mjs `git show <sha>:<sourceFile>` the real code
   * instead of guessing from a bundler-internal path.
   */
  sourceFile?: string;
}

const NODE_FRAME_RE = /at\s+(?:.*?\s+)?\(?([^\s()]+):(\d+):(\d+)\)?/;

/** Stack frame whose basename matches sourceFile — best-effort line number, works in local dev. */
function findLineFor(stack: string, sourceFile: string): number | null {
  const basename = sourceFile.split('/').pop();
  if (!basename) return null;
  for (const line of stack.split('\n')) {
    const m = NODE_FRAME_RE.exec(line);
    if (m && m[1].endsWith(basename)) return Number(m[2]);
  }
  return null;
}

/**
 * Reports an unhandled API error into the same error_incidents table and
 * fingerprint/triage pipeline as client-side reports (api/_v1/errors.ts) —
 * same table, same cron, same Notion ticket. Call this from a handler's
 * catch block for a genuine 500/unhandled throw; never for 400/401/403/404,
 * which are valid business responses, not bugs.
 *
 * Never throws — a failure to report must not mask or replace the caller's
 * own error response.
 */
export async function reportApiError(err: unknown, context: ReportApiErrorContext = {}): Promise<void> {
  try {
    const error = err instanceof Error ? err : new Error(String(err));
    const isProduction = process.env.VERCEL_ENV === 'production';
    const line = context.sourceFile && error.stack ? findLineFor(error.stack, context.sourceFile) : null;

    const fingerprint = computeFingerprint({
      source: 'api',
      message: error.message,
      firstFrameFile: context.sourceFile ?? null,
    });

    const { error: rpcError } = await supabaseAdmin.rpc('upsert_error_incident', {
      p_fingerprint: fingerprint,
      p_source: 'api',
      p_error_type: error.name,
      p_message: error.message,
      p_normalized_message: normalizeMessage(error.message),
      p_first_frame_file: context.sourceFile ?? null,
      p_first_frame_line: line,
      p_stack: error.stack ?? null,
      p_component_stack: null,
      p_url_path: context.urlPath ?? null,
      p_environment: isProduction ? 'production' : 'local',
      p_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      p_is_own_origin: true,
      p_is_ticketable: isProduction,
    });

    if (rpcError) console.error('reportApiError: upsert_error_incident failed:', rpcError.message);
  } catch (reportingErr: any) {
    console.error('reportApiError failed:', reportingErr?.message);
  }
}

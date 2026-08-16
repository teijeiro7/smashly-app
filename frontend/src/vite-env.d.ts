/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GEMINI_API_KEY: string;
  /** Commit sha of the deployed build, injected at build time (see vite.config.ts). */
  readonly VITE_COMMIT_SHA: string;
  /** Opt-in: report local-dev errors as ticketable instead of history-only. */
  readonly VITE_REPORT_LOCAL_ERRORS: string;
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

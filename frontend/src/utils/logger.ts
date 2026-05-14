/**
 * Centralized Logger Utility
 * 
 * Only logs in development mode. In production, all console calls are stripped
 * by the build process (terser drop_console).
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },

  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
    // In production, consider sending to an error tracking service like Sentry
    // else {
    //   Sentry.captureException(args[0]);
    // }
  },

  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },

  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },

  group: (label: string) => {
    if (isDev) console.group(label);
  },

  groupEnd: () => {
    if (isDev) console.groupEnd();
  },

  table: (data: unknown) => {
    if (isDev) console.table(data);
  },
};

export default logger;
// Errors shown to users via sileo toasts — browser console stays clean.
// For debugging, temporarily set VITE_DEBUG_CONSOLE=true in .env.local

const debug = import.meta.env.VITE_DEBUG_CONSOLE === 'true';

const noop = () => {};

export const logger = {
  log:      debug ? (...args: unknown[]) => console.log(...args)   : noop,
  warn:     debug ? (...args: unknown[]) => console.warn(...args)  : noop,
  error:    debug ? (...args: unknown[]) => console.error(...args) : noop,
  info:     debug ? (...args: unknown[]) => console.info(...args)  : noop,
  debug:    debug ? (...args: unknown[]) => console.debug(...args) : noop,
  group:    debug ? (label: string) => console.group(label)       : noop,
  groupEnd: debug ? () => console.groupEnd()                      : noop,
  table:    debug ? (data: unknown) => console.table(data)        : noop,
};

export default logger;
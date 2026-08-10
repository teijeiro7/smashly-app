/**
 * Accessibility utility helpers.
 */

import type { KeyboardEvent } from 'react';

/**
 * Builds an onKeyDown handler that activates `handler` on Enter or Space,
 * for non-semantic elements (div/li/img) that need role='button' + tabIndex={0}.
 */
export const onActivationKeyDown = (handler: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handler();
  }
};

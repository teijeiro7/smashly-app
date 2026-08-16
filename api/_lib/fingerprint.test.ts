import { describe, expect, it } from 'vitest';
import { computeFingerprint, normalizeFrameFile, normalizeMessage } from './fingerprint';

describe('computeFingerprint', () => {
  it('collapses the same error with different UUIDs into one fingerprint', () => {
    const a = computeFingerprint({
      source: 'web',
      message: "Cannot find racket 3f9c1a2b-1234-4abc-8def-0123456789ab",
      firstFrameFile: 'ComparisonTable.tsx',
    });
    const b = computeFingerprint({
      source: 'web',
      message: "Cannot find racket 9a8b7c6d-4321-4cba-8fed-ba9876543210",
      firstFrameFile: 'ComparisonTable.tsx',
    });
    expect(a).toBe(b);
  });

  it('does not collapse the same message from a different file', () => {
    const a = computeFingerprint({
      source: 'web',
      message: 'Cannot read properties of undefined',
      firstFrameFile: 'ComparisonTable.tsx',
    });
    const b = computeFingerprint({
      source: 'web',
      message: 'Cannot read properties of undefined',
      firstFrameFile: 'WizardForm.tsx',
    });
    expect(a).not.toBe(b);
  });

  it('is stable across a chunk filename hash change between deploys', () => {
    const a = computeFingerprint({
      source: 'web',
      message: 'boom',
      firstFrameFile: 'index-a3f9c1.js',
    });
    const b = computeFingerprint({
      source: 'web',
      message: 'boom',
      firstFrameFile: 'index-7b2e04.js',
    });
    expect(a).toBe(b);
  });

  it('differs by source even with the same message and frame', () => {
    const web = computeFingerprint({ source: 'web', message: 'boom', firstFrameFile: 'x.ts' });
    const api = computeFingerprint({ source: 'api', message: 'boom', firstFrameFile: 'x.ts' });
    expect(web).not.toBe(api);
  });
});

describe('normalizeMessage', () => {
  it('lowercases and strips UUIDs, numbers, URLs and quoted content', () => {
    const result = normalizeMessage(
      'User 3f9c1a2b-1234-4abc-8def-0123456789ab failed at https://smashly.app/x with "bad token" (42 retries)'
    );
    expect(result).toBe('user <uuid> failed at <url> with <quoted> (<num> retries)');
  });
});

describe('normalizeFrameFile', () => {
  it('strips a build hash suffix from a chunk filename', () => {
    expect(normalizeFrameFile('index-a3f9c1.js')).toBe('index.js');
  });

  it('leaves a plain source filename untouched', () => {
    expect(normalizeFrameFile('ComparisonTable.tsx')).toBe('ComparisonTable.tsx');
  });
});

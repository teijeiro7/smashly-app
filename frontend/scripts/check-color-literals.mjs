#!/usr/bin/env node
/**
 * CI gate (Fase 4 of the a11y/contrast audit): fails if a hex or rgba()
 * color literal shows up in src/components/** or src/pages/** outside the
 * theme-token system, since literals don't swap between light/dark themes.
 *
 * The whitelist below is the closed set of files that legitimately still
 * contain literals: self-contained brand/store-logo assets, and small
 * local light/dark color maps for the handful of ad-hoc accent colors that
 * have no matching semantic token (each carries its own justifying comment
 * at the point of definition). Any new literal outside this list is either
 * an accidental regression or a new case that needs the same review this
 * whitelist already went through — add it here explicitly, not silently.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SCAN_DIRS = ['src/components', 'src/pages'];

const FILE_WHITELIST = new Set(
  [
    'src/styles/GlobalStyles.ts',
    'src/utils/contrast.ts',
    'src/services/pdfGenerator.ts',
    // Self-contained brand/store-logo assets (own fixed background, like a
    // real brand logo) and small local light/dark accent maps with no
    // matching semantic token — each justified by a comment in place.
    'src/components/common/SpecIcons.tsx',
    'src/components/notifications/NotificationDropdown.tsx',
    'src/components/features/AdminDashboard.tsx',
    'src/pages/AdminSettingsPage.tsx',
    'src/components/features/GlobalSearch.tsx',
    'src/components/features/ActivityStats.tsx',
    'src/components/features/ReviewItem.tsx',
    'src/pages/StoreDashboard.tsx',
    'src/pages/PublicStorePage.tsx',
    'src/components/features/UserReviews.tsx',
    'src/components/features/ReviewForm.tsx',
    'src/components/features/PriceHistoryChart.tsx',
    'src/components/features/AccountSettings.tsx',
  ].map(p => p.replace(/\//g, path.sep))
);

const HEX_LITERAL = /#[0-9a-fA-F]{3,8}\b/g;
const RGBA_CALL = /rgba?\([^)]*\)/g;

function isWhitelisted(relPath) {
  if (relPath.includes(`__tests__${path.sep}`) || relPath.includes(`__mocks__${path.sep}`)) {
    return true;
  }
  return FILE_WHITELIST.has(relPath);
}

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function findViolations() {
  const violations = [];

  for (const dir of SCAN_DIRS) {
    const absDir = path.join(ROOT, dir);
    if (!fs.existsSync(absDir)) continue;

    for (const absFile of walk(absDir, [])) {
      const relFile = path.relative(ROOT, absFile);
      if (isWhitelisted(relFile)) continue;

      const lines = fs.readFileSync(absFile, 'utf-8').split('\n');
      lines.forEach((line, index) => {
        const hexMatches = line.match(HEX_LITERAL) || [];
        // rgba(var(--x-rgb), 0.1) is a legitimate token reference, not a
        // literal — only flag rgba()/rgb() calls that don't wrap a var().
        const rgbaMatches = (line.match(RGBA_CALL) || []).filter(m => !m.includes('var(--'));
        const matches = [...hexMatches, ...rgbaMatches];
        if (matches.length > 0) {
          violations.push({ file: relFile, line: index + 1, matches });
        }
      });
    }
  }

  return violations;
}

const violations = findViolations();

if (violations.length > 0) {
  console.error(`\n✖ ${violations.length} color literal(s) found outside the theme-token system:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.matches.join(', ')}`);
  }
  console.error(
    '\nUse a var(--token) from src/styles/GlobalStyles.ts instead. If no token fits, add a ' +
      'local { light, dark } const with a justifying comment and add the file path to ' +
      'FILE_WHITELIST in scripts/check-color-literals.mjs.\n'
  );
  process.exit(1);
}

console.log('✓ No stray color literals in src/components or src/pages.');

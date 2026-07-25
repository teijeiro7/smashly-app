const NOISE_TOKENS = [
  'pala de padel',
  'pala padel',
  'pala de pádel',
  'pala pádel',
  'pala',
  'padel',
  'pádel',
  'racket',
  'raqueta',
];

const FILLER_WORDS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'para', 'y']);

const PLAYER_NAMES = [
  'jon sanz', 'paquito', 'navarro', 'lebron', 'galan', 'tapia',
  'coello', 'chingotto', 'stupa', 'di nenno', 'sanyo', 'bela',
  'belasteguin', 'momo', 'alex ruiz', 'tello', 'yanguas', 'garrido',
  'ari sanchez', 'paulita', 'josemaria', 'triay', 'salazar',
  'bea gonzalez', 'martita', 'ortega',
];

export function normalizeName(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') return '';

  let name = rawName.trim().toLowerCase();

  const sortedNoise = [...NOISE_TOKENS].sort((a, b) => b.length - a.length);

  for (const noise of sortedNoise) {
    name = name.replace(new RegExp(`\\s*\\(${escapeRegex(noise)}\\)\\s*`, 'g'), ' ').trim();
  }

  for (const noise of sortedNoise) {
    if (name.startsWith(noise)) name = name.slice(noise.length).trim();
    if (name.endsWith(noise)) name = name.slice(0, -noise.length).trim();
  }

  let tokens = name.split(/\s+/);
  while (tokens.length && FILLER_WORDS.has(tokens[0])) tokens.shift();
  while (tokens.length && FILLER_WORDS.has(tokens[tokens.length - 1])) tokens.pop();
  name = tokens.join(' ');

  name = name.replace(/\s+/g, ' ').trim();
  return name;
}

export function normalizeForComparison(rawName: string): string {
  let name = normalizeName(rawName);

  name = name.replace(/\b202\d\b/g, '');

  for (const player of PLAYER_NAMES) {
    name = name.replace(player, '');
  }

  name = name.replace(/\.0\b/g, '');
  name = name.replace(/(?<=\w)-(?=\w)/g, '');
  name = name.replace(/[^\w\s]/g, '');
  name = name.replace(/\s+/g, ' ').trim();

  return name;
}

export function namesAreEquivalent(a: string, b: string): boolean {
  return normalizeForComparison(a) === normalizeForComparison(b);
}

export function slugifyPaddle(brand: string, model: string): string {
  const text = `${brand}-${model}`.toLowerCase();
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[-\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

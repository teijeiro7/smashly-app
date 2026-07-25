/**
 * Shared JSON parser for AI responses from the Cloudflare Worker free-tier model.
 * Handles: markdown fences, leading/trailing noise, trailing commas, truncated arrays.
 */
export function parseAiJson(text: string): any {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    throw new Error('No valid JSON object in AI response');
  }
  const candidate = cleaned.slice(first, last + 1);

  // 1. Direct parse
  try { return JSON.parse(candidate); } catch { /* continue */ }

  // 2. Remove trailing commas before ] or }
  const noCommas = candidate.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(noCommas); } catch { /* continue */ }

  // 3. Append missing close brackets (truncated response). This can silently
  // drop whatever the AI hadn't finished writing yet (e.g. a partial racket
  // in the middle of an array) — log it so a run of these isn't invisible.
  try {
    const parsed = JSON.parse(candidate + ']}');
    console.warn('parseAiJson: repaired a truncated AI response by appending closing brackets');
    return parsed;
  } catch { /* continue */ }

  // 4. Both repairs combined — same truncation risk as step 3.
  try {
    const parsed = JSON.parse(noCommas + ']}');
    console.warn('parseAiJson: repaired a truncated AI response (trailing commas + closing brackets)');
    return parsed;
  } catch { /* continue */ }

  throw new Error('Failed to parse AI response JSON after repair attempts');
}

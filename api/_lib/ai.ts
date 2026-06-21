// AI utilities for Vercel functions
// Text generation: custom Cloudflare Worker (no API key)
// Embeddings: OpenRouter text-embedding-3-small (requires OPENROUTER_API_KEY)

const FREE_AI_BASE = process.env.FREE_AI_API_URL || 'https://free-ai-api.teijeiroparga2004.workers.dev';

export async function generateContent(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(`${FREE_AI_BASE.replace(/\/+$/, '')}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 6000,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Free AI API error ${res.status}: ${text}`);
    }

    const data = await res.json() as any;
    return (
      data?.choices?.[0]?.message?.content ||
      data?.response ||
      data?.content ||
      data?.text ||
      ''
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function embed(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set — embeddings unavailable');

  const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_APP_URL || 'https://smashly.app',
      'X-Title': process.env.OPENROUTER_APP_NAME || 'Smashly',
    },
    body: JSON.stringify({ model: 'openai/text-embedding-3-small', input: text }),
  });

  if (!res.ok) throw new Error(`Embedding error ${res.status}`);
  const data = await res.json() as any;
  return data.data[0].embedding as number[];
}

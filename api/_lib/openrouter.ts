const FREE_MODELS = [
  'stepfun/step-3.5-flash:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'arcee-ai/trinity-large-preview:free',
  'z-ai/glm-4.5-air:free',
  'qwen/qwen3-coder:free',
];

function headers() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.OPENROUTER_APP_URL || 'https://smashly.app',
    'X-Title': process.env.OPENROUTER_APP_NAME || 'Smashly',
  };
}

/** Generate text content, trying each free model in order */
export async function generateContent(prompt: string): Promise<string> {
  let lastError: Error | null = null;

  for (const model of FREE_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status}: ${body.slice(0, 200)}`);
      }

      const data = (await res.json()) as any;
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error('Empty response');
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('All OpenRouter models failed');
}

/** Generate embedding vector for a text string */
export async function embed(text: string): Promise<number[]> {
  const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ model: 'openai/text-embedding-3-small', input: text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embedding failed ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as any;
  return data.data[0].embedding as number[];
}

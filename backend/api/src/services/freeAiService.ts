import logger from '../config/logger';

export class FreeAiService {
  constructor() {}

  private get baseUrl(): string {
    return process.env.FREE_AI_API_URL || 'http://localhost:3001';
  }

  async generateContent(prompt: string): Promise<string> {
    const url = `${this.baseUrl.replace(/\/+$/, '')}/chat`;
    logger.info(`🤖 Requesting content from Free AI API: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Request failed with status code ${response.status}${errorText ? `: ${errorText}` : ''}`
        );
      }

      const contentType = response.headers.get('content-type') || '';
      const isSSE = contentType.includes('event-stream');

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          const isDataPrefix = trimmed.startsWith('data: ');
          const isDone = isDataPrefix ? trimmed.slice(6).trim() === '[DONE]' : trimmed === '[DONE]';
          const isEmptyData = isDataPrefix ? !trimmed.slice(6).trim() : !trimmed;

          if (isDone || isEmptyData) continue;

          if (isSSE && isDataPrefix) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const content = parsed.choices?.[0]?.delta?.content || '';
              fullText += content;
            } catch {
              fullText += trimmed;
            }
          } else {
            fullText += trimmed;
          }
        }
      }

      if (buffer.trim()) {
        const trimmedBuffer = buffer.trim();
        const isDataPrefix = trimmedBuffer.startsWith('data: ');
        const isDone = isDataPrefix ? trimmedBuffer.slice(6).trim() === '[DONE]' : trimmedBuffer === '[DONE]';
        const isEmptyData = isDataPrefix ? !trimmedBuffer.slice(6).trim() : !trimmedBuffer;

        if (!isDone && !isEmptyData) {
          if (isSSE && isDataPrefix) {
            try {
              const parsed = JSON.parse(trimmedBuffer.slice(6));
              fullText += parsed.choices?.[0]?.delta?.content || '';
            } catch {
              fullText += trimmedBuffer;
            }
          } else {
            fullText += trimmedBuffer;
          }
        }
      }

      if (!fullText) {
        logger.warn('⚠️ Free AI API returned empty response');
        throw new Error('Free AI API returned empty response');
      }

      logger.info(`✅ Free AI API success. Length: ${fullText.length}`);
      return fullText;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        logger.warn('❌ Free AI API request timed out after 120s');
        throw new Error('Free AI API unavailable (timeout): request timed out after 120s');
      }

      const errorMessage = error.message || 'Unknown error contacting Free AI API';
      const statusMatch = errorMessage.match(/status code (\d+)/);
      const errorDetails = statusMatch ? statusMatch[1] : 'Unknown';
      logger.warn(`❌ Free AI API failed: ${errorMessage} (${errorDetails}). Falling back to OpenRouter.`);
      throw new Error(`Free AI API unavailable (${errorDetails}): ${errorMessage}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const freeAiService = new FreeAiService();

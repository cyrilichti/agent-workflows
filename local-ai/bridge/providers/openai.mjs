import { readFileSync } from 'node:fs';
import { ProviderError } from '../contract.mjs';

// https://developers.openai.com/api/docs/guides/text (Responses API).
export function parseOpenAI(body, model) {
  if (body.status !== 'completed') throw new ProviderError('api_incomplete', 'The API response did not complete.');
  const text = (body.output ?? []).filter(item => item.type === 'message')
    .flatMap(item => item.content ?? []).filter(c => c.type === 'output_text').map(c => c.text).join('\n');
  const u = body.usage;
  return { text, model: body.model ?? model, requestId: body.id,
    usage: u ? { input: u.input_tokens, cachedInput: u.input_tokens_details?.cached_tokens, output: u.output_tokens } : undefined };
}
export function createOpenAI({ model, keyFile = '/run/secrets/openai_api_key', fetchImpl = fetch }) {
  return {
    async generate(prompt, { signal }) {
      let key;
      try { key = readFileSync(keyFile, 'utf8').trim(); } catch {}
      if (!key) throw new ProviderError('authentication', 'Configure the API token file before enabling API inference.');
      let response;
      try {
        response = await fetchImpl('https://api.openai.com/v1/responses', {
          method: 'POST', signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model, input: prompt, max_output_tokens: 1024, store: false, tools: [] })
        });
      } catch {
        throw new ProviderError(signal.aborted ? 'timeout' : 'network', 'API request interrupted; remote outcome may be unknown. No automatic retry.');
      }
      if (!response.ok) {
        const code = response.status === 429 ? 'quota_or_rate_limit' : response.status === 401 ? 'authentication' : 'api_error';
        throw new ProviderError(code, `OpenAI API returned HTTP ${response.status}. No fallback was attempted.`);
      }
      return parseOpenAI(await response.json(), model);
    }
  };
}

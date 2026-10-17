import { TaskResultEntity } from '../entities/task-result.entity.ts';
import type { OpenAiResponse } from '../types/provider.types.ts';

export class OpenAiResultBuilder {
  build(body: OpenAiResponse, model: string): TaskResultEntity {
    const text = body.output
      .filter((item) => item.type === 'message')
      .flatMap((item) => item.content ?? [])
      .filter((content) => content.type === 'output_text')
      .map((content) => content.text ?? '')
      .join('\n');
    const usage = body.usage;
    return new TaskResultEntity({
      text,
      model: body.model ?? model,
      requestId: body.id,
      usage: usage ? {
        input: usage.input_tokens,
        cachedInput: usage.input_tokens_details?.cached_tokens,
        output: usage.output_tokens,
      } : undefined,
    });
  }
}

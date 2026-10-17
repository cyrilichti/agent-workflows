import { OpenAiResultBuilder } from '../builders/openai-result.builder.ts';
import { TaskResultEntity } from '../entities/task-result.entity.ts';
import type { AiProvider } from '../types/task.types.ts';
import type { OpenAiProviderOptions, OpenAiResponse } from '../types/provider.types.ts';
import type { Validator } from '../types/validator.types.ts';
import { OpenAiResponseValidator } from '../validators/openai-response.validator.ts';
import { OpenAiCredentialService } from './openai-credential.service.ts';
import { OpenAiRequestService } from './openai-request.service.ts';

export class OpenAiApiService implements AiProvider {
  private readonly credentials = new OpenAiCredentialService();
  private readonly requests = new OpenAiRequestService();
  private readonly responses: Validator<OpenAiResponse> = new OpenAiResponseValidator();
  private readonly results = new OpenAiResultBuilder();
  private readonly options: OpenAiProviderOptions;

  constructor(options: OpenAiProviderOptions) {
    this.options = options;
  }

  async generate(prompt: string, { signal }: Parameters<AiProvider['generate']>[1]): Promise<TaskResultEntity> {
    const key = this.credentials.readKey(this.options);
    const response = await this.requests.send(prompt, signal, key, this.options);
    const body: unknown = await response.json();
    this.responses.validate(body);
    return this.results.build(body, this.options.model);
  }
}

import { isRecord } from '../helper.ts';
import type { UsageReport } from '../types/usage-report.types.ts';
import type { Validator } from '../types/validator.types.ts';

export class UsageReportValidator implements Validator<UsageReport> {
  validate(value: unknown): asserts value is UsageReport {
    if (!isRecord(value) || (value.phase !== null && typeof value.phase !== 'string') ||
        (value.traceId !== undefined && typeof value.traceId !== 'string') ||
        !Array.isArray(value.items) ||
        !value.items.every((item) => isRecord(item) && typeof item.outputCharacters === 'number' &&
          (item.tool === undefined || typeof item.tool === 'string'))) {
      throw new Error('Invalid usage report.');
    }
    const usage = value.usage;
    if (usage !== null && (!isRecord(usage) || typeof usage.input_tokens !== 'number' ||
        typeof usage.output_tokens !== 'number' ||
        (usage.cached_input_tokens !== undefined && typeof usage.cached_input_tokens !== 'number'))) {
      throw new Error('Invalid usage report.');
    }
  }
}

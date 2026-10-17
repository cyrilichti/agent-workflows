import { commandName, textLength } from '../helper.ts';
import type { CodexEventItem, CodexRawEvent } from '../types/trace.types.ts';

export class CodexEventItemBuilder {
  build(event: CodexRawEvent, completedAt?: string): CodexEventItem | undefined {
    if (event.type !== 'item.completed' || !event.item) return undefined;
    const item = event.item;
    return {
      type: item.type,
      ...(item.id ? { id: item.id } : {}),
      ...(typeof completedAt === 'string' && Number.isFinite(Date.parse(completedAt)) ? { completedAt } : {}),
      ...(item.type === 'command_execution' ? {
        commandName: commandName(item.command),
        ...(typeof item.exit_code === 'number' && Number.isInteger(item.exit_code) ? { exitCode: item.exit_code } : {}),
      } : {}),
      ...(item.type === 'mcp_tool_call' ? { tool: `${item.server}/${item.tool}` } : {}),
      inputCharacters: textLength(item.arguments ?? item.command ?? item.input),
      outputCharacters: textLength(item.result ?? item.aggregated_output ?? item.text ?? item.output),
    };
  }
}

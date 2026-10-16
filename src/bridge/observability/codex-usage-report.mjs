import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const characters = (value) => value === undefined || value === null
  ? 0
  : (typeof value === 'string' ? value : JSON.stringify(value)).length;

/** Summarize observable CLI events without copying prompts or tool results. */
export function summarizeCodexEvents(jsonl, { traceId, phase, requestId, model, prompt }) {
  const eventCounts = {};
  const items = [];
  let usage = null;
  let threadId = null;
  let malformedLines = 0;
  for (const line of jsonl.split('\n').filter(Boolean)) {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      malformedLines++;
      continue;
    }
    eventCounts[event.type] = (eventCounts[event.type] ?? 0) + 1;
    if (event.type === 'thread.started') threadId = event.thread_id ?? null;
    if (event.type === 'turn.completed') usage = event.usage ?? null;
    if (event.type !== 'item.completed' || !event.item) continue;
    const item = event.item;
    items.push({
      type: item.type,
      ...(item.id ? { id: item.id } : {}),
      ...(item.type === 'mcp_tool_call' ? { tool: `${item.server}/${item.tool}` } : {}),
      inputCharacters: characters(item.arguments ?? item.command ?? item.input),
      outputCharacters: characters(item.result ?? item.aggregated_output ?? item.text ?? item.output),
    });
  }
  return {
    schemaVersion: 1,
    traceId,
    phase: phase ?? null,
    requestId: requestId ?? null,
    threadId,
    model,
    promptCharacters: prompt.length,
    jsonlBytes: Buffer.byteLength(jsonl),
    usage,
    eventCounts,
    malformedLines,
    items,
    measurementNote: 'Only turn.completed.usage is a token count. Character counts are context-size indicators, not attributable billed tokens.',
  };
}

/** Save the complete CLI stream and a content-free summary under a unique trace ID. */
export async function saveCodexUsageReport(directory, jsonl, options) {
  const reportDirectory = resolve(directory);
  await mkdir(reportDirectory, { recursive: true, mode: 0o700 });
  const base = resolve(reportDirectory, options.traceId);
  await writeFile(`${base}.jsonl`, jsonl, { mode: 0o600, flag: 'wx' });
  await writeFile(
    `${base}.summary.json`,
    `${JSON.stringify(summarizeCodexEvents(jsonl, options), null, 2)}\n`,
    { mode: 0o600, flag: 'wx' },
  );
  return `${base}.summary.json`;
}

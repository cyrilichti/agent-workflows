const characters = (value) => value === undefined || value === null
  ? 0
  : (typeof value === 'string' ? value : JSON.stringify(value)).length;

/** Keep a useful command label without copying arguments or shell output. */
const commandName = (command) => {
  if (typeof command !== 'string') return 'shell';
  const inner = /(?:^|\s)-lc\s+['"]?([^\s'"\\]+)/.exec(command)?.[1]
    ?? command.trim().split(/\s+/)[0];
  const name = inner?.split('/').pop();
  return /^[A-Za-z0-9._-]+$/.test(name ?? '') ? name : 'shell';
};

/** Summarize observable CLI events in memory without copying prompts or tool results. */
export function summarizeCodexEvents(jsonl, { traceId, phase, requestId, model, prompt, itemCompletedAt = [] }) {
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
    const completedAt = itemCompletedAt[items.length];
    items.push({
      type: item.type,
      ...(item.id ? { id: item.id } : {}),
      ...(typeof completedAt === 'string' && Number.isFinite(Date.parse(completedAt))
        ? { completedAt } : {}),
      ...(item.type === 'command_execution' ? {
        commandName: commandName(item.command),
        ...(Number.isInteger(item.exit_code) ? { exitCode: item.exit_code } : {}),
      } : {}),
      ...(item.type === 'mcp_tool_call' ? { tool: `${item.server}/${item.tool}` } : {}),
      inputCharacters: characters(item.arguments ?? item.command ?? item.input),
      outputCharacters: characters(item.result ?? item.aggregated_output ?? item.text ?? item.output),
    });
  }
  return {
    schemaVersion: 2,
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

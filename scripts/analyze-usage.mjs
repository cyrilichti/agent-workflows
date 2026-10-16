import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const directory = resolve(process.argv[2] || '.local/bridge/usage');
let files;
try {
  files = (await readdir(directory)).filter((name) => name.endsWith('.summary.json'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  files = [];
}
if (!files.length) {
  console.log(`No usage reports in ${directory}. Restart the bridge and run an orchestrated cycle first.`);
  process.exit(0);
}

const reports = await Promise.all(files.map(async (file) =>
  JSON.parse(await readFile(resolve(directory, file), 'utf8')),
));
const byPhase = new Map();
const byTool = new Map();
for (const report of reports) {
  const phase = report.phase || 'unknown';
  const row = byPhase.get(phase) || {
    phase, runs: 0, withUsage: 0, input: 0, cached: 0, uncached: 0, output: 0, toolOutputChars: 0,
  };
  row.runs++;
  if (report.usage) {
    const input = report.usage.input_tokens || 0;
    const cached = report.usage.cached_input_tokens || 0;
    row.withUsage++;
    row.input += input;
    row.cached += cached;
    row.uncached += input - cached;
    row.output += report.usage.output_tokens || 0;
  }
  for (const item of report.items || []) {
    if (!item.tool) continue;
    row.toolOutputChars += item.outputCharacters || 0;
    byTool.set(item.tool, (byTool.get(item.tool) || 0) + (item.outputCharacters || 0));
  }
  byPhase.set(phase, row);
}

console.log(`Reports: ${reports.length} (${directory})`);
console.log('\nUsage by bridge phase (input includes cached):');
console.table([...byPhase.values()].sort((a, b) => a.phase.localeCompare(b.phase)));
console.log('\nLargest executions by input tokens:');
console.table(reports.filter((report) => report.usage)
  .sort((a, b) => b.usage.input_tokens - a.usage.input_tokens)
  .slice(0, 10)
  .map((report) => ({
    phase: report.phase || 'unknown', traceId: report.traceId,
    input: report.usage.input_tokens,
    cached: report.usage.cached_input_tokens,
    output: report.usage.output_tokens,
  })));
console.log('\nLargest tool outputs by characters (not tokens):');
console.table([...byTool.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  .map(([tool, outputChars]) => ({ tool, outputChars })));

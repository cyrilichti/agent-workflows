import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type SourceFinding = {
  workflow: 'ready' | 'inspect';
  id: string;
  head_sha: string;
  finding: string;
  todo: string;
};

export type Todo = {
  number: number;
  state: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  text: string;
  line: number;
};

type Plan = { lines: string[]; stepsStart: number; stepsEnd: number; todos: Todo[] };
type Selection = { status: 'todo'; todo: Omit<Todo, 'line'> } |
  { status: 'ready' | 'cancelled' };

const symbols = {
  pending: '○',
  in_progress: '◐',
  completed: '✓',
  cancelled: '⊘',
} as const;

function parsePlan(content: string): Plan {
  const lines = content.split('\n');
  const stepsStart = lines.findIndex(line => line === '## Steps');
  if (stepsStart < 0) {
    throw new Error('Plan has no ## Steps section.');
  }
  let stepsEnd = lines.findIndex((line, index) => index > stepsStart && line.startsWith('## '));
  if (stepsEnd < 0) {
    stepsEnd = lines.length;
  }
  const todos: Todo[] = [];
  for (let line = stepsStart + 1; line < stepsEnd; line++) {
    const match = /^(\d+)\. ([○◐✓⊘]) (.+)$/.exec(lines[line]!);
    if (!match) {
      continue;
    }
    const state = Object.entries(symbols).find(([, symbol]) => symbol === match[2])![0] as Todo['state'];
    todos.push({ number: Number(match[1]), state, text: match[3]!, line });
  }
  return { lines, stepsStart, stepsEnd, todos };
}

function sourceKey(workflow: string, id: string, headSha: string): string {
  return `${workflow}\0${id}\0${headSha}`;
}

function scalar(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) {
    return JSON.parse(trimmed) as string;
  }
  return trimmed;
}

function existingSources(lines: string[]): Set<string> {
  const keys = new Set<string>();
  for (let i = 0; i < lines.length - 3; i++) {
    if (lines[i]?.trim() !== 'corrective_source:') {
      continue;
    }
    const workflow = /^\s*workflow:\s*(.*)$/.exec(lines[i + 1]!);
    const id = /^\s*id:\s*(.*)$/.exec(lines[i + 2]!);
    const headSha = /^\s*head_sha:\s*(.*)$/.exec(lines[i + 3]!);
    if (workflow && id && headSha) {
      keys.add(sourceKey(scalar(workflow[1]!), scalar(id[1]!), scalar(headSha[1]!)));
    }
  }
  return keys;
}

function correctiveBlock(number: number, source: SourceFinding): string[] {
  const longestFence = Math.max(0, ...[...source.finding.matchAll(/~+/g)]
    .map(match => match[0].length));
  const fence = '~'.repeat(Math.max(4, longestFence + 1));
  return [
    `${number}. ○ ${source.todo.trim()}`,
    `   ${fence}yaml`,
    '   corrective_source:',
    `     workflow: ${JSON.stringify(source.workflow)}`,
    `     id: ${JSON.stringify(source.id)}`,
    `     head_sha: ${JSON.stringify(source.head_sha)}`,
    '     finding: |-',
    ...source.finding.split('\n').map(line => `       ${line}`),
    `   ${fence}`,
  ];
}

export function appendCorrectiveTodos(content: string, findings: SourceFinding[]): string {
  if (findings.length === 0) {
    return content;
  }
  const plan = parsePlan(content);
  const known = existingSources(plan.lines);
  let number = Math.max(0, ...plan.todos.map(todo => todo.number));
  const additions: string[] = [];
  for (const finding of findings) {
    const key = sourceKey(finding.workflow, finding.id, finding.head_sha);
    if (known.has(key)) {
      continue;
    }
    known.add(key);
    number++;
    if (additions.length > 0) {
      additions.push('');
    }
    additions.push(...correctiveBlock(number, finding));
  }
  if (additions.length === 0) {
    return content;
  }
  const before = plan.lines.slice(0, plan.stepsEnd);
  while (before.at(-1) === '') {
    before.pop();
  }
  const after = plan.lines.slice(plan.stepsEnd);
  return [...before, '', ...additions, '', ...after].join('\n');
}

export function selectNextTodo(content: string): { content: string; selection: Selection } {
  const plan = parsePlan(content);
  let todo = plan.todos.find(candidate => candidate.state === 'in_progress');
  if (!todo) {
    todo = plan.todos.find(candidate => candidate.state === 'pending');
    if (todo) {
      plan.lines[todo.line] = plan.lines[todo.line]!.replace(/^\d+\. ○ /,
        `${todo.number}. ◐ `);
    }
  }
  if (todo) {
    return {
      content: plan.lines.join('\n'),
      selection: { status: 'todo', todo: { number: todo.number,
        state: 'in_progress', text: todo.text } },
    };
  }
  if (plan.todos.every(candidate => candidate.state === 'cancelled')) {
    return { content, selection: { status: 'cancelled' } };
  }
  if (plan.todos.some(candidate => candidate.state === 'completed')) {
    return { content, selection: { status: 'ready' } };
  }
  throw new Error('Plan has no executable or completed todo.');
}

export function completeTodo(content: string, number: number): string {
  const plan = parsePlan(content);
  const todo = plan.todos.find(candidate => candidate.number === number &&
    candidate.state === 'in_progress');
  if (!todo) {
    throw new Error(`Todo ${number} is not in progress.`);
  }
  plan.lines[todo.line] = plan.lines[todo.line]!.replace(/^\d+\. ◐ /,
    `${number}. ✓ `);
  return plan.lines.join('\n');
}

export function readPlan(root: string, reference: string): string {
  return readFileSync(join(root, reference), 'utf8');
}

export function writePlan(root: string, reference: string, content: string): void {
  writeFileSync(join(root, reference), content);
}

import { readFileSync } from 'node:fs';

export type Finding = {
  id: string;
  head_sha: string;
  body: string;
  severity: 'blocking' | 'non-blocking';
  source_review?: string;
  anchor?: { path: string; line: number; side: 'LEFT' | 'RIGHT' };
};

type Entry = { id: string; body: string };

function entries(value: unknown): Entry[] {
  const found: Entry[] = [];
  function visit(node: unknown): void {
    if (Array.isArray(node)) {
      node.forEach(visit);
    } else if (node && typeof node === 'object') {
      const record = node as Record<string, unknown>;
      if ((typeof record.id === 'string' || typeof record.id === 'number') &&
          typeof record.body === 'string') {
        found.push({ id: String(record.id), body: record.body });
      }
      Object.values(record).forEach(visit);
    }
  }
  visit(value);
  return found;
}

export function reconcileInspectionPublication(headSha: string, findings: Finding[],
  reviewActivity: unknown): Finding[] {
  const activity = entries(reviewActivity);
  return findings.filter(finding => {
    if (finding.head_sha !== headSha || !finding.id || !finding.body) {
      throw new Error('Finding is not bound to the frozen review snapshot.');
    }
    const marker = `<!-- agent-workflows-finding id="${finding.id}" head="${headSha}" -->`;
    if (!finding.body.includes(marker)) {
      throw new Error('Finding has no exact snapshot marker.');
    }
    return !activity.some(entry => entry.body.includes(marker) ||
      (finding.source_review !== undefined && entry.id === finding.source_review));
  });
}

if (import.meta.main) {
  try {
    const input = JSON.parse(readFileSync(0, 'utf8')) as {
      head_sha: string; findings: Finding[]; review_activity: unknown;
    };
    const unseen_findings = reconcileInspectionPublication(input.head_sha,
      input.findings, input.review_activity);
    process.stdout.write(`${JSON.stringify({ status: 'resolved', unseen_findings })}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed',
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}

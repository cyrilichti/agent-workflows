/** Check the recorded completion state without executing validation commands. */
export function assertReadyPlan(content: string): void {
  const lines = content.split(/\r?\n/);
  const section = (heading: string): string[] => {
    const start = lines.findIndex(line => line === `## ${heading}`);
    if (start < 0) {
      throw new Error(`Plan has no ## ${heading} section.`);
    }
    const end = lines.findIndex((line, index) => index > start && /^## /.test(line));
    return lines.slice(start + 1, end < 0 ? undefined : end);
  };

  const steps = section('Steps').filter(line => /^\d+\. /.test(line));
  if (!steps.length || !steps.every(line => /^\d+\. ✓ \S/.test(line))) {
    throw new Error('Every plan todo must be completed.');
  }
  const validation = section('Validation').filter(line => /^- /.test(line));
  if (!validation.length || !validation.every(line => /^- \[[xX]\] \S/.test(line))) {
    throw new Error('Every plan validation must be checked.');
  }
}

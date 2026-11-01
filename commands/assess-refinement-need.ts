import { readFileSync } from 'node:fs';

type Unit = { outcome: string; verification: string };
type Input = { autonomous_units: Unit[] };

export function assessRefinementNeed(input: Input) {
  if (!Array.isArray(input.autonomous_units) || !input.autonomous_units.length ||
    !input.autonomous_units.every(unit =>
    typeof unit.outcome === 'string' && unit.outcome.trim() &&
    typeof unit.verification === 'string' && unit.verification.trim())) {
    throw new Error('Supply assessed autonomous units with outcomes and verification.');
  }
  if (input.autonomous_units.length < 2) {
    return { status: 'refinement-not-needed' as const,
      findings: 'One coherent delivery unit.' };
  }
  return { status: 'needs-refinement' as const,
    findings: input.autonomous_units.map(unit =>
      `${unit.outcome.trim()} — ${unit.verification.trim()}`) };
}

if (import.meta.main) {
  try {
    const input = JSON.parse(readFileSync(0, 'utf8')) as Input;
    process.stdout.write(`${JSON.stringify(assessRefinementNeed(input))}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage: 'assess_refinement_need',
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}

type Choice<Value> = { label: string; value: Value };
type Match = 'native_url' | 'exact_id' | 'normalized_exact_name' | 'whole_word_name' | 'possible';
type Assessment = { match: Match; approximate?: boolean };
type Candidate<Value> = Choice<Value> & Assessment;

export type DestinationName = {
  id: string;
  name: string;
  exactAlias?: string;
  nativeMatch?: boolean;
};

export function normalizeExactName(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[\s._/-]+/g, ' ').trim();
}

function normalizeDestinationName(value: string): string {
  return normalizeExactName(value.replace(/\p{Dash_Punctuation}/gu, '-'));
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_value, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let prior = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1,
        prior + Number(a[i - 1] !== b[j - 1]));
      prior = old;
    }
  }
  return row[b.length]!;
}

function ambiguousDestination<Value>(candidates: Candidate<Value>[]) {
  return { status: 'ambiguous' as const,
    candidates: candidates.map(({ label, value, match }) => ({ label, value, match })) };
}

export function matchDestinationNames<Destination extends DestinationName>(
  projectName: string, destinations: Destination[],
) {
  const reference = projectName.trim();
  if (!reference) return [];
  const query = normalizeDestinationName(reference);
  const exactQuery = normalizeExactName(reference);
  // Keep language suffixes such as C++ and C# attached to the name.
  const wordBoundary = '[^\\p{L}\\p{M}\\p{N}+#]';
  const words = query.split(' ');
  const phrase = words.every(word => /^[\p{L}\p{M}\p{N}]+$/u.test(word))
    ? words.map(word => RegExp.escape(word)).join(wordBoundary + '+')
    : RegExp.escape(query);
  const wholeWordName = query
    ? new RegExp('(?:^|' + wordBoundary + ')' + phrase + '(?:$|' + wordBoundary + ')', 'u')
    : undefined;

  return destinations.flatMap((destination): { destination: Destination; assessment: Assessment }[] => {
    const name = normalizeDestinationName(destination.name);
    const exactNames = [destination.name, destination.exactAlias ?? '']
      .map(normalizeExactName).filter(Boolean);
    let match: Match;
    if (destination.nativeMatch) match = 'native_url';
    else if (reference === destination.id) match = 'exact_id';
    else if (exactNames.includes(exactQuery)) match = 'normalized_exact_name';
    else if (wholeWordName?.test(name)) match = 'whole_word_name';
    else {
      if (!query || !name) return [];
      if (name.includes(query) || query.includes(name)) {
        return [{ destination, assessment: { match: 'possible' } }];
      }
      if (query.length > 5 && distance(query, name) <= 2) {
        return [{ destination, assessment: { match: 'possible', approximate: true } }];
      }
      return [];
    }
    return [{ destination, assessment: { match } }];
  });
}

export function resolveMatchedDestinations<Value>(candidates: Candidate<Value>[]) {
  if (!candidates.length) return { status: 'not_found' as const };
  const exact = candidates.filter(candidate =>
    candidate.match !== 'whole_word_name' && candidate.match !== 'possible');
  const reliable = exact.length ? exact :
    candidates.filter(candidate => candidate.match === 'whole_word_name');
  if (reliable.length === 1) {
    return { status: 'resolved' as const, destination: reliable[0]!.value };
  }
  if (reliable.length) return ambiguousDestination(reliable);
  if (candidates.length === 1 && candidates[0]!.approximate) {
    return { status: 'resolved' as const, destination: candidates[0]!.value,
      match: 'strong_unique_approximate' as const };
  }
  return ambiguousDestination(candidates);
}

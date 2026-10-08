import { ProviderError } from './task-contract.mjs';

const inspectionStatuses = {
  published: 'inspection published',
  completed_without_findings: 'inspection completed without findings',
  incomplete: 'inspection incomplete',
  failed: 'inspection failed',
  not_attempted: 'inspection not attempted',
  unobserved: 'inspection outcome unobserved',
};
const labelStatuses = {
  applied: 'agent-inspected applied',
  not_applied: 'agent-inspected not applied',
  unobserved: 'agent-inspected outcome unobserved',
};

const properties = {
  requestId: { type: ['string', 'null'] },
  requestUrl: { type: ['string', 'null'] },
  inspectionStatus: { type: 'string', enum: Object.keys(inspectionStatuses) },
  itemId: { type: 'string' },
  itemUrl: { type: ['string', 'null'] },
  labelStatus: { type: 'string', enum: Object.keys(labelStatuses) },
  details: { type: 'string' },
};

/** The selected item is bound into the provider's constrained final response. */
export function inspectResultSchema(itemId) {
  return {
    type: 'object',
    properties: { ...properties, itemId: { type: 'string', enum: [itemId] } },
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

/** Transport instructions apply only to the final response, after workflow execution. */
export function inspectResultPrompt(prompt, itemId) {
  return `${prompt}\n\nFinal response transport contract: execute the requested workflow normally, including its required operations and handoffs. Return the final observed inspection and label states using the supplied JSON schema instead of writing the inspect-result Markdown block. The bridge renders that block for the user. The exact selected item ID is ${JSON.stringify(itemId)}. Set requestId to the visible provider/repository#ID identity and requestUrl/itemUrl to their official URLs, or null when unresolved. Use published only for observed complete finding publication for the final inspected snapshot; use completed_without_findings for a complete inspection with no findings and no publication. Use incomplete, failed, not_attempted or unobserved for other inspection outcomes. Use applied only when agent-inspected application on the selected item is confirmed for the final inspection, not merely because a PR exists or an older label is present. Put explanations and remaining actions in details, in the user's language. Do not translate enum values or infer delivery success from inference completion.`;
}

/** Validate the small closed contract even when a provider ignores its schema. */
export function presentInspectResult(text, selectedItemId) {
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new ProviderError('invalid_output', 'Expected a schema-constrained inspection result.');
  }
  const invalid = () => {
    throw new ProviderError('invalid_output', 'Invalid inspection result for the selected item.');
  };
  if (!result || Array.isArray(result) || typeof result !== 'object'
    || Object.keys(result).length !== Object.keys(properties).length) invalid();
  for (const [key, property] of Object.entries(properties)) {
    const types = Array.isArray(property.type) ? property.type : [property.type];
    if (!Object.hasOwn(result, key)
      || !types.includes(result[key] === null ? 'null' : typeof result[key])
      || (property.enum && !property.enum.includes(result[key]))) invalid();
  }
  if (result.itemId !== selectedItemId) invalid();
  for (const key of ['requestId', 'itemId']) {
    if (result[key] !== null && (!result[key].trim() || /[\r\n]/.test(result[key]))) invalid();
  }
  for (const key of ['requestUrl', 'itemUrl']) {
    if (result[key] === null) continue;
    try {
      if (!['https:', 'http:'].includes(new URL(result[key]).protocol)) invalid();
    } catch {
      invalid();
    }
  }
  const inspected = ['published', 'completed_without_findings'].includes(result.inspectionStatus);
  if (inspected && (!result.requestId || !result.requestUrl || !result.itemUrl)) invalid();
  const outcome = inspected && result.labelStatus === 'applied' ? 'success' : 'partial';
  const identity = (id, url) => {
    const label = (id ?? 'Unavailable').replace(/[\\[\]*_`]/g, '\\$&');
    return url ? `[${label}](${url.replace(/[()\s]/g, (char) => encodeURIComponent(char).replace('(', '%28').replace(')', '%29'))})` : label;
  };
  const { details, ...states } = result;
  return {
    deliveryResult: { ...states, outcome },
    text: `## Inspect result\n\n**Request ${identity(result.requestId, result.requestUrl)}:** ${inspectionStatuses[result.inspectionStatus]}\n**Item ${identity(result.itemId, result.itemUrl)}:** ${labelStatuses[result.labelStatus]}${details.trim() ? `\n\n${details.trim()}` : ''}`,
  };
}

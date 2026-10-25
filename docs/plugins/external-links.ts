interface Attribute {
  type: string;
  name?: string;
  value?: unknown;
}

interface Node {
  type: string;
  tagName?: string;
  name?: string | null;
  properties?: Record<string, unknown>;
  attributes?: Attribute[];
  children?: Node[];
}

function safeRel(value: unknown): string {
  const tokens = String(Array.isArray(value) ? value.join(' ') : value ?? '')
    .split(/\s+/).filter((token) => token && token.toLowerCase() !== 'opener');
  return [...new Set([...tokens, 'noopener', 'noreferrer'])].join(' ');
}

export default function externalLinks({ site }: { site: string }) {
  const origin = new URL(site).origin;

  function isExternal(href: unknown): boolean {
    if (typeof href !== 'string') return false;
    try {
      const url = new URL(href, site);
      return ['http:', 'https:'].includes(url.protocol) && url.origin !== origin;
    } catch {
      return false;
    }
  }

  function transform(node: Node): void {
    if (node.type === 'element' && node.tagName === 'a' && node.properties) {
      if (isExternal(node.properties.href)) {
        node.properties.target = '_blank';
        node.properties.rel = safeRel(node.properties.rel).split(' ');
      }
    } else if (
      ['mdxJsxFlowElement', 'mdxJsxTextElement'].includes(node.type) &&
      node.name === 'a' && node.attributes
    ) {
      const attributes = node.attributes;
      const href = attributes.find((attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'href');
      if (isExternal(href?.value)) {
        const rel = attributes.find((attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'rel');
        node.attributes = attributes.filter((attr) => !['target', 'rel'].includes(attr.name ?? ''));
        node.attributes.push(
          { type: 'mdxJsxAttribute', name: 'target', value: '_blank' },
          { type: 'mdxJsxAttribute', name: 'rel', value: safeRel(rel?.value) },
        );
      }
    }
    node.children?.forEach(transform);
  }

  return transform;
}

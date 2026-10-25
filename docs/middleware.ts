import { defineMiddleware } from 'astro:middleware'
import { parse, serialize, type DefaultTreeAdapterMap } from 'parse5'

// Transform rendered HTML so Markdown, embedded HTML, and computed MDX links
// share the same rule: https://docs.astro.build/en/guides/middleware/#modifying-the-response
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next()
  if (!response.headers.get('content-type')?.includes('text/html')) return response

  const document = parse(await response.text())
  const site = context.site ?? context.url

  function visit(node: DefaultTreeAdapterMap['node']) {
    if ('tagName' in node && node.tagName === 'a') {
      const href = node.attrs.find((attribute) => attribute.name === 'href')?.value
      let url: URL | undefined
      try {
        url = href ? new URL(href, site) : undefined
      } catch {
        // Leave malformed URLs unchanged.
      }
      if (url && ['http:', 'https:'].includes(url.protocol) && url.origin !== site.origin) {
        const target = node.attrs.find((attribute) => attribute.name === 'target')
        if (target) target.value = '_blank'
        else node.attrs.push({ name: 'target', value: '_blank' })

        const rel = node.attrs.find((attribute) => attribute.name === 'rel')
        const tokens = new Set(rel?.value.split(/\s+/).filter(Boolean))
        tokens.add('noopener')
        tokens.add('noreferrer')
        const value = [...tokens].join(' ')
        if (rel) rel.value = value
        else node.attrs.push({ name: 'rel', value })
      }
    }
    if ('childNodes' in node) node.childNodes.forEach(visit)
  }

  visit(document)
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  return new Response(serialize(document), {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
})

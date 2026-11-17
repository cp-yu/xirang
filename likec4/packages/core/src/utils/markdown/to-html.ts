import defu from 'defu'
import type { Root, RootContent } from 'hast'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

function parser(contract = false) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAlert)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(
      rehypeSanitize,
      defu(
        {
          attributes: {
            '*': [
              'className',
            ],
            'svg': [
              'width',
              'height',
              'viewBox',
              'fill',
              'ariaHidden',
            ],
            'path': ['d', 'fill', 'stroke', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin'],
          },
          tagNames: [
            'svg',
            'g',
            'path',
            'div',
          ],
          protocols: {
            src: ['data'],
          },
        },
        defaultSchema,
      ),
    )
    .use(() => (tree: Root) => {
      if (!contract) return
      const links: Extract<RootContent, { type: 'element' }>[] = []
      const used = new Set<string>()
      const plain = (node: RootContent): string => 'value' in node && typeof node.value === 'string'
        ? node.value : 'children' in node ? node.children.map(plain).join('') : ''
      const visit = (node: Root | RootContent): void => {
        if (node.type === 'element') {
          if (node.tagName === 'a' && !Object.hasOwn(node.properties, 'dataFootnoteRef') && !Object.hasOwn(node.properties, 'dataFootnoteBackref')) {
            links.push(node)
          }
          if (/^h[1-6]$/.test(node.tagName)) {
            const title = plain(node)
            const base = title.toLowerCase().replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, '').replace(/\s/g, '-')
            let slug = base
            let suffix = 0
            while (used.has(slug)) slug = `${base}-${++suffix}`
            used.add(slug)
            node.properties['data-xirang-heading'] = slug
            node.properties['data-xirang-title'] = title
          }
        }
        if ('children' in node) node.children.forEach(visit)
      }
      visit(tree)
      // Footnotes render after the body; retain the original Markdown occurrence order.
      links.sort((a, b) => (a.position?.start.offset ?? Infinity) - (b.position?.start.offset ?? Infinity))
        .forEach((node, index) => { node.properties['data-xirang-link'] = index })
    })
    .use(rehypeStringify, {
      allowDangerousHtml: true,
    })
}

export function markdownToHtml(markdown: string): string {
  return ('' + parser().processSync(markdown)).trim()
}

/** Contract-only navigation markers are added after sanitization; source HTML stays untrusted. */
export function markdownToContractHtml(markdown: string): string {
  return ('' + parser(true).processSync(markdown)).trim()
}

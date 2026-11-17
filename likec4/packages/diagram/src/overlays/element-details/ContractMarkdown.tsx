import { markdownToContractHtml } from '@likec4/core/utils'
import { markdownBlock } from '@likec4/styles/recipes'
import { Box, Text } from '@mantine/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { XirangContractContent } from '../../xirang/ContractLoaderContext'

export function ContractMarkdown({ content, navigation, onNavigate }: {
  content: XirangContractContent
  navigation?: { fragment?: string } | null | undefined
  onNavigate: (element: string, fragment?: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [message, setMessage] = useState('')
  const html = useMemo(() => markdownToContractHtml(content.md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')), [content.md])

  const locate = (target: string) => {
    const headings = Array.from(ref.current?.querySelectorAll<HTMLElement>('[data-xirang-heading]') ?? [])
    const heading = headings.find(h => h.dataset['xirangHeading'] === target)
      ?? headings.find(h => h.dataset['xirangTitle'] === target)
    setMessage(heading ? '' : '未找到定位位置')
    heading?.scrollIntoView({ block: 'start' })
  }

  useEffect(() => {
    setMessage('')
    if (navigation?.fragment) locate(navigation.fragment)
  }, [content, navigation])

  return (
    <>
      {message && <Text role="status" size="sm" c="orange">{message}</Text>}
      <Box
        ref={ref}
        className={markdownBlock({ value: 'markdown' })}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={event => {
          const anchor = (event.target as Element).closest<HTMLAnchorElement>('a')
          if (!anchor || !ref.current?.contains(anchor)) return
          if (!anchor.hasAttribute('data-xirang-link')) {
            const href = anchor.getAttribute('href')
            if (href?.startsWith('#')) {
              event.preventDefault()
              const target = document.getElementById(href.slice(1))
              if (target && ref.current.contains(target)) target.scrollIntoView({ block: 'start' })
            }
            return
          }
          const index = Number(anchor.dataset['xirangLink'])
          const link = content.links?.[index]
          if (link?.external) return
          // Legacy/unmapped local links must never fall through into the diagram router.
          if (!link && /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(anchor.getAttribute('href') ?? '')) return
          event.preventDefault()
          event.stopPropagation()
          if (!link?.element) {
            setMessage('无法定位引用目标')
            return
          }
          setMessage('')
          if (link.element === content.element) {
            if (link.fragment) locate(link.fragment)
            else ref.current.parentElement?.scrollTo({ top: 0 })
          } else {
            onNavigate(link.element, link.fragment)
          }
        }}
      />
    </>
  )
}

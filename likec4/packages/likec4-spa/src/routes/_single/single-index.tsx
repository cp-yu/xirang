// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { Link } from '@tanstack/react-router'

import { StaticLikeC4Diagram, type XirangViewSource, useXirangViewSources } from '@likec4/diagram'
import { useEffect, useState, type PropsWithChildren } from 'react'

import type { DiagramView } from '@likec4/core/types'
import { RichText } from '@likec4/core/types'
import { Markdown, NavigationPanel } from '@likec4/diagram/custom'
import { css } from '@likec4/styles/css'
import { Badge, Box, Burger, Card, Container, Group, SimpleGrid, Text } from '@mantine/core'
import { useDocumentTitle, useInViewport } from '@mantine/hooks'
import { pageTitle } from 'likec4:app-config'
import { randomInteger } from 'remeda'
import { ColorSchemeToggle } from '../../components/ColorSchemeToggle'
import { OverviewSearch } from '../../components/search/OverviewSearch'
import { SidebarDrawer } from '../../components/sidebar/Drawer'
import { SidebarDrawerOps } from '../../components/sidebar/state'
import { filterLandingPageViews } from '../../filterLandingPageViews'
import { useCurrentProject, useLikeC4Views } from '../../hooks'
import * as styles from './index.css'

export const Route = createFileRoute('/_single/single-index')({
  component: RouteComponent,
})

function RouteComponent() {
  const allViews = useLikeC4Views()
  const { landingPage, title: projectTitle } = useCurrentProject()
  useDocumentTitle(projectTitle ?? pageTitle)
  const views = filterLandingPageViews(allViews, landingPage)
  const runtime = useXirangViewSources()
  const navigate = useNavigate()
  const candidate = runtime.candidate
  const changes = runtime.changes
  return (
    <Container size={'xl'}>
      <SidebarDrawer />
      <div
        className={css({
          containerName: 'likec4-root',
          containerType: 'inline-size',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: 'xs',
          gap: 'xs',
          position: 'sticky',
          top: '0',
          zIndex: '10',
          backgroundColor: 'likec4.panel.bg/85',
          backdropFilter: 'blur(8px)',
        })}
      >
        <NavigationPanel.Root css={{ position: 'relative', width: 'max-content', margin: '0' }}>
          <NavigationPanel.Body>
            <div style={{ width: 0, height: 36 }} aria-hidden />
            <Burger size="sm" onClick={SidebarDrawerOps.open} aria-label="Toggle navigation" />
            <NavigationPanel.Logo
              css={{ flexShrink: 0 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
            <OverviewSearch />
          </NavigationPanel.Body>
        </NavigationPanel.Root>
        <NavigationPanel.Root panelPosition="right" css={{ position: 'relative', margin: '0' }}>
          <NavigationPanel.Body>
            <div style={{ display: 'flex', alignItems: 'center', minHeight: 36 }}>
              <ColorSchemeToggle />
            </div>
          </NavigationPanel.Body>
        </NavigationPanel.Root>
      </div>
      <Text size="lg" fw={600} mt="md" mb="xs">Views</Text>
      <CardGrid>
        {views.map((v) => <ViewCard key={v.id} view={v} />)}
      </CardGrid>
      {candidate && (
        <>
          <Text size="lg" fw={600} mt="xl" mb="xs">Candidate</Text>
          <CardGrid>
            <SourceCard
              key={candidate.id}
              source={candidate}
              onOpen={() => void navigate({
                to: '/view/$viewId/',
                params: { viewId: 'full-model' },
                search: previous => {
                  const next = { ...previous, view: 'full-model', model: 'candidate' }
                  delete next.mode
                  return next
                },
              })}
            />
          </CardGrid>
        </>
      )}
      {changes.length > 0 && (
        <>
          <Text size="lg" fw={600} mt="xl" mb="xs">Active Changes</Text>
          <CardGrid>
            {changes.map(c => (
              <SourceCard
                key={c.change}
                source={c}
                onOpen={() => void navigate({
                  to: '/view/$viewId/',
                  params: { viewId: 'full-model' },
                  search: previous => ({ ...previous, view: 'full-model', model: `change:${c.change}`, mode: 'diff-only' }),
                })}
              />
            ))}
          </CardGrid>
        </>
      )}
    </Container>
  )
}

function CardGrid({ children }: PropsWithChildren<{}>) {
  return (
    <SimpleGrid
      p={{ base: 'md', sm: 'md' }}
      pt={{ base: 'sm', sm: 'sm' }}
      cols={{ base: 1, sm: 2, md: 3, xl: 4 }}
      spacing={{ base: 10, sm: 'xl' }}
      verticalSpacing={{ base: 'md', sm: 'xl' }}
    >
      {children}
    </SimpleGrid>
  )
}

function ViewCard({ view }: { view: DiagramView }) {
  const [visible, setVisible] = useState(false)
  const { ref, inViewport } = useInViewport()

  // Deferred rendering to avoid initial freeze
  useEffect(() => {
    if (!inViewport || visible) return
    const tm = setTimeout(() => setVisible(true), randomInteger(30, 80))
    return () => clearTimeout(tm)
  }, [inViewport, visible])

  return (
    <Card
      ref={ref}
      shadow="xs"
      padding="lg"
      radius="sm"
      className="group"
      withBorder>
      <Card.Section>
        <Box className={styles.previewBg} style={{ height: 200 }}>
          {visible && (
            <StaticLikeC4Diagram
              background={'transparent'}
              view={view}
              fitView
              fitViewPadding={'4px'}
              reduceGraphics
            />
          )}
        </Box>
      </Card.Section>

      <Group justify="space-between" mt="md">
        <Text fw={500}>{view.title ?? view.id}</Text>
      </Group>

      <Markdown
        value={RichText.from(view.description)}
        textScale={0.75}
        emptyText="No description"
        className={css({
          lineClamp: 3,
          mt: '1',
          transition: 'fast',
          opacity: {
            base: 0.8,
            _groupHover: 1,
          },
        })}
      />
      <Link to={'/view/$viewId/'} params={{ viewId: view.id }} search className={styles.cardLink}></Link>
    </Card>
  )
}

function SourceCard({
  source,
  onOpen,
}: {
  source: Pick<XirangViewSource, 'label' | 'valid' | 'diagnostics' | 'diff'>
  onOpen: () => void
}) {
  const counts = source.diff?.summary
  const errorDiagnostics = source.diagnostics.filter(d => d.level === 'ERROR')

  return (
    <Card
      shadow="xs"
      padding="lg"
      radius="sm"
      className="group"
      withBorder
      component="a"
      href={`/view/full-model/`}
      onClick={e => {
        e.preventDefault()
        onOpen()
      }}
      style={{ cursor: 'pointer' }}
    >
      <Group justify="space-between" mt="0" mb="sm">
        <Text fw={500}>{source.label}</Text>
        <Badge size="sm" color={source.valid ? 'green' : 'red'}>{source.valid ? 'Valid' : 'Invalid'}</Badge>
      </Group>

      <Group gap="xs" mb="xs">
        {counts && counts.ADDED > 0 && <Badge size="sm" color="green">+{counts.ADDED}</Badge>}
        {counts && counts.MODIFIED > 0 && <Badge size="sm" color="yellow">~{counts.MODIFIED}</Badge>}
        {counts && counts.REMOVED > 0 && <Badge size="sm" color="red">-{counts.REMOVED}</Badge>}
      </Group>

      {errorDiagnostics.map((d, i) => (
        <Text key={i} size="xs" c="red" className={css({ lineClamp: 2 })}>{d.message}</Text>
      ))}

      {errorDiagnostics.length === 0 && counts && counts.total === 0 && (
        <Text size="xs" c="dimmed">No semantic graph changes</Text>
      )}
    </Card>
  )
}

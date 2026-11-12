import { ActionIcon, Tooltip } from '@mantine/core'
import { IconMap2, IconX } from '@tabler/icons-react'
import { MiniMap } from '@xyflow/react'
import { useCallback, useState } from 'react'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { minimapNodeStyle } from '../xirang/browserChromeModel'
import type { XirangDiffOperation } from '../xirang/ContractLoaderContext'
import type { Types } from './types'

const MINIMAP_WIDTH = 200
const MINIMAP_HEIGHT = 140
const PANEL_MARGIN = 15
/** Keeps the minimap above the Notation panel when that panel occupies the bottom-right corner. */
const NOTATION_CLEARANCE = 56

const operationOf = (node: Types.AnyNode): XirangDiffOperation | undefined =>
  (node.data as { xirang?: { operation?: XirangDiffOperation } }).xirang?.operation

const isCompound = (node: Types.AnyNode) => node.type === 'compound-element' || node.type === 'compound-deployment'

const nodeColor = (node: Types.AnyNode) => minimapNodeStyle(operationOf(node), isCompound(node)).fill
const nodeStrokeColor = (node: Types.AnyNode) => minimapNodeStyle(operationOf(node), isCompound(node)).stroke

/** Narrow screens start with the minimap hidden: it would cover the canvas. */
const startsHidden = () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 48em)').matches === true

/**
 * Interactive-only overview of the whole projection. Click and drag inside it pans the canvas; the
 * toggle collapses it into a single button. Never rendered for static (export) views.
 */
export function XirangMinimap() {
  const { enableNotations } = useEnabledFeatures()
  const [hidden, setHidden] = useState(startsHidden)
  const toggle = useCallback(() => setHidden(value => !value), [])
  const bottom = PANEL_MARGIN + (enableNotations ? NOTATION_CLEARANCE : 0)

  return (
    <>
      {!hidden && (
        <MiniMap<Types.AnyNode>
          pannable
          zoomable
          nodeColor={nodeColor}
          nodeStrokeColor={nodeStrokeColor}
          nodeStrokeWidth={3}
          nodeBorderRadius={2}
          bgColor="var(--mantine-color-body)"
          maskColor="rgba(134, 142, 150, 0.22)"
          maskStrokeColor="var(--mantine-color-blue-filled)"
          maskStrokeWidth={2}
          ariaLabel="Diagram minimap"
          style={{
            width: MINIMAP_WIDTH,
            height: MINIMAP_HEIGHT,
            marginBottom: bottom,
            pointerEvents: 'all',
            borderRadius: 6,
            overflow: 'hidden',
            border: '1px solid var(--mantine-color-default-border)',
          }}
          data-xirang-minimap
        />
      )}
      <Tooltip label={hidden ? 'Show minimap' : 'Hide minimap'} position="left" withArrow>
        <ActionIcon
          size={hidden ? 'lg' : 'sm'}
          variant={hidden ? 'default' : 'subtle'}
          color="gray"
          aria-label={hidden ? 'Show minimap' : 'Hide minimap'}
          aria-pressed={!hidden}
          data-xirang-minimap-toggle
          onClick={toggle}
          style={{
            position: 'absolute',
            zIndex: 6,
            pointerEvents: 'all',
            right: PANEL_MARGIN + (hidden ? 0 : 4),
            bottom: hidden ? bottom : bottom + MINIMAP_HEIGHT - 26,
          }}
        >
          {hidden ? <IconMap2 size={18} /> : <IconX size={14} />}
        </ActionIcon>
      </Tooltip>
    </>
  )
}

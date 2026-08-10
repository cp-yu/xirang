// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { Fqn, NodeId } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import {
  type ElementTagsProps,
  CompoundDetailsButton,
  CompoundNodeContainer,
  CompoundTitle,
  DefaultHandles,
  ElementData,
  ElementDetailsButton,
  ElementNodeContainer,
  ElementShape,
  ElementTags as ElementTagsPrimitive,
} from '../../../base-primitives'
import type { BaseNodeData } from '../../../base/types'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useCallbackRef } from '../../../hooks'
import { useDiagram } from '../../../hooks/useDiagram'
import type { Types } from '../../types'
import type { XirangDiffOperation } from '../../../xirang/ContractLoaderContext'
import { CompoundActions } from './CompoundActions'
import { DeploymentElementActions, ElementActions } from './ElementActions'
import { NodeDrifts } from './NodeDrifts'
import { NodeNotes } from './NodeNotes'
import { CompoundDeploymentToolbar, CompoundElementToolbar } from './toolbar/CompoundToolbar'
import { DeploymentElementToolbar, ElementToolbar } from './toolbar/ElementToolbar'

function ElementTags(props: ElementTagsProps) {
  const diagram = useDiagram()

  return (
    <ElementTagsPrimitive
      onTagClick={useCallbackRef((tag) => {
        diagram.openSearch(tag)
      })}
      onTagMouseEnter={useCallbackRef((tag) => {
        diagram.send({ type: 'tag.highlight', tag })
      })}
      onTagMouseLeave={useCallbackRef((_tag) => {
        diagram.send({ type: 'tag.unhighlight' })
      })}
      {...props}
    />
  )
}

export function ElementDetailsButtonWithHandler(
  props: {
    id: string
    selected?: boolean
    data: BaseNodeData & {
      modelFqn?: Fqn | null | undefined
    }
  },
) {
  const diagram = useDiagram()
  const fqn = props.data.modelFqn

  if (!fqn) return null

  return (
    <ElementDetailsButton
      {...props}
      onClick={e => {
        e.stopPropagation()
        diagram.openElementDetails(fqn, props.id as NodeId)
      }} />
  )
}

export function CompoundDetailsButtonWithHandler(
  props: Types.NodeProps<'compound-deployment' | 'compound-element'>,
) {
  const diagram = useDiagram()
  const fqn = props.data.modelFqn

  if (!fqn) return null

  return (
    <CompoundDetailsButton
      {...props}
      onClick={e => {
        e.stopPropagation()
        diagram.openElementDetails(fqn, props.id as NodeId)
      }} />
  )
}

/**
 * Renders an element node.
 */
export function ElementNode(props: Types.NodeProps<'element'>) {
  const { enableElementTags, enableElementDetails, enableReadOnly, enableCompareWithLatest, enableNotes } =
    useEnabledFeatures()
  return (
    <>
      <NodeDiffBadge operation={props.data.xirang?.operation} />
      <ElementNodeContainer
        className={diffOutlineByOperation(props.data.xirang?.operation)}
        nodeProps={props}
      >
        {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
        <ElementShape {...props} />
        <ElementData {...props} aria-hidden />
        {enableElementTags && <ElementTags {...props} />}
        <ElementActions {...props} />
        {enableElementDetails && <ElementDetailsButtonWithHandler {...props} />}
        {!enableReadOnly && <ElementToolbar {...props} />}
        {enableNotes && <NodeNotes {...props} />}
        <DefaultHandles direction={props.data.viewLayoutDir} />
      </ElementNodeContainer>
    </>
  )
}

export function DeploymentNode(props: Types.NodeProps<'deployment'>) {
  const { enableElementTags, enableElementDetails, enableReadOnly, enableCompareWithLatest, enableNotes } =
    useEnabledFeatures()
  return (
    <>
      <NodeDiffBadge operation={props.data.xirang?.operation} />
      <ElementNodeContainer
        className={diffOutlineByOperation(props.data.xirang?.operation)}
        nodeProps={props}
      >
        {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
        <ElementShape {...props} />
        <ElementData {...props} aria-hidden />
        {enableElementTags && <ElementTags {...props} />}
        <DeploymentElementActions {...props} />
        {enableElementDetails && <ElementDetailsButtonWithHandler {...props} />}
        {!enableReadOnly && <DeploymentElementToolbar {...props} />}
        {enableNotes && <NodeNotes {...props} />}
        <DefaultHandles direction={props.data.viewLayoutDir} />
      </ElementNodeContainer>
    </>
  )
}

const compoundHasDrifts = css({
  outlineColor: 'likec4.compare.manual.outline',
  outlineWidth: '4px',
  outlineStyle: 'dashed',
  outlineOffset: '1.5',
})

const outlineBase = css({
  outlineColor: '[#ff9f0a]',
  outlineOffset: '2',
})

const diffOutline = {
  ADDED: css({
    outlineWidth: '3px',
    outlineStyle: 'dotted',
  }),
  MODIFIED: css({
    outlineWidth: '5px',
    outlineStyle: 'solid',
  }),
  REMOVED: css({
    outlineWidth: '3px',
    outlineStyle: 'dashed',
  }),
} satisfies Record<XirangDiffOperation, string>

const diffOutlineByOperation = (operation: XirangDiffOperation | undefined) =>
  operation ? cx(outlineBase, diffOutline[operation]) : undefined

const nodeDiffBadge = css({
  position: 'absolute',
  top: '[6px]',
  left: '[6px]',
  minWidth: '[24px]',
  height: '[24px]',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '[2px solid #ffffff]',
  borderRadius: '[6px]',
  backgroundColor: '[#ff9f0a]',
  color: '[#ffffff]',
  fontSize: '[16px]',
  fontWeight: '[800]',
  lineHeight: '[1]',
  pointerEvents: 'none',
  zIndex: '[20]',
  boxShadow: '[0 1px 3px rgba(0, 0, 0, 0.35)]',
})

const diffBadgeGlyph: Record<XirangDiffOperation, string> = {
  ADDED: '+',
  MODIFIED: '~',
  REMOVED: '−',
}

/**
 * Renders a corner badge for changed nodes. It sits outside the node container so it stays
 * fully opaque even when the container itself is dimmed (e.g. a 45% REMOVED ghost).
 */
function NodeDiffBadge({ operation }: { operation: XirangDiffOperation | undefined }) {
  if (!operation) return null
  return (
    <span className={nodeDiffBadge} data-xirang-node-diff aria-label={`Element ${operation}`}>
      {diffBadgeGlyph[operation]}
    </span>
  )
}

const hasDrifts = (props: Types.NodeProps) => {
  return props.data.drifts && props.data.drifts.length > 0
}

export function CompoundElementNode(props: Types.NodeProps<'compound-element'>) {
  const { enableElementDetails, enableReadOnly, enableCompareWithLatest } = useEnabledFeatures()
  const showDrifts = enableCompareWithLatest && hasDrifts(props)
  return (
    <>
      <NodeDiffBadge operation={props.data.xirang?.operation} />
      <CompoundNodeContainer
        className={cx(showDrifts && compoundHasDrifts, diffOutlineByOperation(props.data.xirang?.operation))}
        nodeProps={props}
      >
        {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
        <CompoundTitle {...props} aria-hidden />
        <CompoundActions {...props} />
        {enableElementDetails && <CompoundDetailsButtonWithHandler {...props} />}
        {!enableReadOnly && <CompoundElementToolbar {...props} />}
        <DefaultHandles direction={props.data.viewLayoutDir} />
      </CompoundNodeContainer>
    </>
  )
}

export function CompoundDeploymentNode(props: Types.NodeProps<'compound-deployment'>) {
  const { enableElementDetails, enableReadOnly, enableCompareWithLatest } = useEnabledFeatures()
  const showDrifts = enableCompareWithLatest && hasDrifts(props)
  return (
    <>
      <NodeDiffBadge operation={props.data.xirang?.operation} />
      <CompoundNodeContainer
        className={cx(showDrifts && compoundHasDrifts, diffOutlineByOperation(props.data.xirang?.operation))}
        nodeProps={props}
      >
        {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
        <CompoundTitle {...props} aria-hidden />
        <CompoundActions {...props} />
        {enableElementDetails && <CompoundDetailsButtonWithHandler {...props} />}
        {!enableReadOnly && <CompoundDeploymentToolbar {...props} />}
        <DefaultHandles direction={props.data.viewLayoutDir} />
      </CompoundNodeContainer>
    </>
  )
}

export function ViewGroupNode(props: Types.NodeProps<'view-group'>) {
  const { enableCompareWithLatest } = useEnabledFeatures()
  const showDrifts = enableCompareWithLatest && hasDrifts(props)
  return (
    <CompoundNodeContainer
      className={showDrifts ? compoundHasDrifts : undefined}
      nodeProps={props}
    >
      {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
      <CompoundTitle {...props} aria-hidden />
      <DefaultHandles direction={props.data.viewLayoutDir} />
    </CompoundNodeContainer>
  )
}

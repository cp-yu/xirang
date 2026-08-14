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
import type { XirangRequirementCounts } from '../../../xirang/projectionNode'
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
      <NodeDiffBadge counts={props.data.xirang?.requirementCounts} />
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
      <NodeDiffBadge counts={props.data.xirang?.requirementCounts} />
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

const nodeDiffBadges = css({
  position: 'absolute',
  top: '[6px]',
  left: '[6px]',
  display: 'flex',
  alignItems: 'center',
  gap: '[4px]',
  pointerEvents: 'none',
  zIndex: '[20]',
})

const nodeDiffBadge = css({
  minWidth: '[24px]',
  height: '[24px]',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '[0 6px]',
  border: '[2px solid #ffffff]',
  borderRadius: '[6px]',
  color: '[#ffffff]',
  fontSize: '[16px]',
  fontWeight: '[800]',
  lineHeight: '[1]',
  boxShadow: '[0 1px 3px rgba(0, 0, 0, 0.35)]',
})

const requirementCountBadges = [
  { key: 'added', glyph: '+', color: '#2f9e44', label: 'Added requirements' },
  { key: 'modified', glyph: '~', color: '#ff9f0a', label: 'Modified requirements' },
  { key: 'removed', glyph: '−', color: '#e03131', label: 'Removed requirements' },
] as const

/**
 * 渲染 requirement 级变更计数徽章（`+N`/`~N`/`−N`）。三色区分，同一节点可并排多个，仅非零项可见。
 * 徽章容器独立于节点容器，即使容器被 dim（如 45% ghost）徽章仍保持完全不透明。
 */
export function NodeDiffBadge({ counts }: { counts: XirangRequirementCounts | undefined }) {
  if (!counts) return null
  const badges = requirementCountBadges.filter(item => counts[item.key] > 0)
  if (badges.length === 0) return null
  return (
    <span className={nodeDiffBadges}>
      {badges.map(item => (
        <span
          key={item.key}
          className={nodeDiffBadge}
          style={{ backgroundColor: item.color }}
          data-xirang-node-diff
          aria-label={`${counts[item.key]} ${item.label}`}>
          {item.glyph}{counts[item.key]}
        </span>
      ))}
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
      <NodeDiffBadge counts={props.data.xirang?.requirementCounts} />
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
      <NodeDiffBadge counts={props.data.xirang?.requirementCounts} />
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

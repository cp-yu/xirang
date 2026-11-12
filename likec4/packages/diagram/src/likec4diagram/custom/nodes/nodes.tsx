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
import { compoundFillOpacity, diffMarkScale } from '../../../base-primitives/lod/lodMath'
import { useCompoundLevel, useCompoundTitleFontSize, useElementLod, useQuantizedZoom } from '../../../hooks/useZoomLod'
import type { XirangDiffOperation } from '../../../xirang/ContractLoaderContext'
import type { XirangRequirementCounts } from '../../../xirang/projectionNode'
import {
  DIFF_OPERATION_COLOR,
  DIFF_OPERATION_GLYPH,
  diffOutlineStyle,
  elementOperationLabel,
  requirementCountBadges,
  sectionCountLabel,
} from './diffMarks'
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
  const lod = useElementLod(props.data)
  const diffScale = useDiffMarkScale()
  const operation = props.data.xirang?.operation
  return (
    <>
      <NodeDiffBadge operation={operation} counts={props.data.xirang?.requirementCounts} scale={diffScale} />
      <ElementNodeContainer
                style={operation ? diffOutlineStyle(operation, diffScale) : undefined}
        nodeProps={props}
      >
        {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
        <ElementShape {...props} />
        <ElementData {...props} lod={lod} aria-hidden />
        {enableElementTags && lod.level === 'detail' && <ElementTags {...props} />}
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
  const lod = useElementLod(props.data)
  const diffScale = useDiffMarkScale()
  const operation = props.data.xirang?.operation
  return (
    <>
      <NodeDiffBadge operation={operation} counts={props.data.xirang?.requirementCounts} scale={diffScale} />
      <ElementNodeContainer
                style={operation ? diffOutlineStyle(operation, diffScale) : undefined}
        nodeProps={props}
      >
        {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
        <ElementShape {...props} />
        <ElementData {...props} lod={lod} aria-hidden />
        {enableElementTags && lod.level === 'detail' && <ElementTags {...props} />}
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

/** Reverse-zoom scale for diff outlines and badges; changes only when the quantized zoom steps. */
function useDiffMarkScale(): number {
  return diffMarkScale(useQuantizedZoom())
}

const nodeDiffBadges = css({
  position: 'absolute',
  top: '[6px]',
  left: '[6px]',
  display: 'flex',
  alignItems: 'center',
  gap: '[4px]',
  pointerEvents: 'none',
  zIndex: '[20]',
  transformOrigin: 'top left',
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

const nodeOperationBadge = css({
  minWidth: '[28px]',
  height: '[28px]',
  fontSize: '[20px]',
  padding: '[0 4px]',
})

/**
 * 渲染节点 diff 徽章：左侧为 operation glyph（`+`/`~`/`−`，主徽章，表示该 element 自身被新增/修改/移除），
 * 右侧为 section 级变更计数（`+N`/`~N`/`−N`，次级徽章，带 “N sections added” 文案）。三色区分，仅非零项可见。
 * 徽章容器独立于节点容器，即使容器被 dim（如 45% ghost）徽章仍保持完全不透明；`scale` 为总览时的反向放大系数。
 */
export function NodeDiffBadge(
  { operation, counts, scale = 1 }: {
    operation?: XirangDiffOperation | undefined
    counts: XirangRequirementCounts | undefined
    scale?: number | undefined
  },
) {
  const countBadges = counts ? requirementCountBadges.filter(item => counts[item.key] > 0) : []
  if (!operation && countBadges.length === 0) return null
  return (
    <span className={nodeDiffBadges} style={scale > 1 ? { transform: `scale(${scale})` } : undefined}>
      {operation && (
        <span
          className={cx(nodeDiffBadge, nodeOperationBadge)}
          style={{ backgroundColor: DIFF_OPERATION_COLOR[operation] }}
          data-xirang-node-operation-badge={operation}
          role="img"
          title={elementOperationLabel(operation)}
          aria-label={elementOperationLabel(operation)}>
          {DIFF_OPERATION_GLYPH[operation]}
        </span>
      )}
      {counts && countBadges.map(item => {
        const label = sectionCountLabel(counts[item.key], item.verb)
        return (
          <span
            key={item.key}
            className={nodeDiffBadge}
            style={{ backgroundColor: item.color }}
            data-xirang-node-diff
            title={label}
            aria-label={label}>
            {item.glyph}{counts[item.key]}
          </span>
        )
      })}
    </span>
  )
}

const hasDrifts = (props: Types.NodeProps) => {
  return props.data.drifts && props.data.drifts.length > 0
}

export function CompoundElementNode(props: Types.NodeProps<'compound-element'>) {
  const { enableElementDetails, enableReadOnly, enableCompareWithLatest } = useEnabledFeatures()
  const showDrifts = enableCompareWithLatest && hasDrifts(props)
  const diffScale = useDiffMarkScale()
  const titleFontSize = useCompoundTitleFontSize(props.id, props.data.title, !!props.data.icon && props.data.icon !== 'none')
  const fillOpacity = compoundFillOpacity(props.data.style.opacity, useCompoundLevel(props.id))
  const operation = props.data.xirang?.operation
  return (
    <>
      <NodeDiffBadge operation={operation} counts={props.data.xirang?.requirementCounts} scale={diffScale} />
      <CompoundNodeContainer
        className={cx(showDrifts && compoundHasDrifts)}
        style={operation ? diffOutlineStyle(operation, diffScale) : undefined}
        fillOpacity={fillOpacity}
        nodeProps={props}
      >
        {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
        <CompoundTitle {...props} fontSize={titleFontSize} aria-hidden />
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
  const diffScale = useDiffMarkScale()
  const titleFontSize = useCompoundTitleFontSize(props.id, props.data.title, !!props.data.icon && props.data.icon !== 'none')
  const fillOpacity = compoundFillOpacity(props.data.style.opacity, useCompoundLevel(props.id))
  const operation = props.data.xirang?.operation
  return (
    <>
      <NodeDiffBadge operation={operation} counts={props.data.xirang?.requirementCounts} scale={diffScale} />
      <CompoundNodeContainer
        className={cx(showDrifts && compoundHasDrifts)}
        style={operation ? diffOutlineStyle(operation, diffScale) : undefined}
        fillOpacity={fillOpacity}
        nodeProps={props}
      >
        {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
        <CompoundTitle {...props} fontSize={titleFontSize} aria-hidden />
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
  const titleFontSize = useCompoundTitleFontSize(props.id, props.data.title, !!props.data.icon && props.data.icon !== 'none')
  const showDrifts = enableCompareWithLatest && hasDrifts(props)
  return (
    <CompoundNodeContainer
      className={showDrifts ? compoundHasDrifts : undefined}
      nodeProps={props}
    >
      {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
      <CompoundTitle {...props} fontSize={titleFontSize} aria-hidden />
      <DefaultHandles direction={props.data.viewLayoutDir} />
    </CompoundNodeContainer>
  )
}

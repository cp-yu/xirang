// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { Color, ComputedNodeStyle, NodeId } from '@likec4/core/types'
import { IconRenderer } from '../../context/IconRenderer'

type RequiredData = {
  id: NodeId
  title: string
  color: Color
  style: ComputedNodeStyle
  icon?: string | null
}

type CompoundTitleProps = {
  data: RequiredData
  /**
   * Opt-in: hide the title from assistive technologies. The main diagram sets
   * this because the compound node's accessible label already conveys the
   * title, so re-exposing it here would cause a duplicate announcement.
   */
  'aria-hidden'?: boolean | undefined
  /**
   * Title font size in px. When set the title is a single line truncated with an ellipsis,
   * so it never wraps over children or outside the compound border.
   */
  fontSize?: number | undefined
}

const singleLineEllipsis = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const

export function CompoundTitle({ data, fontSize, 'aria-hidden': ariaHidden }: CompoundTitleProps) {
  const elementIcon = IconRenderer({
    element: data,
    className: 'likec4-compound-icon',
  })

  return (
    <div className={'likec4-compound-title-container'} aria-hidden={ariaHidden}>
      {elementIcon}
      <div
        className={'likec4-compound-title'}
        style={fontSize === undefined ? undefined : { ...singleLineEllipsis, fontSize: `${fontSize}px` }}>
        {data.title}
      </div>
    </div>
  )
}

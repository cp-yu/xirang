// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { NodeId } from '@likec4/core'
import { IconChevronUp } from '@tabler/icons-react'
import { CompoundActionButton } from '../../../base-primitives'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { Types } from '../../types'

type CompoundActionsProps = Types.NodeProps<'compound-deployment' | 'compound-element'>

const collapseChildrenIcon = <IconChevronUp />

export const CompoundActions = (props: CompoundActionsProps) => {
  const { enableNavigateTo } = useEnabledFeatures()
  const diagram = useDiagram()

  const { navigateTo, xirang } = props.data
  if (xirang?.operation === 'ADDED' && xirang.hasChildren) {
    return (
      <CompoundActionButton
        {...props}
        selected
        ariaLabel="Collapse children"
        icon={collapseChildrenIcon}
        onClick={(e) => {
          e.stopPropagation()
          diagram.send({ type: 'expand.toggle', identity: xirang.identity })
        }}
      />
    )
  }
  if (navigateTo && enableNavigateTo) {
    return (
      <CompoundActionButton
        ariaLabel="Navigate to view"
        onClick={(e) => {
          e.stopPropagation()
          diagram.navigateTo(navigateTo, props.id as NodeId)
        }}
        {...props}
      />
    )
  }
  return null
}

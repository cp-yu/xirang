// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { type DiagramEdge, type DiagramNode, type DiagramView, GroupElementKind, scalar } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { diagramToXY, projectionViewportTransition } from './diagram-view'

type TestView = Pick<DiagramView, 'id' | 'nodes' | 'edges' | 'bounds' | '_type' | 'autoLayout'>

function testNode(id: string, overrides: Partial<DiagramNode> = {}): DiagramNode {
  const nodeId = scalar.NodeId(id)
  const node: DiagramNode = {
    id: nodeId,
    parent: null,
    children: [],
    inEdges: [],
    outEdges: [],
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    labelBBox: { x: 0, y: 0, width: 100, height: 24 },
    kind: 'component',
    modelRef: scalar.Fqn(id),
    title: id,
    description: null,
    technology: null,
    color: 'primary',
    shape: 'rectangle',
    style: {},
    level: 0,
    tags: [],
    ...overrides,
  }
  if (node.kind === GroupElementKind) {
    const { modelRef: _modelRef, deploymentRef: _deploymentRef, ...groupNode } = node
    return groupNode
  }
  return node
}

function testEdge(
  id: string,
  source: DiagramNode,
  target: DiagramNode,
  overrides: Partial<DiagramEdge> = {},
): DiagramEdge {
  return {
    id: scalar.EdgeId(id),
    parent: null,
    source: source.id,
    target: target.id,
    label: null,
    technology: null,
    relations: [],
    color: 'primary',
    line: 'solid',
    points: [
      [0, 0],
      [100, 100],
    ],
    ...overrides,
  }
}

function testView(nodes: DiagramNode[], edges: DiagramEdge[]): TestView {
  return {
    _type: 'element',
    id: scalar.ViewId('index'),
    autoLayout: { direction: 'TB' },
    bounds: { x: 0, y: 0, width: 1000, height: 1000 },
    nodes,
    edges,
  }
}

describe('projectionViewportTransition', () => {
  it('allows fit only for the initial projection', () => {
    const next = testView([testNode('a')], [])
    expect(projectionViewportTransition(null, next as DiagramView, { x: 0, y: 0, zoom: 1 }))
      .toEqual({ fit: true, viewport: null })
  })

  it('keeps the viewport unchanged for an incremental projection without an anchor', () => {
    const previous = testView([testNode('a')], [])
    const next = testView([testNode('a', { x: 500, y: 300 })], [])
    const viewport = { x: 20, y: 30, zoom: 1.5 }
    expect(projectionViewportTransition(previous as DiagramView, next as DiagramView, viewport))
      .toEqual({ fit: false, viewport })
  })

  it('compensates viewport movement to preserve an anchor screen position', () => {
    const previous = testView([testNode('a', { x: 100, y: 80 })], [])
    const next = testView([testNode('a', { x: 300, y: 180 })], [])
    expect(projectionViewportTransition(previous as DiagramView, next as DiagramView, { x: 40, y: 60, zoom: 2 }, 'a'))
      .toEqual({ fit: false, viewport: { x: -360, y: -140, zoom: 2 } })
  })
})

describe('diagramToXY Xirang projection data', () => {
  it('exposes semantic identity without requiring diff metadata', () => {
    const node = testNode('generated.fqn', { metadata: { elementId: 'semantic.identity' } })
    const { xynodes } = diagramToXY({ view: testView([node], []), currentViewId: undefined, where: null })

    expect(xynodes[0]?.domAttributes).toEqual({ 'data-xirang-identity': 'semantic.identity' })
  })

  it('projects ADDED metadata to node data and observable DOM attributes', () => {
    const added = testNode('test-entity', {
      metadata: {
        elementId: 'test-entity',
        xirangOperation: 'ADDED',
        xirangHasChildren: 'true',
      },
    })

    const { xynodes } = diagramToXY({
      view: testView([added], []),
      currentViewId: undefined,
      where: null,
    })

    expect(xynodes[0]).toMatchObject({
      data: {
        xirang: {
          identity: 'test-entity',
          operation: 'ADDED',
          hasChildren: true,
          expanded: false,
        },
      },
      domAttributes: {
        'data-xirang-operation': 'ADDED',
        'data-xirang-identity': 'test-entity',
      },
    })
  })
  it('projects Relationship diff metadata without changing business presentation', () => {
    const a = testNode('a')
    const b = testNode('b')
    const edge = testEdge('a-b', a, b, {
      color: 'purple',
      line: 'dotted',
      head: 'vee',
      metadata: { xirangOperation: 'MODIFIED', xirangRelation: 'a|calls|b' },
    } as never)
    const { xyedges } = diagramToXY({ view: testView([a, b], [edge]), currentViewId: undefined, where: null })
    expect(xyedges[0]?.data).toMatchObject({
      color: 'purple',
      line: 'dotted',
      head: 'vee',
      xirang: { operation: 'MODIFIED', relation: 'a|calls|b' },
    })
  })
})

describe('diagramToXY accessibility', () => {
  it('adds screen-reader labels to element nodes and relationship edges', () => {
    const customer = testNode('customer', {
      title: 'Customer',
      kind: 'actor',
      technology: 'Browser',
      description: { txt: 'Places orders' },
      navigateTo: scalar.ViewId('customer'),
    })
    const web = testNode('web', {
      title: 'Web Application',
      technology: 'React',
    })
    const relationship = testEdge('customer-web', customer, web, {
      label: 'uses',
      technology: 'HTTPS',
      notes: { txt: 'Authenticated traffic' },
      navigateTo: scalar.ViewId('customer-web'),
    })

    const { xynodes, xyedges } = diagramToXY({
      view: testView([customer, web], [relationship]),
      currentViewId: undefined,
      where: null,
    })

    expect(xynodes.find(n => n.id === 'customer')?.ariaLabel).toBe(
      'Customer. Node kind: actor. Technology: Browser. Description: Places orders. Opens view customer.',
    )
    expect(xyedges[0]?.ariaLabel).toBe(
      'Relationship from Customer to Web Application. Label: uses. Technology: HTTPS. Notes: Authenticated traffic. Opens view customer-web.',
    )
  })

  it('uses readable plain text in screen-reader labels', () => {
    const customer = testNode('customer', {
      title: '',
      description: { md: '**Places orders** with [checkout](https://example.com)' },
    })
    const web = testNode('web', {
      title: 'Web Application',
    })
    const relationship = testEdge('customer-web', customer, web, {
      notes: { md: '**Authenticated** traffic with [OAuth](https://example.com)' },
    })

    const { xynodes, xyedges } = diagramToXY({
      view: testView([customer, web], [relationship]),
      currentViewId: undefined,
      where: null,
    })

    expect(xynodes.find(n => n.id === 'customer')?.ariaLabel).toBe(
      'customer. Node kind: component. Description: Places orders with checkout.',
    )
    expect(xyedges[0]?.ariaLabel).toBe(
      'Relationship from customer to Web Application. Notes: Authenticated traffic with OAuth.',
    )
  })

  it('labels relationship descriptions and notes separately', () => {
    const customer = testNode('customer', {
      title: 'Customer',
    })
    const web = testNode('web', {
      title: 'Web Application',
    })
    const relationship = testEdge('customer-web', customer, web, {
      description: { txt: 'Uses checkout' },
      notes: { txt: 'Reviewed by architecture' },
    })

    const { xyedges } = diagramToXY({
      view: testView([customer, web], [relationship]),
      currentViewId: undefined,
      where: null,
    })

    expect(xyedges[0]?.ariaLabel).toBe(
      'Relationship from Customer to Web Application. Description: Uses checkout. Notes: Reviewed by architecture.',
    )
  })

  it('adds screen-reader labels to view groups', () => {
    const child = testNode('web', {
      parent: scalar.NodeId('group'),
      title: 'Web Application',
    })
    const group = testNode('group', {
      kind: GroupElementKind,
      title: 'Checkout',
      children: [child.id],
      notes: { txt: 'Important boundary' },
    })

    const { xynodes } = diagramToXY({
      view: testView([group, child], []),
      currentViewId: undefined,
      where: null,
    })

    expect(xynodes.find(n => n.id === 'group')?.ariaLabel).toBe(
      'Checkout. Group. Contains 1 node. Notes: Important boundary.',
    )
  })
})

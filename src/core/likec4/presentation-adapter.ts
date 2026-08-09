import type { NodeBorder, NodeColor, NodePresentation, NodeShape, RelationshipArrow, RelationshipColor, RelationshipLine, RelationshipPresentation } from '../model/types.js';

/** Xirang → LikeC4 presentation values. */
export function mapNodeShape(shape: NodeShape): string {
  return shape;
}

export function mapNodeColor(color: NodeColor): string {
  return color;
}

export function mapNodeBorder(border: NodeBorder): string {
  return border;
}

export function mapRelationshipColor(color: RelationshipColor): string {
  return color;
}

export function mapRelationshipLine(line: RelationshipLine): string {
  return line;
}

export function mapRelationshipArrow(arrow: RelationshipArrow): string {
  return arrow;
}

export interface LikeC4StyleBlock {
  shape?: string;
  color?: string;
  border?: string;
}

export interface LikeC4RelationshipStyle {
  color?: string;
  line?: string;
  head?: string;
  tail?: string;
}

export function toLikeC4Style(presentation: NodePresentation | undefined): LikeC4StyleBlock | undefined {
  if (!presentation) return undefined;
  const style: LikeC4StyleBlock = {};
  if (presentation.shape) style.shape = mapNodeShape(presentation.shape);
  if (presentation.color) style.color = mapNodeColor(presentation.color);
  if (presentation.border) style.border = mapNodeBorder(presentation.border);
  return Object.keys(style).length > 0 ? style : undefined;
}

/**
 * Canonical mapping from Xirang Relationship presentation to LikeC4 legal values.
 * Relationship styles are not lowered into specification.c4 (parallel relationships are
 * aggregated pre-layout); this mapping stays the single source of truth that keeps the
 * post-layout browser overlay values aligned with LikeC4's legal set.
 */
export function toLikeC4RelationshipStyle(presentation: RelationshipPresentation | undefined): LikeC4RelationshipStyle | undefined {
  if (!presentation) return undefined;
  const style: LikeC4RelationshipStyle = {};
  if (presentation.color) style.color = mapRelationshipColor(presentation.color);
  if (presentation.line) style.line = mapRelationshipLine(presentation.line);
  if (presentation.head) style.head = mapRelationshipArrow(presentation.head);
  if (presentation.tail) style.tail = mapRelationshipArrow(presentation.tail);
  return Object.keys(style).length > 0 ? style : undefined;
}
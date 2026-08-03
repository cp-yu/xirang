import type { NodeBorder, NodeColor, NodePresentation, NodeShape } from '../model/types.js';

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

export interface LikeC4StyleBlock {
  shape?: string;
  color?: string;
  border?: string;
}

export function toLikeC4Style(presentation: NodePresentation | undefined): LikeC4StyleBlock | undefined {
  if (!presentation) return undefined;
  const style: LikeC4StyleBlock = {};
  if (presentation.shape) style.shape = mapNodeShape(presentation.shape);
  if (presentation.color) style.color = mapNodeColor(presentation.color);
  if (presentation.border) style.border = mapNodeBorder(presentation.border);
  return Object.keys(style).length > 0 ? style : undefined;
}
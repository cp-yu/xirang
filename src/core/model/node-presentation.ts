import { NODE_BORDER_VALUES, NODE_COLOR_VALUES, NODE_SHAPE_VALUES, type NodePresentation } from './types.js';

export const NODE_PRESENTATION_FIELDS = ['shape', 'color', 'border'] as const;
export type NodePresentationField = (typeof NODE_PRESENTATION_FIELDS)[number];

const ALLOWED_FIELDS = new Set<string>(NODE_PRESENTATION_FIELDS);
const SHAPE_VALUES = new Set<string>(NODE_SHAPE_VALUES);
const COLOR_VALUES = new Set<string>(NODE_COLOR_VALUES);
const BORDER_VALUES = new Set<string>(NODE_BORDER_VALUES);

export interface NodePresentationValidation {
  /** raw is undefined/null: no presentation at all */
  absent: boolean;
  /** raw is not a YAML mapping */
  notMapping: boolean;
  /** unknown field names in YAML insertion order; callers sort if their message requires it */
  unknownFields: string[];
  /** field → invalid raw value, in fixed field order */
  invalidValues: Array<{ field: NodePresentationField; value: unknown }>;
  /** normalized valid values */
  presentation: NodePresentation;
}

/**
 * Single source of truth for `nodePresentation` shape validation. Returns structured results so the
 * model parser (accumulating `INVALID_NODE_PRESENTATION` diagnostics) and the framing payload
 * validator (throwing `INVALID_PAYLOAD`) can keep their own error contracts while sharing the same
 * mapping-ness, unknown-field and enum rules.
 */
export function validateNodePresentation(raw: unknown): NodePresentationValidation {
  if (raw === undefined || raw === null) {
    return { absent: true, notMapping: false, unknownFields: [], invalidValues: [], presentation: {} };
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { absent: false, notMapping: true, unknownFields: [], invalidValues: [], presentation: {} };
  }
  const obj = raw as Record<string, unknown>;
  const unknownFields = Object.keys(obj).filter(key => !ALLOWED_FIELDS.has(key));
  const invalidValues: Array<{ field: NodePresentationField; value: unknown }> = [];
  const presentation: NodePresentation = {};
  for (const field of NODE_PRESENTATION_FIELDS) {
    const value = obj[field];
    if (value === undefined) continue;
    const values = field === 'shape' ? SHAPE_VALUES
      : field === 'color' ? COLOR_VALUES
        : BORDER_VALUES;
    if (typeof value !== 'string' || !values.has(value)) {
      invalidValues.push({ field, value });
      continue;
    }
    presentation[field] = value as never;
  }
  return { absent: false, notMapping: false, unknownFields, invalidValues, presentation };
}

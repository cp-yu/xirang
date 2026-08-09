import {
  RELATIONSHIP_ARROW_VALUES,
  RELATIONSHIP_COLOR_VALUES,
  RELATIONSHIP_LINE_VALUES,
  type RelationshipPresentation,
} from './types.js';

export const RELATIONSHIP_PRESENTATION_FIELDS = ['color', 'line', 'head', 'tail'] as const;
export type RelationshipPresentationField = (typeof RELATIONSHIP_PRESENTATION_FIELDS)[number];

const ALLOWED_FIELDS = new Set<string>(RELATIONSHIP_PRESENTATION_FIELDS);
const COLOR_VALUES = new Set<string>(RELATIONSHIP_COLOR_VALUES);
const LINE_VALUES = new Set<string>(RELATIONSHIP_LINE_VALUES);
const ARROW_VALUES = new Set<string>(RELATIONSHIP_ARROW_VALUES);

export interface RelationshipPresentationValidation {
  /** raw is undefined/null: no presentation at all */
  absent: boolean;
  /** raw is not a YAML mapping */
  notMapping: boolean;
  /** unknown field names in YAML insertion order; callers sort if their message requires it */
  unknownFields: string[];
  /** field → invalid raw value, in fixed field order */
  invalidValues: Array<{ field: RelationshipPresentationField; value: unknown }>;
  /** normalized valid values */
  presentation: RelationshipPresentation;
}

/**
 * Single source of truth for Relationship Kind `presentation` validation. Returns structured
 * results so the model parser (accumulating `INVALID_RELATIONSHIP_PRESENTATION` diagnostics) and
 * framing payload validator (if needed) can keep their own error contracts while sharing the same
 * mapping-ness, unknown-field and enum rules.
 */
export function validateRelationshipPresentation(raw: unknown): RelationshipPresentationValidation {
  if (raw === undefined || raw === null) {
    return { absent: true, notMapping: false, unknownFields: [], invalidValues: [], presentation: {} };
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { absent: false, notMapping: true, unknownFields: [], invalidValues: [], presentation: {} };
  }
  const obj = raw as Record<string, unknown>;
  const unknownFields = Object.keys(obj).filter(key => !ALLOWED_FIELDS.has(key));
  const invalidValues: Array<{ field: RelationshipPresentationField; value: unknown }> = [];
  const presentation: RelationshipPresentation = {};

  for (const field of RELATIONSHIP_PRESENTATION_FIELDS) {
    const value = obj[field];
    if (value === undefined) continue;
    const values = field === 'color' ? COLOR_VALUES
      : field === 'line' ? LINE_VALUES
        : ARROW_VALUES;
    if (typeof value !== 'string' || !values.has(value)) {
      invalidValues.push({ field, value });
      continue;
    }
    presentation[field] = value as never;
  }
  return { absent: false, notMapping: false, unknownFields, invalidValues, presentation };
}

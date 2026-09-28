/**
 * Validation threshold constants
 */

// Maximum character/item limits
export const MAX_SECTION_TEXT_LENGTH = 500;

// Validation messages
export const VALIDATION_MESSAGES = {
  // Required content
  ACCEPTANCE_CASE_EMPTY: 'Acceptance Case text cannot be empty',
  SECTION_EMPTY: 'Section text cannot be empty',
  SECTION_NO_SHALL: 'Section must contain SHALL or MUST keyword',
  CONTRACT_NO_SECTIONS: 'Element Contract must have at least one Section',
  CHANGE_NO_DELTAS: 'Change must have at least one delta',

  // Warnings
  SECTION_TOO_LONG: `Section text is very long (>${MAX_SECTION_TEXT_LENGTH} characters). Consider breaking it down.`,

  // Guidance snippets (appended to primary messages for required corrections)
  GUIDE_NO_DELTAS:
    'No deltas found. Add Semantic Delta units under elements/, metamodel/, relationships/, or views/. Element Contract entries use ## ADDED/MODIFIED/REMOVED Sections. Tip: run "xirang validate --change <change-id> --json" to inspect the Semantic Delta.',
} as const;

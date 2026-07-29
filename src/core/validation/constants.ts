/**
 * Validation threshold constants
 */

// Maximum character/item limits
export const MAX_REQUIREMENT_TEXT_LENGTH = 500;

// Validation messages
export const VALIDATION_MESSAGES = {
  // Required content
  SCENARIO_EMPTY: 'Scenario text cannot be empty',
  REQUIREMENT_EMPTY: 'Requirement text cannot be empty',
  REQUIREMENT_NO_SHALL: 'Requirement must contain SHALL or MUST keyword',
  REQUIREMENT_NO_SCENARIOS: 'Requirement must have at least one scenario',
  CONTRACT_NO_REQUIREMENTS: 'Element Contract must have at least one Requirement',
  CHANGE_NO_DELTAS: 'Change must have at least one delta',
  
  // Warnings
  REQUIREMENT_TOO_LONG: `Requirement text is very long (>${MAX_REQUIREMENT_TEXT_LENGTH} characters). Consider breaking it down.`,
  
  // Guidance snippets (appended to primary messages for remediation)
  GUIDE_NO_DELTAS:
    'No deltas found. Add Semantic Delta units under elements/, metamodel/, relationships/, or views/. Element Contract entries use ## ADDED/MODIFIED/REMOVED Requirements, and each surviving Requirement includes at least one "#### Scenario:" block. Tip: run "xirang validate --change <change-id> --json" to inspect the Semantic Delta.',
  GUIDE_SCENARIO_FORMAT:
    'Scenarios must use level-4 headers. Convert bullet lists into:\n#### Scenario: Short name\n- **WHEN** ...\n- **THEN** ...\n- **AND** ...',
} as const;

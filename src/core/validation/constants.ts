/**
 * Validation threshold constants
 */

// Minimum character lengths
export const MIN_PURPOSE_LENGTH = 50;

// Maximum character/item limits
export const MAX_REQUIREMENT_TEXT_LENGTH = 500;

// Validation messages
export const VALIDATION_MESSAGES = {
  // Required content
  SCENARIO_EMPTY: 'Scenario text cannot be empty',
  REQUIREMENT_EMPTY: 'Requirement text cannot be empty',
  REQUIREMENT_NO_SHALL: 'Requirement must contain SHALL or MUST keyword',
  REQUIREMENT_NO_SCENARIOS: 'Requirement must have at least one scenario',
  SPEC_NAME_EMPTY: 'Spec name cannot be empty',
  SPEC_PURPOSE_EMPTY: 'Purpose section cannot be empty',
  SPEC_NO_REQUIREMENTS: 'Spec must have at least one requirement',
  CHANGE_NO_DELTAS: 'Change must have at least one delta',
  
  // Warnings
  PURPOSE_TOO_BRIEF: `Purpose section is too brief (less than ${MIN_PURPOSE_LENGTH} characters)`,
  REQUIREMENT_TOO_LONG: `Requirement text is very long (>${MAX_REQUIREMENT_TEXT_LENGTH} characters). Consider breaking it down.`,
  
  // Guidance snippets (appended to primary messages for remediation)
  GUIDE_NO_DELTAS:
    'No deltas found. Add Semantic Delta units under elements/, metamodel/, relationships/, or views/. Element Contract entries use ## ADDED/MODIFIED/REMOVED Requirements, and each surviving Requirement includes at least one "#### Scenario:" block. Tip: run "xirang validate --change <change-id> --json" to inspect the Semantic Delta.',
  GUIDE_MISSING_SPEC_SECTIONS:
    'Missing required sections. Expected headers: "## Purpose" and "## Requirements". Example:\n## Purpose\n[brief purpose]\n\n## Requirements\n### Requirement: Clear requirement statement\nUsers SHALL ...\n\n#### Scenario: Descriptive name\n- **WHEN** ...\n- **THEN** ...',
  GUIDE_SCENARIO_FORMAT:
    'Scenarios must use level-4 headers. Convert bullet lists into:\n#### Scenario: Short name\n- **WHEN** ...\n- **THEN** ...\n- **AND** ...',
} as const;

## ADDED Requirements

### Requirement: snack workflow specs include finalized purpose text
snack workflow formal specs SHALL use meaningful Purpose text instead of the placeholder text that says the Purpose must be completed later.

#### Scenario: snack specs purpose cleanup
- **WHEN** the snack workflow specs are reviewed
- **THEN** `openspec/specs/snack-skill/spec.md`, `openspec/specs/snack-skill-generation/spec.md`, and `openspec/specs/snack-workflow-manifest/spec.md` do not contain the placeholder text `此规约记录变更 snack-workflow 引入的行为，请在后续同步或归档前补全正式 Purpose。`
- **AND** each of those specs has Purpose text that describes its active responsibility

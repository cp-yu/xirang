## MODIFIED Requirements

### Requirement: Scenario label fix command

`openspec scenario-labels` SHALL provide the deterministic preview/write command for deriving change-local scenario operation labels from differences between main specs and change-local `## MODIFIED Requirements` blocks. The command name SHALL NOT use `fix` terminology.

#### Scenario: Preview reports suggested scenario labels

- **WHEN** executing `openspec scenario-labels my-change --preview`
- **THEN** the command SHALL compare each change-local MODIFIED requirement with the matching main spec requirement
- **AND** SHALL print a preview table containing spec id, requirement title, scenario title, detected operation, suggested label, and reason
- **AND** SHALL NOT modify files

#### Scenario: JSON preview is machine-readable

- **WHEN** executing `openspec scenario-labels my-change --preview --json`
- **THEN** the command SHALL output JSON with changed file paths and per-scenario suggestions
- **AND** each suggestion SHALL include spec id, requirement title, scenario title, operation, label, and reason

#### Scenario: Write applies suggested labels

- **WHEN** executing `openspec scenario-labels my-change --write`
- **THEN** the command SHALL update only `openspec/changes/my-change/specs/**/spec.md` files that need scenario label changes
- **AND** SHALL preserve unrelated content and line endings where practical
- **AND** SHALL report the files and scenario counts updated

#### Scenario: Missing change fails deterministically

- **WHEN** executing `openspec scenario-labels missing-change --preview`
- **THEN** the command SHALL fail with an unknown change error
- **AND** SHALL NOT create files

#### Scenario: Command is idempotent

- **GIVEN** `openspec scenario-labels my-change --write` has already applied all suggestions
- **WHEN** executing the same command again
- **THEN** no additional labels SHALL be inserted
- **AND** the command SHALL report that no scenario label updates are needed

### Requirement: Scenario label derivation

The scenario label applier SHALL derive labels by comparing label-free scenario titles and scenario bodies between the main spec requirement and the change-local MODIFIED requirement.

#### Scenario: Unchanged scenario remains unlabeled

- **GIVEN** a main spec requirement contains `#### Scenario: 保持行为`
- **AND** the change-local MODIFIED requirement contains the same scenario title with the same body
- **WHEN** scenario labels are applied
- **THEN** the change-local scenario SHALL remain unlabeled

#### Scenario: Changed scenario receives MODIFIED label

- **GIVEN** a main spec requirement contains `#### Scenario: 调整行为`
- **AND** the change-local MODIFIED requirement contains the same scenario title with a different body
- **WHEN** scenario labels are applied
- **THEN** the change-local scenario heading SHALL become `#### Scenario: [MODIFIED] 调整行为`

#### Scenario: New scenario receives ADDED label

- **GIVEN** a change-local MODIFIED requirement contains `#### Scenario: 新行为`
- **AND** the matching main spec requirement has no label-free scenario title `新行为`
- **WHEN** scenario labels are applied
- **THEN** the change-local scenario heading SHALL become `#### Scenario: [ADDED] 新行为`

#### Scenario: Removed scenario block is inserted

- **GIVEN** a main spec requirement contains `#### Scenario: 旧行为`
- **AND** the change-local MODIFIED requirement has no label-free scenario title `旧行为`
- **WHEN** scenario labels are applied
- **THEN** the change-local requirement SHALL contain `#### Scenario: [REMOVED] 旧行为`
- **AND** the inserted scenario block SHALL preserve the main spec scenario body as review evidence

#### Scenario: Existing labels are normalized without duplication

- **GIVEN** a change-local MODIFIED requirement already contains `#### Scenario: [MODIFIED] 调整行为`
- **WHEN** scenario labels are applied
- **THEN** the heading SHALL NOT receive a duplicate operation label
- **AND** the label-free title SHALL remain `调整行为`

# legacy-cleanup Specification

## Purpose
Define detection and cleanup behavior for legacy OPSX artifacts during initialization and update workflows.

## Requirements
### Requirement: Legacy artifact detection

The system SHALL detect legacy OPSX artifacts from previous init versions.

#### Scenario: Detecting legacy config files

- **WHEN** running `opsx init` on an existing project
- **THEN** the system SHALL check for config files with OPSX markers:
  - `CLAUDE.md`
  - `.cursorrules`
  - `.windsurfrules`
  - `.clinerules`
  - `.kilocode_rules`
  - `.github/copilot-instructions.md`
  - `.amazonq/instructions.md`
  - `CODEBUDDY.md`
  - `IFLOW.md`
  - And all other tool config files from the legacy ToolRegistry

#### Scenario: Detecting legacy slash command directories

- **WHEN** running `opsx init` on an existing project
- **THEN** the system SHALL check for old slash command directories:
  - `.claude/commands/opsx/`
  - `.cursor/commands/opsx/` (note: old format used `opsx-*.md` in commands root)
  - `.windsurf/workflows/opsx-*.md`
  - And equivalent directories for all tools in the legacy SlashCommandRegistry

#### Scenario: Detecting legacy OPSX structure files

- **WHEN** running `opsx init` on an existing project
- **THEN** the system SHALL check for:
  - `opsx/AGENTS.md`
  - `opsx/project.md` (for migration messaging only, not deleted)
  - Root `AGENTS.md` with OPSX markers

### Requirement: Legacy cleanup confirmation

The system SHALL prompt for confirmation before removing legacy artifacts.

#### Scenario: Prompting for cleanup when legacy detected

- **WHEN** legacy artifacts are detected
- **THEN** the system SHALL display what was found
- **AND** prompt: "Legacy files detected. Upgrade and clean up? [Y/n]"
- **AND** default to Yes if user presses Enter

#### Scenario: User confirms cleanup

- **WHEN** user responds Y or presses Enter
- **THEN** the system SHALL remove legacy artifacts
- **AND** proceed with skill-based setup

#### Scenario: User declines cleanup

- **WHEN** user responds N
- **THEN** the system SHALL abort initialization
- **AND** display message suggesting manual cleanup or using `--force` flag

#### Scenario: Non-interactive mode

- **WHEN** running with `--no-interactive` or in CI environment
- **AND** legacy artifacts are detected
- **THEN** the system SHALL abort with exit code 1
- **AND** display detected legacy artifacts
- **AND** suggest running interactively or using `--force` flag

### Requirement: Surgical removal of config file content

The system SHALL preserve user content when removing OPSX markers from config files.

#### Scenario: Config file with only OPSX content

- **WHEN** a config file contains only OPSX marker block (whitespace outside is acceptable)
- **THEN** the system SHALL remove the OPSX marker block
- **AND** preserve the file (even if empty or whitespace-only)
- **AND** NOT delete the file (config files belong to the user's project root)

#### Scenario: Config file with mixed content

- **WHEN** a config file contains content outside OPSX markers
- **THEN** the system SHALL remove only the `<!-- OPSX:START -->` to `<!-- OPSX:END -->` block
- **AND** preserve all content before and after the markers
- **AND** clean up any resulting double blank lines

#### Scenario: Root AGENTS.md with mixed content

- **WHEN** root `AGENTS.md` contains OPSX markers AND other content
- **THEN** the system SHALL remove only the OPSX marker block
- **AND** preserve the rest of the file

### Requirement: Legacy directory removal

The system SHALL remove legacy slash command directories entirely.

#### Scenario: Removing old slash command directory

- **WHEN** a legacy slash command directory exists (e.g., `.claude/commands/opsx/`)
- **THEN** the system SHALL delete the entire directory and its contents
- **AND** NOT delete the parent directory (e.g., `.claude/commands/` remains)

#### Scenario: Removing legacy AGENTS.md

- **WHEN** `opsx/AGENTS.md` exists
- **THEN** the system SHALL delete the file
- **AND** NOT delete the `opsx/` directory itself

### Requirement: project.md migration hint

The system SHALL preserve project.md and display a migration hint instead of deleting it.

#### Scenario: project.md exists during upgrade

- **WHEN** `opsx/project.md` exists during legacy cleanup
- **THEN** the system SHALL NOT delete the file
- **AND** the system SHALL display a migration hint in the output:
  ```
  Manual migration needed:
    → opsx/project.md still exists
      Move useful content to config.yaml's "context:" field, then delete
  ```

#### Scenario: project.md migration rationale

- **GIVEN** project.md may contain user-written project documentation
- **AND** config.yaml's context field serves the same purpose (auto-injected into artifacts)
- **WHEN** displaying the migration hint
- **THEN** users can migrate manually or use `/opsx:explore` to get AI assistance

### Requirement: Cleanup reporting

The system SHALL report what was cleaned up.

#### Scenario: Displaying cleanup summary

- **WHEN** legacy cleanup completes
- **THEN** the system SHALL display a summary section:
  ```
  Cleaned up legacy files:
    ✓ Removed OPSX markers from CLAUDE.md
    ✓ Removed .claude/commands/opsx/ (replaced by /opsx:*)
    ✓ Removed opsx/AGENTS.md (no longer needed)
  ```
- **AND IF** `opsx/project.md` exists
- **THEN** the system SHALL display a separate migration section:
  ```
  Manual migration needed:
    → opsx/project.md still exists
      Move useful content to config.yaml's "context:" field, then delete
  ```

#### Scenario: No legacy detected

- **WHEN** no legacy artifacts are found
- **THEN** the system SHALL NOT display the cleanup section
- **AND** proceed directly with skill setup


---
element: project.root/domain.config/cap.config.global-contract
---

# legacy-cleanup Specification

## Purpose
Define detection and cleanup behavior for legacy OPSX artifacts during initialization and update workflows.
## Requirements
### Requirement: Legacy artifact detection
Setup/update SHALL 检测 legacy generated Agent surfaces 和退役的 OPSX managed workspaces，包括 `.opsx/bootstrap/`、`.opsx/bootstrap-history/` 与 `.opsx/migration-candidate/`。

#### Scenario: 检测退役 workspace
- **WHEN** setup 或 update 运行
- **THEN** SHALL 使用 project-relative path 报告每个 retired workspace
- **AND** SHALL NOT 将其视为 active semantic source

### Requirement: Legacy cleanup confirmation
系统 SHALL 在删除或移动 legacy generated artifacts 与 retired workspaces 前要求 explicit user confirmation。

#### Scenario: 用户确认 cleanup
- **WHEN** 用户确认 cleanup
- **THEN** managed legacy artifacts SHALL 被清理，retired workspaces SHALL 移动到 `.opsx/history/legacy-<timestamp>/`
- **AND** cleanup manifest SHALL 记录原始路径

#### Scenario: 用户拒绝 cleanup
- **WHEN** 用户拒绝 cleanup
- **THEN** setup/update SHALL 停止
- **AND** SHALL NOT 进行 partial deletion 或 movement

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
Cleanup SHALL 报告已移动的 retired workspaces、已删除的 managed skill surfaces、保留的 user files 和仍需手动处理的内容。

#### Scenario: Cleanup summary
- **WHEN** cleanup 完成
- **THEN** output SHALL 列出每个显式 path action
- **AND** SHALL 说明 history entries 只是 audit evidence，不是 runtime fallback source


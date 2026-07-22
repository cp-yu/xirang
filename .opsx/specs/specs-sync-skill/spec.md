---
element: project.root/domain.change_workflow/cap.change.lifecycle
---

# specs-sync-skill Specification

## Purpose
Defines the archive-time sync contract for delta specs and OPSX state.
## Requirements
### Requirement: Archive-time sync contract

The system SHALL reconcile delta Specs and architecture delta during archive.

#### Scenario: Archive reconciles delta specs

- **WHEN** delta specs exist
- **THEN** archive SHALL reconcile them into the main specs
- **AND** SHALL preserve idempotency

### Requirement: Delta Reconciliation Logic

Agent SHALL 使用 delta operation headers 将主 specs 与 delta specs 进行合入。合入 SHALL 通过对 requirement header 的显式查找判断 removal-only delta 是否已完成：当 `## REMOVED Requirements` 下列出的所有 headers 都已从当前主 spec 缺失时，即使无关 requirements 仍保留，该 removal-only delta 也视为已合入。Scenario operation labels are optional change-local review metadata produced before sync by `opsx scenario-labels "<change>" --write`; sync/archive SHALL consume and clean existing labels but SHALL NOT generate them. 当 ADDED 或 MODIFIED requirement 的 `#### Scenario:` 标题包含 scenario operation labels 时，合入 SHALL 将这些 labels 视为 change-local metadata，并仅将归一化后的正式 scenario 标题写入主 spec。

#### Scenario: ADDED requirements
- **WHEN** delta 包含 `## ADDED Requirements` 及其 requirement
- **AND** 主 spec 中不存在同名 requirement
- **THEN** 将该 requirement 添加到主 spec

#### Scenario: ADDED requirement already exists
- **WHEN** delta 包含 `## ADDED Requirements` 及其 requirement
- **AND** 主 spec 中已存在同名 requirement
- **THEN** 用 delta 版本更新主 spec 中的对应 requirement

#### Scenario: MODIFIED requirements
- **WHEN** delta 包含 `## MODIFIED Requirements` 及其 requirement
- **AND** 主 spec 中存在同名 requirement
- **THEN** 用 delta 版本替换主 spec 中的对应 requirement

#### Scenario: Scenario labels 在合入时被清洗
- **WHEN** ADDED 或 MODIFIED requirement 包含 `#### Scenario: [ADDED] 新场景` 或 `#### Scenario: [MODIFIED] 已调整场景`
- **THEN** 合入 SHALL 将对应 scenario 写入主 spec 时去除 operation label，如写入为 `#### Scenario: 新场景` 或 `#### Scenario: 已调整场景`
- **AND** SHALL NOT 将 `[ADDED]` 或 `[MODIFIED]` 写入 formal spec

#### Scenario: Removed scenario block 在合入时被省略
- **WHEN** MODIFIED requirement 包含 `#### Scenario: [REMOVED] 旧场景`
- **AND** 该 scenario 在下一个 scenario 或 requirement header 前包含 body 内容
- **THEN** 合入 SHALL 将整个 removed scenario block 从主 spec 中省略
- **AND** SHALL NOT 将 `[REMOVED]` 或 removed scenario body 写入 formal spec

#### Scenario: REMOVED requirements
- **WHEN** delta 包含 `## REMOVED Requirements` 及其 requirement name
- **AND** 主 spec 中存在同名 requirement
- **THEN** 从主 spec 中删除该 requirement

#### Scenario: REMOVED requirements already absent
- **WHEN** delta 只包含 `## REMOVED Requirements`
- **AND** 所列全部 requirement headers 都已从主 spec 缺失
- **AND** 主 spec 仍包含无关 requirements
- **THEN** 合入 SHALL 视该 delta 为已合入
- **AND** SHALL NOT 再次尝试删除这些 headers

#### Scenario: RENAMED requirements
- **WHEN** delta 包含 `## RENAMED Requirements` 及 FROM:/TO: 格式
- **AND** 主 spec 中存在 FROM requirement
- **THEN** 将该 requirement 重命名为 TO 名称

#### Scenario: New capability spec
- **WHEN** 主 specs 中不存在对应 capability 的 delta spec
- **THEN** 在 `.opsx/specs/<capability>/spec.md` 创建新的主 spec 文件

#### Scenario: 未标注 scenarios 仍可合入
- **WHEN** archive-time sync processes a change-local MODIFIED requirement with unlabeled scenario differences
- **THEN** sync SHALL reconcile the requirement without requiring scenario operation labels
- **AND** SHALL NOT write labels back to the change-local spec

### Requirement: Skill Output
The skill SHALL provide clear feedback on what was applied.

#### Scenario: Show applied changes
- **WHEN** reconciliation completes successfully
- **THEN** display summary of changes per capability:
  - Number of requirements added
  - Number of requirements modified
  - Number of requirements removed
  - Number of requirements renamed

#### Scenario: Show OPSX sync summary
- **WHEN** Semantic Delta sync completes successfully
- **THEN** display summary including:
  - Number of architecture modules written
  - Number of semantic relations reconciled
  - Number of nodes modified
  - Number of nodes removed

#### Scenario: No changes needed
- **WHEN** main specs already match delta specs
- **THEN** display "Specs already in sync - no changes needed"

### Requirement: OPSX_SYNC_DELTA Fragment Integration
The archive sync template SHALL import and embed the `OPSX_SYNC_DELTA` fragment from `opsx-fragments.ts` as a post-specs-sync step.

#### Scenario: Fragment wired into skill template
- **GIVEN** `OPSX_SYNC_DELTA` is defined in `opsx-fragments.ts`
- **WHEN** `getSyncSpecsSkillTemplate()` generates instructions
- **THEN** the instructions include the Semantic Delta sync step after specs sync

### Requirement: Sync template SHALL consume prompt projection

The sync template SHALL consume prompt projection compiled for the archive sync surface so its instructions align with the shared config-driven authoring contract.

#### Scenario: Sync skill explains projected prose boundary

- **WHEN** the skill instructs the agent to reconcile or create specs
- **THEN** the prompt projection SHALL state how natural-language prose follows config-driven policy
- **AND** SHALL preserve canonical tokens such as `SHALL`, `MUST`, requirement headers, scenario headers, and BDD keywords

### Requirement: Sync Verify Gate

Archive sync SHALL require a fresh verify result before writing.

#### Scenario: Verify result is fresh

- **WHEN** archive sync runs with a fresh `.verify-result.json`
- **THEN** system SHALL continue sync logic

#### Scenario: Verify result is stale

- **WHEN** archive sync runs without a fresh `.verify-result.json`
- **THEN** system SHALL stop and require verify first

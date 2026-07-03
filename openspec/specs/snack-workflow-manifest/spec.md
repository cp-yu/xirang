# snack-workflow-manifest Specification

## Purpose
规约 WorkflowManifestRegistry 中 snack 工作流 manifest entry 的注册职责：snack 与现有 5 个核心工作流平行注册，`modeMembership` 标记为 `flexible`（过渡能力标签），该标签不影响运行时安装行为（所有 6 个工作流仍被全量安装）。
## Requirements
### Requirement: WorkflowManifestRegistry 注册 snack

WorkflowManifestRegistry SHALL 包含 snack workflow manifest entry，与现有 5 个核心工作流平行；snack 的 `modeMembership` 标记为 `flexible`，反映其"代码反向同步过渡能力"的语义分类。标签不影响运行时安装行为（所有 6 个工作流仍被全量安装）。

#### Scenario: 注册 snack manifest entry

- **WHEN** WorkflowManifestRegistry 初始化
- **THEN** MANIFEST_ENTRIES 数组包含 snack entry：
  - `workflowId: 'snack'`
  - `modeMembership: ['flexible']`
  - `skillDirName: 'openspec-snack'`
  - `skillName: 'openspec-snack'`
  - `commandSlug: 'snack'`
  - `promptMeta.name: 'Snack sync'`
  - `promptMeta.description: 'Quick sync from code to specs'`
  - `getSkillTemplate: getSnackSkillTemplate`
  - 不提供 `getCommandTemplate`（snack 为 skill-only 工作流）

### Requirement: 6 个工作流架构

系统 SHALL 支持 6 个核心工作流（propose、explore、apply、archive、bootstrap-opsx、snack），保持架构一致性。

#### Scenario: init 安装 6 个工作流

- **WHEN** 运行 `openspec init` 初始化项目
- **THEN** 安装 6 个工作流 skill：openspec-propose、openspec-explore、openspec-apply-change、openspec-archive-change、openspec-bootstrap-opsx、openspec-snack

#### Scenario: update 刷新 6 个工作流

- **WHEN** 运行 `openspec update` 刷新指令
- **THEN** 更新 6 个工作流 skill 文件，保持与 manifest registry 同步

### Requirement: snack workflow specs include finalized purpose text
snack workflow formal specs SHALL use meaningful Purpose text instead of the placeholder text that says the Purpose must be completed later.

#### Scenario: snack specs purpose cleanup
- **WHEN** the snack workflow specs are reviewed
- **THEN** `openspec/specs/snack-skill/spec.md`, `openspec/specs/snack-skill-generation/spec.md`, and `openspec/specs/snack-workflow-manifest/spec.md` do not contain the placeholder text `此规约记录变更 snack-workflow 引入的行为，请在后续同步或归档前补全正式 Purpose。`
- **AND** each of those specs has Purpose text that describes its active responsibility


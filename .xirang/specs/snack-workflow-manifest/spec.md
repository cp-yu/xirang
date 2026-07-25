---
element: cap.ai.snack-workflow-manifest
---

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
  - `skillDirName: 'xirang-snack'`
  - `skillName: 'xirang-snack'`
  - `commandSlug: 'snack'`
  - `promptMeta.name: 'Snack sync'`
  - `promptMeta.description: 'Quick sync from code to specs'`
  - `getSkillTemplate: getSnackSkillTemplate`

### Requirement: 6 个工作流架构
系统 SHALL 支持六个核心 workflows：`propose`、`explore`、`apply`、`archive`、`build`、`snack`，并 SHALL 使用 `xirang-build` 作为 Project Build skill surface。

#### Scenario: setup 安装六个 workflows
- **WHEN** 运行 `xirang setup`
- **THEN** SHALL 安装 `xirang-propose`、`xirang-explore`、`xirang-apply-change`、`xirang-archive-change`、`xirang-build`、`xirang-snack`
- **AND** SHALL NOT 安装 `xirang-bootstrap-arch`

#### Scenario: update 刷新六个 workflows
- **WHEN** 运行 `xirang update`
- **THEN** SHALL 刷新相同的六个 workflow skills
- **AND** SHALL 删除 managed `xirang-bootstrap-arch`

### Requirement: snack workflow specs include finalized purpose text
snack workflow formal specs SHALL use meaningful Purpose text instead of the placeholder text that says the Purpose must be completed later.

#### Scenario: snack specs purpose cleanup
- **WHEN** the snack workflow specs are reviewed
- **THEN** `.xirang/specs/snack-skill/spec.md`, `.xirang/specs/snack-skill-generation/spec.md`, and `.xirang/specs/snack-workflow-manifest/spec.md` do not contain the placeholder text `此规约记录变更 snack-workflow 引入的行为，请在后续同步或归档前补全正式 Purpose。`
- **AND** each of those specs has Purpose text that describes its active responsibility


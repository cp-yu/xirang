---
entity: element-declaration
identity: snack-workflow-manifest
kind: element
parent: agent-workbench-projection
title: Snack Workflow Manifest
definition: Snack Workflow Manifest 定义 WorkflowManifestRegistry 中 snack workflow manifest entry 的注册职责：snack 与五个核心工作流平行注册，`modeMembership` 标记为 `flexible`（过渡能力标签），该标签不影响运行时安装行为。
---

## Requirements

### Requirement: WorkflowManifestRegistry 注册 snack

WorkflowManifestRegistry SHALL 包含 snack workflow manifest entry，与既有核心工作流平行；snack 的 `modeMembership` 标记为 `flexible`，反映其"代码反向同步过渡能力"的语义分类。标签不影响运行时安装行为（全部工作流仍被全量安装）。

#### Scenario: 注册 snack manifest entry

- **WHEN** WorkflowManifestRegistry 初始化
- **THEN** MANIFEST_ENTRIES 数组包含 snack entry：
  - `workflowId: 'snack'`
  - `modeMembership: ['flexible']`
  - `skillDirName: 'xirang-snack'`
  - `skillName: 'xirang-snack'`
  - `commandSlug: 'snack'`

### Requirement: 6 个工作流架构
系统 SHALL 支持六个核心 workflows：propose、explore、apply、archive、build、snack，并 SHALL 使用 `xirang-build` 作为 Project Build skill surface。

#### Scenario: setup 安装六个 workflows
- **WHEN** 运行 `xirang setup`
- **THEN** SHALL 安装六个固定 workflow skills
- **AND** SHALL NOT 安装退役的 build 工作流

#### Scenario: update 刷新六个 workflows
- **WHEN** 运行 `xirang update`
- **THEN** SHALL 刷新相同的六个 workflow skills
- **AND** SHALL 删除退役的 managed build skill

### Requirement: snack workflow Element Definitions include finalized responsibility text
snack workflow Element Declarations SHALL 使用完整、有意义的 `definition` 文本描述其活动职责，而非占位文本。

#### Scenario: snack workflow Element Definitions 审查
- **WHEN** snack workflow Element Definitions 被审查
- **THEN** 每个 Element Declaration SHALL 具有描述其 active responsibility 的完整 `definition` 文本
- **AND** 不包含要求稍后补全正式 Definition 的占位文本

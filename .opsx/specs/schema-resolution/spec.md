---
element: project.root/domain.artifact_graph/cap.artifact-graph.workflow-compilation
---

# schema-resolution Specification

## Purpose
Define project-local schema resolution behavior, including precedence order (project-local, then user override, then package built-in) and backward-compatible fallback when `projectRoot` is not provided.
## Requirements
### Requirement: Built-in Schema resolution
系统 SHALL 仅从 package 内置 Schema directory 解析固定 `spec-driven` Schema。Project-local 与 user data Schema directories MUST NOT 参与 lookup、listing、template resolution 或 shadowing，且系统 SHALL NOT 暴露内置 `bootstrap` schema。

#### Scenario: 内置 Schema 解析
- **WHEN** 系统解析 `spec-driven`
- **THEN** SHALL 返回 package 内置 spec-driven Schema directory
- **AND** SHALL 加载其 `schema.yaml` 与 templates

#### Scenario: Bootstrap Schema 不存在
- **WHEN** 系统解析或列出 `bootstrap`
- **THEN** SHALL 报告 Schema 不存在
- **AND** SHALL NOT 回退到旧 `schemas/bootstrap/`

#### Scenario: 未知 Schema 明确失败
- **WHEN** 系统解析其他 Schema ID
- **THEN** SHALL 报告 Schema 不存在
- **AND** SHALL 列出固定合法 ID `spec-driven`

### Requirement: Built-in Schema binding
New change、project config、change metadata 与 workflow CLI SHALL 保留 Schema binding，但合法值 SHALL 限于 `spec-driven`。Resolution precedence SHALL 保持 explicit CLI option → change metadata → project config → `spec-driven` default。

#### Scenario: Change 持久化 binding
- **WHEN** 创建 change
- **THEN** `.opsx.yaml` SHALL 持久化 `spec-driven`
- **AND** 后续 status、instructions 与 apply SHALL 使用该 binding

#### Scenario: Bootstrap binding 被拒绝
- **WHEN** config 或 change metadata 引用 `bootstrap`
- **THEN** workflow context SHALL fail fast 并提供 `spec-driven` remediation
- **AND** MUST NOT 静默改写磁盘文件或加载退役 schema


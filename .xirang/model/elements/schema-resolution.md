---
entity: element-declaration
identity: schema-resolution
kind: element
parent: deterministic-operations
title: Schema Resolution
definition: Schema Resolution 定义项目本地 schema 解析行为：仅从 package 内置 schema 目录解析固定 `spec-driven` Schema，project-local 与 user data 目录不参与 lookup，不暴露内置 bootstrap schema，并保留 Schema binding 但合法值限于 `spec-driven`。
---

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
- **AND** SHALL NOT 回退到旧 bootstrap 目录

#### Scenario: 未知 Schema 明确失败
- **WHEN** 系统解析其他 Schema ID
- **THEN** SHALL 报告 Schema 不存在
- **AND** SHALL 列出固定合法 ID `spec-driven`
#### Scenario: User data 目录不参与解析
- **WHEN** 存在 `${XDG_DATA_HOME}/xirang/schemas/<name>/` 等 user data schema 目录
- **THEN** 系统 SHALL NOT 使用该目录覆盖或 shadowing 内置 Schema
- **AND** SHALL 仍解析 package 内置目录
#### Scenario: List available schemas
- **WHEN** listing schemas
- **THEN** the system returns only package built-in schema names（`spec-driven`）
#### Scenario: 无 user override 机制
- **WHEN** schema 解析执行
- **THEN** 不存在 user override 回退；解析结果 SHALL 始终来自 package 内置目录

#### Scenario: 跨平台内置路径解析
- **WHEN** workflow 在 macOS、Linux 或 Windows 解析内置 Schema 或 template path
- **THEN** 系统 SHALL 使用 Node.js path APIs 构造路径
- **AND** MUST NOT 依赖硬编码路径分隔符、路径大小写启发式或正则检测 Schema source
### Requirement: Built-in Schema binding
New change、project config、change metadata 与 workflow CLI SHALL 保留 Schema binding，但合法值 SHALL 限于 `spec-driven`。Resolution precedence SHALL 保持 explicit CLI option → change metadata → project config → `spec-driven` default。

#### Scenario: Change 持久化 binding
- **WHEN** 创建 change
- **THEN** change metadata SHALL 持久化 `spec-driven`
- **AND** 后续 status、instructions 与 apply SHALL 使用该 binding

#### Scenario: Bootstrap binding 被拒绝
- **WHEN** config 或 change metadata 引用 `bootstrap`
- **THEN** workflow context SHALL fail fast 并提供 `spec-driven` Required Corrections
- **AND** MUST NOT 静默改写磁盘文件或加载退役 schema

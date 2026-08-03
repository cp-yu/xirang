---
entity: element-declaration
identity: schema-commands
kind: element
parent: deterministic-operations
title: Schema Commands
definition: Schema Commands 定义 `xirang schema which` 与 `xirang schema validate` 命令面：报告内置 schema 的 resolved source/location 与校验内置 schema 的 YAML、structure、FileDefinition、templates 与依赖图。
---

## Requirements

### Requirement: Built-in Schema inspection

`xirang schema which [name]` SHALL 报告内置 `spec-driven` schema 的 package location。`--all` SHALL 列出内置 Schema；JSON output SHALL 包含 `name`、`source: package` 与 `path`，MUST NOT 包含 shadowing 信息。

#### Scenario: 查询内置 Schema
- **WHEN** 用户执行 `xirang schema which spec-driven`
- **THEN** 系统 SHALL 显示 package source 与完整 Schema directory path

#### Scenario: 查询未知 Schema
- **WHEN** 用户查询非内置 Schema
- **THEN** 命令 SHALL 非零退出
- **AND** SHALL 列出合法内置 ID
#### Scenario: 列出全部内置 Schema
- **WHEN** 用户执行 `xirang schema which --all --json`
- **THEN** 输出 SHALL 恰好包含可用内置 Schema
- **AND** 每项 SHALL 使用 `source: package`
### Requirement: Built-in Schema validation

`xirang schema validate [name]` SHALL 校验一个或全部内置 Schema 的 YAML、Zod structure、`FileDefinition`、templates、artifact dependency DAG 与 file references。命令 SHALL 保留 JSON 与 verbose output。

#### Scenario: 校验一个内置 Schema
- **WHEN** 用户执行 `xirang schema validate spec-driven --json`
- **THEN** 输出 SHALL 包含 `valid`、`name`、package `path` 与 `issues`
- **AND** validation SHALL 包含 file definition 与 template existence checks

#### Scenario: 校验全部内置 Schema
- **WHEN** 用户执行 `xirang schema validate` 不带 name
- **THEN** 系统 SHALL 校验全部内置 Schema，任一无效时 SHALL 非零退出

#### Scenario: 未知 Schema 被拒绝
- **WHEN** 用户请求校验非内置 Schema
- **THEN** 命令 SHALL 非零退出并列出合法内置 ID
#### Scenario: Verbose 输出检查阶段
- **WHEN** 用户使用 `--verbose`
- **THEN** 输出 SHALL 展示 YAML parsing、Zod validation、file definitions、template existence、dependency graph 与 file reference checks

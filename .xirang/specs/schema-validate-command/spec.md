---
element: cap.schema.validate
---

# schema-validate-command Specification

## Purpose
Define `xirang schema validate` behavior for validating schema syntax, structure, templates, and dependency graphs.
## Requirements
### Requirement: Built-in Schema validation

`xirang schema validate [name]` SHALL 校验一个或全部内置 Schema 的 YAML、Zod structure、`FileDefinition`、templates、artifact dependency DAG 与 bootstrap file references。命令 SHALL 保留 JSON 和 verbose output。

#### Scenario: 校验一个内置 Schema
- **WHEN** 用户执行 `xirang schema validate spec-driven --json`
- **THEN** 输出 SHALL 包含 `valid`、`name`、package `path` 与 `issues`
- **AND** validation SHALL 包含 file definition 与 template existence checks

#### Scenario: 校验全部内置 Schema
- **WHEN** 用户执行 `xirang schema validate` 不带 name
- **THEN** 系统 SHALL 校验 `spec-driven` 与 `bootstrap`
- **AND** 任一内置 Schema 无效时 SHALL 非零退出

#### Scenario: Verbose 输出检查阶段
- **WHEN** 用户使用 `--verbose`
- **THEN** 输出 SHALL 展示 YAML parsing、Zod validation、file definitions、template existence、dependency graph 与 file reference checks

#### Scenario: 未知 Schema 被拒绝
- **WHEN** 用户请求校验非内置 Schema
- **THEN** 命令 SHALL 非零退出并列出合法内置 ID

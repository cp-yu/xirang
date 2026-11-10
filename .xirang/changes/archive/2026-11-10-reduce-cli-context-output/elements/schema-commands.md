---
entity: element-declaration
identity: schema-commands
kind: element
parent: deterministic-operations
title: "Schema Commands"
definition: "Schema Commands 定义 `xirang schema which` 与 `xirang schema validate` 命令面：报告内置 schema 的 resolved source/location 与校验内置 schema 的 YAML、structure、FileDefinition、templates 与依赖图。"
---

## MODIFIED Sections

### Section: Built-in Schema validation

`xirang schema validate [name]` SHALL 校验一个或全部内置 Schema 的 YAML、Zod structure、`FileDefinition`、templates、artifact dependency DAG 与 file references。命令 SHALL 支持 JSON 诊断与显式 verbose 检查详情；默认只报告问题，成功且无问题时静默。

- **校验一个内置 Schema**
  - 用户执行 `xirang schema validate semantic-model --json`
  - 存在问题时 SHALL 在 stderr 输出带 name、package path 与具体问题的结构化诊断；成功且无问题时 stdout 为空
  - validation SHALL 包含 file definition 与 template existence checks

- **校验全部内置 Schema**
  - 用户执行 `xirang schema validate` 不带 name
  - 系统 SHALL 校验全部内置 Schema，任一无效时 SHALL 非零退出

- **未知 Schema 被拒绝**
  - 用户请求校验非内置 Schema
  - 命令 SHALL 非零退出并列出合法内置 ID

- **Verbose 输出检查阶段**
  - 用户使用 `--verbose`
  - 结果 SHALL 展示 YAML parsing、Zod validation、file definitions、template existence、dependency graph 与 file reference checks

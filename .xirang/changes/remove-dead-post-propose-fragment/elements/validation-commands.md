---
entity: element-declaration
identity: validation-commands
kind: element
parent: deterministic-operations
title: Validation Commands
definition: Validation Commands 定义 `xirang validate` 命令面的校验契约：顶层 validate 的选择与批量模式、显式 full-Change validation 与 concise preview、Requirement section 交叉校验、Scenario label 清洁度、fence-aware requirement 读取与 effective preview。
---

## ADDED Requirements

### Requirement: 无 delta change 的显式标记

validate 命令 SHALL 将 change-local `.delta-noop` 标记识别为显式无 delta 声明：存在该标记且 change 不携带任何 Semantic Delta 单元时，SHALL 不报无 delta 错误；标记不存在且无任何 delta 单元时，SHALL 报无 delta 错误。

#### Scenario: 标记存在时豁免无 delta 报错

- **WHEN** change 目录存在 `.delta-noop` 且四分区为空
- **THEN** validate SHALL 不报无 delta 错误

#### Scenario: 无标记且无 delta 时仍报错

- **WHEN** change 目录不存在 `.delta-noop` 且四分区为空
- **THEN** validate SHALL 报无 delta 错误

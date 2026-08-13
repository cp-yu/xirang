---
entity: element-declaration
identity: validation-commands
kind: element
parent: deterministic-operations
title: Validation Commands
definition: Validation Commands 定义 `xirang validate` 命令面的校验契约：顶层 validate 的选择与批量模式、显式 full-Change validation 与 concise preview、Requirement section 交叉校验、Scenario label 清洁度、fence-aware requirement 读取与 effective preview。
---

## ADDED Requirements

### Requirement: 任务计划文件冲突检测

validate 命令 SHALL 校验 tasks.md 中 task 间对同一文件的冲突声明：多个 task 对同一路径声明互斥的 Create、Modify 或 Delete 操作时，标记为报错。

#### Scenario: 检测到互斥文件声明

- **WHEN** tasks.md 中两个 task 对同一路径声明互斥操作
- **THEN** 校验输出 SHALL 标记报错
- **AND** SHALL 给出路径与 task 定位

### Requirement: 任务依赖顺序检测

validate 命令 SHALL 检测 tasks.md 的隐式依赖顺序问题：当 Task N 的 Files 声明 Modify 或 Delete 某路径，而该路径由执行顺序在后的 Task M 的 Files 声明 Create 产生时，标记为报错。

#### Scenario: 检测到前序 task 依赖后序 task 产出

- **WHEN** Task N 的 Files 声明 Modify 或 Delete 的路径由顺序在后的 Task M 声明 Create
- **THEN** 校验输出 SHALL 标记依赖顺序报错

### Requirement: Check 锚点与 Scenario 标题匹配

validate 命令 SHALL 校验 tasks.md 中 Check 的 Verifies 锚点：与 change-local Contract 的 Scenario 标题精确匹配，缺失或不匹配时标记为报错。Scenario 标题 SHALL 为无 operation label 的 canonical 形式。

#### Scenario: 检测到锚点不匹配

- **WHEN** Check 锚点引用的 Scenario 标题与 change-local Contract 的 canonical 标题不一致
- **THEN** 校验输出 SHALL 标记锚点报错

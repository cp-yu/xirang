---
entity: element-declaration
identity: task-decomposition
kind: element
parent: apply
title: Task Decomposition
definition: Task Decomposition 定义 Apply Phase 0 如何按 `tasks.md` 中的 TDD 闭环任务连续执行实现工作：严格 TDD、证据收集、任务勾选、诊断优先的失败处理与累计修复上限。
---

## MODIFIED Requirements

### Requirement: Master agent 直接执行 pending task

Apply 阶段的 Master agent SHALL 读取 `tasks.md` 中的 pending task，并在当前上下文中按 Check 执行严格 TDD、证据收集和任务勾选。实现 specs 未覆盖的细节时，agent SHALL 按"删除 > 标准库 > 平台原生 > 已安装依赖 > 直接表达式 > 最小实现"优先顺序选择方案。Agent SHALL NOT 质疑或简化 specs 明确要求的行为。

#### Scenario: 实现纪律为精简条目

- **WHEN** apply skill 被加载
- **THEN** skill SHALL 以 `Implementation Discipline` 节列出编码纪律
- **AND** 每条 SHALL 使用中性术语，不使用外部框架名称

#### Scenario: 非隔离流程步骤指向 reference

- **WHEN** apply agent 执行到 Preparation、Phase 1/2/3 verification 或 Output
- **THEN** agent SHALL 读取对应的 `.xirang/references/xirang-apply-step-<N>-<name>.md`
- **AND** skill body 中该步骤 SHALL 只提供一行描述和文件路径

#### Scenario: 隔离方法只读取一个 reference

- **WHEN** Preparation 已选择 branch、worktree 或 current-branch 方法
- **THEN** agent SHALL 只读取所选方法的 Step 2 reference
- **AND** MUST NOT 读取另外两个互斥方法 reference

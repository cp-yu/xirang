---
entity: element-declaration
identity: task-decomposition
kind: element
parent: apply
title: Task Decomposition
definition: Task Decomposition 定义 Apply Phase 0 如何依据 `tasks.md` 中已形成的 task-level TDD 闭环执行实现工作、收集证据、更新进度并处理失败恢复。它不定义执行主体、任务调度方式或具体实现方法。
---
## MODIFIED Requirements

### Requirement: Apply Phase 0 SHALL 依据 task-level TDD 处理 pending task

Apply Phase 0 SHALL 读取 `tasks.md` 中的 pending task，并按每个 task 的独立 TDD 闭环执行 Check、收集证据和更新任务进度。对于 Specs 未覆盖的实现细节，Apply SHALL 依据 Semantic Model、Change Plan、项目约束和当前 implementation evidence 作出与目标语义一致的实现判断，且 SHALL NOT 以额外的编排规则替代 Change Contract。

#### Scenario: Apply 处理独立 task-level TDD loop

- **WHEN** `tasks.md` 包含 pending task
- **THEN** Apply SHALL 按该 task 的 Goal、Files、Requirements 和 Checks 组织一个可独立验证的 TDD loop
- **AND** SHALL 在证据通过后更新对应 Check

#### Scenario: 实现纪律保持为中性指导

- **WHEN** apply skill 被加载
- **THEN** skill SHALL 以 `Implementation Discipline` 节提供适用于当前 Change 的执行指导
- **AND** 该指导 SHALL 使用中性术语，不把某一执行主体、调度方式或临时材料声明为规范要求

#### Scenario: 非隔离流程步骤指向 reference

- **WHEN** Apply 执行到 Preparation、Review、Optimization 或 seal 步骤
- **THEN** Apply SHALL 读取对应的 `.xirang/references/xirang-apply-step-<N>-<name>.md`
- **AND** skill body 中该步骤 SHALL 只提供一行描述和文件路径

#### Scenario: 隔离方法只读取一个 reference

- **WHEN** Preparation 已选择 branch、worktree 或 current-branch 方法
- **THEN** Apply SHALL 只读取所选方法的 Step 2 reference
- **AND** MUST NOT 读取另外两个互斥方法 reference

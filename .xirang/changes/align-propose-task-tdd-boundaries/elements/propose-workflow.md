---
entity: element-declaration
identity: propose-workflow
kind: element
parent: propose
title: Propose Workflow
definition: Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、definition-first authoring、架构范围 reconcile、post-propose validation 分级 gate 与状态输出收敛。
---

## ADDED Requirements

### Requirement: Propose 按 TDD 闭环划分 Tasks

Propose 生成 `tasks.md` 时 SHALL 以可独立实现与验证的完整闭环划分 task 边界，SHALL NOT 按 component、module、directory、file type 或 Requirement 数量机械拆分；声明 ready-for-apply 前 SHALL 交叉检查所有 task 边界，并 reconcile 违反独立验证的划分。

#### Scenario: 按行为闭环而非组件划分

- **WHEN** 多个组件共同交付一个行为
- **THEN** Propose SHALL 将它们放入同一 task

#### Scenario: Requirement 数量不构成拆分理由

- **WHEN** 一个 task 的 Requirements 超过上限
- **THEN** Propose SHALL 合并细节或将验证细节下沉到 Checks
- **AND** SHALL NOT 仅因数量拆分 task

#### Scenario: ready-for-apply 前边界自检

- **WHEN** Propose 准备声明 Change ready-for-apply
- **THEN** SHALL 交叉检查 Goals、Files、Requirements 与 Checks
- **AND** 发现 task 依赖后续 task 时 SHALL reconcile 边界后再声明

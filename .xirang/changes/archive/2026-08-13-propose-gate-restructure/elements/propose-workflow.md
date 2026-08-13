---
operation: MODIFIED
entity: element-declaration
identity: propose-workflow
kind: element
parent: propose
title: Propose Workflow
definition: Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、制品定义先行写作、架构范围 reconcile、post-propose validation 一致性验证门禁与状态输出收敛。
---

## REMOVED Requirements

### Requirement: Post-propose validation 使用分级 gate

### Requirement: Propose 使用 definition-first authoring

## ADDED Requirements

### Requirement: Propose 使用制品定义先行写作

每个 artifact 写入前，workflow SHALL 读取 resolved definition，按 content boundaries 路由语义，再执行 artifact instruction 与 template。Delta Contracts SHALL 只包含 canonical unlabeled target-state Requirements 与 Scenarios；完成 artifacts 后 SHALL 使用统一 change compiler 审阅 effective changes。

#### Scenario: Scenario operations 通过 diff 审阅

- **WHEN** Agent 已完成 delta Contracts、design、结构目标与 combined validation
- **THEN** Agent MUST NOT 手写或生成 Scenario operation labels
- **AND** SHALL 审阅 validate concise preview
- **AND** 非预期 operation SHALL 阻塞 ready-for-apply 并要求修正 source

#### Scenario: Specs 按 Behavior Source 生成

- **WHEN** propose 创建 change-local Contracts
- **THEN** SHALL 只消费 proposal Behavior Source 中的 Element identities
- **AND** SHALL 读取 Formal Contract 的 exact Requirement titles 后 author delta

#### Scenario: Specs boundary 不重复定义

- **WHEN** workflow 生成 Contracts
- **THEN** SHALL 依赖 `xirang instructions specs --change "<name>" --json` 返回的 definition（Element-owned Contract delta authoring 指导）
- **AND** SHALL NOT 在 workflow template 维护竞争的 behavior boundary

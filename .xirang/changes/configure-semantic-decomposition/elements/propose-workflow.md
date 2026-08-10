---
entity: element-declaration
identity: propose-workflow
kind: element
parent: propose
title: Propose Workflow
definition: Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、definition-first authoring、架构范围 reconcile、post-propose validation 分级 gate 与状态输出收敛。
---

## ADDED Requirements

### Requirement: 仅在 Propose 形成结构目标时应用拆分指导

Propose Workflow SHALL 在没有已确认 Change Structural Definition、且本次 Change 需要形成新增或重组 hierarchy 目标时消费 normalized `decomposition`。存在已确认 Change Structural Definition 时，Propose SHALL 忠实编译该完整 payload，SHALL NOT 通过配置的方法或 skill 重新裁决已确认结构。

#### Scenario: 无 framing 时形成结构 Delta

- **WHEN** Design Summary 要求新增或重组结构且不存在 Change Structural Definition
- **THEN** Propose 使用配置的方法或调用配置的 skill 形成完整目标结构
- **AND** 将结果编译为对应 Semantic Delta Entries

#### Scenario: 已确认 framing 优先

- **WHEN** handoff 包含有效且已确认的 Change Structural Definition
- **THEN** Propose 以该 payload 作为结构来源
- **AND** 不调用 decomposition skill 重做 identity、parent、Kind 或 Relationship 决策

#### Scenario: Architecture Source 为 None

- **WHEN** Change 只修改 Contracts 或 implementation scaffolding
- **THEN** Propose 不调用 decomposition skill
- **AND** 不从默认方法发明 Architecture Source

#### Scenario: 拆分指导不可用时阻塞 Formation

- **WHEN** Propose 必须形成结构目标但方法无法明确理解或 skill 调用失败
- **THEN** workflow 停止写入相关 Delta 并一次询问用户
- **AND** 不以默认 C4 或 implementation layout 猜测结构

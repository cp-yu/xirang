---
entity: "element-declaration"
identity: "single-dimension-decomposition"
kind: "element"
parent: "definition-framing"
title: "Single-dimension Decomposition"
definition: "Single-dimension Decomposition 是 Definition Framing 中按单维度分解结构的方法步骤。它确保每次分解只沿一个维度进行，避免维度混杂。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 单维度分解
Definition Framing 在 Build 或 Explore 中处理结构时 SHALL 对同一 parent 的 sibling set 使用单一分解维度，在用户确认范围内检查互斥与完整性，并按 BFS 确认当前层后继续展开。Kinds SHALL 表达类别而非固定层级，层数 SHALL 由项目语义决定。

#### Scenario: 沿单一维度分解
- **WHEN** 一次拆分同一 parent 的 children
- **THEN** 使用一个明确维度检查 siblings 的边界与覆盖，当前层未确认前不提前展开下一层。

#### Scenario: 不要求固定技术层级
- **WHEN** 领域概念或能力需要两层或多层精化
- **THEN** 按实际语义确定深度，不强制经过 C4 或固定 capability/component 层。

## ADDED Requirements

### Requirement: 区分语义精化与呈现组织
通用语义精化 SHALL 优先从领域概念、能力与用户目标确定语义边界；Perspective 仅用于具有真实语义视角且需要子级精化的单元，纯呈现 SHALL 使用 Views。同一概念 SHALL 只有一个稳定 identity，跨视角协作使用 Relationships。需要真实共享语义时 MAY 扩展 Kind。行为细节 SHALL 进入宿主 Element Contract，不以是否继续拆节点为条件。

#### Scenario: 语义视角与纯呈现分离
- **WHEN** 需要从另一个角度呈现同一批既有概念而没有新语义边界
- **THEN** 使用 View，不重复创建 Elements 或 Contracts。

#### Scenario: 叶节点仍保留行为细节
- **WHEN** 一个 Element 不需要更深子节点但具有条件、数值、例外或时序承诺
- **THEN** 这些承诺完整写入该 Element Contract，不因停止拆分而丢失。

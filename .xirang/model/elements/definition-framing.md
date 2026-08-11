---
entity: element-declaration
identity: definition-framing
kind: element
parent: explore
title: Definition Framing
definition: Definition Framing 是 Explore 中由用户选择进入的推荐阶段，用于在 Design Exploration 前先处理 Change 的结构定义。它以 Semantic Model 与项目证据为依据，通过因果定义、identity 与边界澄清、单维度分解和按 BFS 顺序确认同层结构，逐步确认 Change 涉及的 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships。
---

## Requirements

### Requirement: 澄清结构定义

Definition Framing SHALL 通过因果定义、identity 与边界澄清、单维度分解及按 BFS 顺序确认同层结构，形成用户可审查的结构目标。

#### Scenario: 结构意图仍有多个合理解释

- **WHEN** 不同 identity、Kind、parent 或 Relationship 选择会改变目标语义
- **THEN** Definition Framing 比较受限选项并一次请求一个用户裁决

### Requirement: 覆盖四类结构目标

Definition Framing SHALL 联合处理 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships，并允许目标引用当前 Semantic Model 中尚不存在但已在同一结构定义中完整声明的 Kinds 或 Elements。

#### Scenario: 新 Element 使用新 Kind

- **WHEN** 用户确认新增 Element 及其尚不存在的 Element Kind
- **THEN** Change Structural Definition 同时保存完整 Kind 目标与 Element Declaration 目标

### Requirement: 只持久化已确认结构

Definition Framing SHALL 仅在展示完整 payload、slug 与受控目标模式并获得用户明确的持久化确认后，通过 `xirang framing` 持久化结构定义。

#### Scenario: 用户只确认设计方向

- **WHEN** 用户选择方案或确认某个 section 但未作出明确的持久化确认
- **THEN** Definition Framing 不创建或更新 Change Structural Definition

### Requirement: 保持依赖设计一致

已持久化结构目标改变时，Definition Framing SHALL 标识受影响的后续设计决策并要求 Design Exploration 重新检查。

#### Scenario: 用户修改已确认 parent

- **WHEN** 新的持久化确认更新 Element 的结构位置
- **THEN** 依赖旧 hierarchy 的设计结论不得被静默保留

### Requirement: 组合替换前读取当前完整结构

Definition Framing SHALL 在组合任何 replacement payload 前通过 `xirang framing show` 读取完整当前 payload；replacement SHALL 由当前完整 payload 加上本次显式确认的变更组成，SHALL NOT 凭记忆重建或省略未确认删除；`framing update` 后 SHALL 审查返回的 diff，未获确认即从 payload 消失的目标视为上下文遗忘信号，SHALL 先调和再继续。

#### Scenario: 组合前读取当前 payload

- **WHEN** 需要更新已持久化的结构目标
- **THEN** Definition Framing 先运行 `xirang framing show` 读取完整当前 payload 再组合 replacement

#### Scenario: update 后审查 diff

- **WHEN** `framing update` 返回的 diff 显示目标未获确认即消失
- **THEN** Definition Framing 调和该目标后再继续

### Requirement: 按项目拆分指导确认结构目标

Definition Framing SHALL 在提出或确认 Element hierarchy 目标前消费 normalized `decomposition`：对 `method` 使用 Agent 已有方法知识，对 `skill` 调用用户提供的逻辑 skill。拆分指导 SHALL 与因果定义、identity 边界、单维度、MECE 和 BFS confirmation 联合使用，并 SHALL NOT 代替用户对完整结构 payload 的显式确认。

#### Scenario: 方法指导同层分解

- **WHEN** Definition Framing 需要为一个 parent 确定完整 sibling set 且配置有效 `method`
- **THEN** Agent 使用该方法选择分解维度
- **AND** 再以单维度、MECE 与 BFS 检查该层结构

#### Scenario: skill 指导自定义分解

- **WHEN** 配置有效 `skill`
- **THEN** Explore 在结构讨论前调用该 skill
- **AND** 主 Explore Agent 继续遵守一次一问、只读边界与独立 persistence confirmation

#### Scenario: 拆分指导不可用

- **WHEN** 方法无法明确理解或 skill 无法调用
- **THEN** Definition Framing 停止形成受影响结构目标并询问用户
- **AND** SHALL NOT 创建或更新 framing payload

#### Scenario: 拆分指导不覆盖 Formal 语义

- **WHEN** 拆分指导与 Formal Semantic Model、用户明确意图或已确认结构目标冲突
- **THEN** Agent 报告冲突并请求用户裁决
- **AND** SHALL NOT 用拆分指导静默替换规范语义

---
entity: element-declaration
identity: definition-framing
kind: element
parent: explore
title: Definition Framing
definition: Definition Framing 是 Explore 中由用户选择进入的推荐阶段，用于在 Design Exploration 前先处理 Change 的结构定义。它以 Semantic Model 与项目证据为依据，通过因果定义、identity 与边界澄清、单维度分解和按 BFS 顺序确认同层结构，逐步确认 Change 涉及的 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships。
---

## ADDED Requirements

### Requirement: 组合替换前读取当前完整结构

Definition Framing SHALL 在组合任何 replacement payload 前通过 `xirang framing show` 读取完整当前 payload；replacement SHALL 由当前完整 payload 加上本次显式确认的变更组成，SHALL NOT 凭记忆重建或省略未确认删除；`framing update` 后 SHALL 审查返回的 diff，未获确认即从 payload 消失的目标视为上下文遗忘信号，SHALL 先调和再继续。

#### Scenario: 组合前读取当前 payload

- **WHEN** 需要更新已持久化的结构目标
- **THEN** Definition Framing 先运行 `xirang framing show` 读取完整当前 payload 再组合 replacement

#### Scenario: update 后审查 diff

- **WHEN** `framing update` 返回的 diff 显示目标未获确认即消失
- **THEN** Definition Framing 调和该目标后再继续

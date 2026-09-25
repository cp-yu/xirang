---
entity: element-declaration
identity: design-exploration
kind: element
parent: explore
title: Design Exploration
definition: Design Exploration 是 Explore 中澄清和确认设计的阶段。它基于 Semantic Model 与项目证据，通过一次一问和方案比较推进设计；复杂变更分段确认适用的行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing 与 risks，窄变更至少确认 problem、impact scope、approach 与 verification method，最终形成不持久化的 Design Summary。
---

## Requirements

### Requirement: 处理确定性影响

Design Exploration SHALL 将 CLI 返回的格式、版本与显式上下文变化纳入设计复核；CLI 可提供确定性影响线索，但不能据此断言自然语言设计无冲突或完整。

#### Scenario: 上下文变化后复核设计

- **WHEN** 记录关联的正式模型上下文发生变化
- **THEN** 重查相关设计和授权，区分预期模型演进与未解决矛盾，而非直接丢弃记录或接受新状态。

### Requirement: 确认适用设计

Design Exploration SHALL 通过一次一问、方案比较与适用 section confirmation，确认行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing、risks 及其他必要设计维度。

#### Scenario: 多个实现方案符合目标语义

- **WHEN** 多个方案具有不同权衡
- **THEN** Design Exploration 比较方案并请求用户选择

### Requirement: 形成不持久化的 Design Summary

Design Exploration SHALL 在适用设计确认后形成 conversation-only Design Summary 供 Propose 使用。有记录时 SHALL 先重载完整当前记录，检查记录内部及记录与拟议设计间冲突，由用户裁决未决意图；涉及记录修改时仍单独授权并在保存后重载复核。任一未决冲突 SHALL 阻止 Summary，之后记录变化 SHALL 使受影响结论失效。

#### Scenario: Design Exploration 完成

- **WHEN** 适用设计已确认，当前记录已重载且不存在未决冲突
- **THEN** 呈现 conversation-only Design Summary，等待用户触发 Propose。

#### Scenario: 冲突阻止 Summary

- **WHEN** 记录内部互相矛盾或拟议设计违背既有确认
- **THEN** 说明冲突及影响，等待用户裁决，不输出可交接的 Summary。

#### Scenario: 裁决后重新检查

- **WHEN** 用户裁决并单独授权必要记录修改
- **THEN** 保存并检查 diff，再读取完整记录重查冲突；通过后才生成 Summary。

#### Scenario: 后续记录变化使 Summary 过期

- **WHEN** Summary 已产生但相关记录条目随后改变
- **THEN** 重查并更新受影响 Summary 和覆盖结论，不使用旧结论放行。

### Requirement: 使用完整当前确认记录

Design Exploration SHALL 在开始、恢复和准备输出 Summary 时读取存在的完整当前记录，联合 Semantic Model 与项目证据使用已确认内容，不得仅依赖最近对话或记录摘要。无记录时 SHALL 直接按通常流程探索。

#### Scenario: 恢复已有记录的探索

- **WHEN** 已有记录而对话中仅剩部分上下文
- **THEN** 通过 CLI 读取完整当前记录后继续，保留未出现在最近对话中的确认。

#### Scenario: 没有记录时正常继续

- **WHEN** 记录不存在
- **THEN** 基于模型与项目证据自审设计，不要求建立空记录。

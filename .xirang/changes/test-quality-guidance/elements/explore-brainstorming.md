---
entity: element-declaration
identity: explore-brainstorming
operation: MODIFIED
kind: element
parent: design-exploration
title: Explore Brainstorming
definition: Explore Brainstorming 定义 Explore 的只读设计澄清流程：6 步 brainstorming checklist、一次一问的提问纪律、2-3 方案对比、分段设计确认、Design Summary 生成、范围检查与拆解建议、捕获边界路由以及主代理只读边界。
---

## MODIFIED Requirements

### Requirement: 分段设计呈现

系统 SHALL 分段呈现并确认适用于当前问题的设计内容。复杂变更通常覆盖 architecture、core components、data flow、technology stack、testing strategy 与 risks/trade-offs；窄修改 MAY 省略明显不适用的章节，但 MUST 至少确认 problem、impact scope、approach 与 verification method。Testing Strategy SHALL 先应用共享测试品质（可重复隔离、锁行为不锁结构、单一失败原因，以及难测先改设计），再决定 reuse、modify、add、delete 或 one-time；SHALL NOT 按 Scenario 条数机械规划持久化测试。

#### Scenario: 逐段确认

- **WHEN** 系统准备呈现完整设计
- **THEN** 系统依次呈现并确认架构方案、核心组件、数据流、技术栈、测试策略、风险和权衡

#### Scenario: 窄修改压缩设计确认

- **WHEN** 当前问题不需要独立的组件、数据流或技术栈决策
- **THEN** 系统 MAY 省略这些不适用章节
- **AND** SHALL 仍分别确认 problem、impact scope、approach 与 verification method
- **AND** verification method SHALL 仍应用共享测试品质

#### Scenario: Testing Strategy 应用测试品质

- **WHEN** Testing Strategy 阶段呈现验证计划
- **THEN** 系统 SHALL 先说明要防止的可观察行为回归与现有覆盖
- **AND** SHALL 只在现有测试无法保护该行为时规划新增持久化测试
- **AND** SHALL 为每个新增边界说明它能捕获、现有测试捕获不到的缺陷

#### Scenario: Testing Strategy 按行为而非 Scenario 规划

- **WHEN** 一个 Requirement 含多个描述同一行为与同一失败原因的 Scenario
- **THEN** Testing Strategy SHALL 将它们规划为一条持久化测试或一个验证项
- **AND** SHALL NOT 为每个 Scenario 各规划一个测试文件

#### Scenario: Testing Strategy 阶段识别过时测试

- **WHEN** 设计涉及架构变更、API 重构、数据布局调整或行为删除
- **THEN** 系统 SHALL 读取相关测试并识别假设冲突、重复保护、结构耦合或弱断言测试
- **AND** 系统 SHALL 将它们分类为更新、删除或保留
- **AND** 若项目存在多个测试目录，系统 SHALL 确定权威测试套件

#### Scenario: Testing Strategy 阶段分类 persistent 与 one-time verification

- **WHEN** Testing Strategy 阶段呈现测试项
- **THEN** 系统 SHALL 将每个验证项分类为 persistent 或 one-time verification
- **AND** 对 one-time verification 项，系统 SHALL 不规划 persistent 测试文件
- **AND** 当存在 one-time verification 项时，系统 SHALL 在 Design Summary 的 Testing Strategy 下输出 `One-time Verification` 子节
- **AND** typecheck、build、一次性 grep 与纯制品文本核对 SHALL 归入 one-time，除非它们本身就是该行为的唯一可观察证据

#### Scenario: 用户要求修改

- **WHEN** 用户在某一段提出修改意见
- **THEN** 系统修改该段内容
- **THEN** 重新呈现修改后的内容，等待确认
- **THEN** 确认后继续下一段

#### Scenario: Test Maintenance 子节格式

- **WHEN** 现有测试需要更新、删除或被新测试替代
- **THEN** Testing Strategy SHALL 列出 reuse、modify、delete、add 与 one-time 项及原因
- **AND** SHALL 标注 authoritative suite

#### Scenario: 单方案中发现过度规格化

- **WHEN** 系统在讨论单个设计决策（如数据模型、API 设计、组件层次），且 ponytailladder 发现该设计引入了不必要的抽象、新依赖或已有平台能力可覆盖的实现
- **THEN** 系统 SHALL 用一行指出简化方式
- **AND** 系统在 ponytailladder 无特别发现时自然跳过，不强制输出

---
operation: "MODIFIED"
entity: "element-declaration"
identity: "change-structural-definition"
kind: "element"
parent: "definition-framing"
title: "已确认设计记录"
definition: "已确认设计记录是 Definition Framing 形成的精简中间制品，独立承载后续生成需要遵循的用户确认内容。它包含已确认的结构片段、行为细节及用户指定材料，表达一次形成上下文中的当前确认结果；不等同于完整结构目标草稿、Contract、Design Summary 或执行计划。它为 Build 与 Propose 提供形成依据，不独立确定 Expected Semantic Model，也不成为形成完成后的规范语义来源。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 保持稳定身份与最新状态
记录 SHALL 使用不可变 explorationId、可变 slug 与稳定条目身份，表达当前已确认状态；修订 SHALL 更新相关条目并保留无关条目，不保存相互冲突的累积对话，不要求 revision history 或 readiness 状态。

#### Scenario: 重命名保留记录身份
- **WHEN** 用户重命名记录标题或 slug
- **THEN** explorationId 和未变更条目的 identity 不变。

#### Scenario: 修订保持当前态
- **WHEN** 用户授权修订一个已确认条目
- **THEN** 保存最新获准内容而非并列保留相互冲突版本。

### Requirement: 保存相关 Semantic Model 基准快照
记录 SHALL 保存 CLI 计算的来源版本标识及相关上下文基准，以区分捕获时不存在的 formal model、存在且有效的模型及之后上下文变化。相关语义身份仅在已知时显式关联，SHALL NOT 以自然语言猜测完整依赖范围；CLI 比较能确定的上下文变化，其结果不是语义覆盖证明。

#### Scenario: 首次 Build 无正式模型
- **WHEN** 合法 Build 上下文中尚不存在 formal model
- **THEN** 基准明确记录缺失状态，允许保存已确认设计。

#### Scenario: 模型损坏不等于缺失
- **WHEN** formal source 存在但解析或校验失败
- **THEN** 返回错误，不以不存在的基准继续写入。

#### Scenario: 上下文变化可见
- **WHEN** 记录捕获后关联的模型上下文发生变化
- **THEN** 报告变化与可用差异，消费者重查相关结论，不宣称自动判断语义冲突。

### Requirement: 仅作为形成来源与历史记录
记录 SHALL 为 Build 或 Propose 提供形成依据；目标完成覆盖复核与适用校验后，精确来源快照仅作为形成历史。Candidate 来源可绑定 review digest 并进入 Build history，但 SHALL NOT 提升进 formal partitions；Change 来源 SHALL NOT 参与 Expected Semantic Model、sync 或 Closure 的规范语义计算。

#### Scenario: Change 来源完成交接
- **WHEN** 完整 Change 覆盖确认内容且通过校验并完成来源消费
- **THEN** 快照保留形成历史，目标语义仍仅由 Semantic Model 与 Semantic Delta 决定。

#### Scenario: Build 来源保留而不提升
- **WHEN** 带来源快照的 Candidate 被确认并成功提升
- **THEN** 来源进入 Build history，不进入正式模型四分区。

## ADDED Requirements

### Requirement: 保存精简当前确认内容
已确认设计记录 SHALL 保存一次形成上下文中的精简当前确认内容，可包含结构片段、行为细节及用户指定材料；SHALL NOT 要求完整目标模型、四类结构数组或与所有未来 Contract 一一对应。Build 与 Change 形成 SHALL 共享一种记录模型但使用独立实例。

#### Scenario: 分别记录 Build 与 Change 设计
- **WHEN** Build 与 Explore 分别形成关键确认
- **THEN** 使用相同格式的不同记录身份，不互相覆盖或共用一个全局内容记录。

#### Scenario: 局部确认即可记录
- **WHEN** 用户只确认一个行为条件并授权保存
- **THEN** 保存该条目，不要求先补全 hierarchy、Kinds 或 Relationships。

### Requirement: 区分确认条目与规范 Delta
记录 SHALL 使用稳定条目身份表达当前确认内容与其性质，不以 ADDED / MODIFIED / REMOVED 结构目标集替代语义记录；从记录生成目标语义时 SHALL 区分规范确认、设计说明与用户要求保留的材料，不能把后两者自动转换为规范义务。

#### Scenario: 说明材料不自动规范化
- **WHEN** 用户要求保留一个理由或被否决的方案
- **THEN** 记录其说明性质，生成时路由到 Plan 或 provenance，不虚构 Contract 承诺。

## REMOVED Requirements

### Requirement: 保存完整当前结构目标

### Requirement: 区分目标态与删除

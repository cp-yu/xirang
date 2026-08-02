---
entity: element-declaration
identity: semantic-validation
kind: capability
parent: semantic-model
title: Semantic Validation
definition: Semantic Validation 定义 Semantic Model 语义验证器的检查契约：ownership cardinality、precedes DAG、metadata 完整性、结构化错误输出与 Kind 约束执行。它以当前四分区 Semantic Model 为对象，不依赖 LikeC4 nesting 或 legacy spec registry。
---

## Requirements

### Requirement: 语义验证器 SHALL 检查 ownership cardinality

语义验证器 SHALL 将层级 containment 解释为 abstraction/refinement，而非 domain ownership。新版 model SHALL 恰有一个 Project Root；每个非 root element SHALL 恰有一个 parent，containment SHALL 无环，并 SHALL 遵守 Metamodel 中显式声明的 parent/child constraints。

#### Scenario: 检测缺失 Project Root
- **WHEN** 新版 model 不包含 Project Root
- **THEN** SHALL 返回 `MISSING_PROJECT_ROOT` ERROR

#### Scenario: 检测多个 Project Roots
- **WHEN** 新版 model 包含多个 root elements
- **THEN** SHALL 返回 `MULTIPLE_PROJECT_ROOTS` ERROR
- **AND** SHALL 列出 root element IDs

#### Scenario: 检测 containment cycle
- **WHEN** parent chain 形成 cycle
- **THEN** SHALL 返回 `CONTAINMENT_CYCLE` ERROR
- **AND** SHALL 展示 cycle path

#### Scenario: 默认开放与显式约束
- **WHEN** Metamodel 未声明 kind pair constraint
- **THEN** nesting SHALL 通过
- **WHEN** Metamodel 明确禁止该 parent/child pair
- **THEN** SHALL 返回 `INVALID_CONTAINMENT` ERROR
#### Scenario: Root 缺失或重复
- **WHEN** model 不包含 Project Root 或包含多个 Project Roots
- **THEN** validation SHALL 返回 ERROR
- **AND** SHALL 列出检测到的 root element IDs
### Requirement: 验证器 SHALL 检测 precedes cycle

验证器 SHALL 确保 `precedes` relations 形成有向无环图，并 SHALL 对任意 element kinds 使用 canonical identity 报告 path。

#### Scenario: 检测简单 cycle
- **GIVEN** `precedes` relations 为 A → B、B → C、C → A
- **WHEN** 运行语义验证
- **THEN** SHALL 返回包含 A → B → C → A 的 ERROR

#### Scenario: 检测自环
- **WHEN** element 声明 A `precedes` A
- **THEN** SHALL 返回 self-loop ERROR

#### Scenario: DAG 通过验证
- **WHEN** `precedes` relations 形成 DAG
- **THEN** cycle validation SHALL 通过

### Requirement: 验证器 SHALL 检查 metadata 完整性

验证器 SHALL 检查每个新版 element 包含唯一、非空 identity 与完整 Definition，并通过 identity source index 检查 contract completeness。

#### Scenario: 缺失 identity
- **WHEN** 新版 element 未声明合法 identity
- **THEN** SHALL 返回 `MISSING_IDENTITY` ERROR

#### Scenario: 重复 identity
- **WHEN** 多个 elements 声明相同 identity
- **THEN** SHALL 返回 `DUPLICATE_IDENTITY` ERROR
- **AND** SHALL 列出冲突 identities

#### Scenario: Required contract 缺失
- **WHEN** element kind 的 `contractPolicy` 为 `required` 且该 element 没有 Contract
- **THEN** SHALL 返回 `MISSING_REQUIRED_CONTRACT` ERROR

#### Scenario: Optional contract 缺失
- **WHEN** element kind 的 `contractPolicy` 为 `optional` 且该 element 没有 Contract
- **THEN** SHALL NOT 产生 issue
#### Scenario: 重复 elementId
- **WHEN** 多个 elements 声明相同 `identity`
- **THEN** SHALL 返回 `DUPLICATE_ELEMENT_ID` ERROR
- **AND** SHALL 列出冲突 FQNs
#### Scenario: 重复 elementId 被拒绝
- **WHEN** 两个 elements 声明同一 `identity`
- **THEN** validation SHALL 返回 ERROR
- **AND** SHALL 报告两个 elements 的 FQN
#### Scenario: Required contract 完整
- **WHEN** required element 在其宿主 `elements/` 单元正文中携带 Contract（requirements 非空）
- **THEN** contract completeness SHALL 通过
#### Scenario: Required contract 缺失（kind policy）
- **WHEN** required element 没有任何对应 Contract
- **THEN** validation SHALL 返回 source completeness ERROR
#### Scenario: Optional contract 缺失（kind policy）
- **WHEN** optional element 没有对应 Contract
- **THEN** validation SHALL 通过且 MUST NOT 报缺失 contract warning
### Requirement: 验证器 SHALL 提供结构化错误输出

验证结果 SHALL 区分 errors 与 warnings，并为 root、element identity、containment、contracts 与 relations 提供稳定 code、message 和可选 element ID。

#### Scenario: 结构化验证结果
- **WHEN** 运行完整 validation
- **THEN** SHALL 返回 errors 与 warnings 数组，errors SHALL 阻止验证通过，warnings SHALL NOT 阻止通过

#### Scenario: 验证通过时无 errors
- **WHEN** root、identity、containment、contracts 与 relations 全部合法
- **THEN** result SHALL 为 success 且 errors 为空

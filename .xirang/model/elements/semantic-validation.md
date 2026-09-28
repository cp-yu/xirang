---
entity: element-declaration
identity: semantic-validation
kind: element
parent: semantic-model
title: Semantic Validation
definition: Semantic Validation 定义 Semantic Model 语义验证器的检查契约：ownership cardinality、precedes DAG、metadata 完整性、结构化错误输出与 Kind 约束执行。它以当前四分区 Semantic Model 为对象，不依赖 LikeC4 nesting 或 legacy spec registry。
---

## Specification

### Section: 语义验证器 SHALL 检查 ownership cardinality

语义验证器 SHALL 将层级 containment 解释为 abstraction/refinement，而非 domain ownership。新版 model SHALL 恰有一个 Project Root；每个非 root element SHALL 恰有一个 parent，containment SHALL 无环，并 SHALL 遵守 Metamodel 中显式声明的 parent/child constraints。

- **检测缺失 Project Root**
  - 新版 model 不包含 Project Root
  - SHALL 返回 `MISSING_PROJECT_ROOT` ERROR

- **检测多个 Project Roots**
  - 新版 model 包含多个 root elements
  - SHALL 返回 `MULTIPLE_PROJECT_ROOTS` ERROR
  - SHALL 列出 root element IDs

- **检测 containment cycle**
  - parent chain 形成 cycle
  - SHALL 返回 `CONTAINMENT_CYCLE` ERROR
  - SHALL 展示 cycle path

- **默认开放与显式约束**
  - Metamodel 未声明 kind pair constraint
  - nesting SHALL 通过
  - Metamodel 明确禁止该 parent/child pair
  - SHALL 返回 `INVALID_CONTAINMENT` ERROR

- **Root 缺失或重复**
  - model 不包含 Project Root 或包含多个 Project Roots
  - validation SHALL 返回 ERROR
  - SHALL 列出检测到的 root element IDs
### Section: 验证器 SHALL 检测 precedes cycle

验证器 SHALL 确保 `precedes` relations 形成有向无环图，并 SHALL 对任意 element kinds 使用 canonical identity 报告 path。

- **检测简单 cycle**
  - `precedes` relations 为 A → B、B → C、C → A
  - 运行语义验证
  - SHALL 返回包含 A → B → C → A 的 ERROR

- **检测自环**
  - element 声明 A `precedes` A
  - SHALL 返回 self-loop ERROR

- **DAG 通过验证**
  - `precedes` relations 形成 DAG
  - cycle validation SHALL 通过

### Section: 验证器 SHALL 检查 metadata 完整性

验证器 SHALL 检查每个新版 element 包含唯一、非空 identity 与完整 Definition，并通过 identity source index 检查 contract completeness。

- **缺失 identity**
  - 新版 element 未声明合法 identity
  - SHALL 返回 `MISSING_IDENTITY` ERROR

- **重复 identity**
  - 多个 elements 声明相同 identity
  - SHALL 返回 `DUPLICATE_IDENTITY` ERROR
  - SHALL 列出冲突 identities

- **Required contract 缺失**
  - element kind 的 `contractPolicy` 为 `required` 且该 element 没有 Contract
  - SHALL 返回 `MISSING_REQUIRED_CONTRACT` ERROR

- **Optional contract 缺失**
  - element kind 的 `contractPolicy` 为 `optional` 且该 element 没有 Contract
  - SHALL NOT 产生 issue

- **重复 elementId**
  - 多个 elements 声明相同 `identity`
  - SHALL 返回 `DUPLICATE_ELEMENT_ID` ERROR
  - SHALL 列出冲突 FQNs

- **重复 elementId 被拒绝**
  - 两个 elements 声明同一 `identity`
  - validation SHALL 返回 ERROR
  - SHALL 报告两个 elements 的 FQN

- **Required contract 完整**
  - required element 在其宿主 `elements/` 单元正文中携带 Contract（Sections 非空）
  - contract completeness SHALL 通过

- **Required contract 缺失（kind policy）**
  - required element 没有任何对应 Contract
  - validation SHALL 返回 source completeness ERROR

- **Optional contract 缺失（kind policy）**
  - optional element 没有对应 Contract
  - validation SHALL 通过且 MUST NOT 报缺失 contract warning
### Section: 验证器 SHALL 提供结构化错误输出

验证结果 SHALL 区分 errors 与 warnings，并为 root、element identity、containment、contracts 与 relations 提供稳定 code、message 和可选 element ID。

- **结构化验证结果**
  - 运行完整 validation
  - SHALL 返回 errors 与 warnings 数组，errors SHALL 阻止验证通过，warnings SHALL NOT 阻止通过

- **验证通过时无 errors**
  - root、identity、containment、contracts 与 relations 全部合法
  - result SHALL 为 success 且 errors 为空

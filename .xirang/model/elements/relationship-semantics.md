---
entity: element-declaration
identity: relationship-semantics
kind: element
parent: relationships
title: Relationship Semantics
definition: Relationship Semantics 定义 Relationships 的关系词汇、端点约束与全图语义验证契约。关系 Kind 的权威由当前 Semantic Model 的 Metamodel 投影确定，containment 派生语义不作为持久化 edges。
---

## Specification

### Section: 关系 Kind 权威来自 Metamodel 投影

系统 SHALL 从当前 Metamodel 派生 relationship token、方向、含义、可选端点约束与合法 examples。Relationship 实例 SHALL 只由 `source`、`kind`、`target` 三元组构成，不含 description、note 或其他可变内容；Kind 的共享语义由对应 Metamodel 单元正文承载。Runtime validation、authoring guidance、query 与 view MUST 使用同一投影。

- **Metamodel projection 保持一致**
  - 系统渲染 relation authoring surface
  - surface SHALL 包含 model 声明的 relationship kinds
  - endpoint rules SHALL 与 runtime validator 一致

- **生成制品漂移被拒绝**
  - checked-in generated reference 与 Metamodel projection 不同
  - consistency check SHALL 失败
  - SHALL 指明显式生成文件

- **提供 relationship kinds 参考**
  - skill 指导添加或删除 relationship
  - SHALL 从当前 Metamodel 读取允许 kinds（含 Kind 共享语义）
  - SHALL 说明 containment 不使用 relationship 重复表达
### Section: 精确 relation vocabulary

默认模型 SHALL 提供 `invokes`、`produces`、`consumes`、`precedes`、`constrains`、`validates`、`responsible-for` 与 `supports-presentation`。Containment SHALL 派生 `belongs_to`、`refines` 与 `abstracts` 查询语义，MUST NOT 将它们持久化为 relationship edges。

- **默认 semantic relationships 通过**
  - relation 使用默认 token 且满足可选 endpoint constraints
  - parsing 与 semantic validation SHALL 通过

- **Persisted containment relation 被拒绝**
  - 新版 graph 显式声明 `belongs_to`、`refines` 或 `abstracts` edge
  - validation SHALL 返回重复语义 ERROR

### Section: Relation endpoint 合同

Relationship endpoints SHALL 引用可解析 elements，并遵守 Metamodel 可选 `sourceKinds` 与 `targetKinds`。未声明 endpoint constraint 时默认开放。Relationship 实例 SHALL 只包含 `source`、`kind` 与 `target`，SHALL NOT 包含 description、note 或其他可变内容。

- **Produces 和 consumes 表达 information flow**
  - information element kind 满足 Metamodel target constraint
  - producer `produces` information 且 consumer `consumes` information
  - 两条 relations SHALL 通过
  - information element MAY 拥有自己的 Contract

- **Endpoint constraint 违规**
  - relation endpoint kind 不满足显式 Metamodel constraint
  - validation SHALL 返回包含 relation 与 endpoint kinds 的 ERROR

### Section: Relation 全图语义验证

系统 SHALL 对 formal model 与 target Semantic Model 执行同一 relation validator。Validator SHALL 检查 endpoint existence、optional kind constraints、self-loop、duplicate、dangling relation 与 cycle；`precedes` cycle MUST 为 ERROR。

- **Precedes cycle 被拒绝**
  - `precedes` relations 形成 cycle
  - SHALL 返回使用 canonical identities 的 cycle path

- **不同机制连接同一 pair**
  - A `invokes` B 且 A `consumes` B
  - SHALL 接受两条不同 kind relations
  - 重复 `{source,kind,target}` SHALL 被拒绝

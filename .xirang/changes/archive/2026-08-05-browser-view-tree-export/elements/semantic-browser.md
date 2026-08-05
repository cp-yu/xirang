---
entity: element-declaration
identity: semantic-browser
kind: element
parent: interaction-surfaces
title: Semantic Browser
definition: Semantic Browser 是以 Views 可视化浏览项目语义的 Interaction Surface。它独立建模以提供面向用户的层级浏览与差异审查，包含 Semantic Model、active Candidate 与 active Changes 派生视角中的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views；不负责规范语义持久化、Candidate promotion 或 Change Closure。
---

## ADDED Requirements

### Requirement: 提供当前 view 的层级树导出

Semantic Browser SHALL 为当前 view 提供层级树导出：按视图内呈现元素的父子层级构建树，根为视图根元素，子元素按声明层级嵌套，且树 SHALL 仅包含当前 view 呈现的元素。

#### Scenario: 导出当前 view 层级树

- **WHEN** 用户从导出菜单选择层级树导出
- **THEN** 打开层级树导出页，内容为当前 view 的元素层级树
- **AND** 根节点为当前 view 的根元素，子孙按父子关系嵌套

#### Scenario: 树仅含当前 view 元素

- **WHEN** 当前 view 只呈现模型的一部分元素
- **THEN** 层级树 SHALL 只包含该 view 呈现的元素及其层级
- **AND** SHALL NOT 混入 view 之外的模型元素

### Requirement: 层级树多格式与字段选择

层级树导出 SHALL 支持三种序列化格式——纯文本缩进树（`├──`/`└──` 树形线）、Markdown 嵌套列表与 JSON 结构化层级——由用户在导出页选择；文本与 Markdown 每行内容 SHALL 按 `title`/`fqn`/`kind` 字段组合呈现，JSON SHALL 恒包含 `title`、`fqn`、`kind` 与 `children`。

#### Scenario: 切换导出格式

- **WHEN** 用户在层级树导出页选择纯文本、Markdown 或 JSON 格式
- **THEN** 内容按所选格式重新渲染
- **AND** 复制与下载的文件扩展名与所选格式一致（`.tree.txt`/`.tree.md`/`.tree.json`）

#### Scenario: 选择每行字段

- **WHEN** 用户勾选 `title`、`fqn` 与 `kind` 字段
- **THEN** 文本与 Markdown 的每行按选中字段组合呈现
- **AND** 未选中的字段不出现在行内容中

#### Scenario: JSON 输出全字段

- **WHEN** 格式为 JSON
- **THEN** 输出为嵌套 JSON，每个节点包含 `title`、`fqn`、`kind` 与 `children`
- **AND** 不受字段选择影响

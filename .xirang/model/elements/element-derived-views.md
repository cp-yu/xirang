---
entity: element-declaration
identity: element-derived-views
kind: capability
parent: derived-views
title: "Element-derived Views"
summary: "由一个 Element 及其 children 推导的下钻视图。"
---

## Requirements

### Requirement: 从 Element 层级确定性推导
Element-derived View SHALL 由焦点 Element 及其 children 确定性推导。

#### Scenario: 相同 Element 状态重复派生
- **WHEN** 系统再次读取相同 Element 与 children
- **THEN** 生成语义等价的派生视图

### Requirement: 形成 Element 下钻视图
Element-derived View SHALL 形成焦点 Element 的下钻视图。

#### Scenario: 用户下钻 Element
- **WHEN** 用户查看一个 Element 的精化
- **THEN** 视图呈现该 Element 与其 children

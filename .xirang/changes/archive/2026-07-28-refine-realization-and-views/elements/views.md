---
entity: element-declaration
identity: views
---

## ADDED Requirements

### Requirement: 区分 View Composition 与 View Presentation

Views SHALL 以 View Composition 表达呈现视角如何形成，并以 View Presentation 表达语义信息如何传达给用户；两个维度 SHALL 相互独立。

#### Scenario: 同一 View 采用多种呈现方法

- **WHEN** 一个 Authored View 或 Derived View 同时提供 Visual Presentation 与 Text Presentation
- **THEN** 两种方法表达同一呈现视角且不改变该 View 的组成方式

---
operation: ADDED
entity: element-declaration
identity: test-entity
kind: test-component
parent: derived-views
title: "Test Entity"
definition: 用于验证 Change-derived View 渲染的测试 Element。它独立建模以提供一个可观察的语义 Delta 实体，供 Change-derived View 呈现 ADDED 差异。它包含一个简单 Requirement 与一个 Scenario，不包含任何真实项目功能，与 siblings 无关。
---

## ADDED Requirements

### Requirement: 被 Change-derived View 正确识别

test-entity SHALL 在活动 Change 的 Change-derived View 中以 ADDED 语义呈现，并包含其 Declaration 与完整 Contract。

#### Scenario: 查看 Change-derived View

- **WHEN** 用户打开本 Change 的 Change-derived View
- **THEN** View 中 `test-entity` 以 ADDED 标记呈现
- **AND** 其 Declaration（identity、kind、parent、title、definition）与 Contract（Requirement、Scenario）完整可见
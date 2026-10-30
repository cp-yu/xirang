---
operation: ADDED
entity: element-declaration
identity: test-entity
kind: test-component
parent: view-composition
title: "Test Entity"
definition: 用于验证 Change-derived View 渲染的测试 Element。它独立建模以提供一个可观察的语义 Delta 实体，供 Change-derived View 呈现 ADDED 差异。它包含简单 Section 与 Acceptance Case 正文，不包含任何真实项目功能，与 view-composition 的其他 children 无关。
---

## ADDED Sections

### Section: 被 Change-derived View 正确识别

test-entity SHALL 在活动 Change 的 Change-derived View 中以 ADDED 语义呈现，并包含其 Declaration 与完整 Contract。

#### Acceptance Case: 查看 Change-derived View

- **WHEN** 用户打开本 Change 的 Change-derived View
- **THEN** View 中 `test-entity` 以 ADDED 标记呈现
- **AND** 其 Declaration（identity、kind、parent、title、definition）与 Contract（Section、Acceptance Case）完整可见

### Section: 支持伪代码形式的 Acceptance Case 正文

test-entity SHALL 接受伪代码形式的 Acceptance Case 正文，不限于 WHEN/THEN/AND 结构。

#### Acceptance Case: 纯伪代码正文

for i in 1..n-1:
  for j in i+1..n:
    if a[j] < a[i]: swap(a[i], a[j])

#### Acceptance Case: 混合正文

- **WHEN** 用户打开本 Change 的 Change-derived View
- **THEN** 伪代码与 WHEN/THEN/AND 正文均完整可见
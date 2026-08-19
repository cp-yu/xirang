## Context

测试 Change-derived View 在 Semantic Browser 中的正确渲染，需要覆盖三种操作类型（ADDED、MODIFIED、REMOVED）与三种语义维度（Element、Element Kind、Relationship）。

## Goals / Non-Goals

**Goals:**
- 覆盖三种操作类型：ADDED、MODIFIED、REMOVED
- 覆盖三种语义维度：Element（Declaration + Contract）、Element Kind（Metamodel）、Relationship（含 Relationship Kind）
- 所有 delta 可被 Change-derived View 正确识别并呈现差异

**Non-Goals:**
- 不修改任何代码
- 不涉及真实项目功能

## Decisions

- **ADDED Element**: `test-entity` 验证新增 Declaration + Contract 的渲染；其 Contract 额外含一个伪代码形式 Scenario 正文的 Requirement，验证正文不受 WHEN/THEN/AND 结构限制
- **ADDED Element Kind**: `test-component` 验证新增 Element Kind 的渲染
- **ADDED Relationship Kind + Relationship**: `test-references` + `test-entity`→`authored-views` 验证新增关系维度渲染
- **MODIFIED Element Declaration**: `authored-views` 修改 definition 文本，验证 MODIFIED 标记的渲染
- **REMOVED Relationship**: `cli` `supports-presentation` `text-presentation` 移除，验证 REMOVED 标记的渲染

## Risks / Trade-offs

- [Low] 测试 Change 在 Full Model 中会产生临时 Element 并修改 `perspective` 的 body 文本，但仅用于验证、不影响正式语义。
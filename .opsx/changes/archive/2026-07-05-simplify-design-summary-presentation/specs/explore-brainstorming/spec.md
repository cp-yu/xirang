## ADDED Requirements

### Requirement: Design Summary 无格式包裹

系统 SHALL 直接在对话上下文中以自然 prose 呈现 Design Summary，不使用任何代码 fence 或结构块包裹。

#### Scenario: Design Summary 不使用代码 fence 包裹

- **WHEN** 系统生成 Design Summary
- **THEN** 系统 SHALL 直接以自然对话 prose 呈现 Design Summary
- **AND** 系统 SHALL NOT 使用 Markdown code fence（```）或 Org-mode source block（`#+BEGIN_SRC`）包裹 Design Summary
- **AND** 系统 SHALL NOT 在提示词中对 Design Summary 使用 "visible content block" 或 "可见的内容块" 等可能诱导格式包裹的措辞

## Why

`Present the Design Summary as a visible content block` 的措辞持续诱导 AI 模型将 Design Summary 用代码块（通常会包裹在 #+BEGIN_SRC text / ```text 等 fence 中）呈现，导致模型输出的是「Markdown 原始文本」而非自然对话内容。问题根因在于 "visible content block" 的语义歧义，模型将其理解为代码 fence 或特定结构块（例如 Markdown code block）。

## What Changes

- 移除 `Present the Design Summary as a visible content block`，替换为无格式暗示的 `Present the Design Summary.` / `Present the Design Summary, then end with...`
- 同步更新 spec 中对「可见的内容块」的表述，改为「在对话中先行呈现 Design Summary 内容」
- 对应更新测试断言（检查新提示，断言旧措辞不再出现）
- 通过 `openspec update` 同步生成所有 AI 工具的 skill 产物

## Capabilities

### New Capabilities

- *无*

### Modified Capabilities

- `explore-brainstorming`: 修改 Design Summary 呈现指令措辞，消除代码块诱导

## Impact

- `src/core/templates/workflows/explore.ts`：3 处措辞修改，移除 `as a visible content block`
- `openspec/specs/explore-brainstorming/spec.md`：更新 spec 中对应 requirement
- `test/core/templates/explore-template.test.ts`：更新断言模板包含新措辞
- `test/core/templates/skill-templates-parity.test.ts`：更新 template hash
- `.pi/.claude/.codex/skills/openspec-explore/SKILL.md`：通过生成程序自动同步

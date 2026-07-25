## Context

openspec-explore 模板中 "Present the Design Summary as a visible content block" 的措辞持续诱导 AI 模型将 Design Summary 用代码 fence（```text / `#+BEGIN_SRC`）包裹，导致模型输出 Markdown 原始文本而非自然对话内容。

## Goals / Non-Goals

**Goals:**
- 消除 Design Summary 呈现指令中的格式暗示，使模型直接输出自然对话 prose

**Non-Goals:**
- 不改变 Design Summary 的内容结构（仍包含 architecture / core components / data flow / testing strategy / risks 等标准节）
- 不改变 explore 工作流的其他行为

## Decisions

- **移除格式暗示措辞而非反向约束**：不添加 "do not wrap in code fence" 等负向指令，因为这类措辞可能继续激活模型对 "wrap/fence/block" 的注意力。直接移除 "visible content block" 并简化为 "Present the Design Summary."

## Risks / Trade-offs

- 极低风险：纯提示词措辞调整，不影响代码逻辑
- 模型可能在极少数情况下仍使用代码 fence，但原措辞是唯一的诱导源，移除后预期显著改善

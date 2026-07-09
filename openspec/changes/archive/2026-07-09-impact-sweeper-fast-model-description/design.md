## Context

`openspec-impact-sweeper` 是 explore 流程委托的轻量级只读扫描 agent，当前模板 description 只描述报告用途和调用时机。实现证据显示 `src/core/templates/workflows/impact-sweeper.ts` 的 `description` 会被现有 subagent generation 路径渲染到各工具 agent metadata。

## Goals / Non-Goals

**Goals:**

- 在生成源头表达 fast model 偏好，让所有工具生成物继承同一提示。
- 保持具体模型选择由调用方或工具运行时决定。
- 用模板测试固定提示文案。

**Non-Goals:**

- 不设置 `template.model`。
- 不修改 reviewer 或 optimizer subagent description。
- 不直接修改已生成 agent 文件。

## Decisions

- [INFERRED FROM CODE] 在 `getImpactSweeperSubagentTemplate().description` 追加一句提示，而不是改 renderer。理由：description 是现有统一源字段，改动会自然传播到 Claude/Pi/OpenCode/Codex 渲染路径。
- [INFERRED FROM CODE] 不设置 `template.model`。理由：跨工具模型标识不统一，且用户需求是“描述上”提示 fast model，不是强制模型绑定。
- [INFERRED FROM CODE] 增加 `impact-sweeper-template` 单元测试断言描述文本。理由：该行为是模板 metadata 合同，最小持久验证点在模板测试中。

## Risks / Trade-offs

- [Risk] description 提示只能影响调用方选择，不能强制运行时使用 fast model。→ Mitigation：保持提示明确，并避免引入跨工具模型绑定复杂度。

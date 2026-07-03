## Why

Explore workflow 有固定的 Superpowers 流程，但部分模型会停留在详细提问而没有推进完整阶段。需要让生成的 explore skill 在可用 todo 时显式跟踪流程，降低跳步和遗忘风险。

## What Changes

- 在 `openspec-explore` 主 instructions 中加入简短 todo 跟踪要求。
- 在 Superpowers reference 中要求 context reads 前建立 todo checklist，并逐步 tick 完成阶段。
- 用模板测试锁定主 instructions 和 reference 中的 todo 跟踪要求。

## Capabilities

### New Capabilities

### Modified Capabilities
- `explore-brainstorming`: Explore 流程在 todo 可用时必须以 checklist 记录并推进 Superpowers 阶段。

## Impact

- Affected code: `src/core/templates/workflows/explore.ts`
- Affected generated artifacts: `.pi/skills/openspec-explore/SKILL.md`, `openspec/references/openspec-explore-supperpowers-style.md`
- Affected tests: `test/core/templates/explore-template.test.ts`
- Affected OPSX node: `cap.ai.explore-brainstorming`

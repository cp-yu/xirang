## Why

当前 snack skill 的 Output Hints 分为 "Fast path (skip verify)" 和 "Correction path" 两段式结构，将 sync/archive 操作与修正路径分散呈现在不同层级，不够直观。应合并为四个编号一等选项，让使用者在 snack 完成后能一目了然地选择下一步操作。

## What Changes

- 重构 Output Hints：移除 Fast path / Correction path 两段式结构，改为四个编号选项
- **1. Quick sync** — 仅同步 artifacts，不归档
- **2. Quick archive** — 仅归档，不执行 sync
- **3. Sync and archive** — 同步并归档
- **4. Continue development** — 回到代码迭代，重跑 snack
- 同步更新单元测试与集成测试中的 Output Hints 断言

## Capabilities

### New Capabilities

<!-- 无新增 capability -->

### Modified Capabilities

- `snack-skill`: 输出提示从两段式（Fast path + Correction path）改为四个编号一等选项

## Impact

- `src/core/templates/workflows/snack.ts` — 源模板 Output Hints 章节
- `dist/core/templates/workflows/snack.js` — 编译产物（自动生成）
- `.pi/skills/openspec-snack/SKILL.md`、`.codex/skills/openspec-snack/SKILL.md`、`.claude/skills/openspec-snack/SKILL.md`、`.github/skills/openspec-snack/SKILL.md` — 各 agent 的 SKILL.md 副本
- `test/core/templates/snack-template.test.ts` — 单元测试断言更新
- `test/integration/snack-workflow.test.ts` — 集成测试断言更新

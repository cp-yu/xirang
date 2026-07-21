## Why

pi-subagents 的 agent 发现机制强制要求 frontmatter 中包含 `name` 字段，缺省则 agent 文件不可见。当前 `renderPiMarkdown` 输出的 `display_name`、`disallowed_tools`、`enabled: true` 字段均不在 pi-subagents 的 `KNOWN_FIELDS` 集合中，导致 `openspec init` / `openspec update` 生成的 `.pi/agents/*.md` 文件无法被 pi-subagents 系统识别为 project agent。

## What Changes

- Pi renderer (`renderPiMarkdown`) 的 frontmatter 字段对齐 pi-subagents 规范：新增 `name`，移除 `display_name`、`disallowed_tools`、`enabled`
- 删除因字段对齐而孤立的辅助函数 `displayName()`、`disallowedToolList()` 及常量 `DEFAULT_DISALLOWED_TOOLS`
- 对应的测试断言同步更新

## Capabilities

### Modified Capabilities

- `internal-subagent-generation`: `Per-tool subagent artifact 渲染` requirement 中 Pi renderer 的 frontmatter 格式变更（`name`/`description`/`tools`/`model` 替代 `display_name`/`disallowed_tools`/`enabled`）

## Impact

- `src/core/shared/subagent-generation.ts` — `renderPiMarkdown` 函数、孤立的 helper 函数
- `test/core/shared/subagent-generation.test.ts` — Pi renderer 输出断言
- `test/core/templates/reviewer-template.test.ts` — Pi renderer 输出断言
- `test/core/templates/sync-engine.test.ts` — 生成文件内容断言

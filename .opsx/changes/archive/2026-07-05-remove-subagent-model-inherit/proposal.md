## Why

Internal subagent 生成的 artifact frontmatter 硬编码了 `model: "inherit"`，导致 pi-subagents 的 `applyCustomAgentOverride()` 检测到 `model` 字段已存在后静默跳过 settings 层覆写，用户无法在工具侧自由覆写 subagent 模型。移除模板中的 `model: 'inherit'` 默认值、在渲染时不输出未显式设置的 `model` 行、并在 `update` 时保留用户手设的 model 值，可由调用方按需覆写。

## What Changes

- **BREAKING**：`generateSubagentContent()` 对四个 renderer（Claude/Pi/OpenCode/Codex）不再无条件输出 `model` 行 — 仅在 `SubagentTemplate.model` 显式设为非 `inherit` 值时输出
- 从 `impact-sweeper.ts`、`reviewer.ts`、`optimizer.ts` 三个模板中删除 `model: 'inherit'`
- `ArtifactSyncEngine.writeSubagents()` 新增 merge 逻辑：当已存在的 agent 文件中包含用户自定义的 `model` 值（非 `'inherit'`）时，保留到重新生成的内容中

## Capabilities

### New Capabilities
<!-- 无新增 capability -->

### Modified Capabilities
- `internal-subagent-generation`: "Per-tool subagent artifact 渲染" requirement 中 `model` 字段由强制改为条件输出

## Impact

- `src/core/shared/subagent-generation.ts`: 四个 renderer 中 `model` 行改为条件展开
- `src/core/templates/sync-engine.ts`: 新增 `extractUserModel` / `injectModelMarkdown` / `injectModelToml` helper，`writeSubagents` 改为生成后注入用户 model
- `src/core/templates/workflows/{impact-sweeper,optimizer,reviewer}.ts`: 删除 `model: 'inherit'`
- `test/core/shared/subagent-generation.test.ts`: 断言首次生成不带 `model` 字段
- `test/core/templates/sync-engine.test.ts`: 新增 4 个 merge 逻辑测试

## Context

pi-subagents 的 agent 发现机制通过 `.md` 文件 YAML frontmatter 中的 `name` 字段进行识别。当前 `renderPiMarkdown` 生成的 frontmatter 包含 `display_name`、`disallowed_tools`、`enabled: true` 三个字段，均不在 pi-subagents 的 `KNOWN_FIELDS` 集合中，且缺少必需的 `name` 字段，导致生成的 agent 文件不可见。三个字段的原有意图在 pi-subagents 中已由其他机制覆盖：[INFERRED FROM CODE]

- **显示名称**：pi-subagents 直接用 `name` 作为显示标识，无独立的 display name 概念
- **工具限制**：pi-subagents 采用 `tools` allowlist 机制，未列出的工具自动不可用，无需单独的 disallowed list
- **启用/禁用**：pi-subagents 默认启用发现的 agent，通过 `disabled: true` 禁用，无需显式 `enabled: true`

## Goals / Non-Goals

**Goals:**

- Pi renderer 输出被 pi-subagents 正确识别为 project agent
- 清理因字段对齐而孤立的源模型辅助代码

**Non-Goals:**

- 不改变其他 renderer（Claude、OpenCode、Codex）的输出格式
- 不改变 `SubagentTemplate` 源模型接口（`disallowedTools` 字段保留在 interface 中供未来使用）
- 不添加 pi-subagents 不支持的新字段

## Decisions

1. **Pi renderer frontmatter 精简为 `name`/`description`/`tools`/`model`**
   - 替代方案：保留 `display_name` 仅添加 `name` → 不被 pi-subagents 识别为有效字段，属于冗余
   - 替代方案：映射 `disallowed_tools` 为 pi-subagents 未知字段 → `extraFields` 保留但无实际效果
   - 选择理由：pi-subagents 的 `tools` allowlist 已天然实现权限限制，删除的三个字段均无对应等价物

2. **孤儿代码删除**
   - `displayName()`: 仅被 `renderPiMarkdown` 调用，无其他引用 → 删除
   - `disallowedToolList()`: 同上 → 删除
   - `DEFAULT_DISALLOWED_TOOLS`: 仅被 `disallowedToolList()` 引用 → 删除

## Risks / Trade-offs

- [Risk] 若有旧版 OpenSpec 已生成含 `display_name` 的 `.pi/agents/*.md` 文件，`openspec update` 会自动覆盖为新格式 → 正向修复，无兼容性问题
- [Risk] `disallowedToolList` 删除后若未来需要，可从 git history 恢复 → 低风险

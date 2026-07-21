## Why

当前 internal 执行角色（`openspec-reviewer`、`openspec-optimizer`、`openspec-impact-sweeper`）以 internal `SKILL.md` 形态安装到 `<toolDir>/skills/`，并依赖 workflow prompt 通过 "invoke skill" 文案委托。这与 Claude Code、Pi、OpenCode、Codex 等工具原生的 subagent / agent 机制不对齐：主 agent 无法用工具原生方式委托、权限/模型/沙箱等角色配置无处承载、且 "internal skill" 与 "internal subagent" 两套术语在 active specs / OPSX / templates 中长期混杂，维护成本高。

## What Changes

- **BREAKING**：新增 internal subagent artifact generation framework。`openspec-reviewer`、`openspec-optimizer`、`openspec-impact-sweeper` 不再安装为 internal `SKILL.md`，改为生成 tool-native subagent artifacts：
  - Claude Code / Pi / OpenCode → `<toolDir>/agents/<name>.md`
  - Codex → `<toolDir>/agents/<name>.toml`
- 新增统一 `SubagentTemplate` 源模型与 per-tool renderer（markdown / toml），工具差异封装在 renderer 层。
- 扩展 tool metadata：新增 `agentsDir` 与 `agentFormat`，描述每个工具是否支持 subagent artifact 及其原生格式。
- 扩展 `ArtifactSyncEngine`：新增 `writeSubagents()`，与现有 `writeSkills()` 并列；新增按显式名清理旧 internal skill 目录的迁移逻辑。
- **BREAKING**：`openspec update` 显式删除旧 internal skill 目录（`<toolDir>/skills/openspec-{reviewer,optimizer,impact-sweeper}/`），使用显式名 list，不做 glob / regex 删除。
- workflow templates（explore、apply-change、archive-change）的 delegation 文案统一改为 "delegate to generated `<name>` subagent"，并禁止主 agent 读取或内联生成的 subagent artifact。
- **BREAKING**：归档 active spec `internal-skill-installation`，新增 active spec `internal-subagent-generation`；OPSX 移除 `cap.ai.internal-skill-installation`，新增 `cap.ai.internal-subagent-generation`。
- 清理 active specs / templates / tests 中的旧 "internal skill" 术语，统一为 "internal subagent"；历史 `openspec/changes/archive/**` 不动。

## Capabilities

### New Capabilities

- `internal-subagent-generation`: internal subagent artifact 的统一源模型、per-tool 渲染（markdown / toml）、安装路径（`<toolDir>/agents/`）、cross-platform path 处理、stale cleanup、init/update 集成，以及 generated artifact 对 `subagent-self-read` 权限模型的声明式编码。

### Modified Capabilities

- `ai-workflow-templates`: Skill Delegation Protocol 从 "Internal Skills / invoke skill" 改为 "Internal Subagents / delegate to generated subagent"；禁止主 agent 读取生成的 subagent artifact。
- `ai-tool-paths`: 新增 `agentsDir` 与 `agentFormat` metadata，定义 subagent artifact 写入路径与原生格式。
- `skill-template-length-check`: 术语从 "workflow/internal skill" 收敛为 "workflow skill"（internal skill 不再存在）。
- `internal-skill-installation`: 全部 requirements REMOVED，spec 随本次变更归档退役；可观察行为迁移到 `internal-subagent-generation`。

## Impact

- 源码：
  - 新增 `src/core/shared/subagent-generation.ts`（`SubagentTemplate`、`INTERNAL_SUBAGENT_TEMPLATES`、`generateSubagentContent()`、per-tool renderer）。
  - 修改 `src/core/shared/skill-generation.ts`：移除 `INTERNAL_SKILL_TEMPLATES` 注册，保留 stale cleanup 常量并重命名以体现迁移语义。
  - 修改 `src/core/templates/sync-engine.ts`：新增 `writeSubagents()` 与旧 internal skill 目录的显式名 cleanup。
  - 修改 `src/core/config.ts`、`src/core/templates/tool-profile/*`：新增 `agentsDir` / `agentFormat`。
  - 修改 `src/core/templates/workflows/{explore,apply-change,archive-change}.ts`：delegation 文案改为 "delegate to generated subagent"。
  - 修改 `src/core/templates/workflows/{reviewer,optimizer,impact-sweeper}.ts`：转为 `SubagentTemplate` 源。
  - 修改 `src/core/workflow-installation.ts`：调整 re-export。
- 测试：新增 subagent-generation 测试；更新 sync-engine、workflow-installation、explore/apply-change/archive-change template、skill-generation、skill-template-length-validation 测试。
- 生成表面：`.claude/`、`.pi/`、`.opencode/`、`.codex/` 下新增 `agents/` 目录与文件；`openspec update` 后旧 internal skill 目录被清理。
- CLI 入口（`openspec init` / `openspec update`）行为对外不变，仅扩展写入内容。
- 历史归档 `openspec/changes/archive/**` 保持不动。

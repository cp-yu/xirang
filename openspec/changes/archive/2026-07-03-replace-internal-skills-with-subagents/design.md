## Context

当前 OpenSpec 的 internal 执行角色（`openspec-reviewer`、`openspec-optimizer`、`openspec-impact-sweeper`）以 internal `SKILL.md` 形态安装到各工具的 `skills/` 目录（如 `.claude/skills/openspec-reviewer/SKILL.md`），由 workflow skill 通过 "invoke skill" 文案委托 subagent 执行。

这种模式存在三个问题：

1. **与工具原生机制错位**：Claude Code（`.claude/agents/*.md`）、Pi（`.pi/agents/*.md`）、OpenCode（`.opencode/agents/*.md`）、Codex（`.codex/agents/*.toml`）都提供原生的 subagent / agent 机制，能声明 `tools`、`model`、`permission`、`sandbox_mode` 等角色配置。internal `SKILL.md` 无法承载这些字段，主 agent 也无法用工具原生方式委托。
2. **权限/模型无处声明**：现有 `subagent-self-read` 规约定义了 reviewer/optimizer 的 Read+Bash 权限模型，但这只是 prompt 文案层面的约束，无法在工具层声明式强制。
3. **术语混杂**：active specs、OPSX、workflow templates 中 "internal skill" 与 "internal subagent" 两套术语并存，新贡献者和 AI agent 都难以判断哪个是当前事实源。

约束：

- 用户主动调用的 workflow skills（propose、explore、apply-change、archive-change、bootstrap-opsx、snack）保持稳定，仍然生成到 `<toolDir>/skills/<name>/SKILL.md`。
- internal 角色不暴露为用户可调用 workflow，仍然由主 agent 在 workflow 内部委托。
- 跨平台：所有路径使用 `path.join()`，Windows 上 `path.join('.claude', 'agents', 'x.md')` 产出反斜杠分隔符。
- 清理策略：删除旧残留必须用显式名 list，不能用 glob / regex / 目录扫描。
- Codex 使用 TOML 而非 Markdown 作为 agent 文件格式。

## Goals / Non-Goals

**Goals:**

- 建立 internal subagent artifact generation framework，与现有 skill generation framework 平行。
- 让 internal 角色以 tool-native 格式安装，能用工具原生方式被委托，权限/模型/沙箱声明式承载。
- 把 active specs、OPSX、workflow templates、tests 中的 "internal skill" 旧概念清理干净，统一为 "internal subagent"。
- 归档 `internal-skill-installation` active spec，新增 `internal-subagent-generation` active spec。
- 在 `openspec init` / `openspec update` 中集成 subagent artifact 写入与旧 internal skill 目录的迁移 cleanup。

**Non-Goals:**

- 不改造用户主动调用的 workflow skills 生成管线（仍走现有 `SkillTemplate` + `generateSkillContent()`）。
- 不把 internal subagents 暴露为用户可调用 workflow surface（仍然 internal-only，不进 `WorkflowManifestRegistry`，不生成 slash command）。
- 不引入完整 agent plugin 生态或 subagent manifest registry；仅服务 internal 执行角色。
- 不修改 `openspec/changes/archive/**` 历史记录。
- 不引入新运行时依赖（TOML 序列化用最小自实现或已有依赖，不引入新 package）。

## Decisions

### Decision 1: 统一源模型 + 工具特定渲染

选择 `SubagentTemplate` 作为唯一源模型，per-tool renderer 负责输出差异。

**替代方案 A（统一 Markdown 输出）**：所有工具都生成 `<toolDir>/agents/<name>.md`。
- 否决理由：Codex 原生 agent 文件是 TOML（`.codex/agents/*.toml`，字段 `name`、`description`、`developer_instructions`、`sandbox_mode`），强行生成 Markdown 会让 Codex 无法识别。

**替代方案 B（每个工具独立模板源）**：为每个工具单独维护一份角色 prompt。
- 否决理由：role prompt 会在 4 处重复维护，漂移风险高。

**采纳理由**：源模型只描述语义字段（name、description、prompt、tools、disallowedTools、model），renderer 负责映射到各工具字段名与文件格式。修改 role prompt 只改一处。

### Decision 2: workflow skills 不变，仅 internal roles 迁移

用户主动调用的 workflow skills 继续走现有 skills pipeline。只有 `openspec-reviewer`、`openspec-optimizer`、`openspec-impact-sweeper` 三个 internal 角色迁移到 subagent artifact。

**替代方案（所有 workflow 也 agent 化）**：把 propose/explore/apply/archive 也生成 agent 文件。
- 否决理由：破坏现有用户调用入口（`/skill:openspec-explore` 等），影响面过大，且 workflow skill 的 slash-command 调用语义与 subagent 委托语义不同。

### Decision 3: 文件路径与格式映射

`AIToolOption` 新增 `agentsDir?: string` 与 `agentFormat?: 'markdown' | 'toml'`。对四个目标工具：

| 工具 | skillsDir | agentsDir | agentFormat | 输出路径 |
|---|---|---|---|---|
| Claude Code | `.claude` | `.claude` | markdown | `.claude/agents/<name>.md` |
| Pi | `.pi` | `.pi` | markdown | `.pi/agents/<name>.md` |
| OpenCode | `.opencode` | `.opencode` | markdown | `.opencode/agents/<name>.md` |
| Codex | `.codex` | `.codex` | toml | `.codex/agents/<name>.toml` |

写入路径统一用 `path.join(projectRoot, agentsDir, 'agents', `${name}.${ext}`)`，`ext` 由 `agentFormat` 决定。

### Decision 4: Markdown renderer 按工具分叉字段名

三个 Markdown 工具的 frontmatter 字段不完全一致，由 renderer 负责映射：

- **Claude Code**：`name`、`description`、`tools`、`model`。tools 用逗号分隔的 Claude 工具名（Read、Grep、Glob、Bash）。
- **Pi**：`description`、`display_name`、`tools`、`disallowed_tools`、`model`、`enabled`。tools 用小写逗号分隔（read、grep、find、bash）。
- **OpenCode**：`description`、`mode: subagent`、`model`、`permission`（如 `edit: deny`、`bash: ask`）。

`SubagentTemplate` 层只保留语义（`tools`、`disallowedTools`），renderer 翻译为各工具的字段名与值格式。映射不到的字段（如 OpenCode 的 `task` 权限）不强行编造。

### Decision 5: Codex TOML renderer

Codex 输出 TOML，关键字段：

```toml
name = "openspec-reviewer"
description = "..."
model = "inherit"
sandbox_mode = "read-only"

developer_instructions = """
<agent prompt>
"""
```

`developer_instructions` 用三引号 multiline string。escaping 规则：三引号字符串内出现 `"""` 时用 `\"\"\"` 转义；反斜杠字面量用 `\\`。不引入新依赖；如序列化复杂，用最小自实现（已知字段集有限）。

### Decision 6: Sync engine 扩展，不新建独立 engine

在现有 `ArtifactSyncEngine` 内新增 `writeSubagents()`，与 `writeSkills()` 并列。`buildPlan()` 同时收集 workflow skill entries 与 internal subagent entries。`syncOne()` 依次调用 `writeSkills()` → `writeSubagents()` → cleanup。

**替代方案（独立 SubagentSyncEngine）**：新建独立 engine。
- 否决理由：init / update 已经一次遍历所有工具，再拆 engine 会重复遍历、重复 cleanup 逻辑，且难以保证 write/cleanup 顺序一致。

### Decision 7: 旧 internal skill 目录的迁移 cleanup

`openspec update` 在写入新 subagent artifact 后，按显式名 list 删除旧 internal skill 目录：

```
<toolDir>/skills/openspec-reviewer/
<toolDir>/skills/openspec-optimizer/
<toolDir>/skills/openspec-impact-sweeper/
```

显式名 list 复用现有 `MANAGED_STALE_INTERNAL_SKILL_DIR_NAMES` 思路（按显式名、不 glob），并扩展为既包含历史 `openspec-implementer` 也包含本次迁移的三个目录名。

**约束**：不做目录扫描、glob filtering、regex inference；不删除用户自定义 skill 目录或用户自定义 `agents/*.md`。

### Decision 8: workflow delegation 文案统一

explore、apply-change、archive-change 模板中：

- 把 "Internal Skills" 标题改为 "Internal Subagents"。
- 把 "invoke `openspec-reviewer` skill" 改为 "delegate to generated `openspec-reviewer` subagent"。
- 把 "Never use the Read tool on `.claude/skills/openspec-*/SKILL.md`" 改为 "Never read or inline the generated subagent artifact"。
- 保留 "主 agent 不读取/内联 subagent prompt、传递显式 evidence bundle、等待 structured output" 的边界。

### Decision 9: 归档 `internal-skill-installation` active spec

将 active spec `openspec/specs/internal-skill-installation/spec.md` 的全部 requirements 以 REMOVED 形式迁移到本次 change 的 delta spec；可观察行为（cross-platform path、不产 slash command、显式名 cleanup）以新 requirement 形式在 `internal-subagent-generation` spec 中重新建立。

历史 `openspec/changes/archive/**` 中的同名 spec 副本不动。

### Decision 10: OPSX capability 替换

- 移除 `cap.ai.internal-skill-installation`。
- 新增 `cap.ai.internal-subagent-generation`，intent 描述 internal subagent artifact generation framework。
- `dom.ai-integration` 的 contains 关系从旧 cap 迁移到新 cap。
- 相关 `depends_on` 关系（如 `cap.ai.workflow-templates` 对 internal 安装的依赖）迁移到新 cap。

### Decision 11: 不复用 workflow invocation transform

subagent artifact 不走 `/opsx:<slug>` 替换管线。如需 transform context，使用独立 `artifactType: 'subagent'`，避免与 workflow skill 的 invocation reference 替换冲突。

## Risks / Trade-offs

- **[工具规范漂移]** 各工具的 agent frontmatter 字段会随版本变化 → renderer 集中封装差异，单测覆盖每个工具的字段输出；字段冲突时优先工具原生规范。
- **[Codex TOML escaping]** 三引号 multiline 字符串遇特殊字符可能出错 → TOML renderer 单独单测，覆盖 multiline、引号、反斜杠；用最小自实现，不引入新依赖。
- **[迁移残留]** 旧 internal skill 目录可能因用户修改而残留 → 显式名 list cleanup，单测覆盖残留删除与用户自定义内容不误删。
- **[术语清理不彻底]** active specs / templates 中可能遗留 "internal skill" 措辞 → 通过 MODIFIED requirements 与 template 文案重写覆盖；以 sweep 报告 `impact-sweep-clean-internal-skills-old-concepts.json` 中 mustChange / mustCheck 清单为验收依据。
- **[向后兼容]** 不 dual-write internal `SKILL.md`，旧工具/旧 prompt 若仍期待 internal SKILL.md 会失效 → 通过 `openspec update` 一次性切换，design 明确不保留双轨；workflow delegation 文案同步切换。
- **[Codex `model: "inherit"` 兼容性]** Codex 可能不支持 `inherit` 关键字 → renderer 对 Codex 省略 `model` 字段或使用 Codex 默认值，差异留在 renderer 不污染源模型。

## Migration Plan

1. 新增 `SubagentTemplate` 源模型与 `INTERNAL_SUBAGENT_TEMPLATES` 注册（reviewer、optimizer、impact-sweeper）。
2. 实现 per-tool renderer（claude markdown、pi markdown、opencode markdown、codex toml）。
3. 扩展 `AIToolOption` 与 tool profile：新增 `agentsDir`、`agentFormat`。
4. 扩展 `ArtifactSyncEngine`：新增 `writeSubagents()` 与 stale internal skill 目录 cleanup。
5. 从 `skill-generation.ts` 移除 `INTERNAL_SKILL_TEMPLATES`；保留并扩展 stale cleanup 名单。
6. 更新 explore / apply-change / archive-change 模板 delegation 文案。
7. 更新测试：新增 subagent-generation 测试；更新 sync-engine、workflow-installation、template、skill-generation、skill-template-length-validation 测试。
8. 运行 `openspec update` 重新生成所有工具产物，验证 `.claude/agents/`、`.pi/agents/`、`.opencode/agents/`、`.codex/agents/` 文件生成且旧 `skills/openspec-{reviewer,optimizer,impact-sweeper}/` 被清理。

回滚策略：若 renderer 或 sync engine 出现阻塞性问题，可通过 git revert 本次 change 并重新运行 `openspec update` 恢复 internal `SKILL.md` 安装；archive 后的历史记录保留旧 spec 副本可作参考。

## Open Questions

- Codex `model` 字段是否接受 `"inherit"`，还是应省略让其使用默认模型？（实现期通过查 Codex 文档或运行验证确认；当前设计让 renderer 决定，源模型保留语义 `model: 'inherit'`。）
- Pi 的 `display_name` 是否有长度或字符限制？（实现期查 Pi subagents 文档确认。）

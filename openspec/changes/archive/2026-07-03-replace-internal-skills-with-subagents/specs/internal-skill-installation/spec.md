## REMOVED Requirements

### Requirement: 内部 skill 模板注册

**Reason**: Internal 执行角色不再以 `SKILL.md` 形态安装。`INTERNAL_SKILL_TEMPLATES` 注册与 `getSkillTemplates()` 合并 internal skill 的行为退役，由 internal subagent generation framework 的 `INTERNAL_SUBAGENT_TEMPLATES` 与独立 subagent 渲染管线替代。

**Migration**: 见 `specs/internal-subagent-generation/spec.md` ADDED Requirement "Internal subagent 模板注册"。internal 角色改为生成 tool-native subagent artifact（Claude/Pi/OpenCode 为 `<toolDir>/agents/<name>.md`，Codex 为 `<toolDir>/agents/<name>.toml`），不再写入 `<toolDir>/skills/<name>/SKILL.md`。

### Requirement: Managed generated surfaces remove stale implementer residue

**Reason**: stale cleanup 行为保留，但适用范围扩展。原 requirement 只针对 `openspec-implementer`；新框架的 cleanup 名单既包含历史 `openspec-implementer`，也包含本次迁移的三个 internal skill 目录（`openspec-reviewer`、`openspec-optimizer`、`openspec-impact-sweeper`）。

**Migration**: 见 `specs/internal-subagent-generation/spec.md` ADDED Requirement "旧 internal skill 目录迁移 cleanup"。cleanup 仍按显式名 list 删除，MUST NOT 通过 glob / regex / 目录扫描删除。

### Requirement: 内部 skill 不产 slash command

**Reason**: "内部 skill" 概念退役。internal 角色仍不暴露为用户可调用 workflow surface，但约束对象从 "internal skill" 改为 "internal subagent"。

**Migration**: 见 `specs/internal-subagent-generation/spec.md` ADDED Requirement "Internal subagent 模板注册" 中 "Internal subagent SHALL NOT 注册到 WorkflowManifestRegistry" 场景。

### Requirement: 安装路径使用 path.join() 构建

**Reason**: cross-platform path 约束保留，但适用对象从 internal `SKILL.md` 路径改为 subagent artifact 路径。

**Migration**: 见 `specs/internal-subagent-generation/spec.md` ADDED Requirement "Subagent artifact 写入路径"。路径仍使用 `path.join()`，扩展名由 `agentFormat` 决定。

### Requirement: 内部 skill 使用现有 SkillTemplate 接口

**Reason**: internal 角色不再使用 `SkillTemplate` 接口与 `generateSkillContent()` 生成 `SKILL.md`。改用 `SubagentTemplate` 源模型与 per-tool renderer（markdown / toml）。

**Migration**: 见 `specs/internal-subagent-generation/spec.md` ADDED Requirement "Per-tool subagent artifact 渲染"。renderer 按 `toolId` 分派到 claude markdown / pi markdown / opencode markdown / codex toml。

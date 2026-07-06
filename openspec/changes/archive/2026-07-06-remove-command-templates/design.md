## Context

OpenSpec 的 skills-only 管线已经替代了历史上的 `/opsx:<workflow>` slash-command workflow surface。但代码中遗留了：

1. `CommandTemplate` 接口（`types.ts`）
2. 4 个 `get*CommandTemplate()` 函数（`apply-change.ts`、`propose.ts`、`archive-change.ts`、`bootstrap-opsx.ts`）
3. manifest 中的 `getCommandTemplate` 可选字段和注册
4. apply-change.ts 中的 `APPLY_VERIFY_PHASES` 和 `APPLY_STRICT_TDD_IMPLEMENTATION` 死常量

## Goals / Non-Goals

**Goals:**
- 删除所有命令模板相关代码
- 保留共享的 `buildArchiveInstructions()`（archive skill 仍在使用）
- 不修改任何 skill 模板内容

**Non-Goals:**
- 不改动 skill 模板的 Phase 1/2/3 逻辑
- 不删除 manifest 中仍然有效的字段

## Decisions

### Decision 1: 删除全部命令模板，不可逆

归档的 `2026-05-17-fix-phase2-hash-timing` 尝试通过修复 `APPLY_VERIFY_PHASES` 常量来解决 Phase 2 排序问题，但其修改仅影响已死代码（命令模板）。正确的修复路径是保证 skill 模板引用的 reference 文件声明清晰即可。

### Decision 2: archive 保留共享代码

archive 的 `buildArchiveInstructions()`、`buildArchiveFullVerifyContract()`、`buildAgentGitFlowStep()` 同时被 skill 模板和命令模板使用。删除命令模板包装函数 `getOpsxArchiveCommandTemplate()` 和 `createOpsxArchiveCommandTemplateForExecutionModel()` 即可。

## Risks / Trade-offs

- [回归风险] 低：不修改任何 skill 模板内容，所有 skill 生成的 SKILL.md 不变
- [隐式依赖] 6 个 workflow manifest 条目已清理，manifest 测试已更新

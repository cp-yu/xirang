# snack-skill-generation Specification

## Purpose
规约 snack skill 的生成管线职责：skill 生成管线 SHALL 将 snack skill 与现有 5 个核心工作流（propose、explore、apply、archive、bootstrap-opsx）一致地纳入，生成的 `openspec-snack/SKILL.md` MUST 表达 code-first artifact reconciliation、broader code-change evidence sources、conditional artifact updates 与 no-`tasks.md` 边界，且 instructions 部分不超过 200 行。
## Requirements
### Requirement: snack skill 纳入生成管线

skill 生成管线 SHALL 包含 snack skill，与现有 5 个核心工作流（propose、explore、apply、archive、bootstrap-opsx）一致。Generated snack skill instructions MUST describe code-first artifact reconciliation, broader code-change evidence sources, two code-first scenarios, conditional artifact updates, and the no-`tasks.md` boundary.

#### Scenario: 生成 snack skill 文件

- **WHEN** 运行 `openspec update` 或 `openspec init`
- **THEN** 生成 `.claude/skills/openspec-snack/SKILL.md`，包含：
  1. Frontmatter（name、description、license、compatibility、metadata）
  2. 输入检测逻辑（change-name 可选，默认检测 active）
  3. 共享 OPSX 上下文加载指令（复用 explore/propose/apply 片段）
  4. Code-change evidence collection covering conversation context, working-tree diff, staged diff, `git diff HEAD`, and natural-language commit/range selectors
  5. Code-map 反查步骤
  6. Spec 覆盖扫描步骤（`openspec list --specs --json`）
  7. Artifact reconciliation guidance for missing, stale, inconsistent, and current `proposal.md`, `design.md`, `specs/*/spec.md`, and `opsx-delta.yaml`
  8. Specs 生成策略（中层推断）
  9. Design 简化生成策略
  10. OPSX delta 启发式规则
  11. 输出提示（完成路径 vs 修正路径）
  12. 明确不生成 tasks.md 的说明

#### Scenario: skill 文件长度验证

- **WHEN** 生成 snack skill 文件后
- **THEN** 验证 `SKILL.md` instructions 部分不超过 200 行

#### Scenario: generated skill text exposes reconciliation guidance

- **WHEN** tests inspect generated `openspec-snack/SKILL.md`
- **THEN** the text contains key guidance for artifact reconciliation, conversation context, staged diff, `git diff HEAD`, commit/range evidence selectors, conditional artifact updates, and no `tasks.md`
- **AND** assertions target key behavior phrases rather than full-file snapshots

### Requirement: snack skill 描述

snack skill description SHALL state that snack performs quick code-first artifact reconciliation from already-written code using available code-change evidence, and that it conditionally creates or updates proposal, specs, simplified design, and OPSX delta without generating `tasks.md`.

#### Scenario: skill description 用于触发检测

- **WHEN** AI 工具加载 skill 列表
- **THEN** snack skill 的 description 清晰表达其适用场景（代码已完成、从 available code-change evidence 反向 reconcile OpenSpec artifacts，不生成 tasks.md）


## Context

Apply Step 1 的 dirty-state gate 在 preparation 阶段检查 workspace 是否有未提交改动。当存在脏状态时，原指令直接要求 Agent 询问用户如何处理。但 Change 自身的 artifacts（`.xirang/changes/<name>/` 下的文件）是正在被 Apply 的 Change 的一部分，不属于"无关脏状态"。

## Goals / Non-Goals

**Goals:**
- 消除 Change artifacts 被误判为"无关脏状态"的噪音提问
- 保持 gate 对真正无关脏文件的防护能力

**Non-Goals:**
- 不改变 dirty-state gate 的存在理由
- 不改变其他隔离参考（worktree/branch/current-branch）的现有逻辑

## Decisions

- **分类基准**：按 `.xirang/changes/<name>/` 目录分类。该目录下的文件是 Change 自身的语义增量，不在该目录下的脏文件才是 gate 需要关注的。
- **scope 限定**：分类到所选 change 的 `<name>`，而非整个 `.xirang/changes/`。这确保其他 Change 的 staged artifacts 仍会触发 gate（需要用户裁断）。
- **下游一致性**：worktree 隔离参考第 2 条已把 `.xirang/changes/<name>/` 列为 changed file set 首选来源；branch 隔离中 `git switch -c` 天然携带 staged 文件，且 `git status --short` 文件纳入验证范围。上游 gate 的分类与下游行为自洽，不需要修改其他参考。

## Risks / Trade-offs

- [Low] 用户可能有意将未 commit 的 Change artifacts 排除在基线外 — 但 Change artifacts 是 Change 的组成部分，排除它们意味着 Apply 缺少语义输入，实践中不应发生。若确实需要，用户可放弃当前 Apply 自行处理。
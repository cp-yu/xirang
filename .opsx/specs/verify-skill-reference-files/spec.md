---
element: project.root/domain.apply/cap.apply.verification-integration
---

# verify-skill-reference-files Specification

## Purpose
定义 Phase 2 checkpoint 与 rollback fence 在 Apply reference 和 reviewer contract 之间的职责边界。

## Requirements
### Requirement: Apply reference SHALL 拥有 checkpoint 编排

Phase 2 checkpoint 创建、成功提交、失败回滚和 verify-state 恢复 SHALL 由 `apply-change.ts` 生成的 Phase 2 reference 定义。Reviewer contract SHALL 只负责 speculative verification verdict，不得创建、恢复或消费 Git checkpoint。

#### Scenario: Reviewer 只返回验证 verdict

- **WHEN** reviewer subagent 执行 Phase 2 speculative verification
- **THEN** reviewer SHALL 验证 Specs 与 selected finding 的 preservation constraints
- **AND** SHALL NOT 执行 Git commit、reset、clean 或 worktree 操作

#### Scenario: Apply Phase 2 reference 编排 checkpoint

- **WHEN** Apply 模板执行 Phase 2 optimization loop
- **THEN** Phase 2 reference SHALL 定义非空 baseline commit 与成功 finding checkpoint commit
- **AND** SHALL 定义失败时对 `.verify-result.json` 与 `.apply-isolation.json` 的 repository-external snapshot、speculative code rollback、原子恢复与 SHA-256 校验
- **AND** SHALL 保留 failed history、`failedDirections` 与 `phase2BaselineCommit`

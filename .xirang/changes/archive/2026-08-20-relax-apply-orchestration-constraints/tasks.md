### Task 1: 解除 Apply Phase 0 的固定编排约束

**Goal**: 更新 Apply 的 Semantic Model、canonical workflow template 与测试，使 task-level TDD 和统一 Verify 门禁保持不变，同时不再把执行主体、调度方式或临时实现材料写成规范。

**Files**:
- Modify: `.xirang/model/elements/apply-workflow.md`
- Modify: `.xirang/model/elements/task-decomposition.md`
- Modify: `src/core/templates/workflows/apply-change.ts`
- Test: `test/core/templates/apply-change.test.ts`
- Test: `test/commands/artifact-workflow.test.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`

**Requirements**:
- 保留每个 task 的独立 TDD loop、Check 证据与 Required Corrections 进度语义。
- 保留全部 pending tasks 完成后的 Change-level Review、Optimization、Seal 和 recovery 门禁。
- 从 Semantic Model 与 canonical Apply template 中移除 Master agent、串行或并行方式、`.apply-steps` 和 coding subagent 的规范性声明。
- 测试保护可观察 workflow 行为与 projection 完整性，不把解释性 prose、固定行数或完整 template hash 作为行为契约。

#### Checks

- [x] C1 Verify Apply Phase 0 TDD and evidence behavior
  - Verifies: `elements/apply-workflow.md` / Requirement "Apply Phase 0 SHALL 执行 pending Checks" / Scenario "行为或代码 Check 完成 TDD 闭环" / Scenario "非运行时制品使用最终证据" / Scenario "Config、Schema 与模板默认按行为变更处理"
  - Command: `pnpm exec vitest run test/core/templates/apply-change.test.ts test/commands/artifact-workflow.test.ts`
  - Expect: Apply template and CLI instruction tests pass while task-level TDD and final evidence behavior remain covered.

- [x] C2 Verify Change-level Review barrier remains
  - Verifies: `elements/apply-workflow.md` / Requirement "Apply 完成全部 Tasks 后统一进入 Change 级 Review" / Scenario "普通 task 完成不提前切换阶段" / Scenario "全部完成后统一 Review" / Scenario "修正后重新 Review"
  - Command: `pnpm exec vitest run test/core/templates/apply-change.test.ts test/commands/artifact-workflow.test.ts`
  - Expect: A completed ordinary task does not enter verification early, all pending work reaches one Change-level Review, and recovery requires another Review.

- [x] C3 Verify neutral task decomposition contract
  - Verifies: `elements/task-decomposition.md` / Requirement "Apply Phase 0 SHALL 依据 task-level TDD 处理 pending task" / Scenario "Apply 处理独立 task-level TDD loop" / Scenario "实现纪律保持为中性指导" / Scenario "非隔离流程步骤指向 reference" / Scenario "隔离方法只读取一个 reference"
  - Command: `pnpm exec vitest run test/core/templates/apply-change.test.ts test/core/templates/semantic-model-consistency.test.ts`
  - Expect: The generated Apply surface retains task-level TDD and reference routing without binding Phase 0 to one executor, scheduler, or temporary artifact.

- [x] C4 Verify retired orchestration constraints are absent from active surfaces
  - Verifies: `elements/apply-workflow.md` / REMOVED Requirement "Apply Phase 0 SHALL 由 Master agent 直接执行"
  - Verifies: `elements/task-decomposition.md` / REMOVED Requirement "Master agent 直接执行 pending task"
  - Command: `! rg -n -F -e "Master executes pending tasks serially" -e "never execute tasks in parallel" -e "Master agent 串行" -e "直接执行 pending task" -e "不生成 apply-steps" -e "不委托 implementer" -e "dispatch coding subagent" -e ".apply-steps" -e "implementer subagent" .xirang/model/elements/apply-workflow.md .xirang/model/elements/task-decomposition.md src/core/templates/workflows/apply-change.ts test/core/templates/apply-change.test.ts test/commands/artifact-workflow.test.ts test/core/templates/skill-templates-parity.test.ts`
  - Expect: No retired execution-orchestration constraint remains in the listed active Semantic Model, canonical template, or test surfaces.

- [x] C5 Verify generated template projection and full project checks
  - Verifies: `elements/apply-workflow.md` / Requirement "Apply 模板 SHALL 处理中间验证状态" / Scenario "needs_verify 状态进入 Phase 1" / Scenario "needs_seal 状态进入 Phase 2/3" / Scenario "Dashboard 分类标签不声称完成"
  - Command: `pnpm exec vitest run test/core/templates/skill-templates-parity.test.ts test/core/templates/semantic-model-consistency.test.ts && pnpm exec tsc --noEmit`
  - Expect: Canonical template projections remain consistent, shared Semantic Model guidance remains valid, and TypeScript type checking passes.

## Required Corrections

### [code_fix] Restore Required Corrections-first instruction

- [x] Restore Implementation Discipline to process unfinished Required Corrections before pending tasks, without restoring serial/Master/subagent constraints
  - Verifies: `elements/task-decomposition.md` / Requirement "Checks 是任务进度源" / Scenario "Required Corrections 优先"
  - Command: `pnpm exec vitest run test/core/templates/apply-change.test.ts`
  - Expect: Implementation Discipline still keeps task-level TDD and the Change-level Review barrier, and tells Apply to process unfinished Required Corrections before pending tasks.

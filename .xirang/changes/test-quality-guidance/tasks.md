# Implementation Tasks

### Task 1: 接入共享测试品质并改四阶段提示词

**Goal**: 让 Explore、Propose、Apply、Reviewer 复用同一测试品质片段，并落实阶段动作；本仓库锁词只进项目配置。

**Files**:
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/apply-change.ts`
- Modify: `src/core/templates/workflows/reviewer.ts`
- Modify: `.xirang/config.yaml`
- Modify: `test/core/templates/fragments/xirang-fragments.test.ts`
- Modify: `test/core/templates/explore-template.test.ts`
- Modify: `test/core/templates/propose-template.test.ts`
- Modify: `test/core/templates/apply-change.test.ts`
- Modify: `test/core/templates/reviewer-template.test.ts`
- Modify: `test/skills/reviewer-correctness-escalation.test.ts`
- Modify: `test/core/templates/skill-templates-parity.test.ts`
- Modify: `.pi/skills/`
- Modify: `.pi/agents/xirang-reviewer.md`
- Modify: `.xirang/references/xirang-explore-supperpowers-style.md`

**Requirements**:
- 共享测试品质片段被四阶段复用，不含项目锁词
- Propose 必须判断 Check 价值，禁止 Scenario 1:1
- Apply 先检查已有测试，RED 来自行为缺失
- Reviewer 按行为证据覆盖，不要求 1:1 测试文件
- Contract Scenario 写行为而非排版

#### Checks

- [x] C1 共享片段接入四阶段
  - Test action: modify `test/core/templates/fragments/xirang-fragments.test.ts` 与四个 workflow 模板测试
  - Verifies: `elements/workflow-templates.md` / Requirement "统一加载协议与优雅降级" / Scenario "测试品质片段被四阶段复用", Scenario "Templates 使用同一 fragment"
  - Command: `pnpm exec vitest run test/core/templates/fragments/xirang-fragments.test.ts test/core/templates/explore-template.test.ts test/core/templates/propose-template.test.ts test/core/templates/apply-change.test.ts test/core/templates/reviewer-template.test.ts`
  - Expect: `TEST_QUALITY_GUIDANCE` 为单一 exported constant；explore/propose/apply/reviewer 模板包含该常量；通用片段不含本仓库锁词规则；测试不逐句锁片段散文

- [x] C2 Propose 判断 Check 价值
  - Test action: modify `test/core/templates/propose-template.test.ts`
  - Verifies: `elements/propose-workflow.md` / Requirement "Propose 按 TDD 闭环划分 Tasks" / Scenario "Propose 必须判断 Check 价值", Scenario "Scenario 数量不构成拆分理由"
  - Command: `pnpm exec vitest run test/core/templates/propose-template.test.ts`
  - Expect: propose 模板不再含 `Do NOT judge whether a check is semantically sufficient`；含按行为合并 Check 的指引

- [x] C3 Apply 与 TDD 检查点
  - Test action: modify `test/core/templates/apply-change.test.ts`
  - Verifies: `elements/tdd-checkpoints.md` / Requirement "测试质量标准验证" / Scenario "变异思考实验失败则重写", Scenario "同一行为不因多句规格拆分", Scenario "优先修改已有测试"
  - Command: `pnpm exec vitest run test/core/templates/apply-change.test.ts`
  - Expect: apply 要求先检查已有测试、RED 来自目标行为缺失，且不含「公共方法少于 5」类阈值

- [x] C4 Reviewer 按行为证据覆盖
  - Test action: modify `test/core/templates/reviewer-template.test.ts`
  - Verifies: `elements/reviewer-protocol.md` / Requirement "三个验证维度" / Scenario "Correctness 按行为证据判定覆盖", Scenario "行为无证据或弱断言升级为 CRITICAL"
  - Command: `pnpm exec vitest run test/core/templates/reviewer-template.test.ts test/skills/reviewer-correctness-escalation.test.ts`
  - Expect: reviewer 不再把 Scenario 1:1 测试文件缺口作为不可降级 CRITICAL；弱断言或无行为证据仍 CRITICAL

- [x] C5 Scenario 写行为而非排版
  - Test action: modify `test/core/templates/fragments/xirang-fragments.test.ts`
  - Verifies: `elements/propose-workflow.md` / Requirement "Propose 使用制品定义先行写作" / Scenario "Scenario 写行为而非排版"
  - Command: `pnpm exec vitest run test/core/templates/fragments/xirang-fragments.test.ts`
  - Expect: `ELEMENT_CONTRACT_SEMANTICS` 要求 Scenario 描述可观察行为，不把生成物排版当作行为

## One-time Verification

- [x] V1 Explore 按行为规划测试
  - Test action: one-time
  - Verifies: `elements/explore-brainstorming.md` / Requirement "分段设计呈现" / Scenario "Testing Strategy 按行为而非 Scenario 规划", Scenario "Testing Strategy 应用测试品质"
  - Evidence: 对照本 Change 的 `tasks.md` 与生成 explore 指引
  - Expect: 同一行为的多个 Scenario 共用 Check；Testing Strategy 按品质筛选

- [x] V2 Check 与 one-time 组织
  - Test action: one-time
  - Verifies: `elements/tasks-document.md` / Requirement "Checks 按可观察行为组织" / Scenario "同一行为共用一个 Check", Scenario "one-time Check 不建测试文件"
  - Evidence: 本 Change `tasks.md`
  - Expect: 无读正式 `.xirang/model/` 锁原文的测试计划；配置与 validate 走 one-time

- [x] V3 项目锁词与变更校验
  - Test action: one-time
  - Verifies: `elements/propose-workflow.md` / Requirement "Propose 按 TDD 闭环划分 Tasks" / Scenario "ready-for-apply 前边界自检"
  - Command: `xirang validate --change "test-quality-guidance" --json`
  - Expect: 校验无 error；`.xirang/config.yaml` `rules.tasks` 含本仓库锁词适配且未写进通用片段

## Required Corrections

### [artifact_fix] 将 reviewer-correctness-escalation 测试纳入 Task 1

- [x] Task 1 Files 与 C4 Command 增加 `test/skills/reviewer-correctness-escalation.test.ts`
  - Verifies: `elements/reviewer-protocol.md` / Requirement "三个验证维度" / Scenario "Correctness 按行为证据判定覆盖"
  - Command: `pnpm exec vitest run test/skills/reviewer-correctness-escalation.test.ts`
  - Expect: 该测试已声明归属 Task 1，并断言不再把 Scenario 1:1 作为不可降级 CRITICAL

### Task 1: 替换 Quality 持久化与运行时门禁

**Goal**: 以单个 Git-tracked `.quality.json` 实现 commit-bound Review、Opt disposition、Seal 和下游状态门禁，并移除旧 Quality 状态写入路径。

**Files**:
- Modify: `src/core/quality/engine.ts`
- Modify: `src/core/quality/completion.ts`
- Modify: `src/core/quality/state.ts`
- Modify: `src/core/quality/command-schema.ts`
- Modify: `src/core/quality/protocol.ts`
- Modify: `src/commands/quality.ts`
- Modify: `src/core/change-sync.ts`
- Modify: `src/commands/sync.ts`
- Modify: `src/core/archive.ts`
- Modify: `src/core/list.ts`
- Modify: `src/commands/workflow/instructions.ts`
- Delete: `src/core/quality/sync-association.ts`
- Modify: `test/core/quality/engine.test.ts`
- Modify: `test/core/quality/completion.test.ts`
- Modify: `test/core/quality/protocol.test.ts`
- Modify: `test/core/quality/state.test.ts`
- Modify: `test/commands/quality.test.ts`
- Modify: `test/commands/sync.test.ts`
- Modify: `test/core/change-sync.partitions.test.ts`
- Modify: `test/core/archive.test.ts`
- Modify: `test/integration/archive-workflow.test.ts`
- Modify: `test/integration/sync-workflow.test.ts`
- Modify: `test/core/list.test.ts`
- Modify: `test/commands/artifact-workflow.test.ts`
- Modify: `test/helpers/quality-fixture.ts`

**Sections**:
- Store only schema version 3, Change identity, monotonic revision, append-only Review/Opt opinions, Opt disposition, and current Seal in `.quality.json`; use Node `path` APIs, atomic same-directory replacement, and revision compare-and-swap. Preserve all legacy files and ignore rules unchanged. (`elements/quality-writeback.md` / Sections "状态快照持久化", "append-only 历史日志", "必要持久化边界", "质量记录的受控轮换")
- Implement `xirang quality review`, `xirang quality opt`, `xirang quality seal`, and read-only `xirang quality status` with commit identity, uniqueness, disposition, and sequence validation; keep findings, task updates, Opt choice, and post-Opt Review decisions with the main Agent. (`elements/quality-cli-gate.md` / Sections "Review 记录入口", "Optimization 记录入口", "Seal 校验", "Status 输出语义"; `elements/quality-writeback.md` / Sections "CRITICAL 不一致触发回写", "Required Corrections 清单生成")
- Derive status for instructions and list from the new record; Sync checks Seal without mutating Quality JSON and retains its independent semantic validation; Archive checks only that the Seal commit object exists and retains its independent Sync, validation, and task gates. (`elements/quality-aware-instructions.md` / Section "Apply 指令依据 quality 状态判定 state"; `elements/list-command.md` / Section "list --json 输出包含 quality 状态"; `elements/change-sync.md` / Section "同步执行"; `elements/archive-quality-gate.md` / Sections "Archive rerun 使用 quality 执行模型", "Archive 与 Sync 双重门禁")
- Remove obsolete Quality checkpoint and freshness state behavior, old mutation commands and Sync writeback; do not read, migrate, rewrite, or delete legacy runtime records. (`elements/quality.md` / Sections "Review 通过后建立 Baseline", "收口后确认可进入 Change Closure"; `elements/checkpoint.md` / REMOVED Section "Checkpoint 隔离状态"; `elements/quality-freshness.md` / REMOVED Section "记录匹配与状态判定")

#### Checks

- [x] C1 Verify 单文件存储的原子 CAS 与跨平台路径
  - Verifies: `elements/quality-writeback.md` / Section "状态快照持久化"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/quality/engine.test.ts test/commands/quality.test.ts`
  - Expect: stale revision 与并发写入不覆盖原记录；中断写入不留下半份目标 JSON；路径断言使用 `path.join()`，且新记录位于 Change 内的 `.quality.json`。
  - Evidence: `.github/workflows/xirang-v2-cross-platform.yml` 的 Windows job 执行完整 `pnpm test`，覆盖同一修改后的路径测试。

- [x] C2 Verify Review 基线、失败修正与 commit 绑定
  - Verifies: `elements/review.md` / Section "在每次 Apply 修改后执行"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/quality/engine.test.ts test/core/quality/state.test.ts test/commands/quality.test.ts`
  - Expect: 只有绑定已提交 commit 的通过基线 Review 开启后续门禁；失败后必须在不同 commit 上取得通过复审；Review 结果保留原 commit 关联且 CLI 不改写任务文件。

- [x] C3 Verify Opt disposition 与 Seal 前置条件
  - Verifies: `elements/quality-cli-gate.md` / Section "Optimization 记录入口"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/quality/engine.test.ts test/core/quality/protocol.test.ts test/commands/quality.test.ts`
  - Expect: `quality opt` 接受带 `baseCommit`/`resultCommit` 的交付意见或带理由的 `not_performed`；不能由缺失记录推断跳过；CLI 不执行测试或替主 Agent 选择 Opt。

- [x] C4 Verify Seal 声明与 commit 存在性门禁
  - Verifies: `elements/quality-cli-gate.md` / Section "Seal 校验"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/quality/completion.test.ts test/commands/quality.test.ts`
  - Expect: Seal 要求通过基线 Review 与明确 Opt disposition，记录主 Agent 对指定 commit 的声明；commit 不存在时拒绝，HEAD 或工作区不同、未 clean、Quality JSON 尚未单独提交本身均不使 Seal 失效。

- [x] C5 Verify status 投影及 list/instructions 消费
  - Verifies: `elements/quality-cli-gate.md` / Section "Status 输出语义"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/quality/state.test.ts test/core/quality/completion.test.ts test/core/list.test.ts test/commands/artifact-workflow.test.ts`
  - Expect: `needs_review`、`needs_optimize`、`all_done` 和 `ready` 由新 JSON 与任务完成度按各自契约投影；不计算 manifest freshness，也不从旧记录推断通过。

- [x] C6 Verify Sync 不写回 Quality 状态
  - Verifies: `elements/change-sync.md` / Section "同步执行"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/sync.test.ts test/core/change-sync.partitions.test.ts test/integration/sync-workflow.test.ts`
  - Expect: Seal gate 通过后 Sync 仍完成既有 Semantic Delta 校验与原子同步；Sync 不改写 `.quality.json`，且其 validation 和 bypass 门禁保持独立。

- [x] C7 Verify Archive 只检查 Seal commit object
  - Verifies: `elements/archive-quality-gate.md` / Section "Archive rerun 使用 quality 执行模型"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/archive.test.ts test/integration/archive-workflow.test.ts`
  - Expect: 缺失或不可解析的 Seal commit 阻止默认归档并返回诊断；存在的 commit 即通过 Quality 子门禁，不比较 HEAD、工作区内容或 clean 状态，也不要求先单独提交 Quality JSON；其他 Archive gates 仍独立生效。

- [x] C8 Verify 旧记录拒绝且保持不变
  - Verifies: `elements/quality-cli-gate.md` / Section "拒绝退役协议"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/quality/engine.test.ts test/commands/quality.test.ts`
  - Expect: 只有旧格式时返回明确不支持或新记录缺失诊断；旧 snapshot/log/evidence/lock 内容、历史归档及 `.gitignore` 不被读取迁移、覆盖或删除。

- [x] C9 Verify Quality checkpoint 状态已移除
  - Verifies: `elements/quality.md` / Section "Review 通过后建立 Baseline"
  - Test action: one-time
  - Command: `! rg -n 'quality checkpoint|successful checkpoint|baseline checkpoint|checkpointState' src/core/quality src/commands/quality.ts src/core/change-sync.ts src/commands/sync.ts src/core/archive.ts`
  - Expect: Quality runtime 与下游 consumer 不再包含旧 checkpoint 状态机调用；与 Quality 无关的 Apply isolation 不在此断言范围内。

- [x] C10 Verify Quality freshness 协议已移除
  - Verifies: `elements/quality-cli-gate.md` / Section "Status 输出语义"
  - Test action: one-time
  - Command: `! rg -n 'evidenceFingerprint|tasksFileHash|quality freshness|freshness manifest' src/core/quality src/commands/quality.ts src/core/change-sync.ts src/commands/sync.ts src/core/archive.ts`
  - Expect: Quality、Sync 与 Archive runtime 不再计算或依赖旧 freshness manifest。

### Task 2: 更新 Review、Opt 与 Archive 工作面

**Goal**: 将 Apply、Reviewer、Optimizer、Archive 模板及托管投影统一到 Task 1 已通过的 Quality 协议和运行时 schema。

**Files**:
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Modify: `src/core/templates/workflows/quality-execution-model.ts`
- Modify: `src/core/templates/workflows/apply-change.ts`
- Modify: `src/core/templates/workflows/archive-change.ts`
- Modify: `src/core/templates/workflows/reviewer.ts`
- Modify: `src/core/templates/workflows/optimizer.ts`
- Modify: `.pi/skills/`
- Modify: `.pi/agents/`
- Modify: `.xirang/references/`
- Modify: `test/core/templates/apply-change.test.ts`
- Modify: `test/core/templates/archive-change.test.ts`
- Modify: `test/core/templates/reviewer-template.test.ts`
- Modify: `test/core/templates/optimizer-template.test.ts`
- Modify: `test/core/templates/fragments/xirang-fragments.test.ts`
- Modify: `test/core/workflow-installation.test.ts`
- Modify: `test/core/workflow-surface.test.ts`
- Modify: `test/core/shared/skill-generation.test.ts`
- Modify: `test/core/templates/skill-templates-parity.test.ts`
- Modify: `test/skills/archive-skill-content.test.ts`
- Modify: `test/skills/optimizer-skill-content.test.ts`
- Modify: `test/skills/reviewer-skill-content.test.ts`

**Sections**:
- Project runtime command schemas into Apply/Archive references and generated workflow artifacts; describe Review, optional Opt disposition, Seal, commit associations, status, and deterministic failures without parallel payload schemas. (`elements/quality-cli-gate.md` / Section "协议说明的单一来源与投影"; `elements/agent-prompt-guidance.md` / Section "共享 quality gate 指引片段")
- Keep Reviewer clean-context and read-only, with commit-bound evidence and opinions; route findings, task-state decisions, corrections, and commits to the main Agent. (`elements/reviewer.md` / Section "保持只读且不修改项目与任务"; `elements/reviewer-protocol.md` / Sections "Reviewer 角色与硬约束", "结构化输出合约")
- Guide the main Agent to decide optional Opt and any post-Opt Review, record either delivered opinions or an explicit no-Opt reason, and Seal only its own commit-bound runnable/test-expectation declaration. (`elements/workflow-templates.md` / Section "Quality flow 使用 Review、Opt 与 Seal 表格"; `elements/optimization-execution.md` / Section "主 Agent 决定最终验证")
- Keep Archive guidance limited to the Seal commit existence gate and preserve independent Sync, validation, task, and explicit bypass gates; remove retired Quality checkpoint, progress, verification, and freshness workflows from generated surfaces. (`elements/archive-quality-gate.md` / Sections "Archive rerun 使用 quality 执行模型", "Archive 与 Sync 双重门禁"; `elements/workflow-templates.md` / REMOVED Section "checkpoint state machine 使用表格格式")

#### Checks

- [x] C11 Verify Apply 与 Optimizer 使用新协议
  - Verifies: `elements/workflow-templates.md` / Section "Quality flow 使用 Review、Opt 与 Seal 表格"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/templates/apply-change.test.ts test/core/templates/optimizer-template.test.ts test/core/templates/fragments/xirang-fragments.test.ts test/core/shared/skill-generation.test.ts test/core/templates/skill-templates-parity.test.ts`
  - Expect: Apply 指引按 Review、主 Agent 决定的 Opt disposition、Seal 推进；Opt 交付绑定 base/result commits，恢复由 Git 承载，不再要求 Quality progress、checkpoint 或 CLI 测试捕获。

- [x] C12 Verify Reviewer 只读并交付 commit-bound opinion
  - Verifies: `elements/reviewer.md` / Section "保持只读且不修改项目与任务"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/templates/reviewer-template.test.ts test/skills/reviewer-skill-content.test.ts`
  - Expect: 生成的 Reviewer 只读取指定 commit 并交付意见，不编辑项目、`tasks.md`、Quality JSON 或 Git history；主 Agent 处理 Required Corrections。

- [x] C13 Verify Archive 工作面只宣称 Seal commit 检查
  - Verifies: `elements/agent-prompt-guidance.md` / Section "Archive 模板未收口恢复路径"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/templates/archive-change.test.ts test/skills/archive-skill-content.test.ts test/core/workflow-installation.test.ts test/core/workflow-surface.test.ts`
  - Expect: Archive 引导缺失或不可解析 Seal 返回 Apply 补齐；commit 存在时不声称 CLI 跑过测试、比对 HEAD/工作区或创建 successful checkpoint；安装投影仍使用托管生成面。

- [x] C14 Verify generated CLI reference 与 runtime schema 一致
  - Verifies: `elements/quality-cli-gate.md` / Section "协议说明的单一来源与投影"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/templates/fragments/xirang-fragments.test.ts test/core/templates/apply-change.test.ts test/core/templates/archive-change.test.ts test/core/workflow-installation.test.ts test/core/shared/skill-generation.test.ts`
  - Expect: Review、Opt、Seal 的 payload、命令名和错误诊断由 runtime schema 投影；生成内容不保留平行旧 schema。

- [x] C15 Verify generated Quality checkpoint state machine 已移除
  - Verifies: `elements/workflow-templates.md` / Section "Quality flow 使用 Review、Opt 与 Seal 表格"
  - Test action: one-time
  - Command: `! rg -n 'quality checkpoint|successful checkpoint|baseline checkpoint|quality verification|quality delegation|evidenceFingerprint|freshness manifest' src/core/templates/workflows/apply-change.ts src/core/templates/workflows/archive-change.ts src/core/templates/workflows/optimizer.ts src/core/templates/workflows/reviewer.ts src/core/templates/fragments/xirang-fragments.ts src/core/templates/workflows/quality-execution-model.ts`
  - Expect: Quality 生成工作面不再要求退役命令、progress state、checkpoint 或 freshness；非 Quality 的隔离与 Git 恢复指引仍按目标 Contract 保留。

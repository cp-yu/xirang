### Task 1: 修正历史 Review 匹配后的当前台账

**Goal**: 让普通失败回滚继续复用匹配的 Review 证据，同时保留最新优化台账；本任务不依赖 Task 2 的恢复 reference 即可 GREEN。

**Files**:
- Modify: `src/core/quality/state.ts`
- Test: `test/core/quality/state.test.ts`
- Test: `test/commands/quality.test.ts`
- Test: `test/core/archive.test.ts`
- Test: `test/commands/sync.test.ts`

**Sections**:
- 按 `quality-freshness` / Section "记录匹配与状态判定" 独立选择 Review 证据与最新活动台账，沿用现有归一化与只读接口，不改写旧日志。
- 核对 status、review、optimize、seal、Sync、Archive 的现有消费者均使用当前台账；保持历史 PASS 匹配及快照/日志缺失时的保守判定。
- 修改拥有失败回滚行为的既有状态与 CLI 测试，覆盖方向、计数与终态；不为内部组合方式增加结构断言。

#### Checks

- [x] C1 历史 PASS 只恢复 Review 证据
  - Verifies: `elements/quality-freshness.md` / Section "记录匹配与状态判定"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/quality/state.test.ts`
  - Evidence: 扩展既有 failed-round rollback 场景：历史 PASS 已用方向数 0，最新快照已用方向数 1 且 unsafe；另验证方向失败 2 次且 rejected、最新失败 Review 的进度、最新快照无台账时不复活旧台账。记录修改前的行为失败与修改后的通过结果。
  - Expect: 恢复旧代码后可为 clean，当前计数、方向状态和 ABORTED_UNSAFE 仍取最新快照；旧记录字节不变，既有缺失记录与 Windows 路径场景仍通过。

- [x] C2 CLI 回滚后的门禁与追加记录使用最新台账
  - Verifies: `elements/quality-freshness.md` / Section "记录匹配与状态判定"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Evidence: 在既有 rollback 与 unsafe 场景中复现旧 PASS 遮住最新台账：真实恢复代码并保留配套记录后查询 status、尝试 optimize/seal，检查普通失败 attempt 的后续追加；比较追加前后日志前缀。若已有场景只断言终态当前匹配，扩展为历史 PASS 匹配。
  - Expect: unsafe 不因代码回退而解禁；普通失败预算及 rejected 方向不回退，后续合法写入保留最新进度；当前缺失配套日志仍要求 Review。

- [x] C3 既有 Closure 门禁保持阻塞 unsafe
  - Verifies: `elements/quality-freshness.md` / Section "记录匹配与状态判定"
  - Test action: reuse
  - Command: `pnpm exec vitest run test/core/archive.test.ts test/commands/sync.test.ts`
  - Evidence: 结合 C1/C2 的历史匹配输入，检查两条 Closure 路径读取 checkQualityState 返回的同一当前台账；保留现有 unsafe 和证据失效门禁的运行结果。
  - Expect: Sync、Archive 不会把当前 unsafe 作为可正常收束的状态；显式绕过授权规则不改变。

### Task 2: 交付共享恢复流程及历史保护

**Goal**: 在 Task 1 GREEN 后，将授权重验、共享 reference、各入口和角色、回滚历史保护与生成面作为一个完整闭环交付。

**Files**:
- Modify: `src/core/quality/protocol.ts`
- Modify: `src/commands/quality.ts`
- Modify: `src/commands/workflow/instructions.ts`
- Modify: `src/core/templates/workflows/apply-change.ts`
- Modify: `src/core/templates/workflows/archive-change.ts`
- Modify: `src/core/templates/workflows/reviewer.ts`
- Modify: `src/core/templates/workflows/optimizer.ts`
- Modify: `.github/workflows/windows.yml`
- Modify: `.xirang/references/`
- Modify: `.pi/skills/`
- Modify: `.pi/agents/`
- Test: `test/core/quality/protocol.test.ts`
- Test: `test/commands/quality.test.ts`
- Test: `test/commands/artifact-workflow.test.ts`
- Test: `test/core/templates/apply-change.test.ts`
- Test: `test/core/templates/archive-change.test.ts`
- Test: `test/core/templates/reviewer-template.test.ts`
- Test: `test/core/templates/optimizer-template.test.ts`
- Test: `test/core/templates/fragments/xirang-fragments.test.ts`
- Test: `test/core/shared/skill-generation.test.ts`

**Sections**:
- 按 `quality` / "活动 Change 的显式重新验证"、`apply-quality-integration` / "共享恢复 reference 编排重验" 与 `quality-writeback` / "质量记录的受控轮换" 交付串行授权、先保存校验后轮换和中断重入；入口在普通路由前检查未完成轮换。
- 同步 `quality-cli-gate`、`quality-aware-instructions`、`agent-prompt-guidance` 与 `archive-quality-gate` 的相关 Sections：保留未授权 unsafe 阻塞，明确共享恢复路径及受控轮换例外，不增加 reset 命令或并行任务协议。
- 按 `reviewer-protocol` / "Reviewer 输入合约"、`optimizer-protocol` / "Optimizer 输入合约" 和 "Failed Directions 避重协议" 提供历史读取入口，区分历史参考、活动证据和新轮次预算；保留隔离身份与原 baseCommit。
- 按 `optimization-execution` / "Checkpoint 与回滚"、`quality-orchestration` / "Checkpoint 协议使用有序执行步骤" 及 `apply-quality-integration` 的两个回滚 Sections 扩展 repository-external 保护集合，包含三份当前文件和全部质量历史；失败时停止。
- 按 `apply-quality-integration` / "恢复交付的验证证据" 维护受影响的既有协议/依赖测试，用正常生成入口更新受管工作面，在同一任务收集恢复、Git 回滚、生成可达性和跨平台证据；不新增解释性措辞锁词测试。

#### Checks

- [x] C4 维护协议门禁与共享 reference 依赖
  - Verifies: `elements/apply-quality-integration.md` / Section "共享恢复 reference 编排重验"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/quality/protocol.test.ts test/commands/quality.test.ts test/commands/artifact-workflow.test.ts test/core/templates/apply-change.test.ts test/core/templates/archive-change.test.ts test/core/templates/reviewer-template.test.ts test/core/templates/optimizer-template.test.ts test/core/templates/fragments/xirang-fragments.test.ts test/core/shared/skill-generation.test.ts`
  - Evidence: 维护 Apply reference 显式注册及共享依赖检查、未授权 unsafe 先阻塞的门禁；修订或移除固定“没有恢复路径”的过时措辞断言，保留禁止自动推进和任意删改质量记录的协议。检查任务运行或待回写时 reference 要求先停稳，不虚构 CLI 进程检测。仅受影响的既有测试需要修改，其余原样运行。
  - Expect: Apply/Archive 使用同一恢复 reference，已收口状态仍不能直接继续 optimize；已有“从头 review optimize”授权足以由 Agent 执行恢复，普通修正、失败回滚与中断续跑继续原轮次。

- [x] C5 真实 CLI 验证同代码重启与新额度
  - Verifies: `elements/quality.md` / Section "活动 Change 的显式重新验证"
  - Test action: one-time
  - Command: `pnpm build`
  - Evidence: 构建后在 repository 外建立临时 Git 项目及活动 Change，沿用既有 quality fixture 的合法 payload；以仓库 bin/xirang.js 的绝对路径在 fixture cwd 执行 quality review/optimize/status/seal。分别形成 ABORTED_UNSAFE 和 NOT_NEEDED 后，在明确授权且无运行任务的前提下按生成的恢复 reference 保存并轮换，保持代码、commits、checkpoints、隔离身份和 baseCommit 不变。新 Review 先用失败 payload 确认进入修正，再在修正后记录通过并建立本轮 checkpoint、重新 optimize。保留操作命令、状态输出和前后哈希，不创建持久测试文件。
  - Expect: 轮换后同代码仍 dirty，历史 PASS 不能代替 fresh Review，新 Review 前 optimize/seal 失败；通过后新方向额度与失败计数从零计算，旧终态不进入新台账；历史及重启原因可读。fixture payload 只证明 CLI 数据流，不冒充实际 Reviewer 的判断证据。

- [x] C6 保存失败和部分轮换重入不丢历史
  - Verifies: `elements/quality-writeback.md` / Section "质量记录的受控轮换"
  - Test action: one-time
  - Evidence: 使用 C5 的构建与 repository-external fixture，逐条执行 reference 文件操作。在第二个文件保存前、首个原件移走后、轮换完成后分别中断并重新进入 Apply preparation；制造保存校验失败、历史位置内容冲突和新活动记录已建立的重入。用 Node fs/path/crypto 核对原件、保存副本、关联说明与 SHA-256，记录完整文件清单及停止/恢复路径。
  - Expect: 两份原始记录未完整保存并校验前均不移走；中断先识别未完成轮换，不先写新 Review；一致副本可完成同次轮换，冲突保留现场并停止；既有历史与新活动记录不被覆盖或误轮换。

- [x] C7 后续失败优化的真实 Git 回滚保护全量历史
  - Verifies: `elements/optimization-execution.md` / Section "Checkpoint 与回滚"
  - Test action: one-time
  - Evidence: 在 C5 新轮次通过 Review 并有成功 checkpoint 后创建失败方向。分别让历史文件已跟踪和未跟踪，按更新的 reference 在 repository 外保存三份当前文件及完整历史清单与哈希，实际执行 git reset --hard HEAD 和 git clean -fd，再恢复、逐项比较并调用 quality status 与 optimize 报告 failed attempt；另验证无历史目录与恢复缺失/哈希冲突的分支。记录 Git 命令、文件集合比较和 CLI 输出，不在当前仓库执行破坏性命令。
  - Expect: 恢复后 clean，当前台账与失败预算连续，全部历史字节保留；失败/额外文件未核清时停止，不推进 checkpoint 或下一次判断，不借重启清空普通失败计数。

- [x] C8 生成工作面可达且角色实际读取历史
  - Verifies: `elements/apply-quality-integration.md` / Section "恢复交付的验证证据"
  - Test action: one-time
  - Evidence: C5 构建后在临时项目用真实 CLI 执行 setup --tools pi --project-definition <完整定义> 和 update --force，另用现有模板选择接口生成 archive-only 配置；逐个解析 Apply/Archive 到同一 xirang-quality-recovery.md 的实际链接并确认文件存在。在一次性角色输入演练中，分别按 Reviewer 与 Optimizer 的生成 self-read 路径打开 C5 旧历史及当前记录，核对 priorQualityRecord、原 baseCommit 与新台账分离。随后在当前项目执行 ./bin/xirang.js update --force，审查受管目录 diff；不手工维护平行生成文本。
  - Expect: archive-only 仍安装共享恢复 reference；Reviewer 对当前实现独立取证，旧记录只提供问题/导航参考；Optimizer 读取新活动 PASS，旧方向 ID、失败额度及终态不导入，当前轮次的失败避重仍有效。生成面与模板来源一致。

- [x] C9 构建类型与平台路径验证
  - Verifies: `elements/apply-quality-integration.md` / Section "恢复交付的验证证据"
  - Test action: one-time
  - Command: `pnpm exec tsc --noEmit`
  - Evidence: 复用 C5 的构建与 C4 的既有套件结果；在 .github/workflows/windows.yml 的既有 root 测试步骤加入 test/core/quality/state.test.ts 和 test/commands/quality.test.ts。记录 Windows CI 运行链接/结果，并在 Windows 带空格路径下按 reference 运行 C5–C7 的关键文件操作，核对反斜杠定位及原始字节；POSIX 使用本机一次性结果。没有实际 Windows 执行条件时明确记录证据缺口，不用 Linux 通过代替。
  - Expect: 构建、类型与受影响套件通过；路径逻辑使用平台 API，Windows 与 POSIX 保存/轮换/恢复完整性一致。跨平台证据未齐时不得宣称已完成该 Check。

## Required Corrections

- [x] [code_fix] C4：`runQualitySeal` 对不可归档终态的诊断仍指示“Restore the workspace to the recorded baseline before sealing this change.”，与共享恢复协议矛盾。将 optimization.terminal 的 fix 指向 `.xirang/references/xirang-quality-recovery.md` 并写明显式授权前提，扩展 `test/commands/quality.test.ts` 的 seal 门禁断言后重跑 C4 套件，再勾选 C4。
- [x] [code_fix] C9：Windows CI 运行结果与 Windows 带空格路径的轮换证据尚未记录；本机 `pnpm exec tsc --noEmit` 通过且 windows.yml 已含两个 quality 套件。记录 Windows CI 结果与路径抽查证据，或在无 Windows 执行条件时显式记录证据缺口（不以 Linux 结果代替），然后勾选 C9。

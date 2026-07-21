### Task 1: 建立 finding 类型、校验与持久化状态机

**Goal**: 为 optimization findings、reconciliation actions、稳定 ID、状态迁移和 append-only history 建立向后兼容的 TypeScript 合约。

**Files**:
- Modify: `src/core/verify/types.ts`
- Modify: `src/core/verify/result-validator.ts`
- Test: `test/core/verify/result-validator.test.ts`

**Requirements**:
- CLI 为 `add` actions 分配稳定 timestamp ID，并拒绝 optimizer 自分配新 ID
- 校验 finding 必填字段、三档维度、dependencies、唯一 selected 和合法状态迁移
- 将 reconciliation actions 与持久状态分离，并保证 history append-only
- 旧 `.verify-result.json` 缺少 findings/history 时按空集合读取

#### Checks

- [x] C1 验证 finding JSON 与稳定 ID 合约
  - Verifies: `specs/optimizer-finding-lifecycle/spec.md` / Requirement "Finding 数据合约与稳定标识" / Scenario "CLI 为新 finding 分配 ID", Scenario "拒绝 optimizer 自分配新 ID"
  - Command: `pnpm vitest run test/core/verify/result-validator.test.ts`
  - Expect: 合法 envelope 通过，非法 ID 与缺失字段被拒绝

- [x] C2 验证状态机和 append-only history
  - Verifies: `specs/optimizer-finding-lifecycle/spec.md` / Requirement "Finding 状态与 reconciliation events" / Scenario "合法状态迁移被持久化", Scenario "非法覆盖 history 被拒绝"
  - Command: `pnpm vitest run test/core/verify/result-validator.test.ts`
  - Expect: 仅允许定义的状态迁移，既有 history 无法覆盖或删除

### Task 2: 扩展 Phase 2 CLI finding 门禁

**Goal**: 让现有 `phase2 --type=optimization|verification` 持久化 reconciliation、选择首项、记录 reviewer verdict 和 finding 级失败预算。

**Files**:
- Modify: `src/commands/verify.ts`
- Modify: `src/core/verify/result-validator.ts`
- Test: `test/commands/verify.test.ts`

**Requirements**:
- 初次和后续 optimization 调用应用 actions、分配 IDs、重排 findings并选择唯一首项
- verification 调用更新 selected finding，而不是直接结束整个 Phase 2
- 成功波次不消耗 `optRetries`，失败次数按 finding 方向计算
- blockingObservations 和 masterChallenge 进入显式的重新裁决路径
- 保留现有 Phase 2 外部终态和双调用表面

#### Checks

- [x] C1 验证多 finding 提交与优先选择
  - Verifies: `specs/verify-cli-gate/spec.md` / Requirement "Phase 2 双调用门禁" / Scenario "初次提交多个 findings", Scenario "提交后续 reconciliation", Scenario "非法 selected 被拒绝"
  - Command: `pnpm vitest run test/commands/verify.test.ts`
  - Expect: CLI 持久化完整集合且每轮仅选择依赖已满足的首项

- [x] C2 验证成功与失败波次预算
  - Verifies: `specs/verify-optimization/spec.md` / Requirement "重试预算控制" / Scenario "成功优化不消耗预算", Scenario "失败方向达到上限"
  - Command: `pnpm vitest run test/commands/verify.test.ts`
  - Expect: 多个成功 findings 可超过 optRetries，耗尽的失败方向被拒绝而其他 findings 继续

- [x] C3 验证 NO_OPTIMIZATION_NEEDED 需要 reconciliation 证据
  - Verifies: `specs/enforce-optimizer-invocation/spec.md` / Requirement "CLI 拒绝无证据的 NO_OPTIMIZATION_NEEDED" / Scenario "合法 reconciliation 被接受", Scenario "只有 summary 时拒绝"
  - Command: `pnpm vitest run test/commands/verify.test.ts`
  - Expect: 合法无 actionable envelope 被接受，单独 summary 被拒绝

### Task 3: 实现 finding 新鲜度与兼容读取

**Goal**: 在 optimizer 裁决后、master 实施前检测目标文件变化，并保持 change-level freshness 和 archive compatibility。

**Files**:
- Modify: `src/core/verify/freshness.ts`
- Modify: `src/commands/verify.ts`
- Test: `test/core/verify/freshness.test.ts`
- Test: `test/commands/verify.test.ts`

**Requirements**:
- 持久化 selected finding 目标文件的 pre-implementation SHA-256 hashes
- 实施前内容变化时拒绝并要求重新 reconciliation
- 使用 Node.js path API 规范化 Windows 路径并持久化 POSIX 相对路径
- Finding PASS 后更新顶层 evidence snapshot，失败回滚保持最近成功 snapshot
- 旧结果与现有 archive terminal statuses 保持兼容

#### Checks

- [x] C1 验证 selected finding 文件新鲜度
  - Verifies: `specs/verify-freshness-engine/spec.md` / Requirement "Selected finding 新鲜度校验" / Scenario "目标文件未变化", Scenario "目标文件发生变化"
  - Command: `pnpm vitest run test/core/verify/freshness.test.ts test/commands/verify.test.ts`
  - Expect: 未变化 finding 可实施，hash 变化后被拒绝并要求 reconciliation

- [x] C2 验证跨平台路径和旧结果兼容
  - Verifies: `specs/verify-freshness-engine/spec.md` / Requirement "Selected finding 新鲜度校验" / Scenario "Windows 路径正确匹配"
  - Command: `pnpm vitest run test/core/verify/freshness.test.ts`
  - Expect: 反斜杠输入与 POSIX persisted path 匹配，legacy results 仍通过既有兼容判断

### Task 4: 重写 optimizer finding-first 模板

**Goal**: 让生成的 optimizer 只读地输出开放范围的严格 JSON findings、关键设计和 reconciliation actions。

**Files**:
- Modify: `src/core/templates/workflows/optimizer.ts`
- Test: `test/core/templates/optimizer-template.test.ts`
- Test: `test/skills/optimizer-skill-content.test.ts`

**Requirements**:
- 移除 Search/Replace、强制五标签和封闭 Code Smell 输出契约
- 覆盖结构、重复、算法、数据结构、I/O、分配和资源效率等非穷尽扫描面
- 输出 evidence、recommendation、keyDesign、preservationConstraints、validation 和排序依据
- 读取当前 findings/history/failedDirections并裁决全部非终态 findings
- 默认不声明 model，保持 read-only tools 和一层依赖展开边界

#### Checks

- [x] C1 验证 finding-first optimizer 合约
  - Verifies: `specs/openspec-optimizer-skill/spec.md` / Requirement "Optimizer finding JSON 输出合约" / Scenario "输出多个证据化 findings", Scenario "不输出逐字补丁"
  - Command: `pnpm vitest run test/core/templates/optimizer-template.test.ts test/skills/optimizer-skill-content.test.ts`
  - Expect: 模板要求严格 JSON、多 findings 和关键设计，且不包含 Search/Replace 输出协议

- [x] C2 验证开放优化范围与候选信号
  - Verifies: `specs/tdd-optimizer-smells/spec.md` / Requirement "优化候选信号" / Scenario "长方法不自动要求拆分", Scenario "发现未预定义的算法机会"
  - Command: `pnpm vitest run test/skills/optimizer-skill-content.test.ts`
  - Expect: 固定阈值只触发分析，开放 finding 可覆盖算法与资源机会

- [x] C3 验证模型与 scope 边界
  - Verifies: `specs/openspec-optimizer-skill/spec.md` / Requirement "Optimizer 角色与硬约束" / Scenario "默认不指定 model"
  - Command: `pnpm vitest run test/core/templates/optimizer-template.test.ts`
  - Expect: optimizer 模板无默认 model，仍禁止 edit/write 且只允许 base scope actionable targets

### Task 5: 重写 apply 与 verify 编排引用

**Goal**: 让 apply、verify 和 archive surfaces 执行 finding-driven 原子波次、master challenge 和 fresh reviewer 闭环。

**Files**:
- Modify: `src/core/templates/workflows/apply-change.ts`
- Modify: `src/commands/verify.ts`
- Modify: `src/core/templates/workflows/archive-change.ts`
- Modify: `src/core/templates/fragments/opsx-fragments.ts`
- Test: `test/core/templates/apply-change.test.ts`
- Test: `test/commands/verify.test.ts`

**Requirements**:
- 每个波次只实现 selected finding，完成或失败后重新调用 optimizer
- Master 按 keyDesign 进行 TDD 实现，实质异议通过 masterChallenge 重新裁决
- Fresh reviewer 验证 preservation constraints，不重判优化价值
- Checkpoint commit 包含 finding ID，失败回滚到最近成功状态
- 停止条件覆盖无 actionable、失败方向耗尽、skip/disabled 和 STALLED

#### Checks

- [x] C1 验证 Phase 2 波次编排和角色边界
  - Verifies: `specs/apply-verify-integration/spec.md` / Requirement "apply 作为编译步骤" / Scenario "finding 驱动的优化循环", Scenario "成功 checkpoint 包含 finding ID"
  - Command: `pnpm vitest run test/core/templates/apply-change.test.ts`
  - Expect: 生成 reference 按 optimizer判断、master实现、reviewer验证、重新 reconciliation 的顺序执行

- [x] C2 验证 master challenge 与 reviewer 边界
  - Verifies: `specs/apply-verify-integration/spec.md` / Requirement "主 agent 和 subagent 角色分工" / Scenario "master 实现 selected finding", Scenario "reviewer 独立验证"
  - Command: `pnpm vitest run test/core/templates/apply-change.test.ts`
  - Expect: master 不能自行跳过 finding，reviewer 只验证 spec 和 preservation constraints

### Task 6: 刷新生成面并完成端到端验证

**Goal**: 同步所有受管 subagent/reference 制品，并验证多波次 reconciliation、失效、challenge 和回滚场景。

**Files**:
- Modify: `openspec/references/`
- Modify: `src/core/templates/sync-engine.ts`
- Modify: `.claude/agents/`
- Delete: `.claude/commands/opsx/apply.md`
- Modify: `.codex/agents/`
- Delete: `.github/prompts/opsx-apply.prompt.md`
- Modify: `.opencode/agents/`
- Modify: `.pi/agents/`
- Modify: `.pi/skills/openspec-archive-change/SKILL.md`
- Test: `test/core/templates/sync-engine.test.ts`
- Test: `test/core/templates/fragments/opsx-fragments.test.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`
- Test: `test/core/workflow-installation.test.ts`

**Requirements**:
- 仅通过生成程序刷新显式受管 optimizer/reference 制品
- 不修改 archive 历史，也不删除用户自有非 `openspec-` references
- 生成面与 source template 保持一致
- 演练两个成功波次和一个后续 finding invalidated 场景
- 演练 masterChallenge 与 speculative reviewer failure/rollback

#### Checks

- [x] C1 验证生成面一致性
  - Verifies: `specs/openspec-optimizer-skill/spec.md` / Requirement "跨工具 skill 路径兼容" / Scenario "Windows 路径输入规范化"
  - Command: `pnpm vitest run test/core/templates/sync-engine.test.ts test/core/workflow-installation.test.ts test/skills/skill-template-length-validation.test.ts`
  - Expect: 所有工具生成 optimizer artifact，无默认 model，references 来自单一模板源且满足长度限制

- [x] C2 演练多波次 reconciliation 和 invalidation
  - Verifies: `specs/optimizer-finding-lifecycle/spec.md` / Requirement "优化波次 reconciliation" / Scenario "成功波次后重排剩余 findings", Scenario "代码变化使旧 finding 失效"
  - Command: `pnpm vitest run test/commands/verify.test.ts`
  - Expect: 夹具完成至少两个成功波次，第二轮可将旧 finding 标记 invalidated并新增或重排建议

- [x] C3 演练 challenge、失败回滚和终止
  - Verifies: `specs/verify-optimization/spec.md` / Requirement "优化 finding reconciliation" / Scenario "Master challenge 触发重新裁决"
  - Command: `pnpm vitest run test/commands/verify.test.ts test/core/verify/freshness.test.ts`
  - Expect: challenge 触发新 reconciliation，reviewer failure 回滚且失败方向耗尽后不阻塞其他 findings

- [x] C4 执行完整质量门禁
  - Verifies: `specs/optimizer-finding-lifecycle/spec.md` / Requirement "优化循环终止" / Scenario "多个成功波次不受 optRetries 限制", Scenario "无推进时停止"
  - Command: `pnpm lint && pnpm build && pnpm test && openspec validate --all`
  - Expect: lint、build、全量测试和 OpenSpec validation 全部通过；active source/references/specs 不再包含旧 Search/Replace optimizer 强制契约

### Task 1: quality 记录模型与代码状态判定

**Goal**: 建立新的 quality 记录模型与由代码 fingerprint 驱动的 `clean`/`dirty` 判定，并提供状态快照与 append-only 历史日志的读写。

**Files**:
- Create: `src/core/quality/types.ts`
- Create: `src/core/quality/state.ts`
- Create: `src/core/quality/log.ts`
- Test: `test/core/quality/state.test.ts`
- Test: `test/core/quality/log.test.ts`

**Requirements**:
- 记录模型区分 `kind: "review" | "optimize"`；Review 记录携带 `result`、`issues`、`tasksFileHash` 与验证上下文；Optimization 记录携带方向台账、两级计数、终态与 `stopReason`
- 状态判定按 evidence fingerprint 在历史记录中查找与当前代码一致的通过记录，得出 `clean`；否则为 `dirty`
- `tasksFileHash` 与 `evidenceFingerprint` 的计算排除 quality 自身记录文件
- 状态快照覆盖写、历史日志 append-only；写入顺序为先日志后快照，两者不一致时保守判为 `dirty`
- 所有文件路径使用 Node.js path API 构建与比较

#### Checks

- [x] C1 记录匹配当前代码时为 clean
  - Verifies: `elements/quality-freshness.md` / Requirement "记录匹配与状态判定" / Scenario "记录匹配当前代码时为 clean"
  - Command: `pnpm exec vitest run test/core/quality/state.test.ts`
  - Expect: 与当前代码 fingerprint 一致的通过记录使状态判定为 `clean`；测试通过

- [x] C2 失败回滚后回到 clean
  - Verifies: `elements/quality-freshness.md` / Requirement "记录匹配与状态判定" / Scenario "失败回滚后回到 clean"
  - Command: `pnpm exec vitest run test/core/quality/state.test.ts`
  - Expect: 最新记录为失败但代码已回滚到更早通过状态时，状态为 `clean`；测试通过

- [x] C3 无记录或指纹不一致时为 dirty
  - Verifies: `elements/quality-freshness.md` / Requirement "记录匹配与状态判定" / Scenario "无记录时为 dirty"
  - Verifies: `elements/quality-freshness.md` / Requirement "记录匹配与状态判定" / Scenario "指纹不一致时为 dirty"
  - Command: `pnpm exec vitest run test/core/quality/state.test.ts`
  - Expect: 缺少记录或指纹不匹配时状态为 `dirty`，并列出不一致文件；测试通过

- [x] C4 快照与日志的写入顺序与不可改写性
  - Verifies: `elements/quality-writeback.md` / Requirement "append-only 历史日志" / Scenario "快照与日志的写入顺序"
  - Verifies: `elements/quality-writeback.md` / Requirement "append-only 历史日志" / Scenario "每次记录追加一行"
  - Command: `pnpm exec vitest run test/core/quality/log.test.ts`
  - Expect: 追加在多轮后可读且既有行不变；快照与日志不一致时判为 `dirty`；测试通过

- [x] C5 跨平台路径匹配
  - Verifies: `elements/quality-freshness.md` / Requirement "记录匹配与状态判定" / Scenario "Windows 路径正确匹配"
  - Command: `pnpm exec vitest run test/core/quality/state.test.ts`
  - Expect: 反斜杠路径被规范化为相对 POSIX 路径并正确匹配；Windows CI 一并验证

### Task 2: quality 命令面、入口条件与统一诊断

**Goal**: 用 `xirang quality` 的四个入口替换命令面，落实入口条件、收口推导、两级计数、统一输出与诊断，并把协议说明投影到 help。

**Files**:
- Create: `src/commands/quality.ts`
- Create: `src/core/quality/validators.ts`
- Create: `src/core/quality/protocol.ts`
- Create: `src/core/quality/diagnostics.ts`
- Modify: `src/core/quality/types.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/core/project-config.ts`
- Modify: `src/core/config-schema.ts`
- Modify: `src/core/config-projection.ts`
- Modify: `src/core/config-prompts.ts`
- Modify: `src/core/global-config.ts`
- Modify: `src/core/completions/positional-types.ts`
- Delete: `src/commands/verify.ts`
- Delete: `test/commands/verify.test.ts`
- Delete: `test/core/verify/`
- Test: `test/commands/quality.test.ts`
- Test: `test/core/quality/validators.test.ts`
- Test: `test/core/project-config.test.ts`
- Test: `test/core/update.test.ts`
- Test: `test/core/config-schema.test.ts`
- Test: `test/core/global-config.test.ts`
- Test: `test/commands/config.test.ts`
- Test: `test/core/setup.test.ts`
- Test: `test/core/completions/introspect.test.ts`
- Test: `test/core/archive.test.ts`
- Modify: `.xirang/config.yaml`

**Requirements**:
- 四个入口 `review`、`optimize`、`status`、`seal` 及各自入口条件：Review 要求存在未检测的代码变更；Optimization 要求代码已通过 Review、尚未收口、非 `ABORTED_UNSAFE` 且方向数未达上限
- 收口由 `stopReason` 推导终态，方向数用尽只阻止选择新方向
- 两级计数由 `optimization.directionLimit` 与 `optimization.directionRetries` 控制，并进入配置默认值
- 所有子命令使用统一输出形状，失败携带稳定 `code`、`diagnostics{path,expected,actual,fix}` 与 `allowedNextOperations`，退出码为 0/1/2
- 协议说明由 `protocol.ts` 的导出常量派生到 help，枚举与校验实现共用同一常量

#### Checks

- [x] C1 Review 入口条件与拒绝路径
  - Verifies: `elements/quality-cli-gate.md` / Requirement "Review 记录入口" / Scenario "入口条件通过并记录结论"
  - Verifies: `elements/quality-cli-gate.md` / Requirement "Review 记录入口" / Scenario "代码未变更时拒绝重复记录"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: `dirty` 时记录成功并输出状态；`clean` 时以 exit 1 拒绝且不写任何记录；测试通过

- [x] C2 Optimization 入口条件与收口推导
  - Verifies: `elements/quality-cli-gate.md` / Requirement "Optimization 记录入口" / Scenario "满足入口条件并记录一轮"
  - Verifies: `elements/quality-cli-gate.md` / Requirement "收口终态由 stopReason 推导" / Scenario "被方向数上限截断但已有成功方向"
  - Verifies: `elements/optimizer-findings.md` / Requirement "Finding 优先级与选择" / Scenario "选择依赖已满足的最高优先级方向"
  - Verifies: `elements/optimizer-findings.md` / Requirement "方向状态集合" / Scenario "失败达上限转为 rejected"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: 满足入口条件时记录一轮并回显方向 ID；每轮只选中一个且为最高优先级；达失败上限的方向转为 `rejected`；`DIRECTION_LIMIT_REACHED` 且已有成功方向时为 `IMPROVED`；测试通过

- [x] C3 诊断结构与退出码
  - Verifies: `elements/quality-cli-gate.md` / Requirement "统一输出与诊断结构" / Scenario "字段非法时给出可操作诊断"
  - Verifies: `elements/quality-cli-gate.md` / Requirement "统一输出与诊断结构" / Scenario "入口条件不满足时给出后续操作"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: 非法输入以 exit 2 返回 `INVALID_INPUT` 与 `path`/`expected`/`fix`；入口不满足以 exit 1 返回 `code` 与 `allowedNextOperations`；测试通过

- [x] C4 两级计数与配置默认值
  - Verifies: `elements/optimization-execution.md` / Requirement "重试预算控制" / Scenario "成功方向不消耗失败额度"
  - Verifies: `elements/optimization-execution.md` / Requirement "重试预算控制" / Scenario "方向数用尽"
  - Verifies: `elements/workspace-init-update.md` / Requirement "迁移配置默认值" / Scenario "缺失嵌套默认值补齐"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts test/core/project-config.test.ts test/core/update.test.ts`
  - Expect: 成功轮次不计入失败额度；达到方向数上限后拒绝选择新方向但接受收口；`xirang update` 补齐两个新键且保留用户值；测试通过

- [x] C5 help 与实现共用同一来源
  - Verifies: `elements/quality-cli-gate.md` / Requirement "协议说明的单一来源与投影" / Scenario "help 与 reference 具有同一来源"
  - Verifies: `elements/completion-introspect.md` / Requirement "positionalType 通过集中式 Map 注入" / Scenario "quality 命令通过反射可发现"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts test/core/completions/introspect.test.ts && node bin/xirang.js quality optimize --help`
  - Expect: help 输出包含全部枚举取值与最小示例且枚举来自同一常量；反射可发现 `quality` 及其四个子命令；测试通过

- [x] C6 status 为只读命令
  - Verifies: `elements/quality-cli-gate.md` / Requirement "Status 输出语义" / Scenario "status 为只读命令"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: 执行 `status` 与 help 后记录文件的内容与修改时间不变；测试通过

- [x] C7 Seal 校验
  - Verifies: `elements/quality-cli-gate.md` / Requirement "Seal 校验" / Scenario "Seal 校验通过"
  - Verifies: `elements/quality-cli-gate.md` / Requirement "Seal 校验" / Scenario "Seal 校验失败"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: 代码已通过 Review 且 Optimization 已收口时输出 seal hash；未满足时列出条件并以 exit 1 退出；测试通过

### Task 3: 归档、同步与指令门禁切换到代码状态

**Goal**: 让 archive、sync、instructions 与 list 依据新的状态判定与记录文件工作，旧的 verify 记录文件不再参与任何门禁。

**Files**:
- Modify: `src/commands/sync.ts`
- Modify: `src/core/archive.ts`
- Modify: `src/core/change-sync.ts`
- Modify: `src/core/list.ts`
- Modify: `src/commands/workflow/instructions.ts`
- Modify: `src/commands/workflow/shared.ts`
- Test: `test/commands/sync.test.ts`
- Test: `test/core/archive.test.ts`
- Test: `test/commands/artifact-workflow.test.ts`
- Test: `test/core/list.test.ts`

**Requirements**:
- archive 与 sync 门禁依据新的状态判定、归档兼容判定与建议命令名
- sync 完成后按重叠路径刷新状态快照中的 evidence fingerprint
- `xirang instructions apply` 依据代码状态产生 `needs_review`、`needs_optimize`、`all_done` 与 `ready`
- `xirang list --json` 输出 `qualityStatus`
- 未收口与 `ABORTED_UNSAFE` 仍按原有严格度阻塞归档

#### Checks

- [x] C1 归档门禁依据新的状态判定
  - Verifies: `elements/archive-quality-gate.md` / Requirement "归档前必须具备新鲜的完整验证记录" / Scenario "Review 记录缺失或状态为 dirty 时由 CLI 提示"
  - Verifies: `elements/change-archive.md` / Requirement "Display Output" / Scenario "摘要报告字段"
  - Command: `pnpm exec vitest run test/core/archive.test.ts`
  - Expect: 记录缺失或代码不一致时以 exit 1 提示，建议命令使用新的 quality 命令名，摘要字段报告 quality gate 结果；测试通过

- [x] C2 未收口与 unsafe 仍阻塞归档
  - Verifies: `elements/archive-quality-gate.md` / Requirement "归档前必须具备新鲜的完整验证记录" / Scenario "尚未收口时不得归档复用"
  - Verifies: `elements/archive-quality-gate.md` / Requirement "归档前必须具备新鲜的完整验证记录" / Scenario "ABORTED_UNSAFE 硬阻塞"
  - Command: `pnpm exec vitest run test/core/archive.test.ts test/commands/sync.test.ts`
  - Expect: 两项仍返回 incompatible 并以非零退出；测试通过

- [x] C3 sync 后指纹刷新
  - Verifies: `elements/change-sync.md` / Requirement "sync 完成后刷新 evidence fingerprint" / Scenario "evidence 中有 sync 输出文件时刷新"
  - Command: `pnpm exec vitest run test/commands/sync.test.ts`
  - Expect: 重叠路径被重算并写回状态快照，刷新后状态判定为 `clean`；测试通过

- [x] C4 指令状态分支
  - Verifies: `elements/quality-aware-instructions.md` / Requirement "Apply 指令依据 quality 状态判定 state" / Scenario "全部 tasks 完成但尚无 Review 记录"
  - Verifies: `elements/quality-aware-instructions.md` / Requirement "Apply 指令依据 quality 状态判定 state" / Scenario "已通过 Review 但 Optimization 尚未收口"
  - Command: `pnpm exec vitest run test/commands/artifact-workflow.test.ts`
  - Expect: 分别产生 `needs_review` 与 `needs_optimize`，且 instruction 引导对应命令；测试通过

- [x] C5 list 输出 quality 状态
  - Verifies: `elements/list-command.md` / Requirement "list --json 输出包含 quality 状态" / Scenario "记录存在且与当前代码一致"
  - Verifies: `elements/list-command.md` / Requirement "list --json 输出包含 quality 状态" / Scenario "记录不存在"
  - Command: `pnpm exec vitest run test/core/list.test.ts`
  - Expect: 分别输出 `clean` 与 `MISSING`，`status` 字段保持原语义；测试通过

### Task 4: 生成面与协议投影

**Goal**: 让 apply 与 archive skill 的 reference、共享指引片段与内部 subagent 提示使用新协议，并只引用派生内容。

**Files**:
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Modify: `src/core/templates/workflows/apply-change.ts`
- Modify: `src/core/templates/workflows/archive-change.ts`
- Modify: `src/core/templates/workflows/optimizer.ts`
- Modify: `src/core/templates/workflows/reviewer.ts`
- Delete: `src/core/templates/workflows/verify-execution-model.ts`
- Create: `src/core/templates/workflows/quality-execution-model.ts`
- Modify: `src/core/shared/skill-generation.ts`
- Test: `test/core/templates/fragments/xirang-fragments.test.ts`
- Test: `test/core/templates/apply-change.test.ts`
- Test: `test/core/templates/archive-change.test.ts`
- Test: `test/core/templates/optimizer-template.test.ts`
- Test: `test/core/templates/reviewer-template.test.ts`
- Test: `test/skills/optimizer-skill-content.test.ts`
- Test: `test/core/workflow-installation.test.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`

**Requirements**:
- 共享指引片段包含代码状态流程图、输入结构速查表与错误恢复决策树，并与实现共用同一批常量
- apply reference 记录 `review` 与 `optimize` 的调用形状、未收口恢复路径与两级计数语义
- optimizer 与 reviewer 的输入合约字段名更新为 quality 记录与失败方向
- quality 模板使用显式 delegation 指令与 checkpoint 状态表格，且不内联 subagent 角色定义
- reference 与 `SKILL.md` 长度保持在上限内

#### Checks

- [x] C1 共享片段覆盖状态机与速查表
  - Verifies: `elements/agent-prompt-guidance.md` / Requirement "共享 quality gate 指引片段" / Scenario "状态图覆盖代码状态转换"
  - Verifies: `elements/agent-prompt-guidance.md` / Requirement "共享 quality gate 指引片段" / Scenario "速查表覆盖所有 CLI 调用"
  - Command: `pnpm exec vitest run test/core/templates/fragments/xirang-fragments.test.ts`
  - Expect: 片段展示 `dirty` → Review → `clean` → Optimization → 收口路径，并覆盖 review 与 optimize 的输入形状；测试通过

- [x] C2 apply reference 使用新流程
  - Verifies: `elements/apply-quality-integration.md` / Requirement "优化循环以轮为单位" / Scenario "方向驱动的优化循环"
  - Command: `pnpm exec vitest run test/core/templates/apply-change.test.ts`
  - Expect: reference 包含 `xirang quality review` 与 `xirang quality optimize` 调用、方向 ID 与两级计数说明；测试通过

- [x] C3 未收口恢复路径与错误恢复指引
  - Verifies: `elements/agent-prompt-guidance.md` / Requirement "Archive 模板未收口恢复路径" / Scenario "尚未收口且存在可优化方向"
  - Verifies: `elements/agent-prompt-guidance.md` / Requirement "Quality 模板 CLI 错误恢复指南" / Scenario "入口条件不满足时按 allowedNextOperations 恢复"
  - Command: `pnpm exec vitest run test/core/templates/archive-change.test.ts`
  - Expect: 未收口时给出收口指引而非仅 STOP；错误恢复要求读取 `code` 与 `allowedNextOperations`；测试通过

- [x] C4 模板委派与 checkpoint 表格
  - Verifies: `elements/workflow-templates.md` / Requirement "Quality template 对 subagent 使用明确 delegation 指令" / Scenario "Optimizer subagent step 具有明确 delegation 指令"
  - Verifies: `elements/workflow-templates.md` / Requirement "checkpoint state machine 使用表格格式" / Scenario "Checkpoint state 以表格展示"
  - Verifies: `elements/quality-execution-model.md` / Requirement "Archive 重跑复用同一执行模型骨架" / Scenario "archive 复用 subagent 骨架"
  - Command: `pnpm exec vitest run test/core/templates/fragments/xirang-fragments.test.ts test/core/templates/archive-change.test.ts`
  - Expect: 委派步骤指定 clean-context subagent 且给出具名字段；checkpoint 状态出现在表格中；archive rerun 复用同一骨架；测试通过

- [x] C5 reference 与 skill 长度不超限
  - Verifies: `elements/skill-template-length.md` / Requirement "测试验证所有生成 skill 文件行数限制" / Scenario "所有模板均未超标"
  - Command: `pnpm exec vitest run test/skills/skill-template-length-validation.test.ts`
  - Expect: 所有 `SKILL.md` ≤ 200 行、所有 reference ≤ 500 行；测试通过

### Task 5: 退役 verify 命令面与旧记录文件

**Goal**: 移除 verify 命令族与旧模块、旧记录文件与旧状态值，并让 active surface 与文档不再引用退役 token。

**Files**:
- Delete: `src/core/verify/`
- Delete: `.xirang/references/xirang-apply-step-3-phase1-verification.md`
- Delete: `.xirang/references/xirang-apply-step-4-phase2-optimization.md`
- Delete: `.xirang/references/xirang-apply-step-5-phase3-seal.md`
- Modify: `src/cli/index.ts`
- Modify: `src/core/completions/types.ts`
- Modify: `src/core/templates/sync-engine.ts`
- Modify: `test/core/templates/sync-engine.test.ts`
- Modify: `docs/cli.md`
- Modify: `docs/getting-started.md`
- Modify: `docs/xirang.md`
- Modify: `test/core/templates/skill-templates-parity.test.ts`
- Modify: `.xirang/references/`
- Modify: `.pi/skills/`
- Modify: `.pi/agents/`
- Test: `test/core/templates/fragments/xirang-fragments.test.ts`

**Requirements**:
- `xirang verify` 命令族与其模块不再存在，且不提供别名
- 旧记录文件与旧状态值不再被任何门禁或指令读取
- active 文档、help 与生成面示例与当前 CLI 保持一致
- 生成内容哈希随之更新

#### Checks

- [x] C1 旧输入状态与旧记录字段退出
  - Verifies: `elements/optimization-execution.md` / REMOVED Requirement "NO_OPTIMIZATION_NEEDED 的 CLI 校验"
  - Command: `rg -n "NO_OPTIMIZATION_NEEDED|affectedFileHashes" src docs`
  - Expect: 无匹配

- [x] C2 旧归档路由退出
  - Verifies: `elements/change-archive.md` / REMOVED Requirement "Archive verify freshness routing"
  - Command: `rg -n "Archive verify freshness routing|verify freshness" src docs`
  - Expect: 无匹配

- [x] C3 旧命令族的错误恢复指引退出
  - Verifies: `elements/agent-prompt-guidance.md` / REMOVED Requirement "Verify 模板 CLI 错误恢复指南"
  - Command: `rg -n "verify phase1|verify phase2|--type=" src docs && node bin/xirang.js verify --help`
  - Expect: 源码与文档无旧命令调用片段；CLI 对 `verify` 报未知命令
  - Evidence: 命令输出与 `test/core/workflow-surface.test.ts` 的运行记录

- [x] C4 文档与 help 一致
  - Verifies: `elements/command-reference-consistency.md` / Requirement "Active command references match the current CLI surface" / Scenario "Quality command references"
  - Command: `pnpm exec vitest run test/core/templates/fragments/xirang-fragments.test.ts`
  - Expect: active 文档与生成面示例使用 `xirang quality review|optimize|status|seal`，不出现相位编号；测试通过

- [x] C5 生成内容哈希与产物核对
  - Verifies: `elements/workflow-templates.md` / REMOVED Requirement "Verify template 对 subagent 使用明确 delegation 指令"
  - Command: `pnpm exec vitest run test/core/templates/skill-templates-parity.test.ts && xirang update --force`
  - Expect: 钉住的哈希已更新；重新生成的 `.xirang/references/` 与各 agent skill 目录中不再出现退役 token
  - Evidence: 测试输出与生成产物抽查结果

## Required Corrections

- [x] [artifact_fix] C3：`src/core/change-sync.ts` 属行为代码改动但未在 Task 3 Files 归属
  - Verifies: `elements/change-sync.md` / Requirement "sync 完成后刷新 evidence fingerprint" / Scenario "evidence 中有 sync 输出文件时刷新"
  - Command: `pnpm exec vitest run test/commands/sync.test.ts`
  - Expect: Task 3 Files 已声明 `Modify: src/core/change-sync.ts`；evidence refresh 用例通过

- [x] [artifact_fix] C4：`src/commands/workflow/shared.ts` 的 state 联合类型改动未在 Task 3 Files 归属
  - Verifies: `elements/quality-aware-instructions.md` / Requirement "Apply 指令依据 quality 状态判定 state" / Scenario "全部 tasks 完成但尚无 Review 记录"
  - Command: `pnpm exec vitest run test/commands/artifact-workflow.test.ts`
  - Expect: Task 3 Files 已声明 `Modify: src/commands/workflow/shared.ts`；`needs_review` 状态用例通过

- [x] [code_fix] C4：`quality-orchestration` 的 coordinator 角色声明、阶段 mode label 与 subagent 超时/等待规则无实现承载
  - Verifies: `elements/quality-orchestration.md` / Requirement "Coordinator 角色声明" / Scenario "Agent 理解自身是 coordinator"
  - Verifies: `elements/quality-orchestration.md` / Requirement "阶段模式标签" / Scenario "主要阶段切换带有 mode label"
  - Verifies: `elements/quality-orchestration.md` / Requirement "Subagent 超时和等待规则" / Scenario "Subagent 未及时返回"
  - Command: `pnpm exec vitest run test/core/templates/apply-change.test.ts`
  - Expect: apply 模板含 `## Quality Coordinator` 小节、`[Mode: Delegate Review]` / `[Mode: Checkpoint]` 标签与 waiting rules，并有测试断言

- [x] [code_fix] C1：收口时无法提交 reviewer 结论，`summary` 字段无落点
  - Verifies: `elements/agent-prompt-guidance.md` / Requirement "简单变更快速路径识别" / Scenario "optimizer subagent 返回无优化方向"
  - Verifies: `elements/quality-cli-gate.md` / Requirement "Optimization 记录入口" / Scenario "满足入口条件并记录一轮"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: `optimize` 接受并持久化 `summary`，收口缺省时以 exit 2 诊断拒绝；用例通过

- [x] [code_fix] C5：apply/archive reference 的协议表格与 `protocol.ts` 各自维护，且存在死导出
  - Verifies: `elements/quality-cli-gate.md` / Requirement "协议说明的单一来源与投影" / Scenario "help 与 reference 具有同一来源"
  - Command: `pnpm exec vitest run test/core/quality/protocol.test.ts`
  - Expect: 四个 reference 片段由 `protocol.ts` 渲染函数产出，死导出已删除，同源用例通过

- [x] [code_fix] C2：`directionRetries` 自动 reject 分支无测试覆盖
  - Verifies: `elements/optimizer-findings.md` / Requirement "方向状态集合" / Scenario "失败达上限转为 rejected"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: 失败上限用例断言方向转为 `rejected`、计数与理由落盘，且该方向不可再被选中

- [x] [code_fix] 自查缺陷：reviewer 规范 payload（`writeBackPlan`、结构化 `summary`）会被 `review` 输入以 exit 2 拒绝
  - Verifies: `elements/quality-cli-gate.md` / Requirement "Review 记录入口" / Scenario "入口条件通过并记录结论"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: `review` 接受 reviewer 完整 payload 并保留 `gitDiffSummary`；用例通过

- [x] [code_fix] WARNING：`status` 输出缺少命令模板与 seal 适用条件
  - Verifies: `elements/quality-cli-gate.md` / Requirement "Status 输出语义" / Scenario "存在未检测的代码变更"
  - Verifies: `elements/quality-cli-gate.md` / Requirement "Status 输出语义" / Scenario "已通过 Review 但尚未收口"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: `nextCommands` 在 dirty 状态给出 review 命令模板，在 clean 未收口时给出 optimize 命令与 seal 适用条件

- [x] [code_fix] WARNING：相位命名的 reference 文件在下游工作区不会被清理
  - Verifies: `elements/command-reference-consistency.md` / Requirement "Active command references match the current CLI surface" / Scenario "Quality command references"
  - Command: `pnpm exec vitest run test/core/templates/sync-engine.test.ts`
  - Expect: 三个退役 reference 文件名加入 `STALE_SHARED_REFERENCE_FILES`，同步时被删除且用户文件保留

- [x] [code_fix] WARNING：残留 verify 术语（源码注释、`--no-verify` 与 gate 文案）
  - Verifies: `elements/command-reference-consistency.md` / Requirement "Active command references match the current CLI surface" / Scenario "Quality command references"
  - Command: `rg -n "verify gate|verify Phase|verify subcommands" src docs`
  - Expect: 无匹配，术语统一为 quality

- [x] [artifact_fix] SUGGESTION：Task Files 声明与实际改动不一致
  - Verifies: `elements/task-decomposition.md` / Requirement "Apply Phase 0 SHALL 依据 task-level TDD 处理 pending task" / Scenario "Apply 处理独立 task-level TDD loop"
  - Command: `xirang validate --change refactor-quality-protocol --json`
  - Expect: 未改动文件已从 Files 移除（`src/core/update.ts`、`test/core/completions/positional-types.test.ts`、`test/skills/skill-template-length-validation.test.ts`），`.xirang/config.yaml`、`src/core/change-sync.ts`、`src/commands/workflow/shared.ts` 与生成面目录已补记；任务结构校验通过

- [x] [code_fix] R2-C1：记录的 FAIL 结论以 exit 1 + `ok:true` 返回，与"入口条件通过并记录结论 → exit 0"及统一输出形状冲突
  - Verifies: `elements/quality-cli-gate.md` / Requirement "Review 记录入口" / Scenario "入口条件通过并记录结论"
  - Verifies: `elements/quality-cli-gate.md` / Requirement "统一输出与诊断结构" / Scenario "入口条件不满足时给出后续操作"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: 结论被接受即 exit 0，payload 以 `state: dirty` 表达失败结论；新增 FAIL 路径用例

- [x] [code_fix] R2-C2：失败回滚只恢复 `.quality-state.json` + `.apply-isolation.json`，恢复后的快照缺少日志行，导致状态持续 dirty 且后续 review 丢失方向台账
  - Verifies: `elements/quality-freshness.md` / Requirement "记录匹配与状态判定" / Scenario "失败回滚后回到 clean"
  - Verifies: `elements/quality-writeback.md` / Requirement "append-only 历史日志" / Scenario "失败方向可从日志恢复"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: 回滚协议同时快照/恢复 `.quality-log.jsonl`；log 不一致的 dirty 路径仍带出快照记录，恢复/review 后台账不丢失；两个回滚集成用例通过

- [x] [code_fix] R2-C3：失败轮次无法上报（`selected→pending` 复位早于 attempt 处理，`selected→implemented` 分支不可达，回滚后 attempt 被 exit 2 拒绝）
  - Verifies: `elements/optimization-execution.md` / Requirement "重试预算控制" / Scenario "失败方向达到上限"
  - Verifies: `elements/optimization-execution.md` / Requirement "优化结果持久化" / Scenario "记录失败方向与方向事件"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: attempt 先于复位处理并接受 in-flight `selected`；失败轮次上报后方向转为 `failed` 且计数递增

- [x] [code_fix] R2-C4：方向更新接受任意状态，可制造两个 `selected` 或伪造 `failed`/`implemented`
  - Verifies: `elements/optimizer-findings.md` / Requirement "方向状态集合" / Scenario "主动撤销必须带理由与证据"
  - Verifies: `elements/optimizer-findings.md` / Requirement "Finding 优先级与选择" / Scenario "拒绝跳过排序首项"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: optimizer 只能提交 `rejected | deferred` 撤销；其余状态以 exit 2 诊断拒绝，且每轮最多一个 `selected`

- [x] [code_fix] R2-WARNING：文档与生成面的收口示例缺少 `summary`，照抄会 exit 2；optimizer 输出合约未产出该字段
  - Verifies: `elements/quality-cli-gate.md` / Requirement "协议说明的单一来源与投影" / Scenario "help 与 reference 具有同一来源"
  - Verifies: `elements/agent-prompt-guidance.md` / Requirement "简单变更快速路径识别" / Scenario "optimizer subagent 返回无优化方向"
  - Command: `pnpm exec vitest run test/core/quality/protocol.test.ts test/core/templates/fragments/xirang-fragments.test.ts test/core/templates/optimizer-template.test.ts`
  - Expect: docs/reference/help 中每个收口示例都带 `summary`；optimizer 输出合约含顶层 `summary` 并有断言

- [x] [artifact_fix] R2-SUGGESTION：`sync-engine.ts` 行为改动未在 Task Files 归属；`test/core/list.test.ts` 仍过滤退役文件名；`config-schema.test.ts` 缩进错位
  - Verifies: `elements/task-decomposition.md` / Requirement "Apply Phase 0 SHALL 依据 task-level TDD 处理 pending task" / Scenario "Apply 处理独立 task-level TDD loop"
  - Command: `xirang validate --change refactor-quality-protocol --json`
  - Expect: Task 5 Files 已声明 `src/core/templates/sync-engine.ts` 与其测试；list 测试改用 quality 记录常量；缩进修正；任务结构校验通过

- [x] [code_fix] R3-C1：`optimization` 记录缺少 `directions`/`histories` 时 `review`/`optimize` 抛未捕获 TypeError（违反"旧记录按空集合读取"），并绕过统一诊断
  - Verifies: `elements/optimization-execution.md` / Requirement "优化结果持久化" / Scenario "旧记录按空集合读取"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts test/core/quality/state.test.ts`
  - Expect: 记录读取时把缺失的 `directions`/`histories`/`directionsUsed` 归一为空集合；state 单测与 CLI 回归用例（旧记录下 review + optimize 均正常）通过

- [x] [code_fix] R3-WARNING：三处 finalize 诊断文本缺少 `summary`，照做会被同一校验器以 exit 2 拒绝
  - Verifies: `elements/quality-cli-gate.md` / Requirement "统一输出与诊断结构" / Scenario "入口条件不满足时给出后续操作"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts`
  - Expect: `OPTIMIZATION_DISABLED`、`SEAL_NOT_READY`、`DIRECTION_LIMIT_REACHED` 的 fix 文本含 `summary`，并有用例断言

- [x] [code_fix] R3-WARNING：`failed → pending` / `deferred → pending` 迁移不可达，`directionRetries > 1` 永远无法被同一方向消耗
  - Verifies: `elements/optimization-execution.md` / Requirement "重试预算控制" / Scenario "失败方向达到上限"
  - Verifies: `elements/optimizer-findings.md` / Requirement "方向状态集合" / Scenario "失败达上限转为 rejected"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts test/core/quality/validators.test.ts`
  - Expect: 未达额度的 `failed` 方向在下一轮由 CLI 重开为 `pending`（同方向可再次失败并消耗额度）；`deferred` 保持停用直到被撤销，死迁移已移除

- [x] [artifact_fix] R3-WARNING：delta 中 `workflow-templates` 仍引用退役常量名 `VERIFY_STATE_MACHINE_DIAGRAM`
  - Verifies: `elements/workflow-templates.md` / Requirement "checkpoint state machine 使用表格格式" / Scenario "Checkpoint state 以表格展示"
  - Command: `rg -n "VERIFY_STATE_MACHINE_DIAGRAM" .xirang/changes/refactor-quality-protocol`
  - Expect: 改名为 `QUALITY_STATE_MACHINE_DIAGRAM`，无匹配

- [x] [code_fix] R3-WARNING：`review` 接受空 `evidenceFiles`，空指纹使状态恒为 `clean`（fail-open）
  - Verifies: `elements/quality-cli-gate.md` / Requirement "Review 记录入口" / Scenario "输入结构非法"
  - Verifies: `elements/quality-freshness.md` / Requirement "记录匹配与状态判定" / Scenario "指纹不一致时为 dirty"
  - Command: `pnpm exec vitest run test/commands/quality.test.ts test/core/quality/state.test.ts`
  - Expect: Review 输入拒绝空 `evidenceFiles`（exit 2）；无指纹条目的记录一律判 `dirty`

- [x] [code_fix] R3-SUGGESTION：`phase2BaselineCommit` 保留相位词汇
  - Verifies: `elements/optimization-execution.md` / Requirement "Checkpoint 与回滚" / Scenario "创建 baseline checkpoint"
  - Command: `rg -n "phase2BaselineCommit" src docs .xirang/references`
  - Expect: 改名 `optimizationBaselineCommit`（delta、模板、投影、design 迁移说明同步），无匹配

- [x] [code_fix] R4-C3：新增的"诊断不含标记"守卫无效——`id: 'OPT-handmade'` 会被 `isDirectionId` 接受，`directions[0].id` 诊断从未产生，重新引入 `role="echoed"` 也能通过
  - Verifies: `elements/quality-cli-gate.md` / Requirement "统一输出与诊断结构" / Scenario "字段非法时给出可操作诊断"
  - Command: `pnpm exec vitest run test/core/quality/validators.test.ts`
  - Expect: 守卫改用会被 `isDirectionId` 拒绝的 id，断言 `directions[0].id` 诊断存在且 fix/expected 不含 `role=`；把旧文案临时改回时该用例必须失败

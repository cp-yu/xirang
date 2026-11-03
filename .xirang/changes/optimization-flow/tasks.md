### Task 1: 打通委托式优化、真实证据与统一收尾

**Goal**: 将现有方向循环完整替换为可写 Opt 委托与交付，并同时完成 CLI、配置、提示投影、恢复、Apply/Sync/Archive 门禁和对应验证。该机制共享一个破坏性记录协议，拆成组件任务会使前项测试依赖后项，因此作为一个端到端 GREEN 闭环；不依赖 Task 2 的实现。

**Files**:
- Modify: `src/commands/quality.ts`
- Modify: `src/core/quality/types.ts`
- Modify: `src/core/quality/validators.ts`
- Modify: `src/core/quality/state.ts`
- Modify: `src/core/quality/log.ts`
- Modify: `src/core/quality/protocol.ts`
- Modify: `src/core/quality/diagnostics.ts`
- Modify: `src/core/config-schema.ts`
- Modify: `src/core/config-prompts.ts`
- Modify: `src/core/global-config.ts`
- Modify: `src/core/project-config.ts`
- Modify: `src/core/config-projection.ts`
- Modify: `src/commands/workflow/instructions.ts`
- Modify: `src/commands/sync.ts`
- Modify: `src/core/change-sync.ts`
- Modify: `src/core/archive.ts`
- Modify: `src/core/templates/workflows/optimizer.ts`
- Modify: `src/core/templates/workflows/reviewer.ts`
- Modify: `src/core/templates/workflows/apply-change.ts`
- Modify: `src/core/templates/workflows/archive-change.ts`
- Modify: `src/core/templates/workflows/quality-execution-model.ts`
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Modify: `src/core/shared/subagent-generation.ts`
- Modify: `src/core/shared/skill-generation.ts`
- Modify: `src/core/templates/sync-engine.ts`
- Modify: `.pi/agents/`
- Modify: `.pi/skills/`
- Modify: `.xirang/references/`
- Test: `test/commands/quality.test.ts`
- Test: `test/core/quality/state.test.ts`
- Test: `test/core/quality/validators.test.ts`
- Test: `test/core/quality/log.test.ts`
- Test: `test/core/quality/protocol.test.ts`
- Test: `test/core/config-schema.test.ts`
- Test: `test/core/project-config.test.ts`
- Test: `test/core/global-config.test.ts`
- Test: `test/commands/config.test.ts`
- Test: `test/commands/artifact-workflow.test.ts`
- Test: `test/core/shared/subagent-generation.test.ts`
- Test: `test/core/shared/skill-generation.test.ts`
- Test: `test/core/templates/sync-engine.test.ts`
- Test: `test/core/templates/optimizer-template.test.ts`
- Test: `test/core/templates/reviewer-template.test.ts`
- Test: `test/core/templates/apply-change.test.ts`
- Test: `test/core/templates/archive-change.test.ts`
- Test: `test/skills/optimizer-skill-content.test.ts`
- Test: `test/skills/reviewer-skill-content.test.ts`
- Test: `test/skills/reviewer-summary-schema.test.ts`
- Test: `test/skills/reviewer-cleanliness-dimension.test.ts`
- Test: `test/skills/archive-skill-content.test.ts`
- Test: `test/core/archive.test.ts`
- Test: `test/core/change-sync.partitions.test.ts`
- Test: `test/commands/sync.test.ts`
- Test: `test/integration/archive-workflow.test.ts`
- Test: `test/integration/sync-workflow.test.ts`

**Sections**:
- 依据 `quality-cli-gate`、`quality-writeback`、`quality-freshness` 实现 design 中 review/delegation/verification/conclusion/checkpoint/status/seal 接口；删除旧方向 API、队列、等级、计数和兼容归一化，所有消费者同期切换。先修改对应行为 owner 测试获得真实 RED，再实现并跑 GREEN；不以旧措辞测试失败代替行为 RED。
- 依据 `optimization`、`optimizer-protocol`、`optimization-execution`、`optimizer-findings`、`checkpoint` 实现委托执行、局部测试、时点保存、同委托恢复、问题分流及主 Agent 最终判断；普通 Apply、Experimenter 和独立 Reviewer 边界保持。
- 依据 `project-config-loading`、`global-config`、`project-config-management` 同步 schema、defaults、load/set/projection 与退役诊断；依据 `quality-aware-instructions`、`apply-quality-integration`、`archive-quality-gate`、`change-sync` 同步完成判定及恢复路由，保留原显式绕过授权和语义编译规则。
- 所有 model-context skill/reference/instruction 修改及修订由 `shuaiapi-gpt/gpt-6-astra` 获得完整确认来源、目标 Delta、设计接口、当前模板和完整候选后撰写。使用真实实现接口替换候选占位；原生权限与协议投影共同生成，退役 refs 按显式受管名单清理，生成源、生成面和验证均在本任务完成。
- 使用 `bigmodel/glm-5.3-flash` 测试实际受管制品，最多 8 个并发场景执行者，隔离工作区并保留真实工具/文件/测试/持久化/决策轨迹，允许多轮纠正；后续 Opt 与独立 Review 使用 `llmgw/gpt-6.1-sol`。缺测试先补后改的 Opt 规则不被普通 Apply 的 interface-first 或计数规则覆盖。该路由约束仅为本次执行安排，不进入永久模板。

#### Checks

- [ ] C1 验证委托及报告的关联、版本和持久化边界
  - Verifies: `elements/quality-writeback.md` / Section "必要持久化边界"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/quality.test.ts test/core/quality/log.test.ts test/core/quality/validators.test.ts`
  - Evidence: 由既有 CLI 临时 Git fixture 建立实际基线 Review 和恢复 commit；start、save(progress)、放弃时 save、暂停、恢复同 ID、delivered 操作后读取快照与日志；比较每次操作前后字节及记录版本。
  - Expect: 修改前起点关联齐全；放弃时记录原因及处理结果而非仅最终报告；暂停未交付不可完成；同委托续跑不分配新 ID；旧版本提交拒绝且原快照/日志字节不变；日志写入后快照失败时不能完成，历史不丢失。合法短报告和共享证据可接受，不要求逐方向表单或 CLI 自然语言评分。

- [ ] C2 验证真实测试状态、失败结果及新建删除文件新鲜度
  - Verifies: `elements/quality-freshness.md` / Section "记录匹配与状态判定"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/quality.test.ts test/core/quality/state.test.ts`
  - Evidence: CLI 实际执行 fixture 测试命令；在 S1 通过后改为 S2 再保存报告；另测非零退出、运行中改文件、测试后新增代码文件、删除已有文件和移动文件。增加 A 在 S1 通过、独立 B 在 S2 通过并由主 Agent 记录 A 仍适用的正例，以及 B 修改 A 的公共 helper 须补受影响验证的例子；读取原 manifest/exit code/output、单独适用判断与 status/seal 结果，不只断言命令响应。
  - Expect: 报告不把 S1 证据重绑 S2；非零与运行中变化记录保留但不满足成功验证；新增/删除/移动导致差异，即使不在旧 evidenceFiles。主 Agent 可根据实际差异和依赖明确判断未受影响的成功证据仍适用，不强制重跑 A，也不声称 A 在 S2 运行；已确认受影响或失败/缺失的验证不能豁免。质量记录自身及仅 mtime/HEAD 改变不造成代码失效；Windows 逻辑路径等价。未补齐受影响验证且没有有效适用判断时 seal 不通过。

- [ ] C3 验证基线、累计验证、必需 Review 与成功 checkpoint 门禁
  - Verifies: `elements/quality-cli-gate.md` / Section "Seal 校验"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/quality.test.ts test/core/quality/validators.test.ts test/core/quality/state.test.ts`
  - Evidence: 实际记录两次完整交付、累计测试和主 Agent plan/complete，包括未受影响成功证据的单独适用判断及依赖改变后须补验证；分别省略基线、交付、测试、必需增量 Review、基线缺陷修复 Review 或 successful checkpoint；检查每个失败前后文件保持，并用正确证据修复后再 seal。
  - Expect: 基线必须独立且先于优化；两项局部优化或多委托累计验证允许无需全量测试/增量 Review，记录理由而不制造 PASS；声明需要 Review 时缺失/失败/过期均阻塞；已确认基线缺陷修复必须有针对性独立 Review；checkpoint 只有当前所需验证通过才可成功，局部中间快照不等于完成；代码再次改变需重判。

- [ ] C4 验证 scoped Reviewer 关联及普通写回顺序
  - Verifies: `elements/reviewer-protocol.md` / Section "结构化输出合约"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/quality.test.ts test/core/quality/validators.test.ts test/core/templates/reviewer-template.test.ts`
  - Evidence: baseline/incremental/defect-repair begin/submit 真实输入通过相同解析器；在 begin 后修改代码再提交；检查 scope、起点及结束状态、CRITICAL 对 tasks 的写回和最终 tasksFileHash。
  - Expect: 针对性结论不伪装成整 Change 覆盖，审查期间代码改变保留结论但不能充当当前通过；WARNING 不修改 tasks，CRITICAL writeback 仍先于记录，普通基线输出行为保留。删除仅验证已退役优化措辞的 assertions，结构/真实门禁 assertions 保留。

- [ ] C5 验证退役配置与旧协议诊断且原文件保留
  - Verifies: `elements/quality-cli-gate.md` / Section "拒绝退役协议"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/quality.test.ts test/core/config-schema.test.ts test/core/project-config.test.ts test/core/global-config.test.ts test/commands/config.test.ts`
  - Evidence: 读取并设置三个退役 optimization 键；装入旧质量格式、旧 optimize 命令输入和已有归档/代码/commits。操作前后比较配置、记录和历史文件字节及 Git refs；检查 setup/update defaults 和 normalized projection。
  - Expect: 有明确字段/版本/命令诊断；有效/default/projected optimization 仅含 enabled，默认 true；其余有效配置保留；旧输入不被静默转为新完成，不建立兼容路径，不自动迁移/删除历史或改写用户配置。disabled/用户拒绝可明确跳过，但不免除基线和适用验证。

- [ ] C6 验证统一 instructions、Sync 和 Archive 完成判定
  - Verifies: `elements/archive-quality-gate.md` / Section "归档前必须具备新鲜的完整验证记录"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/artifact-workflow.test.ts test/core/archive.test.ts test/commands/sync.test.ts test/integration/archive-workflow.test.ts test/integration/sync-workflow.test.ts`
  - Evidence: 让同一真实新协议 fixture 经 status、instructions apply、seal、Sync、Archive；对缺基线、未交付、失败/过期 required test、缺陷修复 Review 缺失、可靠恢复未确认等比较响应与目录原状；完整状态实际归档后比对历史字节。
  - Expect: 缺基线 needs_review；已有基线的优化进度或验证缺口 needs_optimize；只有完整当前结果 all_done；不因优化代码不同于基线强制整 Change Review。正常 Sync/Archive 拒绝缺口并不移动目录；通过后保留历史，HEAD-only 不重审，原显式授权绕过与语义编译门禁保持。

- [ ] C7 验证 Sync 转换关联不改写执行时证据
  - Verifies: `elements/change-sync.md` / Section "sync 完成后刷新 evidence fingerprint"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/change-sync.partitions.test.ts test/core/quality/state.test.ts test/commands/sync.test.ts`
  - Evidence: 保存 Sync 前测试/Review manifest 和输出；执行真实模型 Sync 后读取关联与原记录；再外部修改同一模型路径或新增/删除实现文件；模拟关联写入失败。
  - Expect: 原执行时 manifest 与结果不变，仅实际 Sync 输出有确定性转换关联；正常紧接 Archive 能消费有效关联，外部修改不能被该关联掩盖；关联失败如实报告已完成模型同步但质量证据不完整，不伪称测试在新状态运行。Windows/POSIX 同一路径关联一致。

- [ ] C8 验证原生权限、受管投影与协议示例可执行
  - Verifies: `elements/internal-subagent-generation.md` / Section "按角色编码工具原生权限"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/shared/subagent-generation.test.ts test/core/shared/skill-generation.test.ts test/core/templates/sync-engine.test.ts test/core/quality/protocol.test.ts`
  - Evidence: 解析四工具实际生成权限；临时 setup/update 生成新 references、保护用户同名非受管文件并保留自定义 model；从同一协议导出的最小合法示例实际送入校验器/CLI fixture。
  - Expect: Opt 有真实 Write/Edit 或 workspace-write，Reviewer 仍 read-only，Experimenter 不变；共享 refs 可达，退休 refs 经显式名单清理，用户文件不覆盖；help/reference 与实际接口一致，无固定方向协议再次附加。测试不依赖说明性 prose 或标题顺序。

- [ ] C9 验证模型执行合并优化与最终风险判断
  - Verifies: `elements/optimization.md` / Section "无需继续优化时完成"
  - Test action: one-time
  - Evidence: 用实际生成制品及 bigmodel/glm-5.3-flash 在隔离 fixture 运行两项局部优化合并、已有测试与缺对应测试两种输入；记录主 Agent 与 Opt 的读写/测试/保存/决定顺序，运行路由及全部输出。最多 8 并发，必要修订由指定撰写模型完成后复测。
  - Expect: 缺测试先补再改实现，原行为保护测试可先通过而不伪造 RED；一次委托可处理多项并共享证据；主 Agent 读取累计证据后可记录无需全量测试/增量 Review 并通过完成门禁，不伪造 Reviewer PASS；另一 fixture 主 Agent 要求增量 Review 时，失败后修复重验且独立 Review 通过前不完成。

- [ ] C10 验证中断、局部恢复、放弃与组合故障
  - Verifies: `elements/optimization-execution.md` / Section "核对现场继续原委托"
  - Test action: one-time
  - Evidence: 实际工具场景包括记录 A 完成而磁盘 B 半成品及未跟踪测试、A/B 单独通过但组合失败、B 多次尝试无进展、恢复归属不明。记录旧写入者停止、磁盘检查、局部编辑/撤销、测试与每次 save，比较 A 和历史文件前后内容。
  - Expect: 同委托续跑且不假定最终报告存在；检查 B 后选择处理，不自动丢弃 A/B；方法可自选，不强制二分/整批回滚；放弃当时保存原因和处理、最终告知，保留可靠 A；不能确认局部恢复则回可确认基线，仍不可靠时停止，不形成最终成功。

- [ ] C11 验证基线缺陷与无关问题分流
  - Verifies: `elements/optimization-execution.md` / Section "失败尝试与正确性缺陷分流"
  - Test action: one-time
  - Evidence: 分别提供可复现且证明早于优化的当前 Change 缺陷、无关历史问题、需要改变目标契约的机会；观察 Opt 交证据、主 Agent 决定修复方式、实现与测试、独立 Reviewer 针对问题及影响的实际轨迹。
  - Expect: 真实基线缺陷不被“放弃优化”掩盖或带入完成，修复后有针对性独立 Review；可修问题不永久锁死。无关问题记录告知而不顺手修改，契约冲突回主 Agent 并在需用户决策时保留待决，不擅改规范。

- [ ] C12 验证实际影响范围与按需后续探索
  - Verifies: `elements/optimization.md` / Section "按实际影响确定文件范围"
  - Test action: one-time
  - Evidence: 当前 Change 查询需经两层依赖修改公共 helper，并存在另一套无关查询系统；另设一次交付后仍有机会与收益已小两种场景。观察模型读取调用方、必要新建/删除/移动文件、局部测试、交付、主 Agent 新委托或停止决定及后轮读取失败历史。
  - Expect: 不受固定文件名单/一层限制，公共 helper 检查其他调用方，无关系统不修改；Reviewer 不仅因原 tasks 未列路径而 CRITICAL。主 Agent 可不先提供具体新方向就启动 fresh Opt，也可直接收尾，不固定每轮重启、轮数或穷尽证明；新探索建立新委托，接手恢复仍是原委托。

- [ ] C13 验证必要保存时点、模型责任与生成面实际动作
  - Verifies: `elements/optimizer.md` / Section "保存进展并可靠恢复"
  - Test action: one-time
  - Evidence: 以实际受管 Opt、Apply、Reviewer、Archive 制品串行执行开始、长任务中间保存、放弃、主动暂停、接手、交付和主 Agent conclusion/checkpoint；保留工具调用和磁盘状态。独立核对 baseline Review、Opt 实施和 main conclusion 三类来源，确认测试模型实际执行而非只给建议文本。
  - Expect: start 先于首次写入，abandon 当时保存，pause/handoff 有真实进展和测试，完成有主 Agent 结论；中间按需不逐动作/方向 commit；权限实际允许 Opt 编辑而 Reviewer 不可编辑；阶段责任明确，普通 Apply counters 不约束 Opt，无无进展循环。

- [ ] C14 清理被替代的方向协议和措辞锁定测试
  - Verifies: `elements/optimizer-findings.md` / REMOVED Section "Finding 优先级与选择"
  - Test action: one-time
  - Command: `rg -n 'selectEligibleDirection|allocateDirectionIds|normalizeLedger|OptimizationLedger|direction-first|strict JSON round ledger' src/core/quality src/commands/quality.ts src/core/templates/workflows test/core/quality test/commands/quality.test.ts`
  - Evidence: 按实际旧符号定义和引用补充交叉检查，逐项检查 source、import、help 和生成 references；运行相关剩余测试。退役键只能存在明确诊断与拒绝输入 fixture 中，不得有有效默认值、排序或计数执行路径。
  - Expect: 旧方向选择/调度/计数符号和活跃指引无残留；删除或改写现有只读 Opt、强制 per-direction Review/commit、旧轮换/等级行为测试，不新增长期 prose-lock 套件；自然语言场景用一次性行动证据承担。

### Task 2: 完成跨平台验证与交付证据核查

**Goal**: 在 Task 1 已经实现并通过其全部 Checks 后，用现有平台工作流和项目检查确认交付可运行；本任务不补充前项 GREEN 所需生产实现。

**Files**:
- Test: `.github/workflows/test-windows.yml`
- Test: `.github/workflows/xirang-v2-cross-platform.yml`
- Test: `test/commands/quality.test.ts`
- Test: `test/core/quality/state.test.ts`
- Test: `test/core/shared/subagent-generation.test.ts`
- Test: `test/core/templates/sync-engine.test.ts`
- Test: `test/skills/skill-template-length-validation.test.ts`

**Sections**:
- 依赖 Task 1 全部 GREEN；执行已有 build/typecheck 和本次受影响测试，不将本任务的检查作为 Task 1 遗漏实现的占位。
- 按 `quality-writeback`、`quality-freshness`、`internal-subagent-generation` 的路径语义，用已有平台 fixture 核查带空格路径、反斜杠规范化、非零测试、追加历史和生成权限；可用时复用现有 Windows CI，不将未执行的原生平台检查写成通过。
- 汇集真实代码/命令/模型运行轨迹，区分独立 Review、Opt 自测和主 Agent 决定，不将未执行的远程 CI 或模型场景写为通过；若失败回 Task 1 修正并重跑受影响 Checks。

#### Checks

- [ ] C15 完成跨平台路径与当前平台行为验证
  - Verifies: `elements/quality-freshness.md` / Section "evidenceFingerprint 计算"
  - Test action: one-time
  - Command: `pnpm exec vitest run test/commands/quality.test.ts test/core/quality/state.test.ts test/core/quality/log.test.ts test/core/shared/subagent-generation.test.ts test/core/templates/sync-engine.test.ts`
  - Evidence: 当前平台命令结果及已有平台路径 fixture；包括空格目录、反斜杠规范化、文件新增/删除、记录保留和实际测试状态捕获。若已有 Windows CI 可用，另附真实运行结果，不将 Linux 路径单测等同原生 Windows 运行。
  - Expect: 当前平台行为测试和平台路径 fixture 通过；如实披露未运行的原生平台与剩余风险，不要求为本次本地交付额外发布或推送来取得远程 CI。

- [ ] C16 核查构建、生成约束和最终行动证据
  - Verifies: `elements/apply-quality-integration.md` / Section "恢复交付的验证证据"
  - Test action: one-time
  - Command: `pnpm build && pnpm exec tsc --noEmit && pnpm exec vitest run test/skills/skill-template-length-validation.test.ts`
  - Evidence: build/typecheck/生成长度结果，以及 Task 1 场景的真实 tools/files/tests/persistence/decision-gates 轨迹、指定模型运行元数据和最多 8 并发记录；核查实际输入输出、生成版本与当前代码一致，保留失败和修正后的复验。
  - Expect: 构建与类型检查通过，受管 skill/reference 满足已有长度约束；每个行为结论有真实动作与状态证据，不以最终回答、字面措辞断言或完成声明替代。未执行测试或尚缺独立验证如实列为未完成。

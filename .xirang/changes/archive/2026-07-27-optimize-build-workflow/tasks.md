### Task 1: 对齐正式定义与 Semantic Delta

**Goal**: 将 Element Contract、Requirement、Scenario、Realization 双维度和 `responsible-for` 的已确认语义落实到 Definition 与可验证的 Expected Semantic Model。

**Files**:
- Create: `opt-build.md`
- Modify: `xirang-definition.md`
- Test: `test/core/model/kernel-e2e.test.ts`
- Test: `test/core/validation.cross-check.test.ts`

**Requirements**:
- 保留用户逐项确认的 Build 优化决策作为项目级设计证据，不使其成为规范语义来源
- 保持 Element Contract 在自身抽象层级完整且允许 children 精化
- 将 Requirement 建模为可独立演进的 Contract 条目
- 将 Scenario 建模为从属于 Requirement 的非穷尽规范组成
- 显式表达 Realization 双维度及八条 `responsible-for` 关系

#### Checks

- [x] C1 验证 Requirement 语义进入 Expected Model
  - Verifies: `elements/requirement.md` / Requirement "表达可独立演进的规范承诺" / Scenario "规范承诺可以独立变化"
  - Command: `node bin/xirang.js arch validate --change "optimize-build-workflow" --json`
  - Expect: Expected Semantic Model 包含有效 Requirement Element 且无 validation errors

- [x] C2 验证 Scenario 从属语义
  - Verifies: `elements/scenario.md` / Requirement "从属于 Requirement 差量" / Scenario "新增一个 Scenario"
  - Command: `pnpm test -- test/core/model/kernel-e2e.test.ts test/core/validation.cross-check.test.ts`
  - Expect: Scenario 变化由宿主 Requirement 的完整目标内容表达

- [x] C3 验证跨层 Contract 完整性
  - Verifies: `elements/element-contract.md` / Requirement "允许 Children 精化与共同实现" / Scenario "模块由多个组件共同实现"
  - Command: `node bin/xirang.js arch validate --change "optimize-build-workflow" --json`
  - Expect: 父子 Elements 可在各自抽象层级表达相互覆盖的完整规范

- [x] C4 验证职责关系
  - Verifies: `elements/realization.md` / Requirement "允许跨维度语义覆盖" / Scenario "Role 承担 Activity"
  - Command: `node bin/xirang.js diff --change "optimize-build-workflow" --json`
  - Expect: diff 包含 `responsible-for` Kind 和八条显式关系

### Task 2: 建立共享 Contract 语义投影

**Goal**: 通过单一 fragment 向 Build、Propose 与 Snack 投影一致的 Element Contract、Requirement 和 Scenario 语义。

**Files**:
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Modify: `src/core/templates/workflows/build.ts`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/snack.ts`
- Test: `test/core/templates/fragments/xirang-fragments.test.ts`
- Test: `test/core/templates/build.test.ts`
- Test: `test/core/templates/propose-template.test.ts`
- Test: `test/core/templates/snack-template.test.ts`

**Requirements**:
- 只维护一个 `ELEMENT_CONTRACT_SEMANTICS` 源码 fragment
- Build、Propose 与 Snack 消费相同 fragment
- 存储记法继续由独立 notation fragment 提供
- Reviewer 不消费该 fragment

#### Checks

- [x] C5 验证共享 fragment 投影
  - Verifies: `elements/project-tooling-configuration.md` / Requirement "投影共享 Element Contract 语义" / Scenario "刷新 Agent 工作面"
  - Command: `pnpm test -- test/core/templates/fragments/xirang-fragments.test.ts test/core/templates/build.test.ts test/core/templates/propose-template.test.ts test/core/templates/snack-template.test.ts`
  - Expect: 三个 workflow templates 包含同一共享 fragment 且没有各自维护定义副本

- [x] C6 验证 Propose 使用独立演进边界
  - Verifies: `elements/propose.md` / Requirement "遵循共享 Contract 语义" / Scenario "编写多个 Contract 义务"
  - Command: `pnpm test -- test/core/templates/propose-template.test.ts`
  - Expect: Propose instructions 按 Requirement 边界编写 Entries

- [x] C7 验证 Snack 使用独立演进边界
  - Verifies: `elements/snack.md` / Requirement "遵循共享 Contract 语义" / Scenario "已有实现影响多个规范承诺"
  - Command: `pnpm test -- test/core/templates/snack-template.test.ts`
  - Expect: Snack instructions 按 Requirement 边界调和 Entries

### Task 3: 重构 Build 编排门禁

**Goal**: 将 Build 编排为显式初始化、条件式决策、例外 provenance、BFS 编写、独立语义审查和 promotion 后检查的闭环。

**Files**:
- Modify: `src/core/templates/workflows/build.ts`
- Test: `test/core/templates/build.test.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`
- Test: `test/core/setup.test.ts`
- Test: `test/core/update.test.ts`

**Requirements**:
- baseline/init 先于 `build.md` 写入
- active Candidate 必须由用户选择继续或重建
- Modeling Decision Gate 只阻止会改变目标模型的未决选择
- Candidate 按 BFS 语义层编写并只记录例外 provenance
- deterministic validation 后强制 clean-context subagent 审查并执行 promotion 后置检查

#### Checks

- [x] C8 验证初始化顺序
  - Verifies: `elements/semantic-model-build.md` / Requirement "先初始化再记录构建依据" / Scenario "开始新的 Build"
  - Command: `pnpm test -- test/core/templates/build.test.ts`
  - Expect: Build instructions 先选择 baseline 和 init，再写 `build.md`

- [x] C9 验证 Active Candidate 门禁
  - Verifies: `elements/semantic-model-build.md` / Requirement "显式处理 Active Candidate" / Scenario "检测到 Active Candidate"
  - Command: `pnpm test -- test/core/templates/build.test.ts`
  - Expect: Build 不静默继续或替换 active Candidate

- [x] C10 验证 Modeling Decision Gate 与 provenance
  - Verifies: `elements/semantic-model-build.md` / Requirement "在编写前通过 Modeling Decision Gate" / Scenario "多个目标模型符合现有依据"
  - Command: `pnpm test -- test/core/templates/build.test.ts`
  - Expect: 未决语义按依赖顺序逐项裁决且例外记录进入 `build.md`

- [x] C11 验证 BFS Contract 编写规则
  - Verifies: `elements/semantic-model-build.md` / Requirement "按独立演进边界编写 Requirements" / Scenario "动作与结果不可分"
  - Command: `pnpm test -- test/core/templates/build.test.ts`
  - Expect: Build 禁止数值化拆分并保留不可分规范承诺

- [x] C12 验证 Clean-context Semantic Review
  - Verifies: `elements/semantic-model-build.md` / Requirement "确定性校验后执行独立语义审查" / Scenario "Candidate 结构有效"
  - Command: `pnpm test -- test/core/templates/build.test.ts`
  - Expect: Build 在展示 digest 前委托新的 read-only clean-context subagent，修改后重新校验和复审

- [x] C13 验证 Promotion 后置条件
  - Verifies: `elements/semantic-model-build.md` / Requirement "Promotion 后验证 Build 后置条件" / Scenario "Post-promotion Validation 有 Warning"
  - Command: `pnpm test -- test/core/templates/build.test.ts test/core/setup.test.ts test/core/update.test.ts`
  - Expect: Build 依次检查 Candidate inactive、四分区目录与 Formal validation，并只报告 warnings

### Task 4: 补齐 Semantic Model Validator 门禁

**Goal**: 在共享 parser/model validator 层实现名称、Scenario、Kind、View 和组织诊断，使 Candidate、Formal 与 Expected Model 获得一致结果。

**Files**:
- Modify: `src/core/model/parser.ts`
- Modify: `src/core/model/validator.ts`
- Modify: `src/core/model/index-map.ts`
- Test: `test/core/model/parser.test.ts`
- Test: `test/unit/utils/architecture-validator.test.ts`
- Test: `test/commands/candidate-validate.test.ts`
- Test: `test/integration/arch-command.test.ts`

**Requirements**:
- Requirement 与 Scenario names 在各自宿主范围唯一
- 每个 Requirement 至少包含一个 Scenario
- Element 与 Relationship 使用已声明 Kind
- Kind constraints 与 Authored Views 形成引用闭包
- 错分区按 entity 解析并产生不阻塞的 `ENTITY_PARTITION_MISMATCH` WARNING

#### Checks

- [x] C14 验证 Contract 条目名称唯一
  - Verifies: `elements/semantic-model.md` / Requirement "保持 Requirement Name 唯一" / Scenario "Contract 包含重名 Requirements"
  - Command: `pnpm test -- test/core/model/parser.test.ts test/unit/utils/architecture-validator.test.ts`
  - Expect: 重名 Requirement 与 Scenario 分别返回确定性 ERROR code

- [x] C15 验证 Requirement 必须包含 Scenario
  - Verifies: `elements/semantic-model.md` / Requirement "要求 Requirement 包含 Scenario" / Scenario "Requirement 没有 Scenario"
  - Command: `pnpm test -- test/unit/utils/architecture-validator.test.ts test/commands/candidate-validate.test.ts`
  - Expect: 空 Scenarios 返回 `MISSING_REQUIREMENT_SCENARIO`

- [x] C16 验证 Kind 引用闭包
  - Verifies: `elements/semantic-model.md` / Requirement "验证 Kind Constraint 引用" / Scenario "Constraint 引用未声明 Kind"
  - Command: `pnpm test -- test/unit/utils/architecture-validator.test.ts test/commands/candidate-validate.test.ts`
  - Expect: 未声明 Element/Relationship Kind 及 constraint Kind references 返回对应 ERROR，且不要求 parents/children 对称

- [x] C17 验证 Authored View 引用闭包
  - Verifies: `elements/semantic-model.md` / Requirement "验证 Authored View 引用" / Scenario "View 引用未声明 Element"
  - Command: `pnpm test -- test/unit/utils/architecture-validator.test.ts test/integration/arch-command.test.ts`
  - Expect: 无法解析的 `of` 和 list-form `include` 返回 `UNRESOLVED_VIEW_REFERENCE`

- [x] C18 验证错分区 Warning
  - Verifies: `elements/semantic-model.md` / Requirement "自声明实体类型" / Scenario "Element 单元位于错误分区"
  - Command: `pnpm test -- test/core/model/parser.test.ts test/commands/candidate-validate.test.ts test/integration/arch-command.test.ts`
  - Expect: entity 仍被正确解析，Candidate 保持 valid 并在全部 CLI 入口报告 `ENTITY_PARTITION_MISMATCH`

### Task 5: 实现 Candidate Formal Comparison

**Goal**: 用显式 comparison availability 取代无效空 diff，并在 Formal 存在时生成真实 promotion diff。

**Files**:
- Modify: `src/core/candidate/validator.ts`
- Modify: `src/core/semantic-diff.ts`
- Modify: `src/core/change-compiler.ts`
- Modify: `src/commands/candidate.ts`
- Modify: `src/core/candidate/promotion.ts`
- Test: `test/commands/candidate-validate.test.ts`
- Test: `test/commands/candidate-promote.test.ts`
- Test: `test/core/model/candidate-partitions.test.ts`

**Requirements**:
- 初始化来源与 Formal comparison availability 分离
- Candidate 与 Change compilation 复用同一 Formal Semantic Model fingerprint 算法
- Formal 缺失时返回明确 unavailable 状态但保留 valid 与 digest
- Formal 存在时生成当前 Formal 到 Candidate 的真实 semantic diff
- Comparison 输出不参与 review digest
- JSON 与文本 CLI 使用一致的 discriminated contract

#### Checks

- [x] C19 验证 Formal 缺失状态
  - Verifies: `elements/deterministic-operations.md` / Requirement "Formal 缺失时报告 Diff 不可用" / Scenario "构建首个 Formal Model"
  - Command: `pnpm test -- test/commands/candidate-validate.test.ts`
  - Expect: 输出 `baseline: absent`、`diff: unavailable`、`formal-model-absent`，同时 Candidate valid 且有 digest

- [x] C20 验证真实 Promotion Diff
  - Verifies: `elements/deterministic-operations.md` / Requirement "Formal 存在时生成 Promotion Diff" / Scenario "Candidate 改变正式语义"
  - Command: `pnpm test -- test/commands/candidate-validate.test.ts test/core/model/candidate-partitions.test.ts`
  - Expect: comparison available 且 diff 精确报告 ADDED、MODIFIED 与 REMOVED entries

- [x] C21 验证 Digest 与 Comparison 解耦
  - Verifies: `elements/deterministic-operations.md` / Requirement "Comparison 不参与 Review Digest" / Scenario "Formal 状态在 Candidate 不变时变化"
  - Command: `pnpm test -- test/commands/candidate-validate.test.ts test/commands/candidate-promote.test.ts`
  - Expect: 相同 Candidate 的 digest 不受 comparison availability 或 diff 内容影响

### Task 6: 执行完整与跨平台验证

**Goal**: 证明新的 Build、Model validation、Candidate comparison 和 Change 语义在 TypeScript 构建、完整测试与 Windows CI 中一致成立。

**Files**:
- Test: `test/core/templates/build.test.ts`
- Test: `test/core/model/parser.test.ts`
- Test: `test/commands/candidate-validate.test.ts`
- Test: `.github/workflows/test-windows.yml`

**Requirements**:
- 所有路径处理使用 Node `path` API 与现有规范化 helper
- 测试不硬编码平台路径分隔符
- 新 diagnostic 和 comparison contract 在 Windows、Linux 与 macOS 行为一致
- 完整 Change validation 与 Expected Model validation 通过

#### Checks

- [x] C22 验证跨平台路径行为
  - Verifies: `elements/semantic-model-build.md` / Requirement "Promotion 后验证 Build 后置条件" / Scenario "Post-promotion Validation 有 Warning"
  - Command: `pnpm test -- test/core/templates/build.test.ts test/core/model/parser.test.ts test/commands/candidate-validate.test.ts`
  - Expect: targeted tests 不依赖 POSIX-only 路径行为，并由 Windows CI 执行同一行为集

- [x] C23 验证完整项目质量门禁
  - Verifies: `elements/semantic-model-build.md` / Requirement "确定性校验后执行独立语义审查" / Scenario "Candidate 结构有效"
  - Command: `pnpm lint && pnpm build && pnpm test`
  - Expect: lint、TypeScript build 与完整 Vitest suite 全部通过

- [x] C24 验证 Change 与 Expected Model
  - Verifies: `elements/realization.md` / Requirement "以两个维度完整描述落实" / Scenario "理解同一落实工作"
  - Command: `node bin/xirang.js validate --change "optimize-build-workflow" --json && node bin/xirang.js arch validate --change "optimize-build-workflow" --json`
  - Expect: Change scaffolding、Semantic Delta 与 Expected Semantic Model 无 ERROR

## Remediation

- [x] [code_fix] Active Candidate continue 分支仍会进入无条件 Candidate 初始化；分支化 workflow，并增加 continue 时跳过初始化的测试。
- [x] [artifact_fix] `src/core/change-compiler.ts` 未归属 Task 5；声明共享 Formal fingerprint 重构，或移除该文件变更。
- [x] [artifact_fix] `opt-build.md` 未归属任何 Task；声明其持久化用途与 Change 所有权，或在迁移必要决策后移除。
- [x] [code_fix] Relationship endpoint 与 kind 同时无效时，endpoint early return 会抑制 `UNDECLARED_RELATIONSHIP_KIND`；调整诊断顺序并增加组合无效回归测试。
- [x] [code_fix] Change-scoped Expected Model validation 未传播 Formal parser 的 `ENTITY_PARTITION_MISMATCH` warning；在 Change compilation 中保留 base diagnostics 并增加组合入口测试。
- [x] [code_fix] Candidate comparison 会漏报有序 Requirement/Scenario 重排并误报无序 Kind/View 列表重排；实现 model-aware normalization 与有序 Contract comparison，并补齐回归测试。
- [x] [code_fix] Set-semantic arrays 只排序未去重，重复成员会产生虚假 diff 与 fingerprint；对全部无序集合执行唯一化排序并补齐重复成员测试。
- [x] [artifact_fix] `effective-change.md` 保留旧 Formal fingerprint；在最终实现稳定后通过 `xirang diff --write` 重生成并核对 fresh diff。
- [x] [code_fix] Build 仅提及 semantic review output contract 却未投影已确认 schema；嵌入完整结构并为 result、findings、evidence、correction 与 coverage 字段增加断言。

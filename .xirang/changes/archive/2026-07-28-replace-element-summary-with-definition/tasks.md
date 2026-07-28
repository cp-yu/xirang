## Remediation

- [x] [artifact_fix] Change attribution：在 Task 4 Files 中声明 `src/core/likec4/definition.ts`、`src/core/view.ts` 与 `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`。
- [x] [artifact_fix] Change attribution：在 Task 5 Files 中声明 `src/core/setup.ts` 与 `src/core/candidate/workspace.ts`。
- [x] [code_fix] Change cleanliness：删除 `test/commands/arch-search.test.ts` 中已无调用的 `contract` helper，并重跑相关与全量测试门禁。

### Task 1: 建立可复用迁移工具与数据切换门禁

**Goal**: 以测试驱动的独立工具安全迁移当前有效工作面，并保留供其他项目复用。

**Files**:
- Create: `tmp_script/migrate-element-summary-to-definition.mjs`
- Test: `test/integration/migrate-element-summary-to-definition.test.ts`
- Modify: `.xirang/model/elements/`
- Modify: `.xirang/changes/replace-element-summary-with-definition/elements/`

**Requirements**:
- 默认以调用时 `cwd` 为目标项目根目录，仅扫描显式的 model、可选 candidate 与非 archive 活动 Change 目录
- 使用 YAML/frontmatter 识别 `entity: element-declaration`，只改字段名并保留 value 与正文
- preflight 将单字段、双字段和缺字段分类；冲突时整次运行不开始写入
- 使用 Node.js `path` 与同目录临时文件加 rename，支持 `--check`、幂等和跨项目调用
- 工具及测试保留在仓库，但不注册 CLI、package script、发布文件或 Semantic Model

#### Checks

- [x] C1 验证跨项目、跨平台迁移范围、冲突和幂等行为
  - Verifies: `elements/element-declaration.md` / Requirement "只持久化 Definition" / Scenario "加载 Legacy Declaration"
  - Command: `pnpm exec vitest run test/integration/migrate-element-summary-to-definition.test.ts`
  - Expect: 测试先证明缺少迁移能力，再证明以不同 `cwd` 调用时的 rename、`--check`、冲突零写入、显式 archive 排除、POSIX/Windows 路径和重复运行全部通过

- [x] C2 迁移当前有效工作面并证明历史范围未变化
  - Verifies: `elements/element-declaration.md` / Requirement "只持久化 Definition" / Scenario "加载 Legacy Declaration"
  - Command: `node tmp_script/migrate-element-summary-to-definition.mjs --check || node tmp_script/migrate-element-summary-to-definition.mjs; node tmp_script/migrate-element-summary-to-definition.mjs --check`
  - Evidence: 当前 model 与活动 Change 的 Element Declarations 只含 `definition`，`.xirang/history/` 与 `.xirang/changes/archive/` 没有由迁移产生的 diff

### Task 2: 硬切换 Semantic Model kernel 与变更链路

**Goal**: 让 `definition` 成为 IR、存储、校验、Delta、diff、fingerprint、Candidate 与 Sync 的唯一 Declaration 概念字段。

**Files**:
- Modify: `src/core/model/types.ts`
- Modify: `src/core/model/frontmatter.ts`
- Modify: `src/core/model/parser.ts`
- Modify: `src/core/model/serializer.ts`
- Modify: `src/core/model/validator.ts`
- Modify: `src/core/model/delta.ts`
- Modify: `src/core/model/sync-writer.ts`
- Modify: `src/core/model/transaction.ts`
- Modify: `src/core/semantic-diff.ts`
- Modify: `src/core/candidate/digest.ts`
- Modify: `src/core/change-sync.ts`
- Test: `test/core/model/parser.test.ts`
- Test: `test/core/model/serializer.test.ts`
- Test: `test/core/model/serializer.pbt.test.ts`
- Test: `test/core/model/delta.test.ts`
- Test: `test/core/model/sync-writer.test.ts`
- Test: `test/core/candidate-digest.test.ts`
- Test: `test/core/change-sync.partitions.test.ts`

**Requirements**:
- `ElementDeclaration` 只含必填非空 `definition`，canonical 顺序固定为 identity、kind、parent、title、definition
- legacy `summary` 返回明确 ERROR，不作为 alias、fallback 或未知字段静默丢弃
- ADDED/MODIFIED Declaration 以完整 Definition 参与 Delta、diff、fingerprint、Candidate 与 Sync
- serializer 保留作者文本且 parse/serialize round-trip 成立
- 不在 core IR 中增加 excerpt 或展示字段

#### Checks

- [x] C3 验证 Definition 解析、序列化与 legacy rejection
  - Verifies: `elements/element-declaration.md` / Requirement "只持久化 Definition" / Scenario "加载 Legacy Declaration"
  - Command: `pnpm exec vitest run test/core/model/parser.test.ts test/core/model/serializer.test.ts test/core/model/serializer.pbt.test.ts`
  - Expect: RED 先覆盖 `definition` round-trip、非空校验、固定顺序和 legacy ERROR，GREEN 后全部通过

- [x] C4 验证 Definition 贯穿 Delta、diff、fingerprint、Candidate 与 Sync
  - Verifies: `elements/deterministic-operations.md` / Requirement "完整处理 Element Definition" / Scenario "比较和同步 Definition 变化"
  - Command: `pnpm exec vitest run test/core/model/delta.test.ts test/core/model/sync-writer.test.ts test/core/candidate-digest.test.ts test/core/change-sync.partitions.test.ts test/core/view.test.ts`
  - Expect: 完整 Definition 变化产生稳定语义差异和 fingerprint，Sync 只重写受影响单元且不截断文本

### Task 3: 让 Agent-facing CLI 返回完整 Definition

**Goal**: 更新 CLI 查询、搜索与影响输出，使 Agent 始终消费完整 Definition。

**Files**:
- Modify: `src/commands/arch/search.ts`
- Modify: `src/commands/arch/query.ts`
- Modify: `src/commands/arch/impact.ts`
- Create: `src/commands/arch/reader.ts`
- Test: `test/commands/arch-search.test.ts`
- Test: `test/commands/arch-query.test.ts`

**Requirements**:
- `arch search` 搜索完整 Definition，evidence field 使用 `definition`
- `arch query` text label 使用 `Definition`，text 与 JSON 保留完整内容
- `arch impact` 及共享结构化输出不使用 excerpt 或截断
- CLI 不引入 Browser 展示规则

#### Checks

- [x] C5 验证搜索、查询和影响分析返回完整 Definition
  - Verifies: `elements/deterministic-operations.md` / Requirement "完整处理 Element Definition" / Scenario "查询和搜索 Element"
  - Command: `pnpm exec vitest run test/commands/arch-search.test.ts test/commands/arch-query.test.ts test/commands/arch-impact.test.ts`
  - Expect: 长、多段和 Unicode Definition 可被搜索，结果 field 为 `definition`，query、search 与 impact 的 text/JSON 中完整内容无 `...` 截断

### Task 4: 在 Semantic Browser 投影 Definition

**Goal**: 在 Formal 与 Change variant 两条 Xirang→LikeC4 路径中同时提供紧凑 summary 和完整 description。

**Files**:
- Create: `src/core/likec4/definition.ts`
- Modify: `src/core/likec4/generator.ts`
- Modify: `src/core/view.ts`
- Modify: `likec4/packages/diagram/src/xirang/SpecLoaderContext.tsx`
- Modify: `likec4/packages/diagram/src/xirang/architectureView.ts`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`
- Test: `test/core/likec4/generator.test.ts`
- Test: `test/core/likec4/generator-validate.test.ts`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`
- Test: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.spec.tsx`

**Requirements**:
- 两条投影路径共享第一段、空白折叠、120 Unicode code points 和 `...` 规则
- LikeC4 `summary` 使用 excerpt，`description` 使用完整 Definition
- excerpt 不写回 Xirang IR 或任何持久源
- 不修改 LikeC4 core 的 fallback 和全局 Element 模型

#### Checks

- [x] C6 验证 Formal Model 的 LikeC4 投影
  - Verifies: `elements/semantic-browser.md` / Requirement "确定性派生 Definition Excerpt" / Scenarios "Definition 超过显示上限", "Definition 不超过显示上限"
  - Command: `pnpm exec vitest run test/core/likec4/generator.test.ts test/core/likec4/generator-validate.test.ts`
  - Expect: 119、120、121、非 BMP、多段与连续空白案例生成预期 summary，description 始终保留完整 Definition

- [x] C7 验证 Change variant 使用相同投影规则
  - Verifies: `elements/semantic-browser.md` / Requirement "分层呈现 Element Definition" / Scenario "查看图节点与 Element 详情"
  - Command: `pnpm --dir likec4 exec vitest run packages/diagram/src/xirang/architectureView.spec.ts packages/diagram/src/overlays/element-details/ElementDetailsCard.spec.tsx`
  - Expect: runtime variant node 的 summary 与 Formal 路径一致，Element Details 的 description 为完整 Definition

### Task 5: 投影统一 Definition authoring contract

**Goal**: 从生成源码统一 Build、Explore、Propose、Snack 与 Project Root 初始化的 Definition 编写和审查规则。

**Files**:
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Modify: `src/core/templates/workflows/build.ts`
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/snack.ts`
- Modify: `src/core/templates/model-skeleton.ts`
- Modify: `src/core/setup.ts`
- Modify: `src/core/candidate/workspace.ts`
- Modify: `src/cli/index.ts`
- Modify: `schemas/spec-driven/schema.yaml`
- Modify: `schemas/spec-driven/templates/delta.md`
- Modify: `.pi/skills/`
- Test: `test/core/templates/fragments/xirang-fragments.test.ts`
- Test: `test/core/templates/build.test.ts`
- Test: `test/core/templates/explore-template.test.ts`
- Test: `test/core/templates/propose-template.test.ts`
- Test: `test/core/templates/snack-template.test.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`
- Test: `test/core/setup.test.ts`
- Test: `test/cli-e2e/basic.test.ts`

**Requirements**:
- 单一共享 fragment 定义 Definition 的概念身份、独立理由、范围和层级边界，以及与 Contract/Plan/实现的排除边界
- Build 在 Contract 前编写并独立审查 Definition；Explore 澄清结构边界；Propose 写完整目标态；Snack 证据不足时停止猜测
- setup skeleton 与提示使用 Project Definition，不再生成 Declaration `summary`
- 只修改生成源码并通过现有机制刷新托管 skills，不手工维护分叉内容
- schema、Delta template、skills 与 runtime 字段保持一致

#### Checks

- [x] C8 验证 Build 编写并审查完整 Definition
  - Verifies: `elements/semantic-model-build.md` / Requirement "独立审查 Definition 质量" / Scenario "Clean-context Review 发现概念边界冲突"
  - Command: `pnpm exec vitest run test/core/templates/fragments/xirang-fragments.test.ts test/core/templates/build.test.ts`
  - Expect: Build 在 Contract 前编写 Definition，并对概念边界执行 clean-context review

- [x] C9 验证 Explore 澄清 Definition 影响
  - Verifies: `elements/explore.md` / Requirement "澄清 Element Definition 影响" / Scenario "Change 改变 Element 概念边界"
  - Command: `pnpm exec vitest run test/core/templates/explore-template.test.ts`
  - Expect: Explore 只在结构边界变化时将完整目标 Definition 纳入 Design Summary

- [x] C10 验证 Propose 编译完整 Definition 目标态
  - Verifies: `elements/propose.md` / Requirement "编写完整 Definition 目标态" / Scenario "Definition 边界仍未确认"
  - Command: `pnpm exec vitest run test/core/templates/propose-template.test.ts`
  - Expect: Propose 不以局部变化摘要替代 Definition，并在边界未决时停止猜测

- [x] C11 验证 Snack 只从充分证据调和 Definition
  - Verifies: `elements/snack.md` / Requirement "仅从充分证据调和 Definition" / Scenario "代码结构不足以确定概念边界"
  - Command: `pnpm exec vitest run test/core/templates/snack-template.test.ts`
  - Expect: Snack 不从文件名、符号或调用关系自动生成 Definition

- [x] C12 验证 Project Definition 初始化
  - Verifies: `elements/project-tooling-configuration.md` / Requirement "以 Project Definition 初始化根 Element" / Scenario "跨平台初始化项目"
  - Command: `pnpm exec vitest run test/core/setup.test.ts test/cli-e2e/basic.test.ts`
  - Expect: 交互 setup 收集 Project Definition，非交互 setup 持久化显式 `--project-definition` 输入且缺失时在写入前失败，路径处理在 macOS/Linux/Windows 上保持一致

- [x] C13 验证共享规则与生成面 parity
  - Verifies: `elements/project-tooling-configuration.md` / Requirement "投影共享 Element Contract 语义" / Scenario "刷新 Agent 工作面"
  - Command: `pnpm exec vitest run test/core/templates/skill-templates-parity.test.ts test/core/templates/semantic-model-consistency.test.ts test/skills/semantic-model-consistency.test.ts`
  - Expect: schema/templates 与重新生成的托管 skills 一致，旧 Declaration summary 写作规则不再出现

### Task 6: 隔离保留迁移工具并执行最终门禁

**Goal**: 在 hard cutover 后保留可复用迁移工具，同时证明它与 Xirang 产品面隔离且正式实现完整。

**Files**:
- Modify: `.github/workflows/test-windows.yml`
- Test: `test/integration/migrate-element-summary-to-definition.test.ts`
- Test: `test/`
- Test: `likec4/packages/diagram/src/xirang/`

**Requirements**:
- 保留 `tmp_script/migrate-element-summary-to-definition.mjs` 及其测试，但不注册 CLI、package script、发布文件、runtime 引用或 Semantic Model
- 删除产品代码中的所有 Declaration `summary` alias、fallback 与 legacy mode
- Windows CI 覆盖迁移工具及正式 path-sensitive setup、model 和 Browser 投影测试
- 当前 Formal Model与活动 Change 可由新 parser 完整加载，archive/history 保持旧记法且未被机械改写
- lint、build、项目 tests、LikeC4 tests/typecheck 与 Xirang validations 全部通过

#### Checks

- [x] C14 验证迁移工具被保留并与产品面隔离
  - Verifies: `elements/element-declaration.md` / Requirement "只持久化 Definition" / Scenario "加载 Legacy Declaration"
  - Command: `test -f tmp_script/migrate-element-summary-to-definition.mjs && test -f test/integration/migrate-element-summary-to-definition.test.ts && ! rg "migrate-element-summary-to-definition|tmp_script" src bin package.json schemas .xirang/model && ! rg "summary\s*\??:|declaration\.summary|data\.summary" src/core/model src/commands/arch && ! rg "definition\s*(?:\?\?|\|\|)\s*summary|summary\s*(?:\?\?|\|\|)\s*definition" src/core/likec4 likec4/packages/diagram/src/xirang`
  - Expect: 独立工具与测试存在，Xirang runtime、CLI、发布配置、Semantic Model 和正式 Declaration 实现均无迁移工具耦合或 legacy fallback

- [x] C15 验证正式跨平台 CI 与全部项目门禁
  - Verifies: `elements/deterministic-operations.md` / Requirement "完整处理 Element Definition" / Scenario "比较和同步 Definition 变化"
  - Command: `pnpm run lint && pnpm run build && pnpm test && pnpm run likec4:typecheck && pnpm --dir likec4 exec vitest run packages/diagram/src/xirang/architectureView.spec.ts && xirang arch validate --json && xirang validate --change replace-element-summary-with-definition --json`
  - Evidence: `.github/workflows/test-windows.yml` 执行迁移工具与受影响的正式 path-sensitive tests，全部本地门禁和 Expected Semantic Model validation 成功

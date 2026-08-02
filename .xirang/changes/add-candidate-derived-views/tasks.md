### Task 1: 构建 Candidate runtime sources

**Goal**: 从一次 Candidate validation snapshot 生成完整 Candidate View 与 Candidate Diff View 的 runtime 数据。

**Files**:
- Modify: `src/core/candidate/validator.ts`
- Modify: `src/core/view.ts`
- Test: `test/core/view.test.ts`

**Requirements**:
- 暴露同一 snapshot 的 Candidate target model、validation result、diagnostics 与 review digest，且不改变 CLI validation 输出
- `candidate` source 使用 Candidate architecture、Contracts、views 与 partition fingerprints，不携带 diff
- `candidate-diff` source 复用同一 Candidate target 并投影 Semantic Model → Candidate diff
- invalid Candidate 保留当前可解析内容与 diagnostics，禁止使用 stale snapshot
- 不新增依赖，不修改 Candidate 或 Semantic Model files

#### Checks

- [x] C1 验证有效 Candidate 完整目标态
  - Verifies: `elements/candidate-derived-view.md` / Requirement "提供完整 Candidate 目标模型" / Scenario "浏览有效 Candidate"
  - Command: `pnpm exec vitest run test/core/view.test.ts -t "builds the complete candidate source from one snapshot"`
  - Expect: `candidate` source 包含 Candidate 完整 architecture 与 Contracts，且没有 diff

- [x] C2 验证 invalid Candidate 不回退 stale snapshot
  - Verifies: `elements/candidate-derived-view.md` / Requirement "保留 invalid Candidate 的只读状态" / Scenario "Candidate 校验失败"
  - Command: `pnpm exec vitest run test/core/view.test.ts -t "retains invalid Candidate with diagnostics and partial architecture when parseable"`
  - Expect: 两个 Candidate sources 均标记 invalid、返回当前 diagnostics，并且不含上一次有效 snapshot 内容

- [x] C3 验证两个 Candidate sources 共享 target snapshot
  - Verifies: `elements/candidate-diff-derived-view.md` / Requirement "共享 Candidate target 与刷新状态" / Scenario "Candidate 内容发生变化"
  - Command: `pnpm exec vitest run test/core/view.test.ts -t "shares Candidate target and refresh state between Candidate View and Candidate Diff View"`
  - Expect: 一次 Candidate validation 同时生成完整 source 与最新 Formal → Candidate diff

### Task 2: 升级 runtime manifest 与刷新边界

**Goal**: 将 View runtime manifest 升级为 v3，并按 Model、Candidate、Candidate Diff 与 Change source 的依赖关系刷新。

**Files**:
- Modify: `src/core/view.ts`
- Test: `test/core/view.test.ts`

**Requirements**:
- manifest 固定为 `{ version: 3, semanticModel, candidate?, candidateDiff?, changes }`
- source fingerprints 使用 `sourceFingerprint`，Candidate Diff 另保留 `semanticModelFingerprint`
- 没有 active Candidate 时省略两个 Candidate fields
- Candidate 变化刷新两个 Candidate sources，Model 变化刷新全部依赖 Model 的 sources
- 单个 Change 变化只刷新对应 Change source

#### Checks

- [x] C4 验证 active Candidate 的 v3 manifest
  - Verifies: `elements/semantic-browser.md` / Requirement "Candidate source manifest 使用 version 3" / Scenario "active Candidate 存在"
  - Command: `pnpm exec vitest run test/core/view.test.ts -t "emits version 3 manifest with candidate sources"`
  - Expect: manifest 含 `candidate` 与 `candidateDiff`，两者共享当前 Candidate revision、validity 与 diagnostics

- [x] C5 验证没有 Candidate 时保持 Model 与 Changes
  - Verifies: `elements/semantic-browser.md` / Requirement "Candidate source manifest 使用 version 3" / Scenario "active Candidate 不存在"
  - Command: `pnpm exec vitest run test/core/view.test.ts -t "omits candidate sources when no active candidate exists"`
  - Expect: manifest 不含 Candidate fields，Model 与 active Change sources 仍完整

- [x] C6 验证 Candidate watcher 刷新边界
  - Verifies: `elements/semantic-browser.md` / Requirement "Candidate source 按输入刷新" / Scenario "Candidate 修改后刷新"
  - Command: `pnpm exec vitest run test/core/view.test.ts -t "refreshes both candidate sources after candidate changes"`
  - Expect: Candidate file 变化只重建 Candidate 与 Candidate Diff，并保留其他 source

- [x] C7 验证 Model watcher 刷新依赖 sources
  - Verifies: `elements/semantic-browser.md` / Requirement "Candidate source 按输入刷新" / Scenario "Semantic Model 修改后刷新"
  - Command: `pnpm exec vitest run test/core/view.test.ts -t "refreshes model dependent sources after model changes"`
  - Expect: Model、Candidate Diff 与 Change-derived sources 使用最新 Model baseline

### Task 3: 统一 Contract source protocol

**Goal**: 以统一 source identity 加载 Model、Candidate、Candidate Diff 与 Change target Contracts，并移除 Change 专用 query contract。

**Files**:
- Modify: `likec4/packages/likec4-spa/src/xirang/HttpContractLoader.ts`
- Test: `likec4/packages/likec4-spa/src/xirang/HttpContractLoader.spec.ts`
- Modify: `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.ts`
- Test: `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts`

**Requirements**:
- `XirangContractLoader.load` 接收 source identity，Model source 省略 query
- endpoint 只接受 manifest 中显式存在的 `candidate`、`candidate-diff` 与 `change:<name>`
- source lookup 不拼接 filesystem path，并拒绝未知 source、路径注入值与 `variant`
- Candidate 与 Candidate Diff Contracts 均来自当前 Candidate target
- AbortController 和 revision 防止旧 source response 覆盖当前 state

#### Checks

- [x] C8 验证 Candidate Contract 加载
  - Verifies: `elements/semantic-browser.md` / Requirement "通过 Contract 接口加载 Element Contract" / Scenario "加载 Candidate Contract"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/likec4-spa/src/xirang/HttpContractLoader.spec.ts packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts -t "loads candidate contracts by source"`
  - Expect: request 使用 `source=candidate` 并返回 Candidate target Contract

- [x] C9 验证 Candidate Diff Contract 隔离
  - Verifies: `elements/semantic-browser.md` / Requirement "通过 Contract 接口加载 Element Contract" / Scenario "加载 Candidate Diff Contract"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/likec4-spa/src/xirang/HttpContractLoader.spec.ts packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts -t "loads candidate diff contracts by source"`
  - Expect: request 使用 `source=candidate-diff`，并返回 Candidate target Contract 与对应 diff

- [x] C10 验证拒绝旧 query 与非法 source
  - Verifies: `elements/semantic-browser.md` / Requirement "通过 Contract 接口加载 Element Contract" / Scenario "拒绝旧接口术语"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts -t "rejects legacy and unknown contract sources"`
  - Expect: `change`、`variant`、未知 source 与路径注入 source 均不被解释为有效 Contract source

### Task 4: 投影 Candidate architecture 与 Element details

**Goal**: 复用 Xirang overlay 呈现 Candidate 完整目标态和 diff-only 目标态，并让 Candidate-only Elements 可浏览 details 与 Contracts。

**Files**:
- Modify: `likec4/packages/diagram/src/xirang/architectureView.ts`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ContractsTab.tsx`
- Test: `likec4/packages/diagram/src/overlays/element-details/XirangDiffViewer.spec.tsx`

**Requirements**:
- Candidate View 固定使用 Candidate target 的 full mode，且无 diff styles
- Candidate Diff View 固定使用 diff mode，不提供 Full context
- Candidate-only Element 使用 identity overlay 与确定性 grid fallback，不写入 LikeC4 cache
- Candidate-only Element details 从 source architecture 与 Contract loader 读取，不依赖 ADDED diff entry
- Requirement diff 合并呈现正文与全部 Scenarios

#### Checks

- [x] C11 验证 Candidate-only Element 的目标态 details
  - Verifies: `elements/candidate-derived-view.md` / Requirement "提供完整 Candidate 目标模型" / Scenario "Candidate 包含正式模型没有的 Element"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/diagram/src/xirang/architectureView.spec.ts -t "materializes candidate only elements in full mode"`
  - Expect: Candidate-only node 可见、布局稳定，并可由 source architecture 打开 Properties 与 Contracts

- [x] C12 验证 Candidate View 不显示 diff
  - Verifies: `elements/candidate-derived-view.md` / Requirement "不混入 Candidate 差异" / Scenario "查看 Candidate 目标态"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/diagram/src/xirang/architectureView.spec.ts -t "keeps candidate view free of diff state"`
  - Expect: full projection 不包含 ADDED、MODIFIED、REMOVED styles 或 diff-only filtering

- [x] C13 验证 Candidate Contract 的合并 diff
  - Verifies: `elements/candidate-diff-derived-view.md` / Requirement "呈现 Candidate 语义差异" / Scenario "Candidate 只修改 Contract"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/diagram/src/overlays/element-details/XirangDiffViewer.spec.tsx -t "renders candidate requirement and scenarios as one diff"`
  - Expect: 一个 Requirement diff 同时包含正文与全部 Scenario before/after 文本

### Task 5: 增加 Browser source selector 与固定模式

**Goal**: 在同一 Semantic Browser 中提供 Model、Candidate、Candidate Diff 与 Change sources，并保持各自的 selector、mode、focus 和 diagnostics 状态。

**Files**:
- Modify: `likec4/packages/diagram/src/xirang/ContractLoaderContext.tsx`
- Create: `likec4/packages/diagram/src/xirang/ContractLoaderContext.spec.tsx`
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`
- Modify: `likec4/packages/diagram/src/navigationpanel/NavigationPanelDropdown.tsx`
- Modify: `likec4/packages/likec4-spa/src/routes/_single/single-index.tsx`

**Requirements**:
- source selector 顺序固定为 Model、Candidate、Candidate Diff、active Changes
- Candidate View 固定 full，Candidate Diff 固定 diff-only，Change 保留可切换 mode
- invalid Candidate sources 显示 Invalid 与 diagnostics，其他 sources 仍可选择
- source revision 隔离 Contract、architecture、diff 与 stale requests
- Candidate focus 失效时沿旧 ancestor chain 回退，最终回退 Project Root

#### Checks

- [x] C14 验证 selector 只列出真实 Views
  - Verifies: `elements/semantic-browser.md` / Requirement "只列出真实 Views" / Scenario "查看 View selector"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/diagram/src/xirang/ContractLoaderContext.spec.tsx -t "lists model candidate candidate diff and change sources"`
  - Expect: selector 顺序固定且不出现 Candidate Authored View 子选择器或 Element View entries

- [x] C15 验证没有 Candidate 时隐藏两个 sources
  - Verifies: `elements/semantic-browser.md` / Requirement "只列出真实 Views" / Scenario "没有 active Candidate"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/diagram/src/xirang/ContractLoaderContext.spec.tsx -t "hides candidate sources when candidate is absent"`
  - Expect: Model 与 Changes 保持可用且没有 Candidate entries

- [x] C16 验证 Candidate Diff 固定 diff-only
  - Verifies: `elements/candidate-diff-derived-view.md` / Requirement "固定 diff-only 呈现" / Scenario "选择 Candidate Diff View"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/diagram/src/xirang/ContractLoaderContext.spec.tsx -t "locks candidate diff to diff only mode"`
  - Expect: Candidate Diff 无 Full context control，Candidate View 作为独立 source 保持完整目标态

- [x] C17 验证 Candidate focus 确定性回退
  - Verifies: `elements/semantic-browser.md` / Requirement "focus 失效时确定性回退" / Scenario "Candidate 更新移除当前 focus"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/diagram/src/xirang/ContractLoaderContext.spec.tsx -t "falls back after candidate focus disappears"`
  - Expect: focus 回退到最近存在的 Candidate ancestor，旧 revision 不能恢复已移除 focus

### Task 6: 覆盖 desktop 与 mobile Candidate 浏览流程

**Goal**: 以真实 Browser 流程验证 Candidate View、Candidate Diff View、invalid diagnostics、Contracts 与响应式布局。

**Files**:
- Create: `test/e2e/semantic-browser-candidate-views.spec.ts`
- Modify: `playwright.config.ts`

**Requirements**:
- desktop viewport 验证完整 Candidate source 与 Candidate-only Element details
- desktop viewport 验证 Candidate Diff 固定 diff-only 与 Contract diff
- invalid Candidate 验证 source 保留、diagnostics 可见且无 stale snapshot
- mobile viewport 验证 selector、画布、details 与 diagnostics 不重叠
- 每个画布检查非空像素、稳定 framing 与可交互节点

#### Checks

- [x] C18 验证完整 Candidate Browser 流程
  - Verifies: `elements/candidate-derived-view.md` / Requirement "提供完整 Candidate 目标模型" / Scenario "浏览有效 Candidate"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-candidate-views.spec.ts --project=desktop --project=mobile -g "browses the complete candidate model"`
  - Expect: desktop 与 mobile 均可选择 Candidate、看到非空画布、打开 Candidate-only Element details 与 Contract

- [x] C19 验证 Candidate Diff Browser 流程
  - Verifies: `elements/candidate-diff-derived-view.md` / Requirement "固定 diff-only 呈现" / Scenario "选择 Candidate Diff View"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-candidate-views.spec.ts --project=desktop --project=mobile -g "reviews candidate changes in diff only mode"`
  - Expect: diff canvas 显示 changed nodes 与合并 Contract diff，且没有 Full context control

- [x] C20 验证 invalid Candidate 可诊断且无重叠
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Candidate 目标与差异" / Scenario "Candidate invalid"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-candidate-views.spec.ts --project=desktop --project=mobile -g "keeps invalid candidate sources diagnosable"`
  - Expect: 两个 Candidate sources 保持可选、Invalid 与 diagnostics 可见、画布不使用 stale data，desktop/mobile UI 无重叠

### Task 7: 增加 Windows 路径 CI 验证

**Goal**: 在 Windows runner 上验证 Candidate watcher、manifest 与 Contract source lookup 不依赖 POSIX 路径分隔符或大小写行为。

**Files**:
- Create: `.github/workflows/windows.yml`
- Test: `test/core/view.test.ts`
- Test: `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts`

**Requirements**:
- workflow 使用 `windows-latest`、Node.js 22.22.3 与仓库锁定的 pnpm
- Candidate 与 Model paths 使用 Node.js `path` API，tests 使用 `path.join()` 或 `path.resolve()` 构造预期路径
- Windows job 执行 build、core View runtime tests 与 Contract handler tests
- source identity 只用于显式 manifest lookup，不直接转为 filesystem path

#### Checks

- [x] C21 验证 Windows Candidate watcher 路径
  - Verifies: `elements/semantic-browser.md` / Requirement "Candidate source 按输入刷新" / Scenario "Candidate 修改后刷新"
  - Command: `pnpm exec vitest run test/core/view.test.ts -t "refreshes both candidate sources after candidate changes"`
  - Evidence: `.github/workflows/windows.yml` 在 `windows-latest` 执行同一 test 与 `pnpm build`
  - Expect: Windows runner 使用平台原生路径发现 Candidate 变化并刷新两个 sources

- [x] C22 验证 Windows Contract source lookup
  - Verifies: `elements/semantic-browser.md` / Requirement "通过 Contract 接口加载 Element Contract" / Scenario "加载 Candidate Contract"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts -t "loads candidate contracts by source"`
  - Evidence: `.github/workflows/windows.yml` 在 `windows-latest` 执行 Contract handler tests
  - Expect: source lookup 不依赖 `/`、`\\` 或大小写推断，且不通过 source 拼接路径

### Task 1: 管理内置 Perspective Kind

**Goal**: 以共享受管清单完成 `perspective` Kind 的新模型初始化、clean Candidate、旧项目更新与冲突校验。

**Files**:
- Modify: `src/core/templates/model-skeleton.ts`
- Modify: `src/core/setup.ts`
- Modify: `src/core/candidate/workspace.ts`
- Modify: `src/core/model/validator.ts`
- Test: `test/core/setup.test.ts`
- Test: `test/core/model/candidate-partitions.test.ts`
- Test: `test/core/model/validator.test.ts`

**Requirements**:
- 新项目与 clean Candidate 通过同一显式清单写入内置声明
- 旧模型缺失时报告迁移 WARNING 并由 setup/update 补齐
- 冲突声明返回 ERROR 且不覆盖用户文件
- 所有路径通过 Node.js `path` API 构造

#### Checks

- [x] C1 验证跨平台创建与更新内置 Kind
  - Verifies: `elements/project-tooling-configuration.md` / Requirement "维护内置 Perspective Kind" / Scenario "跨平台建立新模型"
  - Command: `pnpm exec vitest run test/core/setup.test.ts test/core/model/candidate-partitions.test.ts`
  - Expect: macOS、Linux 与 Windows 路径语义由同一清单覆盖，新模型和 clean Candidate 均包含规范 `perspective` 单元

- [x] C2 验证旧模型迁移和冲突保护
  - Verifies: `elements/metamodel.md` / Requirement "管理内置 Perspective Kind" / Scenario "读取缺失声明的旧模型" / Scenario "内置声明发生冲突"
  - Command: `pnpm exec vitest run test/core/model/validator.test.ts test/core/setup.test.ts`
  - Expect: 缺失声明产生 WARNING，冲突声明产生 ERROR 且原文件字节保持不变

### Task 2: 生成唯一 Model View 与关系标题

**Goal**: 关闭 LikeC4 implicit Views，固定生成默认 `model` View，并让 Relationship Kind identity 成为非空连线标题。

**Files**:
- Modify: `src/core/likec4/generator.ts`
- Modify: `src/core/model/validator.ts`
- Test: `test/core/likec4/generator.test.ts`
- Test: `test/core/likec4/generator-validate.test.ts`
- Test: `test/core/model/validator.test.ts`

**Requirements**:
- `implicitViews` 固定为 `false`
- `views.c4` 始终包含唯一 `model` View并继续生成 Authored Views
- Authored View identity `model` 被拒绝
- Relationship instance 使用原始 Kind identity 作为标题

#### Checks

- [x] C3 验证唯一默认 Model View
  - Verifies: `elements/model-view.md` / Requirement "提供唯一默认 Model View" / Scenario "打开项目模型" / Scenario "Authored View 使用保留 identity"
  - Command: `pnpm exec vitest run test/core/likec4/generator.test.ts test/core/model/validator.test.ts`
  - Expect: 生成结果只有一个默认 `model` View，Authored Views 正常保留且保留 identity 被拒绝

- [x] C4 验证缓存不包含 Element Views 且连线有标题
  - Verifies: `elements/semantic-browser.md` / Requirement "保持 LikeC4 投影有效" / Scenario "生成 Browser 缓存"
  - Command: `pnpm exec vitest run test/core/likec4/generator-validate.test.ts test/core/likec4/generator.test.ts`
  - Expect: LikeC4 validate 通过，不存在 `__<element>` View ids，所有生成关系以原始 Kind identity 为标题

### Task 3: 迁移 Browser runtime 与 Contract protocol 术语

**Goal**: 以 Semantic Model、Semantic Delta、Change-derived View 和可选 `change` 参数替代全部 Xirang-specific `variant`/`formal` runtime 表达。

**Files**:
- Modify: `src/core/view.ts`
- Modify: `likec4/packages/vite-plugin/src/plugin.ts`
- Modify: `likec4/packages/diagram/src/xirang/ContractLoaderContext.tsx`
- Modify: `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.ts`
- Modify: `likec4/packages/likec4-spa/src/xirang/HttpContractLoader.ts`
- Modify: `likec4/packages/diagram/src/index.ts`
- Test: `test/core/view.test.ts`
- Test: `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts`
- Test: `likec4/packages/likec4-spa/src/xirang/HttpContractLoader.spec.ts`

**Requirements**:
- runtime manifest 分离 Semantic Model 与按 Change identity 索引的数据
- Contract 请求只使用可选 `change=<change-name>`
- 删除旧类型、字段、参数和 public aliases
- 并发数据源切换不得让旧请求覆盖当前状态

#### Checks

- [x] C5 验证两类 Contract 数据源
  - Verifies: `elements/semantic-browser.md` / Requirement "通过 Contract 接口加载 Element Contract" / Scenario "加载 Semantic Model Contract" / Scenario "加载活动 Change Contract" / Scenario "新请求替代旧请求"
  - Command: `pnpm exec vitest run test/core/view.test.ts && pnpm --dir likec4 exec vitest run --no-isolate packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts packages/likec4-spa/src/xirang/HttpContractLoader.spec.ts`
  - Expect: 缺省请求读取 Semantic Model，`change` 请求读取目标模型，并发旧响应不能覆盖当前选择

- [x] C6 验证旧 runtime 术语和接口已移除
  - Verifies: `elements/semantic-browser.md` / Requirement "通过 Contract 接口加载 Element Contract" / Scenario "拒绝旧接口术语"
  - Command: `! rg -n "Xirang(Runtime|ViewRuntime)?Variant|variants|variant=|Formal Model|formalVariant" src/core/view.ts likec4/packages/diagram/src/xirang likec4/packages/likec4-spa/src/xirang likec4/packages/vite-plugin/src/xirang && pnpm likec4:typecheck`
  - Expect: 受影响的 runtime、HTTP 和 public export surface 无旧术语，旧参数测试明确拒绝请求

### Task 4: 实现 focus projection、布局与关系聚合

**Goal**: 在单一 View identity 内根据 focus 构建当前层投影、重新布局并保留聚合关系的原始三元组。

**Files**:
- Modify: `likec4/packages/diagram/src/xirang/architectureView.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/state/diagram-api.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/state/machine.setup.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/state/machine.actions.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/state/machine.state.initializing.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/state/machine.state.navigating.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`
- Test: `likec4/packages/diagram/src/likec4diagram/state/machine.state.navigating.spec.ts`

**Requirements**:
- 当前层只包含 focus、direct children 与可映射 Relationships
- focus、breadcrumb 和 back/forward 不改变 View identity
- 聚合 edge 标签按 UTF-8 byte order 排序去重
- 详情保留全部原始 Relationship 三元组
- focus 失效时沿旧 ancestor 链回退

#### Checks

- [x] C7 验证单一 View 内连续下钻
  - Verifies: `elements/model-view.md` / Requirement "在单一 View 内维护层级焦点" / Scenario "下钻具有 children 的 Element" / Scenario "选择末端 Element"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/diagram/src/xirang/architectureView.spec.ts packages/diagram/src/likec4diagram/state/machine.state.navigating.spec.ts`
  - Expect: root、深层、leaf、breadcrumb 与 back/forward 均保持原 View identity

- [x] C8 验证当前层关系聚合与失效回退
  - Verifies: `elements/semantic-browser.md` / Requirement "聚合当前层 Relationships" / Scenario "聚合跨子树 Relationships" / Scenario "Relationship 无法映射到当前层"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/diagram/src/xirang/architectureView.spec.ts`
  - Expect: 聚合标签稳定去重、详情保留三元组、外部或 self 映射不显示且删除 focus 后回退到有效 ancestor

### Task 5: 接入 View selector、Authored View 边界与 Perspective 样式

**Goal**: 完成 Model View、Change-derived Views、Authored Views 的用户交互，并仅对 Perspective Elements 应用确定性视觉编码。

**Files**:
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`
- Modify: `likec4/packages/diagram/src/navigationpanel/`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ContractsTab.tsx`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`
- Modify: `likec4/packages/diagram/src/xirang/architectureView.ts`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`
- Test: `likec4/packages/diagram/src/overlays/element-details/ContractsTab.spec.tsx`
- Test: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.spec.tsx`
- Test: `test/e2e/contract-browser.spec.ts`

**Requirements**:
- selector 只列出真实 Views
- Authored View 不自动下钻并可显式跳转 Model View
- 每个活动 Change 只有一个可下钻 Change-derived View
- Perspective 使用 `component` shape 与 identity 驱动的 sibling 唯一颜色
- 普通 Elements 不继承 Perspective 样式

#### Checks

- [x] C9 验证 selector 与 Authored View 导航边界
  - Verifies: `elements/semantic-browser.md` / Requirement "只列出真实 Views" / Scenario "查看 View selector"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/diagram/src/overlays/element-details/ElementDetailsCard.spec.tsx packages/diagram/src/xirang/architectureView.spec.ts`
  - Expect: selector 无 focus/Element entries，Authored View 保持声明视角并提供显式 Model View 跳转

- [x] C10 验证 Perspective 视觉编码
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Perspective Elements" / Scenario "同层包含多个 Perspectives"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/diagram/src/xirang/architectureView.spec.ts`
  - Expect: sibling Perspectives 使用 `component` shape 和不同稳定颜色，普通 descendants 保持自身样式

- [x] C11 验证 Change-derived View 层级浏览
  - Verifies: `elements/change-derived-views.md` / Requirement "支持目标模型层级下钻" / Scenario "下钻已修改子树"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/diagram/src/xirang/architectureView.spec.ts`
  - Expect: 每个 Change 只有一个 View，连续下钻保持 diff 编码和同一 identity

### Task 6: 清理旧概念并完成跨平台与 Browser 验证

**Goal**: 删除 Element-derived View 实现和测试假设，补齐 Windows CI、完整构建与当前模型的一次性视觉证据。

**Files**:
- Modify: `.github/workflows/test-windows.yml`
- Modify: `xirang-definition.md`
- Modify: `src/core/templates/`
- Modify: `.xirang/references/`
- Test: `test/integration/windows-definition-ci.test.ts`
- Modify: `src/core/likec4/local-names.ts`
- Modify: `src/core/change-compiler.ts`
- Modify: `src/core/model/transaction.ts`
- Modify: `src/commands/arch/search.ts`
- Modify: `src/commands/arch/impact.ts`
- Modify: `src/commands/sync.ts`
- Modify: `package.json`
- Modify: `playwright.config.ts`
- Test: `test/commands/`
- Test: `test/core/`
- Test: `test/helpers/`
- Test: `test/integration/`
- Test: `test/unit/`
- Test: `test/fixtures/contract-browser/.xirang/model/`
- Test: `test/fixtures/contract-browser/.xirang/changes/browser-change/`
- Test: `test/e2e/contract-browser.spec.ts`
- Test: `test/e2e/semantic-browser-model-view.spec.ts`
- Delete: `test/core/likec4/generator-validate.test.ts` 中的 Element-derived View 用例

**Requirements**:
- 删除 Element-derived Views 的实现、测试与产品文案
- 受影响 Xirang 产品 surface 不再使用 `variant` 或 `Formal Model`
- Windows CI 运行新的 path-sensitive 与 Browser tests
- desktop/mobile 验证布局、文本、关系标签和连续下钻
- 完整 lint、build、typecheck 与 test 通过

#### Checks

- [x] C12 验证 Element-derived Views 已删除
  - Verifies: `elements/element-derived-views.md` / REMOVED Requirement "形成 Element 下钻视图"
  - Command: `! rg -n "Element-derived View|element-derived|implicitViews.: true|navigateTo.*__|views\\.__" src likec4/packages/diagram/src likec4/packages/likec4-spa/src test/core/likec4 test/e2e xirang-definition.md`
  - Expect: 旧概念、隐式配置和按 Element 生成隐藏 View 的断言均无匹配

- [x] C13 验证 Windows CI 覆盖受管路径与 Browser tests
  - Verifies: `elements/project-tooling-configuration.md` / Requirement "维护内置 Perspective Kind" / Scenario "跨平台建立新模型"
  - Command: `pnpm exec vitest run test/integration/windows-definition-ci.test.ts`
  - Expect: `test-windows.yml` 明确执行内置 Kind、generator、runtime protocol 与 focus projection tests

- [x] C14 验证当前模型的 desktop/mobile Browser 行为
  - Verifies: `elements/semantic-browser.md` / Requirement "支持分层语义浏览" / Scenario "下钻 Element" / Scenario "浏览 Element 详情"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts`
  - Evidence: desktop/mobile 截图和断言证明画布非空、无节点或文本重叠、Perspective 可区分、关系无 `untitled`、可下钻至 leaf 并返回

- [x] C15 验证完整工程门禁
  - Verifies: `elements/model-view.md` / Requirement "从 Semantic Model 确定性派生" / Scenario "相同模型重复生成"
  - Command: `pnpm lint && pnpm build && pnpm test && pnpm likec4:typecheck && pnpm likec4:test`
  - Expect: 根工作区和 vendored LikeC4 的 lint、build、typecheck 与全部 tests 通过

## Remediation

- [x] [code_fix] C4 / 保持 LikeC4 投影有效：LikeC4 grammar 不支持 Relationship Kind specification title；已用 parser failure 证据校正 design/tasks 为 relationship instance identity label，并保持 generator validate 通过。
- [x] [code_fix] C6 / Contract runtime 术语：清除 plugin comment 与 Xirang tests 中旧 variant/formal 命名，只保留验证已移除 HTTP 参数拒绝行为所需 literal。
- [x] [code_fix] C7 / 单一 View focus：focused projection 使用确定性 grid geometry，并提供 identity ancestor breadcrumb；操作只改变 focus、不改变 View identity。
- [x] [code_fix] C8 / focus fallback：production refresh 保存 ancestor chain、回退最近存活 ancestor 并同步 navigation state。
- [x] [code_fix] C8 / Relationship details：聚合 edge 携带可解析的原始 LikeC4 relation IDs，并由 materialization 与 Browser interaction test 验证。
- [x] [code_fix] C9 / Authored View 边界：显式 Open in Model View 在 View transition 后建立 semantic focus，并由 Browser E2E 验证。
- [x] [code_fix] C10 / Perspective 编码：任意数量同层 Perspective 获得 deterministic sibling-unique colors，已覆盖 9 siblings。
- [x] [code_fix] C14 / Browser evidence：E2E fixture 通过 Semantic Model validation，desktop/mobile 点击 leaf 并验证 details/Contract refinement context。
- [x] [artifact_fix] C15 / Unaccounted Changes Detection：intentional behavior-bearing files 已归属相应 Task Files 与职责；完整门禁已通过。
- [x] [code_fix] C2 / Legacy dependency closure：setup/update 为旧 minimal model 安装 `perspective` 所需的 `domain` 与 `capability` Kind，并验证迁移后模型有效。
- [x] [code_fix] C7 / Focus layout coherence：focused projection 与 design 统一为确定性 grid geometry，并由 desktop/mobile Browser evidence 验证。
- [x] [code_fix] C8 / Target-only Relationship details：ADDED target Relationship 即使不在当前 Model View 中，也保留原始三元组并提供 edge detail panel。
- [x] [code_fix] C10 / Accessible Perspective colors：超过基础 palette 的 siblings 使用可测白字对比度与 RGB 间距的 deterministic colors。
- [x] [code_fix] C11 / Change-derived initialization：切换 Change source 时重置 focus/history 到 target Project Root，contract-only Change 同样进入 focus projection。
- [x] [code_fix] C2 / Identity-based managed Kind discovery：setup/update 按 Semantic Model identity index 发现非规范文件名下的 managed Kind，以 parsed `ElementKind` 语义比较区分等价序列化与真实冲突。
- [x] [code_fix] C9 / Coherent View-source selection：选择 Change 时进入 `model` canvas，选择 Authored View 时切回 Semantic Model source，并执行双向 Browser transitions。
- [x] [code_fix] C11 / Source-isolated history：source 切换以 target Project Root 替换 focus history，Back/Forward 不得恢复前一 source 的 focus。

### Task 1: 扩展 View 与 Relationship presentation 模型

**Goal**: 以严格、可往返的 schema 支持 Authored View `exclude` 与 Relationship Kind `presentation`，并保持默认值和 framing/model comparison 一致。

**Files**:
- Modify: `src/core/model/frontmatter.ts`
- Modify: `src/core/model/types.ts`
- Modify: `src/core/model/parser.ts`
- Modify: `src/core/model/serializer.ts`
- Modify: `src/core/model/validator.ts`
- Modify: `src/core/model/delta.ts`
- Modify: `src/core/semantic-diff.ts`
- Modify: `src/core/framing/types.ts`
- Modify: `src/core/framing/document.ts`
- Modify: `src/core/framing/baseline.ts`
- Test: `test/core/model/`
- Test: `test/core/semantic-diff.test.ts`
- Test: `test/core/framing/document.test.ts`
- Test: `test/core/framing/baseline.test.ts`

**Requirements**:
- `exclude` 缺失或空列表等价于空集合，并优先剪除完整 descendants 子树。
- Relationship Kind `presentation` 只允许 LikeC4 支持的 `color`、`line`、`head`、`tail` 合法值。
- presentation 缺失或部分缺失时分别继承 LikeC4 默认值。
- parser、frontmatter、serializer、delta、semantic comparison、framing document 与 baseline 保留新字段并保持确定性往返。
- `exclude` 作为无序集合规范化，presentation mapping 使用固定子字段顺序。

#### Checks

- [x] C1 验证 Relationship Kind presentation schema
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenarios "Relationship Kind 声明关系呈现", "Relationship presentation 缺失", "非法 Kind presentation 被拒绝"
  - Command: `pnpm exec vitest run test/core/model test/core/semantic-diff.test.ts test/core/framing/document.test.ts test/core/framing/baseline.test.ts`
  - Expect: 合法完整与部分 presentation 可按固定字段顺序往返、进入 framing baseline 与 semantic fingerprint/diff，非法字段和值返回 `ERROR`，缺失字段使用默认值

- [x] C2 验证 Authored View exclude 选择规则
  - Verifies: `elements/authored-views.md` / Requirement "声明选择范围" / Scenarios "选择并排除子树", "exclude 缺失", "exclude 包含未知 identity"
  - Command: `pnpm exec vitest run test/core/model test/core/semantic-diff.test.ts test/core/view.test.ts test/core/framing/baseline.test.ts`
  - Expect: exclude 优先剪枝、缺失默认、未知 identity 校验、不同输入排列的规范化与 semantic diff/fingerprint 均通过

### Task 2: 建立原生 LikeC4 Runtime Projection Lowering

**Goal**: 在 root package 中将可见 semantic projection lowering 为确定性原生 LikeC4 model/view 内容与 projection key，供 Task 3 的服务端官方管线消费；root package 不直接调用 LikeC4 parser、compute-view 或 Graphviz。

**Files**:
- Modify: `src/core/likec4/generator.ts`
- Modify: `src/core/likec4/presentation-adapter.ts`
- Create: `src/core/likec4/runtime-projection.ts`
- Test: `test/core/likec4/`
- Test: `test/core/view.test.ts`

**Requirements**:
- Model、Authored、Change 与 Candidate projection 使用同一原生 LikeC4 lowering。
- projection 在 LikeC4 compute/layout 之前形成，不直接构造最终 geometry 或 spline。
- 多根 Authored View 使用非语义 virtual root，且不进入模型或 details。
- projection key 由 fingerprints、View、Change、Mode、focus 与排序后的 expanded set 确定。
- lowering 位于 root package，不 import `@likec4/core`、`@likec4/layouts` 或 Graphviz；官方管线调用属于 Task 3 的 vite-plugin 范围。

#### Checks

- [x] C3 验证统一原生 LikeC4 lowering
  - Verifies: `elements/semantic-browser.md` / Requirement "保持 LikeC4 投影有效" / Scenarios "生成 runtime projection", "LikeC4 无法表达 source Relationship"
  - Command: `pnpm exec vitest run test/core/likec4 test/core/view.test.ts`
  - Expect: Model、Authored、Change 与 Candidate 使用同一 lowering 产出确定性原生 LikeC4 内容，self 与 ancestor-chain Relationships 被确定性省略，相同输入产生相同 projection key，且 root package 不出现 compute/layout 调用

- [x] C4 验证多根 Authored View virtual root
  - Verifies: `elements/authored-views.md` / Requirement "使用 Virtual Projection Root" / Scenarios "Authored View 包含多个顶层 Elements", "Model 存在唯一 Project Root"
  - Command: `pnpm exec vitest run test/core/likec4 test/core/view.test.ts`
  - Expect: Authored 多根投影经真实 Graphviz 布局成功且 virtual root 不成为 Element，Model 继续使用真实 Project Root

- [ ] C25 验证 Derived Views 的组合边界
  - Verifies: `elements/derived-views.md` / Requirement "提供四类派生视图" / Scenarios "选择派生上下文", "Candidate 不存在"
  - Command: `pnpm exec vitest run test/core/view.test.ts`
  - Expect: Model/Candidate 保持独立 View selections，Change-derived 由当前 View、单个 Change 与 Mode 组合，且 manifest 不为每个 Change 生成 View identity 字段
  - Note: 依赖 Task 6 移除混合 source list 后才能满足，在该任务中验证

### Task 3: 实现 Projection Service、分区 Manifest 与原子缓存刷新

**Goal**: 在 `xirang view` 服务端提供 version 4 manifest、projection request、fingerprint 校验、两层缓存与 last-known-good HMR。

**Files**:
- Modify: `src/core/view.ts`
- Create: `src/core/likec4/projection-cache.ts`
- Modify: `likec4/packages/vite-plugin/src/plugin.ts`
- Modify: `likec4/packages/vite-plugin/src/rpc/protocol.ts`
- Create: `likec4/packages/vite-plugin/src/xirang/xirang-projection-handler.ts`
- Modify: `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.ts`
- Test: `test/core/view.test.ts`
- Create: `likec4/packages/vite-plugin/src/xirang/xirang-projection-handler.spec.ts`
- Test: `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts`
- Create: `likec4/packages/vite-plugin/src/plugin.spec.ts`

**Requirements**:
- manifest 分区表达 model、authoredViews、changes、candidate 与 candidateDiff。
- request 通过 `POST /__xirang/projection` HTTP middleware 传输，使用 expected model fingerprint，旧请求被拒绝且 runtime cache 有容量上限。
- 基础 `.cache-likec4` 按显式文件清单完整生成、临时校验和原子替换。
- 失败时保留 last-known-good 并发布 diagnostics，成功后失效旧 projections 并发送一次 HMR。
- 所有路径使用 Node.js path API 和 normalized project-relative keys。
- handler 在 vite-plugin 内依次调用官方 LikeC4 parser、validator、compute-view 与 Graphviz layout，并返回 layouted view，不自行计算 geometry 或 spline。

#### Checks

- [ ] C5 验证 version 4 manifest 与 stale fingerprint
  - Verifies: `elements/semantic-browser.md` / Requirement "使用分区 Runtime Manifest" / Scenarios "构建普通 Browser 状态", "Candidate 可用", "读取旧 manifest"
  - Command: `pnpm exec vitest run test/core/view.test.ts likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts likec4/packages/vite-plugin/src/xirang/xirang-projection-handler.spec.ts likec4/packages/vite-plugin/src/plugin.spec.ts`
  - Expect: version 4 分区稳定，旧 version 与 stale fingerprint 返回明确协议 diagnostics

- [ ] C6 验证原子缓存刷新和 last-known-good
  - Verifies: `elements/semantic-browser.md` / Requirement "原子刷新基础 LikeC4 缓存" / Scenarios "模型变化后刷新 Browser", "重建失败"
  - Command: `pnpm exec vitest run test/core/view.test.ts`
  - Expect: 成功重建只发布一个新 snapshot，失败不替换有效缓存且修复后可恢复

- [ ] C7 验证跨平台 watcher path
  - Verifies: `elements/semantic-browser.md` / Requirement "原子刷新基础 LikeC4 缓存" / Scenario "跨平台处理缓存路径"
  - Command: `pnpm exec vitest run test/core/view.test.ts --testNamePattern="Windows|path|cache"`
  - Expect: POSIX 与 Windows 分隔符均映射到相同 project-relative dependency key，显式文件清单控制替换范围

- [ ] C27 验证 projection 经过官方 LikeC4 管线
  - Verifies: `elements/semantic-browser.md` / Requirement "服务端计算 Runtime Projection" / Scenarios "请求有效 projection", "请求使用旧 fingerprint"
  - Command: `cd likec4 && pnpm --filter @likec4/vite-plugin exec vitest run src/xirang`
  - Expect: handler 依次经过官方 parser、validator、compute-view 与 Graphviz layout 返回 layouted view 与 projection key，stale fingerprint 返回结构化 diagnostic 而不返回 view

### Task 4: 重构 Semantic Browser Controller 与三个控件

**Goal**: 以 SPA route 级 Controller 统一 View、Change、Mode、focus、expanded、URL/history 和 projection request lifecycle。

**Files**:
- Create: `likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.tsx`
- Modify: `likec4/packages/diagram/src/xirang/ContractLoaderContext.tsx`
- Create: `likec4/packages/likec4-spa/src/xirang/HttpProjectionLoader.ts`
- Modify: `likec4/packages/likec4-spa/src/xirang/HttpContractLoader.ts`
- Modify: `likec4/packages/likec4-spa/src/pages/ViewReact.tsx`
- Modify: `likec4/packages/likec4-spa/src/pages/ViewEditor.tsx`
- Test: `likec4/packages/diagram/src/xirang/ContractLoaderContext.spec.tsx`
- Test: `likec4/packages/likec4-spa/src/xirang/`

**Requirements**:
- 三个控件按固定顺序持久显示且只修改各自维度。
- 无 Change、选择 Change 与清除 Change 使用确定默认 mode。
- URL 只包含 view、change、mode、focus；expanded 仅进入会话/history state。
- 切换 View 时保留合法 focus/expanded，并显式呈现空差异状态。

#### Checks

- [ ] C8 验证三维 Controller 状态机
  - Verifies: `elements/semantic-browser.md` / Requirement "提供三维独立控制" / Scenarios "无 Change 时限制模式", "选择和清除 Change"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/xirang/ContractLoaderContext.spec.tsx && pnpm --filter @likec4/spa exec vitest run src/xirang`
  - Expect: View、Change 与 Mode 独立变化，默认值和 disabled 状态符合 Contract

- [ ] C9 验证 URL、history 与 expanded 边界
  - Verifies: `elements/semantic-browser.md` / Requirement "URL 编码导航状态并响应浏览器前进后退" / Scenarios "控件变化", "expanded 不进入 URL", "深链恢复"
  - Command: `cd likec4 && pnpm --filter @likec4/spa exec vitest run src/xirang`
  - Expect: URL 可恢复四项状态且不包含 expanded identities，history 同步无循环

- [ ] C10 验证 View Selection 状态协调
  - Verifies: `elements/semantic-browser.md` / Requirement "协调 View Selection 运行时状态" / Scenarios "切换到仍包含当前 focus 的 Authored View", "切换后 focus 不可用", "当前 Change 在新 View 中无差异"
  - Command: `cd likec4 && pnpm --filter @likec4/spa exec vitest run src/xirang`
  - Expect: 合法状态保留、失效状态裁剪且无差异时不偷偷切换维度

### Task 5: 统一 Diagram 交互、Diff Overlay 与 Relationship Routing

**Goal**: 让 Diagram 只呈现 layouted projection，并实现业务 presentation 前景、diff overlay、reciprocal edges 和视觉锚点。

**Files**:
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`
- Modify: `likec4/packages/diagram/src/xirang/architectureView.ts`
- Modify: `likec4/packages/diagram/src/xirang/projectionNode.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/xyflow-diagram/`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`
- Test: `likec4/packages/diagram/src/xirang/projectionNode.spec.ts`
- Test: `likec4/packages/diagram/src/likec4diagram/xyflow-diagram/diagram-view.spec.ts`

**Requirements**:
- 删除固定网格和中心曲线作为正常渲染路径。
- Element 与 Relationship 业务 presentation 保持前景，diff 使用独立非颜色 overlay。
- 所有 source Relationships 都使用 LikeC4 的 native multiple-relationship expansion 或等价官方机制生成独立 visual edges，不因相同可见 endpoints 聚合。
- Graphviz 重排保持 trigger/focus 视觉锚点且不自动 fit 全图。

#### Checks

- [ ] C11 验证 diff overlay 保留业务 presentation
  - Verifies: `elements/visual-presentation.md` / Requirement "叠加差异而不覆盖业务呈现" / Scenarios "呈现修改的 Relationship", "呈现 REMOVED Element", "非颜色识别"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/xirang/*.spec.ts src/likec4diagram/xyflow-diagram/diagram-view.spec.ts`
  - Expect: 前景样式、underlay、图标与 ghost opacity 可同时断言

- [ ] C12 验证 Relationship edges 独立存在
  - Verifies: `elements/visual-presentation.md` / Requirement "分离 Relationship Edges" / Scenarios "同时呈现两个方向", "一个方向发生变化", "同向 Relationships 具有不同 Kind presentation"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/xirang/architectureView.spec.ts`
  - Expect: reciprocal 与同向不同 Kind 的 edges 均具有独立 path、arrow、metadata、点击详情和 diff state

- [ ] C13 验证视觉锚点与 viewport
  - Verifies: `elements/visual-presentation.md` / Requirement "在重新布局时保持视觉锚点" / Scenarios "就地展开 Element", "首次打开 projection"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/likec4diagram/xyflow-diagram/diagram-view.spec.ts`
  - Expect: 增量 projection 不自动 fit，触发节点保持屏幕锚点，首次打开可 fit

- [ ] C14 验证旧自制布局路径不再存在
  - Verifies: `elements/semantic-browser.md` / Requirement "保持 LikeC4 投影有效" / Scenario "生成 runtime projection"
  - Command: `! rg "materializeXirangArchitectureView|function measure\(|function place\(|function createEdge\(" likec4/packages/diagram/src/xirang/architectureView.ts`
  - Expect: 正常 Diagram path 不再包含旧固定网格、手工 geometry 或中心 spline symbols

### Task 6: 迁移单一路由、Candidate、Details 与导出

**Goal**: 删除旧 Authored/source 导航和浮动 Change 面板，保持 Candidate Review、Contract/details 与图片导出使用新的 projection state。

**Files**:
- Modify: `likec4/packages/diagram/src/navigationpanel/NavigationPanelDropdown.tsx`
- Delete: `likec4/packages/likec4-spa/src/xirang/ViewHistoryBridge.tsx`
- Modify: `likec4/packages/diagram/src/overlays/element-details/`
- Modify: `likec4/packages/diagram/src/xirang/export-state.ts`
- Modify: `likec4/packages/likec4-spa/src/`
- Test: `test/e2e/semantic-browser-candidate-views.spec.ts`
- Test: `test/e2e/semantic-browser-image-export.spec.ts`

**Requirements**:
- 旧 Authored View routes、混合 source selector 与浮动 Change 面板被删除。
- Candidate 与 Candidate Diff 保持完整/固定 diff-only 的独立 Review 行为。
- Contract/details 使用当前 View/Change/Candidate projection identity，旧请求不能覆盖新状态。
- PNG/JPG snapshot 精确复现当前 projection 且排除交互 chrome。

#### Checks

- [ ] C15 验证旧 View 与 Change UI 被移除
  - Verifies: `elements/semantic-browser.md` / REMOVED Requirement "浮动 Change 面板可拖动"
  - Command: `! rg "ViewHistoryBridge|data-xirang-change-selector|Active Change|Change / \{selected.label\}" likec4/packages/diagram/src likec4/packages/likec4-spa/src`
  - Expect: 旧 route bridge、混合 selector 与浮动 Change panel 不再存在

- [ ] C16 保持 Candidate Build Review 行为
  - Preserves: `.xirang/model/elements/semantic-browser.md` / Requirement "呈现 Candidate 目标与差异" / Scenarios "浏览 active Candidate", "审查 Candidate diff", "Candidate invalid"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-candidate-views.spec.ts --project=desktop --project=mobile`
  - Expect: Candidate 仍完整呈现、Candidate Diff 固定 diff-only，且不进入普通 Browser 三个控件

- [ ] C17 验证图片导出 projection 一致性
  - Verifies: `elements/semantic-browser.md` / Requirement "图片导出所见即所得" / Scenarios "导出聚焦且就地展开的 Authored View", "导出 Complete with diff", "无前置 snapshot"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-image-export.spec.ts --project=desktop --project=mobile`
  - Expect: 导出节点与 edge 集合匹配屏上 projection，交互 chrome 被排除，无 snapshot 时 fallback 正常

### Task 7: 完成跨平台与全链路自动化验证

**Goal**: 以源码测试、类型检查、正确 bundle 构建顺序和 desktop/mobile Playwright 证明完整 Change 行为。

**Files**:
- Modify: `.github/workflows/`
- Test: `test/e2e/semantic-browser-model-view.spec.ts`
- Test: `test/e2e/semantic-browser-navigation-history.spec.ts`
- Test: `test/e2e/semantic-browser-node-presentation.spec.ts`
- Test: `likec4/packages/diagram/src/xirang/`

**Requirements**:
- Windows CI 覆盖缓存路径、watcher normalization 与 model schema 往返。
- Playwright 前固定先构建 `@likec4/spa`，再构建 `xirang-likec4`。
- desktop 与 mobile 覆盖三个控件、Model/Authored 交互、diff、双向 edges 与 loading/error。
- 移动端必要操作不依赖 hover。

#### Checks

- [ ] C18 验证 Windows CI 路径行为
  - Verifies: `elements/semantic-browser.md` / Requirement "原子刷新基础 LikeC4 缓存" / Scenario "跨平台处理缓存路径"
  - Command: `pnpm exec vitest run test/core/model test/core/view.test.ts`
  - Evidence: Windows CI job 在 Node.js 22 上执行相同 schema、cache 与 watcher tests
  - Expect: Windows、Linux 与 macOS 使用相同 project-relative keys 和显式生成文件清单

- [ ] C19 执行 LikeC4 unit 与 typecheck
  - Verifies: `elements/visual-presentation.md` / Requirement "使用原生 LikeC4 布局管线" / Scenarios "呈现 Model 与等价 Authored View", "Graphviz 失败"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/overlays/element-details/*.spec.tsx src/xirang/*.spec.ts src/likec4diagram/xyflow-diagram/diagram-view.spec.ts && pnpm --filter @likec4/diagram typecheck`
  - Expect: Diagram unit/component tests 与 typecheck 全部通过

- [ ] C20 按正确顺序重建 Browser bundle
  - Verifies: `elements/semantic-browser.md` / Requirement "服务端计算 Runtime Projection" / Scenario "请求有效 projection"
  - Command: `cd likec4 && pnpm --filter @likec4/spa build && pnpm --filter xirang-likec4 build`
  - Expect: SPA 先完成构建，`xirang-likec4` 后嵌入最新 bundle，Playwright 不读取旧产物

- [ ] C21 执行 desktop/mobile Semantic Browser E2E
  - Verifies: `elements/semantic-browser.md` / Requirement "支持分层语义浏览" / Scenarios "下钻 Model 或 Authored View", "浏览 Element 详情"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts test/e2e/semantic-browser-navigation-history.spec.ts test/e2e/semantic-browser-node-presentation.spec.ts --project=desktop --project=mobile`
  - Expect: 两个 viewport 中控件、focus、展开、URL、presentation、diff 与详情无重叠、空白画布或 hover-only 阻塞

### Task 8: 记录一次性真实项目验证证据

**Goal**: 使用 screenAnswer 的等价 Model/Authored 内容验证真实 Graphviz 质量、HMR freshness、reciprocal routing 与三种模式，不创建长期截图基线。

**Files**:
- Test: `test/e2e/semantic-browser-model-view.spec.ts`
- Test: `test-results/`

**Requirements**:
- Model 与等价 Authored View 使用同一原生 LikeC4/Graphviz 质量。
- 模型 source 修改后无需重启即可更新画布。
- reciprocal edges 可视觉区分并独立选择。
- 三种 modes、REMOVED ghosts 与业务 presentation overlay 在 desktop/mobile 均可观察。

#### Checks

- [ ] C22 一次性验证等价 View 与 HMR
  - Verifies: `elements/semantic-browser.md` / Requirement "原子刷新基础 LikeC4 缓存" / Scenario "模型变化后刷新 Browser"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop --project=mobile`
  - Evidence: 保存 screenAnswer Model 与 `app-overview` 对照截图、模型修改前后 fingerprint/HMR 日志和非空 canvas 检查
  - Expect: 无需重启即可显示新内容，Model/Authored 不再因渲染路径不同产生网格与 routing 质量差异

- [ ] C23 一次性验证 Relationship edges 与 diff overlay
  - Verifies: `elements/visual-presentation.md` / Requirement "分离 Relationship Edges" / Scenarios "同时呈现两个方向", "同向 Relationships 具有不同 Kind presentation"
  - Evidence: 保存 reciprocal 与同向不同 Kind edges 的独立路径/箭头/点击详情，以及业务 style 与 ADDED/MODIFIED/REMOVED overlay 共存的 desktop/mobile 截图和 DOM/canvas assertions
  - Expect: 每个 source Relationship 均可见可选，颜色不是唯一 diff 通道，REMOVED ghost 可查看详情

- [ ] C24 验证三种 Presentation Mode 行为
  - Verifies: `elements/change-derived-views.md` / Requirement "呈现 Change 语义差异" / Scenarios "Complete with diff", "Diff only", "Complete"
  - Command: `pnpm exec vitest run test/core/view.test.ts && pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop --project=mobile`
  - Evidence: 保存三个 modes 的节点/edge identities、REMOVED ghosts、必要 context 与 diff overlay assertions
  - Expect: Complete 无 overlay，Complete with diff 保留完整目标上下文与联合图，Diff only 只保留差异及必要上下文

- [ ] C26 验证 Change 制品门禁
  - Verifies: `elements/derived-views.md` / Requirement "自动确定性推导" / Scenario "Change 与 View 组合改变"
  - Command: `pnpm xirang validate --change unify-semantic-browser-views --json && git diff --check`
  - Expect: combined Change validation 成功且无 whitespace error

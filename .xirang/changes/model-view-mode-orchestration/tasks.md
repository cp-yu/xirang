# model-view-mode-orchestration — Tasks

### Task 1: Manifest 构建层——per-source 实例解析与 version 5

**Goal**: runtime manifest 升级为 version 5：model source 更名 `full-model` 并更新 labels；candidate 与每个 change source 携带对各自 target Model 实例解析的 `authoredViews` 结果。

**Files**:
- Modify: `src/core/view.ts`
- Modify: `src/core/model/validator.ts`
- Test: `test/core/view.test.ts`

**Requirements**:
- `ViewRuntimeSnapshot.version` 升为 5；model source `id` 改为 `'full-model'`，label `'Full Model'`；candidate label `'Candidate'`。
- `ViewRuntimeCandidateSource` / `ViewRuntimeChangeDerivedView` 增 `authoredViews: Record<string, { title; selection; roots; virtualRoot }>`，构建期以 `resolveViewSelection(view, targetModel)` 对各自 target 实例生成；`include: '*'` 解析为实例全体元素，实例外 identity 不产生选择。
- 顶层 `authoredViews`（formal 解析）保持不变，服务 baseline。
- `validator.ts` 的 authored view 保留 identity 从 `'model'` 改为 `'full-model'`。

#### Checks

- [x] C1 manifest version 与 per-source 解析
  - Verifies: `elements/xirang-projection-service.md` / Requirement "使用分区 Runtime Manifest" / Scenario "Candidate 可用"
  - Command: `npx vitest run test/core/view.test.ts`
  - Expect: version 5、candidate/changes 携带实例级 `authoredViews`（`'*'` 扩集、实例外 identity 丢弃）的断言全绿
- [x] C2 保留 identity 更名
  - Verifies: `elements/full-model-view.md` / Requirement "提供唯一默认 Full Model" / Scenario "Authored View 使用保留 identity"
  - Command: `npx vitest run test/core/model/validator.test.ts`
  - Expect: 声明 identity `full-model` 被保留 identity 拒绝的校验用例通过

### Task 2: 服务端投影与 Contract 路由换 model 轴

**Goal**: 投影与 Contract 请求以 `model` 字段路由到 `manifest.model` / `manifest.candidate` / `manifest.changes[<identity>]`；authored view 投影使用 source 携带的实例级解析边界；删除 reserved `change === 'candidate'` 路由。

**Files**:
- Modify: `likec4/packages/vite-plugin/src/xirang/xirang-projection-handler.ts`
- Modify: `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.ts`
- Test: `likec4/packages/vite-plugin/src/xirang/xirang-projection-handler.spec.ts`
- Test: `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts`

**Requirements**:
- `ProjectionRequest` 增 `model: 'semantic-model' | 'candidate' | 'change'`（change 值携带 identity），`change` 语义删除；`parseProjectionRequest` 校验 `model` 并解析 `model=change:<identity>`。
- 路由按 `model` 三分支；diff-only union 与 Graphviz fallback 条件从 `request.change` 换为 `request.model`。
- authored view 分支的 boundary/roots/children 计算改用当前 source 的 `authoredViews`（baseline 用顶层 formal 解析），不再对非 baseline source 使用 formal 解析结果。
- Contract handler 按 `model` 路由 contracts（candidate → `manifest.candidate.contracts`，change → `manifest.changes[...]`）。

#### Checks

- [ ] C3 model 路由与三态一致
  - Verifies: `elements/xirang-projection-service.md` / Requirement "服务端计算 Runtime Projection" / Scenario "model 路由"
  - Command: `cd likec4/packages/vite-plugin && npx vitest run src/xirang/xirang-projection-handler.spec.ts`
  - Expect: 三分支路由、三态 Mode 逻辑一致、reserved candidate 路由不存在（grep 无 `change === 'candidate'`）的断言全绿
- [ ] C4 实例级 view 边界
  - Verifies: `elements/authored-views.md` / Requirement "对被浏览 Model 实例解析" / Scenario "实例外 identity 自然丢弃"
  - Command: `cd likec4/packages/vite-plugin && npx vitest run src/xirang/xirang-projection-handler.spec.ts`
  - Expect: authored view 对 candidate/change source 使用实例级边界（`'*'` 扩集、实例外 identity 不进 predicates）的用例通过
- [ ] C5 Contract 按 model 轴路由
  - Verifies: `elements/xirang-contract-delivery.md` / Requirement "通过 Contract 接口加载 Element Contract" / Scenario "加载 Candidate Contract"
  - Command: `cd likec4/packages/vite-plugin && npx vitest run src/xirang/xirang-contract-handler.spec.ts`
  - Expect: `source=candidate` / `source=change:<name>` 路由用例全绿，`source=change:candidate` reserved 编码无残留

### Task 3: 前端编排轴——controller、URL 与控件

**Goal**: Semantic Browser 前端状态机、URL 编解码、工具栏与首页全部切换到 Model × View × Mode 轴；View 下拉按当前 Model 实例解析结果过滤空解析项。

**Files**:
- Modify: `likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.tsx`
- Modify: `likec4/packages/likec4-spa/src/searchParams.ts`
- Modify: `likec4/packages/likec4-spa/src/routes/_single/single-index.tsx`
- Modify: `likec4/packages/diagram/src/xirang/ContractLoaderContext.tsx`
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`
- Test: `likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.spec.ts`
- Test: `likec4/packages/likec4-spa/src/searchParams.spec.ts`
- Test: `likec4/packages/diagram/src/xirang/ContractLoaderContext.spec.tsx`

**Requirements**:
- state `changeSelection` → `modelSelection`；action `change.select` → `model.select`；`validModels` = baseline / candidate（manifest 存在时）/ 各活动 change；`defaultMode`/`normalizeMode` 按 model 值（baseline 锁 `complete`、candidate 默认 `complete`、change 默认 `complete-with-diff`），删除 candidate 两态收敛。
- URL：`model` 参数（`candidate` / `change:<identity>`，baseline 省略）替换 `change`；`view` 默认 `'full-model'`；`canonicalSearchKey` 与深链恢复同步。
- 所选 Model 消失（manifest 不含该值）时回退 baseline、Mode 回 `complete`、清 focus/expanded。
- 工具栏三选择器（Model / View / Mode），View 下拉仅列对当前 Model 实例解析非空的项；首页 Candidate 卡 `model=candidate`、Change 卡 `model=change:<name>&mode=diff-only`；tooltip 与 fallback label 更新为 Full Model。

#### Checks

- [ ] C6 model 轴状态机
  - Verifies: `elements/semantic-browser.md` / Requirement "三维正交组合呈现状态" / Scenario "选择 Candidate 后切换 Mode"
  - Command: `cd likec4/packages/likec4-spa && npx vitest run src/xirang/SemanticBrowserController.spec.ts`
  - Expect: model 轴 clamp、按值默认 Mode、baseline 锁定、`model=` round-trip 用例全绿
- [ ] C7 空解析 View 过滤与收敛
  - Verifies: `elements/semantic-browser.md` / Requirement "三维正交组合呈现状态" / Scenario "空解析 View 不可选"
  - Verifies: `elements/semantic-browser.md` / Requirement "所选 Model 消失时收敛状态" / Scenario "Candidate 被 promote 后收敛"
  - Command: `cd likec4/packages/likec4-spa && npx vitest run src/xirang/SemanticBrowserController.spec.ts`
  - Expect: 下拉过滤与 Model 消失收敛用例全绿
- [ ] C8 URL schema 与前端 source 轴
  - Verifies: `elements/web.md` / Requirement "URL 编码导航状态并响应浏览器前进后退" / Scenario "控件变化"
  - Command: `cd likec4/packages/likec4-spa && npx vitest run src/searchParams.spec.ts && cd ../diagram && npx vitest run --no-isolate src/xirang/ContractLoaderContext.spec.tsx`
  - Expect: `model=` 编解码与 selected source 按 model 计算的用例全绿
- [ ] C9 diagram typecheck
  - Verifies: `elements/web.md` / Requirement "支持分层语义浏览" / Scenario "下钻 Full Model 或 Authored View"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck`
  - Expect: 类型检查通过

### Task 4: e2e 全量改写、测试数据 change 迁移与一次性验证

**Goal**: 浏览器端到端用例切换到 model 轴并覆盖 Candidate 三态；`test-change-derived-view` 的 Delta 目标迁移到 `full-model-view`；完成 bundle 重建与全链路验证。

**Files**:
- Modify: `test/e2e/semantic-browser-candidate-views.spec.ts`
- Modify: `test/e2e/semantic-browser-model-view.spec.ts`
- Modify: `test/e2e/semantic-browser-navigation-history.spec.ts`
- Modify: `test/e2e/browser-view-tree-export.spec.ts`
- Modify: `.xirang/changes/test-change-derived-view/elements/model-view.md`（重命名为 `full-model-view.md`）
- Modify: `.xirang/changes/test-change-derived-view/relationships/test-references.yaml`
- Modify: `.xirang/changes/test-change-derived-view/design.md`
- Modify: `.xirang/changes/test-change-derived-view/proposal.md`
- Test: `test/e2e/semantic-browser-candidate-views.spec.ts`

**Requirements**:
- e2e 深链与断言全面换 `?model=`；新增 Candidate `complete-with-diff`（target + overlay）用例；删除 `change=candidate`、两态收敛、`view=model` 旧断言。
- `test-change-derived-view` 全部制品中 `model-view` 引用改为 `full-model-view`（elements 单元重命名 + relationship target + proposal/design 措辞）。
- 按 skill 顺序重建 bundle（先 `@likec4/spa` 后 `xirang-likec4`）后运行 Playwright。

#### Checks

- [ ] C10 Candidate 三态浏览器验证
  - Verifies: `elements/xirang-diff-overlay.md` / Requirement "呈现语义差异视觉表达" / Scenario "Candidate complete-with-diff"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-candidate-views.spec.ts --project=desktop --project=mobile`
  - Expect: `model=candidate` 默认 `complete`、`complete-with-diff` 叠加差异标记、`diff-only` 保留 removed ghosts 全绿
- [ ] C11 model 轴浏览与导航
  - Verifies: `elements/web.md` / Requirement "提供三维独立控制" / Scenario "三维独立切换"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts test/e2e/semantic-browser-navigation-history.spec.ts --project=desktop --project=mobile`
  - Expect: 三控件独立切换、URL 深链恢复、breadcrumb/focus 行为全绿
- [ ] C12 测试数据 change 迁移完整
  - Verifies: `elements/full-model-view.md` / Requirement "提供唯一默认 Full Model" / Scenario "打开项目模型"
  - Command: `grep -rn "model-view" .xirang/changes/test-change-derived-view/ | grep -v "full-model-view" || echo "clean"`
  - Expect: `clean`（无旧 `model-view` 残留引用，迁移后目标 identity 为 `full-model-view`）
  - Command: `pnpm xirang validate --change test-change-derived-view --json`
  - Expect: PASS
- [ ] C13 全链路一次性验证（One-time Verification）
  - Verifies: `elements/web.md` / Requirement "呈现 Model 目标与差异" / Scenario "Complete with diff 模式"
  - Command: `cd likec4 && pnpm --filter @likec4/spa build && pnpm --filter xirang-likec4 build`
  - Command: `pnpm exec playwright test test/e2e/ --project=desktop --project=mobile`
  - Expect: 全部 e2e 通过；对 `test/fixtures/contract-browser` candidate fixture 目视核查空解析 View 隐藏与 Full Model label（截图留档）

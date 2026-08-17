# Implementation Tasks

## 任务编排原则

每个任务为独立可验证的端到端闭环，覆盖该语义单元的生产代码、类型、单测与 e2e 验证。任务之间按依赖顺序串行，单任务内并行实现。

---

### Task 1: 统一 Candidate source 结构与 manifest

**Goal**: 删除 `candidateDiff` 独立字段，合并为单一 `candidate` source，结构与 Change source 对齐。

**Files**:
- Modify: `src/core/view.ts`
- Modify: `likec4/packages/vite-plugin/src/plugin.ts`
- Modify: `likec4/packages/vite-plugin/src/xirang/xirang-projection-handler.ts`
- Modify: `likec4/packages/likec4-spa/src/routes/_single/single-index.tsx`
- Modify: `likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.tsx`
- Test: `test/core/view.test.ts`

**Requirements**:
- xirang-projection-service#使用分区 Runtime Manifest

#### Checks

- [x] C1 删除 `ViewRuntimeCandidateDiffView` 类型
  - Verifies: `elements/xirang-projection-service.md` / Requirement "使用分区 Runtime Manifest" / Scenario "Candidate 可用"
  - Command: `cd likec4 && pnpm exec tsc --noEmit --project packages/likec4-spa/tsconfig.json`
  - Expect: manifest 类型无 `candidateDiff` 字段,`candidate` 字段包含 `diff`、`diffArchitecture`、`diffLikec4Sources`,无编译错误

- [x] C2 `buildCandidateSources` 返回单一对象
  - Verifies: `elements/xirang-projection-service.md` / Requirement "使用分区 Runtime Manifest" / Scenario "Candidate 可用"
  - Command: `pnpm exec vitest run test/core/view.test.ts`
  - Expect: 单测覆盖返回对象包含 `diff`、`diffArchitecture`、`diffLikec4Sources`,无独立 `candidateDiff` 返回,单测通过

- [x] C3 Controller 移除 candidateSources 分组逻辑
  - Verifies: `elements/semantic-browser.md` / Requirement "Candidate 作为 Change Selection 特殊选项" / Scenario "首页 Candidate 入口"
  - Command: `cd likec4 && pnpm --filter @likec4/spa test SemanticBrowserController`
  - Expect: candidateSources 过滤逻辑已删除,candidate 直接作为 Change Selection 选项,单测通过

---

### Task 2: 实现 `change: 'candidate'` 路由逻辑

**Goal**: 服务端 projection handler 识别 `request.change === 'candidate'` 并路由到 `manifest.candidate`。

**Files**:
- Modify: `likec4/packages/vite-plugin/src/xirang/xirang-projection-handler.ts`
- Test: `likec4/packages/vite-plugin/src/xirang/xirang-projection-handler.spec.ts`

**Requirements**:
- xirang-projection-service#服务端计算 Runtime Projection

#### Checks

- [x] C1 `change: 'candidate'` 路由到 candidate source
  - Verifies: `elements/xirang-projection-service.md` / Requirement "服务端计算 Runtime Projection" / Scenario "change=candidate 路由"
  - Command: `cd likec4 && pnpm --filter @likec4/vite-plugin test xirang-projection-handler`
  - Expect: 单测验证 `request.change === 'candidate'` 时使用 `manifest.candidate.likec4Sources` 作为 base,而非 `manifest.changes['candidate']`,覆盖 candidate 三态 mode 路由,单测通过

- [x] C2 陈旧 `effectiveModeForSource` 逻辑已删除
  - Verifies: `elements/xirang-projection-service.md` / Requirement "服务端计算 Runtime Projection" / Scenario "change=candidate 路由"
  - Command: `cd likec4 && pnpm exec grep -r "candidate-diff" packages/vite-plugin/src/ packages/likec4-spa/src/`
  - Expect: 无 `candidate-diff` 字符串残留

---

### Task 3: Semantic Browser 三维控件编排

**Goal**: Browser 端实现 View Selection、Change Selection（含 `candidate` 选项）、Presentation Mode 三维正交控件，默认 `complete-with-diff`。

**Files**:
- Modify: `likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.tsx`
- Modify: `likec4/packages/likec4-spa/src/routes/_single/single-index.tsx`
- Modify: `likec4/packages/likec4-spa/src/searchParams.ts`
- Modify: `likec4/packages/likec4-spa/src/routes/__root.tsx`
- Test: `likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.spec.ts`
- Test: `likec4/packages/likec4-spa/src/searchParams.spec.ts`

**Requirements**:
- semantic-browser#三维正交组合呈现状态
- semantic-browser#Candidate 作为 Change Selection 特殊选项

#### Checks

- [x] C1 Change Selection 显示 Candidate 选项
  - Verifies: `elements/semantic-browser.md` / Requirement "Candidate 作为 Change Selection 特殊选项" / Scenario "首页 Candidate 入口"
  - Command: `cd likec4 && pnpm --filter @likec4/spa test SemanticBrowserController`
  - Expect: Change Selection 从 `manifest.changes` 与 `manifest.candidate` 构建选项列表,candidate 选项以 `'candidate'` 作为 identity,单测通过

- [x] C2 Mode 控件在选中 Candidate 时解锁
  - Verifies: `elements/semantic-browser.md` / Requirement "三维正交组合呈现状态" / Scenario "选择 Candidate 后切换 Mode"
  - Command: `cd likec4 && pnpm --filter @likec4/spa exec vitest run --no-isolate -t "Candidate.*mode"`
  - Expect: 单测验证 `change=candidate` 时 Mode 控件可用,默认 `complete-with-diff`,单测通过

- [x] C3 URL 状态编解码
  - Verifies: `elements/semantic-browser.md` / Requirement "三维正交组合呈现状态" / Scenario "选择 Candidate 后切换 Mode"
  - Command: `cd likec4 && pnpm --filter @likec4/spa exec vitest run --no-isolate -t "URL.*candidate"`
  - Expect: 单测验证 `change=candidate` URL 参数映射到 `manifest.candidate`,单测通过

---

### Task 4: Diff Overlay 统一处理 Change 与 Candidate

**Goal**: `xirang-diff-overlay` 对 `change: 'candidate'` 与普通 Change 使用统一的差异标记逻辑。

**Files**:
- Modify: `likec4/packages/diagram/src/xirang/ContractLoaderContext.tsx`
- Test: `likec4/packages/diagram/src/xirang/xirang-diff-overlay.spec.ts`

**Requirements**:
- xirang-diff-overlay#呈现语义差异视觉表达

#### Checks

- [x] C1 Diff overlay 不区分 candidate 与 change
  - Verifies: `elements/xirang-diff-overlay.md` / Requirement "呈现语义差异视觉表达" / Scenario "Candidate complete-with-diff"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram test xirang-diff-overlay`
  - Expect: 单测验证 `change='candidate'` 时 diff badge、outline、dim 逻辑与普通 Change 完全一致,单测通过

---

### Task 5: 首页入口更新

**Goal**: 首页 Candidate 卡片以 `change=candidate&mode=complete-with-diff` 打开。

**Files**:
- Modify: `likec4/packages/likec4-spa/src/routes/_single/single-index.tsx`

**Requirements**:
- web#首页提供 Candidate 与活动 Change 快速入口

#### Checks

- [x] C1 首页 Candidate 入口生成正确 URL
  - Verifies: `elements/web.md` / Requirement "首页提供 Candidate 与活动 Change 快速入口" / Scenario "点击 Candidate 卡片"
  - Command: `cd likec4 && pnpm --filter @likec4/spa exec vitest run --no-isolate -t "首页.*Candidate"`
  - Expect: 单测验证 Candidate 卡片 href 为 `...?change=candidate&mode=complete-with-diff`,单测通过

---

### Task 6: 端到端验证与陈旧代码清理

**Goal**: Playwright e2e 验证完整交互流程，删除所有 `candidate-diff` 陈旧代码。

**Files**:
- Modify: `test/e2e/semantic-browser-candidate-views.spec.ts`
- Modify: `test/e2e/semantic-browser-model-view.spec.ts`
- Modify: `likec4/packages/diagram/src/xirang/ContractLoaderContext.tsx`
- Modify: `likec4/packages/diagram/src/xirang/ContractLoaderContext.spec.tsx`
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ContractsTab.tsx`
- Modify: `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.ts`
- Modify: `likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts`
- Modify: `likec4/packages/likec4-spa/src/xirang/HttpContractLoader.spec.ts`
- Modify: `playwright.config.ts`

**Requirements**:
- semantic-browser#三维正交组合呈现状态
- web#呈现 Candidate 目标与差异

#### Checks

- [x] C1 重写 Candidate e2e 测试
  - Verifies: `elements/web.md` / Requirement "呈现 Candidate 目标与差异" / Scenario "审查 Candidate 差异"
  - Command: `pnpm test:e2e -- semantic-browser-candidate`
  - Expect: e2e 验证用户选择 `change=candidate` 后可在三态 mode 间切换,diff badge 正确显示,removed ghosts 在 `diff-only` 可见,e2e 通过

- [x] C2 删除 ContractLoaderContext 的 candidate-diff 分支
  - Verifies: `elements/xirang-diff-overlay.md` / REMOVED Requirement "固定呈现 Candidate diff-only 差异"
  - Command: `cd likec4 && pnpm exec grep -n "candidate-diff" packages/diagram/src/xirang/ContractLoaderContext.tsx`
  - Expect: 无匹配结果

- [x] C3 删除 xirang-contract-handler 的 candidate-diff 路由
  - Verifies: `elements/xirang-diff-overlay.md` / REMOVED Requirement "固定呈现 Candidate diff-only 差异"
  - Command: `cd likec4 && pnpm exec grep -n "candidate-diff" packages/vite-plugin/src/xirang/xirang-contract-handler.ts`
  - Expect: 无匹配结果

- [x] C4 全仓库清理 candidate-diff 残留
  - Verifies: `elements/xirang-diff-overlay.md` / REMOVED Requirement "固定呈现 Candidate diff-only 差异"
  - Command: `pnpm exec grep -r "candidate-diff" --include="*.ts" --include="*.tsx" likec4/packages/ src/ test/`
  - Expect: 仅注释或文档中提及历史,无功能代码

---

### Task 7: 类型安全与构建验证

**Goal**: 全仓库 TypeScript 编译通过，无类型错误。

**Files**:
- Test: 所有 TypeScript 源码

**Requirements**:
- xirang-projection-service#使用分区 Runtime Manifest
- semantic-browser#三维正交组合呈现状态

#### Checks

- [x] C1 likec4 monorepo 类型检查
  - Verifies: `elements/xirang-projection-service.md` / Requirement "使用分区 Runtime Manifest" / Scenario "Candidate 可用"
  - Command: `cd likec4 && pnpm exec tsc --noEmit --project tsconfig.json`
  - Expect: 无类型错误,编译通过

- [x] C2 根仓库类型检查
  - Verifies: `elements/semantic-browser.md` / Requirement "三维正交组合呈现状态" / Scenario "选择 Candidate 后切换 Mode"
  - Command: `pnpm exec tsc --noEmit`
  - Expect: 无类型错误,编译通过

- [x] C3 构建所有包
  - Verifies: `elements/web.md` / Requirement "呈现 Candidate 目标与差异" / Scenario "审查 Candidate 差异"
  - Command: `cd likec4 && pnpm --filter @likec4/spa build && pnpm --filter xirang-likec4 build`
  - Expect: SPA 与 plugin 包构建成功,构建通过

## Required Corrections

### [artifact_fix] 校正 Task 1 Files 与命令

Task 1 声明的 `types.ts` 与 `buildCandidateSources.ts` 路径不存在；实际改动位于 `src/core/view.ts`、`test/core/view.test.ts` 与 `likec4/packages/vite-plugin/src/plugin.ts`。C2 声明的命令 filter `xirang-likec4` 下无对应测试，实际覆盖为根仓库 `pnpm exec vitest run test/core/view.test.ts`。

- [x] Task 1 Files 更正为 `src/core/view.ts`、`test/core/view.test.ts`、`likec4/packages/vite-plugin/src/plugin.ts`，C2 Command 更正为 `pnpm exec vitest run test/core/view.test.ts`
  - Verifies: `elements/xirang-projection-service.md` / Requirement "使用分区 Runtime Manifest" / Scenario "Candidate 可用"
  - Command: `sed -n '1,/## Required Corrections/p' .xirang/changes/unify-candidate-change-modes/tasks.md | grep -cE "src/core/view.ts|test/core/view.test.ts|packages/vite-plugin/src/plugin.ts"`
  - Expect: 计数大于 0，且 Task 1 C2 Command 为 `pnpm exec vitest run test/core/view.test.ts`

### [artifact_fix] 扩展 web Delta 授权 Change complete-with-diff 使用 target sources

实现将 Change 的 `complete-with-diff` 从 union sources 切换为 change-only target sources，但 web 的现有 Requirement「呈现 Change 目标与差异」仍要求 REMOVED objects 以 ghost 保留于 complete-with-diff，二者矛盾。Delta 需 MODIFIED 该 Requirement（target-only complete-with-diff；REMOVED ghosts 仅在 diff-only 的 union sources 中保留），并同步 MODIFIED 仍引用 Candidate View 的「支持分层语义浏览」「focus 失效时确定性回退」。

- [x] web Delta 增加 MODIFIED「呈现 Change 目标与差异」「支持分层语义浏览」「focus 失效时确定性回退」，proposal 同步更新
  - Verifies: `elements/web.md` / Requirement "呈现 Change 目标与差异" / Scenario "Complete with diff 模式"
  - Command: `xirang validate --change unify-candidate-change-modes --json`
  - Expect: 校验通过,web Delta 包含上述三条 MODIFIED Requirement,proposal 不再声明未修改的「协调 View Selection 运行时状态」

### [artifact_fix] 重写 design.md Decision 3 与 Non-Goals

design.md Decision 3 要求在 complete-with-diff 下通过 overlay 注入 removed ghosts，Non-Goals 声明不改变 Change-derived View 的三态行为；实现按 Semantic Delta 使用 target-only sources 且未实现 overlay ghost 注入。design.md 需改写为授权 target-only complete-with-diff（ghosts 仅在 diff-only 经 union sources 保留），并删除对 ghost 注入能力的依赖。

- [x] design.md Decision 3、Non-Goals、Risks 改写为 target-only complete-with-diff 语义
  - Verifies: `elements/xirang-diff-overlay.md` / Requirement "呈现语义差异视觉表达" / Scenario "Candidate complete-with-diff"
  - Command: `grep -n "以虚线节点\|不改变 Change-derived View 的三态行为" .xirang/changes/unify-candidate-change-modes/design.md`
  - Expect: 无匹配结果,design.md 与 Semantic Delta 一致且含偏差说明

### [code_fix] 补充 Candidate promote 收敛场景单测

semantic-browser#Candidate 生命周期变化时收敛状态 的「Candidate 被 promote 后收敛」场景无测试。需在 SemanticBrowserController.spec.ts 增加单测：state 为 `change=candidate` 时对不含 `candidate` 字段的 manifest 执行 reconcile，断言 Change Selection 回到 None、Mode 回到 complete、expanded 清空。

- [x] SemanticBrowserController.spec.ts 增加 promote 收敛单测，`pnpm --filter @likec4/spa test SemanticBrowserController` 通过
  - Verifies: `elements/semantic-browser.md` / Requirement "Candidate 生命周期变化时收敛状态" / Scenario "Candidate 被 promote 后收敛"
  - Command: `cd likec4 && pnpm --filter @likec4/spa test SemanticBrowserController`
  - Expect: 单测断言 changeSelection=null、presentationMode=complete、expanded 为空,单测通过

### [artifact_fix] 补齐 Task 3/4/5/6 的 Files 归属与命令

以下改动文件未在任何任务 Files 中声明：`likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`、`likec4/packages/diagram/src/overlays/element-details/ContractsTab.tsx`、`likec4/packages/diagram/src/xirang/ContractLoaderContext.spec.tsx`、`likec4/packages/diagram/src/xirang/xirang-diff-overlay.spec.ts`、`likec4/packages/likec4-spa/src/xirang/HttpContractLoader.spec.ts`、`likec4/packages/vite-plugin/src/xirang/xirang-contract-handler.spec.ts`、`test/e2e/semantic-browser-model-view.spec.ts`、`playwright.config.ts`。Task 3/5 声明了不存在的 `types.ts`、`routes/index.tsx`。

- [x] Task 3 Files 替换 `types.ts` 为 `SemanticBrowserController.spec.ts`；Task 4 Files 替换 overlay/types 路径为 `ContractLoaderContext.tsx` 与 `xirang-diff-overlay.spec.ts`；Task 5 Files 替换为 `_single/single-index.tsx`；Task 6 Files 增加 DiagramUI.tsx、ContractsTab.tsx 及上述 4 个 spec 与 playwright.config.ts
  - Verifies: `elements/xirang-diff-overlay.md` / Requirement "呈现语义差异视觉表达" / Scenario "Candidate complete-with-diff"
  - Command: `sed -n '1,/## Required Corrections/p' .xirang/changes/unify-candidate-change-modes/tasks.md | grep -nE "xirang/types.ts|overlays/xirang-diff-overlay|routes/index.tsx|buildCandidateSources.ts"`
  - Expect: 无匹配结果,各任务 Files 均为真实存在路径

### [artifact_fix] 修正 Check 命令的测试 filter

Task 2 C1 声明命令 `pnpm --filter xirang-likec4 test xirang-projection-handler` 在该 filter 下无测试文件（exit 1）；正确 filter 为 `@likec4/vite-plugin`。Task 3 C2/C3 与 Task 5 C1 的 `-- --grep` 参数在 vitest 4 中不生效，应改用 `-t/--testNamePattern`。

- [x] Task 2 C1 Command 更正为 `cd likec4 && pnpm --filter @likec4/vite-plugin test xirang-projection-handler`；Task 3 C2/C3、Task 5 C1 更正为 `cd likec4 && pnpm --filter @likec4/spa exec vitest run --no-isolate -t "..."`
  - Verifies: `elements/xirang-projection-service.md` / Requirement "服务端计算 Runtime Projection" / Scenario "change=candidate 路由"
  - Command: `sed -n '1,/## Required Corrections/p' .xirang/changes/unify-candidate-change-modes/tasks.md | grep -nE "xirang-likec4 test|--grep"`
  - Expect: 无匹配结果

### [artifact_fix] 补齐 Delta 与 proposal 的 contract-delivery 与残留引用

proposal 声明修改 xirang-contract-delivery#通过 Contract 接口加载 Element Contract，但 Delta 缺该条目；模型仍强制 `source=candidate-diff`，与已删除的实现矛盾。另 xirang-diff-overlay#合并呈现 Requirement 差异 与 xirang-projection-service#分层呈现 Element Definition 仍引用 Candidate Diff View，需 MODIFIED。

- [x] 新增 `elements/xirang-contract-delivery.md`（删除 候选 Diff Contract 场景、`change=candidate` 路由至 `manifest.candidate.contracts`）；xirang-diff-overlay 与 xirang-projection-service Delta 各补一条 MODIFIED；proposal 同步
  - Verifies: `elements/xirang-contract-delivery.md` / Requirement "通过 Contract 接口加载 Element Contract" / Scenario "加载 Candidate Contract"
  - Command: `xirang validate --change unify-candidate-change-modes --json`
  - Expect: 校验通过,Delta 与 proposal 均覆盖 xirang-contract-delivery 修改


### [code_fix] URL 解码缺失 mode 参数时强制为 complete

URL 解码缺失 mode 参数时（encode 对 complete-with-diff 省略 mode 的规范默认 URL `?change=candidate`），URL apply 分支用 zod 默认值 `complete` 覆盖默认 Mode，重载翻转状态且同步锁卡死，后续 mode 变更不再写入 URL。修复：zod schema 不再为 mode 提供 `complete` 默认（改为 optional+catch undefined），根路由 stripSearchParams 不再剥离 mode；URL apply 仅在原始 URL 显式携带 mode 时采用该值，否则保留 `defaultMode(change)` 的 complete-with-diff；为 `?change=candidate` 深链回环补 controller 单测与 e2e。

- [x] URL apply 分支按 `search.mode ?? defaultMode(change)` 解码，normalization 同步，controller 单测与 e2e 深链回环通过
  - Verifies: `elements/semantic-browser.md` / Requirement "三维正交组合呈现状态" / Scenario "选择 Candidate 后切换 Mode"
  - Command: `cd likec4 && pnpm --filter @likec4/spa test SemanticBrowserController searchParams`
  - Expect: 单测通过,`?change=candidate` 解码为 complete-with-diff

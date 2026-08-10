### Task 1: overlay 对 unchanged 节点与边施加 25% 透明度

**Goal**: 在 `applyXirangPresentationOverlay` 中，diff overlay 激活时（`source.diff` 存在）将 unchanged 节点与关系边压至 25% 透明度，ADDED/MODIFIED 保持 100%，REMOVED 保持 45% ghost。

**Files**:
- Modify: `likec4/packages/diagram/src/xirang/architectureView.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/xyflow-diagram/diagram-view.ts`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`
- Test: `likec4/packages/diagram/src/likec4diagram/xyflow-diagram/diagram-view.spec.ts`

**Requirements**:
- diff overlay 激活时 unchanged 节点以 25% 透明度且无 outline 呈现
- ADDED/MODIFIED 节点保持 100% 透明度
- REMOVED 节点保持 45% ghost 透明度
- unchanged 关系边以 25% 透明度呈现，changed 关系边保持现有徽标

#### Checks

- [x] C1 Verify unchanged 节点透明度
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/xirang/architectureView.spec.ts`
  - Expect: diff 存在时无 operation 的节点 `style.opacity` 为 25

- [x] C2 Verify ADDED/MODIFIED 节点透明度保持
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/xirang/architectureView.spec.ts`
  - Expect: ADDED 与 MODIFIED 节点 `style.opacity` 保持 100

- [x] C3 Verify REMOVED 节点透明度保持
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/xirang/architectureView.spec.ts`
  - Expect: REMOVED 节点 `style.opacity` 仍为 45

- [x] C4 Verify unchanged 关系边透明度
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "关系边视觉区分"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/xirang/architectureView.spec.ts`
  - Expect: diff 存在时无 operation 的关系边 `style.opacity` 为 25

### Task 2: 节点容器按 operation 施加 outline 三态视觉

**Goal**: 复用 `compoundHasDrifts` 的 CSS outline 机制，按 `data.xirang.operation` 给 ElementNode / DeploymentNode / CompoundElementNode / CompoundDeploymentNode 容器挂 3 个 outline class：ADDED 点线、MODIFIED 加粗、REMOVED 虚线；unchanged 节点无 outline。

**Files**:
- Modify: `likec4/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx`
- Modify: `likec4/packages/diagram/src/likec4diagram/custom/nodes/index.tsx`
- Modify: `likec4/packages/diagram/src/likec4diagram/custom/nodes/CompoundActions.tsx`
- Modify: `likec4/packages/diagram/src/base-primitives/element/ElementNodeContainer.tsx`（叶节点按 `data.style.opacity` 渲染透明度，供 REMOVED ghost 与 unchanged 25% 生效）
- Modify: `test/e2e/semantic-browser-model-view.spec.ts`
- Modify: `playwright.config.ts`（新增四态用例 grep 到 desktop/mobile 白名单）
- Modify: `test/e2e/semantic-browser-image-export.spec.ts`（fixture 新增 assistant 元素后更新可见节点集合断言）

**Requirements**:
- ADDED 节点以点线 outline 呈现
- MODIFIED 节点以加粗 outline 呈现
- REMOVED 节点以虚线 outline 呈现
- unchanged 节点无 outline

#### Checks

- [x] C5 Verify 重建 bundle
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `cd likec4 && pnpm --filter @likec4/spa build && pnpm --filter xirang-likec4 build`
  - Expect: 先 `@likec4/spa` 后 `xirang-likec4`，两个 build 均成功

- [x] C6 Verify ADDED 节点点线 outline
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop`
  - Expect: `complete-with-diff` 下 ADDED 节点计算样式 outlineStyle 为 dotted

- [x] C7 Verify MODIFIED 节点加粗 outline
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop`
  - Expect: MODIFIED 节点计算样式 outlineStyle 为 solid 且 outlineWidth 大于 ADDED/unchanged

- [x] C8 Verify REMOVED 节点虚线 outline 与 ghost
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop`
  - Expect: REMOVED 节点计算样式 outlineStyle 为 dashed 且 opacity 为 0.45

- [x] C9 Verify unchanged 节点与边视觉
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分" / Scenario "关系边视觉区分"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop`
  - Expect: unchanged 节点 opacity 为 0.25 且无 outline；unchanged 关系边 opacity 为 0.25

### Task 3: 全链路回归验证

**Goal**: 完成 typecheck、桌面 + 移动端 Playwright 全过，以及 Change 派生视图的语义模型校验，确认无回归。

**Files**:
- Test: `test/e2e/semantic-browser-model-view.spec.ts`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`
- Modify: `test/fixtures/contract-browser/.xirang/model/elements/capability.assistant.md`（新增 unchanged 元素，提供 drill 子树内 unchanged 关系边）
- Modify: `test/fixtures/contract-browser/.xirang/model/relationships/invokes.yaml`（新增 assistant→leaf unchanged 关系）
- Modify: `test/fixtures/contract-browser/.xirang/changes/browser-change/elements/capability.leaf.md`（使 leaf 声明真正 MODIFIED）

**Requirements**:
- 既有测试全部保持有效，不迁就新行为
- 桌面与移动端均通过

#### Checks

- [x] C10 Verify typecheck
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "无 diff 时默认呈现"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck`
  - Expect: typecheck 通过

- [x] C11 Verify 桌面与移动端 e2e 全过
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "Complete with diff 模式"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop --project=mobile`
  - Expect: 全部用例通过（含既有 diff 交互用例）

- [x] C12 Verify fixture 语义模型校验
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "Diff only 模式"
  - Command: `cd test/fixtures/contract-browser && node ../../../bin/xirang.js validate --change browser-change --json`
  - Expect: 校验 PASS，无 ERROR

## Required Corrections

- [x] [code_fix] ElementNodeContainer 在非 diff 模式下把 LikeC4 默认 style.opacity=15 泄漏为 0.15 渲染，违反"无 diff 时默认呈现"；已改为仅当 opacity 非默认值且 <100 时应用，需补 complete 模式渲染断言并重验
- [x] [artifact_fix] `diagram-view.spec.ts` 已新增边 opacity 透传用例但未声明在 Task 1 Files；已补充声明
- [x] [artifact_fix] `playwright.config.ts`、`semantic-browser-image-export.spec.ts`、fixture `capability.assistant.md`/`invokes.yaml`/`capability.leaf.md` 未声明在 Task 2/3 Files；已补充声明

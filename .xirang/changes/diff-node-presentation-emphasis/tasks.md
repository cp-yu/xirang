### Task 1: outline 改用橙黄并加粗强化线形

**Goal**: 在 `nodes.tsx` 的 `diffOutline` 中把 outline 颜色改为橙黄 `#ff9f0a`，ADDED 3px 点线、MODIFIED 5px 实线、REMOVED 3px 虚线，outline-offset 提升到 8px，使 changed 节点描边在图上清晰可见。

**Files**:
- Modify: `likec4/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx`

**Requirements**:
- ADDED 节点以 3px 橙黄点线 outline 呈现
- MODIFIED 节点以 5px 橙黄实线 outline 呈现且宽于 ADDED
- REMOVED 节点以 3px 橙黄虚线 outline 呈现

#### Checks

- [x] C1 Verify ADDED outline 橙黄点线
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop`
  - Expect: ADDED 节点 outlineStyle 为 dotted、outlineWidth 3px、outlineColor 为 `#ff9f0a` 解析色

- [x] C2 Verify MODIFIED outline 加粗实线
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop`
  - Expect: MODIFIED 节点 outlineStyle 为 solid、outlineWidth 5px 且大于 ADDED

- [x] C3 Verify REMOVED outline 橙黄虚线
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop`
  - Expect: REMOVED 节点 outlineStyle 为 dashed、outlineWidth 3px、outlineColor 为 `#ff9f0a` 解析色

### Task 2: 新增节点 diff 徽标（左上角 100% 醒目）

**Goal**: 在 `nodes.tsx` 新增 `NodeDiffBadge` 纯呈现组件，按 `data.xirang.operation` 在 ElementNode / DeploymentNode / CompoundElementNode / CompoundDeploymentNode 容器左上角渲染 `+`/`~`/`−` 徽标（橙黄底白字、`data-xirang-node-diff`、`pointer-events: none`），徽标以 100% 透明度呈现（REMOVED 宿主 45% ghost 时仍醒目）。

**Files**:
- Modify: `likec4/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx`

**Requirements**:
- ADDED 节点在左上角呈现 `+` 徽标
- MODIFIED 节点在左上角呈现 `~` 徽标
- REMOVED 节点在左上角呈现 `−` 徽标且徽标保持 100% 透明度
- unchanged 节点不呈现任何徽标

#### Checks

- [x] C4 Verify ADDED `+` 徽标
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop`
  - Expect: ADDED 节点容器内 `[data-xirang-node-diff]` 徽标文本为 `+` 且可见

- [x] C5 Verify MODIFIED `~` 徽标
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop`
  - Expect: MODIFIED 节点容器内 `[data-xirang-node-diff]` 徽标文本为 `~` 且可见

- [x] C6 Verify REMOVED `−` 徽标 100% 醒目
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop`
  - Expect: REMOVED 节点整体 opacity 0.45 时，其 `[data-xirang-node-diff]` 徽标 computed opacity 为 1

### Task 3: 全链路回归验证

**Goal**: 更新四态 e2e 断言（outline 线宽/颜色 + 徽标 + complete 模式无徽标），完成 typecheck、重建 bundle、桌面 + 移动端全过，确认无回归。

**Files**:
- Modify: `test/e2e/semantic-browser-model-view.spec.ts`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`

**Requirements**:
- 既有测试全部保持有效，不迁就新行为
- 桌面与移动端均通过

#### Checks

- [x] C7 Verify typecheck
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "无 diff 时默认呈现"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck`
  - Expect: typecheck 通过

- [x] C8 Verify 重建 bundle 与桌面 + 移动端 e2e 全过
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "Complete with diff 模式"
  - Command: `cd likec4 && pnpm --filter @likec4/spa build && pnpm --filter xirang-likec4 build && pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop --project=mobile`
  - Expect: 先 `@likec4/spa` 后 `xirang-likec4` 两个 build 成功，桌面与移动端全部用例通过

- [x] C9 Verify fixture 语义模型校验
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "Diff only 模式"
  - Command: `cd test/fixtures/contract-browser && node ../../../bin/xirang.js validate --change browser-change --json`
  - Expect: 校验 PASS，无 ERROR

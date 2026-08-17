### Task 1: Candidate 两态呈现

**Goal**: Candidate 仅提供 `complete` / `diff-only` 并默认 `complete`，非法 `complete-with-diff` 收敛，首页与深链同步；删除 Candidate 对该 Mode 的可达状态与测试。

**Files**:
- Modify: `likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.tsx`
- Modify: `likec4/packages/likec4-spa/src/routes/_single/single-index.tsx`
- Modify: `likec4/packages/likec4-spa/src/searchParams.ts`
- Modify: `playwright.config.ts`
- Test: `likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.spec.ts`
- Test: `likec4/packages/likec4-spa/src/searchParams.spec.ts`
- Test: `test/e2e/semantic-browser-candidate-views.spec.ts`

**Requirements**:
- `defaultMode('candidate')` 返回 `complete`，普通活动 Change 仍返回 `complete-with-diff`
- Candidate 的 Mode 选项不列出 `complete-with-diff`；`change=candidate&mode=complete-with-diff` 在 Controller clamp 为 `complete`
- URL 省略当前 Change Selection 的 `defaultMode`，首页 Candidate 卡片只写 `change=candidate`
- 改写并删除假定 Candidate 默认或可选 `complete-with-diff` 的单测与 e2e，不删除 Change 的 `complete-with-diff` 实现
- 不修改投影 handler 的源选择算法

#### Checks

- [x] C1 验证 Candidate 默认 Mode 与非法组合收敛
  - Verifies: `elements/semantic-browser.md` / Requirement "三维正交组合呈现状态" / Scenario "选择 Candidate 后切换 Mode", "非法 Candidate Mode 收敛"
  - Command: `cd likec4 && CI=true pnpm --filter @likec4/spa test SemanticBrowserController searchParams`
  - Expect: Candidate 默认 `complete`，`complete-with-diff` 不在选项中，非法 mode 收敛为 `complete`，`?change=candidate` 解码为 `complete`，单测通过

- [x] C2 验证首页 Candidate 入口省略 mode
  - Verifies: `elements/web.md` / Requirement "首页提供 Candidate 与活动 Change 快速入口" / Scenario "点击 Candidate 卡片"
  - Command: `cd likec4 && CI=true pnpm --filter @likec4/spa test SemanticBrowserController`
  - Expect: 首页 Candidate 状态为 `change=candidate` 且不含 `mode`，单测通过

- [x] C3 验证 Candidate complete 无 overlay
  - Verifies: `elements/web.md` / Requirement "呈现 Candidate 目标与差异" / Scenario "浏览 Candidate 目标模型"
  - Command: `pnpm test:e2e -- semantic-browser-candidate`
  - Expect: 打开 Candidate 后 Mode 为 `complete`，无 `data-xirang-node-diff`，e2e 通过

- [x] C4 验证 Candidate diff-only 保留 REMOVED ghost
  - Verifies: `elements/xirang-diff-overlay.md` / Requirement "呈现语义差异视觉表达" / Scenario "Candidate diff-only"
  - Command: `pnpm test:e2e -- semantic-browser-candidate`
  - Expect: `mode=diff-only` 下 REMOVED 节点可见且带 `data-xirang-operation=REMOVED`，e2e 通过

- [x] C5 验证旧 complete-with-diff 深链收敛
  - Verifies: `elements/web.md` / Requirement "呈现 Candidate 目标与差异" / Scenario "非法 Candidate complete-with-diff 收敛"
  - Command: `pnpm test:e2e -- semantic-browser-candidate`
  - Expect: 打开 `?change=candidate&mode=complete-with-diff` 后 Mode 为 `complete` 且无差异标记，e2e 通过

- [x] C6 验证 Candidate complete-with-diff 测试与入口已删除
  - Verifies: `elements/semantic-browser.md` / Requirement "三维正交组合呈现状态" / Scenario "选择 Candidate 后切换 Mode"
  - Command: `rg -n "complete-with-diff" test/e2e/semantic-browser-candidate-views.spec.ts likec4/packages/likec4-spa/src/routes/_single/single-index.tsx likec4/packages/likec4-spa/src/xirang/SemanticBrowserController.spec.ts`
  - Expect: 不再将 Candidate 默认或首页入口设为 `complete-with-diff`；残留引用仅用于非法收敛或 Change 对照

- [x] C7 保持活动 Change 的 complete-with-diff
  - Preserves: `.xirang/model/elements/web.md` / Requirement "呈现 Change 目标与差异" / Scenario "Complete with diff 模式"
  - Command: `pnpm test:e2e -- semantic-browser-model-view`
  - Expect: 活动 Change 仍可选择 `complete-with-diff`，e2e 通过

- [x] C8 一次性确认 Edera Candidate 默认 complete
  - Verifies: `elements/web.md` / Requirement "呈现 Candidate 目标与差异" / Scenario "浏览 Candidate 目标模型"
  - Evidence: 在 Edera 运行 `xirang view`，打开 Candidate 后 Mode 为 `complete` 且控件只有 `complete` 与 `diff-only`
  - Result: `evidence/edera-candidate-view.json` 记录目标快照、执行方式与浏览器观测值
  - Expect: 默认呈现完整 Candidate 目标，无差异 overlay

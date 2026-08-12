### Task 1: 通过独立 changes 通道暴露活动 Change

**Goal**: 在 `XirangViewSourceContextValue` 增加只读 `changes` 字段，与 `sources` 并列，不合并 source 列表。

**Files**:
- Modify: `likec4/packages/diagram/src/xirang/ContractLoaderContext.tsx`

**Requirements**:
- `elements/semantic-browser.md` / Requirement "首页提供 Candidate 与活动 Change 快速入口"

#### Checks

- [x] C1 context value 暴露 changes 且 sources 不变
  - Verifies: `elements/semantic-browser.md` / Requirement "首页提供 Candidate 与活动 Change 快速入口" / Scenario "无活动 Change 时隐藏入口"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/xirang/ContractLoaderContext.spec.ts src/xirang/architectureView.spec.ts`
  - Expect: 既有 spec 全过（含 "keeps change input separate from view source identities"），无回归

- [x] C2 类型检查通过
  - Verifies: `elements/semantic-browser.md` / Requirement "首页提供 Candidate 与活动 Change 快速入口"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck`
  - Expect: 无类型错误

### Task 2: 首页新增 Active Changes 区块与 Change 卡片

**Goal**: 在首页渲染活动 Change 卡片，点击以 `change=<name>&mode=diff-only` 打开单一 route。

**Files**:
- Modify: `likec4/packages/likec4-spa/src/routes/_single/single-index.tsx`
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`（投影视口锚点：无真实 focus 时不锚定 root，避免跨布局视口漂移）

**Requirements**:
- `elements/semantic-browser.md` / Requirement "首页提供 Candidate 与活动 Change 快速入口"

#### Checks

- [x] C3 点击 Change 卡片进入 diff-only 单一 route
  - Verifies: `elements/semantic-browser.md` / Requirement "首页提供 Candidate 与活动 Change 快速入口" / Scenario "从首页打开活动 Change 差异"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-candidate-views.spec.ts --project=desktop`
  - Expect: 新用例断言 URL 含 `change=browser-change&mode=diff-only`、diff-only 差异节点与 Change 审查面板可见；既有用例（含 "shows candidate cards on the landing page"）保持通过

- [x] C4 无活动 Change 时隐藏区块
  - Verifies: `elements/semantic-browser.md` / Requirement "首页提供 Candidate 与活动 Change 快速入口" / Scenario "无活动 Change 时隐藏入口"
  - Command: `grep -n "Active Changes" likec4/packages/likec4-spa/src/routes/_single/single-index.tsx`
  - Expect: 区块以 `changes.length > 0` 为条件渲染，空列表不渲染

### Task 3: 首页 Change 卡片端到端用例（desktop + mobile）

**Goal**: 新增持久化 e2e 用例，覆盖首页 Change 卡片可见性与点击直达 diff-only。

**Files**:
- Modify: `test/e2e/semantic-browser-candidate-views.spec.ts`
- Modify: `playwright.config.ts`（desktop/mobile 项目 grep 白名单注册新用例标题）

**Requirements**:
- `elements/semantic-browser.md` / Requirement "首页提供 Candidate 与活动 Change 快速入口"

#### Checks

- [x] C5 重建 bundle 后双端 e2e 全过
  - Verifies: `elements/semantic-browser.md` / Requirement "首页提供 Candidate 与活动 Change 快速入口" / Scenario "从首页打开活动 Change 差异"
  - Command: `cd likec4 && pnpm --filter @likec4/spa build && pnpm --filter xirang-likec4 build && cd .. && pnpm exec playwright test test/e2e/semantic-browser-candidate-views.spec.ts --project=desktop --project=mobile`
  - Expect: 顺序固定为先 `@likec4/spa` 再 `xirang-likec4`；新用例与全部既有用例在 desktop 与 mobile 均通过

## Required Corrections

- [x] [artifact_fix] `playwright.config.ts` desktop/mobile 项目 grep 白名单新增用例标题 `opens an active change from the landing page`（无该注册新用例不会执行，C3/C5 将空转）；已补充声明到 Task 3 Files 与 proposal.md Impact，无需代码改动
- [x] [code_fix] 首页点击进入 change-derived-view 后白板：`DiagramUI` 投影更新以 `focusIdentity ?? rootIdentity` 作视口锚点，无 focus 时锚定 root，跨布局（基础视图 → diff-only 投影）root 位置差 ~18k px，视口补偿后画布看向空白；已改为仅在存在真实 focus 时锚定（`anchorIdentity: focusIdentity ?? null`），并在 e2e 新增“至少一个节点与视口相交”回归断言

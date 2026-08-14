### Task 1: ADDED 元素详情面板语义 identity 解析

**Goal**: 单击或通过详情按钮打开 ADDED 元素时，详情面板按投影节点携带的语义 identity 解析 declaration 与 diff，显示真实 title、kind、parent、definition 与 Properties、Contracts、Diff 标签页，不再出现空面板或 FQN 标题；`complete` 模式下同样生效。

**Files**:
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`
- Modify: `likec4/packages/diagram/src/likec4diagram/state/machine.actions.ts`
- Modify: `likec4/packages/diagram/src/overlays/element-details/actor.ts`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetails.tsx`
- Test: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.spec.tsx`

**Requirements**:
- identity 解析抽成可测试纯函数：优先 details actor 从投影节点 data 携带的语义 identity，其次投影节点 metadata（`xirangIdentity` 或 `elementId`）、elementModel metadata，最后回退 fqn。
- `openElementDetails` 从投影节点 `data.xirang.identity` 读取 identity 并经 details actor 传入卡片（SPA 基础 LikeC4 model 不含投影节点，`viewModel.findNode` 会落空）。
- declaration 与 diff entry 查找一律使用解析出的语义 identity。
- 简化卡片触发条件为"元素不在基础 LikeC4 model 且 declaration 存在于所选 architecture"，不依赖 diff 的 ADDED 判定。
- 面板标题显示 declaration.title，kind 显示 declaration.kind。

#### Checks

- [x] C1 identity 解析与声明查找单测
  - Verifies: `elements/change-derived-views.md` / Requirement "支持 Element 级别的变更差异审查" / Scenario "单击打开 ADDED 元素详情"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/overlays/element-details/ElementDetailsCard.spec.tsx`
  - Expect: 新增用例覆盖 metadata identity 与 FQN 不一致时解析正确、无 metadata 时回退、不在 base model 时按 declaration 渲染；全部通过

- [x] C2 类型检查
  - Verifies: `elements/change-derived-views.md` / Requirement "支持 Element 级别的变更差异审查" / Scenario "单击打开 ADDED 元素详情"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck`
  - Expect: 无类型错误

### Task 2: 节点标记分层与 Requirement 计数徽章

**Goal**: element-declaration 级操作仅由 outline 与透明度表达；requirement 级变更按宿主元素聚合为绿色 `+N`、琥珀 `~N`、红色 `−N` 计数徽章，非零即渲染、可并排共存；contract-only 变更不施加 outline 且不激活 dimming。

**Files**:
- Modify: `likec4/packages/diagram/src/xirang/architectureView.ts`
- Modify: `likec4/packages/diagram/src/xirang/projectionNode.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/custom/nodes/nodes.tsx`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`
- Test: `likec4/packages/diagram/src/xirang/projectionNode.spec.ts`
- Test: `likec4/packages/diagram/src/likec4diagram/custom/nodes/nodes.spec.tsx`

**Requirements**:
- element-op 与 requirement 计数分离：outline 仅由 element-declaration entries 驱动，计数仅聚合 `requirement` entries（identity 取 `#` 前宿主）。
- 计数经 `xirangRequirementCounts` metadata 携带；counts-only 节点（无 element op）同样返回 xirang data。
- 单字符节点徽章退役，替换为计数徽章；关系边 `+`/`~`/`−` 徽章保持不变。
- dimming 仅在 element-declaration 或 relationship 级 diff 存在时激活。

#### Checks

- [x] C1 四态视觉与 outline 语义单测
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "四态节点视觉区分"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/xirang/architectureView.spec.ts`
  - Expect: 原 host-contract 用例改为断言无 outline、无 xirangOperation、不 dim；element-declaration op 仍按点线/实线/虚线 outline 与 100/100/45 透明度呈现；全部通过

- [x] C2 Requirement 计数徽章单测
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "Requirement 计数徽章"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/xirang/architectureView.spec.ts src/xirang/projectionNode.spec.ts src/likec4diagram/custom/nodes/nodes.spec.tsx`
  - Expect: 按宿主聚合的 `+N`/`~N`/`−N` 计数 metadata 正确、多类共存、counts-only 节点可解析；全部通过

- [x] C3 类型检查
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "Requirement 计数徽章"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck`
  - Expect: 无类型错误

### Task 3: Change 面板计数改为结构级统计

**Goal**: 右上角 Change 面板的 `+N ~N −N` 仅统计 element-declaration 与 relationship 级 diff，requirement 级变更不再计入。

**Files**:
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`
- Test: `likec4/packages/diagram/src/likec4diagram/DiagramUI.spec.ts`

**Requirements**:
- `getArchitectureOverlayModel` 的 `counts` 只累加 element-declaration 与 relationship entries。
- 移除 host-contract 计数回退（hostOps 及 `changed.add(host)`），不再读取 requirement/scenario/property entries。
- 面板渲染与其他 change 详情内容不变。

#### Checks

- [x] C1 面板计数单测
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "Diff only 模式"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/likec4diagram/DiagramUI.spec.ts`
  - Expect: 结构级 entries 计数正确；纯 requirement 变更源计数为 0/0/0 且不改动 changed 集合；全部通过

- [x] C2 类型检查
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "Diff only 模式"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck`
  - Expect: 无类型错误

### Task 4: e2e 断言更新与浏览器全链路验证

**Goal**: 更新既有徽章断言为计数形态并新增单击 ADDED 元素详情面板用例，重建 bundle 后桌面与移动端 Playwright 全绿。

**Files**:
- Test: `test/e2e/semantic-browser-model-view.spec.ts`
- Modify: `playwright.config.ts`

**Requirements**:
- 既有 `[data-xirang-node-diff]` 单字符断言改为计数徽章断言（fixture 中 `capability.added-parent` 为 `+2`、`capability.leaf` 为 `~1`），`data-xirang-operation` 与 outline 断言保持不变。
- 新增用例：对 `capability.added-parent` 连续两次单击打开详情面板，断言标题为 "Added Parent Capability" 且不含 FQN、kind 徽章与 Diff tab 可见。
- 不修改既有用例来迁就新行为之外的部分；新行为以新增用例覆盖。

#### Checks

- [x] C1 桌面与移动端 Playwright
  - Verifies: `elements/change-derived-views.md` / Requirement "支持 Element 级别的变更差异审查" / Scenario "单击打开 ADDED 元素详情"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop --project=mobile`
  - Expect: 全部通过（含更新后的计数徽章断言与新增详情面板用例）

- [x] C2 bundle 重建（一次性验证）
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "Requirement 计数徽章"
  - Command: `cd likec4 && pnpm --filter @likec4/spa build && pnpm --filter xirang-likec4 build`
  - Expect: 两次构建均成功（先 spa 后 xirang-likec4，顺序不可颠倒）

## Required Corrections

- [x] [artifact_fix] 详情 actor 的 identity 透传（machine.actions.ts、actor.ts、ElementDetails.tsx）未在 Task 1 Files 声明且与 design.md Decision 1 矛盾
  - Verifies: `elements/change-derived-views.md` / Requirement "支持 Element 级别的变更差异审查" / Scenario "单击打开 ADDED 元素详情"
  - Expect: tasks.md Task 1 Files 已声明三个 actor 相关文件，Requirements 已明确 actor 透传机制；design.md Decision 1 已改写为 actor 透传的决策与依据

- [x] [artifact_fix] playwright.config.ts 的 grep 新增未在 Task 4 Files 声明
  - Verifies: `elements/change-derived-views.md` / Requirement "支持 Element 级别的变更差异审查" / Scenario "单击打开 ADDED 元素详情"
  - Expect: tasks.md Task 4 Files 已声明 playwright.config.ts

- [x] [code_fix] `Requirement 计数徽章` Scenario 缺少红色 `−N` 徽章与多徽章并排的渲染级测试证据
  - Verifies: `elements/semantic-browser.md` / Requirement "呈现 Change 目标与差异" / Scenario "Requirement 计数徽章"
  - Expect: 新增 `nodes.spec.tsx` 渲染测试覆盖三色徽章并排、非零项过滤与全零时渲染 null；C2 命令已包含该 spec 且全过

- [x] [code_fix] ADDED 元素的 Contracts 标签页显示 "Missing project or element"：`elementProjectId` 对投影元素（不在 base model 中）回退为空串；已改为回退 `useLikeC4ProjectId()`
  - Verifies: `elements/change-derived-views.md` / Requirement "支持 Element 级别的变更差异审查" / Scenario "单击打开 ADDED 元素详情"
  - Expect: e2e 在既有单击详情用例中新增 Contracts 标签页断言（Contract 内容可见且不含 "Missing project or element"），桌面+移动端 15/15 全过


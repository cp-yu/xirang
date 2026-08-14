### Task 1: Metamodel 面板分组折叠与面板宽度

**Goal**: Change 面板收缩为内容驱动宽度，Metamodel 差异条目按 Kind / Relationship / View 三分组折叠呈现（阈值 6），点开分组平铺条目并保持条目 diff 详情。

**Files**:
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`
- Test: `likec4/packages/diagram/src/likec4diagram/DiagramUI.spec.ts`

**Requirements**:
- 新增纯函数 `getMetamodelGroups`：固定分组顺序 `element-kind` / `relationship-kind` / `authored-view`，每组统计 ADDED、MODIFIED、REMOVED 计数并保持组内 kind+identity 排序。
- 条目总数超过常量 `METAMODEL_COLLAPSE_THRESHOLD = 6` 时渲染非空分组汇总行（`+N ~N −N`），单组互斥就地展开平铺条目；总数不超过 6 时保持现有平铺。
- 点击条目继续打开现有 `MetamodelDiffModal`。
- `changeDetailsPanel` 增加 `width: 'max-content'`，保留 `maxWidth` 安全帽。
- 不改变面板计数行、Plan 文件与 diagnostics 的现有呈现。

#### Checks

- [x] C1 分组与阈值单测
  - Verifies: `elements/xirang-diff-overlay.md` / Requirement "折叠呈现 Metamodel 差异条目" / Scenario "Metamodel 条目较多时折叠" / Scenario "Metamodel 条目较少时平铺"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/likec4diagram/DiagramUI.spec.ts`
  - Expect: 分组顺序、计数、阈值边界（6/7）用例全绿

- [x] C2 展开与详情交互单测
  - Verifies: `elements/xirang-diff-overlay.md` / Requirement "折叠呈现 Metamodel 差异条目" / Scenario "展开分组查看条目"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/likec4diagram/DiagramUI.spec.ts`
  - Expect: 分组条目列表完整且保持排序、计数与操作一致；展开互斥与点击打开 modal 的交互由 Task 2 C5 的 candidate e2e（[data-xirang-metamodel-group] 断言）覆盖

- [x] C3 类型检查
  - Verifies: `elements/xirang-diff-overlay.md` / Requirement "折叠呈现 Metamodel 差异条目" / Scenario "Metamodel 条目较多时折叠"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck`
  - Expect: typecheck 无错误

- [x] C4 面板在 Change 审查中保持可用
  - Verifies: `elements/xirang-diff-overlay.md` / Requirement "呈现语义差异视觉表达" / Scenario "四态节点视觉区分"
  - Command: `cd likec4 && pnpm --filter @likec4/spa build && pnpm --filter xirang-likec4 build && cd .. && pnpm exec playwright test test/e2e/semantic-browser-candidate-views.spec.ts --project=desktop --grep "opens an active change"`
  - Expect: 面板渲染 `Change · Model View` 且用例通过

### Task 2: Candidate 与 Candidate Diff 投影基线与交互

**Goal**: Candidate View 以 Project Root 为默认 focus 呈现折叠基线并支持 focus 下钻、就地展开、breadcrumb；Candidate Diff View 画布只投影 changed Elements、必要 ancestors、changed Relationship endpoints 与 removed ghosts，focus 内收窄。

**Files**:
- Modify: `likec4/packages/vite-plugin/src/xirang/xirang-projection-handler.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`
- Modify: `src/core/view.ts`
- Test: `likec4/packages/vite-plugin/src/xirang/xirang-projection-handler.spec.ts`
- Test: `test/core/view.test.ts`
- Test: `test/core/view-parse-count.test.ts`
- Test: `test/e2e/semantic-browser-candidate-views.spec.ts`
- Test: `test/fixtures/contract-browser/.xirang/candidate/relationships/invokes.yaml`
- Test: `test/fixtures/contract-browser/.xirang/candidate/relationships/references.yaml`
- Test: `test/fixtures/contract-browser/.xirang/candidate/metamodel/layer.md`
- Test: `test/fixtures/contract-browser/.xirang/candidate/metamodel/module.md`
- Test: `test/fixtures/contract-browser/.xirang/candidate/metamodel/references.md`
- Test: `test/fixtures/contract-browser/.xirang/candidate/metamodel/service.md`
- Test: `test/fixtures/contract-browser/.xirang/candidate/metamodel/system.md`

**Requirements**:
- 删除 candidate/candidate-diff 的 include-all 分支，走标准分支：focus 存在时 focus + direct children + expanded 后代；无 focus 时根子级 + expanded。
- candidate-diff 在 diff 存在时使用变更驱动可见集合（changed + ancestors + relationship endpoints + removed ghosts，focus 子树内收窄）；diff 为空时回退根子级基线。
- Candidate Diff 的 before-after union sources（`diffArchitecture`、`diffLikec4Sources`、`diffLikec4ElementPaths`、`diffSourceFingerprint`）由 `src/core/view.ts` 从 formal+candidate 并集模型生成，removed ghosts 由 union source 投影；并集超出 Graphviz 路由容量时确定性回退 candidate-only target sources。
- `isInteractiveBrowserSource` 与 breadcrumb 条件扩展到 Candidate 与 Candidate Diff 来源，candidate 仍锁定 full、candidate-diff 仍锁定 diff-only。
- e2e candidate 两条用例按新基线语义改写（根子级可见、深级元素需展开/下钻；candidate-diff 只含差异相关元素），不改动其他既有用例。

#### Checks

- [x] C1 Candidate 基线投影单测
  - Verifies: `elements/candidate-derived-view.md` / Requirement "提供完整 Candidate 目标模型" / Scenario "浏览有效 Candidate"
  - Command: `cd likec4 && pnpm --filter @likec4/vite-plugin exec vitest run --no-isolate src/xirang/xirang-projection-handler.spec.ts`
  - Expect: 无 focus 时 include 为根子级+expanded；focus 时 include 为 focus+children+expanded；不再全量 include

- [x] C2 Candidate Diff 可见集合单测
  - Verifies: `elements/candidate-diff-derived-view.md` / Requirement "呈现 Candidate 语义差异" / Scenario "审查 Candidate diff"
  - Command: `cd likec4 && pnpm --filter @likec4/vite-plugin exec vitest run --no-isolate src/xirang/xirang-projection-handler.spec.ts`
  - Expect: 可见集合为 changed+ancestors+endpoints，focus 收窄，空 diff 回退根子级基线

- [x] C3 Candidate Diff before-after union sources 单测
  - Verifies: `elements/candidate-diff-derived-view.md` / Requirement "呈现 Candidate 语义差异" / Scenario "审查 Candidate diff"
  - Command: `pnpm exec vitest run test/core/view.test.ts test/core/view-parse-count.test.ts`
  - Expect: `diffArchitecture`、`diffLikec4Sources`、`diffLikec4ElementPaths`、`diffSourceFingerprint` 存在且与 candidate target sources 区分，removed ghosts 可投影；单次 snapshot build 只读一次 formal 模型

- [x] C4 类型检查
  - Verifies: `elements/candidate-derived-view.md` / Requirement "提供完整 Candidate 目标模型" / Scenario "浏览有效 Candidate"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck && pnpm --filter @likec4/vite-plugin typecheck`
  - Expect: 两个包 typecheck 无错误

- [x] C5 浏览器端 Candidate 交互验证
  - Verifies: `elements/candidate-derived-view.md` / Requirement "提供完整 Candidate 目标模型" / Scenario "浏览有效 Candidate"
  - Command: `cd likec4 && pnpm --filter @likec4/spa build && pnpm --filter xirang-likec4 build && cd .. && pnpm exec playwright test test/e2e/semantic-browser-candidate-views.spec.ts --project=desktop --project=mobile`
  - Expect: candidate 根子级可见、深级元素展开/下钻后可见、breadcrumb 可用；candidate-diff 只含差异相关元素；候选视图用例全部通过

### Task 3: 关系边合并与聚合 diff 徽标

**Goal**: 映射到相同可见 source/target 的多个 Relationships 合并为单条 visual edge（LikeC4 多关系聚合 label），合并边的 diff 徽标按 added/modified/removed 聚合计数呈现；单条关系边保持 Kind 呈现与单字符徽标。

**Files**:
- Modify: `likec4/packages/diagram/src/xirang/architectureView.ts`
- Modify: `likec4/packages/diagram/src/xirang/projectionNode.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/types.ts`
- Modify: `likec4/packages/diagram/src/likec4diagram/custom/edges/RelationshipEdge.tsx`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`
- Test: `likec4/packages/diagram/src/xirang/projectionNode.spec.ts`

**Requirements**:
- `expandXirangRelationshipEdges` 改为不拆分：多条关系保留布局原边（label、geometry、id 不变）与全量 `xirangRelations`；单条关系应用该 Kind 的 color/line/head/tail 与 label。
- `applyXirangPresentationOverlay` 按边聚合各三元组 diff operation 计数写入 `xirangRelationCounts` metadata；仅一条 changed Relationship 时保留 `xirangOperation`。
- `readXirangProjectionEdge` 解析 `relationCounts`，`RelationshipEdge` 在多条 changed Relationships 时以绿色 `+N`、琥珀 `~N`、红色 `−N` 小徽标并排渲染于 label 上方，仅非零项；单条时保留现有单字符 glyph 与 `data-xirang-edge-diff` aria-label。
- reciprocal 关系（A→B 与 B→A）保持两条独立边。
- 既有 `renders four-state diff visuals` e2e 断言（单条 changed 边 glyph 与 aria-label）保持通过。

#### Checks

- [x] C1 合并与单关系呈现单测
  - Verifies: `elements/xirang-projection-service.md` / Requirement "聚合当前层 Relationships" / Scenario "同向 Relationships 合并呈现" / Scenario "存在 reciprocal Relationships"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/xirang/architectureView.spec.ts`
  - Expect: 多关系边不拆分且保留聚合 label 与全量三元组；单关系边应用 Kind 呈现；reciprocal 保持独立

- [x] C2 聚合徽标数据与解析单测
  - Verifies: `elements/xirang-diff-overlay.md` / Requirement "呈现语义差异视觉表达" / Scenario "关系边视觉区分"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram exec vitest run --no-isolate src/xirang/projectionNode.spec.ts src/xirang/architectureView.spec.ts`
  - Expect: `xirangRelationCounts` 聚合计数正确；仅一条 changed Relationship 时保留 `xirangOperation`；非法/缺失计数按零处理

- [x] C3 类型检查
  - Verifies: `elements/xirang-diff-overlay.md` / Requirement "呈现语义差异视觉表达" / Scenario "关系边视觉区分"
  - Command: `cd likec4 && pnpm --filter @likec4/diagram typecheck`
  - Expect: typecheck 无错误

- [x] C4 单字符徽标行为保持
  - Preserves: `.xirang/model/elements/xirang-diff-overlay.md` / Requirement "呈现语义差异视觉表达" / Scenario "关系边视觉区分"
  - Command: `cd likec4 && pnpm --filter @likec4/spa build && pnpm --filter xirang-likec4 build && cd .. && pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop --project=mobile --grep "renders four-state diff visuals"`
  - Expect: `[data-xirang-edge-diff][aria-label="Relationship REMOVED"]` 可见且用例通过

## One-time Verification

以下检查不产生持久化测试文件，使用 Edera 真实 Candidate（48 条 Metamodel、685 条 diff entries）做一次性人工/脚本验证。

- [x] C6 Edera 面板三点折叠
  - Verifies: `elements/xirang-diff-overlay.md` / Requirement "折叠呈现 Metamodel 差异条目" / Scenario "Metamodel 条目较多时折叠"
  - Command: 在 Edera 项目运行 `node <openspec>/bin/xirang.js view --port 43219`，打开 `view=candidate-diff`
  - Expect: 面板收缩为内容宽度；显示 Kind / Relationship / View 三个汇总行与 `+N ~N −N` 计数；点开平铺条目，点击条目打开 before/after diff

- [x] C7 Edera Candidate 折叠基线与合并线
  - Verifies: `elements/candidate-derived-view.md` / Requirement "提供完整 Candidate 目标模型" / Scenario "浏览有效 Candidate"
  - Command: 同上服务打开 `view=candidate`，记录节点数与边数
  - Expect: 初始为根子级（9 个节点）；ctrl+点击/双击下钻逐步展开；多关系边合并为一条线、label 为 `[...]`，悬停列出各关系；candidate-diff 画布只含差异相关元素且合并边显示聚合 `+N`/`~N`/`−N` 徽标

- [x] C8 全量回归
  - Verifies: `elements/candidate-diff-derived-view.md` / Requirement "呈现 Candidate 语义差异" / Scenario "审查 Candidate diff"
  - Command: `cd likec4 && pnpm --filter @likec4/spa build && pnpm --filter xirang-likec4 build && cd .. && pnpm exec playwright test --project=desktop --project=mobile && git diff --check`
  - Expect: 桌面+移动端全量用例通过，无空白错误

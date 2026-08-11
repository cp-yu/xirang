### Task 1: 编写 GraphvizLayouter 预处理单元测试

**Goal**: 以 TDD 形式锁定 compound Element View 跳过 `unflatten`、非 compound 保留的判定边界。

**Files**:
- Test: `likec4/packages/layouts/src/graphviz/GraphvizLayouter.spec.ts`

**Requirements**:
- 具有 compound endpoint edges 的 Element View 布局前不调用 `unflatten`
- 不包含 compound endpoint edges 的 Element View 保留既有 `unflatten` 调用
- 包含 compound nodes 但所有 edges 均为 leaf-to-leaf 的 Element View 仍调用 `unflatten`
- 判定基于 `printer.print()` 之后建立的 compound endpoint 拓扑

#### Checks

- [x] C1 验证 compound view 跳过 unflatten 的失败复现
  - Verifies: `elements/visual-presentation.md` / Requirement "跳过 Compound Projection 的 disconnected-node chaining 预处理" / Scenario "呈现 Compound Projection"
  - Command: `cd likec4 && pnpm --filter @likec4/layouts exec vitest run --no-isolate src/graphviz/GraphvizLayouter.spec.ts`
  - Expect: 实现前测试红（fake port 记录到 `unflatten` 被调用），实现后测试绿（调用次数为 0）

- [x] C2 验证非 compound view 保留 unflatten
  - Verifies: `elements/visual-presentation.md` / Requirement "跳过 Compound Projection 的 disconnected-node chaining 预处理" / Scenario "呈现非 Compound Projection"
  - Command: `cd likec4 && pnpm --filter @likec4/layouts exec vitest run --no-isolate src/graphviz/GraphvizLayouter.spec.ts`
  - Expect: fake port 记录 `unflatten` 恰好调用 1 次

- [x] C3 验证 compound nodes 但 leaf-to-leaf edges 保留 unflatten
  - Verifies: `elements/visual-presentation.md` / Requirement "跳过 Compound Projection 的 disconnected-node chaining 预处理" / Scenario "Compound 存在但 edges 均为 leaf-to-leaf"
  - Command: `cd likec4 && pnpm --filter @likec4/layouts exec vitest run --no-isolate src/graphviz/GraphvizLayouter.spec.ts`
  - Expect: fake port 记录 `unflatten` 恰好调用 1 次

### Task 2: 实现 compound view 跳过 unflatten

**Goal**: 在 `GraphvizLayouter.dot()` 中按 `hasEdgesWithCompounds` 决定是否执行 `unflatten`。

**Files**:
- Modify: `likec4/packages/layouts/src/graphviz/GraphvizLayoter.ts`

**Requirements**:
- `ElementViewPrinter.print()` 之后判定 `printer.hasEdgesWithCompounds`
- 为真时直接 `normalizeDot(dot)` 返回，不调用 `unflatten`
- 为假时保留现有 `unflatten` 调用与参数（`1, false, 3`）
- 不改变 Dynamic、Deployment、Projects View 与 AI layout 路径

#### Checks

- [x] C4 验证单元测试全绿
  - Verifies: `elements/visual-presentation.md` / Requirement "跳过 Compound Projection 的 disconnected-node chaining 预处理" / Scenario "呈现 Compound Projection"
  - Command: `cd likec4 && pnpm --filter @likec4/layouts exec vitest run --no-isolate src/graphviz/GraphvizLayouter.spec.ts`
  - Expect: C1-C3 覆盖的测试全部通过

- [x] C5 验证 layouts 包类型检查
  - Verifies: `elements/visual-presentation.md` / Requirement "跳过 Compound Projection 的 disconnected-node chaining 预处理" / Scenario "呈现 Compound Projection"
  - Command: `cd likec4 && pnpm --filter @likec4/layouts typecheck`
  - Expect: 类型检查无错误

### Task 3: 修复真实项目完整布局回归

**Goal**: 让项目自身 Semantic Model 的布局回归断言布局前后 node/edge 对齐且每条 edge 具有 routing points，并移除过期摘要根因诊断。

**Files**:
- Modify: `test/core/likec4/generator-validate.test.ts`

**Requirements**:
- 分别导出 layout 前后视图，比较 node/edge identities 对齐
- 断言 layouted `model` View 的每条 edge 至少两个 routing points
- 更新把摘要长度描述为布局根因的过期注释与失败信息

#### Checks

- [x] C6 验证完整布局回归通过
  - Verifies: `elements/visual-presentation.md` / Requirement "跳过 Compound Projection 的 disconnected-node chaining 预处理" / Scenario "呈现 Compound Projection"
  - Command: `npx vitest run test/core/likec4/generator-validate.test.ts -t "lays out successfully"`
  - Expect: `model` View 存在、节点非空、layout 前后 edge identities 对齐、每条 edge 至少两个 points

- [x] C7 验证过期摘要根因诊断已移除
  - Verifies: `elements/visual-presentation.md` / Requirement "跳过 Compound Projection 的 disconnected-node chaining 预处理" / Scenario "呈现 Compound Projection"
  - Command: `grep -rn "summary-length\|摘要长度\|EXCERPT_LIMIT in" test/core/likec4/generator-validate.test.ts`
  - Expect: 无匹配（注释与失败信息已更新为 compound/unflatten 诊断）

### Task 4: 端到端一次性验证

**Goal**: 重建产物并在浏览器与 CLI 端验证修复生效，无一次性持久测试文件。

**Files**:
- Modify: `likec4/packages/layouts/src/graphviz/GraphvizLayoter.ts`

**Requirements**:
- 按依赖顺序重建 vendored LikeC4 产物（layouts → spa → xirang-likec4）
- 当前模型 Model View 导出完整且无缺失路由
- Semantic Browser 桌面与移动端可用
- `xirang view` 启动日志不再出现布局失败

#### Checks

- [x] C8 验证重建产物成功
  - Verifies: `elements/visual-presentation.md` / Requirement "跳过 Compound Projection 的 disconnected-node chaining 预处理" / Scenario "呈现 Compound Projection"
  - Command: `cd likec4 && pnpm --filter @likec4/layouts build && pnpm --filter @likec4/spa build && pnpm --filter xirang-likec4 build`
  - Expect: 三个包按序构建成功，无错误

- [x] C9 验证当前模型导出完整路由
  - Verifies: `elements/visual-presentation.md` / Requirement "跳过 Compound Projection 的 disconnected-node chaining 预处理" / Scenario "呈现 Compound Projection"
  - Command: `XIRANG_LIKEC4_STALE_CHECK=0 node --input-type=module -e "import('./dist/commands/arch/runner.js')..."` 或等价 dist 模式导出
  - Expect: 155 个节点存在，38 条 visual edges 全部具有至少两个 routing points，且 layout 前后 node/edge identities 对齐

- [x] C10 验证浏览器桌面与移动端
  - Verifies: `elements/visual-presentation.md` / Requirement "跳过 Compound Projection 的 disconnected-node chaining 预处理" / Scenario "呈现 Compound Projection"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-model-view.spec.ts --project=desktop --project=mobile`
  - Expect: 桌面与移动端用例全部通过，画布非空且交互可用

- [x] C11 验证修复后 `xirang view` 启动无布局失败
  - Verifies: `elements/visual-presentation.md` / Requirement "跳过 Compound Projection 的 disconnected-node chaining 预处理" / Scenario "呈现 Compound Projection"
  - Command: `timeout 35 node bin/xirang.js view --port 5198 2>&1 | tee /tmp/xirang-view.log; grep -c "layouted 0 of 1 views\|Cannot read properties of undefined (reading .filter.)\|triangulation failed\|Fail layout view model" /tmp/xirang-view.log`
  - Expect: 匹配计数为 0；本机 PATH 下的全局 `xirang` 为旧打包产物，需重新安装（`npm install -g .` 或等价部署）后才携带本修复

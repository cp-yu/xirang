### Task 1: 收缩 spec 数据源协议为 element identity 寻址

**Goal**: 以 TDD 把两段式路径寻址协议收缩为一段式 identity 寻址，使「element → 多个 spec 路径」这一层从类型上消失。

**Files**:
- Modify: `likec4/packages/diagram/src/xirang/SpecLoaderContext.tsx`
- Modify: `likec4/packages/likec4-spa/src/xirang/HttpSpecLoader.ts`
- Test: `likec4/packages/likec4-spa/src/xirang/HttpSpecLoader.spec.ts`

**Requirements**:
- `XirangSpecContent{path, md}`（`SpecLoaderContext.tsx:3-6`）改为 `XirangContractContent{element, md}`
- `XirangSpecLoader.list()`（`:85`）删除；`load()`（`:86`）签名去掉 `path` 参数，返回 `XirangContractContent | null`，`null` 表示该 Element 无 Contract
- `subscribe`（`:88`）载荷从变更文件路径改为 element identity
- `isXirangSpecDiagnostic`（`:74-77`）判据从 `specs/`、`.xirang/specs/` 前缀改为 `.xirang/model/elements/` 前缀
- `XirangDiffEntry.scope`（`:10`）字段删除；`kind`（`:11`）取值对齐模型内核 Change 的 `DiffKind`（`element` → `element-declaration`，补 `authored-view`）
- `HttpSpecLoader.list()`（`:19-31`）删除；`load()`（`:33-44`）去掉 `path` 查询参数，404 响应返回 `null` 而非抛错
- `/__xirang/specs` 端点不再被客户端调用

#### Checks
- [x] `HttpSpecLoader.load` 在 200 响应下返回 `{element, md}`
- [x] `HttpSpecLoader.load` 在 404 响应下返回 `null`，不抛错
- [x] `HttpSpecLoader.load` 在非 404 错误响应下抛出携带服务端 message 的错误
- [x] `XirangSpecLoader` 类型上不存在 `list` 成员（编译期断言）
- [x] Contract 诊断改按 identity 判定（G2）：`isXirangContractDiagnostic({identity: 'cap.a#Req'})` 为 true，identity 缺失或不含 `#` 为 false——`elements/` 单元同时承载 Declaration 与 Contract，存储前缀无法区分二者

---

### Task 2: 重建服务端读取的安全边界

**Goal**: 以 TDD 把路径逃逸防护从「`.xirang/specs/` 前缀白名单 + realpath」改造为「identity 字符集白名单 + 索引定位 + realpath」，保证防护强度不低于现状。

**Files**:
- Modify: `likec4/packages/vite-plugin/src/xirang/xirang-spec-handler.ts`
- Test: `likec4/packages/vite-plugin/src/xirang/xirang-spec-handler.spec.ts`

**Requirements**:
- `OPSX_SPECS_PREFIX`（`:4`）、`XirangSpecIndex`（`:6-8`）、`XirangSpecRegistrySnapshot`（`:10-13`）、`readXirangSpecRegistry`（`:39-61`）删除
- `readXirangSpec`（`:63-107`）改名 `readXirangContract`，入参为 `{projectRoot, element}`，返回 `XirangContractContent | null`
- `validateSpecPath`（`:140-156`）改为 `validateElementIdentity`：整串匹配 `/^[A-Za-z0-9._-]+$/`（依据 `xirang-contract.md:97`），额外拒绝 `.`、`..` 与以 `.` 开头的 identity；不合法抛 `XirangSpecError(400)`
- 单元路径由模型内核 Change 的 `parseSemanticModel` + `ModelIndex.moduleOf(identity)` 取得，不得假定 `elements/<identity>.md` 命名约定成立（`xirang-contract.md:55` 该约定不具规范性）
- `isPathInside`（`:158-161`）保留原样；realpath 包含检查（`:84-99`）的根目录改为 `<projectRoot>/.xirang/model/elements`
- `createXirangSpecWatcher`（`:111-138`）的 `specsRoot`（`:124`）改为 `.xirang/model/elements`，notify 载荷从相对路径改为 element identity
- 三层防护顺序固定：字符集校验 → 索引定位 → realpath 包含检查

#### Checks（G1-B 取代三层防护：Contract 走 manifest 投影，端点退化为查表，安全断言为「端点在任何输入下不触达文件系统」）
- [x] `../` 穿越、绝对路径、URL 编码、反斜杠、空字节、原型链键名与不存在的 identity 一律查表落空返回 `null`，`fs.readFile`/`fs.realpath` 零调用（`xirang-spec-handler.spec.ts` 参数化用例）
- [x] `xirang-spec-handler.ts` 无任何文件系统 import，`readXirangContract` 为纯查表函数
- [x] 未知 project 返回 404（`assertXirangProject`）
- [x] 未知 variant 返回 404
- [x] 无 Contract 的 Element 返回 `null`（HTTP 层为 404 响应），与「Contract 可选」一致
- [x] spec watcher 删除；manifest 文件变更经 `xirang:change-manifest-changed` 事件通知客户端刷新

---

### Task 3: 修正 architectureView 的对齐键

**Goal**: 以 TDD 把身份对齐从 fqn 改为 identity，使 `.c4` 重生成导致 fqn 变化时视图身份、父子关系与 diff 着色全部稳定，fqn 仅用于布局继承且容忍 miss。

**Files**:
- Modify: `likec4/packages/diagram/src/xirang/architectureView.ts`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`

**Requirements**:
- 节点 id 与 `modelRef`（`:58-59`）改为 element identity；`byFqn`（`:140`）改为按 identity 建索引
- `formalNodes`（`:141`）保留 fqn 键查表，但命中后仅继承几何字段（`x`/`y`/`width`/`height`），其余字段一律由 change variant 数据决定；miss 时回退 `createNode` 网格布局且不产生诊断
- `parent` 引用（`:149`）改为 identity；边端点解析（`:167-174`）改为 identity，`formalEdges` 键（`:174`）随之改为 `${sourceIdentity}|${targetIdentity}`
- `asElement`（`:23`）不再要求 `fqn` 为 string（fqn 变为可选，缺失时直接走网格布局）
- `architectureEntries`（`:17`）的 `entry.scope === 'architecture'` 判据改为按 entity type 白名单过滤（`element-declaration`、`relationship`、`element-kind`、`relationship-kind`、`authored-view`）
- `:108-109` 与 `:121-122` 的 `entry.kind === 'element'` / `'relationship'` 同步为新 `DiffKind` 取值
- 边 id `xirang:${source|kind|target}`（`:85`）不变——三元组即 Relationship identity

#### Checks（G2：manifest 的 `architecture` 是 IR `SemanticModel`，无 fqn；布局继承键为 `node.metadata.elementId`）
- [x] 给定同一 change variant，派生局部名全部改变而 identity 不变时，节点 id 集合逐项相等
- [x] 同上条件下父子关系逐项相等
- [x] 同上条件下边 id 集合与 diff 着色逐项相等
- [x] formal 节点携带相同 `metadata.elementId` 时几何字段被继承
- [x] `metadata.elementId` 未命中时回退网格布局，不抛错、不产生诊断
- [x] IR 声明不含 fqn 字段，视图整体由 identity 合成
- [x] `mode: 'diff'` 下祖先补全链按 identity 遍历正确
- [x] 生成器为每个 element 输出 `metadata { elementId '<identity>' }`（`src/core/likec4/generator.ts`，`generator.test.ts` 覆盖）

---

### Task 4: 对齐 SpecsTab 的 diff 过滤与单 Contract 呈现

**Goal**: 以 TDD 把 diff 过滤键改为 element identity 并移除分区判据，同时退化多路径选择器为单 Contract 呈现。

**Files**:
- Modify: `likec4/packages/diagram/src/overlays/element-details/SpecsTab.tsx`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`
- Test: `likec4/packages/diagram/src/overlays/element-details/SpecsTab.spec.tsx`

**Requirements**:
- `XirangSpecIndexController`（`:27-57`）、`XirangSpecIndexState`（`:20-25`）、`normalizeSpecPaths`（`:99-106`）、`getSpecsTabModel`（`:108-116`）删除
- `getStructuredSpecDiff`（`:189`）改名 `getStructuredContractDiff(variant, element)`：删除 `specId` 正则提取（`:190`）与 `entry.scope === 'specs'` 判据，过滤条件为 `entry.kind === 'requirement' && entry.identity.startsWith(`${element}#`)`（依据 `xirang-contract.md:93,200`）
- 诊断过滤（`:208`）改为按 element identity 匹配 `diagnostic.path`
- Requirement 标题（`:198`）与 Scenario 标题（`:203`）的提取逻辑不变——element identity 不含 `#`，首/末 `#` 分割仍正确
- `SpecsTab` props 的 `specs: readonly string[]`（`:250`）改为无 Contract 时不渲染；多路径 `NativeSelect`（`:295-302`）删除
- `XirangSpecLoadController.load`（`:65`）去掉 `specPath` 参数；`SpecLoadState`（`:14-18`）的 `path` 字段改为 `element`
- `ElementDetailsCard.tsx`：`specIndexController`（`:136`）、`specIndex` 状态、`specPaths`（`:138-141`）、`specTab`（`:142`）删除；Specs Tab 可见性改由「`load()` 返回非 `null`」决定；`SpecsTab`（`:541-544`）的 `specs` prop 删除
- `stableElementId`（`:132-135`）保留——它已是 element identity，正是新寻址键

#### Checks
- [x] `getStructuredContractDiff` 对 `identity` 为 `cap.a#Req` 的条目在 `element='cap.a'` 时命中
- [x] 对 `identity` 为 `cap.ab#Req` 的条目在 `element='cap.a'` 时不命中（前缀不得跨 identity 边界误匹配）
- [x] Diff IR 无 `scope` 字段，过滤仅凭 `kind` 与 `identity`
- [x] Scenario 子条目按 `kind === 'scenario'` 正确归集，标题取末个 `#` 之后
- [x] element identity 含 `.`、`-`、`_` 时标题提取正确
- [x] Specs Tab 可见性由 manifest 的 `contracts` 键直接判定，零请求；无 Contract 时 Tab 不渲染（G4）
- [x] 类型上不存在 `showSelector`、`normalizeSpecPaths`（全仓 grep 零引用，编译通过）

---

### Task 5: 改造服务端中间件与 Contract 投影

**Goal**: 以 TDD 把 `/__xirang/spec` 端点改为 identity 寻址、删除 `/__xirang/specs` 端点，并将 change variant 的 Contract 投影从双层结构收缩为单层。

**Files**:
- Modify: `likec4/packages/vite-plugin/src/plugin.ts`
- Modify: `src/core/view.ts`
- Test: `test/core/view.test.ts`

**Requirements**:
- `/__xirang/specs` 中间件（`plugin.ts:439-467`）删除
- `/__xirang/spec` 中间件（`:468-512`）去掉 `path` 查询参数（`:476`）；formal 分支调用 `readXirangContract({projectRoot, element})`；change 分支从 manifest 的单层 `contracts[element]` 取 markdown
- `readRuntimeVariant`（`:429-438`）的 manifest 类型从 `{specs?, contents?}` 双层改为 `{contracts?: Record<string,string>}` 单层
- 守卫 `if (xirangProjectRoot && xirangSpecRegistry)`（`:427`）改为 `if (xirangProjectRoot)`；`readXirangSpecRegistry` 调用（`:428`）删除
- `createXirangSpecWatcher`（`:513-518`）沿用 Task 2 的新签名
- `view.ts`：`projectContracts`（`:90-111`）返回 `{contracts: Record<elementIdentity, markdown>}`，删除 `.xirang/specs/<specId>/spec.md` 虚拟路径构造（`:97`）；`ViewRuntimeVariant` 的 `specs`/`contents` 字段（`:67-68`）替换为 `contracts`
- `view.ts`：`writeSpecRegistrySnapshot`（`:182-195`）整体删除，含 `:210`、`:232` 两处调用与 `buildSpecRegistry` import（`:6`）
- `view.ts`：`launchEmbeddedLikeC4`（`:38-52`）删除 `--xirang-spec-registry` 参数（`:44-45`）；`ViewLaunchOptions.specRegistryFile`（`:15`）删除
- `view.ts`：`ViewLaunchOptions.architectureDir`（`:14`）改名 `likec4SourceDir`，`:259` 的构造改指 `.xirang/.cache-likec4/`（依据 `xirang-contract.md:130`）
- **不改动** `view.ts:241-243` 的 watcher 分区分辨与 `ViewCommand` 的命令注册——归属 CLI 切换 Change

#### Checks
- [x] `/__xirang/spec?project=p&element=cap.a` 在 formal variant 下返回该 Element 的 Contract markdown（实测 200）
- [x] 同一端点在 change variant 下返回 manifest 中 `contracts['cap.a']`
- [x] 缺少 `element` 参数时返回 400（实测）
- [x] `/__xirang/specs` 端点不再注册（请求回落到 SPA catch-all，无 JSON 端点）
- [x] `projectContracts` 输出以 element identity 为键，值为完整单元 markdown
- [x] `launchEmbeddedLikeC4` 传参不含 `--xirang-spec-registry`，且源目录为 `.xirang/.cache-likec4/`
- [x] `view.test.ts` 中 registry 快照相关断言已删除，其余用例通过

---

### Task 6: 删除 `--xirang-spec-registry` 透传链并验证 likec4 集成

**Goal**: 自下游向上游删除 flag 定义与透传，并以真实 `likec4 start` 验证生成目录作为源目录时的 project 发现与 watcher 行为。

**Files**:
- Modify: `likec4/packages/vite-plugin/src/plugin.ts`
- Modify: `likec4/packages/likec4/src/vite/config-app.ts`
- Modify: `likec4/packages/likec4/src/cli/serve/serve.ts`
- Modify: `likec4/packages/likec4/src/cli/options.ts`

**Requirements**:
- 删除顺序为 `plugin.ts`（`:103` 选项、`:204` 解构）→ `config-app.ts`（`:38` 类型、`:108` 透传）→ `serve.ts`（`:75` 类型、`:96` 解构、`:126` 透传）→ `options.ts`（`:138-144` 定义）
- `--xirang-project-root`（`options.ts:130`）与 `--xirang-change-manifest`（`:146`）保留
- `rpc/protocol.ts` 的 `xirangSpecChangedEvent` 保留——watcher 事件仍需要
- 以 `.xirang/.cache-likec4/` 为源目录实测 `likec4 start`：确认 project 发现成功、`.c4` 变更触发 HMR
- 若 HMR 失效但静态呈现正常，记录为已知降级，不阻塞本 Change（design.md R3）

#### Checks（G1-B：`--xirang-project-root` 核实零消费者后一并删除）
- [x] `likec4 start --help`（含 `--show-hidden`）不含 `--xirang-spec-registry`；全新构建的 dist 不含该字符串（yargs 非 strict 模式，未知 flag 被静默忽略而非报错，故以定义与产物双重核验取代「报未知选项」）
- [x] `--xirang-project-root` 透传链（options/serve/index/config-app/plugin）零残留
- [x] `--xirang-change-manifest` 仍生效：实测驱动 `/__xirang/changes`、`/__xirang/spec` 与 manifest 变更通知
- [x] 以生成目录 `.xirang/.cache-likec4/` 为源目录启动成功，project 发现成功，Browser 返回 200
- [x] 修改生成目录内 `.c4` 后触发 vite HMR（serve 日志 `hmr update`），无降级

---

### Task 7: 清理 fork 内失效测试并全量回归

**Goal**: 删除依赖已消失概念的测试用例，运行受影响测试套件确认无残留失败。

**Files**:
- Modify: `likec4/packages/diagram/src/overlays/element-details/SpecsTab.spec.tsx`
- Modify: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`
- Modify: `test/core/view.test.ts`

**Requirements**:
- 删除 `SpecsTab.spec.tsx` 中依赖 `showSelector`、`normalizeSpecPaths`、多路径选择器与 `specId` 正则的用例
- 删除 `architectureView.spec.ts` 中以 fqn 为对齐键断言的用例（已由 Task 3 的 identity 用例取代）
- 删除 `test/core/view.test.ts` 中 `writeSpecRegistrySnapshot` 与 `xirang-spec-registry.json` 相关断言
- 全仓 grep 确认无残留引用：`readXirangSpecRegistry`、`XirangSpecRegistrySnapshot`、`normalizeSpecPaths`、`getSpecsTabModel`、`XirangSpecIndexController`、`xirang-spec-registry`
- `likec4/packages/diagram/lib/**` 与 `dist/**` 为构建产物，不手改

#### Checks
- [x] `pnpm exec vitest run test/core/view.test.ts` 通过（主仓库全量 143 files / 1938 tests 绿）
- [x] diagram 包内 `SpecsTab.spec.tsx`、`architectureView.spec.ts` 通过（likec4 全仓 262 files / 2703 tests 绿）
- [x] `xirang-spec-handler.spec.ts` 全部查表安全用例通过
- [x] 全仓 grep 六个已删符号（及 `xirangProjectRoot`、`createXirangSpecWatcher`、`xirangSpecChangedEvent`、`isXirangSpecDiagnostic`、`architectureFingerprint`、`entry.scope`）均无引用
- [x] 与 `xirang-contract.md:72,93,97,130,132,200` 逐条核对实现一致

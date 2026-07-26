## 数据源协议的形状变化

现协议（`SpecLoaderContext.tsx:84-91`）是两段式：`list(project, element, variant) → string[]` 取路径集合，再 `load(project, element, path, variant) → {path, md}` 取内容。两段都以 spec 文件路径为寻址键。

目标协议退化为一段式：

```ts
export interface XirangContractContent {
  element: string
  md: string
}

export interface XirangSpecLoader {
  load(project: string, element: string, signal: AbortSignal, variant?: string): Promise<XirangContractContent | null>
  variants?(signal: AbortSignal): Promise<XirangRuntimeManifest>
  subscribe?(listener: (element: string) => void): () => void
  subscribeVariants?(listener: () => void): () => void
}
```

三处形状变化及其依据：

- **`list()` 删除**。一 Element 至多一份 Contract（`xirang-definition.md:99`），集合退化为 0/1，用返回 `null` 表达「无 Contract」即可，不需要独立的索引往返。
- **`path` 参数删除**。`.xirang/specs/<specId>/spec.md` 不再存在，寻址键是 element identity。
- **`subscribe` 载荷改为 element identity**。现载荷是变更文件路径（`HttpSpecLoader.ts:62`），`SpecsTab.tsx:283` 以 `changedPath === selectedPath` 比对；改为 identity 比对。

`XirangSpecContent{path, md}`（`SpecLoaderContext.tsx:3-6`）中的 `path` 字段是 UI 展示用的来源提示（`SpecsTab.tsx:337`）。它退化为 element identity 后语义从「文件路径」变为「实体标识」，字段名改为 `element` 以避免误解为可寻址路径。

`isXirangSpecDiagnostic`（`:74-77`）现以 `specs/`、`.xirang/specs/` 前缀判定诊断归属。目标态诊断路径指向 element 单元，判据改为 `.xirang/model/elements/` 前缀。

## 安全边界的重建方式

现防护是三层叠加（`xirang-spec-handler.ts`）：

| 层 | 位置 | 作用 |
|---|---|---|
| 输入格式白名单 | `:140-156 validateSpecPath`，前缀断言在 `:146` | 拒绝反斜杠、绝对路径、非 `.xirang/specs/` 前缀、非 `.md`、含 `.`/`..` 段 |
| 索引成员校验 | `:76-81` | 路径必须在该 element 的 registry 条目中 |
| realpath 包含检查 | `:84-99` + `:158-161 isPathInside` | 解析符号链接后必须仍在 `specsRoot` 内 |

三层共同防的是「客户端可控字符串被拼进文件路径」。数据源改为 element identity 后，可控字符串仍会被拼进路径（`elements/<identity>.md`），因此防护不可省，但可以更强：

**第一层改为 identity 字符集校验。** 契约已定 identity 为 `[A-Za-z0-9._-]+`（`xirang-contract.md:97`），不含 `/`、`\`、`:`。以正则整串匹配即可一次拒绝全部路径穿越形态——比现有的前缀白名单更严格，因为它是白名单字符集而非黑名单模式。需额外拒绝纯 `.`、`..` 以及以 `.` 开头的 identity，因为字符集本身允许 `.`。

**第二层改为存在性校验。** registry 消亡后，「该 element 是否有 Contract」由 `elements/` 下单元是否存在且正文非空决定。不存在返回 404，语义与现 `:76-78` 一致。

**第三层保留 realpath 包含检查**，根目录从 `.xirang/specs`（`:84`）改为 `.xirang/model/elements`。这一层防的是符号链接逃逸，与寻址键形态无关，必须原样保留。

三层缺一不可：字符集校验防路径穿越，存在性校验防越权枚举，realpath 检查防符号链接。Task 2 的回归用例逐层覆盖。

**默认命名约定不具规范性**（`xirang-contract.md:55`），因此 handler 不能假定 `elements/<identity>.md` 必然成立。正确做法是复用模型内核 Change 的 `parseSemanticModel` 与 `ModelIndex.moduleOf(identity)` 取得单元路径，再对该路径做 realpath 包含检查。字符集校验仍在最前置执行，防止非法 identity 进入索引查询。

## 对齐键修正

`architectureView.ts` 现有两处 fqn 依赖：

- `:141` `formalNodes` 以 formal DiagramView 的 `node.modelRef` 建索引，而 `modelRef` 在 `:59` 被赋为 `element.fqn`。
- `:145` 以 `element.fqn` 查该索引，命中则继承既有节点（含布局坐标），未命中则 `createNode` 新建。

fqn 不跨版本稳定（`xirang-contract.md:132`）意味着 `:145` 的查询会在重生成后整体 miss，所有节点走 `createNode` 的网格布局分支（`:69-72`），布局继承丢失且无诊断。

修正方式是把「身份对齐」与「布局继承」两件事分开：

- **身份对齐用 identity**。节点 id 与 `parent` 引用改用 element identity；`elements` map 本已以 identity 建索引（`:110`），`byFqn`（`:140`）改为 `byIdentity`。边 id 已是 `xirang:${source|kind|target}`（`:85`）且三元组即 Relationship identity，无需改动。
- **布局继承用 fqn，且容忍 miss**。formal DiagramView 由 LikeC4 产出，其节点键仍是 fqn，这是 LikeC4 的内部坐标系，无法回避。做法是保留 fqn → formal node 的查表，但仅取几何字段（`x`/`y`/`width`/`height`），miss 时回退到网格布局，不影响身份与 diff 着色。

由此 change variant 的节点集合、父子关系与 diff 着色完全由 identity 决定，fqn 只影响「布局是否被继承」这一非语义维度。

`:17 architectureEntries` 以 `entry.scope === 'architecture'` 过滤。差异输出不再携带分区（`xirang-contract.md:200`），改为按 entity type 过滤：`element-declaration`、`relationship`、`element-kind`、`relationship-kind`、`authored-view` 属结构类，`requirement`、`scenario` 属 Contract 类。视图合成只消费结构类。

`:108-109`与`:121-122` 的 `entry.kind === 'element'` / `'relationship'` 需同步为新的 `DiffKind` 取值（模型内核 Change 已定 `DiffKind` 对齐 `EntityType`，`element` → `element-declaration`）。

## diff 过滤对齐

`getStructuredSpecDiff(variant, specPath)`（`SpecsTab.tsx:189`）现有三个失效判据：

| 现判据 | 位置 | 失效原因 |
|---|---|---|
| `specPath.match(/^\.xirang\/specs\/([^/]+)\/spec\.md$/)` | `:190` | 路径形态不存在 |
| `entry.scope === 'specs'` | `:193` | 差异输出不携带分区 |
| `entry.identity.startsWith(`${specId}#`)` | `:193` | identity 前缀是 element identity |

改为 `getStructuredContractDiff(variant, element)`，过滤条件为 `entry.kind === 'requirement' && entry.identity.startsWith(`${element}#`)`。

`:208` 的诊断过滤 `diagnostic.path.includes(specId)` 同样改为按 element identity 匹配诊断路径。

Requirement 标题提取 `:198 identity.slice(indexOf('#') + 1)` 与 Scenario 标题提取 `:203 identity.slice(lastIndexOf('#') + 1)` 的语义在新 identity 形态下保持正确：`<element>#<requirement>` 用首个 `#` 分割，`<element>#<requirement>#<scenario>` 用末个 `#` 分割。但 element identity 允许含 `.` 不含 `#`（`xirang-contract.md:97`），因此首个 `#` 之前必为 element identity，两处提取无需改动。

## flag 删除链

`--xirang-spec-registry` 的透传链共五处，删除顺序自下游向上游以保持每步可编译：

| 顺序 | 文件 | 位置 |
|---|---|---|
| 1 | `vite-plugin/src/plugin.ts` | `:103` 选项声明、`:204` 解构、`:427-428` 守卫与 registry 读取 |
| 2 | `likec4/src/vite/config-app.ts` | `:38` 类型、`:108` 透传 |
| 3 | `likec4/src/cli/serve/serve.ts` | `:75` 类型、`:96` 解构、`:126` 透传 |
| 4 | `likec4/src/cli/options.ts` | `:138-144` 定义 |
| 5 | `src/core/view.ts` | `:44-45` 参数拼接、`:14` `specRegistryFile` 字段 |

`:427` 现为 `if (xirangProjectRoot && xirangSpecRegistry)`，删除后守卫退化为 `if (xirangProjectRoot)`——element Contract 读取只需 project root。

`readXirangSpecRegistry`（`xirang-spec-handler.ts:39-61`）与 `XirangSpecRegistrySnapshot`（`:10-13`）、`XirangSpecIndex`（`:6-8`）整体删除。

`--xirang-project-root` 与 `--xirang-change-manifest` 保留：前者是 element 单元读取的根，后者承载 change variant 的 diff 与 Contract 投影。

## `view.ts` 的职责边界

`view.ts` 是三组改动的汇合点，其中只有 Browser 侧属本 Change：

| 位置 | 内容 | 归属 |
|---|---|---|
| `:38-52 launchEmbeddedLikeC4` | likec4 源目录改指 `.xirang/.cache-likec4/`；删除 `--xirang-spec-registry` | 本 Change |
| `:90-111 projectContracts` | 虚拟 spec 路径投影 → element identity 键 | 本 Change |
| `:182-195 writeSpecRegistrySnapshot` | 整体删除 | 本 Change |
| `:210,232` registry 快照写入调用 | 删除 | 本 Change |
| `:241-243` watcher 的 `architecture/`、`specs/` 前缀分辨 | 改为四分区 | **CLI 切换 Change** |
| `:259 architectureDir` 构造 | 由生成产物目录替代 | 本 Change 消费，生成器 Change 产出 |
| `ViewCommand` 的 CLI 命令注册 | 不在本文件，属命令面 | **CLI 切换 Change** |

`projectContracts` 的改法：现以 `specId` 生成 `.xirang/specs/<specId>/spec.md` 虚拟路径作为 `specs`/`contents` 两个 map 的键（`:97-99`）。目标态 `specs` map 退化——variant 的 Contract 投影改为 `contracts: Record<elementIdentity, markdown>` 单层结构，`plugin.ts:451,483-492` 的 variant 分支随之简化为直接查表。

变更后 `ViewLaunchOptions`（`:12-18`）的 `architectureDir` 字段名与语义不再匹配（它将指向生成产物而非架构源），改名为 `likec4SourceDir`。

## 风险与回滚条件

**R1 安全边界退化（高）**。字符集校验、存在性校验、realpath 检查三层中任一遗漏都会扩大读取面。Task 2 的回归用例逐层覆盖，且必须包含 `..`、绝对路径、反斜杠、符号链接指向单元根之外、以 `.` 开头的 identity 五类输入。

**R2 对齐键修正不完整（高）**。`architectureView.ts` 有 8 处 fqn 引用（`:23,58,59,140,145,149,167,168,174`）。若只改 `:141,145` 而遗漏 `:149` 的 `parent` 引用或 `:167-174` 的边端点解析，会产生节点存在但父子关系错乱、或边悬空的混合态。Task 3 的用例必须覆盖「fqn 全部变化但 identity 不变」这一场景，断言节点集合、父子关系、边集合、diff 着色四项全部稳定。

**R3 生成目录的 likec4 集成行为未验证（中）**。`.xirang/.cache-likec4/` 作为 likec4 CLI 的源目录时，project 发现、watcher 与 HMR 行为均未实测。Task 6 以真实 `likec4 start` 验证；若 HMR 失效但静态呈现正常，接受降级并记录，不阻塞本 Change。

**R4 Contract 投影结构变更影响 change variant（中）**。`plugin.ts:432-435` 从 manifest 读 `variant.specs`/`variant.contents` 双层结构，改为单层 `contracts` 后若 `view.ts` 与 `plugin.ts` 不同步，change variant 的 Contract 呈现会静默为空。Task 5 以端到端用例覆盖 formal 与 change 两个 variant。

**回滚条件**：若安全回归用例（Task 2）在两轮内无法全部通过，则回退为「保留 `path` 参数形态，但 path 由服务端从 identity 反查后回填、客户端不可控」的折中方案——代价是协议保留一个无语义字段，收益是逃逸防护完全不依赖新写的字符集校验。

**测试策略**：`SpecsTab.spec.tsx` 的多路径选择器用例（依赖 `showSelector`）与 `getStructuredSpecDiff` 的 `specId` 用例删除；`architectureView.spec.ts` 的 fqn 对齐用例重写为 identity 对齐；`test/core/view.test.ts` 中 registry 快照断言删除。新增用例为 Task 2 的安全回归与 Task 3 的对齐稳定性，两者均为持久化测试，无一次性验证项。

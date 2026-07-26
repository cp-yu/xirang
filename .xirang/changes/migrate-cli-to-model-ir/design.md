## 消费的共享命名

本 Change 不新增命名，全部消费 `rebuild-semantic-model-kernel/design.md`「共享命名」节：

| 用途 | 签名 |
|---|---|
| 读模型 | `parseSemanticModel(root): Promise<ParsedModel>`，返回 `{ model, index, diagnostics }` |
| 校验 | `validateSemanticModel(model): ModelDiagnostic[]`，纯 IR 不落盘 |
| 读 Delta | `parseSemanticDelta(changeRoot): Promise<ParsedDelta>` |
| 应用 Delta | `applySemanticDelta(base, delta): DeltaApplication`，返回 `{ expected, touched, diagnostics }` |
| 最小重写 | `writeMinimal(root, previous, expected): Promise<Map<string, Buffer>>` |
| IR 类型 | `SemanticModel`、`ModelElement`、`ElementDeclaration`、`ElementKind`、`RelationshipKind`、`Relationship`、`AuthoredView`、`EntityType`、`Partition`、`PARTITIONS` |
| 索引 | `ModelIndex.moduleOf(identity)`、`moduleOfRelationship(rel)`、`organizationWarnings()` |

`ModelDiagnostic` 沿用 `{ level, code, path, message, identity? }`，因此现有 CLI 诊断渲染可直接复用。

## 读取层坍缩

旧栈有三个入口，新栈只有一个。

```text
旧: readArchitecture ──┬─ readProjectOpsx (死代码, C0 删)
                       └─ readLikeC4Architecture ──┬─ parseLikeC4Domain  (legacy)
                                                   └─ readV1 (LikeC4 runtime + FQN↔identity 映射)
新: parseSemanticModel(root) ─→ { model, index, diagnostics }
```

关键简化：`readV1`（`likec4-reader.ts:70-108`）通过动态 import LikeC4 runtime、`LikeC4.fromSource`、再用 `metadata.elementId` 把 FQN 反查为 identity。新栈持久源直接以 identity 引用（契约「引用规则」），整个映射层与 LikeC4 运行期依赖从读取路径消失。这也使 `arch query`/`search`/`impact`/`validate` 不再需要 LikeC4 进程。

**`profile` 双轨删除**。`profile === 'v1'` 判定出现在 13 处（`impact-cli.md` §0 结论行枚举）。新栈无 profile 概念，全部改为直接消费 IR。`architecture-validator.ts:16-19` 的 legacy/v1 分派整体删除，改为直接调 `validateSemanticModel`。

**`architecture-reader.ts` 语义保留**。该文件 23 行只做目录存在性包装与 `xirang setup` 引导文案。新栈仍需等价保护，但目标目录改为 `.xirang/model/`。实现上折叠进 `parseSemanticModel` 的诊断码 `MODEL_NOT_FOUND`，文件本身删除。

## `arch query` 的 Contract 内联

决策 2 定为全文内联。IR 侧 `ModelElement.requirements` 已内联，无需额外装配——这是 Element 单元的直接产物，不再有 specId → 路径 → 读文件 → 解析 frontmatter 这条链（旧链见 `query.ts:26` `specPath` + `:38` `buildSpecRegistry`）。

输出形状：

```ts
interface QueryElement {
  identity: string;
  kind: string;
  parent: string | null;
  title: string;
  summary: string;
  contract: 'required' | 'optional';   // 来自 metamodel element-kind
  requirements: Requirement[];          // 内联全文，可为空数组
  children: string[];                   // 派生字段，由 parent 反向索引
}
```

`children` 保留但标注为派生。契约规定 Declaration 只有 `parent`，`children` 不是持久字段；它由索引反向推导，用于 `refinement[]` 展开（旧实现 `query.ts:47`）。

**体积代价**：`impact` 已有 `contractBytes` 统计说明 Contract 正文可观。`arch query` 单元素查询体积可接受；`arch impact` 多元素查询需保留统计字段供调用方判断。

## `diff` 的 entity 过滤

`--scope` 的两值（`specs|architecture`）源自按语法载体切分的旧存储，而契约已规定差异输出不携带分区信息。替换为按 entity type 过滤：

```text
--entity element-declaration,requirement
```

`DiffKind` 取值对齐契约 `entity` 值，并补 `authored-view`：

| 旧 | 新 |
|---|---|
| `element` | `element-declaration` |
| `elementKind` | `element-kind` |
| `relationshipKind` | `relationship-kind` |
| `requirement` / `scenario` / `relationship` / `property` | 不变 |
| —— | `authored-view`（新增，补齐 Authored View 可被 Delta 作用但 Diff IR 无对应类型的缺口）|

`scenario` 与 `property` 是 diff 细粒度类型，不属于 Entry entity type，`--entity` 过滤时按其父条目的 entity 归属。

## `view.ts` 的 C3 / C5 职责边界

该文件同时承载 CLI 命令与 Browser 数据供给，两者必须划清。

**属于 C3**：

| 位置 | 改动 |
|---|---|
| `view.ts:238-252` watcher 前缀分流 | `architecture/` 与 `specs/` 两分支（`:241-242`）改为遍历 `PARTITIONS`；`changes/<name>/` 分支保留 |
| `view.ts:259` `architectureDir` 注入 | 改为 C2 生成产物目录 `.xirang/.cache-likec4/`，并在 launch 前触发生成 |
| `view.ts:63-64` `architectureFingerprint` / `specsFingerprint` | 改为四分区指纹 |
| `view.ts:6` `buildSpecRegistry` 导入 | 删除（C1 已删该模块） |
| `cli/index.ts:171-183` 命令注册 | 选项与描述文案 |

**属于 C5**：

| 位置 | 改动 |
|---|---|
| `view.ts:90-122` `projectContracts` | Contract 投影结构（`:97` `.xirang/specs/${specId}/spec.md` 路径拼装）|
| `view.ts:182-195` `writeSpecRegistrySnapshot` | 产出 `xirang-spec-registry.json` 的整条链 |
| `view.ts:38-53` `launchEmbeddedLikeC4` 的 `--xirang-spec-registry` flag | 与 vite-plugin 中间件、`SpecLoaderContext`、`SpecsTab` 一并改 |

**衔接约定**：C3 不删除 `writeSpecRegistrySnapshot` 与 `projectContracts`，只把它们对 `buildSpecRegistry` 的依赖改为直接消费 `ParsedModel`，保持函数签名与产物文件名不变。C5 再决定该产物的最终形态。这样 C3 完成时 Browser 仍可启动（数据源已切换但契约未变），C5 独立可验证。

## 事务骨架复用

`change-sync.ts` 约 400 行与记法无关，C1 已完成分区参数化（`PARTITIONS` 常量替换 `['architecture','specs']` 硬编码）。本 Change 只改**记法相关**部分：

| 位置 | 改动 |
|---|---|
| `:632-729` legacy delta 路径（`parseLegacyArchitectureDelta`、`sameDomain:672`、`sameCapability:679`、`assessLegacyElementExtensions:688`）| 删除 |
| `:756-810` `readArchitectureDelta` / `assertArchitectureDeltaOperations` / `stripLikeC4Comments` / `architectureDeltaModuleName` | 删除，改为 `parseSemanticDelta(changeRoot)` |
| `:229-232` 写回分派（`writeSemanticArchitectureSnapshot` vs `mergeArchitectureDelta`）| 改为 `writeMinimal(root, previous, expected)` 单一路径 |
| `:233` `writeSpecsToTarget` | 删除，Contract 随 Element 单元由 `writeMinimal` 一并写出 |
| `:236` `validateTargetSemanticModel` | 改为内存 `validateSemanticModel(expected)`，不再需要临时目录落盘 + LikeC4 校验 |
| `:209,237,583,853` profile 分支 | 删除 |

保留不动：journal 读写、`buildManifest`、`assertManifestPreimages`、`applyManifestEntry`、`rollbackManifest`、`applySemanticDirectoryTransaction`、`recoverSemanticDirectoryTransaction`。

**`specs-apply.ts` 整体删除**（518 行）。其 Requirement 分节语义（`## ADDED/MODIFIED/REMOVED Requirements`）由 C1 的 `delta.ts` 承担，`requirement-blocks.ts` 作为记法无关解析器继续复用。

## `change-compiler.ts` 接线

保留 diff 与校验逻辑，替换读写层：

| 保留 | 替换 |
|---|---|
| `:219 validateTarget` 语义 | 读取：`:529 readArchitectureModel` / `:595 readFormalSemanticModel` → `parseSemanticModel` |
| `:342 validateTargetSemanticModel` 语义 | Delta 解析：`parseArchitectureDelta` → `parseSemanticDelta` |
| diff 生成 | 应用：内联 apply 逻辑 → `applySemanticDelta` |
| —— | 诊断 `path`：固定 `'architecture-delta.c4'`（`:80,117,122,270-301`）与 `specs/<id>/spec.md`（`:325,584-586`）→ 实际单元路径 |

`:531` profile 分支与 `:165` `ELEMENT_KIND_CHANGE` 由 C1 处理，本 Change 不重复。

## 命令面迁移顺序

按依赖排序，使每一步的失败面尽可能局部：

```text
读取层接线 (change-compiler, change-sync)
  ↓
只读命令 (arch query, search, impact, plan-remove, validate, export)
  ↓
写命令 (diff, sync, archive)
  ↓
聚合命令 (list, validate, candidate)
  ↓
骨架与文案 (setup, update, help)
  ↓
旧栈删除 + 全量绿
```

只读命令先行的理由：它们只消费 `ParsedModel`，不触碰事务，可在 sync 尚未切换时独立验证。

## 风险与回滚条件

**R1 构建断裂窗口**。旧栈删除（Task 10-11）与接线完成之间无法运行测试。缓解：按迁移顺序推进，使删除集中在最后两个 Task；删除前先确认全部命令已切换（Task 9 的 Check 为「无源文件 import 旧栈模块」）。

**R2 JSON 契约破坏未被测试捕获**。10 个命令的 `--json` 输出形状改变，若测试只断言 exit code 会静默漏过。缓解：§6.3 的 21 个夹具类测试中，凡断言 JSON 结构者升级为逐字段断言；`arch query`/`impact` 增加内联 Contract 的形状断言。

**R3 `arch query` 内联 Contract 导致体积回归**。全文内联在 Element 拥有大量 Requirement 时显著放大输出。缓解：保留 `impact` 的 `contractBytes` 统计；若单次输出超出可用阈值，回退条件见下。

**R4 `view.ts` 的 C3/C5 边界被跨越**。该文件两侧职责交织，改动易溢出到 C5 范围。缓解：C3 只改 watcher、生成产物注入、指纹与 registry 的数据源，保持 `writeSpecRegistrySnapshot` 与 `projectContracts` 的签名与产物文件名不变。Check 为「`xirang view` 可启动且产物文件名未变」。

**R5 setup 骨架种子缺失**。`.c4` skeleton（`architecture-skeleton.ts`）删除后，新项目需要 metamodel 种子单元，否则 `setup` 后模型为空且 `validate` 立即失败。缓解：Task 8 明确产出 metamodel Markdown 种子（至少一个 root element-kind），并以「setup 后 validate 通过」为 Check。

**回滚条件**：若 Task 10-11 的旧栈删除导致 §6.3 的夹具类测试出现两轮内无法定位的失败，则回退删除、恢复旧栈文件，仅保留接线与命令面改动，代价是双栈并存需额外声明一个清理 Change。若 R3 的体积回归不可接受，则 `arch query` 的 Contract 内联退化为 `--contract` 开关（默认关闭），此为决策 2 的局部修正，需用户确认。

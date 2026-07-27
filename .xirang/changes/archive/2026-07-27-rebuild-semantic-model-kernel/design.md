## 共享命名

后续四个 Change 直接引用本节。所有新增代码位于 `src/core/model/`，与旧栈 `src/utils/likec4-*.ts`、`src/core/architecture-delta-parser.ts` 并存直至 C3 切换完成。

### 模块布局

```text
src/core/model/
├── types.ts          IR 类型与 entity type 联合
├── frontmatter.ts    frontmatter 分离与固定键序渲染
├── parser.ts         四分区 → IR
├── serializer.ts     IR → 四分区（确定性）
├── index-map.ts      identity → source module 索引
├── validator.ts      IR 语义校验
├── delta.ts          Delta 解析与应用
├── sync-writer.ts    最小重写 + 事务提交
└── transaction.ts    与记法无关的事务高阶骨架（由 `change-sync.ts` 逐字移入）
```

`transaction.ts` 导出：`SEMANTIC_PARTITIONS`、`SEMANTIC_DIRECTORY_JOURNAL`、`readSemanticDirectoryTree`、`readSemanticTree`、`semanticTreeFingerprint`、`buildManifest`、`applySemanticTreeManifest`、`applySemanticDirectoryTransaction`、`recoverSemanticDirectoryTransaction`，以及 `PreparedSyncManifestEntry`、`SyncTransactionFileSystem`、`SemanticTreeTransactionOptions`、`SemanticDirectoryTransactionFileSystem`、`SemanticDirectoryTransactionOptions`。

这些符号原位于 `change-sync.ts`，逐字移出以切断「事务骨架」与「旧记法读写」的耦合；`change-sync.ts` 保留纯 re-export shim，使现有消费点不变。**C3 删除 `change-sync.ts` 旧半边时必须同时删除该 shim**，让消费点直接指向 `src/core/model/transaction.ts`，不得留下永久转发层。

### IR 类型（`src/core/model/types.ts`）

```ts
export type EntityType =
  | 'element-declaration'
  | 'element-kind'
  | 'relationship-kind'
  | 'authored-view';

export type Partition = 'metamodel' | 'elements' | 'relationships' | 'views';
export const PARTITIONS: readonly Partition[];

export interface ElementDeclaration {
  identity: string;
  kind: string;
  parent: string | null;
  title: string;
  summary: string;
}

export interface Requirement {
  name: string;
  body: string;
  scenarios: Scenario[];
}

export interface Scenario {
  name: string;
  body: string;
}

/** Element = Declaration + Contract，Contract 即 `## Requirements` 段 */
export interface ModelElement {
  declaration: ElementDeclaration;
  requirements: Requirement[];
}

export interface ElementKind {
  identity: string;
  contract: 'required' | 'optional';
  root?: boolean;
  parents?: string[];
  children?: string[];
  /** 该 Kind 所有实例共享的语义（单元正文），缺省为空串 */
  body: string;
}

export interface RelationshipKind {
  identity: string;
  sourceKinds?: string[];
  targetKinds?: string[];
  /** 该 Kind 所有实例共享的语义（单元正文），缺省为空串 */
  body: string;
}

/** identity 即全部内容，无其他字段 */
export interface Relationship {
  source: string;
  kind: string;
  target: string;
}

export interface AuthoredView {
  identity: string;
  include: '*' | string[];
  of?: string;
  title?: string;
  autoLayout?: string;
}

export interface SemanticModel {
  elementKinds: ElementKind[];
  relationshipKinds: RelationshipKind[];
  elements: ModelElement[];
  relationships: Relationship[];
  views: AuthoredView[];
}
```

`SemanticModel` 取代 `TargetSemanticModel`（`semantic-model.ts:62`）。`ModelElement` 合并旧 `SemanticElement`（`:20`）与 `SemanticContract`（`:49`），移除 `fqn`、`children`、`metadata`、`specId`、`elementId` 五个派生或冗余字段。`Relationship` 移除 `description`（`semantic-model.ts:35`）。`ElementKind.contract` 取代 `SemanticElementKind.contractPolicy`（`:5`）。

正文字段一律为 `string` 而非 `string?`：缺省即空串，避免 `undefined` 与 `''` 表达同一状态而破坏确定性序列化。正文按契约「散文逐字比较，仅规范化行尾与文件末尾空白」参与语义比较。`views/` 单元不承载正文，正文非空时由 parser 报 `VIEW_BODY_UNSUPPORTED`，不静默丢弃。

`ModelElement` 不保留 `## Requirements` 之前的前言。Delta 记法在 `elements/` 只有 Element Declaration Entry 与 Requirement Entry，前言无 Entry 可寻址，保留它等于制造永久冻结区。因此契约规定 Contract 正文即 `## Requirements` 段，描述性文字由 Declaration 的 `summary` 承载；`elements/` 正文出现该段以外的内容时由 parser 报 `UNSUPPORTED_CONTRACT_CONTENT`。存量 `.xirang/specs/**` 的 `## Purpose` 不迁移，模型整体 rebuild。

### 索引类型（`src/core/model/index-map.ts`）

```ts
export interface SourceModule {
  partition: Partition;
  /** 相对 model root 的 POSIX 路径，仅用于写回定位，不参与语义 */
  path: string;
}

export interface ModelIndex {
  /** entity identity → 所在单元 */
  moduleOf(identity: string): SourceModule | undefined;
  /** Relationship 由三元组定位其列表容器 */
  moduleOfRelationship(relationship: Relationship): SourceModule | undefined;
  /** 组织约定不符：条目 entity type 与所在分区不匹配 */
  organizationWarnings(): OrganizationWarning[];
}

export interface OrganizationWarning {
  identity: string;
  declared: EntityType;
  partition: Partition;
  path: string;
}
```

### 函数签名

```ts
// parser.ts
export async function parseSemanticModel(root: string): Promise<ParsedModel>;
export interface ParsedModel {
  model: SemanticModel;
  index: ModelIndex;
  diagnostics: ModelDiagnostic[];
}

// serializer.ts —— 确定性：相同 IR 逐字节相同输出
export function serializeSemanticModel(model: SemanticModel): Map<string, Buffer>;
export function serializeElementUnit(element: ModelElement): string;
export function serializeRelationshipContainer(kind: string, items: Relationship[]): string;

// validator.ts
export function validateSemanticModel(model: SemanticModel): ModelDiagnostic[];

// delta.ts
export async function parseSemanticDelta(changeRoot: string): Promise<ParsedDelta>;
export function applySemanticDelta(base: SemanticModel, delta: SemanticDelta): DeltaApplication;
export interface DeltaApplication {
  expected: SemanticModel;
  /** 受影响 identity，供最小重写定位单元 */
  touched: Set<string>;
  diagnostics: ModelDiagnostic[];
}

// sync-writer.ts
export async function writeMinimal(
  root: string,
  previous: ParsedModel,
  expected: SemanticModel,
): Promise<Map<string, Buffer>>;
```

`ModelDiagnostic` 沿用 `ChangeDiagnostic`（`semantic-diff.ts:17`）的 `{ level, code, path, message, identity? }` 形状，便于 CLI 复用现有渲染。

### Delta 类型

```ts
export type Operation = 'ADDED' | 'MODIFIED' | 'REMOVED';

export type DeltaEntityType = EntityType | 'requirement' | 'relationship';

export interface DeltaEntry {
  operation: Operation;
  entity: DeltaEntityType;
  identity: string;      // requirement 为 `<element identity>#<name>`；relationship 为 `source\0kind\0target`
  target?: unknown;      // REMOVED 不携带内容
}

export interface SemanticDelta {
  entries: DeltaEntry[];
}
```

## 模块边界

**parser 只做记法到 IR 的转换**，不做语义判断。分区不参与 entity type 判定：条目由 frontmatter `entity` 字段自声明，出现在不匹配分区时仍按自身声明解析，并经 `organizationWarnings()` 报告组织约定不符（契约「entity 自声明」末段）。

**validator 只消费 IR**，不接触文件系统。这使校验可在 Delta 应用后的内存模型上直接执行，无需先落盘——`promotion.ts:263` 现有的 `postWrite` 二次校验因而可简化。

**serializer 与 parser 互为逆**，round-trip 属性由测试保证，不作为运行期断言（契约「Sync 保证」末段）。

**sync-writer 只计算受影响单元的字节内容**，事务提交交给现有骨架。

## 与现有事务骨架的复用方式

`change-sync.ts` 中约 400 行与记法无关，必须保留：

| 复用对象 | 位置 | 作用 |
|---|---|---|
| `readSemanticDirectoryTree` | `:899-919` | 目录 → `Map<path, Buffer>` |
| `semanticTreeFingerprint` | `:926-935` | 陈旧检测指纹 |
| `buildManifest` | `:937-957` | 前后镜像 → 写/删条目 |
| `assertManifestPreimages` | `:967-978` | 提交前 preimage 校验 |
| `applyManifestEntry` | `:980-1008` | 临时文件 + rename |
| `rollbackManifest` | `:1009-1029` | 逆序回滚 |
| `applySemanticDirectoryTransaction` | `:348-` | 目录级原子替换 |
| `recoverSemanticDirectoryTransaction` | `:300-346` | 崩溃恢复 |
| journal 读写 | `:262-270` | `SemanticDirectoryTransactionJournal` |

**唯一需要改动的是分区元组**。`['architecture', 'specs']` 硬编码于 `:276`、`:285`、`:314`、`:369`，`readSemanticDirectoryTree:917-918` 固定遍历两个目录，`resolveManifestPath:1031` 白名单同样只允许两者。改法是引入 `SEMANTIC_PARTITIONS` 常量（四分区 + C3 删除的旧两者，保证向后兼容）并将这些位置参数化，其余逻辑不动。

`buildManifest:949` 由路径前缀 `.xirang/architecture/` 派生 `scope: 'architecture' | 'spec'`。按决策 5，差异输出不得携带分区信息，`PreparedSyncManifestEntry.scope` 降级为写回内部字段或直接移除——但 manifest 本身是文件级事务结构，保留 `partition: Partition` 用于定位是可接受的；对外的 `ChangeDiffEntry` 必须移除 `scope`。

**可复用的记法无关解析器**：`requirement-blocks.ts:32 extractRequirementsSection` 与 `:132 parseDeltaSpec` 处理 `### Requirement:` / `#### Scenario:` 与 `## ADDED/MODIFIED/REMOVED Requirements` 分节，契约保留了这套记法，两者直接复用，仅需把返回结构接到新 IR。

## 八项决策的落地

| # | 决策 | 落地点 |
|---|---|---|
| 1 | 字段名统一 `contract` | `types.ts` `ElementKind.contract`；删除 `ContractPolicy` 别名（`semantic-model.ts:1`）；`semantic-model-validator.ts` 的 `MISSING_CONTRACT_POLICY` 改名为 `MISSING_CONTRACT` |
| 2 | `arch query` 内联 Contract 全文 | IR 侧 `ModelElement.requirements` 已内联，无需额外结构；CLI 投影属 C3 |
| 3 | 生成产物落 `.xirang/.cache-likec4/` | 本 Change 只需保证 serializer 不写该目录；生成器属 C2 |
| 4 | Requirement identity 复合 | `DeltaEntry.identity` 对 requirement 取 `<element identity>#<name>`；单元内只书写 `<name>`，由所在单元补全宿主 |
| 5 | 删 `--scope` 改 `--entity` | 删除 `semantic-diff.ts:14 DiffScope` 与 `:27 scope` 字段；`DiffKind:15` 取值对齐 `EntityType` 并补 `authored-view`；CLI flag 属 C3 |
| 6 | 默认命名 = identity | serializer 按 `elements/<identity>.md` 等约定产出；parser 不依赖该约定，仅用 `entity` + `identity` 定位 |
| 7 | relationships 按 Kind 分组 | `serializeRelationshipContainer(kind, items)` 每个 Relationship Kind 一个容器 |
| 8 | 旧 skill 清单不处理 | 本 Change 不触及 `update.ts:308-314`、`skill-generation.ts:27-28` |

### 规则收敛的具体位置

- **一 Element 至多一 Contract**：结构性成立——Contract 是 `ModelElement` 的正文，无从绑定第二份。删除 `spec-registry.ts:24 elementToSpecs: Map<string, string[]>` 与 `:26 getSpecsForElement(): string[]`。
- **Relationship 无 MODIFIED**：`delta.ts` 解析期拒绝，诊断码 `RELATIONSHIP_MODIFIED_UNSUPPORTED`。替代 `architecture-delta-parser.ts:212` 的宽松分派。
- **Relationship 无 `description`**：`types.ts` 不含该字段；连带移除 `architecture-delta-parser.ts:303-313 parseRelationshipBody`。
- **允许改 Kind**：删除 `change-compiler.ts:165 ELEMENT_KIND_CHANGE`。`kind` 是 Declaration 的普通字段，MODIFIED 声明完整目标态即可。
- **取消冗余绑定**：删除 `spec-frontmatter.ts` 整文件与 `semantic-checks/metadata-validator.ts:15-19 SPEC_NOT_FOUND`。
- **identity 字符集**：`validator.ts` 校验 `/^[A-Za-z0-9._-]+$/`，诊断码 `INVALID_IDENTITY`。
- **Kind identity 全局唯一**：`validator.ts` 跨 `elementKinds` 与 `relationshipKinds` 检测重名，诊断码 `DUPLICATE_KIND_IDENTITY`。
- **保留的校验**：`semantic-model-validator.ts:32-51` root 判定、`:98-117` relation endpoint 与 kind 约束逻辑照搬到新 validator。
- **删除的校验**：`ownership-validator.ts`（27 行，domain/capability 二层模型，职责已由 `MISSING_PARENT`/`INVALID_CONTAINMENT` 覆盖）；`metadata-validator.ts`（21 行，`capabilityId` 与 `metadata.specs` 校验端）。
- **`relation-validator.ts:52`** 的 `DUPLICATE_RELATION` key `source\0kind\0target` 恰等于新 Relationship identity，直接复用。

## 风险与回滚条件

**R1 半迁移期测试失败**。`change-sync.ts`、`change-compiler.ts` 被修改但 CLI 仍走旧路径，`test/integration/sync-workflow.test.ts` 等 14 个重写类测试会失败。

缓解：本 Change 内新旧读写层**并存**——新增 `src/core/model/` 全套，旧 `likec4-reader.ts` / `architecture-delta-parser.ts` 保持可用；仅对 `change-sync.ts` 做分区参数化这类向后兼容改动。旧栈删除与 CLI 切换统一由 C3 承担。因此本 Change 的验收标准是**新模块测试全绿且旧测试不新增失败**。

**R2 分区参数化破坏事务不变量**。`resolveManifestPath:1029` 的白名单是路径逃逸防线，`recoverSemanticDirectoryTransaction:314` 的分区遍历决定崩溃恢复完整性。改错会静默削弱「全或无」。

缓解：分区常量化后补充逃逸测试（`../`、绝对路径、非四分区前缀）与崩溃恢复测试（journal 存在但目录部分替换）。

**R3 确定性序列化未覆盖边界**。转义、多行文本、空集合、缺省字段任一处理不当，都会让相同 IR 产出不同字节，最小重写随之失效。

缓解：`fast-check@4.6.0`（`package.json:78`）属性测试生成随机 IR 验证 `parse(serialize(ir)) ≡ ir` 与 `serialize(ir) === serialize(ir)`。

**R4 Candidate 分区推广遗漏**。`promotion.ts:47 snapshotTargetTree` 与 `:62 stageCandidateTarget` 各有一处 `architecture/|specs/` 前缀过滤，遗漏会使新分区文件被静默丢弃，而 promotion 仍报成功。

缓解：补充「Candidate 含四分区文件，promotion 后 `.xirang/model/` 四分区齐全」的集成测试。

**回滚条件**：若分区参数化导致 `test/integration/archive-workflow.test.ts` 或 `test/commands/candidate-promote.test.ts` 出现新失败，且两轮内无法定位，则回退 `change-sync.ts` 与 `promotion.ts` 的改动，改由 sync-writer 自带独立事务实现，代价是「全或无」需重新证明。

**残留依赖**：本 Change 完成后 `.xirang/model/` 仍无数据——仓库自身模型由 C2/C3 完成后的一次 Semantic Model Build 产出，不在本 Change 范围。因此本 Change 的所有测试均使用临时目录夹具，不读取仓库现有 `.xirang/architecture/`。

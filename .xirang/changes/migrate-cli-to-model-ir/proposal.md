## Why

C1 建立了 `src/core/model/` 内核，C2 建立了 LikeC4 生成器，但两者都是纯新增——CLI 与同步层仍走旧栈。当前状态下 `.xirang/model/` 无消费者，`.xirang/architecture/` + `.xirang/specs/` 仍是唯一被读取的持久源，而 C1 已删除 `spec-registry.ts`、`spec-frontmatter.ts` 与 `architecture-delta-parser.ts`，其六个消费点（`arch/query.ts:1`、`arch/impact.ts`、`arch/search.ts`、`change-sync.ts`、`core/validation/validator.ts`、`core/view.ts:6`）处于编译断裂状态。

本 Change 是唯一的原子切换点，必须一次完成三件互相牵制的事：

1. **接线**。`change-compiler.ts`（662 行）与 `change-sync.ts`（1076 行）改接 C1 的 `parseSemanticModel` / `applySemanticDelta` / `writeMinimal`，保留事务骨架。
2. **旧栈删除**。legacy profile 双轨分支散布 8 个源文件；`likec4-parser.ts`（191 行）、`likec4-reader.ts`（151 行）、`architecture-reader.ts`（23 行）、`architecture-delta-merger.ts`（417 行）、`architecture-delta-validator.ts`（67 行）、`specs-apply.ts`（518 行）随之失效。
3. **CLI 命令面**。10 个命令破坏对外 JSON 契约，另有 4 个命令面整体消失。这些改动无法与前两项解耦——`arch query` 的输出字段直接由 IR 形状决定。

任何进一步拆分都会留下不可编译的中间态且无法独立验证。C1/C2 期间允许构建断裂，**到本 Change 终止**：完成时必须恢复全量测试绿。

## What Changes

- **读取层切换**：所有命令改经 `parseSemanticModel(root)` 读 `.xirang/model/` 四分区。删除 `readLikeC4Architecture` 及其 `profile: 'legacy' | 'v1'` 双轨（分叉点见 `impact-cli.md` §0 结论行）。`architecture-reader.ts` 的目录存在性包装与 `xirang setup` 引导文案保留语义、改指 `.xirang/model/`。

- **命令面删除**：`xirang spec show|validate`（`src/commands/spec.ts` 193 行全文件）；`xirang list --specs`（`list.ts:180-223`）；`arch validate --delta <path>`；`validate --artifacts specs|architecture-delta` 枚举。

- **`arch query`**：删 `element.fqn`（`query.ts:35` 查找键、`:158` 文本输出）、`specs: string[]`（`:12`、`:42`）、`relation.description`（`:172`）；`contractPolicy`（`:11`、`:41`）改名 `contract`；**新增 `--contract` 开关（默认关闭）控制是否内联 Contract 全文**（决策 2 修正版），开启时来源为 `ModelElement.requirements`，关闭时仅返回 Contract 是否存在；legacy 分支（`:21` `canonicalId`、`:137` profile 分叉）整体删除。FQN 输入改为显式错误，对齐 `impact.ts:126` 现有做法。

- **`arch search`**：evidence 字段枚举（`search.ts:13`）由七项收缩为 `elementId | title | summary | requirement`，删 `fqn`/`specId`/`spec.purpose`/`spec.requirement`；删 `ownedSpecs`；rank 常量重编号。

- **`arch impact`**：删 FQN 探测分支（`impact.ts:126-127`）与 contract 绑定诊断（registry 诊断 + `invalidBindings`）；`contractPolicy`（`:11`、`:116`、`:236`）改名 `contract`；`relationKey`（`:55`）去掉 description 项；`contracts[]` 由 `{specId, elementId, path, content}` 改为 `{elementId, requirements}`。

- **`arch plan-remove`**：参数由 `<element-id-or-fqn>` 改 `<element-id>`，删 FQN 查找（`:75`）与 `subject.fqn`（`:15`）；`RemovalDependencyType`（`:6`）删 `spec-binding`（`:67`，条件在 `:66` `contract.elementId`）与 `reference`（`:52`，来自 `:50` metadata 扫描），保留 `descendant`（`:45`）与 `relationship`（`:60`）。

- **`arch validate`**：校验对象由 `.xirang/architecture` 改 `.xirang/model/`，改用 C1 的 `validateSemanticModel(model)`（纯 IR，不落盘）；`--delta <path>` 改 `--change <name>`。

- **`arch export`**：前置 C2 生成步骤，产物落 `.xirang/.cache-likec4/`，再交 LikeC4 export。

- **`diff`**：删 `--scope`（`diff.ts:19-23` `normalizeScope`），改 `--entity <type>`（支持逗号多值）；`DiffKind` 补 `authored-view`，取值对齐契约 `entity`（`element` → `element-declaration`、`elementKind` → `element-kind`、`relationshipKind` → `relationship-kind`）。

- **分区词汇推广**：`sync` 输出摘要由 `specs: N / architecture: N` 改四分区计数；`archive` sync gate、`list` changes 模式、`validate`、`candidate` inventory（`workspace.ts:21-22`、`validator.ts:486-487`、`candidate.ts:38`）、`setup` 骨架（`setup.ts:362,378,399-408`）、`help` authoring topic（`help.ts:7,22` `architecture-delta.c4`）同步改为四分区。

- **旧栈删除**：`likec4-parser.ts`、`likec4-reader.ts`、`architecture-reader.ts`、`architecture-delta-merger.ts`、`architecture-delta-validator.ts`、`specs-apply.ts`、`spec.ts` 及全部 legacy 分支。

## 目标语义依据

本 Change 不定义目标语义，仅实现以下已确认规范，并消费 C1 `design.md` 的共享命名：

| 依据 | 章节 |
|---|---|
| `xirang-contract.md` | 「存储结构」——`.xirang/model/` 为唯一持久化根，四分区 |
| `xirang-contract.md` | 「单元形态」——字段表、Requirement identity 复合、identity 约束 |
| `xirang-contract.md` | 「引用规则」——一律 identity 引用，FQN 不入持久源 |
| `xirang-contract.md` | 「LikeC4 边界」——`.c4` 为生成产物，落 `.xirang/.cache-likec4/`，不入版本控制 |
| `xirang-contract.md` | 「Sync 保证」——最小重写、确定性序列化、全或无 |
| `xirang-contract.md` | 「语义差异判定」——差异输出以 entity type 与 identity 为键，不携带分区 |
| `xirang-definition.md` | §1 Semantic Model——identity 是引用语义对象的唯一依据 |
| `xirang-definition.md` | §3 Element Contract——一个 Element 至多一个 Contract |
| 决策 1 | 字段名统一 `contract` |
| 决策 2（修正版）| `arch query --contract` 内联 Contract 全文，默认关闭 |
| 决策 3 | 生成产物落 `.xirang/.cache-likec4/` |
| 决策 5 | 删 `--scope` 改 `--entity`；`DiffKind` 补 `authored-view` 并对齐 `entity` |

本次不执行 sync，因此不产出 `architecture-delta.c4` 或 change-local `specs/`。

## Impact

### 被破坏的对外 JSON 契约

| 命令 | 破坏点 |
|---|---|
| `arch query --json` | 删 `element.fqn`、`element.metadata`、`specs[]`、`relation.description`；`contractPolicy` → `contract`；新增内联 `requirements[]`；`element.children` 降为派生字段 |
| `arch search --json` | `evidence[].field` 枚举由 7 项收缩为 4 项；删 `ownedSpecs[]`；rank 重编号致排序结果变化 |
| `arch impact --json` | 删 FQN 错误分支；`contractPolicy`（`:11,116,236`）→ `contract`；`contracts[]` 形状由 `{specId, elementId, path, content}` 改 `{elementId, requirements}`；`statistics.contractCount/contractBytes` 语义变更 |
| `arch plan-remove --json` | 删 `subject.fqn`；`RemovalDependencyType` 删 `spec-binding`/`reference` |
| `arch validate --json` | `errors[].path` 由 `architecture-delta.c4` 改具体单元路径；LikeC4 exit-code 错误路径消失 |
| `diff --json` | 删 `ChangeDiffEntry.scope`（`semantic-diff.ts:27`）；`DiffKind` 取值改名并补 `authored-view` |
| `validate --json` | `issues[].path` 定位变更；`--artifacts` 枚举移除 |
| `list --specs --json` | 整个子模式删除 |
| `spec show --json` | 整个命令删除 |
| `candidate status\|validate --json` | `inventory` 由 `{architectureFiles, specFiles}` 改四分区 |

### 文件面

**修改**：`change-compiler.ts`、`change-sync.ts`、`arch/{query,search,impact,plan-remove,validate,export}.ts`、`arch/index.ts`、`diff.ts`、`sync.ts`、`validate.ts`、`list.ts`、`archive.ts`、`candidate/{workspace,validator}.ts`、`candidate.ts`、`setup.ts`、`help.ts`、`cli/index.ts`、`core/validation/validator.ts`、`utils/architecture-validator.ts`、`core/view.ts`（仅 CLI 注册与 watcher 分区，见 `design.md` C3/C5 边界）。

**删除**：`commands/spec.ts`（193）、`utils/likec4-parser.ts`（191）、`utils/likec4-reader.ts`（151）、`utils/architecture-reader.ts`（23）、`utils/architecture-delta-merger.ts`（417）、`validation/architecture-delta-validator.ts`（67）、`core/specs-apply.ts`（518）、`utils/semantic-model.ts` 残余类型。

**测试**：按 `impact-legacy-tests.md` §6.2 重写 14 个、§6.3 改夹具 21 个。§6.1 的 12 个删除属 C0，不在此。

### 不属于本 Change

fork grammar 回退（C2）；workflow 与 Internal Agent 模板（C4）；Semantic Browser 的 diagram 侧、vite-plugin spec handler、`SpecLoaderContext`、`SpecsTab`、`architectureView` identity 对齐（C5）；opsx YAML 死代码删除（C0）。C1 已声明删除的 `spec-registry.ts`、`spec-frontmatter.ts`、`semantic-checks/{ownership,metadata}-validator.ts`、`architecture-delta-parser.ts` 不在本清单，本 Change 只负责其消费点改造。

### 风险

**构建断裂在本 Change 内收敛**。切换期间同时存在「旧栈已删、新接线未完成」的窗口，期间无法运行任何测试。缓解方式是按 `tasks.md` 顺序推进：先接线读取层（Task 1-2），再逐命令迁移（Task 3-9），最后统一删除旧栈（Task 10-11），使断裂窗口集中在 Task 10-11 之间而非贯穿全程。最后一个 Check 强制全量测试绿。

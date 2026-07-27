## Why

当前 Semantic Model 分裂为两条按语法载体切分的存储流：`.xirang/architecture/**/*.c4` 承载 Metamodel、Element Declaration 与 Relationship，`.xirang/specs/<id>/spec.md` 承载 Element Contract。这条切线横穿语义对象——一个 Element 由 Declaration 与 Contract 共同组成，却被分到两棵树，由此派生出四类结构性缺陷：

1. **位置引用导致级联重写**。持久源以 LikeC4 FQN 互相引用（`likec4-reader.ts:91` 记录 `fqn`，`:95` 由 FQN 反查 parent identity）。祖先改名或移动会使后代的 `extend <FQN>` 全部失效，一处语义变更被放大成多文件重写。

2. **写回器销毁作者存储组织**。`writeSemanticArchitectureSnapshot`（`architecture-delta-merger.ts:263`）把完整模型压平为单个 `model.c4`，并由 `removeSupersededSemanticModules:242` 删除其余模块。工作区现存证据：`.xirang/architecture/domains/*.c4` 16 个模块与 `project.c4` 已被删除，仅余未跟踪的 `model.c4`。

3. **双向冗余绑定**。Element↔Contract 同时由 LikeC4 `metadata.specs`（`likec4-parser.ts:165`）与 spec frontmatter `element:`（`spec-frontmatter.ts:19`）表达，`spec-registry.ts:22` 的 `elementToSpecs: Map<string, string[]>` 更允许一个 Element 绑定多个 Contract，与目标语义冲突。

4. **记法与语义边界混淆**。`architecture-delta-parser.ts` 449 行是一个面向 `.c4` 文本的词法分析器；`change-compiler.ts:165` 的 `ELEMENT_KIND_CHANGE` 禁止 identity 不变时改 Kind，与「Element Kind 是可变声明内容」相悖；`architecture-delta-parser.ts:303-313` 允许 Relationship 携带 `description` 并支持 MODIFIED，与「Relationship 的 identity 即其全部内容」相悖。

`xirang-contract.md` 已重新规定存储形态、记法与保证。本 Change 实现该契约的整条内核管线，是后续四个 Change（LikeC4 生成器、CLI 命令面、Workflow 模板、Semantic Browser）的共同依赖与命名基准。

## What Changes

- **新增四分区 parser 与 serializer**：`.xirang/model/{metamodel,elements,relationships,views}`。`elements/`、`metamodel/`、`views/` 为 frontmatter + 正文的单实体 Markdown 单元；`relationships/` 为结构化列表容器，默认按 Relationship Kind 分组。每个 frontmatter 条目以 `entity` 字段自声明类型，分区不参与类型判定。

- **新增 identity 索引**：加载时建立 `identity → source module` 映射，loader 不依赖文件名定位条目。文件路径与文件名退化为纯组织约定。

- **确定性序列化**：相同 IR 逐字节相同输出；`relationships/` 条目按 `source`、`kind`、`target` 排序；frontmatter 按固定键顺序输出。配属 round-trip 属性测试。

- **语义校验与规则收敛**：字段名 `contractPolicy` 统一为 `contract`；一个 Element 至多一个 Contract；Relationship 移除 `description` 且不支持 MODIFIED；删除 `ELEMENT_KIND_CHANGE` 允许 identity 不变时改 Kind；取消 `metadata.specs` 与 spec frontmatter `element:` 冗余绑定；identity 受 `[A-Za-z0-9._-]+` 约束；Kind identity 在 Metamodel 内全局唯一；Requirement identity 为宿主 Element identity 与 `<name>` 复合。

- **Semantic Delta Entry 编译**：Delta 单元 = Model 单元字段结构 + `operation`。`elements/` 单元 frontmatter 承载 Declaration Entry、正文承载 Requirement Entry（沿用 `## ADDED/MODIFIED/REMOVED Requirements` 分节）。应用得到 Expected Semantic Model。

- **Sync 写回**：最小重写、确定性序列化、全或无。**复用** `change-sync.ts` 现有事务骨架（journal / manifest / preimage / rollback），仅将分区元组由 `['architecture','specs']` 推广为四分区。

- **Candidate 与 promotion**：`.xirang/candidate/` 同构四分区。`promotion.ts:232` 已是 `buildManifest(previousTree, targetTree)` 全量替换语义，缺失单元自然产生 delete 条目，本次仅需推广分区常量。

- **`DiffScope` 删除**：差异输出以 entity type 与 identity 为键，不携带存储分区信息。

## 目标语义依据

本 Change 不定义目标语义，仅实现以下两份文档已确认的规范：

| 依据 | 章节 |
|---|---|
| `xirang-contract.md` | 「存储结构」——四分区、默认命名约定、目录不表达语义 |
| `xirang-contract.md` | 「单元形态」——单元划分、字段表、Requirement identity 复合、identity 约束 |
| `xirang-contract.md` | 「entity 自声明」——`entity` 字段与分区不参与类型判定 |
| `xirang-contract.md` | 「引用规则」——一律 identity 引用，FQN 不入持久源 |
| `xirang-contract.md` | 「Semantic Delta 记法」——`operation` 字段、per-entry 完整目标内容、修改语支持面矩阵 |
| `xirang-contract.md` | 「Sync 保证」——最小重写、确定性序列化、全或无 |
| `xirang-contract.md` | 「语义差异判定」——规范化维度清单、散文逐字比较、差异输出不携带分区 |
| `xirang-definition.md` | §1 Semantic Model——identity 是引用语义对象的唯一依据 |
| `xirang-definition.md` | §3 Element Contract——一个 Element 至多一个 Contract |
| `xirang-definition.md` | §2 Relationships——Relationship 的 identity 即其全部内容 |
| `xirang-definition.md` | §3 Semantic Delta Entry——Entry 由修改语、entity type 与 identity 构成 |

本次不执行 sync，因此不产出 `architecture-delta.c4` 或 change-local `specs/`。

## Impact

**新增**：`src/core/model/` 全套（types / parser / serializer / index / validator / delta / sync-writer），详见 `design.md` 共享命名。

**修改**：`change-sync.ts` 分区常量与 `resolveManifestPath` 白名单；`change-compiler.ts` 删除 `ELEMENT_KIND_CHANGE:165`；`semantic-diff.ts` 删除 `DiffScope:14`、`DiffKind:15` 取值对齐 `entity`；`candidate/promotion.ts:47`、`:62` 分区推广；`candidate/validator.ts` 四分区校验。

**删除**：`spec-registry.ts`（149 行，双向绑定与多 Contract 语义）；`spec-frontmatter.ts`（57 行，`element:` 记法）；`semantic-checks/ownership-validator.ts`（27 行，domain/capability 二层模型）；`semantic-checks/metadata-validator.ts`（21 行，`metadata.specs` 校验端）；`architecture-delta-parser.ts`（449 行，`.c4` 词法分析器）。

**不属于本 Change**：LikeC4 生成器与 fork grammar 回退、CLI 命令面重写、workflow 与 Internal Agent 模板、Semantic Browser、opsx YAML 死代码删除。

**风险**：`change-sync.ts` 与 `change-compiler.ts` 在旧记法被移除前处于半迁移状态，其现有测试将暂时失败。缓解方式是本 Change 内新旧读写层并存，由 C3 统一切换 CLI 入口后再删除旧路径——详见 `design.md` 风险与回滚条件。

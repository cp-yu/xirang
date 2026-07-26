## 改动顺序

`xirang-fragments.ts` 被 8 个 workflow/subagent 内联，先改它可一次消除大部分系统性误导，并立即让依赖它的模板测试暴露连锁点。其后各 workflow 只需处理自身独有段落。`architecture-skeleton.ts` 独立于 fragment 链，可并行。

```text
Task 1  fragments 四段          ← 8 个模板的共享前缀
Task 2  propose + snack         ← Delta 写入方，受影响最重
Task 3  explore + apply-change  ← 消费方
Task 4  archive-change          ← sync 判定
Task 5  build                   ← Candidate 四分区
Task 6  reviewer + optimizer    ← Internal Agents
Task 7  architecture-skeleton   ← 骨架性质变更（可与 1-6 并行）
Task 8  产物再生成
```

## 三类误导的替换规则

### 写 `architecture-delta.c4` → 四分区 Delta 单元

旧记法（`xirang-fragments.ts:38-51`）指令 Agent 写单个 `.c4` 文件，用 `extend <FQN>` 表达层级、`source -[invokes]-> target` 表达关系、`element: <elementId>` frontmatter 绑定 Spec。

新记法：在 `.xirang/changes/<change>/{metamodel,elements,relationships,views}/` 写单元，每个条目携带 `operation`。Element 单元的 frontmatter 是 Declaration Entry，正文是零到多条 Requirement Entry；仅改 Contract 时 frontmatter 不带 `operation`，只用于定位（`xirang-contract.md`「Semantic Delta 记法」per-entry 段）。Relationship 条目形如 `{operation, source, kind, target}`，无 `MODIFIED`、无 `description`。

`xirang-fragments.ts:44` 与 `propose.ts:64` 指令读取 `.xirang/references/likec4-authoring.md`。该文件在仓库中**无任何生成器**（`src/core/relations/renderers.ts:96-102` 的 `GENERATED_RELATION_FILES` 只生成 `xirang-relation-authoring.md`），已是悬空引用；新契约下 `.c4` 非持久源，两处引用一并删除。

### Spec 作为独立对象 → Element 单元正文

删除的概念：Spec ID、`.xirang/specs/<spec-id>/spec.md` 路径、spec frontmatter 的 `element:` 反向绑定、owner binding、orphaned spec、「一个 element 可拥有多个 Spec」。

替换后的表述：Contract 是 Element 单元的正文，一个 Element 至多一个 Contract；是否必需由该 Element Kind 的 `contract` 字段决定（`xirang-definition.md`「Element Contract」）。Requirement 分节记法（`## ADDED/MODIFIED/REMOVED Requirements`、`### Requirement:`、`#### Scenario:`）契约保留，仅落点从 `specs/<spec-id>/spec.md` 改为 `elements/<identity>.md` 正文。

`xirang-fragments.ts:73` 的 `Preserves:` 锚点从 `.xirang/specs/<cap>/spec.md` 改为 `.xirang/model/elements/<identity>.md`。`<cap>` 这一 capability 层级假设同时消除。

### FQN → identity

7 处（`xirang-fragments.ts:25`、`:45`；`propose.ts:36`、`:64`；`snack.ts:39`、`:59`；`apply-change.ts:170`）统一为：identity 是引用语义对象的唯一依据，FQN 与派生局部名不进入持久源。字段名从 `elementId` 统一为 `identity`（C1 `types.ts` 的 `ElementDeclaration.identity`）。

`snack.ts:59` 的「Do not derive the directory name directly from an element FQN or `elementId`」在新契约下语义反转：默认命名**就是** `<identity>.md`，因此该告诫改为说明文件名不表达语义、偏离默认不影响模型。

## 必须写入模板的默认组织约定

契约「存储结构」声明命名约定不具规范性，但 Agent 每次生成都需要稳定结果，模板必须给出可执行默认：

```text
elements/<element identity>.md
metamodel/<kind identity>.md
views/<view identity>.md
relationships/<relationship kind identity>.yaml
```

`relationships/` 默认按 Relationship Kind 分组，使文件集合与 Metamodel 声明的 Relationship Kinds 一致，且不随 Element 增删而变动。Delta 单元位于 `.xirang/changes/<change>/` 对应分区，使用相同命名。

模板须同时说明：偏离该约定不影响模型语义，加载按条目自声明的 `entity` + `identity` 定位，不解析文件名。

## `architecture-skeleton.ts` 性质变更

当前该文件渲染 `.xirang/architecture/` 的 `.c4` **持久源**骨架。新契约下持久源是 `.xirang/model/` 四分区，`.c4` 仅为生成产物，因此整个 manifest 语义变更。

| 旧 | 新 |
|---|---|
| `specification.c4`（`:22-51`）内嵌 3 个 element kind + 6 个 relationship kind | `metamodel/` 下 9 个单元，各带 `entity: element-kind` 或 `entity: relationship-kind` frontmatter |
| `model.c4`（`:53-62`）`projectRoot = project` + `elementId 'project.root'` metadata | `elements/project.root.md`，frontmatter `entity/identity/kind/parent: null/title/summary` |
| `relations.c4`（`:18`）空 `model {}` | `relationships/` 空目录（无关系时不产生容器文件） |
| `views.c4`（`:64-77`）`view refinement of projectRoot` | `views/` 单元，`of` 取 element identity 而非语法名 |

`:64-77` 的 `of projectRoot` 是**语法位置引用**——`projectRoot` 是 `.c4` 局部名，不是 identity。新契约要求 `of` 使用 element identity（契约「字段」节）。

`quoteLikeC4`（`:1-3`）在骨架不再产出 `.c4` 后失去用途，迁往 C2 的生成器或删除。

三个 kind（`project`/`domain`/`capability`）与六个 relationship kind（`constrains`/`consumes`/`invokes`/`precedes`/`produces`/`validates`）保留为初始 Metamodel 内容，但形态从硬编码 `.c4` 文本改为 `metamodel/` 单元。这消除了 `xirang-fragments.ts:26`（「不要假设固定层级」）与本文件硬编码之间的既有矛盾：kind 集合此后是模型数据，可被 Metamodel Delta 演进。

**调用方归属**：`ARCHITECTURE_FILE_MANIFEST` 被 `src/core/setup.ts:407`（经 `:44` 的 `SETUP_ARCHITECTURE_FILE_MANIFEST` 重导出）与 `src/core/candidate/workspace.ts:121` 消费，两者均写入 `architecture` 目录变量。本 Change 只改渲染器与 manifest 契约，调用方路径适配归 C3。

## CLI 命令形态依赖点

`.xirang/changes/migrate-cli-to-model-ir/` 在撰写本 Plan 时尚未生成。以下命令形态按已裁定的 8 项决策推导，若 C3 定型后不一致，本 Change 的模板须同步：

| 模板位置 | 现命令 | 推导后形态 | 依据 |
|---|---|---|---|
| `xirang-fragments.ts:27` | `xirang list --specs --json` | **删除**，Contract 随 element 单元返回 | 决策 2；Spec 非独立对象 |
| `xirang-fragments.ts:28`、`propose.ts:36`、`apply-change.ts:170`、`optimizer.ts:17` | `xirang arch query <elementId> --relations --depth <n> --json` | `<identity>` 取代 `<elementId>`，响应内联 Contract 全文，移除 `fqn` 与 `specs[]`，`contractPolicy` 改名 `contract` | 决策 1、2 |
| `xirang-fragments.ts:49`、`:60`、`propose.ts:67` | `xirang arch validate --delta <path>.c4` | **删除**，Delta 不再是单文件 | 契约「Semantic Delta 记法」 |
| `explore.ts:193-202` | `xirang arch search` / `xirang arch impact` | 保留命令族，字段名 `identity` | 决策 1 |
| `propose.ts:74` | `xirang diff --change --write` | `--scope` 枚举作废，改 `--entity` 过滤 | 决策 5 |

`xirang validate --change`、`xirang sync`、`xirang archive`、`xirang candidate {init,validate,promote}` 的命令名不变，仅内部语义随分区改变，模板措辞无需调整。

## Internal Agents 的判据改写

`reviewer.ts:36` 的证据读取清单含 `specs/*/spec.md` 与 `architecture-delta.c4`。新结构下两者都不存在，reviewer 会把「读不到 delta」误判为「无语义变更」——这是**静默漏判**，比报错更危险。改为读取 `.xirang/changes/<change>/{metamodel,elements,relationships,views}/` 单元。

`reviewer.ts:103` 的 Semantic Model Alignment 检查 "contract bindings"。该概念在新契约下不存在（Contract 即正文，无可校验绑定）。改为逐类核对：Declaration Entry、Requirement Entry、Relationship 条目、Kind 单元、View 单元是否与 Expected Semantic Model 一致。`:125` 的 `xirangAlignment` 输出字段名保留，判据说明改写。

`reviewer.ts:65` 的 "search by symbol name, file path, and import reference" 以文件路径为搜索锚点。对代码证据仍成立（代码路径是实现事实），但涉及模型对象时须改为按 identity 索引导航。

`optimizer.ts:46` 的 "Never alter Specs" 改为 "Never alter Element Contracts"。`:113` 引用 `.xirang/references/xirang-self-read-protocol.md` 而 `:120` 落盘为 `references/self-read-protocol.md`，前缀不一致属既有隐患，不在本 Change 范围。

## 风险

**R1 模板测试断言旧字面量**。`test/core/templates/` 下 6 个模板测试与 `fragments/xirang-fragments.test.ts` 断言 `architecture-delta.c4`、`elementId`、`.xirang/specs` 等字面量，模板改写后必然失败。

缓解：每个 Task 的 Checks 同步更新对应测试，不留跨 Task 的红灯。

**R2 `setup.test.ts` 跨 Change 红灯**。`test/core/setup.test.ts:634-650` 断言 manifest 恰为四个 `.c4` 文件名、`.xirang/architecture/` 目录存在、`specification.c4` 含 `languageVersion '1'` 与六个 relationship kind。本 Change 改 manifest 后该测试失败，而调用方在 C3。

缓解：按用户已裁定「接受中间态不可用」，本 Change 不修 `setup.test.ts`，在 tasks 中显式标注该测试红灯归 C3 消除。全量测试恢复绿是 C3 的验收条件。

**R3 CLI 形态推导偏差**。上表 5 组命令按决策推导，若 C3 实际形态不同，模板会指令 Agent 调用不存在的命令。

缓解：C3 完成后以 `rg` 交叉核对模板中全部 `xirang ` 命令字面量与 CLI 实际注册表；该核对列为 C3 的 Check 项。

**R4 产物与模板脱节**。`.pi/skills/`、`.pi/agents/` 是生成产物，模板改后未重新 sync 则磁盘上仍是旧文本，Agent 读到旧指令。

缓解：Task 8 显式再生成并核验产物不含三类误导字面量。

**回滚条件**：若 fragment 重写导致 3 个以上模板测试无法在两轮内修复，回退 `xirang-fragments.ts` 单文件，改为在各 workflow 内联新表述，代价是重复表述且后续易漂移。

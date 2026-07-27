## Why

C4 实施时证伪了一条隐含前提：模板不是 Agent 行为的唯一来源。`schemas/spec-driven/` 是与模板并列、且当前与模板相互矛盾的第二个来源。

propose 与 snack 的核心机制是「对每个 artifact 跑 `xirang instructions <id> --json`，按返回的 `instruction` 的 authoring order 写」（`src/core/templates/workflows/propose.ts:55`、`snack.ts:58`）。C4 已把模板文本清理干净，但投影未动，Agent 仍从 CLI 读到完整旧记法。当前 workflow 在行为上不可用，具体表现为四条可复现的缺陷：

**1. 投影与已迁移的确定性校验器直接冲突。** `src/core/parsers/task-structure.ts:443` 的 `isValidChangeSpecPath` 只接受 `elements/<identity>.md`（`:78` `ELEMENTS_PARTITION`、`:418` `listChangeSpecFiles` 只扫 `elements/`），`:452` 的 `isValidMainSpecPath` 只接受 `.xirang/model/elements/<identity>.md`。而 `schemas/spec-driven/schema.yaml:220` 仍要求 `Preserves:` 锚 `.xirang/specs/<capability>/spec.md`，`:224-225` 仍以 `.xirang/specs/...` 为禁用示例，`templates/tasks.md:17,36` 仍示范 `specs/<capability>/spec.md`、`:54` 仍示范 `.xirang/specs/<capability>/spec.md`。Agent 照投影写出的 `tasks.md` 会被校验器判为 `invalid-verifies-path` ERROR。

**2. 幽灵 flag。** 投影三处声明 `xirang validate --change <name> --artifacts ... --json`（`schema.yaml:64`、`:122`、`:146`），而 `--artifacts` 已由 C3 删除。`src/cli/index.ts:276-286` 的 validate 选项集中无该项，`test/commands/validate.test.ts:114-119` 断言其触发 `unknown option '--artifacts'` 并退出码 1。

**3. `architecture-delta` artifact 的载体已不存在。** `schema.yaml:108-148` 仍声明 `generates: architecture-delta.c4`。`xirang-contract.md`「LikeC4 边界」规定 `.c4` 是生成产物、落 `.xirang/.cache-likec4/`、不得写入持久源。实测该 artifact 永久 `blocked`：

```
$ xirang status --change retarget-workflow-and-agent-templates --json
{"id":"specs","outputPath":"specs/**/*.md","status":"ready"}
{"id":"architecture-delta","outputPath":"architecture-delta.c4","status":"blocked","missingDeps":["specs"]}
```

**4. `specs` artifact 的完成判定与四分区不相容。** `generates: specs/**/*.md`（`:50`）只看 `specs/` 目录。四分区 Delta 写入 `elements/`、`metamodel/`、`relationships/`、`views/`，因此 `specs` 永不 done；`tasks` 依赖 `specs`（`:273-276`），在图上永久 `blocked`，`isComplete` 永不为真。上面的 status 输出即证据。

## What Changes

- **删除 `architecture-delta` artifact**（`schema.yaml:108-148`）与其模板 `templates/architecture-delta.c4`。artifact 数由 5 降为 4。**BREAKING**：`xirang instructions architecture-delta` 与 `xirang status` 中该节点消失。

- **`specs` artifact 重定向到四分区 Delta 单元**。`generates` 改为 `"{elements,metamodel,relationships,views}/**/*"`，`completionMarker` 由 `.specs-noop` 改为 `.delta-noop`，`template` 由 `spec.md` 改为新的 `delta.md`。artifact id 保持 `specs` 不变。论证见 `design.md`。**BREAKING**：`outputPath` 投影值改变。

- **重写 `specs` 的 `definition` 与 `instruction`**：由「Behavior Source 驱动的 delta Specs」改为「一个 Semantic Delta 的四分区单元」，覆盖 entity 自声明、四类字段、identity 约束、Contract 正文即 `## Requirements`、Relationship 无 MODIFIED 无 description、Requirement identity 复合、per-entry 完整目标态。

- **清除幽灵 flag 与旧校验指引**：三处 `validation` 收敛为 `xirang validate --change <name> --json` 与 `xirang arch validate --change <name> --json`，两者均在 `src/cli/index.ts` 注册表中存在。同时把 `src/core/validation/constants.ts:40-41` 的 no-delta 指引从旧 `specs/` 路径和 `xirang change show --deltas-only` 改为四分区 Delta 与 `xirang diff --change <id> --json`。顶层 `validate --change` 已经通过 `ValidateCommand.validateChangeWithPreview` 调用 `compileChange` 与 `validateChangeDeltaSpecs`，本 Change 不重写其校验路径。

- **`proposal` 与 `design` 的 definition/instruction 去 LikeC4 化**：`schema.yaml:16` 的 "authoritative LikeC4 element or relation declarations"、`:28`/`:31`/`:36` 的 LikeC4 element ID、`:32-33` 的 Spec ID / `domain_name.capability_name` / `capabilityId`、`:40`、`:44` 的 `architecture-delta.c4` 落点、`:161` 的 excludes 尾句。`Behavior Source` / `Architecture Source` 两级标题保留（C4 已裁定，`propose.ts:53`），仅重定义其取值为 element identity。

- **`tasks` 的 `Verifies:` / `Preserves:` 路径规则对齐校验器**：`schema.yaml:220`、`:224-225` 改为 `elements/<identity>.md` 与 `.xirang/model/elements/<identity>.md`。

- **四个模板文件**：`spec.md` 重写并更名 `delta.md`；`architecture-delta.c4` 删除；`proposal.md:15,27,28,33,38,42` 与 `tasks.md:17,36,54` 按新记法重写。

- **`xirang help authoring` 强制随动**：`src/commands/help.ts:43-46` 的 `buildHelp` 按 artifact id 查 definition，查不到即抛错。删除 `architecture-delta` artifact 会使 `xirang help authoring architecture-delta.c4` 运行期崩溃，因此 `:7` 的 `AUTHORING_TOPICS` 与 `:21-23` 的 `FILE_LOOKUP` 必须同时重定向。C3 的 proposal 已声明此项在其范围内但未实施（`git log -- src/commands/help.ts` 最新提交为 `295f2dbbb`，早于 C0）。**BREAKING**：authoring topic 名称改变。

- **新增跨表面记法一致性测试**，替代物理去重。论证见 `design.md`。

## 目标语义依据

本 Change 不定义新语义。目标态由以下章节承载：

| 依据 | 章节 | 约束 |
|---|---|---|
| `xirang-contract.md` | 「存储结构」 | `.xirang/changes/<change>/` 与 `.xirang/model/` 同构四分区；目录与文件名仅为组织约定，不表达任何模型语义 |
| `xirang-contract.md` | 「单元形态」 | 分区—单元—形态对应表；`relationships/` 是唯一列表容器例外 |
| `xirang-contract.md` | 「单元形态」→「字段」 | 四类 entity 的字段表；Relationship 的 identity 即其全部内容；Contract 以 `## Requirements` 组织；Requirement identity 由宿主 identity 与 `<name>` 复合，Delta 内只书写 `<name>` |
| `xirang-contract.md` | 「单元形态」→「identity 约束」 | `[A-Za-z0-9._-]+`，不含路径分隔符；identity 不应编码 parent 路径 |
| `xirang-contract.md` | 「entity 自声明」 | frontmatter 以 `entity` 声明自身类型；分区不参与 entity type 判定 |
| `xirang-contract.md` | 「引用规则」 | 持久源一律 identity 引用；FQN、语法位置、派生局部名不进入持久源 |
| `xirang-contract.md` | 「LikeC4 边界」 | `.c4` 是生成产物，落 `.xirang/.cache-likec4/`，不得写入持久源 |
| `xirang-contract.md` | 「Semantic Delta 记法」 | Delta 单元 = Model 单元字段 + `operation`；per-entry 完整目标态；正文以 `## ADDED/MODIFIED/REMOVED Requirements` 分节；`relationships/` 无 MODIFIED |
| `xirang-definition.md` | 「2. Semantic Delta」 | Semantic Delta 由 Element Declaration Delta、Element Contract Delta、Relationship Delta、Metamodel Delta 组成，是确定 Expected Semantic Model 的唯一依据 |
| `xirang-definition.md` | 「3. Element Contract」 | 一个 Element 至多一个 Element Contract |
| `xirang-definition.md` | 「2. Change Plan」 | `proposal.md` / `design.md` / `tasks.md` 是辅助性组成，与 Semantic Delta 冲突时以 Delta 为准 |

共享命名沿用 `.xirang/changes/rebuild-semantic-model-kernel/design.md`「共享命名」节。

本次不执行 sync，因此不产出 `architecture-delta.c4`，也不在本 Change 目录下创建四分区 Delta 单元。

## Impact

**直接修改**

- `schemas/spec-driven/schema.yaml`（284 行）：29 处非重叠旧字面量，分布于 25 行——`architecture-delta` ×11、`.xirang/specs` ×5、`specs/<spec-id>` ×4、`--artifacts` ×3、`specs-noop` ×3、`capabilityId` ×2、`domain_name.capability_name` ×1、`cap.<domain>` ×1、`.xirang/architecture` ×1。
- `schemas/spec-driven/templates/spec.md`（8 行）→ `delta.md`；`templates/architecture-delta.c4`（4 行）删除；`templates/proposal.md`（47 行，6 处）；`templates/tasks.md`（56 行，3 处）。
- `src/commands/help.ts`（`:7`、`:21-23`）。
- `src/core/validation/constants.ts`（`:40-41`）：修正 `GUIDE_NO_DELTAS` 的旧路径与旧命令。

**测试须同步**

| 文件 | 位置 | 原因 |
|---|---|---|
| `test/core/artifact-graph/instruction-loader.test.ts`（904 行） | `:39`、`:233`、`:251`、`:264`、`:281`、`:288`、`:292`、`:304`、`:318`、`:855-857` | 断言 5 个 artifact、旧 definition 文本、`outputPath: 'specs/**/*.md'`、幽灵 flag |
| `test/core/artifact-graph/workflow.integration.test.ts`（186 行） | `:45`、`:55`、`:65`、`:75`、`:85`、`:88-92` | 断言 5 节点图与 `specs/` 完成路径 |
| `test/core/artifact-graph/outputs.test.ts` | 新增 | 现有 brace 用例（`:138`、`:151`）测的是 cwd 含花括号，未覆盖 pattern 内的 brace expansion |
| `test/commands/artifact-workflow.test.ts`（1131 行） | `:46`、`:62-74`、`:181`、`:188`、`:535` | `createTestChange` 写 `specs/`；断言 `artifacts` 长度 5 |
| `test/commands/help.test.ts`（99 行） | `:18`、`:24`、`:30`、`:34`、`:37`、`:77`、`:84` | 整个 authoring topic 面 |
| `test/core/templates/fragments/*`（新增） | — | 跨表面记法一致性 |

**不受影响但需复核**：`test/integration/archive-workflow.test.ts:18,29,47` 与 `test/commands/validate.test.ts:199`、`test/core/change-compiler.test.ts:77` 中的 `architecture-delta.c4` 是与 schema 无关的临时文件名或否定断言，不随本 Change 失败。

**不属于本 Change**

- `src/core/parsers/change-parser.ts:37` 仍解析 change-local `specs/`，但它不在顶层 `xirang validate --change` 的调用链上；该命令已由 `src/commands/validate.ts:207-212` 调用四分区 compiler 与 `validateChangeDeltaSpecs`。旧 parser 当前影响 `xirang change list --json` 的 `deltaCount`、JSON converter 等遗留兼容面，后续应单独删除或迁移这些消费者。
- 当前活跃 Changes 只有 Change Plan、没有四分区 Semantic Delta，且 formal `.xirang/model/` 尚未 Build，因此 `xirang validate --change` 报 no-delta 与 `MISSING_PROJECT_ROOT` 是当前输入的真实状态，不是读取旧目录导致的误判。
- `src/core/relations/active-registry.ts` 硬编码 6 个 relation kind，与「Metamodel 声明 Relationship Kinds」相悖。
- `docs/` 下 10 处 `architecture-delta` / `.specs-noop` 引用（`getting-started.md`、`commands.md`、`concepts.md`、`xirang-integration.md`、`architecture-integration.md`、`cli.md`）。
- `.claude/`、`.codex/`、`.opencode/` 下旧世代产物，按用户既有裁定不处理。

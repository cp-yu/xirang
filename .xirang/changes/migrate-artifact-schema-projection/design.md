## 决策 1：artifact id 保持 `specs`

只改 `generates` / `completionMarker` / `template` / `definition` / `instruction`，不改 id。

id 是 artifact 依赖图的节点标签，不是存储路径。`xirang-contract.md`「存储结构」约束的是持久化位置，不约束 workflow 图的节点命名。改名的代价是三处外部契约：

- `src/core/templates/workflows/snack.ts:58` 硬编码 `xirang instructions specs`，`test/integration/snack-workflow.test.ts:108` 断言该字面量。
- `.xirang/config.yaml:22` 的 `rules.specs` 以 artifact id 为键。`src/core/project-config.ts:562-580` 的 `validateConfigRules` 对未知 id **只发 warning**（`instruction-loader.ts:317-329` 消费，且 `:15` 的 `shownWarnings` 使每条 warning 每会话只打印一次），规则随后被静默丢弃——用户配置会无声失效。
- `resolveSchema` 只认内置 schema（`src/core/artifact-graph/resolver.ts:22-28`），无 schema 版本化机制，无法为改名提供迁移期。

收益仅为命名观感。拒绝。

## 决策 2：`generates` 重定义

```yaml
generates: "{elements,metamodel,relationships,views}/**/*"
```

**为什么是四分区的并集**。`xirang-contract.md`「存储结构」规定 `.xirang/changes/<change>/` 与 `.xirang/model/` 采用同构的四类分区；「Semantic Delta 记法」的修改语支持表逐分区列出 `elements/`、`metamodel/`、`views/`、`relationships/`。一个 Delta 可以只动 `metamodel/`（新增 Element Kind）、只动 `relationships/`（新增一条协作）或只动 `views/`。旧的「`specs/` 目录非空」判定假设 Contract 变更是唯一的 Delta 形态，该假设在新契约下不成立。完成信号必须是四分区的并集，不能是 `elements/` 单分区。

**为什么不限定扩展名**。`**/*` 而非 `**/*.{md,yaml}`。「存储结构」明写：「目录与文件名仅为组织约定。它们不表达 identity、层级位置、entity type 或任何其他模型语义」，随后给出的默认命名「不具规范性，仅用于使生成与人工编写的组织方式一致；偏离它不影响模型」。把 `.md` / `.yaml` 写进完成判定，等于把非规范的命名约定升格为门禁，与契约直接冲突。分区目录名则不同——它是「存储结构」正文列出的结构，且 `src/core/model/types.ts:9` 的 `PARTITIONS` 与 `src/core/change-compiler.ts:51` 的 `DEFAULT_PARTITION` 已按分区索引，是运行期实际的加载边界。

**机制可行性**（均已实测）。

- `src/core/artifact-graph/outputs.ts:9-11` 的 `isGlobPattern` 检测 `*` / `?` / `[`，不检测 `{`。本模式含 `**`，走 glob 分支。若将来出现纯 brace 无星号的模式会误入 `fs.statSync` 分支——本决策不触发该路径。
- fast-glob 3.3.3 支持 pattern 内 brace expansion，`{a,b,c,d}/**/*` 能匹配分区目录下的直属文件（本地验证：四个分区各一文件，全部命中）。
- `fg` 默认 `dot: false`，分区内的 dotfile 不会误判完成。
- `xirang new change` 只创建 change 目录与 metadata（`src/utils/change-utils.ts:110-140`），不预建分区目录，因此不存在空目录导致的误判。

**已接受的风险**。分区目录下的任意杂项文件都会把 artifact 判为 done。`detectCompleted`（`state.ts:14-28`）是粗粒度的 workflow 进度信号，单元内容的正确性由 `xirang arch validate --change` 承担；这与今天 `specs/**/*.md` 的风险等级相同，不引入新类别。

## 决策 3：`completionMarker` 重定义

```yaml
completionMarker: ".delta-noop"
```

**为什么仍然需要 marker**。`tasks` 依赖 `[specs, design]`（`schema.yaml:273-276`）。一个合法的 Change 可以完全没有 Semantic Delta——C0–C5 六个 Change 本身就是：六个目录各只有 `proposal.md` / `design.md` / `tasks.md`，均在 proposal 中声明「本次不执行 sync」。没有 no-op 通道时，`specs` 永远停在 `ready`，`tasks` 在图上永久 `blocked`，`isComplete` 永不为真。实测：

```
$ xirang status --change retarget-workflow-and-agent-templates --json
"isComplete": false
{"id":"specs","status":"ready"}
```

**为什么改名**。marker 断言的是「本 Change 无 Semantic Delta」，不是「无 Specs」。仓库内无任何活跃 Change 持有 `.specs-noop`（六个 change 目录各只有三个文件），改名零迁移成本。

**为什么保持字面路径**。不含 glob 字符，`artifactOutputExists` 走 `outputs.ts:19-27` 的 `fs.statSync` 分支，判定确定且无遍历开销。

**被拒绝的替代方案**。

- *取消 marker，让 `generates` 可选或允许空完成*。`generates` 在 `src/core/artifact-graph/types.ts:35` 是 `z.string().min(1)` 必填；`isArtifactComplete`（`state.ts:35-42`）是二值。改成三态需要为唯一一个 artifact 引入新代码路径，收益为零。
- *让 `tasks` 不再依赖 `specs`*。会允许在 Delta 之前写 `tasks.md`，倒置 Change Plan 依赖 Semantic Delta 的编译顺序（`xirang-definition.md`「2. Change Plan」：Plan 不独立定义目标语义）。

## 决策 4：`template` 由 `spec.md` 改为 `delta.md`

artifact 现在生成四种异构单元，单一文件正文无法作为字面输出格式。`ArtifactInstructions.template` 的注释称其「IS the output format」（`instruction-loader.ts:111`），该描述在多单元 artifact 上不再字面成立，因此新模板定位为**逐单元形态参考**：四个 fenced block，每块以其默认落点开头，展示 frontmatter（`operation` + `entity` + 字段）与正文（仅 `elements/`）。`instruction` 中必须显式说明模板是 per-unit 形态而非单文件正文，否则 authoring order 第 4 步「Fill the canonical structure from `template`」会被误解。

被拒绝的替代方案：保留 `spec.md` 只展示 `elements/` 形态、把另外三个分区塞进 `instruction`。这会让 Agent 被指示去填充的那个字段只覆盖四分之一的目标形态，是更隐蔽的同类缺陷。

`templates/architecture-delta.c4` 与 artifact 同时删除。`src/commands/workflow/templates.ts:48-52` 对每个 artifact 的 template 路径调 `canonicalizeExistingPath`，孤儿模板不会被引用，缺失模板会抛错——两者必须同一次改动完成。

## 决策 5：与 `SEMANTIC_MODEL_UNIT_NOTATION` 的关系

**结论：不共用运行期来源。`xirang-contract.md` 是唯一权威，各表面均为其投影；以一个跨表面一致性测试固定共同不变量。**

首先修正一处前提：并存的不是两处，是三处。

| 表面 | 位置 | 消费者 | 内容 |
|---|---|---|---|
| `SEMANTIC_MODEL_UNIT_NOTATION` | `xirang-fragments.ts:25`，经 `build.ts:12` 内联 | Project Build | **Model** 单元形态，无 `operation` |
| `ARCHITECTURE_GENERATE_DELTA` | `xirang-fragments.ts:66` | snack | **Delta** 单元形态，含 `operation` |
| `specs` artifact 的 `instruction` | `schemas/spec-driven/schema.yaml` | propose、snack | **Delta** 单元形态，含 `operation` |

不共用的理由：

1. **可达性不同**。fragment 是编译进 `dist/` 的 TS 常量，随 skill 生成期内联进 prompt；build 之所以需要它，正是因为 Project Build 写 `.xirang/candidate/`、没有 artifact 投影可读（该理由写在 `xirang-fragments.ts:19-22` 的 docstring 里）。schema 投影是打包数据，运行期由 `resolveSchema` / `loadTemplate` 从 `schemas/` 读盘（`resolver.ts:40-46`、`instruction-loader.ts:172-186`）。两条链在运行期不相交。
2. **内容不同**。Model 形态与 Delta 形态只在字段表与 identity 约束上重叠；`operation`、修改语分节、per-entry 完整性、`relationships/` 无 MODIFIED 只属于 Delta 侧。强行合并会让 build 的 prompt 携带它不需要的 Delta 记法。
3. **共用需要 codegen，代价高于收益**。由 TS 生成 `schemas/**` 会把人工评审、随包分发的数据文件变成构建产物，diff 不可读；由 `schemas/**` 反向生成 TS 会让 build workflow 依赖 spec-driven schema 这个不相关的具体 schema。重叠部分约 15 行，不值。
4. **权威已经单一**。三处都是 `xirang-contract.md`「单元形态」「字段」「identity 约束」「Semantic Delta 记法」的投影。真正要防的是投影之间漂移，不是投影存在。

**漂移控制**。新增一个跨表面一致性测试，断言：

- 三处表面声明相同的四行 entity 字段表（`element-declaration` / `element-kind` / `relationship-kind` / `authored-view` 及各自字段集）；
- 三处使用相同的 identity 字符集字面量 `[A-Za-z0-9._-]+`；
- 三处均不含退役字面量集合 `architecture-delta`、`.xirang/specs`、`specs/<spec-id>`、`capabilityId`、`domain_name.capability_name`、`cap.<domain>`、`--artifacts`；
- `specs` artifact 的 `generates` 中 brace 列表与 `src/core/model/types.ts:9` 的 `PARTITIONS` 集合相等（这条把 YAML 里的分区字符串钉在代码常量上，是最容易漂移的一处）。

## 受影响测试的处理策略

分四类，处理方式不同。

**A. 契约断言，必须随投影重写。** `test/core/artifact-graph/instruction-loader.test.ts` 的 `:233`（取 `architecture-delta` 的 definition）、`:251`（幽灵 flag）、`:264`、`:288`、`:292`、`:304`（旧 Spec ID 记法）、`:318`（五 artifact 循环）、`:856`（`outputPath` 字面量）。逐条替换为新记法字面量与四 artifact 集合，**不放宽为宽松匹配**——这些断言正是防止本类回归的机制。

**B. 图形状断言，重建。** `test/core/artifact-graph/workflow.integration.test.ts:45,55,65,75,85,88-92` 是端到端的五节点推进序列。改为四节点，并把第 5 步的 `specs/feature-auth.md` 换成 `elements/<identity>.md`，另补一条只写 `relationships/<kind>.yaml` 的分支，直接覆盖决策 2 的核心断言（只动单一非 elements 分区时 artifact 判 done）。

**C. 测试夹具，机械替换。** `test/commands/artifact-workflow.test.ts:46`（artifact 联合类型）、`:62-74`（`createTestChange` 写 `specs/`、写 `architecture-delta.c4`）、`:181`（长度 5→4）、`:188`、`:535`。夹具语义不变，只换落点。

**D. 已迁移但未被投影跟上的校验器，只加正向覆盖。** `test/core/parsers/task-structure.test.ts:8,159,161,179,202` 已使用 `elements/example.md` 与 `.xirang/model/elements/example.md`，无需改动。本 Change 只需一条新测试，断言 `templates/tasks.md` 中示范的 `Verifies:` / `Preserves:` 路径能通过 `isValidChangeSpecPath` / `isValidMainSpecPath`——把「模板示范」与「校验器接受」这对当前已断裂的关系固化下来。

**E. 不改动。** `test/core/artifact-graph/state.test.ts:104-127` 用本地构造的 schema fixture 测机制本身，`.specs-noop` 只是任意字符串。`test/integration/archive-workflow.test.ts:18,29,47` 的 `architecture-delta.c4` 是 `moveDirectory` 的临时文件名。`test/commands/validate.test.ts:199`、`test/core/change-compiler.test.ts:77` 是否定断言。四者均不随本 Change 失败，改动它们属于范围外。

`test/core/artifact-graph/outputs.test.ts` 需新增：现有 `:138`、`:151` 两条 brace 用例测的是 **cwd 路径含花括号**（fast-glob 不对 cwd 做 glob 解析），未覆盖 **pattern 内 brace expansion**。决策 2 依赖后者，必须有直接覆盖。

## 风险与回滚

| 风险 | 缓解 |
|---|---|
| `{a,b,c,d}/**/*` 在 Windows 上行为不同 | `resolveArtifactOutputs`（`outputs.ts:29`）已用 `FileSystemUtils.toPosixPath` 归一化 pattern 后再交 fast-glob，且传 `cwd` 而非把路径拼进 pattern。新增 outputs 测试须与既有跨平台用例同目录，交由 Windows CI 覆盖 |
| 删除 artifact 使 `xirang help authoring` 运行期抛错 | `help.ts:7,21-23,43-46` 与 schema 改动必须在同一 Task 内完成，`test/commands/help.test.ts` 同步重写；不允许分两个 Task |
| 新 `instruction` 篇幅膨胀，稀释关键约束 | 旧 `specs` instruction 为 `schema.yaml:65-104` 共 40 行。新文本以「不超过旧文本行数」为硬上限，超出即说明混入了应属 `design.md` 的解释 |
| `.delta-noop` 被 sync 或 archive 携带 | 现状无代码消费该 marker（全仓仅 `schema.yaml`、`types.ts:36`、`instruction-loader.ts:272-286`、`state.ts:23,38-41`、`instructions.ts:183-184` 引用），与 `.specs-noop` 同级；`instruction` 保留「marker 不承载语义、不得 sync 或 archive」的措辞，不新增运行期强制 |
| no-delta 报错继续引导用户创建旧 `specs/` | `constants.ts:40-41` 与 schema 投影同批改为四分区 Delta 和 `xirang diff --change`；测试同时覆盖 JSON 与文本输出，禁止退役路径回流 |
| 把当前 Plan-only Change 的 no-delta 或尚未 Build 的 `MISSING_PROJECT_ROOT` 误判为 parser 缺陷 | 顶层 `validate --change` 的调用链以 `validate.ts:207-212` 为准；它已调用四分区 compiler 与 `validateChangeDeltaSpecs`。C6 不改变无 Delta 或无 Project Root 时的失败语义 |

**回滚条件**：出现下列任一情形，整体回滚本 Change 的 `schemas/` 与 `src/commands/help.ts` 改动，不做局部修补。

1. 四分区 brace glob 在任一目标平台上无法稳定判定完成（决策 2 的机制前提失效）。
2. 删除 `architecture-delta` artifact 后暴露出 `help.ts` 之外的第二个按 artifact id 硬编码的运行期消费点，且其正确重定向超出本 Change 范围。
3. 全量测试无法在不放宽 A 类契约断言的前提下转绿——放宽断言等于取消本 Change 的回归防线，此时应重新设计而非降低门槛。

回滚成本低：改动集中在 schema 数据、模板文件、help 命令与一条 validation 指引，无持久化状态迁移，无 `.xirang/model/` 写入。

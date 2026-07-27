## Why

Workflow 与 Internal Agent 模板是 Agent 的唯一行为来源。C1 建立 `.xirang/model/` 四分区 IR、C2 将 LikeC4 降为生成产物、C3 切换 CLI 之后，这些模板仍在指令 Agent 写 `architecture-delta.c4`、把 Spec 当独立可寻址对象、用 FQN 引用元素。模板不改，代码改对了也没用：Agent 会持续产出已废止载体。

三类系统性误导的实测分布：

- **写 `architecture-delta.c4`**：6 个文件 20 处。`xirang-fragments.ts` 5 处（`:35`、`:39`、`:48`、`:49`、`:61`）、`propose.ts` 5 处、`snack.ts` 3 处、`archive-change.ts` 4 处、`reviewer.ts` 2 处（`:36`、`:103`）、`explore.ts` 1 处（`:27`）。
- **Spec 作为独立对象**：`xirang-fragments.ts:27`（`xirang list --specs --json` 作为 registry、"each Spec has one singular element owner binding"）、`:28`（"owned Specs"）、`:73`（钉死 `.xirang/specs/<cap>/spec.md`）；`propose.ts:35`（"A Spec ID identifies .xirang/specs/<spec-id>/spec.md"）；`build.ts:22`（"an element may own multiple Specs"）；`reviewer.ts:36`、`optimizer.ts:9`、`:46`。
- **FQN / 位置引用**：5 个文件 7 处。`xirang-fragments.ts:25`、`:45`；`propose.ts:36`、`:64`；`snack.ts:39`、`:59`；`apply-change.ts:170`。

`build.ts:22` 的 "an element may own multiple Specs" 与契约「一 Element 至多一个 Contract」正面冲突；`xirang-fragments.ts:26` 要求 Agent「不要假设固定 element-kind 层级」，而 `architecture-skeleton.ts:28-41` 硬编码 `capability`/`domain`/`project` 三种 kind — 两者当前即已自相矛盾。

## What Changes

1. **`xirang-fragments.ts` 四段重写**（最高优先级，被 8 个 workflow/subagent 共享）：`XIRANG_PHILOSOPHY:12` 的「LikeC4 graph modules + element-owned contract modules」二元论作废；`XIRANG_SHARED_CONTEXT:24-28` 的旧路径、FQN 概念、spec registry、owned Specs 全部重定向；`ARCHITECTURE_GENERATE_DELTA:38-51` 整段改为四分区 Delta 单元记法；`ARCHITECTURE_POST_PROPOSE_VALIDATION:73` 的 `Preserves:` 路径锚点改为 element 单元。
2. **6 个 workflow 模板**：`explore.ts`、`propose.ts`、`apply-change.ts`、`archive-change.ts`、`build.ts`、`snack.ts`。
3. **2 个 Internal Agent 模板**：`reviewer.ts` 证据读取清单（`:36`）与 Semantic Model Alignment（`:102-103`）；`optimizer.ts` 自读协议（`:9`）与 CLI 调用（`:17`）。
4. **`architecture-skeleton.ts` 性质变更**：从写 `.xirang/architecture/` 的 `.c4` 持久源骨架改为写 `.xirang/model/` 四分区骨架。`:15-20` 的 `ARCHITECTURE_FILE_MANIFEST`（`specification.c4`/`model.c4`/`relations.c4`/`views.c4`）替换为四分区单元清单；`:28-48` 硬编码的 3 个 element kind 与 6 个 relationship kind 迁入 `metamodel/` 单元；`:53-62` 的 `elementId` metadata 改为 element 单元 frontmatter；`:64-77` 的 `view refinement of projectRoot`（语法位置引用）改为 `of: <element identity>`。
5. **产物再生成**：`.pi/skills/xirang-{explore,propose,apply-change,archive-change,build,snack}/SKILL.md` 与 `.pi/agents/xirang-{reviewer,optimizer}.md`。
6. **模板须写入的默认组织约定**：契约声明文件名无语义，但 Agent 需要可执行的稳定默认，否则每次生成的组织都不同。

## 目标语义依据

本 Change 不定义新语义，目标态由以下文档承载：

- `xirang-contract.md`「存储结构」：`.xirang/model/` 与 `.xirang/changes/<change>/` 四分区同构；默认命名 `elements/<identity>.md`、`metamodel/<kind identity>.md`、`views/<view identity>.md`、`relationships/<relationship kind identity>.yaml`，该约定不具规范性。
- `xirang-contract.md`「单元形态」：`elements/` 一个 Element 一个 Markdown 单元，frontmatter 承载 Declaration，正文承载 Contract；`relationships/` 是唯一列表容器例外，默认按 Relationship Kind 分组。
- `xirang-contract.md`「identity 约束」：字符集 `[A-Za-z0-9._-]+`；identity 不应编码 parent 路径或层级位置。
- `xirang-contract.md`「引用规则」：持久源一律 identity 引用，FQN 与派生局部名不进入持久源。
- `xirang-contract.md`「LikeC4 边界」：`.c4` 是生成产物，落 `.xirang/.cache-likec4/`，不入版本控制。
- `xirang-contract.md`「Semantic Delta 记法」：Delta 单元 = Model 单元字段结构 + `operation`；per-entry 完整目标态；一个文件可承载 Declaration Entry 与多条 Requirement Entry；`relationships/` 无 `MODIFIED`。
- `xirang-definition.md`「Element Contract」：一个 Element 至多对应一个 Element Contract，是否必需由 Element Kind 的 contract policy 决定。

共享命名引用 `.xirang/changes/rebuild-semantic-model-kernel/design.md`「共享命名」节。

## Impact

**直接修改**：`src/core/templates/fragments/xirang-fragments.ts`（166 行）、`workflows/{explore,propose,apply-change,archive-change,build,snack,reviewer,optimizer}.ts`（233/89/196/236/39/90/139/126 行）、`architecture-skeleton.ts`（78 行）。

**测试需同步**：`test/core/templates/{explore-template,propose-template,apply-change,snack-template,reviewer-template,optimizer-template}.test.ts`、`test/core/templates/fragments/xirang-fragments.test.ts` 断言旧记法字面量，必须随模板改写。

**跨 Change 依赖**：`architecture-skeleton.ts` 的 `ARCHITECTURE_FILE_MANIFEST` 被 `src/core/setup.ts:407` 与 `src/core/candidate/workspace.ts:121` 消费，`test/core/setup.test.ts:634-650` 断言四个 `.c4` 文件名与 `.xirang/architecture/` 目录存在。这两个消费点归 C3，本 Change 只改渲染器契约与内容，调用方适配与 `setup.test.ts` 断言重写由 C3 承担；若 C3 未同步，`setup` 与 `candidate init` 会写出与新契约不符的骨架。

**不受影响**：`sync-engine.ts`（仅投影逻辑，无旧记法内嵌）、`subagent-generation.ts`（仅渲染分发）、`manifest/registry.ts`、`skill-templates.ts`、`tool-profile/`、`transforms/`。

**不属于本 Change**：CLI 实现（C3）、生成器与 LikeC4 fork 回退（C2）、Semantic Browser（C5）。`.claude/`、`.codex/`、`.opencode/` 下旧世代产物按用户裁定不处理。

**遗留风险**：模板中约 12 处 CLI 命令形态依赖 C3 定型，本 Change 按已裁定的 8 项决策推导，依赖点在 `design.md` 标出。

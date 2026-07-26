> 全部行号为本 Change 实施**前**的位置。Task 1 删除 `schema.yaml:108-148` 后其下方行号整体上移 41 行，后续 Task 按符号定位而非按行号。

### Task 1: 删除 `architecture-delta` artifact 并重定向 authoring help

**Goal**: 移除已不存在的载体节点，同时修复它唯一的硬编码运行期消费点。两者必须原子完成——先删 artifact 会让 `xirang help authoring` 抛错。

**Files**:
- Modify: `schemas/spec-driven/schema.yaml`
- Delete: `schemas/spec-driven/templates/architecture-delta.c4`
- Modify: `src/commands/help.ts`
- Test: `test/commands/help.test.ts`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`
- Test: `test/core/artifact-graph/workflow.integration.test.ts`
- Test: `test/commands/artifact-workflow.test.ts`

**Requirements**:
- 删除 `schema.yaml:108-148` 整个 `architecture-delta` artifact 块（含 `generates: architecture-delta.c4`、`template`、`validation` 的幽灵 flag `:122`/`:146`、`requires: [specs]` `:147-148`）；artifact 数由 5 降为 4，`tasks.requires`（`:273-276`）保持 `[specs, design]`
- 删除 `templates/architecture-delta.c4`；`src/commands/workflow/templates.ts:48-52` 对每个 artifact 的 template 调 `canonicalizeExistingPath`，模板与 artifact 必须同时删除
- `help.ts:7` 的 `AUTHORING_TOPICS` 与 `:21-23` 的 `FILE_LOOKUP` 由 `architecture-delta.c4` → `architecture-delta` 改为 `semantic-delta` → `specs`；`buildHelp`（`:43-46`）按 artifact id 查 definition 的机制不变
- 先改测试后改实现：`help.test.ts:18,24,30,34,37,77,84` 与 `instruction-loader.test.ts:233,318`、`workflow.integration.test.ts:45,55,65,75,85,88-92`、`artifact-workflow.test.ts:46,73-74,181,188` 先改为新期望并确认 red
- 不改动 `test/integration/archive-workflow.test.ts`、`test/commands/validate.test.ts:199`、`test/core/change-compiler.test.ts:77`——三者的 `architecture-delta.c4` 与 schema 无关

#### Checks

- C1 Verifies: `rg -c 'architecture-delta' schemas/spec-driven/schema.yaml src/commands/help.ts` 无输出（退出码 1）。`templates/proposal.md` 中的两处由 Task 4 清除
- C2 Verifies: `test -e schemas/spec-driven/templates/architecture-delta.c4` 返回非 0
- C3 Verifies: `node bin/xirang.js help authoring --json` 输出的 `topics` 不含 `architecture-delta.c4`；`node bin/xirang.js help authoring semantic-delta --json` 退出码 0 且返回 `definition`
- C4 Verifies: `node bin/xirang.js status --change retarget-workflow-and-agent-templates --json` 的 `artifacts` 长度为 4，且无 `architecture-delta` 节点
- C5 Verifies: `pnpm exec vitest run test/commands/help.test.ts test/core/artifact-graph/ test/commands/artifact-workflow.test.ts` 通过
- C6 Preserves: `pnpm exec vitest run test/integration/archive-workflow.test.ts test/commands/validate.test.ts test/core/change-compiler.test.ts` 未经修改即通过

---

### Task 2: 重定义 `specs` 的 `generates` 与 `completionMarker`

**Goal**: 让完成判定覆盖四分区 Delta 的任一分区，并为无 Delta 的 Change 保留 no-op 通道，消除 `specs` 永不 done / `tasks` 永久 blocked。

**Files**:
- Modify: `schemas/spec-driven/schema.yaml`
- Test: `test/core/artifact-graph/outputs.test.ts`
- Test: `test/core/artifact-graph/workflow.integration.test.ts`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`
- Test: `test/commands/artifact-workflow.test.ts`

**Requirements**:
- `schema.yaml:50` 改为 `generates: "{elements,metamodel,relationships,views}/**/*"`，brace 列表顺序与取值同 `src/core/model/types.ts:9` 的 `PARTITIONS`；不加扩展名过滤（`xirang-contract.md`「存储结构」：文件名不表达语义）
- `schema.yaml:51` 改为 `completionMarker: ".delta-noop"`，保持字面路径以走 `outputs.ts:19-27` 的 `statSync` 分支
- 先在 `outputs.test.ts` 补 pattern 内 brace expansion 用例并确认 red：现有 `:138`、`:151` 只覆盖 cwd 含花括号，未覆盖 pattern 展开
- `workflow.integration.test.ts` 的推进序列改为四节点，第 5 步落点由 `specs/feature-auth.md` 改为 `elements/<identity>.md`，并新增一条只写 `relationships/<kind>.yaml` 的分支断言 `specs` 判 done
- 补一条 `.delta-noop` 用例：change 目录下四分区均不存在、仅有 marker 时 `specs` 判 done 且 `tasks` 由 blocked 转 ready

#### Checks

- C1 Verifies: `rg -n 'specs-noop|specs/\*\*/\*\.md' schemas/spec-driven/schema.yaml` 无输出
- C2 Verifies: `pnpm exec vitest run test/core/artifact-graph/outputs.test.ts` 通过，且新用例覆盖 `{elements,metamodel,relationships,views}/**/*` 对四个分区各自单文件的命中
- C3 Verifies: `pnpm exec vitest run test/core/artifact-graph/workflow.integration.test.ts` 通过，含「仅 `relationships/` 变更」与「仅 `.delta-noop`」两条分支
- C4 Verifies: `node bin/xirang.js status --change retarget-workflow-and-agent-templates --json` 中 `specs.outputPath` 为四分区 brace pattern
- C5 Verifies: `node -e` 断言 `schema.yaml` 中 `generates` 的 brace 列表集合等于 `src/core/model/types.ts` 导出的 `PARTITIONS` 集合
- C6 Preserves: `pnpm exec vitest run test/core/artifact-graph/state.test.ts` 未经修改即通过（该文件用本地 fixture 测机制，不依赖 spec-driven）

---

### Task 3: 重写 `specs` 的 `definition`、`instruction` 与模板

**Goal**: 投影文本从「Behavior Source 驱动的 delta Specs」改为「一个 Semantic Delta 的四分区单元」，使 Agent 从 CLI 读到的记法与 `xirang-contract.md` 一致。

**Files**:
- Modify: `schemas/spec-driven/schema.yaml`
- Create: `schemas/spec-driven/templates/delta.md`
- Delete: `schemas/spec-driven/templates/spec.md`
- Modify: `src/core/validation/constants.ts`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`
- Test: `test/core/validation.enriched-messages.test.ts`

**Requirements**:
- `schema.yaml:53` 改 `template: delta.md`；`:54-64` 的 `definition` 重写——`purpose` 为「表达本 Change 需新增、修改或移除的语义」，`compilationRole` 为 Semantic Delta，`content.excludes` 去 LikeC4，`validation`（`:63-64`）改为 `xirang validate --change <name> --json` 与 `xirang arch validate --change <name> --json`
- `:65-104` 的 `instruction` 重写，覆盖且仅覆盖：entity 自声明、四类 entity 字段表、identity 约束 `[A-Za-z0-9._-]+` 且不编码层级、`elements/` 正文即 `## Requirements`（描述性文字归 `summary` 不得重复）、Requirement identity 复合（Delta 内只写 `<name>`）、`operation` 与 `## ADDED/MODIFIED/REMOVED Requirements` 的因式分解、per-entry 完整目标态（仅改 Contract 时 frontmatter 不带 `operation`）、`relationships/` 条目 `{operation, source, kind, target}` 无 MODIFIED 无 description、默认命名非规范、不变分区留空。行数不得超过原 40 行
- `:68` 的 `.specs-noop` 措辞改为 `.delta-noop`，保留「marker 不承载语义、不得 sync 或 archive」；删除 `:71-73`、`:84`、`:100` 的 Spec ID / `.xirang/specs/<spec-id>/spec.md` / `cap.<domain>.<name>` / `architecture-delta.c4`
- `delta.md` 为逐单元形态参考：四个 fenced block，各以默认落点 `elements/<identity>.md`、`metamodel/<kind identity>.md`、`views/<view identity>.md`、`relationships/<relationship kind identity>.yaml` 开头；`instruction` 须显式声明模板是 per-unit 形态而非单文件正文，避免与 authoring order 第 4 步冲突
- `constants.ts:40-41` 的 `GUIDE_NO_DELTAS` 改为四分区 Delta 指引，调试命令改为 `xirang diff --change <change-id> --json`；不得再指向 `specs/` 或 deprecated `xirang change show --deltas-only`
- 顶层 `xirang validate --change` 已由 `validate.ts:207-212` 调用 `compileChange` 与 `validateChangeDeltaSpecs`，本 Task 不改 validator/parser 调用链，也不把 Plan-only Change 的 no-delta 或未 Build 模型的 `MISSING_PROJECT_ROOT` 降级为成功
- 先改 `instruction-loader.test.ts:251,304` 与 `validation.enriched-messages.test.ts:33` 确认 red，再改 schema 与 validation 常量

#### Checks

- C1 Verifies: `node bin/xirang.js instructions specs --change retarget-workflow-and-agent-templates --json` 的输出中 `rg -c '\.xirang/specs|specs/<spec-id>|cap\.<domain>|--artifacts|architecture-delta'` 无输出；`rg -c 'spec\.md|Spec ID' schemas/spec-driven/templates/delta.md` 无输出
- C2 Verifies: `rg -n 'specs/ directory|specs/http-server|change show.*deltas-only' src/core/validation/constants.ts` 无输出；`validation.enriched-messages.test.ts` 断言 no-delta 消息包含四分区路径与 `xirang diff --change`，且不含旧路径和旧命令
- C3 Verifies: `node bin/xirang.js instructions specs --change retarget-workflow-and-agent-templates --json` 返回的 `definition.validation` 每条命令的子命令与选项均可在 `node bin/xirang.js <sub> --help` 中解析成功
- C4 Verifies: 同一投影的 `instruction` 含 `entity`、`element-declaration`、`element-kind`、`relationship-kind`、`authored-view`、`[A-Za-z0-9._-]+`、`## ADDED Requirements`、`relationships/` 无 `MODIFIED` 各项字面量
- C5 Verifies: 同一投影的 `template` 含四个默认落点字面量，且 `currentState.completionMarker.path` 以 `.delta-noop` 结尾
- C6 Verifies: `awk` 统计 `schema.yaml` 中 `specs` artifact 的 `instruction` 块行数 ≤ 40
- C7 Verifies: `pnpm exec vitest run test/core/artifact-graph/instruction-loader.test.ts test/core/validation.enriched-messages.test.ts` 通过

---

### Task 4: `proposal` 与 `design` 投影去 LikeC4 化

**Goal**: 消除 proposal / design 两个 scaffolding artifact 中把 LikeC4 与 Spec ID 当作语义源的表述，与 C4 已裁定的「保留 Behavior/Architecture Source 两级标题、重定义其取值为 element identity」对齐。

**Files**:
- Modify: `schemas/spec-driven/schema.yaml`
- Modify: `schemas/spec-driven/templates/proposal.md`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`

**Requirements**:
- `schema.yaml:16` 的 excludes 去掉 "authoritative LikeC4 element or relation declarations"，改为「完整目标态的 Semantic Delta 条目」；`:28`、`:31`、`:36` 的 LikeC4 element ID 表述一并改为 element identity
- `:32-33` 删除「Spec ID 是 `specs/<spec-id>/spec.md` 的目录名」与「LikeC4 element ID 使用 `domain_name.capability_name`，canonical 身份在 `metadata.capabilityId`」，改为统一的 element identity 空间；`:34` 的 "A Spec may cover multiple architecture capabilities" 删除（与「一 Element 至多一个 Contract」冲突）
- `:40`、`:44` 的 `architecture-delta.c4` 落点改为四分区 Delta；`:161` 的 design excludes 尾句同改
- `templates/proposal.md`：`:15` 的 `specs/<spec-id>/spec.md` 改 element identity；`:25-38` 三组小标题去 `LikeC4` 字样，`:28,33,38` 的 `domain_name.capability_name` 占位改 `<element identity>`；`:27,42` 的 `architecture-delta.c4` 引用改四分区
- 保留 `## Source Impact` / `### Behavior Source` / `#### New Specs` / `#### Modified Specs` / `### Architecture Source` / `## Impact` 六个标题字面量——`propose.ts:53` 与 `instruction-loader.test.ts:19-34` 依赖它们
- 先改 `instruction-loader.test.ts:38,281,288,292` 确认 red

#### Checks

- C1 Verifies: `rg -c 'LikeC4|capabilityId|domain_name' schemas/spec-driven/schema.yaml schemas/spec-driven/templates/proposal.md` 无输出
- C2 Verifies: `node bin/xirang.js instructions proposal --change retarget-workflow-and-agent-templates --json` 的 `template` 仍含 `## Source Impact`、`### Behavior Source`、`#### New Specs`、`#### Modified Specs`、`### Architecture Source`、`## Impact` 六个标题
- C3 Verifies: `pnpm exec vitest run test/core/artifact-graph/instruction-loader.test.ts` 通过
- C4 Preserves: `pnpm exec vitest run test/core/templates/propose-template.test.ts` 未经修改即通过（C4 已完成模板侧，本 Task 不得倒退其断言）

---

### Task 5: `tasks` 投影与模板对齐已迁移的校验器

**Goal**: 消除投影与 `task-structure.ts` 的直接冲突——当前照投影写出的 `tasks.md` 会被校验器判为 `invalid-verifies-path` ERROR。

**Files**:
- Modify: `schemas/spec-driven/schema.yaml`
- Modify: `schemas/spec-driven/templates/tasks.md`
- Test: `test/core/parsers/task-structure.test.ts`

**Requirements**:
- `schema.yaml:220` 的 `Preserves:` 锚点由 `.xirang/specs/<capability>/spec.md` 改 `.xirang/model/elements/<identity>.md`，与 `task-structure.ts:452-467` 的 `isValidMainSpecPath` 一致
- `:222` 的 change-local `Verifies:` 路径由 `specs/<capability>/spec.md` 改 `elements/<identity>.md`，与 `:443-450` 的 `isValidChangeSpecPath` 一致；`:224` 的禁用清单、`:225` 的白名单说明同步
- `templates/tasks.md:17,36` 的 `Verifies:` 改 `` `elements/<identity>.md` ``，`:54` 的 `Preserves:` 改 `` `.xirang/model/elements/<identity>.md` ``
- 不改动 `task-structure.ts` 实现——它已在 `e7f651e15` 迁移完成，本 Task 只让投影追上它
- 新增一条测试：直接从 `templates/tasks.md` 抽取示范中的 `Verifies:` / `Preserves:` 路径，断言分别通过 `isValidChangeSpecPath` / `isValidMainSpecPath`；先确认 red

#### Checks

- C1 Verifies: `rg -c '\.xirang/specs|specs/<capability>' schemas/spec-driven/` 无输出
- C2 Verifies: `pnpm exec vitest run test/core/parsers/task-structure.test.ts` 通过，含新增的模板路径合法性用例
- C3 Verifies: `node bin/xirang.js instructions tasks --change retarget-workflow-and-agent-templates --json` 的 `template` 与 `instruction` 中出现的每个反引号路径均满足两个校验函数之一
- C4 Preserves: `test/core/parsers/task-structure.test.ts:8,159,161,179,202` 既有断言字面量不变

---

### Task 6: 跨表面记法一致性测试与全量验收

**Goal**: 三处并存的记法表述以测试固定共同不变量，替代物理去重；并一次性确认四条验收条件。

**Files**:
- Create: `test/core/templates/fragments/notation-consistency.test.ts`
- Test: `test/core/templates/fragments/xirang-fragments.test.ts`

**Requirements**:
- 测试对象为三处表面：`SEMANTIC_MODEL_UNIT_NOTATION`（`xirang-fragments.ts:25`）、`ARCHITECTURE_GENERATE_DELTA`（`:66`）、`specs` artifact 的 `instruction`（经 `generateInstructions` 取得，不读原始 YAML 文本）
- 断言三处声明相同的四行 entity 字段表与相同的 identity 字符集字面量 `[A-Za-z0-9._-]+`
- 断言三处均不含退役字面量集合：`architecture-delta`、`.xirang/specs`、`specs/<spec-id>`、`capabilityId`、`domain_name.capability_name`、`cap.<domain>`、`--artifacts`
- 断言 `specs` artifact 的 `generates` 中 brace 列表集合等于 `src/core/model/types.ts` 的 `PARTITIONS`
- 不修改 `xirang-fragments.ts` 本体——C4 已完成，本 Task 只加约束

#### Checks

- C1 Verifies: `pnpm exec vitest run test/core/templates/fragments/` 通过
- C2 Verifies **验收条件 1**：`pnpm exec vitest run` 全量绿，测试文件数不少于 143
- C3 Verifies **验收条件 2**：对四个 artifact 逐一跑 `node bin/xirang.js instructions <id> --change <name> --json`，合并输出后 `rg -c '\.xirang/specs/<spec-id>|capabilityId|domain_name\.capability_name|cap\.<domain>|--artifacts'` 无输出
- C4 Verifies **验收条件 3**：从上述合并投影中抽取每条形如 `xirang <sub> ...` 的命令，逐条对照 `node bin/xirang.js --help` 与对应子命令 `--help`，全部可解析
- C5 Verifies **验收条件 4**：在临时 change 目录下分别只创建 `elements/x.md`、只创建 `metamodel/k.md`、只创建 `relationships/invokes.yaml`、只创建 `views/v.md`、只创建 `.delta-noop`，五种情形 `xirang status --change <name> --json` 均将 `specs` 判为 `done` 且 `tasks` 不为 `blocked`
- C6 Verifies: `npx tsc --noEmit` 0 错；`pnpm build` 与 `pnpm lint` 通过

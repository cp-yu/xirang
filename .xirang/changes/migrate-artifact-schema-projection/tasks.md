> 全部行号为本 Change 实施**前**的位置。Task 1 删除 `schema.yaml:108-148` 后其下方行号整体上移 41 行，后续 Task 按符号定位而非按行号。

## Remediation

- [x] [code_fix] Validation guidance migration：迁移 `GUIDE_MISSING_CHANGE_SECTIONS` 的旧 `specs/` 指引，扩展 absence 断言，并补 malformed-proposal 可执行错误路径回归测试。
- [x] [artifact_fix] No-Delta completion marker：创建 change-local `.delta-noop`，验证当前 C6 的四个 artifact 全部 done 且 `isComplete: true`。
- [x] [artifact_fix] Canonical tasks structure：把 Checks 改成 nested `Verifies:` / `Preserves:` 与 `Command:` / `Evidence:` / `Expect:` 字段，将超过五条 Requirements 的 Tasks 拆分，并运行 `validateTaskStructure`。
- [x] [code_fix] Semantic Delta relationship notation：让 `semantic-delta` authoring help 只输出 canonical `{operation, source, kind, target}`，移除该表面的 legacy `{from, type, to, note}` renderer 并更新测试。
- [x] [code_fix] Tasks evidence path migration：把 `artifact-workflow` 中剩余的 `specs/<id>/spec.md` fixtures 迁移为 `elements/<identity>.md`，并用 `validateTaskStructure` 验证 fixture tasks。

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

- [x] C1 退役 artifact 与 help 映射均已移除
  - Verifies: 删除 `architecture-delta` artifact 且不保留硬编码 help 引用
  - Command: `rg -n '^  - id: architecture-delta$|generates: architecture-delta\.c4' schemas/spec-driven/schema.yaml; rg -n "artifactId: 'architecture-delta'|architecture-delta\.c4" src/commands/help.ts`
  - Expect: 两条查询均无输出（退出码 1）；schema 中 proposal/specs/design 的叙述性字面量与 `templates/proposal.md` 由后续 Task 清除
- [x] C2 退役模板文件不存在
  - Verifies: 删除 `architecture-delta.c4` 模板
  - Command: `test -e schemas/spec-driven/templates/architecture-delta.c4`
  - Expect: 返回非 0
- [x] C3 authoring help 暴露 semantic-delta 主题
  - Verifies: authoring help 主题从 `architecture-delta.c4` 重定向到 `semantic-delta`
  - Command: `node bin/xirang.js help authoring --json && node bin/xirang.js help authoring semantic-delta --json`
  - Expect: topics 不含 `architecture-delta.c4`，semantic-delta 命令退出码 0 且返回 `definition`
- [x] C4 workflow 图不再包含退役节点
  - Verifies: spec-driven workflow 仅投影四个 artifact
  - Command: `node bin/xirang.js status --change retarget-workflow-and-agent-templates --json`
  - Expect: `artifacts` 长度为 4，且无 `architecture-delta` 节点
- [x] C5 artifact 与 help 回归测试通过
  - Verifies: artifact graph、workflow command 与 authoring help 的新投影行为
  - Command: `pnpm exec vitest run test/commands/help.test.ts test/core/artifact-graph/ test/commands/artifact-workflow.test.ts`
  - Expect: 全部通过
- [x] C6 archive、validate 与 compiler 行为保持不变
  - Verifies: 未修改的 archive、validate 与 compiler 回归面
  - Command: `pnpm exec vitest run test/integration/archive-workflow.test.ts test/commands/validate.test.ts test/core/change-compiler.test.ts`
  - Expect: 三个未经修改的测试文件全部通过

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

- [x] C1 旧 output pattern 与 marker 已消失
  - Verifies: `specs` artifact 使用四分区 output 与 `.delta-noop`
  - Command: `rg -n 'generates: "specs/\*\*/\*\.md"|completionMarker: "\.specs-noop"' schemas/spec-driven/schema.yaml`
  - Expect: 无输出；instruction 中叙述性的 `.specs-noop` 由后续 Task 清除
- [x] C2 brace expansion 覆盖每个 Delta 分区
  - Verifies: 四分区任一单文件均能完成 `specs` artifact
  - Command: `pnpm exec vitest run test/core/artifact-graph/outputs.test.ts`
  - Expect: 测试通过，且新用例覆盖 `{elements,metamodel,relationships,views}/**/*` 对四个分区各自单文件的命中
- [x] C3 workflow 覆盖 relationship-only 与 no-op 分支
  - Verifies: 非 elements Delta 与无 Delta marker 均能推进 workflow
  - Command: `pnpm exec vitest run test/core/artifact-graph/workflow.integration.test.ts`
  - Expect: 测试通过，含「仅 `relationships/` 变更」与「仅 `.delta-noop`」两条分支
- [x] C4 status 投影四分区 outputPath
  - Verifies: status 输出公开新的 `specs.outputPath`
  - Command: `node bin/xirang.js status --change retarget-workflow-and-agent-templates --json`
  - Expect: `specs.outputPath` 为四分区 brace pattern
- [x] C5 schema 分区集合与运行期常量一致
  - Verifies: schema brace 列表与 `PARTITIONS` 不漂移
  - Command: `node -e` 断言 `schema.yaml` 中 `generates` 的 brace 列表集合等于 `src/core/model/types.ts` 导出的 `PARTITIONS` 集合
  - Expect: 断言通过
- [x] C6 artifact state 机制保持不变
  - Verifies: 本地 fixture 的 artifact state 行为不受 schema 投影迁移影响
  - Command: `pnpm exec vitest run test/core/artifact-graph/state.test.ts`
  - Expect: 未经修改的测试文件通过

---

### Task 3: 重写 Semantic Delta 投影、模板与 validation guidance

**Goal**: 将 `specs` artifact 从 delta Specs 改为四分区 Semantic Delta 单元记法，并让相关可执行错误路径使用同一指引。

**Files**:
- Modify: `schemas/spec-driven/schema.yaml`
- Create: `schemas/spec-driven/templates/delta.md`
- Delete: `schemas/spec-driven/templates/spec.md`
- Modify: `src/core/validation/constants.ts`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`
- Test: `test/core/validation.enriched-messages.test.ts`

**Requirements**:
- `schema.yaml:53` 改 `template: delta.md`；`:54-64` 的 `definition` 重写——`purpose` 为「表达本 Change 需新增、修改或移除的语义」，`compilationRole` 为 Semantic Delta，`content.excludes` 去 LikeC4，`validation`（`:63-64`）改为 `xirang validate --change <name> --json` 与 `xirang arch validate --change <name> --json`
- `:65-104` 的 `instruction` 重写，覆盖且仅覆盖：entity 自声明、四类 entity 字段表、identity 约束 `[A-Za-z0-9._-]+` 且不编码层级、`elements/` 正文即 `## Requirements`（描述性文字归 `summary` 不得重复）、Requirement identity 复合（Delta 内只写 `<name>`）、`operation` 与 `## ADDED/MODIFIED/REMOVED Requirements` 的因式分解、per-entry 完整目标态（仅改 Contract 时 frontmatter 不带 `operation`）、`relationships/` 条目 `{operation, source, kind, target}` 无 MODIFIED 无 description、默认命名非规范、不变分区留空；`.specs-noop` 改为不承载语义且不得 sync/archive 的 `.delta-noop`，并清除 Spec ID、旧路径、`cap.<domain>.<name>` 与 `architecture-delta.c4`。行数不得超过原 40 行
- `delta.md` 为逐单元形态参考：四个 fenced block，各以默认落点 `elements/<identity>.md`、`metamodel/<kind identity>.md`、`views/<view identity>.md`、`relationships/<relationship kind identity>.yaml` 开头；`instruction` 须显式声明模板是 per-unit 形态而非单文件正文，避免与 authoring order 第 4 步冲突
- `GUIDE_NO_DELTAS` 与 `GUIDE_MISSING_CHANGE_SECTIONS` 均改为四分区 Semantic Delta 指引和 `xirang diff --change <change-id> --json`，不得再指向 `specs/`、`xirang change show` 或 `--deltas-only`；后者须覆盖 malformed proposal 的可执行错误路径
- 顶层 `xirang validate --change` 的 compiler/validator 调用链保持不变，不把 Plan-only Change 的 no-delta 或未 Build 模型的 `MISSING_PROJECT_ROOT` 降级为成功；先改 `instruction-loader.test.ts` 与 `validation.enriched-messages.test.ts` 确认 red，malformed-proposal 用例也须先 RED 后改常量

#### Checks

- [x] C1 投影与模板不含退役记法
  - Verifies: Semantic Delta instruction 与逐单元模板只使用四分区记法
  - Evidence: `node bin/xirang.js instructions specs --change retarget-workflow-and-agent-templates --json` 的输出不含 `.xirang/specs`、`specs/<spec-id>`、`cap.<domain>`、`--artifacts` 或 `architecture-delta`；`schemas/spec-driven/templates/delta.md` 不含 `spec.md` 或 `Spec ID`
  - Expect: 两项 absence assertion 均无输出
- [x] C2 两条 validation guidance 均无旧路径或旧命令
  - Verifies: no-delta 与 missing-change-sections 消息统一指向四分区 Delta
  - Command: `rg -n 'specs/ directory|specs/http-server|change show.*deltas-only' src/core/validation/constants.ts`
  - Expect: 无输出；`validation.enriched-messages.test.ts` 断言两条消息包含四分区路径与 `xirang diff --change`，且不含旧路径和旧命令
- [x] C3 definition.validation 仅使用可解析命令
  - Verifies: `specs` definition 的 validation 命令存在于 CLI
  - Command: `node bin/xirang.js instructions specs --change retarget-workflow-and-agent-templates --json`
  - Expect: `definition.validation` 每条命令的子命令与选项均可在 `node bin/xirang.js <sub> --help` 中解析成功
- [x] C4 instruction 完整投影 Delta 记法
  - Verifies: instruction 包含 entity 类型、identity 约束、Requirement 修改语与 Relationship 限制
  - Command: `node bin/xirang.js instructions specs --change retarget-workflow-and-agent-templates --json`
  - Expect: `instruction` 含 `entity`、`element-declaration`、`element-kind`、`relationship-kind`、`authored-view`、`[A-Za-z0-9._-]+`、`## ADDED Requirements`，并声明 `relationships/` 无 `MODIFIED`
- [x] C5 template 与 completion marker 同步迁移
  - Verifies: 投影返回四类默认落点及 `.delta-noop`
  - Command: `node bin/xirang.js instructions specs --change retarget-workflow-and-agent-templates --json`
  - Expect: `template` 含四个默认落点字面量，且 `currentState.completionMarker.path` 以 `.delta-noop` 结尾
- [x] C6 instruction 篇幅不超过旧投影
  - Verifies: 新 instruction 保持不超过 40 行的约束
  - Evidence: `awk` 统计 `schema.yaml` 中 `specs` artifact 的 `instruction` 块行数
  - Expect: 行数 ≤ 40
- [x] C7 validation 与 instruction loader 回归测试通过
  - Verifies: 可执行 validation 消息与 `specs` instruction 投影
  - Command: `pnpm exec vitest run test/core/artifact-graph/instruction-loader.test.ts test/core/validation.enriched-messages.test.ts`
  - Expect: 全部通过

---

### Task 4: `proposal` 与 `design` schema 投影去 LikeC4 化

**Goal**: 消除 proposal / design 的 schema scaffolding 中把 LikeC4 与 Spec ID 当作语义源的表述。

**Files**:
- Modify: `schemas/spec-driven/schema.yaml`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`

**Requirements**:
- `schema.yaml:16` 的 excludes 去掉 "authoritative LikeC4 element or relation declarations"，改为「完整目标态的 Semantic Delta 条目」；`:28`、`:31`、`:36` 的 LikeC4 element ID 表述一并改为 element identity
- `:32-33` 删除「Spec ID 是 `specs/<spec-id>/spec.md` 的目录名」与「LikeC4 element ID 使用 `domain_name.capability_name`，canonical 身份在 `metadata.capabilityId`」，改为统一的 element identity 空间；`:34` 的 "A Spec may cover multiple architecture capabilities" 删除（与「一 Element 至多一个 Contract」冲突）
- `:40`、`:44` 的 `architecture-delta.c4` 落点改为四分区 Delta；`:161` 的 design excludes 尾句同改
- 先改 `instruction-loader.test.ts:38,281,288,292` 确认 red

#### Checks

- [x] C1 schema 与 proposal template 不含旧 identity 记法
  - Verifies: proposal/design 投影不再把 LikeC4 或 capabilityId 作为语义身份
  - Command: `rg -c 'LikeC4|capabilityId|domain_name' schemas/spec-driven/schema.yaml schemas/spec-driven/templates/proposal.md`
  - Expect: 无输出
- [x] C3 instruction loader 契约断言通过
  - Verifies: proposal/design schema 投影符合新记法
  - Command: `pnpm exec vitest run test/core/artifact-graph/instruction-loader.test.ts`
  - Expect: 测试通过

---

### Task 5: 重写 proposal 模板并保持 workflow 标题契约

**Goal**: 将 proposal 模板改为 element identity 与四分区落点，同时保持 propose workflow 依赖的标题字面量。

**Files**:
- Modify: `schemas/spec-driven/templates/proposal.md`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`
- Test: `test/core/templates/propose-template.test.ts`

**Requirements**:
- `templates/proposal.md`：`:15` 的 `specs/<spec-id>/spec.md` 改 element identity；`:25-38` 三组小标题去 `LikeC4` 字样，`:28,33,38` 的 `domain_name.capability_name` 占位改 `<element identity>`；`:27,42` 的 `architecture-delta.c4` 引用改四分区
- 保留 `## Source Impact` / `### Behavior Source` / `#### New Specs` / `#### Modified Specs` / `### Architecture Source` / `## Impact` 六个标题字面量——`propose.ts:53` 与 `instruction-loader.test.ts:19-34` 依赖它们

#### Checks

- [x] C2 proposal template 保留六个 workflow 标题
  - Verifies: proposal 模板迁移 identity 记法时不破坏 propose workflow 的结构契约
  - Command: `node bin/xirang.js instructions proposal --change retarget-workflow-and-agent-templates --json`
  - Expect: `template` 仍含 `## Source Impact`、`### Behavior Source`、`#### New Specs`、`#### Modified Specs`、`### Architecture Source`、`## Impact` 六个标题
- [x] C4 propose template 行为保持不变
  - Verifies: C4 已完成的 propose 模板断言不倒退
  - Command: `pnpm exec vitest run test/core/templates/propose-template.test.ts`
  - Expect: 未经修改的测试文件通过

---

### Task 6: `tasks` 投影与模板对齐已迁移的校验器

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

- [x] C1 tasks 投影不含旧 specs 路径
  - Verifies: tasks schema 与模板仅使用 Element unit 路径
  - Command: `rg -c '\.xirang/specs|specs/<capability>' schemas/spec-driven/`
  - Expect: 无输出
- [x] C2 canonical path 示例通过 parser 测试
  - Verifies: 模板中的 `Verifies:` 与 `Preserves:` 路径被 task structure 校验器接受
  - Command: `pnpm exec vitest run test/core/parsers/task-structure.test.ts`
  - Expect: 测试通过，含新增的模板路径合法性用例
- [x] C3 CLI tasks 投影中的证据路径全部合法
  - Verifies: tasks instruction 与 template 的每个证据锚满足对应路径校验器
  - Command: `node bin/xirang.js instructions tasks --change retarget-workflow-and-agent-templates --json`
  - Expect: `template` 与 `instruction` 中出现的每个 `Verifies:` / `Preserves:` 反引号路径均满足两个校验函数之一
- [x] C4 既有 parser 路径断言保持不变
  - Verifies: task structure parser 已迁移的 Element unit 路径契约不被放宽
  - Evidence: `test/core/parsers/task-structure.test.ts:8,159,161,179,202` 的既有断言字面量不变
  - Expect: 既有断言继续通过

---

### Task 7: 固定跨表面记法共同不变量

**Goal**: 三处并存的记法表述以测试固定共同不变量，替代物理去重。

**Files**:
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Create: `test/core/templates/fragments/notation-consistency.test.ts`
- Test: `test/core/templates/fragments/xirang-fragments.test.ts`

**Requirements**:
- 测试对象为三处表面：`SEMANTIC_MODEL_UNIT_NOTATION`（`xirang-fragments.ts:25`）、`ARCHITECTURE_GENERATE_DELTA`（`:66`）、`specs` artifact 的 `instruction`（经 `generateInstructions` 取得，不读原始 YAML 文本）
- 断言三处声明相同的四行 entity 字段表与相同的 identity 字符集字面量 `[A-Za-z0-9._-]+`
- 断言三处均不含退役字面量集合：`architecture-delta`、`.xirang/specs`、`specs/<spec-id>`、`capabilityId`、`domain_name.capability_name`、`cap.<domain>`、`--artifacts`
- 断言 `specs` artifact 的 `generates` 中 brace 列表集合等于 `src/core/model/types.ts` 的 `PARTITIONS`
- 给 `ARCHITECTURE_GENERATE_DELTA` 补齐四类 entity 字段表与 identity 字符集，使其与 Model 记法及 artifact 投影共享同一组可测试不变量；保留它独有的 Delta `operation`、修改语分节与 Relationship 规则

#### Checks

- [x] C1 fragments 跨表面一致性测试通过
  - Verifies: Model fragment、Delta fragment 与 runtime artifact instruction 共享字段表、identity 约束和退役字面量禁集
  - Command: `pnpm exec vitest run test/core/templates/fragments/`
  - Expect: 全部通过

---

### Task 8: 更新生成载荷基线并完成全量验收

**Goal**: 更新受记法 fragment 影响的 snack skill 载荷基线，并一次性确认四条验收条件。

**Files**:
- Modify: `test/core/templates/skill-templates-parity.test.ts`
- Test: `test/core/templates/fragments/xirang-fragments.test.ts`

**Requirements**:
- 更新 `getSnackSkillTemplate` 的载荷哈希基线；重新生成受影响的 snack skill 供本地验证，但 `.pi/` 生成产物不纳入 C6 提交

#### Checks

- [x] C2 全量测试满足验收条件 1
  - Verifies: repository test suite 覆盖本 Change 的全部实现面
  - Command: `pnpm exec vitest run`
  - Expect: 全量绿，测试文件数不少于 143
- [x] C3 四个 artifact 投影满足验收条件 2
  - Verifies: runtime instructions 不再输出目标退役记法
  - Command: 对四个 artifact 逐一跑 `node bin/xirang.js instructions <id> --change <name> --json`，合并输出后运行 `rg -c '\.xirang/specs/<spec-id>|capabilityId|domain_name\.capability_name|cap\.<domain>|--artifacts'`
  - Expect: 无输出
- [x] C4 投影命令满足验收条件 3
  - Verifies: runtime instructions 中引用的 CLI 命令均存在
  - Command: 从四个 artifact 合并投影中抽取每条形如 `xirang <sub> ...` 的命令，逐条对照 `node bin/xirang.js --help` 与对应子命令 `--help`
  - Expect: 全部可解析
- [x] C5 五种完成信号满足验收条件 4
  - Verifies: 每个单分区 Delta 与 no-op marker 均能完成 `specs` artifact
  - Command: 在临时 change 目录下分别只创建 `elements/x.md`、只创建 `metamodel/k.md`、只创建 `relationships/invokes.yaml`、只创建 `views/v.md`、只创建 `.delta-noop`，五种情形运行 `xirang status --change <name> --json`
  - Expect: 五种情形均将 `specs` 判为 `done` 且 `tasks` 不为 `blocked`
- [x] C6 静态、构建与 lint 校验通过
  - Verifies: TypeScript、build 与 lint 门禁
  - Command: `pnpm exec tsc --noEmit && pnpm build && pnpm lint`
  - Expect: 0 错并全部通过

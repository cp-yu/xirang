### Task 1: 重写共享 fragments

**Goal**: 消除 8 个 workflow/subagent 共享前缀中的三类系统性误导，使后续各 Task 只需处理自身独有段落。

**Files**:
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Test: `test/core/templates/fragments/xirang-fragments.test.ts`

**Requirements**:
- `XIRANG_PHILOSOPHY:12` 删除「LikeC4 graph modules + element-owned Markdown contract modules」二元论，改为 Semantic Model 持久化于 `.xirang/model/` 四分区；`:13` 补充 Delta 载体为同构四分区 + `operation`
- `XIRANG_SHARED_CONTEXT:24` 路径改 `.xirang/model/{metamodel,elements,relationships,views}/`；`:25` 删除 FQN 概念、字段名改 `identity`；`:27` 删除 `xirang list --specs --json` 与 owner binding；`:28` 改为 element 单元自身 Contract
- `ARCHITECTURE_GENERATE_DELTA:38-51` 整段重写为四分区 Delta 单元记法：Element 单元 frontmatter 为 Declaration Entry、正文为 Requirement Entry、仅改 Contract 时 frontmatter 不带 `operation`；Relationship 条目 `{operation, source, kind, target}` 无 MODIFIED 无 description；删除 `.xirang/references/likec4-authoring.md` 引用（无生成器，悬空）与 `xirang arch validate --delta`
- `ARCHITECTURE_POST_PROPOSE_VALIDATION:73` 的 `Preserves:` 锚点改 `.xirang/model/elements/<identity>.md`，消除 `<cap>` capability 层级假设
- 写入默认组织约定：`elements/<identity>.md`、`metamodel/<kind identity>.md`、`views/<view identity>.md`、`relationships/<relationship kind identity>.yaml`；`relationships/` 按 Relationship Kind 分组；并说明文件名不表达语义、加载按 `entity` + `identity` 定位
- 保留 `:26`（不假设固定 element-kind 层级）与 `:89-150`（Verify 状态机、CLI JSON、错误恢复，与存储记法无关）

#### Checks

- C1 Verifies: `rg -c "architecture-delta|elementId|FQN|list --specs|\.xirang/architecture|\.xirang/specs|likec4-authoring" src/core/templates/fragments/xirang-fragments.ts` 返回 0
- C2 Verifies: `rg -q "\.xirang/model/" src/core/templates/fragments/xirang-fragments.ts` 命中，且四分区名齐全
- C3 Verifies: `pnpm exec vitest run test/core/templates/fragments/xirang-fragments.test.ts` 通过
- C4 Preserves: `src/core/templates/fragments/xirang-fragments.ts` 中 Verify 状态机与 `ARTIFACT_DOC_LANGUAGE_CONTRACT` 段落内容不变

---

### Task 2: 重写 propose 与 snack

**Goal**: 两个 Delta 写入方停止产出 `.c4` delta 与 Spec 目录，改按四分区单元记法写入。

**Files**:
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/snack.ts`
- Test: `test/core/templates/propose-template.test.ts`
- Test: `test/core/templates/snack-template.test.ts`

**Requirements**:
- `propose.ts:26` Allowed 产物清单去掉 `architecture-delta.c4` 与 `specs`，改为四分区 Delta 单元 + plan 三件套；`:35` 删除 Spec ID 与 `.xirang/specs/<spec-id>/spec.md` 概念；`:36`、`:64` 删除 FQN 与 `extend <FQN>`、删除 `likec4-authoring.md` 引用与 `element: <elementId>` 绑定
- `propose.ts:61-67` 整段 delta 生成流程改为四分区单元写入；`:67` 删除 `xirang arch validate --delta`
- `propose.ts` 的 `Behavior Source` / `Architecture Source` 二分若保留，须重定义为「Contract 影响 / Declaration+Relationship+Metamodel+View 影响」，因新契约下 Declaration 与 Contract 同处一个 elements 单元，旧的 module scope 划分不再对应存储边界
- `snack.ts:23` 条件产物清单（`specs/*/spec.md` 与 `architecture-delta.c4`）改四分区，`:50`、`:64` 的 delta 写入指令同步；`:39`、`:59` 删除 FQN，`:59` 的目录名告诫改为「默认命名即 `<identity>.md`，文件名不表达语义」；`:44-45` 删除 Spec ID 注册表与 New/Modified Specs 判定；`:65` 的 `ARCHITECTURE_GENERATE_DELTA` 注入随 Task 1 自动生效，需核验周围措辞无 LikeC4 残留
- Requirement 分节记法（`## ADDED/MODIFIED/REMOVED Requirements`、rename = REMOVED+ADDED）保留，落点改 `changes/<name>/elements/<identity>.md` 正文

#### Checks

- C1 Verifies: `rg -c "architecture-delta|\.xirang/specs|spec-id|FQN|arch validate --delta" src/core/templates/workflows/propose.ts src/core/templates/workflows/snack.ts` 返回 0
- C2 Verifies: `pnpm exec vitest run test/core/templates/propose-template.test.ts test/core/templates/snack-template.test.ts` 通过
- C3 Preserves: `## ADDED Requirements` / `### Requirement:` / `#### Scenario:` 记法在两模板中仍被指令使用

---

### Task 3: 重写 explore 与 apply-change

**Goal**: 两个消费方的落点表与查询指令对齐四分区与 identity。

**Files**:
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/templates/workflows/apply-change.ts`
- Test: `test/core/templates/explore-template.test.ts`
- Test: `test/core/templates/apply-change.test.ts`

**Requirements**:
- `explore.ts:19-29` 的 `ACTIVE_CHANGE_CAPTURE_GUIDANCE` 落点表：`:21`、`:22` 的 `specs/<spec-id>/spec.md` 改 `elements/<identity>.md` 正文，`:27` 的 `architecture-delta.c4` 拆为 `elements/`（Declaration）、`relationships/`、`metamodel/`、`views/` 四个落点
- `explore.ts:196`、`:198` 的 `arch search` / `arch impact` 字段名改 `identity`（`<elementIds...>` → `<identities...>`）；`:76` 的 "spec" 用词改 Element Contract
- `apply-change.ts:170` 改 `xirang arch query <identity>`，删除 "owned Specs" 与 "FQN only as current source navigation"
- `apply-change.ts:40`（剥离 `[ADDED]` 标签匹配 Scenario）与 `:64`（`.xirang/changes/<name>/` 作为 changed file set）保留不变

#### Checks

- C1 Verifies: `rg -c "architecture-delta|spec-id|FQN|owned Specs" src/core/templates/workflows/explore.ts src/core/templates/workflows/apply-change.ts` 返回 0
- C2 Verifies: `pnpm exec vitest run test/core/templates/explore-template.test.ts test/core/templates/apply-change.test.ts` 通过
- C3 Preserves: `src/core/templates/workflows/explore.ts` 的 Superpowers reference 正文（一次一问、2-3 方案、分段确认）内容不变

---

### Task 4: 重写 archive-change 的 sync 判定

**Goal**: 归档前的 delta 存在性判定改为按 change 四分区，输出模板体现最小重写与全或无。

**Files**:
- Modify: `src/core/templates/workflows/archive-change.ts`
- Test: `test/core/templates/archive-change.test.ts`
- Test: `test/skills/archive-skill-content.test.ts`

**Requirements**:
- `:164` Step 5 判定条件从「delta specs 或 `architecture-delta.c4` 是否存在」改为「change 目录下四分区是否非空」；`:200` guardrails 同步
- `:51`、`:109` 的 boundary/merge commit reference 中作为架构证据的 `architecture-delta.c4` 改为 change 四分区
- `:187` 输出模板 `Synced to main specs and formal LikeC4 architecture` 改为 `.xirang/model/`，并体现契约「最小重写」与「全或无」两条 Sync 保证
- `:114-121` verify 委派骨架不变

#### Checks

- C1 Verifies: `rg -c "architecture-delta|main specs|formal LikeC4" src/core/templates/workflows/archive-change.ts` 返回 0
- C2 Verifies: `pnpm exec vitest run test/core/templates/archive-change.test.ts test/skills/archive-skill-content.test.ts` 通过
- C3 Preserves: `git worktree remove <worktreePath>` 与 `--allow-empty` boundary commit 指令在模板中保持原义

---

### Task 5: 重写 build 的 Candidate 结构

**Goal**: 消除「一个 element 可拥有多个 Spec」与契约的正面冲突，Candidate 改四分区。

**Files**:
- Modify: `src/core/templates/workflows/build.ts`
- Test: `test/core/templates/build.test.ts`

**Requirements**:
- `:22` 改为在 `.xirang/candidate/{metamodel,elements,relationships,views}/` 编写完整 Candidate Semantic Model；删除「Each Spec binds one stable element; an element may own multiple Specs」，改为一 Element 至多一个 Contract、Contract 即 element 单元正文、是否必需由该 Element Kind 的 `contract` 字段决定
- `:24` 呈现清单删除 Spec ownership，改为 Metamodel、层级、Relationships、Views
- `:29` 「Architecture and Specs are one Candidate」改为 Candidate 是一个完整 Semantic Model
- `:33` 路径改 `.xirang/model/`；`:34` 删除 "Preserve LikeC4 tokens"（LikeC4 已非持久源）
- `:17-20` 的 `xirang candidate init --from current|clean|--from-path` 与 `:25` 的 `candidate promote --digest` 命令名保留；promote 语义补充「Candidate 中不存在的单元不再保留」

#### Checks

- C1 Verifies: `rg -c "multiple Specs|Spec ownership|\.xirang/architecture|LikeC4 tokens" src/core/templates/workflows/build.ts` 返回 0
- C2 Verifies: `rg -q "candidate/\{metamodel,elements,relationships,views\}|candidate/metamodel" src/core/templates/workflows/build.ts` 命中
- C3 Verifies: `pnpm exec vitest run test/core/templates/build.test.ts` 通过

---

### Task 6: 重写 Internal Agent 模板

**Goal**: 消除 reviewer 的静默漏判风险，两个 Internal Agent 的证据读取与判据对齐新结构。

**Files**:
- Modify: `src/core/templates/workflows/reviewer.ts`
- Modify: `src/core/templates/workflows/optimizer.ts`
- Test: `test/core/templates/reviewer-template.test.ts`
- Test: `test/core/templates/optimizer-template.test.ts`
- Test: `test/skills/reviewer-skill-content.test.ts`
- Test: `test/skills/optimizer-skill-content.test.ts`

**Requirements**:
- `reviewer.ts:36` 证据读取清单删除 `specs/*/spec.md` 与 `architecture-delta.c4`，改读 `.xirang/changes/<change>/{metamodel,elements,relationships,views}/` 单元；须显式指令「四分区皆空才可判定无语义变更」，避免把读不到 delta 误判为无变更
- `reviewer.ts:102-103` Semantic Model Alignment 删除 "contract bindings"，改为逐类核对 Declaration Entry、Requirement Entry、Relationship 条目、Kind 单元、View 单元与 Expected Semantic Model 一致性
- `reviewer.ts:65` 多角度搜索保留文件路径锚点用于代码证据，但涉及模型对象时改按 identity 导航；`:125` 的 `xirangAlignment` 字段名保留，判据说明改写
- `optimizer.ts:9` 自读第 3 步删除 `specs/*/spec.md`，改 change 四分区；`:17` 改 `xirang arch query <identity>`；`:46` 「Never alter Specs」改「Never alter Element Contracts」
- `optimizer.ts:113` 与 `:120` 的 reference 路径前缀不一致属既有隐患，本 Task 不处理

#### Checks

- C1 Verifies: `rg -c "specs/\*/spec\.md|architecture-delta|contract bindings|Never alter Specs" src/core/templates/workflows/reviewer.ts src/core/templates/workflows/optimizer.ts` 返回 0
- C2 Verifies: `rg -q "四分区|metamodel.*elements.*relationships.*views|all four partitions" src/core/templates/workflows/reviewer.ts` 命中，确认无变更判定条件已写入
- C3 Verifies: `pnpm exec vitest run test/core/templates/reviewer-template.test.ts test/core/templates/optimizer-template.test.ts test/skills/reviewer-skill-content.test.ts test/skills/optimizer-skill-content.test.ts` 通过
- C4 Preserves: `reviewer.ts` 的 Cleanliness/Attribution/Absence judgment 三维度与 `:125` 输出 JSON schema 键名不变

---

### Task 7: `architecture-skeleton.ts` 改为 model 四分区骨架

**Goal**: 骨架从写 `.c4` 持久源改为写 `.xirang/model/` 四分区单元，硬编码 kind 迁入 metamodel 单元。

**Files**:
- Modify: `src/core/templates/architecture-skeleton.ts`
- Test: `test/core/templates/model-skeleton.test.ts`

**Requirements**:
- `:15-20` `ARCHITECTURE_FILE_MANIFEST` 从四个 `.c4` 改为四分区单元清单，`relativePath` 相对 model root
- `:22-51` `renderSpecification` 内嵌的 3 个 element kind（`project` root+required、`domain` optional、`capability` optional）与 `:43-48` 六个 relationship kind（`constrains`/`consumes`/`invokes`/`precedes`/`produces`/`validates`）拆为 `metamodel/<kind identity>.md` 单元，各带 `entity: element-kind` 或 `entity: relationship-kind` frontmatter；字段名用 `contract` 而非 `contractPolicy`
- `:53-62` `renderProjectRoot` 改为 `elements/project.root.md`，frontmatter `entity: element-declaration`、`identity: project.root`、`kind: project`、`parent: null`、`title`、`summary`
- `:64-77` `renderViews` 改为 `views/<view identity>.md`，`of` 取 element identity（`project.root`）而非语法名 `projectRoot`
- `relationships/` 初始无关系，不产生容器文件
- `:1-3` `quoteLikeC4` 在骨架不再产出 `.c4` 后移除；若 C2 生成器需要，由 C2 自行持有
- 所有 identity 须满足 `[A-Za-z0-9._-]+`，且不编码 parent 路径

#### Checks

- C1 Verifies: `rg -c "\.c4|quoteLikeC4|languageVersion|elementId|specification \{" src/core/templates/architecture-skeleton.ts` 返回 0
- C2 Verifies: `pnpm exec vitest run test/core/templates/model-skeleton.test.ts` 通过，覆盖四分区清单、9 个 metamodel 单元、Project Root 单元 `parent: null`、view `of` 为 identity
- C3 Verifies: 渲染产物的 identity 全部匹配 `^[A-Za-z0-9._-]+$`
- C4 Preserves: 三个 element kind 与六个 relationship kind 的名称与约束语义在迁移后不变

> `test/core/setup.test.ts:634-650` 断言 manifest 恰为四个 `.c4` 文件名与 `.xirang/architecture/` 目录存在，本 Task 改 manifest 后该测试转红。调用方 `src/core/setup.ts:407` 与 `src/core/candidate/workspace.ts:121` 的路径适配、以及该测试的断言重写归 C3；本 Change 不修，红灯由 C3 消除。

---

### Task 8: 再生成已投影产物

**Goal**: 模板改动落到磁盘产物，消除 Agent 读到旧指令的可能。

**Files**:
- Modify: `.pi/skills/xirang-explore/SKILL.md`
- Modify: `.pi/skills/xirang-propose/SKILL.md`
- Modify: `.pi/skills/xirang-apply-change/SKILL.md`
- Modify: `.pi/skills/xirang-archive-change/SKILL.md`
- Modify: `.pi/skills/xirang-build/SKILL.md`
- Modify: `.pi/skills/xirang-snack/SKILL.md`
- Modify: `.pi/agents/xirang-reviewer.md`
- Modify: `.pi/agents/xirang-optimizer.md`

**Requirements**:
- 用现有 sync 机制重新投影，不手工编辑产物
- `.xirang/references/xirang-relation-authoring.md` 由 `src/core/relations/renderers.ts:96-102` 生成，内容为 LikeC4 relation 记法，须随新 relationships 记法一并重新生成
- `.xirang/references/likec4-authoring.md` 无生成器且引用已在 Task 1、2 删除，作为悬空文件删除
- 不触及 `.claude/`、`.codex/`、`.opencode/` 下任何产物（用户已裁定不处理）

#### Checks

- C1 Verifies: `rg -c "architecture-delta|\.xirang/specs|\.xirang/architecture|elementId|FQN|list --specs" .pi/skills .pi/agents` 返回 0
- C2 Verifies: `rg -q "\.xirang/model/" .pi/skills/xirang-propose/SKILL.md .pi/agents/xirang-reviewer.md` 命中
- C3 Verifies: `pnpm exec vitest run test/core/templates/skill-templates-parity.test.ts test/skills/skill-template-length-validation.test.ts` 通过
- C4 Verifies: `test -e .xirang/references/likec4-authoring.md` 返回非零
- C5 Preserves: `git status --short .claude .codex .opencode` 无本 Change 产生的改动

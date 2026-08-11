### Task 1: 扩展结构拆分配置与 normalized projection

**Goal**: 以 TDD 增加严格的 `method | skill` tagged union，并保证方法名和 skill 名只被原样投影。

**Files**:
- Modify: `src/core/project-config.ts`
- Modify: `src/core/config-projection.ts`
- Test: `test/core/project-config.test.ts`
- Test: `test/commands/config.test.ts`

**Requirements**:
- `decomposition` 只接受恰有一个非空 `method` 或 `skill` 分支。
- `method` 不使用 allowlist、不展开方法论，`skill` 不解析工具目录。
- 字段缺失使用默认 C4，字段存在但非法时告警并省略且不得回退。
- `xirang config project --json` 原样输出 normalized tagged union。

#### Checks

- [x] C1 验证 tagged union、默认值与非法输入
  - Verifies: `elements/project-config-loading.md` / Requirement "加载结构拆分配置" / Scenarios "加载方法名", "加载 skill 名", "字段缺失时使用默认方法", "非法 tagged union 不回退默认方法"
  - Command: `pnpm exec vitest run test/core/project-config.test.ts`
  - Expect: method/skill 合法输入分别保留，缺失输入得到 C4，双分支、空值、未知子键与非法形态被告警且不回退

- [x] C2 验证结构拆分选择保持 opaque
  - Verifies: `elements/config-projection.md` / Requirement "原样投影结构拆分选择" / Scenarios "投影方法名", "投影 skill 名", "非法配置不产生隐式 projection"
  - Command: `pnpm exec vitest run test/core/project-config.test.ts test/commands/config.test.ts`
  - Expect: JSON 和 prompt projection 只含原始名称，不含 C4 教程、方法 registry 或工具专属 skill path

### Task 2: 物化 setup/update 默认配置

**Goal**: 通过现有 shared materialization 与 missing-only migration 在新建和既有项目中写入默认 `decomposition.method: c4`，同时保留用户选择。

**Files**:
- Modify: `src/core/project-config.ts`
- Modify: `src/core/config-prompts.ts`
- Test: `test/core/project-config.test.ts`
- Test: `test/core/setup.test.ts`
- Test: `test/core/update.test.ts`

**Requirements**:
- functional defaults 包含 `decomposition.method: c4`。
- setup 新建配置时通过 shared config serialization 写入默认方法，existing workspace 不覆盖用户 method/skill。
- update 对 `.yaml`/`.yml` missing-only 补齐，已有任一分支时不添加另一分支。
- Windows、macOS 与 Linux 继续使用 Node.js path API 定位配置文件。

#### Checks

- [x] C3 验证 shared default materialization
  - Verifies: `elements/project-config-loading.md` / Requirement "Materialize functional project config defaults" / Scenarios "Default materialization includes decomposition, optimization, apply, and git", "Missing-only merge preserves user values", "Cross-platform config path handling"
  - Command: `pnpm exec vitest run test/core/project-config.test.ts`
  - Expect: 默认对象包含 C4，用户 method/skill 与 `.yaml`/`.yml` 选择保持不变

- [x] C4 验证 setup 新建与保留行为
  - Verifies: `elements/workspace-init.md` / Requirement "Setup 物化默认结构拆分方法" / Scenarios "新项目获得显式默认方法", "Existing project 保留用户 skill", "跨平台 setup 写入相同默认值"
  - Command: `pnpm exec vitest run test/core/setup.test.ts`
  - Expect: 新工作区配置包含唯一 method 分支，existing skill mapping 不被覆盖，路径断言使用平台 path API

- [x] C5 验证 update missing-only migration
  - Verifies: `elements/workspace-update.md` / Requirement "Migrate project config defaults" / Scenarios "配置缺失时创建", "添加缺失的嵌套默认值而不覆盖现有值", "迁移 config.yml 别名", "Windows 上迁移项目配置路径"
  - Command: `pnpm exec vitest run test/core/update.test.ts test/core/project-config.test.ts`
  - Expect: 缺失配置与缺失字段获得 C4，已有 method/skill、用户字段和 `.yml` 文件位置均被保留

### Task 3: 为 Build 与 Explore 生成共享拆分 guidance

**Goal**: 从一个 canonical fragment 生成 Build、Definition Framing 与 Explore 的结构形成规则，并保持 Explore 权限边界。

**Files**:
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Modify: `src/core/templates/workflows/build.ts`
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `.xirang/references/xirang-definition-framing.md`
- Test: `test/core/templates/build.test.ts`
- Test: `test/core/templates/explore-template.test.ts`
- Test: `test/core/templates/definition-framing-reference.test.ts`
- Test: `test/core/templates/semantic-model-consistency.test.ts`

**Requirements**:
- 定义唯一 `STRUCTURAL_DECOMPOSITION_GUIDANCE`，不内联 C4 或项目专属规则。
- Build 在 Modeling Decision Gate、hierarchy authoring 和 clean-context review 中应用 guidance。
- Definition Framing 在结构确认前应用 guidance，并保留单维度、MECE、BFS 与显式 persistence confirmation。
- Explore 只在结构设计时调用 custom skill，Contract-only 讨论不产生结构工作。

#### Checks

- [x] C6 验证 Build 结构形成与 fail-closed 行为
  - Verifies: `elements/semantic-model-build.md` / Requirement "按项目配置形成 Candidate hierarchy" / Scenarios "使用 Agent 已知方法", "方法名无法明确理解", "调用项目自有拆分 skill", "skill 不可用时停止结构形成", "独立语义审查检查拆分一致性"
  - Command: `pnpm exec vitest run test/core/templates/build.test.ts test/core/templates/semantic-model-consistency.test.ts`
  - Expect: Build 模板消费 opaque method/skill、未知输入停止且 semantic review 检查同层维度一致性

- [x] C7 验证 Definition Framing 保持确认协议
  - Verifies: `elements/definition-framing.md` / Requirement "按项目拆分指导确认结构目标" / Scenarios "方法指导同层分解", "skill 指导自定义分解", "拆分指导不可用", "拆分指导不覆盖 Formal 语义"
  - Command: `pnpm exec vitest run test/core/templates/definition-framing-reference.test.ts test/core/templates/explore-template.test.ts`
  - Expect: 拆分 guidance 在结构讨论前应用，且一次一问、只读与独立持久化确认仍成立

- [x] C8 验证 Explore 只在结构设计中调用
  - Verifies: `elements/explore-brainstorming.md` / Requirement "仅在结构设计中应用项目拆分指导" / Scenarios "探索结构变化", "探索 Contract-only 变化", "custom skill 请求写入"
  - Command: `pnpm exec vitest run test/core/templates/explore-template.test.ts`
  - Expect: 结构变化加载 guidance，Contract-only 跳过，custom skill 不能放宽 Explore stage boundary

### Task 4: 为 Propose 与 Snack 限定结构形成时机

**Goal**: 让 Propose 与 Snack 仅在需要形成未确认结构目标时应用拆分 guidance，不重做 framing 或重排无关模型。

**Files**:
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/snack.ts`
- Test: `test/core/templates/propose-template.test.ts`
- Test: `test/core/templates/snack-template.test.ts`
- Test: `test/core/templates/semantic-model-consistency.test.ts`

**Requirements**:
- Propose 无 framing 且需要结构 Delta 时使用 guidance。
- 已确认 Change Structural Definition 优先，Propose 不重新调用拆分 skill。
- Snack 只对授权证据要求的 durable hierarchy 变化使用 guidance。
- Contract-only、implementation-only 或 Architecture Source None 路径不调用拆分 skill。

#### Checks

- [x] C9 验证 Propose 的 framing 优先级
  - Verifies: `elements/propose-workflow.md` / Requirement "仅在 Propose 形成结构目标时应用拆分指导" / Scenarios "无 framing 时形成结构 Delta", "已确认 framing 优先", "Architecture Source 为 None", "拆分指导不可用时阻塞 Formation"
  - Command: `pnpm exec vitest run test/core/templates/propose-template.test.ts test/core/templates/semantic-model-consistency.test.ts`
  - Expect: 只有未确认结构形成路径调用 guidance，confirmed framing 被原样编译，失败不会回退 C4

- [x] C10 验证 Snack 不从实现布局发明结构
  - Verifies: `elements/snack-workflow.md` / Requirement "仅对已授权结构 reconciliation 应用拆分指导" / Scenarios "已发生实现包含结构变化", "实现移动但结构语义不变", "拆分结果无法由证据授权", "custom skill 不可用"
  - Command: `pnpm exec vitest run test/core/templates/snack-template.test.ts test/core/templates/semantic-model-consistency.test.ts`
  - Expect: Snack 只对 durable graph change 调用 guidance，机械代码证据和不可用 skill 不产生猜测 Delta

### Task 5: 配置本仓库项目自有拆分 skill

**Goal**: 让本仓库显式使用多 Perspective 拆分 skill，而不是继承默认 C4。

**Files**:
- Modify: `.gitignore`
- Modify: `.xirang/config.yaml`
- Create: `.pi/skills/xirang-project-decomposition/SKILL.md`

**Requirements**:
- 配置使用 `decomposition.skill: xirang-project-decomposition`。
- custom skill 定义 `semantic-objects` 与 `realization` 的顶层边界。
- `realization` 通过推进过程与协作结构两个互补 Perspective 继续分解。
- 每个 sibling set 使用一个维度并满足 MECE，跨 Perspective 协作使用 Relationships。
- custom skill 保持用户自有，不进入 managed workflow manifest；生成的 Build skill 与项目自有 decomposition skill 均进入 Git review/delivery scope。

#### Checks

- [x] C11 验证本仓库 normalized config 选择 custom skill
  - Verifies: `elements/project-config-loading.md` / Requirement "加载结构拆分配置" / Scenario "加载 skill 名"
  - Command: `xirang config project --json | jq -e '.decomposition == {"skill":"xirang-project-decomposition"}'`
  - Expect: 命令成功且不输出默认 C4

- [x] C12 验证项目专属规则与共享 fragment 隔离
  - Verifies: `elements/skill-generation.md` / Requirement "共享生成结构拆分 guidance" / Scenario "项目专属规则不进入共享片段"
  - Command: `rg -n "semantic-objects|realization-process|collaboration-structure" .pi/skills/xirang-project-decomposition/SKILL.md && ! rg "semantic-objects|realization-process|collaboration-structure" src/core/templates/fragments/xirang-fragments.ts`
  - Expect: 项目规则只存在于用户自有 skill，共享生成源不包含项目 identities

### Task 6: 验证生成 parity、长度与完整配置行为

**Goal**: 证明所有受管工具表面语义一致、模板长度合规且现有项目行为未回归。

**Files**:
- Modify: `.pi/skills/`
- Test: `test/skills/skill-template-length-validation.test.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`
- Test: `test/core/templates/semantic-model-consistency.test.ts`
- Test: `test/skills/semantic-model-consistency.test.ts`

**Requirements**:
- Build、Explore、Propose 与 Snack 共享同一 canonical guidance。
- Apply、Archive、Reviewer 与 Optimizer 不包含 hierarchy 形成 guidance。
- 所有 tool surface 保持生成 parity。
- 每个生成 `SKILL.md` 不超过 200 行。
- 完整 typecheck 与相关配置、setup/update、模板测试通过。

#### Checks

- [x] C13 验证共享生成、非结构排除与长度限制
  - Verifies: `elements/skill-generation.md` / Requirement "共享生成结构拆分 guidance" / Scenarios "四个结构形成 workflow 共享片段", "非结构 workflow 不注入片段", "生成内容继续满足长度约束"
  - Command: `pnpm exec vitest run test/skills/skill-template-length-validation.test.ts test/core/templates/skill-templates-parity.test.ts test/core/templates/semantic-model-consistency.test.ts`
  - Expect: 四个目标 workflow 语义一致，其他 workflow 无该 guidance，全部模板满足 parity 与行数限制

- [x] C14 执行完整相关测试与 typecheck
  - Verifies: `elements/config-projection.md` / Requirement "原样投影结构拆分选择" / Scenario "非结构 workflow 不消费拆分指导"
  - Command: `pnpm exec vitest run test/core/project-config.test.ts test/commands/config.test.ts test/core/setup.test.ts test/core/update.test.ts test/core/templates && pnpm exec tsc --noEmit`
  - Expect: 所有配置、迁移、模板测试与 TypeScript typecheck 通过

- [x] C15 一次性检查当前 Project Root 拆分一致性
  - Verifies: `elements/semantic-model-build.md` / Requirement "按项目配置形成 Candidate hierarchy" / Scenario "独立语义审查检查拆分一致性"
  - Command: `node bin/xirang.js arch outline --format json && node bin/xirang.js arch impact project.root --depth 3 --json && node bin/xirang.js arch query change change-creation change-plan change-realization collaboration-structure delivery-validation framework-identity hierarchical-elements interaction-surfaces metamodel participants project.root realization realization-process relationships semantic-delta semantic-model semantic-model-build semantic-objects semantic-validation views --contract --json && node bin/xirang.js arch validate --json`
  - Evidence: 使用 `xirang-project-decomposition` skill 对 depth 1-3 sibling sets 做只读检查；Formal Semantic Model validation 成功且无 warning。本 Change 不修改 hierarchy。现有 `project.root`、`realization`、`semantic-objects` 与 `collaboration-structure` sibling sets 使用一致维度；后续 Change 需处理三处既有偏差：`change` 同层混合 Change 组成与 `change-creation` 操作，`semantic-model` 同层混合模型组成与 `semantic-validation` 操作，`realization-process` 同层混合推进过程与 `delivery-validation` 交付基础设施。
  - Expect: Formal Semantic Model validation 成功，本 Change 不修改现有 hierarchy

## Required Corrections

- [x] [code_fix] C2、C6-C10 的测试仅覆盖 synthetic projection 或模板文案，production Build、Explore、Propose 与 Snack 在首次结构决策前尚未加载 normalized `decomposition`；需接入真实 workflow entry point，并补 production surface integration tests。
- [x] [code_fix] C6 Build 必须在 Modeling Decision Gate 与首次 Candidate hierarchy 写入前加载 normalized `decomposition`，覆盖 method、skill 与不可用时 fail-closed 路径。
- [x] [code_fix] C7 Definition Framing 必须在 structural framing 前获得 normalized `decomposition`，并通过 production Explore surface 覆盖 method 与 skill 选择。
- [x] [code_fix] C8 Explore 必须在结构方案比较前加载 selected custom skill，同时保持 Contract-only 跳过与只读边界。
- [x] [code_fix] C9 Propose 必须在 source-impact hierarchy formation 前加载 `decomposition`，并覆盖无 framing 的 production 路径。
- [x] [code_fix] C10 Snack 必须在 structural reconciliation 前加载 `decomposition`，并通过 production 路径覆盖 custom skill 不可用行为。
- [x] [artifact_fix] C4 将 `src/core/config-prompts.ts` 补入 Task 2 Files，并说明其负责 setup config serialization。
- [x] [artifact_fix] C12 将 `.gitignore` 补入 Task 5 Files，并声明 Build 与项目自有 decomposition skills 必须进入 Git review/delivery scope。

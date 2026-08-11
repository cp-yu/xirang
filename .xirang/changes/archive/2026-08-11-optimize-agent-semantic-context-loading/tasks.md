### Task 1: 配置 Outline Definition 深度

**Goal**: 以单一 functional default 实现 `architecture.outline.elementDefinitionDepth` 的磁盘物化、resilient parsing、normalized config 和 Agent config projection。

**Files**:
- Modify: `src/core/project-config.ts`
- Modify: `src/core/config-projection.ts`
- Modify: `src/core/config-prompts.ts`
- Test: `test/core/project-config.test.ts`

**Requirements**:
- 默认值 `2` 必须由 setup/update migration、effective config 与 outline command 共用。
- 只接受非负整数；非法 raw config 警告后使用有效默认值并保留其他字段。
- `config project` 与 Agent-facing prompt projection 必须显示 effective value。
- `.yaml`/`.yml` 和路径处理必须在 Windows、macOS、Linux 上保持一致。

#### Checks

- [x] C1 验证默认值物化和 projection
  - Verifies: `elements/project-tooling-configuration.md` / Requirement "管理 Outline Element Definition 深度配置" / Scenarios "新项目物化默认值", "既有项目补充缺失默认值", "config project 显示有效值", "Agent config projection 显示有效值"
  - Command: `pnpm vitest run test/core/project-config.test.ts`
  - Expect: 测试证明缺失配置时磁盘与 effective projections 使用 `2`，合法用户值被保留并投影。

- [x] C2 验证非法配置和跨平台路径
  - Verifies: `elements/project-tooling-configuration.md` / Requirement "管理 Outline Element Definition 深度配置" / Scenarios "非法配置回退有效默认值", "跨平台配置路径一致"
  - Command: `pnpm vitest run test/core/project-config.test.ts`
  - Evidence: 同一定向 suite 在 Windows CI 中使用 `path.join()` 构造 `.yaml`/`.yml` fixtures 并通过。
  - Expect: 负数、非整数和非法 nested shape 产生 warning 后回退 `2`，且无平台路径分隔符假设。

### Task 2: 实现完整结构 Outline Projection

**Goal**: 新增独立 `arch outline` canonical result 与 formatters，完整返回模型结构并按 effective depth 局部加载 Element Definition。

**Files**:
- Create: `src/commands/arch/outline.ts`
- Modify: `src/commands/arch/snapshot.ts`
- Modify: `src/commands/arch/index.ts`
- Create: `test/commands/arch-outline.test.ts`
- Test: `test/commands/arch-snapshot.test.ts`
- Test support: `test/fixtures/arch-outline-deep-process.fixture.mjs`
- Test: `test/integration/arch-command.test.ts`

**Requirements**:
- Outline 必须包含全部 Element hierarchy、Relationships 与完整 Metamodel Kinds，不包含 Views 或 Contracts。
- Root depth 为 `0`，`definitionState` 明确区分 loaded/unloaded，未加载时不得摘要或截断。
- `--definition-depth` 只覆盖本次调用并拒绝非法值。
- text、markdown、json 必须共享 canonical result，保持无状态、只读和确定性。

#### Checks

- [x] C3 验证完整结构覆盖和内容边界
  - Verifies: `elements/arch-outline.md` / Requirement "arch outline SHALL 投影完整模型结构" / Scenarios "输出全部 Element hierarchy", "输出全部 Relationships", "输出完整 Metamodel Kinds", "排除 Views 与 Contracts"
  - Command: `pnpm vitest run test/commands/arch-outline.test.ts test/commands/arch-snapshot.test.ts test/integration/arch-command.test.ts`
  - Expect: 深层 Element 始终可发现，全部 Relationships 与 Kind definition 存在，JSON 中不存在 Authored Views、Requirements 或 Scenarios。

- [x] C4 验证 Definition depth 语义和 CLI override
  - Verifies: `elements/arch-outline.md` / Requirement "arch outline SHALL 按深度加载 Element Definition" / Scenarios "默认加载 Root 到孙层", "显式覆盖本次调用", "零深度只加载 Project Root", "非法命令深度失败"
  - Command: `pnpm vitest run test/commands/arch-outline.test.ts test/integration/arch-command.test.ts`
  - Expect: depth `0/1/2` 无 off-by-one，unloaded nodes 省略 Definition，非法参数非零退出。

- [x] C5 验证多格式、确定性和无状态读取
  - Verifies: `elements/arch-outline.md` / Requirement "arch outline SHALL 支持确定性多格式输出" / Scenarios "JSON 暴露有效 Definition depth", "text 与 markdown 保持 hierarchy", "repeated execution 保持确定性"
  - Command: `pnpm vitest run test/commands/arch-outline.test.ts`
  - Expect: 三种 formatters 共享语义并稳定排序，重复调用不创建 cache 或项目文件。

### Task 3: 收缩 Query 与 Impact 职责

**Goal**: 将 query 改为显式 batch semantic read，将 impact 改为 identity-only scope discovery，同时保留现有 traversal 与 canonical path 能力。

**Files**:
- Modify: `src/commands/arch/query.ts`
- Modify: `src/commands/arch/impact.ts`
- Modify: `src/commands/arch/index.ts`
- Modify: `README.md`
- Modify: `docs/commands.md`
- Modify: `docs/xirang-integration.md`
- Modify: `docs/architecture-integration.md`
- Test: `test/commands/arch-query.test.ts`
- Test: `test/commands/arch-impact.test.ts`
- Test support: `test/fixtures/arch-impact-locale-process.fixture.ts`
- Test: `test/integration/arch-command.test.ts`

**Requirements**:
- Query 只接受稳定 identities，批量去重排序，任一未知 identity 时整体失败。
- Query 只返回显式 Declarations；`--contract` 不得扩散到未请求对象。
- 删除 `query --relations/--depth` 和所有 navigation projection fields。
- Impact 只返回 identities、refinement records、Relationships 与 canonical paths，不返回完整语义或增量状态。

#### Checks

- [x] C6 验证 batch query 和显式读取边界
  - Verifies: `elements/arch-query.md` / Requirement "arch query SHALL 限定显式读取边界" / Scenarios "不自动返回导航对象", "Contract 只作用于显式 identities", "未请求 Contract 时只返回存在状态"
  - Command: `pnpm vitest run test/commands/arch-query.test.ts test/integration/arch-command.test.ts`
  - Expect: result 只有显式 identity map，保留规范 `parent`，Definition/Contract 完整且不向相关对象广播。

- [x] C7 验证旧 query navigation interface 已删除
  - Verifies: `elements/arch-query.md` / REMOVED Requirement "arch query SHALL 支持 --relations 选项"
  - Command: `pnpm vitest run test/commands/arch-query.test.ts test/integration/arch-command.test.ts && ! rg -n 'arch query[^\n]*(--relations|--depth)' README.md docs src .pi .xirang/references`
  - Expect: `--relations` 与 `--depth` 均产生明确 unknown-option failure，public docs 和 generated surfaces 不含旧调用，result schema 不含 `children/refinement/relatedElements/relations`。

- [x] C8 验证 query 错误原子性和 JSON schema
  - Verifies: `elements/arch-query.md` / Requirement "arch query SHALL 处理不存在的 element" / Scenarios "Element 不存在", "批量请求包含未知 identity"
  - Command: `pnpm vitest run test/commands/arch-query.test.ts test/integration/arch-command.test.ts`
  - Expect: unknown identity 或派生 FQN 使整个 batch 非零退出，不输出部分成功结果。

- [x] C9 验证 identity-only impact 保留 traversal 能力
  - Verifies: `elements/arch-impact.md` / Requirement "arch impact SHALL 共享统一输出投影" / Scenarios "无相关 Relationships 正常返回", "JSON 输出可重复", "projection 不包含完整语义"
  - Command: `pnpm vitest run test/commands/arch-impact.test.ts test/integration/arch-command.test.ts`
  - Expect: ancestor/descendant、双向 Relationship 和 canonical path 测试继续通过，payload 不含 Definition、Contract、Requirement、Scenario 或 nested Element。

### Task 4: 迁移 Agent Workflow Protocol

**Goal**: 更新共享和 workflow-specific 生成源，刷新所有托管 Agent surfaces，并验证认知缺口恢复与 `outline -> impact -> query` 协议一致。

**Files**:
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/apply-change.ts`
- Modify: `src/core/templates/workflows/optimizer.ts`
- Modify: `src/core/templates/workflows/snack.ts`
- Modify: `src/core/templates/workflows/reviewer.ts`
- Modify: `.pi/skills/`
- Modify: `.pi/agents/`
- Modify: `.xirang/references/xirang-apply-step-1-preparation.md`
- Modify: `.xirang/references/xirang-self-read-protocol.md`
- Test: `test/core/templates/fragments/xirang-fragments.test.ts`
- Test: `test/core/templates/explore-template.test.ts`
- Test: `test/core/templates/propose-template.test.ts`
- Test: `test/core/templates/apply-change.test.ts`
- Test: `test/core/templates/optimizer-template.test.ts`
- Test: `test/core/templates/snack-template.test.ts`
- Test: `test/core/templates/reviewer-template.test.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`

**Requirements**:
- 静态 shared context 必须规定整体与具体 Element 认知缺口的确定性重载规则。
- Explore 必须使用 `search -> impact -> batch query -> implementation evidence`。
- Propose、Apply、Optimizer 与 task recovery 必须停止生成旧 query navigation options。
- Generated skills/agents 必须从生成源刷新，不直接维护分叉协议副本。
- 最终验证必须覆盖 build、定向 tests 和当前模型的一次性 payload 边界检查。

#### Checks

- [x] C10 验证认知缺口恢复和统一加载协议
  - Verifies: `elements/workflow-templates.md` / Requirement "Agent 认知缺口 SHALL 触发确定性语义重载" / Scenarios "整体模型认知不清", "具体 Element 语义不清", "多个具体 Elements 批量重载"
  - Command: `pnpm vitest run test/core/templates/fragments/xirang-fragments.test.ts test/core/templates/explore-template.test.ts test/core/templates/propose-template.test.ts test/core/templates/apply-change.test.ts test/core/templates/optimizer-template.test.ts test/core/templates/skill-templates-parity.test.ts`
  - Expect: generated surfaces 指导遗忘时重新调用 outline/query，禁止依据残余上下文猜测，且源与生成物保持 parity。

- [x] C11 验证旧 workflow query navigation 调用不存在
  - Verifies: `elements/workflow-templates.md` / Requirement "统一 CLI 查询接口" / Scenarios "Propose 模板包含正确的契约导航指令", "Apply 模板包含正确的契约交叉检查指令", "Optimizer 使用 impact 获取 directed relationships"
  - Command: `rg 'arch query[^\n]*(--relations|--depth)' src/core/templates .pi/skills .pi/agents`
  - Expect: 命令无匹配；所有导航调用改为 impact，完整语义读取改为显式 batch query。

- [x] C12 验证 Explore 影响链和 task recovery
  - Verifies: `elements/explore-brainstorming.md` / Requirement "Explore 主代理保持只读" / Scenarios "Explore 直接获取 semantic impact context", "Explore 不从 identity-only impact 猜测语义"
  - Command: `pnpm vitest run test/core/templates/explore-template.test.ts test/core/templates/apply-change.test.ts`
  - Expect: Explore 与 Apply recovery 的生成提示均遵循 identity discovery 后按需 query 的顺序。

- [x] C13 执行全链路类型和行为验证
  - Verifies: `elements/workflow-templates.md` / Requirement "统一加载协议与优雅降级" / Scenarios "Shared context 使用统一模型", "Shared context 使用 outline 恢复模型总览", "Templates 使用同一 fragment"
  - Command: `pnpm build && pnpm vitest run test/core/project-config.test.ts test/commands/arch-outline.test.ts test/commands/arch-query.test.ts test/commands/arch-impact.test.ts test/integration/arch-command.test.ts test/core/templates`
  - Expect: TypeScript build 与全部定向 behavior/template suites 通过，现有 Semantic Browser 工作树改动不被重置。

- [x] C14 一次性核对当前模型 payload 边界与字节数
  - Verifies: `elements/arch-impact.md` / Requirement "arch impact SHALL 共享统一输出投影" / Scenario "projection 不包含完整语义"
  - Command: `pnpm build && node bin/xirang.js arch outline --format json | wc -c && node bin/xirang.js arch impact deterministic-operations --depth 2 --json | wc -c`
  - Evidence: 记录当前模型的 outline 与 identity-only impact 字节数；本次基线为 154 Elements、50 Relationships，但该数量仅作运行时记录，不作为固定验收条件。检查 impact JSON 不含 `definition`、`contracts`、`requirements` 或 `scenarios`。
  - Expect: 输出边界符合 Delta，且相较旧完整 Definition/Contract 聚合 payload 明显缩小；不新增 persistent benchmark 文件。

## Required Corrections

- [x] [code_fix] C1 normalized config 在 `architecture: {}` 缺少 nested outline 时崩溃；nested outline 访问需保持可选，并补合法 partial shape 回归测试。
- [x] [code_fix] C1 schema defaults 重复 functional default literal；所有 schema default 表达式需引用 `PROJECT_CONFIG_FUNCTIONAL_DEFAULTS`。
- [x] [code_fix] C10 Snack 仍逐 candidate query；生成源需改为按需选择 identities 后执行一次 batch `arch query`，并重新生成托管 surface。
- [x] [artifact_fix] C13 `.xirang/references/xirang-apply-step-1-preparation.md` 与 `.xirang/references/xirang-self-read-protocol.md` 未列入 Task 4 Files 和验证范围；需补充归属或移除变更。
- [x] [code_fix] C3 `arch outline` 的 hierarchy depth 计算和 text/Markdown rendering 使用按层递归，任意深度合法 hierarchy 可触发 call-stack overflow；改为 iterative traversal，并补 deepest-first 20,000 层与双 formatter 受限 stack 回归。
- [x] [code_fix] C3 `arch snapshot` 的 text/Markdown rendering 仍使用按层递归，任意深度合法 hierarchy 可触发 call-stack overflow；改为 iterative traversal，并复用受限 stack deep-chain 回归。
- [x] [code_fix] C6 `arch query --contract` 的 human-readable formatter 只输出 Requirement/Scenario name，遗漏 body；按原始行完整输出两级 body，并补 unit/CLI 回归。
- [x] [code_fix] C9 `arch impact` 的 human-readable formatter 遗漏 canonical relation paths 与 traversal direction；输出稳定 path section，并补 unit/CLI 回归。
- [x] [artifact_fix] C12 Explore Delta 将只读边界写成绝对禁止 artifact persistence，但既有 Explore Role 与 generated workflow 允许用户单独确认后的 CLI-managed Definition Framing；明确该唯一例外，仍禁止 Agent 直接写文件或修改项目、Semantic Model 与普通 Change artifacts。

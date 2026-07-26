### Task 1: 实现 Architecture Search

**Goal**: 以 TDD 实现 Formal Semantic Model 的确定性字段检索和统一输出投影。

**Files**:
- Create: `src/commands/arch/search.ts`
- Create: `src/utils/stable-order.ts`
- Modify: `src/commands/arch/index.ts`
- Test: `test/commands/arch-search.test.ts`

**Requirements**:
- 仅搜索 Formal Element declarations 与 owned Contracts
- 固定字段优先级、match evidence 与 stable ordering
- `--limit` 在排序后生效，无匹配正常返回
- 不执行同义词、LLM 或代码搜索
- 使用 Node.js path utilities 读取跨平台 Contract 路径

#### Checks

- [x] C1 验证 Formal 字段检索与 evidence
  - Verifies: `specs/arch-search-command/spec.md` / Requirement "arch search SHALL 检索 Formal Semantic Model" / Scenario "检索 Element declaration 与 owned Contract"
  - Command: `pnpm exec vitest run test/commands/arch-search.test.ts`
  - Expect: Element 与 Contract 字段命中、Change/code exclusion tests 通过

- [x] C2 验证排序、limit 与空结果
  - Verifies: `specs/arch-search-command/spec.md` / Requirement "arch search SHALL 使用稳定匹配优先级" / Scenario "同级结果稳定排序"
  - Command: `pnpm exec vitest run test/commands/arch-search.test.ts`
  - Expect: exact match priority、stable ordering、跨 process locale 一致、no semantic inference 与 empty matches tests 通过
  - Remediation: matching normalization 与排序必须使用 locale-independent 比较，不得依赖进程 locale
  - Remediation: 使用独立 summary-only Element 验证 exact identity 在 limit 前优先

### Task 2: 实现 Architecture Impact

**Goal**: 以 TDD 实现 focus Elements 的 bounded Relationship subgraph、refinement context、canonical paths 与完整 Contracts。

**Files**:
- Create: `src/commands/arch/impact.ts`
- Create: `src/utils/stable-order.ts`
- Modify: `src/commands/arch/index.ts`
- Modify: `src/core/spec-registry.ts`
- Test: `test/commands/arch-impact.test.ts`
- Test: `test/core/spec-registry.test.ts`
- Test fixture: `test/fixtures/arch-impact-locale-process.fixture.ts`
- Test config: `test/fixtures/vitest.arch-impact-locale.config.ts`

**Requirements**:
- 只接受一个或多个 stable focus Element IDs
- 默认双向 Relationship depth 为 2，并遍历 Metamodel 全部 kinds
- 完整返回 subgraph，每对 Elements 选择一条 canonical shortest path
- 分离 ancestor/descendant refinement 与 Relationship hops
- 返回完整 Contracts、statistics、diagnostics 和可信失败语义

#### Checks

- [x] C3 验证 focus Elements 与双向 graph traversal
  - Verifies: `specs/arch-impact-command/spec.md` / Requirement "arch impact SHALL 返回 bounded Relationship subgraph" / Scenario "双向展开并保留方向"
  - Command: `pnpm exec vitest run test/commands/arch-impact.test.ts`
  - Expect: multiple focus Elements、default depth、incoming/outgoing、generic kinds 与 stable ordering tests 通过

- [x] C4 验证 canonical paths、cycles 与 refinement 分离
  - Verifies: `specs/arch-impact-command/spec.md` / Requirement "arch impact SHALL 投影 canonical shortest paths" / Scenario "cycles 不导致无限遍历"
  - Command: `pnpm exec vitest run test/commands/arch-impact.test.ts`
  - Expect: canonical tie-break、complete edge subgraph、cycle termination、ancestor 与 descendants tests 通过
  - Remediation: relationship/path/Element/Spec output ordering 必须统一使用 locale-independent code-point comparison，并覆盖跨进程 locale

- [x] C5 验证完整 Contracts 与 Formal-only 边界
  - Verifies: `specs/arch-impact-command/spec.md` / Requirement "arch impact SHALL 返回完整 Element Contracts" / Scenario "返回完整 Contract Markdown"
  - Command: `pnpm exec vitest run test/commands/arch-impact.test.ts test/core/spec-registry.test.ts`
  - Expect: zero-or-more Contracts、required contract failure、ownership conflict、unknown owner、unreadable Contract、Windows paths、no Change/code access 与 read-only tests 通过
  - Remediation: Spec Registry ownership/read diagnostics 必须传播到 `arch impact` 并以相关 Spec 或 Element identity 非零失败

### Task 3: 注册 CLI、help、completion 与 telemetry surface

**Goal**: 将两个命令接入 Commander tree，并保持 runtime completion introspection 和隐私边界。

**Files**:
- Modify: `src/cli/index.ts`
- Modify: `src/commands/arch/index.ts`
- Modify: `src/telemetry/index.ts`
- Modify: `src/core/completions/positional-types.ts`
- Modify: `src/core/completions/types.ts`
- Test: `test/integration/arch-command.test.ts`
- Test: `test/core/completions/introspect.test.ts`
- Test: `test/core/completions/positional-types.test.ts`

**Requirements**:
- 注册 `arch search <query>` 与 `arch impact <elementIds...>`
- 暴露 `--json`、`--limit` 与 `--depth`，不暴露 `--change` 或 `--code`
- 为 `arch.search` 与 `arch.impact` 显式声明 positional types
- 所有 shell completion 通过 Commander runtime reflection 获取命令
- Telemetry 只记录 command path，不记录 query 或 focus IDs

#### Checks

- [x] C6 验证 help 与统一 JSON projection
  - Verifies: `specs/arch-impact-command/spec.md` / Requirement "arch impact SHALL 共享统一输出投影" / Scenario "JSON 输出可重复"
  - Command: `pnpm exec vitest run test/integration/arch-command.test.ts`
  - Expect: 两个子命令、flags、默认值、invalid flags 与 JSON serialization tests 通过
  - Remediation: first-run telemetry notice 不得污染 machine-readable stdout，并使用 fresh-config TTY regression 覆盖两个命令

- [x] C7 保持 completion introspection 完整
  - Preserves: `.xirang/specs/cli-completion-introspect/spec.md` / Requirement "防漏测试确保 positionalType 完整性" / Scenario "新增带参数命令但未更新 Map 时测试失败"
  - Command: `pnpm exec vitest run test/core/completions/introspect.test.ts test/core/completions/introspect-regression.test.ts test/core/completions/positional-types.test.ts`
  - Expect: 测试遍历真实 Commander tree 并报告所有遗漏的 positional command path，新命令在所有 completion projections 中可发现
  - Remediation: 真实 Commander tree 的 positional command 必须全部存在于 `POSITIONAL_TYPE_MAP`

### Task 4: 将 Explore 改为直接组合语义与代码证据

**Goal**: 删除 Sweeper delegation 与 terminology report 协议，让 Explore 直接选择 focus Elements 并完成影响判断。

**Files**:
- Modify: `src/core/templates/workflows/explore.ts`
- Test: `test/core/templates/explore-template.test.ts`
- Test: `test/core/templates/semantic-model-consistency.test.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`
- Test: `test/skills/semantic-model-consistency.test.ts`

**Requirements**:
- Explore 使用 `arch search` 与 `arch impact` 获取 Formal semantic context
- 代码证据继续由 CodeGraph、ACE、`rg`、`read` 等独立工具提供
- 删除 `termMappings`、`terminologyObservations`、四态判断与 final Sweeper sweep
- 保留 read-only、一次一问、Design Summary 和 referenceFiles 边界
- Generated Explore skill 继续满足长度与工具中立约束

#### Checks

- [x] C8 验证 Explore direct semantic impact flow
  - Verifies: `specs/explore-brainstorming/spec.md` / Requirement "Explore 主代理保持只读" / Scenario "Explore 直接获取 semantic impact context"
  - Command: `pnpm exec vitest run test/core/templates/explore-template.test.ts`
  - Expect: 模板包含 focus Elements、`arch search`、`arch impact` 和独立代码证据，且不存在 Sweeper/report protocol

- [x] C9 验证 reference 与 generated skill 一致性
  - Verifies: `specs/explore-brainstorming/spec.md` / Requirement "Explore 通过 referenceFiles 暴露 superpowers 行为引导" / Scenario "主 instructions 保持精简并指向 reference"
  - Command: `pnpm exec vitest run test/core/templates/semantic-model-consistency.test.ts test/core/templates/skill-templates-parity.test.ts test/skills/semantic-model-consistency.test.ts`
  - Expect: source template、generated skill、reference paths 与 Formal terminology 一致

### Task 5: 退役 Impact Sweeper 与受管 artifacts

**Goal**: 将 internal subagents 收敛为 Reviewer/Optimizer，并通过显式 ownership-aware cleanup 删除两个历史 Sweeper 名称和三个 references。

**Files**:
- Delete: `src/core/templates/workflows/impact-sweeper.ts`
- Delete: `src/types/sweeper.ts`
- Modify: `src/core/shared/subagent-generation.ts`
- Modify: `src/core/shared/skill-generation.ts`
- Modify: `src/core/templates/sync-engine.ts`
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Modify: `src/core/workflow-installation.ts`
- Delete: `test/core/templates/impact-sweeper-template.test.ts`
- Delete: `test/types/sweeper.test.ts`
- Test: `test/core/shared/subagent-generation.test.ts`
- Test: `test/core/templates/sync-engine.test.ts`
- Test: `test/core/workflow-installation.test.ts`

**Requirements**:
- `INTERNAL_SUBAGENT_TEMPLATES` 只注册 Reviewer 与 Optimizer
- Setup/update 不再生成 Sweeper agent 或 reference sources
- Cleanup 显式覆盖 `xirang-impact-sweeper` 与 legacy `opsx-impact-sweeper`
- Cleanup 显式覆盖三个退役 reference 文件并验证 ownership/header
- 同名用户文件保持不变，所有路径使用 `path.join()`

#### Checks

- [x] C10 验证 internal subagent 集合收敛
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "Internal subagent 模板注册" / Scenario "显式注册两个 internal subagents"
  - Command: `pnpm exec vitest run test/core/shared/subagent-generation.test.ts`
  - Expect: registry、renderer 与 permission tests 只包含 `xirang-reviewer`、`xirang-optimizer`

- [x] C11 验证 ownership-aware legacy cleanup
  - Verifies: `specs/internal-subagent-generation/spec.md` / Requirement "旧 internal skill 目录迁移 cleanup" / Scenario "用户同名文件保持不变"
  - Command: `pnpm exec vitest run test/core/templates/sync-engine.test.ts test/core/workflow-installation.test.ts`
  - Expect: 两种 Sweeper 名称仅在 generated ownership 成立时删除，跨平台路径 tests 通过
  - Remediation: `src/core/shared/skill-generation.ts` 中的 legacy skill cleanup 必须由本任务归因并经上述测试覆盖
  - Remediation: retired agent 删除必须使用 byte-exact 历史指纹或 durable generated metadata，不得把 prompt 句子当作 ownership
  - Remediation: byte-exact migration fingerprints 必须覆盖 Claude、Pi、OpenCode 与 Codex 的历史 renderer outputs

- [x] C12 验证退役 reference cleanup
  - Migration evidence: `design.md` / Risk "历史 artifacts 被误删"
  - Command: `pnpm exec vitest run test/core/templates/sync-engine.test.ts`
  - Expect: 三个 byte-exact 历史生成 reference 被显式清理；同名、同标题但内容不同的用户文件不受影响
  - Remediation: 删除必须校验完整历史生成内容指纹，不能只匹配标题

- [x] C13 验证旧 Sweeper source 完全移除
  - Verifies: `specs/ai-impact-sweeper/spec.md` / REMOVED Requirement "直接返回 canonical JSON report"
  - Command: `test ! -e src/core/templates/workflows/impact-sweeper.ts && test ! -e src/types/sweeper.ts && ! rg -n "impact-sweeper|Impact Sweeper|getImpactSweeperSubagentTemplate|ImpactSweeperReport|terminologyObservations" src --glob '!**/core/templates/sync-engine.ts' --glob '!**/core/shared/skill-generation.ts' --glob '!**/archive/**'`
  - Expect: active source 不再包含 Sweeper template、report type 或 terminology report runtime protocol；显式 migration cleanup identifiers 除外
  - Remediation: absence check 必须区分已退役 runtime residue 与授权的 cleanup allowlist
  - Remediation: 删除 shared fragments 中仍把 Impact Sweeper 列为使用方的 stale comments

### Task 6: 生成受管 surfaces 并执行完整跨平台验证

**Goal**: 通过生成管线收敛 checked-in artifacts，并完成 persistent 与 one-time verification。

**Files**:
- Modify: `.pi/skills/`
- Modify: `.pi/agents/`
- Modify: `.xirang/references/`
- Test: `.github/workflows/test-windows.yml`
- Test: `.github/workflows/xirang-v2-cross-platform.yml`

**Requirements**:
- 只通过生成程序更新 generated skills、agents 与 references
- Windows、macOS、Linux 使用相同 logical identities、sorting 与 cleanup lists
- 全量 tests、lint、build 通过
- 一次性 CLI 输出不包含 Change、代码证据、Agent judgments 或 `seed` terminology
- 只读命令不产生工作区文件

#### Checks

- [x] C14 验证跨平台 path behavior 进入现有 CI
  - Verifies: `specs/arch-search-command/spec.md` / Requirement "arch search SHALL 保持只读和跨平台路径一致" / Scenario "Windows 上读取 owned Contract"
  - Command: `pnpm test`
  - Evidence: `.github/workflows/test-windows.yml` 与 `.github/workflows/xirang-v2-cross-platform.yml` 在 Windows matrix 执行 root `pnpm test`
  - Expect: 新 path-sensitive tests 作为权威套件的一部分在 Windows、macOS、Linux 运行

- [x] C15 验证项目质量门禁
  - Verifies: `specs/arch-impact-command/spec.md` / Requirement "arch impact SHALL 共享统一输出投影" / Scenario "JSON 输出可重复"
  - Command: `pnpm test && pnpm lint && pnpm build`
  - Expect: 所有 persistent tests、lint 与 TypeScript build 通过
  - Isolation: `xirang-definition.md` 是 Apply 前已存在且必须保留的用户改动，不属于本 Change 的 implementation scope
  - Remediation: 通过 `xirang diff --change replace-impact-sweeper-with-arch-cli --write` 重新生成 stale `effective-change.md`

- [x] C16 执行一次性 CLI 验证
  - Verifies: `specs/arch-impact-command/spec.md` / Requirement "arch impact SHALL 只处理 Formal Semantic Model" / Scenario "命令不分析代码"
  - Command: `node bin/xirang.js arch search "Impact Sweeper" --json && node bin/xirang.js arch impact cap.ai.impact-sweeper --depth 2 --json`
  - Expect: 输出包含 Formal Elements、Relationships 与完整 Contracts；除任意 Contract Markdown 内容外，JSON 结构不包含 Change、files、symbols、Agent classification、`seed` 或 `seeds` 字段，且命令不产生项目文件
  - Remediation: Formal-only 边界检查 JSON keys，不扫描完整 Contract Markdown 的自由文本

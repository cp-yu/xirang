### Task 1: Change Structural Definition document kernel

**Goal**: 以 TDD 实现完整 payload、managed metadata、REMOVED rules 与确定性 document parse/render。

**Files**:
- Create: `src/core/framing/types.ts`
- Create: `src/core/framing/document.ts`
- Test: `test/core/framing/document.test.ts`
- Test: `test/core/framing/document.property.test.ts`

**Requirements**:
- 前置 Change `replace-element-summary-with-definition` 已完成；所有 Element Declaration 只使用 `definition`
- 支持四类完整目标和 optional hierarchy preview
- 只允许显式 `operation: REMOVED`
- 保留 payload 数组顺序并规范化 managed metadata

#### Checks

- [x] C1 验证四类结构目标 round-trip
  - Verifies: `elements/change-structural-definition.md` / Requirement "保存完整当前结构目标" / Scenario "同一 framing 同时新增 Kind 与 Element"
  - Command: `pnpm exec vitest run test/core/framing/document.test.ts test/core/framing/document.property.test.ts`
  - Expect: 完整 payload、optional fields、multiline body 与缺失/空 constraint cases 均通过 round-trip

- [x] C2 验证删除语法边界
  - Verifies: `elements/change-structural-definition.md` / Requirement "区分目标态与删除" / Scenario "替换 Relationship triple"
  - Command: `pnpm exec vitest run test/core/framing/document.test.ts`
  - Expect: REMOVED 最小条目有效，显式 ADDED/MODIFIED 与冲突 identity/triple 被拒绝

### Task 2: Semantic Model 基准快照、drift 与 structural validation

**Goal**: 捕获 normalized relevant context，并把结构错误、drift 与 downstream impacts 分开返回。

**Files**:
- Create: `src/core/framing/baseline.ts`
- Create: `src/core/framing/validator.ts`
- Test: `test/core/framing/baseline.test.ts`
- Test: `test/core/framing/validator.test.ts`
- Test: `test/core/framing/baseline.property.test.ts`

**Requirements**:
- 复用现有 semanticTreeFingerprint 与模型 IR
- 闭包覆盖 targets、parents、ancestors、endpoints 与 Kind references
- 区分 fresh、unrelated-drift 与 relevant-drift
- 结构校验不把 Contract/View impacts 误判为 framing errors

#### Checks

- [x] C3 验证 relevant 基准快照捕获与 drift 分类
  - Verifies: `elements/change-structural-definition.md` / Requirement "保存相关 Semantic Model 基准快照" / Scenario "Semantic Model 全局变化"
  - Command: `pnpm exec vitest run test/core/framing/baseline.test.ts test/core/framing/baseline.property.test.ts`
  - Expect: 无关变化不中断，identity、definition、Kind constraint 与 Relationship triple 的相关变化被准确报告

- [x] C4 验证 structural validity 与 impacts 分离
  - Verifies: `elements/deterministic-operations.md` / Requirement "返回结构校验与设计影响" / Scenario "新 Element 需要 Contract"
  - Command: `pnpm exec vitest run test/core/framing/validator.test.ts`
  - Expect: hierarchy、Kind 与 endpoint 错误阻塞，required Contract 与 Authored View effects 进入 impacts

### Task 3: Managed workspace lifecycle 与路径边界

**Goal**: 实现 identity-addressed create/show/update/rename/discard 与跨平台 fail-closed managed paths。

**Files**:
- Create: `src/core/framing/paths.ts`
- Create: `src/core/framing/workspace.ts`
- Test: `test/core/framing/workspace.test.ts`
- Test: `test/core/framing/paths.test.ts`

**Requirements**:
- create 只生成非空 direct-child managed file
- update 使用完整 replacement payload
- slug 可变且 explorationId 不变
- 所有 managed nodes 使用 lstat 类型和 symlink checks
- 使用 Node.js path API 并输出 project-relative POSIX presentation path

#### Checks

- [x] C5 验证 framing lifecycle 与稳定 identity
  - Verifies: `elements/deterministic-operations.md` / Requirement "管理 Change Structural Definition Lifecycle" / Scenario "首次持久化确认结构"
  - Command: `pnpm exec vitest run test/core/framing/workspace.test.ts`
  - Expect: create、full update、rename 与 discard 保持 identity 并只留下最新确认目标

- [x] C6 验证 symlink 与 Windows path 防护
  - Verifies: `elements/deterministic-operations.md` / Requirement "隔离受控文件路径" / Scenario "Managed path 是 symlink", Scenario "Windows 路径分隔符不同"
  - Command: `pnpm exec vitest run test/core/framing/paths.test.ts test/core/framing/workspace.test.ts`
  - Expect: traversal、duplicate identity、non-regular nodes 与 symlinks fail closed，Windows/ POSIX containment assertions 均通过

### Task 4: Framing CLI 与 JSON contract

**Goal**: 注册 `xirang framing` commands，并以单一 versioned envelope 暴露 lifecycle、validation 与错误。

**Files**:
- Create: `src/commands/framing.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/core/completions/positional-types.ts`
- Test: `test/commands/framing.test.ts`
- Test: `test/commands/framing-json.test.ts`
- Test: `test/core/completions/positional-types.test.ts`

**Requirements**:
- 注册 create/list/show/status/validate/update/rename/consume/discard
- 支持 stdin 与 non-symlink regular `--from` input
- JSON mode 不输出 spinner、颜色、stack 或额外 stdout
- stable error codes 与 exit 0/1

#### Checks

- [x] C7 验证完整 command surface
  - Verifies: `elements/deterministic-operations.md` / Requirement "管理 Change Structural Definition Lifecycle" / Scenario "首次持久化确认结构"
  - Command: `pnpm exec vitest run test/commands/framing.test.ts`
  - Expect: 九个 subcommands、参数与 read/write lifecycle 均按 contract 注册和执行

- [x] C8 验证 JSON envelope 与 exit semantics
  - Verifies: `elements/deterministic-operations.md` / Requirement "提供稳定 Framing JSON Contract" / Scenario "Validation 发现相关 Drift"
  - Command: `pnpm exec vitest run test/commands/framing-json.test.ts`
  - Expect: ok、invalid、error 均输出唯一合法 JSON document，invalid/error exit 1

#### Remediation

- [x] [code_fix] C7 read-only lifecycle commands MUST NOT create `.xirang` or `changes` directories before persistence confirmation.
- [x] [code_fix] C8 diagnostics MUST carry stable `ERROR|WARNING|INFO` severity.
- [x] [artifact_fix] C7 completion positional behavior and its test MUST be attributed to Task 4.
- [x] [code_fix] C8 required-option and positional parser failures MUST use the versioned JSON envelope when `--json` is present.

### Task 5: Propose consume 与 Change discovery isolation

**Goal**: 实现四类 Delta coverage、幂等 provenance freeze，并锁定隐藏文件不进入普通 Change lifecycle。

**Files**:
- Create: `src/core/framing/consume.ts`
- Modify: `src/utils/item-discovery.ts`
- Modify: `src/commands/workflow/shared.ts`
- Modify: `src/core/list.ts`
- Modify: `src/core/change-utils.ts`
- Test: `test/core/framing/consume.test.ts`
- Test: `test/utils/framing-discovery-isolation.test.ts`

**Requirements**:
- coverage 推导 ADDED、MODIFIED、REMOVED 与 no-op
- validation 或 relevant drift 失败时保留源
- frozen destination 固定为 change-structural-definition.md
- identical copy 可恢复且 conflicting copy fail closed
- list、validate、sync、archive 与 viewer 只处理 Change directories

#### Checks

- [x] C9 验证结构降低 coverage 门禁
  - Verifies: `elements/propose.md` / Requirement "验证结构降低覆盖" / Scenario "一个确认目标缺少 Delta Entry"
  - Command: `pnpm exec vitest run test/core/framing/consume.test.ts`
  - Expect: 四类目标的缺失或错误 operation 阻塞 consume，no-op 不要求冗余 Delta

- [x] C10 验证幂等 freeze 与 discovery isolation
  - Verifies: `elements/deterministic-operations.md` / Requirement "确定性消费结构来源" / Scenario "上次消费在复制后中断"
  - Command: `pnpm exec vitest run test/core/framing/consume.test.ts test/utils/framing-discovery-isolation.test.ts`
  - Expect: 相同副本恢复清理、相异副本保留源，普通 Change commands 始终忽略 `.explore-*.md`

#### Remediation

- [x] [code_fix] C9 coverage MUST normalize unordered Kind constraints before no-op derivation and Delta target matching.
- [x] [code_fix] C10 ordinary Change discovery and selection MUST exclude hidden directories as well as hidden files.
- [x] [artifact_fix] C10 Task 5 Files MUST attribute `src/core/list.ts` and `src/core/change-utils.ts`.

### Task 6: Explore、Propose 与 shared reference generation

**Goal**: 从生成源投影 Definition Framing protocol，并让 Explore/Propose 使用完整结构来源和 consume gate。

**Files**:
- Modify: `xirang-definition.md`
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/templates/sync-engine.ts`
- Generated output: `.xirang/references/xirang-definition-framing.md`
- Generated output: `.xirang/references/xirang-explore-supperpowers-style.md`
- Generated output: `.pi/skills/xirang-explore/SKILL.md`
- Generated output: `.pi/skills/xirang-propose/SKILL.md`
- Test: `test/core/templates/skill-templates-parity.test.ts`
- Test: `test/core/templates/explore-template.test.ts`
- Test: `test/core/templates/propose-template.test.ts`
- Test: `test/core/templates/definition-framing-reference.test.ts`

**Requirements**:
- Xirang-owned reference 负责结构 framing，不复制 Superpowers overall flow
- Explore 使用 framing persistence 且不直接修改其他项目/Change artifacts
- Change Structural Definition 已形成时，Design Exploration 恢复前读取完整当前 payload；未形成时直接基于 Semantic Model 与项目证据推进
- Propose 仅在 Change Structural Definition 已形成时重算 drift、impacts、coverage 并在完成后 consume
- generated reference 不依赖用户级 skill path

#### Checks

- [x] C11 验证共享 Definition Framing 协议投影
  - Verifies: `elements/project-tooling-configuration.md` / Requirement "投影共享 Definition Framing 协议" / Scenario "刷新 Explore 工作面"
  - Command: `pnpm exec vitest run test/core/templates/definition-framing-reference.test.ts test/core/templates/explore-template.test.ts`
  - Expect: generated Explore surface 引用 Xirang-owned reference，且没有外部 skill runtime path 或重复 Superpowers protocol

- [x] C12 验证 Explore/Propose handoff
  - Verifies: `elements/design-exploration.md` / Requirement "使用可用的当前完整结构定义" / Scenario "恢复中断且已有结构定义的 Explore"
  - Command: `pnpm exec vitest run test/core/templates/explore-template.test.ts test/core/templates/propose-template.test.ts`
  - Expect: 有结构定义时 Explore 读取完整 payload 并处理 impacts，Propose 只在 validation/coverage 后 consume 到固定 frozen path；无结构定义时两者保持既有路径

#### Remediation

- [x] [artifact_fix] C11 generated Superpowers-style Explore reference MUST be attributed to Task 6.
- [x] [code_fix] C11 shared Definition Framing reference MUST implement causal definition, MECE single-dimension decomposition, and BFS same-level confirmation.
- [x] [code_fix] C12 resumed Explore MUST run `framing validate` before Design Exploration so current impacts are available.

### Task 7: Cross-platform integration 与完成门禁

**Goal**: 在持久集成测试与 Windows CI 中证明完整 workflow、package projection 和既有行为不回归。

**Files**:
- Create: `test/integration/framing-workflow.test.ts`
- Modify: `.github/workflows/test-windows.yml`
- Test: `test/integration/framing-workflow.test.ts`

**Requirements**:
- temp workspace 覆盖 create 到 consume 的完整流程
- Windows job 运行 framing path tests、build 与 lint
- 不引入新 dependency 或浏览器 E2E 门禁
- package/postinstall 生成面包含 shared reference
- 完成前执行 full repository verification

#### Checks

- [x] C13 验证 temp-workspace 完整 workflow
  - Verifies: `elements/propose.md` / Requirement "冻结结构定义来源" / Scenario "Consume 失败"
  - Command: `pnpm exec vitest run test/integration/framing-workflow.test.ts`
  - Expect: create、drift、update、valid Change、consume、frozen provenance 与 discovery isolation 全部通过

- [x] C14 验证 Windows CI path behavior
  - Verifies: `elements/deterministic-operations.md` / Requirement "隔离受控文件路径" / Scenario "Windows 路径分隔符不同"
  - Command: `pnpm exec vitest run test/core/framing/paths.test.ts test/core/framing/workspace.test.ts && pnpm build && pnpm lint`
  - Evidence: `windows-latest` job 对同一命令返回成功结果

- [x] C15 执行一次性完整验证
  - Verifies: `elements/deterministic-operations.md` / Requirement "提供稳定 Framing JSON Contract" / Scenario "Validation 发现相关 Drift"
  - Command: `pnpm test && pnpm lint && pnpm build && pnpm audit:identity && pnpm test:postinstall && pnpm test:pack-install`
  - Expect: 全部 commands 成功，built CLI temp-workspace JSON smoke flow 无额外 stdout

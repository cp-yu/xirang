### Task 1: Init granularity 显式持久化

**Goal**: 让 bootstrap init 只接受 agent 已确认的 `granularity`，并移除 hidden `coarse` 默认。

**Files**:
- Modify: `src/cli/index.ts`
- Modify: `src/commands/bootstrap.ts`
- Modify: `src/utils/bootstrap-utils.ts`
- Test: `test/commands/bootstrap.test.ts`
- Test: `test/utils/bootstrap-utils.test.ts`

**Requirements**:
- 增加 `openspec bootstrap init --granularity coarse|fine`。
- 缺失或非法 `--granularity` 时 fail fast。
- 移除 `ScopeConfig` 的 hidden `coarse` default 与 `?? 'coarse'` fallback。
- restart 时显式 `--granularity` 覆盖 retained workspace 值。

#### Checks

- [x] C1 Verify explicit granularity persistence
  - Verifies: `specs/bootstrap-init-ux/spec.md` / Requirement "Granularity init state SHALL be explicit" / Scenario "Agent supplies explicit granularity to init"
  - Command: `pnpm test -- test/commands/bootstrap.test.ts test/utils/bootstrap-utils.test.ts`
  - Expect: init with `--granularity coarse` writes `granularity: coarse` to `openspec/bootstrap/scope.yaml`

- [x] C2 Verify missing and invalid granularity rejection
  - Verifies: `specs/bootstrap-init-ux/spec.md` / Requirement "Granularity init state SHALL be explicit" / Scenario "Missing granularity fails fast", Scenario "Invalid granularity fails fast"
  - Command: `pnpm test -- test/commands/bootstrap.test.ts test/utils/bootstrap-utils.test.ts`
  - Expect: init without `--granularity` or with an invalid value fails before creating or updating scope

- [x] C3 Verify restart explicit granularity override
  - Verifies: `specs/bootstrap-init-ux/spec.md` / Requirement "Granularity init state SHALL be explicit" / Scenario "Restart carries explicit granularity"
  - Command: `pnpm test -- test/commands/bootstrap.test.ts test/utils/bootstrap-refresh-utils.test.ts test/cli-e2e/bootstrap-refresh.test.ts`
  - Expect: restart writes the explicitly supplied granularity instead of silently inheriting or defaulting

### Task 2: spec_groups schema 与 gate validation

**Goal**: 将 `spec_groups` 加入 domain-map source schema，并让 coarse/fine 的 source 合同在 gate 中可验证。

**Files**:
- Modify: `src/utils/bootstrap-utils.ts`
- Modify: `schemas/bootstrap/templates/domain-map.md`
- Test: `test/utils/bootstrap-utils.test.ts`

**Requirements**:
- `DomainMapFileSchema` 支持 `spec_groups`。
- `coarse` domain-map 必须包含 valid `spec_groups`。
- `spec_groups[].capabilities` 必须引用同一 domain-map 中声明的 capability。
- `spec_groups[].folder` 必须是单一跨平台 path segment，且不能重复。

#### Checks

- [x] C4 Verify valid coarse spec_groups gate
  - Verifies: `specs/bootstrap-domain-map-state/spec.md` / Requirement "Domain-map spec_groups validation" / Scenario "Coarse domain-map with valid spec_groups is valid"
  - Command: `pnpm test -- test/utils/bootstrap-utils.test.ts`
  - Expect: valid `spec_groups` passes `map_to_review` until candidate spec validation

- [x] C5 Verify coarse spec_groups validation failures
  - Verifies: `specs/bootstrap-domain-map-state/spec.md` / Requirement "Domain-map spec_groups validation" / Scenario "Coarse domain-map without spec_groups is invalid", Scenario "spec_groups cannot reference missing capabilities", Scenario "spec_groups folder conflicts are rejected"
  - Command: `pnpm test -- test/utils/bootstrap-utils.test.ts`
  - Expect: coarse without groups, missing capability references, and duplicate folders each report deterministic gate errors

- [x] C6 Verify Windows path separator rejection
  - Verifies: `specs/bootstrap-domain-map-state/spec.md` / Requirement "Domain-map spec_groups validation" / Scenario "Windows path separators are rejected in spec_groups folder"
  - Command: `pnpm test -- test/utils/bootstrap-utils.test.ts`
  - Expect: `spec_groups[].folder` containing platform separators is rejected as not being a single segment

### Task 3: Candidate spec 编译与 review 覆盖展示

**Goal**: 让 candidate compiler 按 granularity 分支生成 specs，并在 review 中展示 coarse grouped spec 覆盖关系。

**Files**:
- Modify: `src/utils/bootstrap-utils.ts`
- Test: `test/utils/bootstrap-utils.test.ts`
- Test: `test/utils/bootstrap-utils.pbt.contract.test.ts`
- Test: `test/cli-e2e/bootstrap-lifecycle.test.ts`

**Requirements**:
- `fine` 保留 `capabilities[].spec` per-capability 生成行为。
- `coarse` 从 `spec_groups` 生成 grouped candidate specs。
- grouped spec frontmatter 包含 `spec_groups[].capabilities`。
- review 显示 spec group 到 capabilities 的覆盖关系。
- PBT invariant 改为 capability coverage，而非 capability/spec 一一对应。

#### Checks

- [x] C7 Verify coarse grouped candidate specs
  - Verifies: `specs/bootstrap/spec.md` / Requirement "Bootstrap grouped spec source" / Scenario "Coarse mode uses spec_groups as spec source"
  - Command: `pnpm test -- test/utils/bootstrap-utils.test.ts test/cli-e2e/bootstrap-lifecycle.test.ts`
  - Expect: one `spec_groups` entry generates one candidate/formal spec with multi-capability frontmatter

- [x] C8 Verify fine candidate specs remain per capability
  - Verifies: `specs/bootstrap/spec.md` / Requirement "Bootstrap grouped spec source" / Scenario "Fine mode keeps capability spec source"
  - Command: `pnpm test -- test/utils/bootstrap-utils.test.ts`
  - Expect: `granularity: fine` continues to use `capabilities[].spec` and does not merge through `spec_groups`

- [x] C9 Verify coverage invariant replaces one-to-one invariant
  - Verifies: `specs/bootstrap-baseline/spec.md` / Requirement "Raw + full SHALL generate formal OPSX and complete valid specs" / Scenario "Coarse full output covers capabilities through grouped specs", Scenario "Fine full output remains per capability"
  - Command: `pnpm test -- test/utils/bootstrap-utils.pbt.contract.test.ts`
  - Expect: every mapped capability is covered by at least one generated spec frontmatter; grouped specs may cover multiple capabilities

### Task 4: Skill guidance, schema docs, and generated surface

**Goal**: 让 bootstrap skill 与 schema instructions 表达 agent/CLI 边界、coarse/fine 差异、`spec_groups` source 和完成后 validation。

**Files**:
- Modify: `src/core/templates/workflows/bootstrap-opsx.ts`
- Modify: `schemas/bootstrap/schema.yaml`
- Modify: `docs/opsx-bootstrap.md`
- Modify: `.pi/skills/openspec-bootstrap-opsx/SKILL.md`
- Test: `test/core/templates/bootstrap-opsx.test.ts`
- Test: `test/cli-e2e/bootstrap-phase1.test.ts`

**Requirements**:
- skill agent 在 init 前询问 `coarse` / `fine`，解释差异，不默认选择。
- schema instructions 说明 `coarse` 使用 `spec_groups`，`fine` 使用 `capabilities[].spec`。
- promote/backfill 后的 skill guidance 要求运行 `openspec validate --all`。
- 旧的一对一文案更新为 coverage 或 granularity-aware wording。

#### Checks

- [x] C10 Verify agent granularity guidance
  - Verifies: `specs/bootstrap/spec.md` / Requirement "Bootstrap granularity selection" / Scenario "Agent asks granularity before init", Scenario "CLI persists explicit granularity"
  - Command: `pnpm test -- test/core/templates/bootstrap-opsx.test.ts test/cli-e2e/bootstrap-phase1.test.ts`
  - Expect: generated bootstrap guidance requires agent-side granularity selection and explicit CLI persistence

- [x] C11 Verify completion validation guidance
  - Verifies: `specs/bootstrap/spec.md` / Requirement "Bootstrap completion validation" / Scenario "Agent validates after promote", Scenario "Validation failure returns to artifact repair"
  - Command: `pnpm test -- test/core/templates/bootstrap-opsx.test.ts`
  - Expect: bootstrap skill guidance requires `openspec validate --all` after promote/backfill and routes failures back to repair

### Task 5: 全量验证与残留清理

**Goal**: 清理 hidden default 与旧 per-capability-only 文案，并验证 OpenSpec artifacts 全量合法。

**Files**:
- Modify: `openspec/specs/bootstrap/spec.md`
- Modify: `openspec/specs/bootstrap-baseline/spec.md`
- Modify: `openspec/specs/bootstrap-init-ux/spec.md`
- Modify: `openspec/specs/bootstrap-domain-map-state/spec.md`
- Test: `openspec/changes/bootstrap-granularity-spec-groups/tasks.md`

**Requirements**:
- 不保留 `default('coarse')` 或 `?? 'coarse'`。
- 不保留把 `full` 描述成唯一一 capability 一个 spec 的 active 文案。
- 变更 artifacts 通过 warning-only proposal validation。
- 最终执行 `openspec validate --all`。

#### Checks

- [x] C12 Verify hidden default removal
  - Verifies: `specs/bootstrap-init-ux/spec.md` / Requirement "Granularity init state SHALL be explicit" / Scenario "Missing granularity fails fast"
  - Command: `rg "default\\('coarse'\\)|\\?\\? 'coarse'" src test schemas docs openspec`
  - Expect: no hidden `coarse` default remains outside archived historical content

- [x] C13 Verify stale one-to-one wording cleanup
  - Verifies: `specs/bootstrap-baseline/spec.md` / Requirement "Raw + full SHALL generate formal OPSX and complete valid specs" / Scenario "Coarse full output covers capabilities through grouped specs"
  - Command: `rg "one validated spec.*mapped capability|per mapped capability" src docs openspec`
  - Expect: active wording no longer states per-capability specs as the only full-mode contract

- [x] C14 Verify all OpenSpec artifacts
  - Verifies: `specs/bootstrap/spec.md` / Requirement "Bootstrap completion validation" / Scenario "Agent validates after promote"
  - Command: `openspec validate --all`
  - Expect: all changes and formal specs validate successfully

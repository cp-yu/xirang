### Task 1: 补全 specs JSON requirement headers

**Goal**: 让 `openspec list --specs --json` 默认输出 formal spec 的 requirement header 名称。

**Files**:
- Modify: `src/core/list.ts`
- Test: `test/core/list.test.ts`

**Requirements**:
- JSON 输出新增 `requirements: string[]` 且保留现有字段。
- `requirements` 来源是 `### Requirement:` header 名称，不是正文 text。
- 无法读取、无法解析或无 headers 时返回空数组。
- header 抽取不得污染 human table 输出。

#### Checks

- [x] C1 Verify specs JSON includes requirement headers
  - Verifies: `specs/cli-list/spec.md` / Requirement "JSON output format for specs" / Scenario "JSON output includes capabilities and requirements fields"
  - Command: `pnpm test -- test/core/list.test.ts`
  - Expect: list specs JSON 测试证明 `requirements` 字段包含 header 名称并保留 `capabilities`

- [x] C2 Verify missing requirement headers use empty arrays
  - Verifies: `specs/cli-list/spec.md` / Requirement "JSON output format for specs" / Scenario "Capabilities and requirements fields are empty arrays when missing"
  - Command: `pnpm test -- test/core/list.test.ts`
  - Expect: 无法读取、无法解析或无 requirement headers 的 spec 输出 `requirements: []`

- [x] C3 Verify JSON shape example remains parseable
  - Verifies: `specs/cli-list/spec.md` / Requirement "JSON output format for specs" / Scenario "JSON structure example"
  - Command: `pnpm build && openspec list --specs --json`
  - Expect: 命令输出为合法 JSON，且每个 spec 条目包含 `requirements` 数组

### Task 2: 增加 artifact-scoped change validation

**Goal**: 让 `openspec validate` 支持显式 change scope 与 artifact scope。

**Files**:
- Modify: `src/cli/index.ts`
- Modify: `src/commands/validate.ts`
- Test: `test/commands/validate.test.ts`

**Requirements**:
- `openspec validate --change <name>` 执行完整 change validation。
- `--artifacts specs` 只运行 change delta spec validation。
- `--artifacts opsx-delta` 只运行 OPSX delta dry-run validation。
- 非法 artifact scope 与缺失 change deterministically fail。
- 旧入口 `openspec validate <name>` 保持可用。

#### Checks

- [x] C4 Verify explicit change validation is full validation
  - Verifies: `specs/cli-validate/spec.md` / Requirement "Artifact-scoped change validation" / Scenario "Explicit change validation defaults to full change validation"
  - Command: `pnpm test -- test/commands/validate.test.ts`
  - Expect: 测试证明 `openspec validate --change c1` 与完整 change validation 语义一致

- [x] C5 Verify specs artifact scope
  - Verifies: `specs/cli-validate/spec.md` / Requirement "Artifact-scoped change validation" / Scenario "Specs artifact scope validates only delta specs"
  - Command: `pnpm test -- test/commands/validate.test.ts`
  - Expect: 测试证明 `--artifacts specs` 只报告 delta spec validation 结果

- [x] C6 Verify opsx-delta artifact scope
  - Verifies: `specs/cli-validate/spec.md` / Requirement "Artifact-scoped change validation" / Scenario "OPSX delta artifact scope validates only opsx-delta"
  - Command: `pnpm test -- test/commands/validate.test.ts`
  - Expect: 测试证明 `--artifacts opsx-delta` 只报告 OPSX delta dry-run validation 结果

- [x] C7 Verify invalid validate scope errors
  - Verifies: `specs/cli-validate/spec.md` / Requirement "Artifact-scoped change validation" / Scenarios "Unknown artifact scope fails deterministically" "Missing explicit change fails deterministically"
  - Command: `pnpm test -- test/commands/validate.test.ts`
  - Expect: 非法 `--artifacts` 与未知 `--change` 均 exit 1 且不运行无关验证

### Task 3: 更新 propose staged validation guidance

**Goal**: 让生成的 propose workflow guidance 使用 artifact-scoped validate 命令。

**Files**:
- Modify: `src/core/templates/workflows/propose.ts`
- Test: `test/core/templates/propose-template.test.ts`

**Requirements**:
- post-propose guidance 包含 specs staged validation 命令。
- post-propose guidance 包含 opsx-delta staged validation 命令。
- full validation 命令使用 `openspec validate --change "<name>" --json`。
- warning-only 与不运行 `openspec sync` 的边界保持不变。

#### Checks

- [x] C8 Verify staged validation commands in propose guidance
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Post-propose staged validation guidance" / Scenario "Propose guidance includes staged validation commands"
  - Command: `pnpm test -- test/core/templates/propose-template.test.ts`
  - Expect: 模板测试证明 generated propose skill 包含 specs 与 opsx-delta staged validate 命令

- [x] C9 Verify full validation remains warning-only
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Post-propose staged validation guidance" / Scenario "Propose guidance keeps full validation available"
  - Command: `pnpm test -- test/core/templates/propose-template.test.ts`
  - Expect: 模板测试证明 full validation 命令、warning-only 边界与 `openspec sync` 禁止规则仍存在

### Task 4: 完成 change-level verification

**Goal**: 确认 artifacts、OPSX delta 与实现检查全部通过。

**Files**:
- Modify: `openspec/changes/improve-spec-list-and-staged-validation/proposal.md`
- Modify: `openspec/changes/improve-spec-list-and-staged-validation/design.md`
- Modify: `openspec/changes/improve-spec-list-and-staged-validation/specs/cli-list/spec.md`
- Modify: `openspec/changes/improve-spec-list-and-staged-validation/specs/cli-validate/spec.md`
- Modify: `openspec/changes/improve-spec-list-and-staged-validation/specs/propose-workflow/spec.md`
- Modify: `openspec/changes/improve-spec-list-and-staged-validation/opsx-delta.yaml`
- Modify: `openspec/changes/improve-spec-list-and-staged-validation/tasks.md`

**Requirements**:
- OpenSpec change validation 通过。
- 项目测试通过相关 suites。
- 最终 build 通过。

#### Checks

- [x] C10 Verify OpenSpec change artifacts
  - Verifies: `specs/cli-validate/spec.md` / Requirement "Artifact-scoped change validation" / Scenario "Explicit change validation defaults to full change validation"
  - Command: `openspec validate improve-spec-list-and-staged-validation --type change --json`
  - Expect: change-local specs 与 opsx-delta validation 均无 ERROR

- [x] C11 Verify implementation suites and build
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Post-propose staged validation guidance" / Scenarios "Propose guidance includes staged validation commands" "Propose guidance keeps full validation available"
  - Command: `pnpm test -- test/core/list.test.ts test/commands/validate.test.ts test/core/templates/propose-template.test.ts && pnpm build`
  - Expect: 相关测试与 build 全部通过

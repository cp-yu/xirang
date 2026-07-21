### Task 1: 实现 check-delta CLI

**Goal**: 新增 `openspec check-delta` 顶层命令，按 spec id 聚合检查计划引用的 requirement headers。

**Files**:
- Create: `src/commands/check-delta.ts`
- Modify: `src/cli/index.ts`
- Modify: `openspec/project.opsx.code-map.yaml`
- Test: `test/commands/check-delta.test.ts`

**Requirements**:
- `--caps` 按 `openspec/specs/<spec-id>/spec.md` 解析并输出 `Available requirements`。
- `--added`、`--modified`、`--removed`、`--renamed-from` 可重复，且按 operation 语义分类。
- Missing 或 Conflict 不短路其他 requirement 或其他 spec id。
- Human output 与 `--json` output 都返回聚合结果。
- 正常输出使用 project-relative `openspec/specs/<spec-id>/spec.md` 路径。

#### Checks

- [x] C1 Verify available requirement output
  - Verifies: `specs/cli-check-delta/spec.md` / Requirement "Delta requirement reference preflight" / Scenario "可用 requirement headers 输出", "Cross-platform main spec path output"
  - Command: `pnpm test test/commands/check-delta.test.ts`
  - Expect: 测试断言 main spec path 与 Available requirements 输出稳定，且不依赖平台绝对路径。

- [x] C2 Verify invalid cap input failures
  - Verifies: `specs/cli-check-delta/spec.md` / Requirement "Delta requirement reference preflight" / Scenario "不存在的 spec id 失败", "缺失 caps 参数失败"
  - Command: `pnpm test test/commands/check-delta.test.ts`
  - Expect: 缺失或不存在的 `--caps` 返回 exit code 1，并解释 `--caps` 接受 spec ids / spec directory names。

- [x] C3 Verify operation-specific checks
  - Verifies: `specs/cli-check-delta/spec.md` / Requirement "Operation-specific requirement checks" / Scenario "MODIFIED header 存在时通过", "MODIFIED header 不存在时报 Missing", "REMOVED header 不存在时报 Missing", "RENAMED FROM header 不存在时报 Missing", "ADDED header 不存在时通过", "ADDED header 已存在时报 Conflict"
  - Command: `pnpm test test/commands/check-delta.test.ts`
  - Expect: 每个 operation flag 按存在性期望分类为 OK、Missing 或 Conflict，失败结果返回 exit code 1。

- [x] C4 Verify aggregate and repeatable flag behavior
  - Verifies: `specs/cli-check-delta/spec.md` / Requirement "Aggregated check result output" / Scenario "混合结果不中断同一 spec 的其他校验", "多个 caps 分组输出", "Repeatable operation flags are all evaluated"
  - Command: `pnpm test test/commands/check-delta.test.ts`
  - Expect: mixed result 下所有 entries 都出现在输出中，最终 exit code 由聚合 validity 决定。

- [x] C5 Verify JSON report behavior
  - Verifies: `specs/cli-check-delta/spec.md` / Requirement "JSON output for delta preflight" / Scenario "JSON schema includes aggregate and grouped results", "JSON invalid result sets exit code 1", "JSON valid result sets exit code 0"
  - Command: `pnpm test test/commands/check-delta.test.ts`
  - Expect: JSON schema 包含 `change`、`valid`、`items[]` 与分类数组，exit code 与 aggregate validity 一致。

### Task 2: 更新 propose workflow guidance

**Goal**: 在 `openspec-propose` specs 写入前加入精简 `openspec check-delta` guidance，并保留 post-write validation guidance。

**Files**:
- Modify: `src/core/templates/workflows/propose.ts`
- Test: `test/core/templates/propose-template.test.ts`

**Requirements**:
- specs 写入前提及 `openspec check-delta`。
- guidance 包含 `--added`、`--modified`、`--removed`、`--renamed-from`。
- Missing 与 Conflict 在写 specs 前 blocking。
- post-propose validation 仍 warning-only，且保留 `openspec validate --change "<name>" --artifacts specs --json`。
- 当前不为短 guidance 新增 propose `referenceFiles`。

#### Checks

- [x] C6 Verify propose pre-write guidance
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Propose pre-write delta reference guidance" / Scenario "Propose guidance includes check-delta before writing specs", "Propose does not create a reference file only for short check-delta guidance"
  - Command: `pnpm test test/core/templates/propose-template.test.ts`
  - Expect: template test 断言 main instructions 包含 `openspec check-delta` 与 operation flags，且未新增仅承载该短 guidance 的 reference file。

- [x] C7 Verify post-write validation remains warning-only
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Propose pre-write delta reference guidance" / Scenario "Propose guidance distinguishes pre-write blocking from post-write validation"
  - Command: `pnpm test test/core/templates/propose-template.test.ts`
  - Expect: template test 断言 pre-write blocking wording 与 post-propose warning-only validation wording 同时存在。

### Task 3: 验证 artifact 与命令引用一致性

**Goal**: 验证新命令的 artifacts、OPSX delta 与 active command references 保持一致。

**Files**:
- Modify: `openspec/changes/add-check-delta-command/opsx-delta.yaml`
- Test: `openspec/changes/add-check-delta-command/specs/cli-check-delta/spec.md`
- Test: `openspec/changes/add-check-delta-command/specs/propose-workflow/spec.md`

**Requirements**:
- 新 capability `cap.cli.check-delta` 进入 OPSX delta。
- active propose template 引用已实现的 CLI command surface。
- change-local specs 与 opsx-delta 均通过 artifact-scoped validation。

#### Checks

- [x] C8 Verify change specs validation
  - Verifies: `specs/cli-check-delta/spec.md` / Requirement "Delta requirement reference preflight" / Scenario "可用 requirement headers 输出"
  - Command: `openspec validate "add-check-delta-command" --type change --json`
  - Expect: change validation 通过，或仅剩与当前环境命令 surface 不支持 `--change --artifacts` 相关的已知 warning 被明确报告。

- [x] C9 Verify active command references
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Propose pre-write delta reference guidance" / Scenario "Propose guidance includes check-delta before writing specs"
  - Command: `rg -n "check-delta|--added|--modified|--renamed-from" src/core/templates/workflows/propose.ts openspec/changes/add-check-delta-command/specs/propose-workflow/spec.md`
  - Expect: active source template 与 change-local spec 均引用新 command surface。

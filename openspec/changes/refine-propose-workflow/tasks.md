### Task 1: 以 RED tests 固定 Propose 与配置目标合同

**Goal**: 先让测试表达 semantic readiness、change identity、validation gate、labels preview 和 retired config 的目标行为，并确认现有实现失败。

**Files**:
- Modify: `test/core/templates/propose-template.test.ts`
- Modify: `test/core/project-config.test.ts`
- Modify: `test/core/global-config.test.ts`
- Modify: `test/core/config-schema.test.ts`
- Modify: `test/commands/config.test.ts`

**Requirements**:
- 覆盖 Design Summary reuse 与五项 semantic readiness，不再断言字符数或 detail score。
- 覆盖 explicit override、readiness 前无写入、new/existing change identity。
- 覆盖 validation ERROR 阻塞、WARNING 放行与 preview-first scenario labels。
- 覆盖 project/global 旧 `propose` 节点静默忽略且 normalized query 不输出。
- 覆盖 `config set propose...` 即使带 `--allow-unknown` 也拒绝。

#### Checks

- [x] C1 验证 Propose 目标 prompt 合同先失败
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Propose smart routing" / Scenario "Semantic readiness 完整", "Semantic readiness 不完整", "用户显式 override", "Routing decision 不污染 artifacts"
  - Command: `pnpm exec vitest run test/core/templates/propose-template.test.ts`
  - Expect: 新断言因旧评分、旧配置、旧 validation 与直接 label write 文本仍存在而失败。

- [x] C2 验证 retired config 合同先失败
  - Verifies: `specs/config-loading/spec.md` / Requirement "Project config 静默忽略退役的 Propose routing 配置" / Scenario "旧 Propose routing 节点静默忽略", "退役节点不进入 projection"
  - Command: `pnpm exec vitest run test/core/project-config.test.ts test/core/global-config.test.ts test/core/config-schema.test.ts test/commands/config.test.ts`
  - Expect: 新断言因旧 `propose` 字段仍被解析、默认化或允许写入而失败。

### Task 2: 删除 retired config surface

**Goal**: 从 project/global config 的 active types、schemas、defaults、loaders、projection 与 write whitelist 移除 Propose routing，同时保留旧磁盘配置的静默读取兼容。

**Files**:
- Modify: `src/core/project-config.ts`
- Modify: `src/core/global-config.ts`
- Modify: `src/core/config-schema.ts`
- Modify: `src/core/config-projection.ts`
- Modify: `src/commands/config.ts`
- Test: `test/core/project-config.test.ts`
- Test: `test/core/global-config.test.ts`
- Test: `test/core/config-schema.test.ts`
- Test: `test/commands/config.test.ts`

**Requirements**:
- `ProjectConfig`、`GlobalConfig`、defaults 与 `NormalizedProjectConfig` 不包含 `propose`。
- 旧 project/global `propose` 节点静默过滤，不 warning、不改写磁盘文件。
- 其他 global unknown fields 继续按 forward compatibility 合同保留。
- `config project` 与 instructions normalized projection 不输出 `propose`。
- `config set` 拒绝已知 retired `propose` 路径，包括 `--allow-unknown`。

#### Checks

- [x] C3 验证 project config 与 projection 过滤 retired 节点
  - Verifies: `specs/config-project-query/spec.md` / Requirement "查询项目配置" / Scenario "JSON 输出包含完整配置", "旧 Propose routing 配置不进入查询结果"
  - Command: `pnpm exec vitest run test/core/project-config.test.ts test/commands/config.test.ts`
  - Expect: project loader、normalized projection 与 CLI query 均不返回 `propose`，其他配置保持不变。

- [x] C4 验证 global config 静默过滤且拒绝新写入
  - Verifies: `specs/global-config/spec.md` / Requirement "Global config 静默过滤退役的 Propose routing 配置" / Scenario "旧 global Propose 节点静默忽略", "默认配置不再包含 Propose routing"
  - Command: `pnpm exec vitest run test/core/global-config.test.ts test/core/config-schema.test.ts test/commands/config.test.ts`
  - Expect: 旧节点不返回也不告警，defaults 无 `propose`，CLI 不允许重新写入。

### Task 3: 删除 check-delta CLI capability

**Goal**: 删除冗余 pre-write CLI 及其注册/测试，并确认 Commander introspection、completion 与 help 不再暴露该命令。

**Files**:
- Delete: `src/commands/check-delta.ts`
- Delete: `test/commands/check-delta.test.ts`
- Modify: `src/cli/index.ts`
- Modify: `test/core/completions/introspect-regression.test.ts`
- Test: `test/commands/completion.test.ts`

**Requirements**:
- CLI command tree 不包含 `check-delta`。
- Completion 由 Commander runtime reflection 自动去除该命令。
- 不增加静态 command registry 或替代 preflight。
- `validateChangeDeltaSpecs()` 的 existing header cross-check 保持不变。

#### Checks

- [x] C5 验证 check-delta CLI 已删除
  - Verifies: `specs/cli-check-delta/spec.md` / REMOVED Requirement "Delta requirement reference preflight"
  - Command: `test ! -e src/commands/check-delta.ts && test ! -e test/commands/check-delta.test.ts && ! node bin/openspec.js --help | grep -q 'check-delta'`
  - Expect: 实现、专属测试和顶层 help 均不存在该 surface。

- [x] C6 验证 introspection/completion 无 stale command
  - Verifies: `specs/cli-check-delta/spec.md` / REMOVED Requirement "JSON output for delta preflight"
  - Command: `pnpm exec vitest run test/core/completions/introspect-regression.test.ts test/commands/completion.test.ts`
  - Expect: runtime-reflected command tree 与 completion 不包含 `check-delta`，其他命令保持完整。

### Task 4: 重构 Propose prompt source

**Goal**: 将 Propose 收敛为 evidence-first semantic readiness、明确 identity、definition-first authoring、blocking combined validation 与 preview-first labels 的单一流程。

**Files**:
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `.pi/skills/`
- Test: `test/core/templates/propose-template.test.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`

**Requirements**:
- Readiness 使用 problem、impact scope、approach、verification method 与 unresolved source decisions。
- Readiness/override 前不创建 new change；existing change 使用合并上下文。
- Prompt 不包含 routing config、detail score、routing comment、`check-delta` 或 change rename 暗示。
- 最终只执行一次 combined validation，ERROR 阻塞，WARNING 不阻塞。
- Labels 先 preview 审查后 write；状态只在 readiness、blocker 与 final summary 输出。

#### Checks

- [x] C7 验证 semantic readiness 与 change identity
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Propose 创建完整 change 制品" / Scenario "Readiness 未通过时不创建 change", "更新 existing change", "New change ID 冲突", "Identity 不明确且 ID 已存在"
  - Command: `pnpm exec vitest run test/core/templates/propose-template.test.ts`
  - Expect: template 明确 write gate 与 identity 分支，不含 rename、自动续写或替代 ID 行为。

- [x] C8 验证 validation、labels 与输出收敛
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Post-propose validation 使用分级 gate" / Scenario "Combined semantic-source delta validation", "Validation ERROR 阻塞", "Validation WARNING 不阻塞"
  - Command: `pnpm exec vitest run test/core/templates/propose-template.test.ts`
  - Expect: prompt 只保留 combined validation，preview 先于 write，且无逐 artifact 播报与 validator 内部函数名。

- [x] C9 验证生成 Skill 与模板一致
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Propose 使用 definition-first authoring" / Scenario "Specs boundary 不重复定义", "Scenario labels preview 后生成"
  - Command: `node bin/openspec.js update --force . && pnpm exec vitest run test/core/templates/skill-templates-parity.test.ts test/skills/skill-template-length-validation.test.ts`
  - Expect: generated Propose Skill byte-identical、parity hash 更新且长度限制通过。

### Task 5: 完成 active implementation cleanup 与全量验证

**Goal**: 证明 breaking removal、prompt generation、change-local Specs、OPSX delta 与全项目质量门禁一致，并保持 formal source 由后续 sync 独占更新。

**Files**:
- Modify: `test/commands/artifact-workflow.test.ts`
- Test: `test/`
- Test: `openspec/changes/refine-propose-workflow/specs/`
- Test: `openspec/changes/refine-propose-workflow/opsx-delta.yaml`

**Requirements**:
- Active implementation、tests、schemas、generated Skills 与 references 清零 retired config 和 CLI 引用。
- Formal Specs/OPSX 通过 change-local deltas 表达目标状态，Apply 不直接执行 sync。
- Archive/bootstrap history occurrences 只报告，不修改。
- 全量 tests、lint、build、strict formal Specs 与 target change validation 通过。
- `git diff --check` 通过且没有意外 archive 修改。

#### Checks

- [x] C10 验证 active implementation surfaces 无 retired 引用
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Propose smart routing" / Scenario "Routing decision 不污染 artifacts"
  - Command: `! rg -n 'propose\.(smartRouting|requireExplore)|openspec check-delta|propose-smart-routing/spec\.md|opsx-propose-skill/spec\.md|cli-check-delta/spec\.md' src schemas .pi openspec/references && ! rg -n 'specs/(propose-smart-routing|opsx-propose-skill|cli-check-delta)/spec\.md' test`
  - Expect: active production/generated surfaces 与 test contracts 无 retired 正向引用；legacy-input fixtures 和 absence assertions 保留，formal source removal 由 change-local deltas 等待后续 sync。

- [x] C11 验证全项目质量门禁
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Post-propose validation 使用分级 gate" / Scenario "Validation 全部通过"
  - Command: `pnpm test && pnpm lint && pnpm build && node bin/openspec.js validate --specs --strict --json && node bin/openspec.js validate --change "refine-propose-workflow" --json && git diff --check`
  - Expect: tests、lint、build、formal Specs、target change validation 与 diff checks 全部通过，且 Apply 未修改 formal source。

## Remediation

- [x] [code_fix] Propose smart routing：为 confirmed Design Summary 显式路由 architecture、testing、risk 与 trade-off decisions，并补充四类决策的 template assertions。
- [x] [code_fix] Post-propose validation 使用分级 gate：将 scaffolding checks 与 combined validation 的 ERROR 统一纳入单轮 repair/re-check 和 ready-for-apply blocking flow，并补充 scenario-specific test。
- [x] [artifact_fix] Unaccounted Changes Detection：在 Task 2 Files 中声明 `Modify: src/commands/config.ts`。

### Task 1: Schema 模型扩展与 FileDefinition

**Goal**: 为内置 Schema 增加结构化 `FileDefinition` Zod 类型，并在 `spec-driven` 与 `bootstrap` Schema YAML 中为全部受管文件物化定义。

**Files**:
- Modify: `src/core/artifact-graph/types.ts`
- Modify: `src/core/artifact-graph/schema.ts`
- Modify: `src/core/artifact-graph/index.ts`
- Modify: `src/core/relations/renderers.ts`
- Modify: `schemas/spec-driven/schema.yaml`
- Modify: `schemas/bootstrap/schema.yaml`
- Test: `test/core/artifact-graph/schema.test.ts`
- Test: `test/core/relations/renderers.test.ts`

**Requirements**:
- `FileDefinition` 包含必填 `purpose`、`compilationRole`、`content.includes`、`content.excludes`、`writePolicy` 与 `validation`
- Spec-driven artifacts 每个声明 definition；bootstrap 使用顶层 files registry 与 phase artifact file ID 引用
- Parser 校验 definition 完整性、file ID 唯一性与 artifact 引用有效性

#### Checks

- [x] C1 校验 Schema parser 接受完整 definition
  - Verifies: `specs/artifact-file-definitions/spec.md` / Requirement "结构化文件定义" / Scenario "内置 artifact definition 可解析"
  - Command: `pnpm exec vitest run test/core/artifact-graph/schema.test.ts`
  - Expect: definition Zod validation 通过

- [x] C2 校验 definition 缺失字段被拒绝
  - Verifies: `specs/artifact-file-definitions/spec.md` / Requirement "结构化文件定义" / Scenario "不完整 definition 被拒绝"
  - Command: `pnpm exec vitest run test/core/artifact-graph/schema.test.ts`
  - Expect: 空 includes/excludes/validation、未知 writePolicy 或缺失必填字段失败

- [x] C3 校验 bootstrap file ID 引用可验证
  - Verifies: `specs/artifact-file-definitions/spec.md` / Requirement "Bootstrap phase 文件定义投影" / Scenario "Bootstrap file 引用可验证"
  - Command: `pnpm exec vitest run test/core/artifact-graph/schema.test.ts`
  - Expect: 重复或不存在 file ID 导致 Schema validation 失败

### Task 2: Artifact instructions 投影 definition

**Goal**: 让 `openspec instructions <artifact>` 返回 resolved definition，并在文本输出中优先展示。

**Files**:
- Modify: `src/core/artifact-graph/instruction-loader.ts`
- Modify: `src/commands/workflow/instructions.ts`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`
- Test: `test/commands/artifact-workflow.test.ts`

**Requirements**:
- `ArtifactInstructions` 接口增加 `definition` 字段
- JSON 输出包含 definition，文本输出在 instruction/template 前展示
- Blocked artifact 仍返回 definition

#### Checks

- [x] C4 校验 instructions JSON 包含 definition
  - Verifies: `specs/artifact-file-definitions/spec.md` / Requirement "Agent definition-first authoring" / Scenario "Instructions JSON 返回 definition"
  - Command: `pnpm exec vitest run test/core/artifact-graph/instruction-loader.test.ts`
  - Expect: JSON 同时包含 definition、instruction、template、dependencies 与 configProjection

- [x] C5 校验文本输出优先展示 definition
  - Verifies: `specs/artifact-file-definitions/spec.md` / Requirement "Agent definition-first authoring" / Scenario "文本输出优先展示 definition"
  - Command: `pnpm exec vitest run test/commands/artifact-workflow.test.ts`
  - Expect: `<definition>` 位于 `<instruction>` 与 `<template>` 之前

- [x] C6 校验 artifact definition projection
  - Verifies: `specs/cli-artifact-workflow/spec.md` / Requirement "Artifact definition projection" / Scenario "Instructions JSON 包含 definition"
  - Command: `pnpm exec vitest run test/commands/artifact-workflow.test.ts`
  - Expect: definition 与当前内置 Schema artifact definition 一致

### Task 3: Bootstrap phase definitions 投影

**Goal**: `openspec bootstrap instructions <phase>` 按 phase 投影相关 file definitions。

**Files**:
- Modify: `src/commands/bootstrap.ts`
- Test: `test/commands/bootstrap.test.ts`

**Requirements**:
- Phase instructions JSON 包含 `fileDefinitions`，仅限该 phase 读取、编写或审查的文件
- Init 与 scan、map、review、promote 各自投影对应文件集合

#### Checks

- [x] C7 校验 phase 只返回相关文件
  - Verifies: `specs/artifact-file-definitions/spec.md` / Requirement "Bootstrap phase 文件定义投影" / Scenario "Phase 只返回相关文件"
  - Command: `pnpm exec vitest run test/commands/bootstrap.test.ts`
  - Expect: scan/map/review/promote 的 fileDefinitions 仅包含该 phase 相关文件

- [x] C8 校验 Bootstrap phase file definitions
  - Verifies: `specs/bootstrap/spec.md` / Requirement "Bootstrap phase file definitions" / Scenario "Init 与 scan definitions"
  - Command: `pnpm exec vitest run test/commands/bootstrap.test.ts`
  - Expect: init 描述 `.bootstrap.yaml` 与 `scope.yaml`，scan 额外描述 `evidence.yaml`

### Task 4: 删除 project-local/user Schema resolution

**Goal**: 限制 Schema resolution 为固定内置 `spec-driven` 与 `bootstrap`，删除 project/user lookup 与 shadowing。

**Files**:
- Modify: `src/core/artifact-graph/resolver.ts`
- Modify: `src/commands/schema.ts`
- Modify: `src/commands/workflow/schemas.ts`
- Modify: `src/commands/workflow/templates.ts`
- Modify: `docs/cli.md`
- Modify: `docs/customization.md`
- Modify: `docs/concepts.md`
- Modify: `docs/migration-guide.md`
- Test: `test/core/artifact-graph/resolver.test.ts`
- Test: `test/commands/schema.test.ts`

**Requirements**:
- `resolveSchema()` 仅返回 package 内置 Schema，project 与 user directory 不参与
- `which` 报告 package location 与 `source: package`
- 未知 Schema ID fail fast 并列出合法 ID

#### Checks

- [x] C9 校验内置 Schema 解析
  - Verifies: `specs/schema-resolution/spec.md` / Requirement "Built-in Schema resolution" / Scenario "内置 Schema 解析"
  - Command: `pnpm exec vitest run test/core/artifact-graph/resolver.test.ts`
  - Expect: 解析 spec-driven/bootstrap 返回 package directory

- [x] C10 校验 project 与 user override 被忽略
  - Verifies: `specs/schema-resolution/spec.md` / Requirement "Built-in Schema resolution" / Scenario "Project 与 user override 被忽略"
  - Command: `pnpm exec vitest run test/core/artifact-graph/resolver.test.ts`
  - Expect: 存在同名 project/user Schema 时结果只包含 package 内置

- [x] C11 校验未知 Schema 明确失败
  - Verifies: `specs/schema-resolution/spec.md` / Requirement "Built-in Schema resolution" / Scenario "未知 Schema 明确失败"
  - Command: `pnpm exec vitest run test/core/artifact-graph/resolver.test.ts`
  - Expect: 报告不存在并列出 spec-driven 与 bootstrap

- [x] C12 校验 which 报告内置 Schema
  - Verifies: `specs/schema-which-command/spec.md` / Requirement "Built-in Schema inspection" / Scenario "查询内置 Schema"
  - Command: `pnpm exec vitest run test/commands/schema.test.ts`
  - Expect: 显示 package source 与完整 directory path

- [x] C13 校验 project-schemas-directory helper 已删除
  - Verifies: `specs/schema-resolution/spec.md` / REMOVED Requirement "Project schemas directory helper"
  - Command: `! grep -r "projectSchemasDirectory" src/`
  - Expect: 无残留引用

- [x] C36 校验 active docs 仅描述内置 Schema
  - Verifies: `specs/schema-resolution/spec.md` / Requirement "Built-in Schema resolution" / Scenario "内置 Schema 解析"
  - Command: `! rg -n 'Create a new project-local schema|Create custom schemas|Copy an existing schema|user-level schemas|Source: project|openspec/schemas/my-workflow|~/.openspec/schemas|openspec/schemas/(spec-driven|bootstrap)' docs/cli.md docs/customization.md docs/concepts.md docs/migration-guide.md`
  - Expect: active docs 不再宣传 custom/project/user Schema 或已删除命令

### Task 5: 删除 schema init 与 schema fork 命令

**Goal**: 删除 `schema init` 与 `schema fork` CLI 命令及其测试。

**Files**:
- Modify: `src/commands/schema.ts`
- Modify: `test/commands/schema.test.ts`

**Requirements**:
- Schema 子命令仅保留 `which` 与 `validate`
- 无 init/fork 残留导入或路由

#### Checks

- [x] C14 校验 schema init 命令已删除
  - Verifies: `specs/schema-init-command/spec.md` / REMOVED Requirement "Schema init command creates project-local schema"
  - Command: `node bin/openspec.js schema init >/tmp/openspec-schema-init.log 2>&1; test $? -ne 0`
  - Expect: 命令不存在或未注册

- [x] C15 校验 schema fork 命令已删除
  - Verifies: `specs/schema-fork-command/spec.md` / REMOVED Requirement "Schema fork copies existing schema"
  - Command: `node bin/openspec.js schema fork >/tmp/openspec-schema-fork.log 2>&1; test $? -ne 0`
  - Expect: 命令不存在或未注册

### Task 6: Schema validation 收敛为内置检查

**Goal**: `schema validate` 仅校验内置 `spec-driven` 与 `bootstrap`，增加 file definition 与 template checks。

**Files**:
- Modify: `src/commands/schema.ts`
- Modify: `test/commands/schema.test.ts`

**Requirements**:
- Validate 一个或全部内置 Schema
- Checks 包含 YAML、Zod、file definitions、template existence、dependency DAG 与 bootstrap file references
- 未知 Schema 非零退出并列出合法 ID

#### Checks

- [x] C16 校验单个内置 Schema
  - Verifies: `specs/schema-validate-command/spec.md` / Requirement "Built-in Schema validation" / Scenario "校验一个内置 Schema"
  - Command: `pnpm exec vitest run test/commands/schema.test.ts`
  - Expect: JSON 输出 valid、name、path 与 issues

- [x] C17 校验全部内置 Schema
  - Verifies: `specs/schema-validate-command/spec.md` / Requirement "Built-in Schema validation" / Scenario "校验全部内置 Schema"
  - Command: `pnpm exec vitest run test/commands/schema.test.ts`
  - Expect: 不带 name 时校验 spec-driven 与 bootstrap

- [x] C18 校验未知 Schema 被拒绝
  - Verifies: `specs/schema-validate-command/spec.md` / Requirement "Built-in Schema validation" / Scenario "未知 Schema 被拒绝"
  - Command: `pnpm exec vitest run test/commands/schema.test.ts`
  - Expect: 非零退出并列出合法内置 ID

### Task 7: Authoring help 消费 Schema file definitions

**Goal**: `openspec help authoring` 从内置 Schema definitions 构建文件级 help，relation files 组合 Registry projection。

**Files**:
- Modify: `src/commands/help.ts`
- Modify: `test/commands/help.test.ts`

**Requirements**:
- OPSX、delta、change artifact help 使用对应 Schema file definition
- Canonical topic 通过显式 lookup，不使用路径模式
- Relation details 保持 Registry 单一来源

#### Checks

- [x] C19 校验 OPSX help 与 Schema definition 一致
  - Verifies: `specs/cli-authoring-help/spec.md` / Requirement "Schema-backed file definition help" / Scenario "OPSX help 与 Schema definition 一致"
  - Command: `pnpm exec vitest run test/commands/help.test.ts`
  - Expect: `project.opsx.yaml`、`project.opsx.relations.yaml` 与 `opsx-delta.yaml` definition 与 Schema 一致

- [x] C20 校验 relation details 保持 Registry 来源
  - Verifies: `specs/cli-authoring-help/spec.md` / Requirement "Schema-backed file definition help" / Scenario "Relation details 保持 Registry 单一来源"
  - Command: `pnpm exec vitest run test/commands/help.test.ts`
  - Expect: relations 包含全部 Registry-derived fields

- [x] C21 校验 canonical topic 使用显式 lookup
  - Verifies: `specs/cli-authoring-help/spec.md` / Requirement "Schema-backed file definition help" / Scenario "Canonical topic 使用显式 lookup"
  - Command: `pnpm exec vitest run test/commands/help.test.ts`
  - Expect: 不使用路径模式、大小写或正则猜测 file kind

### Task 8: 内置 Schema binding 限制

**Goal**: Config、change metadata 与 CLI 保留 Schema binding，但合法值限于 `spec-driven` 与 `bootstrap`。

**Files**:
- Modify: `src/core/project-config.ts`
- Modify: `src/utils/change-metadata.ts`
- Modify: `src/utils/change-utils.ts`
- Modify: `src/commands/workflow/new-change.ts`
- Modify: `src/commands/workflow/shared.ts`
- Test: `test/core/project-config.test.ts`
- Test: `test/utils/change-metadata.test.ts`
- Test: `test/utils/change-utils.test.ts`

**Requirements**:
- Resolution precedence 保持 CLI option → change metadata → project config → default
- 非内置 binding fail fast，不静默回退或改写文件

#### Checks

- [x] C22 校验 change 持久化内置 binding
  - Verifies: `specs/schema-resolution/spec.md` / Requirement "Built-in Schema binding" / Scenario "Change 持久化内置 binding"
  - Command: `pnpm exec vitest run test/utils/change-metadata.test.ts`
  - Expect: `.openspec.yaml` 持久化 Schema ID

- [x] C23 校验非内置 binding 不静默迁移
  - Verifies: `specs/schema-resolution/spec.md` / Requirement "Built-in Schema binding" / Scenario "非内置 binding 不静默迁移"
  - Command: `pnpm exec vitest run test/core/project-config.test.ts test/utils/change-utils.test.ts`
  - Expect: 引用非内置 Schema fail fast 并提供 remediation

- [x] C37 校验 changed source 不宣称 custom Schema 支持
  - Verifies: `specs/schema-resolution/spec.md` / Requirement "Built-in Schema binding" / Scenario "非内置 binding 不静默迁移"
  - Command: `! rg -n 'project-local schema resolution|custom schema|my-workflow' src/core/artifact-graph/instruction-loader.ts src/utils/change-metadata.ts src/utils/change-utils.ts src/commands/workflow/shared.ts`
  - Expect: source comments 与 examples 仅描述内置 Schema

### Task 9: Workflow templates 使用 definition-first authoring

**Goal**: 更新 propose、explore、apply、archive、bootstrap、snack 模板，指示 Agent 先消费 definition。

**Files**:
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/templates/workflows/apply-change.ts`
- Modify: `src/core/templates/workflows/archive-change.ts`
- Modify: `src/core/templates/workflows/bootstrap-opsx.ts`
- Modify: `src/core/templates/workflows/snack.ts`
- Modify: `.pi/skills/openspec-propose/SKILL.md`
- Modify: `.pi/skills/openspec-explore/SKILL.md`
- Modify: `.pi/skills/openspec-apply-change/SKILL.md`
- Modify: `.pi/skills/openspec-archive-change/SKILL.md`
- Modify: `.pi/skills/openspec-bootstrap-opsx/SKILL.md`
- Modify: `.pi/skills/openspec-snack/SKILL.md`
- Test: `test/core/templates/skill-templates-parity.test.ts`
- Test: `test/core/templates/archive-change.test.ts`

**Requirements**:
- Templates 包含 definition-first 消费纪律
- Templates 不内联具体 definition prose
- Propose 在生成 artifact 前读取 instructions definition

#### Checks

- [x] C24 校验 propose 使用 artifact instructions definition
  - Verifies: `specs/ai-workflow-templates/spec.md` / Requirement "Agent definition-first authoring" / Scenario "Propose 使用 artifact instructions definition"
  - Command: `pnpm exec vitest run test/core/templates/skill-templates-parity.test.ts test/core/templates/propose-template.test.ts test/core/templates/bootstrap-opsx.test.ts test/core/templates/archive-change.test.ts`
  - Expect: propose 模板指示读取 `openspec instructions <artifact> --json` 的 definition

- [x] C25 校验 bootstrap 使用 phase definitions
  - Verifies: `specs/ai-workflow-templates/spec.md` / Requirement "Agent definition-first authoring" / Scenario "Bootstrap 使用 phase definitions"
  - Command: `pnpm exec vitest run test/core/templates/skill-templates-parity.test.ts test/core/templates/propose-template.test.ts test/core/templates/bootstrap-opsx.test.ts test/core/templates/archive-change.test.ts`
  - Expect: bootstrap 模板指示读取 `openspec bootstrap instructions <phase> --json` 的 fileDefinitions

- [x] C26 校验 workflow 不复制 definitions
  - Verifies: `specs/ai-workflow-templates/spec.md` / Requirement "Agent definition-first authoring" / Scenario "Workflow 不复制 definitions"
  - Command: `pnpm exec vitest run test/core/templates/skill-templates-parity.test.ts test/core/templates/propose-template.test.ts test/core/templates/bootstrap-opsx.test.ts test/core/templates/archive-change.test.ts`
  - Expect: 模板仅包含 definition-first 纪律，不内联完整 definition

### Task 10: 编译哲学片段更新

**Goal**: 更新 `OPSX_COMPILATION_PHILOSOPHY` 片段，区分 durable source、compilation scaffolding 与 change reconciliation。

**Files**:
- Modify: `src/core/templates/fragments/opsx-fragments.ts`
- Test: `test/core/templates/fragments/opsx-fragments.test.ts`

**Requirements**:
- Specs + OPSX 为 durable semantic source
- Proposal/design/tasks 为 compilation scaffolding
- Change-local specs 与 opsx-delta 为 target-state delta
- 片段包含完整编译映射与行为规则

#### Checks

- [x] C27 校验片段区分 source 与 scaffolding
  - Verifies: `specs/compilation-philosophy-fragment/spec.md` / Requirement "编译哲学片段定义" / Scenario "片段区分 source 与 scaffolding"
  - Command: `pnpm exec vitest run test/core/templates/fragments/opsx-fragments.test.ts`
  - Expect: 声明 Specs + OPSX 为 durable source 与 proposal/design/tasks 为 scaffolding

- [x] C28 校验片段包含完整编译映射
  - Verifies: `specs/compilation-philosophy-fragment/spec.md` / Requirement "编译哲学片段定义" / Scenario "片段包含完整编译映射"
  - Command: `pnpm exec vitest run test/core/templates/fragments/opsx-fragments.test.ts`
  - Expect: 包含 compiler、static analysis、semantic-check pass、optimization pass、linking/release 概念

- [x] C29 校验片段包含 source completeness 纪律
  - Verifies: `specs/compilation-philosophy-fragment/spec.md` / Requirement "编译哲学片段定义" / Scenario "片段包含 source completeness 纪律"
  - Command: `pnpm exec vitest run test/core/templates/fragments/opsx-fragments.test.ts`
  - Expect: 禁止 Agent 静默猜测关键 decision

### Task 11: Snack 与 apply 删除 code-map 依赖

**Goal**: Snack 与 apply recovery 不读取或要求 `project.opsx.code-map.yaml`。

**Files**:
- Modify: `src/core/templates/workflows/snack.ts`
- Modify: `src/core/templates/workflows/apply-change.ts`
- Modify: `openspec/references/openspec-apply-step-1-preparation.md`
- Modify: `openspec/docs/workflow-state-machine.md`
- Test: `test/core/templates/snack-template.test.ts`
- Test: `test/core/templates/apply-change.test.ts`

**Requirements**:
- Snack 使用 capability id/intent、spec coverage、CodeGraph 或 ACE/rg/read
- Apply recovery 使用 OPSX v2 semantic navigation 与 CLI query
- 不读取 code-map 或从 OPSX 读取 code paths

#### Checks

- [x] C30 校验 snack Code-map 反查不读取 code-map
  - Verifies: `specs/snack-skill/spec.md` / Requirement "Code-map 反查" / Scenario "无 CodeGraph 时回退"
  - Command: `pnpm exec vitest run test/core/templates/snack-template.test.ts`
  - Expect: 不读取 `project.opsx.code-map.yaml`

- [x] C31 校验 apply 任务执行失败处理不读取 code-map
  - Verifies: `specs/apply-task-decomposition/spec.md` / Requirement "任务执行失败处理" / Scenario "任务需求不明确"
  - Command: `pnpm exec vitest run test/core/templates/apply-change.test.ts`
  - Expect: 使用 OPSX query 与 CodeGraph/ACE/rg/read，不读取 code-map

- [x] C38 校验 workflow state document 使用 OPSX v2 two-file contract
  - Verifies: `specs/opsx-propose-skill/spec.md` / Requirement "OPSX validation aligns with downstream sync/archive semantics" / Scenario "OPSX delta against current formal bundle"
  - Command: `rg -q 'formal OPSX two-file bundle' openspec/docs/workflow-state-machine.md && ! rg -n '三个 OPSX|代码映射完整性|code-map|读取 project\.opsx\.yaml' openspec/docs/workflow-state-machine.md`
  - Expect: active workflow document 仅描述 formal two-file bundle 与 Registry semantic validation

### Task 12: OPSX propose validation 不读取 code-map

**Goal**: Post-propose OPSX delta validation 通过 artifact-scoped CLI 执行，不读取或生成 code-map。

**Files**:
- Modify: `src/core/templates/workflows/propose.ts`
- Test: `test/core/templates/propose-template.test.ts`

**Requirements**:
- OPSX validation 使用 `openspec validate --change "<name>" --artifacts opsx-delta --json`
- Validator 执行 dry-run merge、referential integrity 与 Registry semantic validation
- 不调用 code-map validation

#### Checks

- [x] C32 校验 OPSX delta against formal bundle
  - Verifies: `specs/opsx-propose-skill/spec.md` / Requirement "OPSX validation aligns with downstream sync/archive semantics" / Scenario "OPSX delta against current formal bundle"
  - Command: `pnpm exec vitest run test/core/templates/propose-template.test.ts && rg -q 'openspec validate --change "<name>"' openspec/docs/workflow-state-machine.md && rg -q -- '--artifacts opsx-delta --json' openspec/docs/workflow-state-machine.md`
  - Expect: 对完整 formal bundle 执行 dry-run merge 与 Registry validation

- [x] C33 校验 formal OPSX 不存在时优雅跳过
  - Verifies: `specs/opsx-propose-skill/spec.md` / Requirement "OPSX validation aligns with downstream sync/archive semantics" / Scenario "Formal OPSX 不存在时优雅跳过"
  - Command: `pnpm exec vitest run test/core/templates/propose-template.test.ts`
  - Expect: 返回可诊断 skipped result，不读取 code-map

### Task 13: Windows CI 与跨平台测试

**Goal**: 确保 Schema path 与 template resolution 在 Windows、macOS 与 Linux 正确工作。

**Files**:
- Modify: `.github/workflows/opsx-v2-cross-platform.yml`
- Test: `test/core/artifact-graph/resolver.test.ts`

**Requirements**:
- CI matrix 包含 Windows runner
- Path resolution 测试覆盖 Windows 与 Unix
- 内置 Schema 诊断不依赖路径分隔符或大小写

#### Checks

- [x] C34 校验 Windows CI 运行
  - Verifies: `specs/cli-artifact-workflow/spec.md` / Requirement "Built-in Schema selection" / Scenario "跨平台内置路径解析"
  - Command: `grep -q "windows-latest" .github/workflows/opsx-v2-cross-platform.yml`
  - Expect: CI 包含 Windows runner

- [x] C35 校验跨平台路径测试
  - Verifies: `specs/cli-artifact-workflow/spec.md` / Requirement "Built-in Schema selection" / Scenario "跨平台内置路径解析"
  - Command: `pnpm exec vitest run test/core/artifact-graph/resolver.test.ts`
  - Expect: 路径测试使用 Node.js path APIs，不依赖硬编码分隔符

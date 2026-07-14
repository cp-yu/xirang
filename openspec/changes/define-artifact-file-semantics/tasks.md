### Task 1: Schema 模型扩展与 FileDefinition

**Goal**: 为内置 Schema 增加结构化 `FileDefinition` Zod 类型，并在 `spec-driven` 与 `bootstrap` Schema YAML 中为全部受管文件物化定义。

**Files**:
- Modify: `src/core/schema/types.ts`
- Modify: `schemas/spec-driven/schema.yaml`
- Modify: `schemas/bootstrap/schema.yaml`
- Test: `tests/core/schema/schema-parser.test.ts`

**Requirements**:
- `FileDefinition` 包含必填 `purpose`、`compilationRole`、`content.includes`、`content.excludes`、`writePolicy` 与 `validation`
- Spec-driven artifacts 每个声明 definition；bootstrap 使用顶层 files registry 与 phase artifact file ID 引用
- Parser 校验 definition 完整性、file ID 唯一性与 artifact 引用有效性

#### Checks

- [ ] C1 校验 Schema parser 接受完整 definition
  - Verifies: `specs/artifact-file-definitions/spec.md` / Requirement "结构化文件定义" / Scenario "内置 artifact definition 可解析"
  - Command: `pnpm test -- schema-parser.test.ts`
  - Expect: definition Zod validation 通过

- [ ] C2 校验 definition 缺失字段被拒绝
  - Verifies: `specs/artifact-file-definitions/spec.md` / Requirement "结构化文件定义" / Scenario "不完整 definition 被拒绝"
  - Command: `pnpm test -- schema-parser.test.ts`
  - Expect: 空 includes/excludes/validation、未知 writePolicy 或缺失必填字段失败

- [ ] C3 校验 bootstrap file ID 引用可验证
  - Verifies: `specs/artifact-file-definitions/spec.md` / Requirement "Bootstrap phase 文件定义投影" / Scenario "Bootstrap file 引用可验证"
  - Command: `pnpm test -- schema-parser.test.ts`
  - Expect: 重复或不存在 file ID 导致 Schema validation 失败

### Task 2: Artifact instructions 投影 definition

**Goal**: 让 `openspec instructions <artifact>` 返回 resolved definition，并在文本输出中优先展示。

**Files**:
- Modify: `src/core/artifact-graph/instruction-loader.ts`
- Modify: `src/cli/commands/instructions.ts`
- Test: `tests/core/artifact-graph/instruction-loader.test.ts`
- Test: `tests/cli/commands/instructions.test.ts`

**Requirements**:
- `ArtifactInstructions` 接口增加 `definition` 字段
- JSON 输出包含 definition，文本输出在 instruction/template 前展示
- Blocked artifact 仍返回 definition

#### Checks

- [ ] C4 校验 instructions JSON 包含 definition
  - Verifies: `specs/artifact-file-definitions/spec.md` / Requirement "Agent definition-first authoring" / Scenario "Instructions JSON 返回 definition"
  - Command: `pnpm test -- instruction-loader.test.ts`
  - Expect: JSON 同时包含 definition、instruction、template、dependencies 与 configProjection

- [ ] C5 校验文本输出优先展示 definition
  - Verifies: `specs/artifact-file-definitions/spec.md` / Requirement "Agent definition-first authoring" / Scenario "文本输出优先展示 definition"
  - Command: `pnpm test -- instructions.test.ts`
  - Expect: `<definition>` 位于 `<instruction>` 与 `<template>` 之前

- [ ] C6 校验 artifact definition projection
  - Verifies: `specs/cli-artifact-workflow/spec.md` / Requirement "Artifact definition projection" / Scenario "Instructions JSON 包含 definition"
  - Command: `pnpm test -- instructions.test.ts`
  - Expect: definition 与当前内置 Schema artifact definition 一致

### Task 3: Bootstrap phase definitions 投影

**Goal**: `openspec bootstrap instructions <phase>` 按 phase 投影相关 file definitions。

**Files**:
- Modify: `src/core/bootstrap/bootstrap-instructions.ts`
- Test: `tests/core/bootstrap/bootstrap-instructions.test.ts`

**Requirements**:
- Phase instructions JSON 包含 `fileDefinitions`，仅限该 phase 读取、编写或审查的文件
- Init 与 scan、map、review、promote 各自投影对应文件集合

#### Checks

- [ ] C7 校验 phase 只返回相关文件
  - Verifies: `specs/artifact-file-definitions/spec.md` / Requirement "Bootstrap phase 文件定义投影" / Scenario "Phase 只返回相关文件"
  - Command: `pnpm test -- bootstrap-instructions.test.ts`
  - Expect: scan/map/review/promote 的 fileDefinitions 仅包含该 phase 相关文件

- [ ] C8 校验 Bootstrap phase file definitions
  - Verifies: `specs/bootstrap/spec.md` / Requirement "Bootstrap phase file definitions" / Scenario "Init 与 scan definitions"
  - Command: `pnpm test -- bootstrap-instructions.test.ts`
  - Expect: init 描述 `.bootstrap.yaml` 与 `scope.yaml`，scan 额外描述 `evidence.yaml`

### Task 4: 删除 project-local/user Schema resolution

**Goal**: 限制 Schema resolution 为固定内置 `spec-driven` 与 `bootstrap`，删除 project/user lookup 与 shadowing。

**Files**:
- Modify: `src/core/schema/schema-resolver.ts`
- Delete: `src/core/schema/project-schemas-directory.ts`
- Modify: `src/cli/commands/schema/which.ts`
- Modify: `tests/core/schema/schema-resolver.test.ts`
- Test: `tests/cli/commands/schema/which.test.ts`

**Requirements**:
- `resolveSchema()` 仅返回 package 内置 Schema，project 与 user directory 不参与
- `which` 报告 package location 与 `source: package`
- 未知 Schema ID fail fast 并列出合法 ID

#### Checks

- [ ] C9 校验内置 Schema 解析
  - Verifies: `specs/schema-resolution/spec.md` / Requirement "Built-in Schema resolution" / Scenario "内置 Schema 解析"
  - Command: `pnpm test -- schema-resolver.test.ts`
  - Expect: 解析 spec-driven/bootstrap 返回 package directory

- [ ] C10 校验 project 与 user override 被忽略
  - Verifies: `specs/schema-resolution/spec.md` / Requirement "Built-in Schema resolution" / Scenario "Project 与 user override 被忽略"
  - Command: `pnpm test -- schema-resolver.test.ts`
  - Expect: 存在同名 project/user Schema 时结果只包含 package 内置

- [ ] C11 校验未知 Schema 明确失败
  - Verifies: `specs/schema-resolution/spec.md` / Requirement "Built-in Schema resolution" / Scenario "未知 Schema 明确失败"
  - Command: `pnpm test -- schema-resolver.test.ts`
  - Expect: 报告不存在并列出 spec-driven 与 bootstrap

- [ ] C12 校验 which 报告内置 Schema
  - Verifies: `specs/schema-which-command/spec.md` / Requirement "Built-in Schema inspection" / Scenario "查询内置 Schema"
  - Command: `pnpm test -- which.test.ts`
  - Expect: 显示 package source 与完整 directory path

- [ ] C13 校验 project-schemas-directory helper 已删除
  - Verifies: `specs/schema-resolution/spec.md` / REMOVED Requirement "Project schemas directory helper"
  - Command: `! grep -r "projectSchemasDirectory" src/`
  - Expect: 无残留引用

### Task 5: 删除 schema init 与 schema fork 命令

**Goal**: 删除 `schema init` 与 `schema fork` CLI 命令及其测试。

**Files**:
- Delete: `src/cli/commands/schema/init.ts`
- Delete: `src/cli/commands/schema/fork.ts`
- Modify: `src/cli/commands/schema/index.ts`
- Delete: `tests/cli/commands/schema/init.test.ts`
- Delete: `tests/cli/commands/schema/fork.test.ts`

**Requirements**:
- Schema 子命令仅保留 `which` 与 `validate`
- 无 init/fork 残留导入或路由

#### Checks

- [ ] C14 校验 schema init 命令已删除
  - Verifies: `specs/schema-init-command/spec.md` / REMOVED Requirement "Schema init command creates project-local schema"
  - Command: `! pnpm exec openspec schema init 2>&1 | grep -q "init"`
  - Expect: 命令不存在或未注册

- [ ] C15 校验 schema fork 命令已删除
  - Verifies: `specs/schema-fork-command/spec.md` / REMOVED Requirement "Schema fork copies existing schema"
  - Command: `! pnpm exec openspec schema fork 2>&1 | grep -q "fork"`
  - Expect: 命令不存在或未注册

### Task 6: Schema validation 收敛为内置检查

**Goal**: `schema validate` 仅校验内置 `spec-driven` 与 `bootstrap`，增加 file definition 与 template checks。

**Files**:
- Modify: `src/cli/commands/schema/validate.ts`
- Modify: `tests/cli/commands/schema/validate.test.ts`

**Requirements**:
- Validate 一个或全部内置 Schema
- Checks 包含 YAML、Zod、file definitions、template existence、dependency DAG 与 bootstrap file references
- 未知 Schema 非零退出并列出合法 ID

#### Checks

- [ ] C16 校验单个内置 Schema
  - Verifies: `specs/schema-validate-command/spec.md` / Requirement "Built-in Schema validation" / Scenario "校验一个内置 Schema"
  - Command: `pnpm test -- validate.test.ts`
  - Expect: JSON 输出 valid、name、path 与 issues

- [ ] C17 校验全部内置 Schema
  - Verifies: `specs/schema-validate-command/spec.md` / Requirement "Built-in Schema validation" / Scenario "校验全部内置 Schema"
  - Command: `pnpm test -- validate.test.ts`
  - Expect: 不带 name 时校验 spec-driven 与 bootstrap

- [ ] C18 校验未知 Schema 被拒绝
  - Verifies: `specs/schema-validate-command/spec.md` / Requirement "Built-in Schema validation" / Scenario "未知 Schema 被拒绝"
  - Command: `pnpm test -- validate.test.ts`
  - Expect: 非零退出并列出合法内置 ID

### Task 7: Authoring help 消费 Schema file definitions

**Goal**: `openspec help authoring` 从内置 Schema definitions 构建文件级 help，relation files 组合 Registry projection。

**Files**:
- Modify: `src/cli/commands/help/authoring.ts`
- Modify: `tests/cli/commands/help/authoring.test.ts`

**Requirements**:
- OPSX、delta、change artifact help 使用对应 Schema file definition
- Canonical topic 通过显式 lookup，不使用路径模式
- Relation details 保持 Registry 单一来源

#### Checks

- [ ] C19 校验 OPSX help 与 Schema definition 一致
  - Verifies: `specs/cli-authoring-help/spec.md` / Requirement "Schema-backed file definition help" / Scenario "OPSX help 与 Schema definition 一致"
  - Command: `pnpm test -- authoring.test.ts`
  - Expect: `project.opsx.yaml`、`project.opsx.relations.yaml` 与 `opsx-delta.yaml` definition 与 Schema 一致

- [ ] C20 校验 relation details 保持 Registry 来源
  - Verifies: `specs/cli-authoring-help/spec.md` / Requirement "Schema-backed file definition help" / Scenario "Relation details 保持 Registry 单一来源"
  - Command: `pnpm test -- authoring.test.ts`
  - Expect: relations 包含全部 Registry-derived fields

- [ ] C21 校验 canonical topic 使用显式 lookup
  - Verifies: `specs/cli-authoring-help/spec.md` / Requirement "Schema-backed file definition help" / Scenario "Canonical topic 使用显式 lookup"
  - Command: `pnpm test -- authoring.test.ts`
  - Expect: 不使用路径模式、大小写或正则猜测 file kind

### Task 8: 内置 Schema binding 限制

**Goal**: Config、change metadata 与 CLI 保留 Schema binding，但合法值限于 `spec-driven` 与 `bootstrap`。

**Files**:
- Modify: `src/core/config/project-config.ts`
- Modify: `src/core/change/change-metadata.ts`
- Modify: `src/cli/commands/new.ts`
- Test: `tests/core/config/project-config.test.ts`
- Test: `tests/core/change/change-metadata.test.ts`

**Requirements**:
- Resolution precedence 保持 CLI option → change metadata → project config → default
- 非内置 binding fail fast，不静默回退或改写文件

#### Checks

- [ ] C22 校验 change 持久化内置 binding
  - Verifies: `specs/schema-resolution/spec.md` / Requirement "Built-in Schema binding" / Scenario "Change 持久化内置 binding"
  - Command: `pnpm test -- change-metadata.test.ts`
  - Expect: `.openspec.yaml` 持久化 Schema ID

- [ ] C23 校验非内置 binding 不静默迁移
  - Verifies: `specs/schema-resolution/spec.md` / Requirement "Built-in Schema binding" / Scenario "非内置 binding 不静默迁移"
  - Command: `pnpm test -- project-config.test.ts`
  - Expect: 引用非内置 Schema fail fast 并提供 remediation

### Task 9: Workflow templates 使用 definition-first authoring

**Goal**: 更新 propose、explore、apply、archive、bootstrap、snack 模板，指示 Agent 先消费 definition。

**Files**:
- Modify: `src/core/templates/skills/propose.ts`
- Modify: `src/core/templates/skills/explore.ts`
- Modify: `src/core/templates/skills/apply.ts`
- Modify: `src/core/templates/skills/archive.ts`
- Modify: `src/core/templates/skills/bootstrap.ts`
- Modify: `src/core/templates/skills/snack.ts`
- Test: `tests/core/templates/skills/workflow-templates.test.ts`

**Requirements**:
- Templates 包含 definition-first 消费纪律
- Templates 不内联具体 definition prose
- Propose 在生成 artifact 前读取 instructions definition

#### Checks

- [ ] C24 校验 propose 使用 artifact instructions definition
  - Verifies: `specs/ai-workflow-templates/spec.md` / Requirement "Agent definition-first authoring" / Scenario "Propose 使用 artifact instructions definition"
  - Command: `pnpm test -- workflow-templates.test.ts`
  - Expect: propose 模板指示读取 `openspec instructions <artifact> --json` 的 definition

- [ ] C25 校验 bootstrap 使用 phase definitions
  - Verifies: `specs/ai-workflow-templates/spec.md` / Requirement "Agent definition-first authoring" / Scenario "Bootstrap 使用 phase definitions"
  - Command: `pnpm test -- workflow-templates.test.ts`
  - Expect: bootstrap 模板指示读取 `openspec bootstrap instructions <phase> --json` 的 fileDefinitions

- [ ] C26 校验 workflow 不复制 definitions
  - Verifies: `specs/ai-workflow-templates/spec.md` / Requirement "Agent definition-first authoring" / Scenario "Workflow 不复制 definitions"
  - Command: `pnpm test -- workflow-templates.test.ts`
  - Expect: 模板仅包含 definition-first 纪律，不内联完整 definition

### Task 10: 编译哲学片段更新

**Goal**: 更新 `OPSX_COMPILATION_PHILOSOPHY` 片段，区分 durable source、compilation scaffolding 与 change reconciliation。

**Files**:
- Modify: `src/core/templates/fragments/opsx-fragments.ts`
- Test: `tests/core/templates/fragments/opsx-fragments.test.ts`

**Requirements**:
- Specs + OPSX 为 durable semantic source
- Proposal/design/tasks 为 compilation scaffolding
- Change-local specs 与 opsx-delta 为 target-state delta
- 片段包含完整编译映射与行为规则

#### Checks

- [ ] C27 校验片段区分 source 与 scaffolding
  - Verifies: `specs/compilation-philosophy-fragment/spec.md` / Requirement "编译哲学片段定义" / Scenario "片段区分 source 与 scaffolding"
  - Command: `pnpm test -- opsx-fragments.test.ts`
  - Expect: 声明 Specs + OPSX 为 durable source 与 proposal/design/tasks 为 scaffolding

- [ ] C28 校验片段包含完整编译映射
  - Verifies: `specs/compilation-philosophy-fragment/spec.md` / Requirement "编译哲学片段定义" / Scenario "片段包含完整编译映射"
  - Command: `pnpm test -- opsx-fragments.test.ts`
  - Expect: 包含 compiler、static analysis、semantic-check pass、optimization pass、linking/release 概念

- [ ] C29 校验片段包含 source completeness 纪律
  - Verifies: `specs/compilation-philosophy-fragment/spec.md` / Requirement "编译哲学片段定义" / Scenario "片段包含 source completeness 纪律"
  - Command: `pnpm test -- opsx-fragments.test.ts`
  - Expect: 禁止 Agent 静默猜测关键 decision

### Task 11: Snack 与 apply 删除 code-map 依赖

**Goal**: Snack 与 apply recovery 不读取或要求 `project.opsx.code-map.yaml`。

**Files**:
- Modify: `src/core/templates/skills/snack.ts`
- Modify: `src/core/templates/skills/apply.ts`
- Test: `tests/core/templates/skills/snack.test.ts`
- Test: `tests/core/templates/skills/apply.test.ts`

**Requirements**:
- Snack 使用 capability id/intent、spec coverage、CodeGraph 或 ACE/rg/read
- Apply recovery 使用 OPSX v2 semantic navigation 与 CLI query
- 不读取 code-map 或从 OPSX 读取 code paths

#### Checks

- [ ] C30 校验 snack Code-map 反查不读取 code-map
  - Verifies: `specs/snack-skill/spec.md` / Requirement "Code-map 反查" / Scenario "无 CodeGraph 时回退"
  - Command: `pnpm test -- snack.test.ts`
  - Expect: 不读取 `project.opsx.code-map.yaml`

- [ ] C31 校验 apply 任务执行失败处理不读取 code-map
  - Verifies: `specs/apply-task-decomposition/spec.md` / Requirement "任务执行失败处理" / Scenario "任务需求不明确"
  - Command: `pnpm test -- apply.test.ts`
  - Expect: 使用 OPSX query 与 CodeGraph/ACE/rg/read，不读取 code-map

### Task 12: OPSX propose validation 不读取 code-map

**Goal**: Post-propose OPSX delta validation 通过 artifact-scoped CLI 执行，不读取或生成 code-map。

**Files**:
- Modify: `src/core/templates/skills/propose.ts`
- Test: `tests/core/templates/skills/propose.test.ts`

**Requirements**:
- OPSX validation 使用 `openspec validate --change "<name>" --artifacts opsx-delta --json`
- Validator 执行 dry-run merge、referential integrity 与 Registry semantic validation
- 不调用 code-map validation

#### Checks

- [ ] C32 校验 OPSX delta against formal bundle
  - Verifies: `specs/opsx-propose-skill/spec.md` / Requirement "OPSX validation aligns with downstream sync/archive semantics" / Scenario "OPSX delta against current formal bundle"
  - Command: `pnpm test -- propose.test.ts`
  - Expect: 对完整 formal bundle 执行 dry-run merge 与 Registry validation

- [ ] C33 校验 formal OPSX 不存在时优雅跳过
  - Verifies: `specs/opsx-propose-skill/spec.md` / Requirement "OPSX validation aligns with downstream sync/archive semantics" / Scenario "Formal OPSX 不存在时优雅跳过"
  - Command: `pnpm test -- propose.test.ts`
  - Expect: 返回可诊断 skipped result，不读取 code-map

### Task 13: Windows CI 与跨平台测试

**Goal**: 确保 Schema path 与 template resolution 在 Windows、macOS 与 Linux 正确工作。

**Files**:
- Modify: `.github/workflows/test.yml`
- Test: `tests/core/schema/schema-resolver.test.ts`

**Requirements**:
- CI matrix 包含 Windows runner
- Path resolution 测试覆盖 Windows 与 Unix
- 内置 Schema 诊断不依赖路径分隔符或大小写

#### Checks

- [ ] C34 校验 Windows CI 运行
  - Verifies: `specs/cli-artifact-workflow/spec.md` / Requirement "Built-in Schema selection" / Scenario "跨平台内置路径解析"
  - Command: `grep -q "windows-latest" .github/workflows/test.yml`
  - Expect: CI 包含 Windows runner

- [ ] C35 校验跨平台路径测试
  - Verifies: `specs/cli-artifact-workflow/spec.md` / Requirement "Built-in Schema selection" / Scenario "跨平台内置路径解析"
  - Command: `pnpm test -- schema-resolver.test.ts`
  - Expect: 路径测试使用 Node.js path APIs，不依赖硬编码分隔符

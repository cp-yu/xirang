---
entity: element-declaration
identity: artifact-workflow-commands
kind: element
parent: deterministic-operations
title: Artifact Workflow Commands
definition: Artifact Workflow Commands 定义 artifact workflow CLI 行为：`status`、`instructions`、`templates` 与 `new change` 命令面，面向 scaffolded 与 active changes，包括 artifact 完成状态展示、enriched instructions、模板路径解析、schema apply block 与 apply instructions 生成。
---

## Requirements

### Requirement: Status Command

系统 SHALL 展示一个 change 的 artifact 完成状态，包括 scaffolded（空）changes。

#### Scenario: Show status with all states

- **WHEN** 用户运行 `xirang status --change <id>`
- **THEN** 系统展示每个 artifact 的状态指示：`[x]` 已完成、`[ ]` ready、`[-]` blocked（列出缺失依赖）

#### Scenario: Status JSON output

- **WHEN** 用户运行 `xirang status --change <id> --json`
- **THEN** 系统输出包含 changeName、schemaName、isComplete 与 artifacts array 的 JSON

#### Scenario: Status on scaffolded change

- **WHEN** 用户对没有 artifacts 的 change 运行 `xirang status --change <id>`
- **THEN** 系统展示全部 artifacts 的状态，根 artifacts（无依赖）显示 ready `[ ]`，依赖 artifacts 显示 blocked `[-]`
#### Scenario: Status shows completion summary
- **WHEN** 用户运行 `xirang status --change <id>`
- **THEN** 输出包含完成百分比与计数（如 "2/4 artifacts complete"）
#### Scenario: Status JSON includes apply requirements
- **WHEN** 用户运行 `xirang status --change <id> --json`
- **THEN** 系统输出包含 `changeName`、`schemaName`、`isComplete`、`artifacts` 与 `applyRequires` 的 JSON
#### Scenario: Missing change parameter
- **WHEN** user runs `xirang status` without `--change`
- **THEN** the system displays an error with list of available changes
- **AND** includes scaffolded changes (directories without proposal.md)
#### Scenario: Unknown change
- **WHEN** user runs `xirang status --change unknown-id`
- **AND** directory `.xirang/changes/unknown-id/` does not exist
- **THEN** the system displays an error listing all available change directories
### Requirement: Instructions Command

系统 SHALL 输出创建 artifact 的 enriched instructions，包括 scaffolded changes。对于 spec-driven `tasks` artifact，生成的 instructions SHALL 要求 `tasks.md` 将实现目标与可执行验证 Checks 分离，并要求每个 Check 声明其验证锚点（`Verifies:` 或 `Preserves:`）。

#### Scenario: Show enriched instructions

- **WHEN** 用户运行 `xirang instructions <artifact> --change <id>`
- **THEN** 系统输出 artifact metadata、template content、dependency status 与 unlocked artifacts

#### Scenario: Instructions JSON output

- **WHEN** 用户运行 `xirang instructions <artifact> --change <id> --json`
- **THEN** 系统输出匹配 ArtifactInstructions interface 的 JSON

#### Scenario: Tasks instructions require coarse Tasks and Checks sections

- **WHEN** 用户运行 `xirang instructions tasks --change <id> --json`
- **THEN** 返回的 instruction SHALL 告诉 agent 用粗粒度 `### Task N:` sections 编写 `tasks.md`
- **AND** 每个 task 包含 `Goal`、`Files`、`Requirements` 与嵌套 `Checks`
- **AND** 每个 Check 是带 `C` 前缀的可执行验证项

#### Scenario: Tasks instructions require Verifies fields

- **WHEN** 用户运行 `xirang instructions tasks --change <id> --json`
- **THEN** instruction SHALL 要求每个 Check 必须包含 `Verifies:` 或 `Preserves:` 字段
- **AND** 普通 `Verifies:` 锚定一个完整 Requirement 名与一个或多个完整 Scenario 名
- **AND** `Verifies:` SHALL NOT 使用 formal 路径、绝对路径或反斜杠分隔路径

#### Scenario: Tasks instructions convert vague work into testable goals

- **WHEN** 用户运行 `xirang instructions tasks --change <id> --json`
- **THEN** instruction SHALL 要求将 validation work 转为 invalid-input 行为 check、将 bug fixes 转为复现回归修复的 check、将 refactors 转为由 `Preserves:` 锚定的行为等价 check、将删除工作转为由 REMOVED 锚定的缺失断言 check
- **AND** 每个 task 至少包含一个 Check

#### Scenario: Apply instructions require strict TDD for behavior Checks

- **WHEN** 用户运行 `xirang instructions apply --change <id> --json`
- **THEN** instruction SHALL 要求行为与代码 Checks 通过严格 TDD 执行
- **AND** 要求实现前先新增或更新 targeted test 并确认预期失败
- **AND** 要求最小实现后重跑同一命令并确认通过后再标记进度
#### Scenario: REMOVED 锚定的结构校验
- **WHEN** `tasks.md` 中某 Check 的 `Verifies:` 使用 `REMOVED Requirement "<name>"` 形式
- **THEN** 结构校验 SHALL 接受该 Check 不含 Scenario 名
- **AND** SHALL 交叉校验该 requirement 名存在于所指 change-local delta 的 REMOVED section
- **AND** 普通 `Verifies:` 缺少 Scenario 名时 SHALL 仍按现有规则报告校验错误
#### Scenario: Tasks instructions allow non-runtime text fast path
- **WHEN** 用户运行 `xirang instructions tasks --change <id> --json`
- **THEN** instruction SHALL 说明非运行时文本或制品变化不需要人为失败测试
- **AND** SHALL 仍要求至少一个带非空 `Verifies:` 的轻量 Check
- **AND** SHALL 说明 config/schema/template 变化默认按行为 Check 处理除非证明无 consumer
#### Scenario: Unknown artifact
- **WHEN** user runs `xirang instructions unknown-artifact --change <id>`
- **THEN** the system displays an error listing valid artifact IDs for the schema
#### Scenario: Checks are executable verification items
- **WHEN** user runs `xirang instructions tasks --change <id> --json`
- **THEN** the returned `instruction` SHALL tell the agent that each Check is executable verification work, not explanatory prose
- **AND** each Check SHALL include a command, evidence source, or observable expectation sufficient for an agent to run or inspect it
- **AND** each Check SHALL anchor that verification to a `Verifies:` or `Preserves:` target before implementation starts
#### Scenario: Artifact with unmet dependencies
- **WHEN** user requests instructions for a blocked artifact
- **THEN** the system displays instructions with a warning about missing dependencies
#### Scenario: Instructions on scaffolded change
- **WHEN** user runs `xirang instructions proposal --change <id>` on a scaffolded change
- **THEN** system outputs template and metadata for creating the proposal
- **AND** does not require any artifacts to already exist
#### Scenario: Verifies path remains change-local and cross-platform
- **WHEN** 一个 `Verifies:` 字段命名一个 change-local Element Contract 单元路径（`elements/<identity>.md`）
- **THEN** 该路径 SHALL 从 change directory 以相对 POSIX 路径书写
- **AND** 该路径 SHALL 携带完整 Requirement 名称与一个或多个 exact canonical Scenario 名称锚点
- **AND** the implementation SHALL resolve the path using Node path APIs such as `path.join(changeDir, verifiesPath)`
- **AND** tests SHALL cover rejection of `.xirang/contracts/...`, absolute paths, parent traversal, and backslash-separated paths
#### Scenario: Preserves 字段锚定 formal Element Contract 且跨平台解析
- **WHEN** `tasks.md` 中某 Check 包含 `Preserves:` 字段
- **THEN** 该字段 SHALL 使用 `.xirang/model/elements/<identity>.md` 形式的项目根相对 POSIX 路径
- **AND** SHALL identify one full `Requirement` name and one or more full `Scenario` names
- **AND** the implementation SHALL resolve the path using Node path APIs such as `path.join(projectRoot, preservesPath)`
- **AND** 校验 SHALL 拒绝 change-local 路径、绝对路径、父目录穿越和反斜杠分隔路径
- **AND** `Preserves:` 的formal Element Contract 路径许可 SHALL NOT 放宽到 `Verifies:` 字段
#### Scenario: Files 支持 Delete 声明
- **WHEN** user runs `xirang instructions tasks --change <id> --json`
- **THEN** the returned `instruction` 列出的 Files 标签 SHALL 包含 `Delete:`，与 `Create:`、`Modify:`、`Test:` 并列
- **AND** SHALL 说明文件级删除（含移动、合并产生的删除）使用 `Delete:` 声明
- **AND** SHALL 说明生成面改动（如 skill 再生成目录）在 Files 中以目录粒度声明
### Requirement: Templates Command
系统 SHALL 展示 schema 中所有 artifact 的 resolved template paths。

#### Scenario: List template paths with default schema
- **WHEN** 用户运行 `xirang templates`
- **THEN** 系统用默认 schema 展示每个 artifact 的 resolved template path

#### Scenario: Templates JSON output
- **WHEN** 用户运行 `xirang templates --json`
- **THEN** 系统输出 artifact IDs 到 template paths 的 JSON mapping
#### Scenario: 非 spec-driven schema 被拒绝
- **WHEN** user runs `xirang templates --schema tdd`
- **THEN** the system rejects the schema：`Schema 'tdd' not found. Available schemas: spec-driven`
- **AND** 不以任何非内置 ID 显示模板路径
#### Scenario: Template resolution source
- **WHEN** displaying template paths
- **THEN** the system SHALL 报告 package-only source（`spec-driven`）
- **AND** 不存在 user override source
### Requirement: New Change Command
系统 SHALL 创建新的 change 目录并进行校验。

#### Scenario: Create valid change
- **WHEN** 用户运行 `xirang new change add-feature`
- **THEN** 系统创建 `.xirang/changes/add-feature/` 目录

#### Scenario: Invalid change name
- **WHEN** 用户运行 `xirang new change "Add Feature"` 使用非法名称
- **THEN** 系统显示校验错误与指引
#### Scenario: Duplicate change name
- **WHEN** user runs `xirang new change existing-change` for an existing change
- **THEN** the system displays an error indicating the change already exists
#### Scenario: Create with description
- **WHEN** user runs `xirang new change add-feature --description "Add new feature"`
- **THEN** the system creates the change directory with description in README.md
### Requirement: Schema Apply Block

系统 SHALL 支持 schema definitions 中的 `apply` block，控制实现何时开始与如何开始。

#### Scenario: Schema with apply block

- **WHEN** schema 定义 `apply` block
- **THEN** 系统使用 `apply.requires` 确定 apply 前必须存在的 artifacts
- **AND** 使用 `apply.tracks` 标识进度跟踪文件
- **AND** 使用 `apply.instruction` 提供 agent 指引
#### Scenario: Schema without apply block
- **WHEN** a schema has no `apply` block
- **THEN** the system requires all artifacts to exist before apply is available
- **AND** uses default instruction: "All artifacts complete. Proceed with implementation."
### Requirement: Apply Instructions Command

系统 SHALL 通过 `xirang instructions apply` 生成 schema-aware apply instructions。

#### Scenario: Generate apply instructions

- **WHEN** 用户运行 `xirang instructions apply --change <id>`
- **AND** 所有 required artifacts 存在
- **THEN** 系统输出 `contextFiles`、schema-specific instruction text 与 progress tracking file path

#### Scenario: Apply blocked by missing artifacts

- **WHEN** 用户运行 `xirang instructions apply --change <id>`
- **AND** required artifacts 缺失
- **THEN** 系统指示 apply 被阻塞并列出必须先创建的 artifacts
- **AND** 指示返回 Formation workflow reconcile 缺失 prerequisite，而不是指示 apply workflow 创建自身缺失的输入
#### Scenario: Apply instructions JSON output
- **WHEN** 用户运行 `xirang instructions apply --change <id> --json`
- **THEN** 系统输出包含 `contextFiles`、`instruction`、`tracks` 与 `applyRequires` 的 JSON
#### Scenario: Spec-driven missing artifacts 返回 Propose
- **WHEN** spec-driven change 缺少 apply-required artifact、tracking file 不存在或 tracking file 无可执行 tasks
- **THEN** Apply state SHALL 为 blocked
- **AND** instruction SHALL 指示返回 Propose workflow reconcile 缺失 prerequisite
- **AND** MUST NOT 指示 `xirang-apply-change` 创建缺失 artifact
### Requirement: Next Artifact Discovery

The workflow SHALL 使用 `xirang status` 输出来确定下一步可创建的 artifact，而非单独的 next-command surface。

#### Scenario: Discover next artifacts from status output

- **WHEN** 用户需要知道下一步创建哪个 artifact
- **THEN** `xirang status --change <id>` 以 `[ ]` 标识 ready artifacts
- **AND** 不需要专用 "next command" 来继续 workflow

### Requirement: Output Formatting

系统 SHALL 提供一致的输出格式化。

#### Scenario: Color output
- **WHEN** 终端支持颜色
- **THEN** status indicators 使用颜色：green（done）、yellow（ready）、red（blocked）

#### Scenario: No color output
- **WHEN** 使用 `--no-color` flag 或设置 `NO_COLOR` 环境变量
- **THEN** 输出使用无 ANSI 颜色的纯文本 indicators

#### Scenario: Progress indication
- **WHEN** 加载 change state 耗时较长
- **THEN** 加载期间系统显示 spinner

### Requirement: Experimental Isolation

系统 SHALL 在隔离中实现 artifact workflow commands 以便移除，且 help 文本标记其 experimental 状态。

#### Scenario: Help text marking
- **WHEN** 用户在任何 artifact workflow command 上运行 `--help`
- **THEN** help 文本指示该命令是 experimental
#### Scenario: Single file implementation
- **WHEN** artifact workflow feature is implemented
- **THEN** all commands are in `src/commands/artifact-workflow.ts`

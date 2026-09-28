---
entity: element-declaration
identity: artifact-workflow-commands
kind: element
parent: deterministic-operations
title: Artifact Workflow Commands
definition: Artifact Workflow Commands 定义 artifact workflow CLI 行为：`status`、`instructions`、`templates` 与 `new change` 命令面，面向 scaffolded 与 active changes，包括 artifact 完成状态展示、enriched instructions、模板路径解析、schema apply block 与 apply instructions 生成。
---

## Specification

### Section: Status Command

系统 SHALL 展示一个 change 的 artifact 完成状态，包括 scaffolded（空）changes。

- **Show status with all states**

  - 用户运行 `xirang status --change <id>`
  - 系统展示每个 artifact 的状态指示：`[x]` 已完成、`[ ]` ready、`[-]` blocked（列出缺失依赖）

- **Status JSON output**

  - 用户运行 `xirang status --change <id> --json`
  - 系统输出包含 changeName、schemaName、isComplete 与 artifacts array 的 JSON

- **Status on scaffolded change**

  - 用户对没有 artifacts 的 change 运行 `xirang status --change <id>`
  - 系统展示全部 artifacts 的状态，根 artifacts（无依赖）显示 ready `[ ]`，依赖 artifacts 显示 blocked `[-]`

- **Status shows completion summary**
  - 用户运行 `xirang status --change <id>`
  - 输出包含完成百分比与计数（如 "2/4 artifacts complete"）

- **Status JSON includes apply requirements**
  - 用户运行 `xirang status --change <id> --json`
  - 系统输出包含 `changeName`、`schemaName`、`isComplete`、`artifacts` 与 `applyRequires` 的 JSON

- **Missing change parameter**
  - user runs `xirang status` without `--change`
  - the system displays an error with list of available changes
  - includes scaffolded changes (directories without proposal.md)

- **Unknown change**
  - user runs `xirang status --change unknown-id`
  - directory `.xirang/changes/unknown-id/` does not exist
  - the system displays an error listing all available change directories
### Section: Instructions Command

系统 SHALL 输出创建 artifact 的 enriched instructions，包括 scaffolded changes。对于 semantic-model `tasks` artifact，生成的 instructions SHALL 要求 `tasks.md` 将实现目标与可执行验证 Checks 分离，并要求每个 Check 声明其验证锚点（`Verifies:` 或 `Preserves:`）。

- **Show enriched instructions**

  - 用户运行 `xirang instructions <artifact> --change <id>`
  - 系统输出 artifact metadata、template content、dependency status 与 unlocked artifacts

- **Instructions JSON output**

  - 用户运行 `xirang instructions <artifact> --change <id> --json`
  - 系统输出匹配 ArtifactInstructions interface 的 JSON

- **Tasks instructions require coarse Tasks and Checks sections**

  - 用户运行 `xirang instructions tasks --change <id> --json`
  - 返回的 instruction SHALL 告诉 agent 用粗粒度 `### Task N:` sections 编写 `tasks.md`
  - 每个 task 包含 `Goal`、`Files`、`Sections` 与嵌套 `Checks`
  - 每个 Check 是带 `C` 前缀的可执行验证项

- **Tasks instructions require Verifies fields**

  - 用户运行 `xirang instructions tasks --change <id> --json`
  - instruction SHALL 要求每个 Check 必须包含 `Verifies:` 或 `Preserves:` 字段
  - 普通 `Verifies:` 锚定一个完整 Section 名与一个或多个完整 Acceptance Case 名
  - `Verifies:` SHALL NOT 使用 formal 路径、绝对路径或反斜杠分隔路径

- **Tasks instructions convert vague work into testable goals**

  - 用户运行 `xirang instructions tasks --change <id> --json`
  - instruction SHALL 要求将 validation work 转为 invalid-input 行为 check、将 bug fixes 转为复现回归修复的 check、将 refactors 转为由 `Preserves:` 锚定的行为等价 check、将删除工作转为由 REMOVED 锚定的缺失断言 check
  - 每个 task 至少包含一个 Check

- **Apply instructions require strict TDD for behavior Checks**

  - 用户运行 `xirang instructions apply --change <id> --json`
  - instruction SHALL 要求行为与代码 Checks 通过严格 TDD 执行
  - 要求实现前先新增或更新 targeted test 并确认预期失败
  - 要求最小实现后重跑同一命令并确认通过后再标记进度

- **REMOVED 锚定的结构校验**
  - `tasks.md` 中某 Check 的 `Verifies:` 使用 `REMOVED Section "<name>"` 形式
  - 结构校验 SHALL 接受该 Check 不含 Acceptance Case 名
  - SHALL 交叉校验该 Section 名存在于所指 change-local delta 的 REMOVED section
  - 普通 `Verifies:` 缺少 Acceptance Case 名时 SHALL 仍按现有规则报告校验错误

- **Tasks instructions allow non-runtime text fast path**
  - 用户运行 `xirang instructions tasks --change <id> --json`
  - instruction SHALL 说明非运行时文本或制品变化不需要人为失败测试
  - SHALL 仍要求至少一个带非空 `Verifies:` 的轻量 Check
  - SHALL 说明 config/schema/template 变化默认按行为 Check 处理除非证明无 consumer

- **Unknown artifact**
  - user runs `xirang instructions unknown-artifact --change <id>`
  - the system displays an error listing valid artifact IDs for the schema

- **Checks are executable verification items**
  - user runs `xirang instructions tasks --change <id> --json`
  - the returned `instruction` SHALL tell the agent that each Check is executable verification work, not explanatory prose
  - each Check SHALL include a command, evidence source, or observable expectation sufficient for an agent to run or inspect it
  - each Check SHALL anchor that verification to a `Verifies:` or `Preserves:` target before implementation starts

- **Artifact with unmet dependencies**
  - user requests instructions for a blocked artifact
  - the system displays instructions with a warning about missing dependencies

- **Instructions on scaffolded change**
  - user runs `xirang instructions proposal --change <id>` on a scaffolded change
  - system outputs template and metadata for creating the proposal
  - does not require any artifacts to already exist

- **Verifies path remains change-local and cross-platform**
  - 一个 `Verifies:` 字段命名一个 change-local Element Contract 单元路径（`elements/<identity>.md`）
  - 该路径 SHALL 从 change directory 以相对 POSIX 路径书写
  - 该路径 SHALL 携带完整 Section 名称与一个或多个 exact Acceptance Case 名称锚点
  - the implementation SHALL resolve the path using Node path APIs such as `path.join(changeDir, verifiesPath)`
  - tests SHALL cover rejection of `.xirang/contracts/...`, absolute paths, parent traversal, and backslash-separated paths

- **Preserves 字段锚定 formal Element Contract 且跨平台解析**
  - `tasks.md` 中某 Check 包含 `Preserves:` 字段
  - 该字段 SHALL 使用 `.xirang/model/elements/<identity>.md` 形式的项目根相对 POSIX 路径
  - SHALL identify one full `Section` name and one or more full `Acceptance Case` names
  - the implementation SHALL resolve the path using Node path APIs such as `path.join(projectRoot, preservesPath)`
  - 校验 SHALL 拒绝 change-local 路径、绝对路径、父目录穿越和反斜杠分隔路径
  - `Preserves:` 的formal Element Contract 路径许可 SHALL NOT 放宽到 `Verifies:` 字段

- **Files 支持 Delete 声明**
  - user runs `xirang instructions tasks --change <id> --json`
  - the returned `instruction` 列出的 Files 标签 SHALL 包含 `Delete:`，与 `Create:`、`Modify:`、`Test:` 并列
  - SHALL 说明文件级删除（含移动、合并产生的删除）使用 `Delete:` 声明
  - SHALL 说明生成面改动（如 skill 再生成目录）在 Files 中以目录粒度声明
### Section: Templates Command
系统 SHALL 展示 schema 中所有 artifact 的 resolved template paths。

- **List template paths with default schema**
  - 用户运行 `xirang templates`
  - 系统用默认 schema 展示每个 artifact 的 resolved template path

- **Templates JSON output**
  - 用户运行 `xirang templates --json`
  - 系统输出 artifact IDs 到 template paths 的 JSON mapping

- **非 semantic-model schema 被拒绝**
  - user runs `xirang templates --schema tdd`
  - the system rejects the schema：`Schema 'tdd' not found. Available schemas: semantic-model`
  - 不以任何非内置 ID 显示模板路径

- **Template resolution source**
  - displaying template paths
  - the system SHALL 报告 package-only source（`semantic-model`）
  - 不存在 user override source
### Section: New Change Command
系统 SHALL 创建新的 change 目录并进行校验。

- **Create valid change**
  - 用户运行 `xirang new change add-feature`
  - 系统创建 `.xirang/changes/add-feature/` 目录

- **Invalid change name**
  - 用户运行 `xirang new change "Add Feature"` 使用非法名称
  - 系统显示校验错误与指引

- **Duplicate change name**
  - user runs `xirang new change existing-change` for an existing change
  - the system displays an error indicating the change already exists

- **Create with description**
  - user runs `xirang new change add-feature --description "Add new feature"`
  - the system creates the change directory with description in README.md
### Section: Schema Apply Block

系统 SHALL 支持 schema definitions 中的 `apply` block，控制实现何时开始与如何开始。

- **Schema with apply block**

  - schema 定义 `apply` block
  - 系统使用 `apply.requires` 确定 apply 前必须存在的 artifacts
  - 使用 `apply.tracks` 标识进度跟踪文件
  - 使用 `apply.instruction` 提供 agent 指引

- **Schema without apply block**
  - a schema has no `apply` block
  - the system requires all artifacts to exist before apply is available
  - uses default instruction: "All artifacts complete. Proceed with implementation."
### Section: Apply Instructions Command

系统 SHALL 通过 `xirang instructions apply` 生成 schema-aware apply instructions。

- **Generate apply instructions**

  - 用户运行 `xirang instructions apply --change <id>`
  - 所有 required artifacts 存在
  - 系统输出 `contextFiles`、schema-specific instruction text 与 progress tracking file path

- **Apply blocked by missing artifacts**

  - 用户运行 `xirang instructions apply --change <id>`
  - required artifacts 缺失
  - 系统指示 apply 被阻塞并列出必须先创建的 artifacts
  - 指示返回 Formation workflow reconcile 缺失 prerequisite，而不是指示 apply workflow 创建自身缺失的输入

- **Apply instructions JSON output**
  - 用户运行 `xirang instructions apply --change <id> --json`
  - 系统输出包含 `contextFiles`、`instruction`、`tracks` 与 `applyRequires` 的 JSON

- **Semantic-model missing artifacts 返回 Propose**
  - semantic-model change 缺少 apply-required artifact、tracking file 不存在或 tracking file 无可执行 tasks
  - Apply state SHALL 为 blocked
  - instruction SHALL 指示返回 Propose workflow reconcile 缺失 prerequisite
  - MUST NOT 指示 `xirang-apply-change` 创建缺失 artifact
### Section: Next Artifact Discovery

The workflow SHALL 使用 `xirang status` 输出来确定下一步可创建的 artifact，而非单独的 next-command surface。

- **Discover next artifacts from status output**

  - 用户需要知道下一步创建哪个 artifact
  - `xirang status --change <id>` 以 `[ ]` 标识 ready artifacts
  - 不需要专用 "next command" 来继续 workflow

### Section: Output Formatting

系统 SHALL 提供一致的输出格式化。

- **Color output**
  - 终端支持颜色
  - status indicators 使用颜色：green（done）、yellow（ready）、red（blocked）

- **No color output**
  - 使用 `--no-color` flag 或设置 `NO_COLOR` 环境变量
  - 输出使用无 ANSI 颜色的纯文本 indicators

- **Progress indication**
  - 加载 change state 耗时较长
  - 加载期间系统显示 spinner

### Section: Experimental Isolation

系统 SHALL 在隔离中实现 artifact workflow commands 以便移除，且 help 文本标记其 experimental 状态。

- **Help text marking**
  - 用户在任何 artifact workflow command 上运行 `--help`
  - help 文本指示该命令是 experimental

- **Single file implementation**
  - artifact workflow feature is implemented
  - all commands are in `src/commands/artifact-workflow.ts`

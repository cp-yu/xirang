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

系统 SHALL 为 scaffolded 与已有 Changes 输出创建 artifact 的 enriched instructions。semantic-model 的 `tasks` instructions SHALL 只要求目标级任务、对应可观察验证方向及目标级完成 checkbox，不要求 Propose 提供 `Files`、`Sections`、nested executable `Checks`、`Test action`、命令或具体测试路径；需要验证的行为与边界 SHALL 指向相应目标 Contract，不以任务正文独立定义行为。Apply instructions SHALL 指导 Agent 现场选择测试并以实际证据判断目标完成。CLI SHALL 只支持目标级 `tasks.md`；旧式任务文件不迁移且不受支持，需重写后继续使用。

- **展示 enriched instructions**
  - 用户运行 `xirang instructions <artifact> --change <id>`
  - 输出 artifact metadata、template、依赖状态与可解锁 artifacts；JSON 模式输出结构化结果

- **Tasks instructions 是目标级**
  - 用户运行 `xirang instructions tasks --change <id> --json`
  - SHALL 返回粗粒度 `### Task N:` 目标、目标级 checkbox 与验证方向的模板和指令
  - SHALL NOT 强制 Propose 提前选择文件、测试动作、命令、用例数量或技术依赖

- **可观察目标而非空泛工作**
  - 目标涉及错误输入、缺陷修复、行为保持或删除
  - instructions SHALL 提示写出相应可观察结果与边界，并引用目标 Contract 或既有 Contract，不要求预置 executable Check

- **非运行时文本的验证方向**
  - 目标只影响无运行时消费者的文本制品
  - instructions SHALL 不要求人为失败测试；config、schema 与模板有消费者时仍须验证行为

- **Apply instructions 的行为验证**
  - 用户运行 `xirang instructions apply --change <id> --json`
  - SHALL 要求 Apply 依据现有测试选择合适动作，行为与代码目标通过实际 RED/GREEN 证据；目标完成状态不得先于证据

- **未知 artifact 与阻塞依赖**
  - 用户请求未知 artifact 或尚有未满足依赖的 artifact
  - CLI SHALL 给出有效 IDs 或列明缺失依赖及警告

- **Scaffolded change**
  - 用户在只有 change 目录时请求 proposal instructions
  - CLI SHALL 返回模板、定义与元数据，不要求现有制品

- **目标锚点**
  - 任务的验证方向引用目标 Contract
  - instructions SHALL 使用 Element identity 和 Section 名定位语义；不要求 Propose 构造文件路径式 `Verifies:` 或 `Preserves:`，不支持旧式 Check 路径锚点

- **不预列删除文件**
  - 目标涉及删除或替换行为
  - instructions SHALL 写出要消失或被替换的行为，不预列 `Delete:` 文件清单；Apply SHALL 根据当前项目证据定位实际文件

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

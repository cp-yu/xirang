---
entity: element-declaration
identity: validation-commands
kind: element
parent: deterministic-operations
title: Validation Commands
definition: Validation Commands 定义 `xirang validate` 命令面的校验契约：顶层 validate 的选择与批量模式、显式 full-Change validation 与 concise preview、Requirement section 交叉校验、Scenario label 清洁度、fence-aware requirement 读取与 effective preview。
---

## Requirements

### Requirement: Top-level validate command

CLI SHALL 提供顶层 `validate` 命令，用于以灵活选择选项校验 changes 与 contracts。

#### Scenario: Interactive validation selection

- **WHEN** 执行 `xirang validate` 而不带参数
- **THEN** 提示用户选择要校验的内容并基于选择执行校验

#### Scenario: Non-interactive environments do not prompt

- **GIVEN** stdin 不是 TTY 或提供了 `--no-interactive` 或设置了 `XIRANG_INTERACTIVE=0`
- **WHEN** 执行 `xirang validate` 而不带参数
- **THEN** 不交互式提示
- **AND** 打印可用命令/flags 提示并以 exit code 1 退出
#### Scenario: Direct item validation
- **WHEN** 执行 `xirang validate <item-name>`
- **THEN** 自动检测 item 是 change 还是 Element（以校验其 Contract）
- **AND** 校验指定 item 并显示校验结果
#### Scenario: Disabling prompts via flags or environment
- **WHEN** `xirang validate` is executed with `--no-interactive` or with environment `XIRANG_INTERACTIVE=0`
- **THEN** the CLI SHALL not display interactive prompts
- **AND** SHALL print non-interactive hints or chosen outputs as appropriate
### Requirement: Bulk and filtered validation

validate 命令 SHALL 支持批量校验（`--all`）与按类型过滤（`--changes`、`--contracts`）。

#### Scenario: Validate everything

- **WHEN** 执行 `xirang validate --all`
- **THEN** 校验全部活动 changes（排除 archive）
- **AND** 校验 formal model 中携带 Contract 的 Elements
- **AND** 显示通过/失败汇总并以 exit code 1 退出（若有失败）

#### Scenario: Scope of bulk validation

- **WHEN** 使用 `--all` 或 `--changes`
- **THEN** 包含 `.xirang/changes/` 下全部 change 并排除 `archive/`
#### Scenario: Validate all changes
- **WHEN** executing `xirang validate --changes`
- **THEN** validate all changes in .xirang/changes/ (excluding archive)
- **AND** display results for each change
- **AND** show summary statistics
### Requirement: Validation options and progress indication

validate 命令 SHALL 支持 `--strict`、`--json` 标准选项并在批量操作期间显示进度。

#### Scenario: Strict validation

- **WHEN** 执行 `xirang validate --all --strict`
- **THEN** 将 warnings 视为 errors 并在任何 item 有 warning 或 error 时失败

#### Scenario: JSON output

- **WHEN** 执行 `xirang validate --all --json`
- **THEN** 输出结构化 JSON，包含每项结果与 summary statistics
#### Scenario: JSON output schema for bulk validation
- **WHEN** 执行 `xirang validate --all --json`（或 `--changes`/`--contracts`）
- **THEN** 输出 JSON 对象，包含 `items` 数组与 `summary` 统计
- **AND** 每项含 `id`、`type`（change/contract）、`valid`、`issues` 与 `durationMs`
- **AND** 任一 item 无效时以 exit code 1 退出
#### Scenario: Show validation progress
- **WHEN** 校验多个 items（--all/--changes/--contracts）
- **THEN** 显示进度指示与当前校验 item
- **AND** 显示通过/失败的运行计数
#### Scenario: Concurrency limits for performance
- **WHEN** 校验多个 items
- **THEN** 以有界并发（默认约 6）运行校验
- **AND** 保持进度指示响应
### Requirement: Item type detection and ambiguity handling

validate 命令 SHALL 处理歧义名称与显式类型覆盖，确保确定行为。

#### Scenario: Ambiguity between change and contract names

- **GIVEN** `<item-name>` 同时作为 change 与 Element Contract 的宿主 Element 名称存在
- **WHEN** 执行 `xirang validate <item-name>`
- **THEN** 打印解释两种匹配的歧义错误
- **AND** 建议传入 `--type change` 或 `--type contract`
- **AND** 以 exit code 1 退出而不执行校验
#### Scenario: Direct item validation with automatic type detection
- **WHEN** 执行 `xirang validate <item-name>` 且 `<item-name>` 唯一匹配一个 change 或 Element
- **THEN** 校验该 item
#### Scenario: Unknown item name
- **WHEN** `<item-name>` 既不匹配 change 也不匹配 Element
- **THEN** 打印 not-found 错误
- **AND** 给出最近匹配建议（如有）
- **AND** 以 exit code 1 退出
#### Scenario: Explicit type override
- **WHEN** 执行 `xirang validate --type change <item>`
- **THEN** 将 `<item>` 作为 change ID 校验（跳过自动检测）
- **WHEN** 执行 `xirang validate --type contract <item>`
- **THEN** 将 `<item>` 作为 Element identity 校验其 Contract
### Requirement: Scenario operation label 校验

`xirang validate` SHALL 拒绝 change-local 与 formal source 中任何 `#### Scenario:` title 上的 operation label。Scenario operations SHALL 仅存在于 derived Diff IR projections。

#### Scenario: Change-local label 报错
- **WHEN** change source 包含 `#### Scenario: [MODIFIED] 调整行为`
- **THEN** SHALL 报告 location-aware ERROR
- **AND** SHALL 指引删除 label 并保留完整 target Scenario body

#### Scenario: Canonical unlabeled Scenario 通过
- **WHEN** Requirement 包含无 label 的 canonical `#### Scenario: 场景`
- **THEN** label validation SHALL 通过
#### Scenario: REMOVED label block 报错
- **WHEN** change source 包含 `#### Scenario: [REMOVED] 旧行为`
- **THEN** SHALL 报告 ERROR
- **AND** SHALL 指引从完整 `MODIFIED Requirement` 中省略该 Scenario
#### Scenario: ADDED label 报错
- **WHEN**任意 Contract 包含 `#### Scenario: [ADDED] 新行为`
- **THEN** SHALL report ERROR
- **AND** SHALL 说明 Scenario 新增由 Formal/Target 比较派生
#### Scenario: Clean formal scenario 通过清洁度校验
- **WHEN** `对应 Element 的 Contract` 包含 `#### Scenario: 场景`
- **AND** scenario 标题不以 `[ADDED]`、`[MODIFIED]` 或 `[REMOVED]` 开头
- **THEN** scenario label 清洁度校验 SHALL NOT 报告问题

#### Scenario: Unknown bracket prefix
- **WHEN** Scenario title 以 `[UPDATED]` 等 operation-like prefix 开头
- **THEN** SHALL report unsupported Scenario operation metadata ERROR
#### Scenario: Formal source 含 ADDED label 报错
- **WHEN** formal source 的 Contract 包含 `#### Scenario: [ADDED] 场景`
- **THEN** validation SHALL 报告 ERROR
- **AND** SHALL 说明 Scenario 操作由 Formal/Target 比较派生，不得写入 source
#### Scenario: Formal source 含 MODIFIED label 报错
- **WHEN** formal source 的 Contract 包含 `#### Scenario: [MODIFIED] 场景`
- **THEN** validation SHALL 报告 ERROR
- **AND** SHALL 说明 Scenario 操作由 Formal/Target 比较派生，不得写入 source
#### Scenario: Formal source 含 REMOVED label 报错
- **WHEN** formal source 的 Contract 包含 `#### Scenario: [REMOVED] 场景`
- **THEN** validation SHALL 报告 ERROR
- **AND** SHALL 说明 Scenario 操作由 Formal/Target 比较派生，不得写入 source
### Requirement: Requirement reader SHALL be fence-aware for body and scenarios

Change delta 与 formal contract 校验 SHALL 使用同一套 fence-aware requirement 读取规则：跳过 fenced code block 内的内容；requirement body 提取与 scenario 计数均不得把 fence 内文本当作真实正文或真实 scenario。规则在 CRLF/LF/CR 行尾规范化后保持一致。

#### Scenario: Fence 内 Scenario 不计入 surviving

- **WHEN** change delta 中某个 ADDED 或 MODIFIED requirement 在 fenced code block 内包含 `#### Scenario:` 示例，且 fence 外没有任何真实 scenario
- **THEN** validation SHALL report ERROR，要求至少一个 surviving scenario
- **AND** SHALL NOT 将 fence 内 scenario 计为 surviving

#### Scenario: CRLF 下 fence 与跨行 body 行为一致

- **WHEN** 同一 change delta 使用 CRLF 行尾且包含跨行 `SHALL`/`MUST` 与 fenced scenario 示例
- **THEN** validation 结果 SHALL 与等价 LF 内容一致
#### Scenario: Required sections parsed with CRLF line endings
- **GIVEN** a change proposal markdown saved with CRLF line endings
- **AND** the document contains `## Why` and `## What Changes`
- **WHEN** running `xirang validate <change-id>`
- **THEN** validation SHALL recognize the sections and NOT raise parsing errors
#### Scenario: CRLF 行尾
- **WHEN**同一内容使用 CRLF 行尾
- **THEN** fence 与 surviving count 结果 SHALL 与 LF 内容一致
### Requirement: Surviving scenario 计数 SHALL ignore fenced examples

Surviving Scenario 计数 SHALL 仅考虑 fenced code block 外的 canonical unlabeled `#### Scenario:` headings。每个 ADDED 或 MODIFIED Requirement SHALL 至少包含一个 surviving Scenario。

#### Scenario: 非 fence Scenario 与 fence 示例并存
- **WHEN** requirement 同时包含 fence 外 canonical Scenario 与 fence 内 Scenario 示例
- **THEN** surviving count SHALL 至少为 1
- **AND** fence 内示例 SHALL NOT 计数
#### Scenario: 只有 fence 内示例
- **WHEN** requirement 只在 fenced code block 内包含 `#### Scenario:`
- **THEN** SHALL 报告至少需要一个 surviving Scenario 的 ERROR
### Requirement: MODIFIED requirement header 必须存在于 formal Element Contract

change validation SHALL 对每个 `## MODIFIED Requirements` 下的 `### Requirement: <name>` 读取对应 formal Element Contract，使用规范化名称匹配，验证该 header 存在；不存在时 SHALL 报 ERROR。

#### Scenario: MODIFIED header 不存在于 formal Contract

- **WHEN** change source 的 MODIFIED section 引用一个 formal Element Contract 中不存在的 Requirement header
- **THEN** 验证 SHALL 报 ERROR
- **AND** 错误信息 SHALL 包含 requirement 名称和建议使用 `## ADDED Requirements`
#### Scenario: Section-type 与 formal Element Contract header 不一致
- **WHEN** MODIFIED 或 REMOVED 引用的 requirement header 在 Formal Contract 中不存在
- **OR** ADDED header 已存在
- **THEN** SHALL emit ERROR 并建议对应的合法 operation section
#### Scenario: MODIFIED header 存在于 formal Element Contract
- **WHEN** change 单元 `.xirang/changes/<name>/elements/<identity>.md` 包含 `## MODIFIED Requirements` 下的 `### Requirement: Bar`
- **AND** formal Element 的 `elements/<identity>.md` 单元存在且包含 `### Requirement: Bar`
- **THEN** 验证 SHALL 通过，不产生 ERROR
#### Scenario: MODIFIED header 不存在于 formal Element 单元
- **WHEN** change 单元 `.xirang/changes/<name>/elements/<identity>.md` 包含 `## MODIFIED Requirements` 下的 `### Requirement: Bar`
- **AND** formal Element 的 `elements/<identity>.md` 单元存在但不包含 `### Requirement: Bar`
- **THEN** 验证 SHALL 报 ERROR
- **AND** 错误信息 SHALL 包含 requirement 名称和建议（应使用 `## ADDED Requirements`）
#### Scenario: normalizeRequirementName 匹配
- **WHEN** change source 中 header 为 `### Requirement:  Bar `（含多余空格）
- **AND** formal Element Contract 中 header 为 `### Requirement: Bar`
- **THEN** 匹配 SHALL 成功（通过 normalizeRequirementName 规范化后比较）
#### Scenario: MODIFIED 引用不存在的 formal Element 单元
- **WHEN** change 单元包含 `## MODIFIED Requirements`
- **AND** 对应 formal Element 的 `elements/<identity>.md` 单元不存在
- **THEN** 验证 SHALL 报 ERROR
- **AND** 错误信息 SHALL 说明 formal Element Contract 不存在，MODIFIED 无效
### Requirement: ADDED requirement header 不得已存在于 formal Element Contract

change validation SHALL 对每个 `## ADDED Requirements` 下的 header 检查对应 formal Element Contract 中是否已存在同名 header；已存在时 SHALL 报 ERROR。

#### Scenario: ADDED header 已存在于 formal Contract

- **WHEN** change source 的 ADDED section 引用一个 formal Element Contract 中已存在的 Requirement header
- **THEN** 验证 SHALL 报 ERROR
- **AND** 错误信息 SHALL 建议使用 `## MODIFIED Requirements`
#### Scenario: ADDED header 不存在于 formal Element Contract
- **WHEN** change 单元 `.xirang/changes/<name>/elements/<identity>.md` 包含 `## ADDED Requirements` 下的 `### Requirement: New Thing`
- **AND** formal Element 的 `elements/<identity>.md` 单元不包含 `### Requirement: New Thing`
- **THEN** 验证 SHALL 通过
#### Scenario: ADDED header 已存在于 formal Element Contract
- **WHEN** change 单元 `.xirang/changes/<name>/elements/<identity>.md` 包含 `## ADDED Requirements` 下的 `### Requirement: Existing`
- **AND** formal Element 的 `elements/<identity>.md` 单元已包含 `### Requirement: Existing`
- **THEN** 验证 SHALL 报 ERROR
- **AND** 错误信息 SHALL 建议使用 `## MODIFIED Requirements`
#### Scenario: formal Element 单元不存在时 ADDED 合法
- **WHEN** change 单元包含 `## ADDED Requirements`
- **AND** 对应 formal Element 的 `elements/<identity>.md` 单元不存在
- **THEN** 验证 SHALL 通过（新 capability 的所有 requirement 都是 ADDED）
### Requirement: REMOVED/RENAMED requirement header 必须存在于 formal Element Contract

change validation SHALL 对 `## REMOVED Requirements` 中引用的 header 验证其存在于 formal Element Contract，并 SHALL 拒绝 `## RENAMED Requirements` section。

#### Scenario: RENAMED section 被拒绝
- **WHEN** change source 包含 `## RENAMED Requirements`
- **THEN** validation SHALL 报 unsupported operation ERROR
- **AND** SHALL 指引使用 REMOVED old 与 ADDED new
#### Scenario: REMOVED header 存在于 Formal Contract
- **WHEN** change Contract 包含 REMOVED `### Requirement: Old`
- **AND** Formal Contract 包含同名 identity
- **THEN** validation SHALL 通过 identity precondition
#### Scenario: REMOVED header 不存在于 Formal Contract
- **WHEN** change Contract 包含 REMOVED `### Requirement: Ghost`
- **AND** Formal Contract 不包含该 identity
- **THEN** validation SHALL 报 ERROR
#### Scenario: RENAMED section 被拒绝（formal Contract header 校验）
- **WHEN** change Contract 包含 `RENAMED section`
- **THEN** validation SHALL 报 unsupported operation ERROR
- **AND** SHALL 指引使用 REMOVED old 与 ADDED new
### Requirement: 显式 Full-Change validation

Validate 命令 SHALL 通过 `--change <name>` 支持显式 full-Change validation：SHALL 联合校验全部四分区 delta 与 Element Contracts，materialize 完整 Target Semantic Model，并输出 validation status、diagnostics、summary 与 concise effective preview。CLI SHALL NOT 提供 `--artifacts` 选项，也不存在 artifact-scoped validation。

#### Scenario: Explicit change 默认完整 validation
- **WHEN** 执行 `xirang validate --change my-change`
- **THEN** SHALL 联合验证结构、contract 与 relationship operations
- **AND** SHALL 输出 validation status、diagnostics、summary 与 concise effective entries

#### Scenario: Missing active change
- **WHEN** selected change 不存在或已 archived
- **THEN** SHALL 输出 unknown active change error
- **AND** SHALL NOT validate unrelated changes
#### Scenario: Contract-only change 不要求结构 delta 单元
- **GIVEN** change 只有 contract operations
- **WHEN** 运行 `xirang validate --change <name>`
- **THEN** SHALL 接受缺失的结构分区 delta 单元
- **AND** preview SHALL 显示结构无 semantic changes
#### Scenario: 验证分区 delta 记法
- **WHEN** change 包含四分区 Semantic Delta 单元
- **THEN** SHALL 使用 Xirang delta parser 验证 identity-level operations
- **AND** MUST NOT 将文件直接复制为 additive formal LikeC4 module
#### Scenario: 联合 Target Semantic Model
- **WHEN** 结构 operation 新增 element 且 change-local 单元携带该 element 的 Contract
- **THEN** validation SHALL 在同一 target 中解析 element 与其 Contract
- **AND** SHALL 联合验证 Metamodel、containment、relationships 与 contracts
#### Scenario: Contract parse error
- **WHEN** selected change 某个 Contract 无法解析
- **THEN** 校验 SHALL 返回该 Contract 的 location-aware diagnostics
- **AND** 其他可解析 Contracts 与结构单元 SHALL 保持可用
### Requirement: 校验提供可操作的 Required Corrections

校验输出 SHALL 为每个错误提供可执行修复指引，包括期望结构、示例标题与建议命令。Requirement 正文校验 SHALL 基于完整 requirement body；change validation SHALL 只接受 `ADDED`、`MODIFIED`、`REMOVED` Requirement sections。

#### Scenario: change 无任何 delta
- **WHEN** 校验一个解析到零个 contract 与结构操作的 change
- **THEN** SHALL 显示 `No deltas found` 类错误
- **AND** SHALL 说明 change source 只支持 `## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements`

#### Scenario: 缺少必需章节
- **WHEN** change source 缺少必需章节
- **THEN** SHALL 给出期望标题与最小 canonical skeleton
- **AND** SHALL 指向当前 artifact instructions

### Requirement: Requirement 必须包含 normative body

Requirement 正文 SHALL 包含 whole-word `SHALL` 或 `MUST` 等 normative keyword；关键字出现在首条正文行或后续非 fence body 行均 SHALL 被识别。

#### Scenario: 缺失 normative 正文
- **WHEN** requirement 标题后、scenario 前缺少描述正文
- **THEN** SHALL 报错说明必须先有包含 `SHALL` 或 `MUST` 的 normative body
- **AND** SHALL 给出合规结构示例

#### Scenario: 跨行 body 上的 keyword 被识别
- **WHEN** requirement 首条正文行不含 normative keyword，但后续非 fence body 行包含 whole-word `SHALL` 或 `MUST`
- **THEN** SHALL NOT 仅因 keyword 不在首行报告 ERROR
#### Scenario: 仅 metadata 行承载 MUST 正文
- **WHEN** requirement body 在 scenario 之前仅包含形如 `**Constraint**: The system MUST ...` 的 metadata 行
- **THEN** validation SHALL 将该行视为 requirement body
#### Scenario: 跨行 body 上的 SHALL 或 MUST 被识别
- **WHEN** requirement 首条正文行不含 normative keyword，但后续非 fence body 行包含 whole-word `SHALL` 或 `MUST`
- **THEN** SHALL NOT 仅因 keyword 不在首行报告 ERROR
#### Scenario: Fence 后的正文用于 keyword 检测
- **WHEN** requirement header 之后首先出现 fenced code block，随后在非 fence 行出现含 whole-word `SHALL` 或 `MUST` 的正文，再出现真实 `#### Scenario:`
- **THEN** validation SHALL 接受该 requirement 的 keyword 检测
- **AND** SHALL NOT 将 fence 打开行当作 requirement text
### Requirement: 检测疑似格式错误的 scenario 并警告修正

validator SHALL 识别看起来像 scenario 的 bulleted 行（如以 WHEN/THEN/AND 开头的行），并在没有任何 `#### Scenario:` headers 时发出带转换示例的定向警告。

#### Scenario: Requirement 下只有 WHEN/THEN bullets
- **WHEN** 某 Requirement 下存在以 WHEN/THEN/AND 开头的 bullets 且没有任何 `#### Scenario:` headers
- **THEN** 发出警告："Scenarios must use '#### Scenario:' headers" 并展示转换模板
#### Scenario: Bulleted WHEN/THEN under a Requirement
- **WHEN** bullets that start with WHEN/THEN/AND are found under a requirement without any `#### Scenario:` headers
- **THEN** emit warning: "Scenarios must use '#### Scenario:' headers", and show a conversion template:
```
#### Scenario: Short name
- **WHEN** ...
- **THEN** ...
- **AND** ...
```
### Requirement: 所有 issues 包含文件路径与结构化位置

Error、warning 与 info 消息 SHALL 包含 source 文件路径与结构化路径。

#### Scenario: 结构化定位
- **WHEN** schema validation 失败
- **THEN** 消息 SHALL 包含 file、path 与适用的 Required Corrections hint

### Requirement: 无效结果包含 Next steps footer

CLI SHALL 在 item 无效且未使用 `--json` 时追加 Next steps footer，包含计数摘要与情境化的引导 bullets。

#### Scenario: Change 无效摘要
- **WHEN** 一个 change validation 失败
- **THEN** 输出 "Next steps" 与 2-3 条定向引导 bullets
- **AND** 建议用 `--json` 重跑查看结构化诊断

### Requirement: Change validation effective preview

`xirang validate --change <name>` SHALL 在 validation 结果中呈现该 change 实际表达的 concise semantic changes，Preview SHALL 来自与 diff 相同的 compiler 与 Diff IR。

#### Scenario: 预览展示实体级变化

- **WHEN** 用户运行 `xirang validate --change sample`
- **THEN** 结果 SHALL 包含以 entity kind 与稳定 identity 表达的 effective entries
#### Scenario: Preview 不写 review artifact
- **WHEN** 用户运行 validate
- **THEN** command SHALL 只输出 ephemeral text/JSON preview，不创建或更新任何 review artifact 文件（包括遗留的 `effective-change.md`）
- **AND** 不存在的 review artifact SHALL 不产生 blocking guidance
#### Scenario: JSON concise preview
- **WHEN** 用户运行 `xirang validate --change my-change --json`
- **THEN** JSON SHALL 包含 valid、diagnostics、summary 与 concise effective entries
- **AND** SHALL NOT 输出完整 before/after field payload
### Requirement: 变更路径并行校验

Change validation SHALL 将 delta Contracts 与结构单元作为独立 source modules 校验并将问题合并到一个结果。

#### Scenario: One source module fails
- **WHEN** behavior 或 structure delta validation 任一失败
- **THEN** the change SHALL be invalid 且 SHALL 报告 failing module
#### Scenario: Partial diagnostics
- **WHEN** Contracts 或 Architecture 一侧失败而另一侧可计算
- **THEN** validation SHALL 保留可计算侧的 concise preview
- **AND** overall result SHALL 为 invalid
#### Scenario: Delta references an unknown element
- **WHEN** architecture delta validation runs
- **THEN** it SHALL fail with the delta path and semantic error
- **AND** formal architecture SHALL remain unchanged

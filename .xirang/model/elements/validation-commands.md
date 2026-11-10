---
entity: element-declaration
identity: validation-commands
kind: element
parent: deterministic-operations
title: Validation Commands
definition: Validation Commands 是顶层 validate 的确定性校验能力。它支持活动 Change 与 Element Contracts 的单项、批量和类型选择，联合验证完整目标模型与任务结构，并按显式请求呈现共享编译器的差异预览；它只读报告问题，不修改规范来源或生成持久审阅制品。
---

## Specification

### Section: Top-level validate command

CLI SHALL 提供顶层 `validate` 命令，用于以灵活选择选项校验 changes 与 contracts。

- **Interactive validation selection**

  - 执行 `xirang validate` 而不带参数
  - 提示用户选择要校验的内容并基于选择执行校验

- **Non-interactive environments do not prompt**

  - stdin 不是 TTY 或提供了 `--no-interactive` 或设置了 `XIRANG_INTERACTIVE=0`
  - 执行 `xirang validate` 而不带参数
  - 不交互式提示
  - 打印可用命令/flags 提示并以 exit code 1 退出

- **Direct item validation**

  - 执行 `xirang validate <item-name>`
  - 自动检测 item 是 change 还是 Element（以校验其 Contract）
  - 校验指定 item 并显示校验结果

- **Disabling prompts via flags or environment**

  - `xirang validate` is executed with `--no-interactive` or with environment `XIRANG_INTERACTIVE=0`
  - the CLI SHALL not display interactive prompts
  - SHALL print non-interactive hints or chosen outputs as appropriate

### Section: Bulk and filtered validation

validate 命令 SHALL 支持批量校验（`--all`）与按类型过滤（`--changes`、`--contracts`）。

- **Validate everything**

  - 执行 `xirang validate --all`
  - 校验全部活动 changes（排除 archive）
  - 校验 formal model 中携带 Contract 的 Elements
  - 仅在 stderr 报告带 item 定位的问题；无问题时静默，有失败时以 exit code 1 退出

- **Scope of bulk validation**

  - 使用 `--all` 或 `--changes`
  - 包含 `.xirang/changes/` 下全部 change 并排除 `archive/`

- **Validate all changes**

  - executing `xirang validate --changes`
  - validate all changes in .xirang/changes/ (excluding archive)
  - 只报告各 Change 的实际问题，不输出通过回执或默认汇总

### Section: Validation options and progress indication

validate SHALL 支持 --strict 与 --json。默认校验只报告问题；JSON 模式的问题也在 stderr，以 item id、type 及具体 issue 定位，不输出每个有效 item 的回执、durationMs 或默认汇总。--strict SHALL 将 warnings 视为 errors，任一 item 有 warning/error 时非零退出。非 strict 的 warning SHALL 保留且不单独导致失败。

批量校验 SHALL 保持有界并发（默认约 6）。非交互调用 SHALL 不显示进度、当前 item、通过/失败运行计数或 spinner；无问题时两条输出流均为空。

### Section: Item type detection and ambiguity handling

validate 命令 SHALL 处理歧义名称与显式类型覆盖，确保确定行为。

- **Ambiguity between change and contract names**

  - `<item-name>` 同时作为 change 与 Element Contract 的宿主 Element 名称存在
  - 执行 `xirang validate <item-name>`
  - 打印解释两种匹配的歧义错误
  - 建议传入 `--type change` 或 `--type contract`
  - 以 exit code 1 退出而不执行校验

- **Direct item validation with automatic type detection**

  - 执行 `xirang validate <item-name>` 且 `<item-name>` 唯一匹配一个 change 或 Element
  - 校验该 item

- **Unknown item name**

  - `<item-name>` 既不匹配 change 也不匹配 Element
  - 打印 not-found 错误
  - 给出最近匹配建议（如有）
  - 以 exit code 1 退出

- **Explicit type override**

  - 执行 `xirang validate --type change <item>`
  - 将 `<item>` 作为 change ID 校验（跳过自动检测）
  - 执行 `xirang validate --type contract <item>`
  - 将 `<item>` 作为 Element identity 校验其 Contract

### Section: Section 读取 SHALL 对 body 与示例感知 fence

Change delta 与 Element Contract 校验 SHALL 使用同一套 fence-aware Section 读取规则：跳过 fenced code block 内的内容；Section body 提取与 normative keyword 检测 SHALL NOT 把 fence 内文本当作真实正文。规则在 CRLF/LF/CR 行尾规范化后保持一致。

- **Fence 内文本不计入 body 检测**

  - 某 Section 在 fenced code block 内包含含 `SHALL` 或 `MUST` 的示例文本
  - validation SHALL NOT 将 fence 内文本用于该 Section 的 body 与 keyword 检测

- **CRLF 下 fence 与跨行 body 行为一致**

  - 同一 change delta 使用 CRLF 行尾且包含跨行 `SHALL`/`MUST` 与 fenced 示例
  - fence 判定与 body 检测结果 SHALL 与等价 LF 内容一致

### Section: MODIFIED Section header 必须存在于 formal Element Contract

change validation SHALL 对每个 `## MODIFIED Sections` 下的 `### Section: <name>` 读取对应 formal Element Contract，使用规范化名称匹配，验证该 header 存在；不存在时 SHALL 报 ERROR。

- **MODIFIED header 不存在于 formal Contract**

  - change source 的 MODIFIED section 引用一个 formal Element Contract 中不存在的 Section header
  - 验证 SHALL 报 ERROR
  - 错误信息 SHALL 包含 Section 名称和建议使用 `## ADDED Sections`

- **Section-type 与 formal Element Contract header 不一致**

  - MODIFIED 或 REMOVED 引用的 Section header 在 Formal Contract 中不存在
- **OR** ADDED header 已存在
- **THEN** SHALL emit ERROR 并建议对应的合法 operation section

- **MODIFIED header 存在于 formal Element Contract**

  - change 单元 `.xirang/changes/<name>/elements/<identity>.md` 包含 `## MODIFIED Sections` 下的 `### Section: Bar`
  - formal Element 的 `elements/<identity>.md` 单元存在且包含 `### Section: Bar`
  - 验证 SHALL 通过，不产生 ERROR

- **MODIFIED header 不存在于 formal Element 单元**

  - change 单元 `.xirang/changes/<name>/elements/<identity>.md` 包含 `## MODIFIED Sections` 下的 `### Section: Bar`
  - formal Element 的 `elements/<identity>.md` 单元存在但不包含 `### Section: Bar`
  - 验证 SHALL 报 ERROR
  - 错误信息 SHALL 包含 Section 名称和建议（应使用 `## ADDED Sections`）

- **normalizeSectionName 匹配**

  - change source 中 header 为 `### Section:  Bar `（含多余空格）
  - formal Element Contract 中 header 为 `### Section: Bar`
  - 匹配 SHALL 成功（通过 normalizeSectionName 规范化后比较）

- **MODIFIED 引用不存在的 formal Element 单元**

  - change 单元包含 `## MODIFIED Sections`
  - 对应 formal Element 的 `elements/<identity>.md` 单元不存在
  - 验证 SHALL 报 ERROR
  - 错误信息 SHALL 说明 formal Element Contract 不存在，MODIFIED 无效

### Section: ADDED Section header 不得已存在于 formal Element Contract

change validation SHALL 对每个 `## ADDED Sections` 下的 header 检查对应 formal Element Contract 中是否已存在同名 header；已存在时 SHALL 报 ERROR。

- **ADDED header 已存在于 formal Contract**

  - change source 的 ADDED section 引用一个 formal Element Contract 中已存在的 Section header
  - 验证 SHALL 报 ERROR
  - 错误信息 SHALL 建议使用 `## MODIFIED Sections`

- **ADDED header 不存在于 formal Element Contract**

  - change 单元 `.xirang/changes/<name>/elements/<identity>.md` 包含 `## ADDED Sections` 下的 `### Section: New Thing`
  - formal Element 的 `elements/<identity>.md` 单元不包含 `### Section: New Thing`
  - 验证 SHALL 通过

- **ADDED header 已存在于 formal Element Contract**

  - change 单元 `.xirang/changes/<name>/elements/<identity>.md` 包含 `## ADDED Sections` 下的 `### Section: Existing`
  - formal Element 的 `elements/<identity>.md` 单元已包含 `### Section: Existing`
  - 验证 SHALL 报 ERROR
  - 错误信息 SHALL 建议使用 `## MODIFIED Sections`

- **formal Element 单元不存在时 ADDED 合法**

  - change 单元包含 `## ADDED Sections`
  - 对应 formal Element 的 `elements/<identity>.md` 单元不存在
  - 验证 SHALL 通过（新 capability 的所有 Sections 都是 ADDED）

### Section: REMOVED/RENAMED Section header 必须存在于 formal Element Contract

change validation SHALL 对 `## REMOVED Sections` 中引用的 header 验证其存在于 formal Element Contract，并 SHALL 拒绝 `## RENAMED Sections` section。

- **RENAMED section 被拒绝**

  - change source 包含 `## RENAMED Sections`
  - validation SHALL 报 unsupported operation ERROR
  - SHALL 指引使用 REMOVED old 与 ADDED new

- **REMOVED header 存在于 Formal Contract**

  - change Contract 包含 REMOVED `### Section: Old`
  - Formal Contract 包含同名 identity
  - validation SHALL 通过 identity precondition

- **REMOVED header 不存在于 Formal Contract**

  - change Contract 包含 REMOVED `### Section: Ghost`
  - Formal Contract 不包含该 identity
  - validation SHALL 报 ERROR

- **RENAMED section 被拒绝（formal Contract header 校验）**

  - change Contract 包含 `RENAMED section`
  - validation SHALL 报 unsupported operation ERROR
  - SHALL 指引使用 REMOVED old 与 ADDED new

### Section: 显式 Full-Change validation

Validate 命令 SHALL 通过 `--change <name>` 支持显式 full-Change validation：SHALL 联合校验全部四分区 delta 与 Element Contracts，materialize 完整 Target Semantic Model，默认只在 stderr 报告具体问题，显式 --preview 时输出 summary 与 concise effective preview。CLI SHALL NOT 提供 `--artifacts` 选项，也不存在 artifact-scoped validation。

- **Explicit change 默认完整 validation**

  - 执行 `xirang validate --change my-change`
  - SHALL 联合验证结构、contract 与 relationship operations
  - SHALL 默认仅报告问题；成功无问题时静默，--preview 才输出 summary 与 concise effective entries

- **Missing active change**

  - selected change 不存在或已 archived
  - SHALL 输出 unknown active change error
  - SHALL NOT validate unrelated changes

- **Contract-only change 不要求结构 delta 单元**

  - change 只有 contract operations
  - 运行 `xirang validate --change <name>`
  - SHALL 接受缺失的结构分区 delta 单元
  - 显式请求的 preview SHALL 显示结构无 semantic changes

- **验证分区 delta 记法**

  - change 包含四分区 Semantic Delta 单元
  - SHALL 使用 Xirang delta parser 验证 identity-level operations
  - MUST NOT 将文件直接复制为 additive formal LikeC4 module

- **联合 Target Semantic Model**

  - 结构 operation 新增 element 且 change-local 单元携带该 element 的 Contract
  - validation SHALL 在同一 target 中解析 element 与其 Contract
  - SHALL 联合验证 Metamodel、containment、relationships 与 contracts

- **Contract parse error**

  - selected change 某个 Contract 无法解析
  - 校验 SHALL 返回该 Contract 的 location-aware diagnostics
  - 其他可解析 Contracts 与结构单元 SHALL 保持可用

- **Validation 保持只读**

  - change validation 成功或失败
  - SHALL NOT 修改 Formal Semantic Model、change-local delta 单元或任何 review artifact

### Section: 校验提供可操作的 Required Corrections

校验输出 SHALL 为每个错误提供可执行修复指引，包括期望结构、示例标题与建议命令。Section 正文校验 SHALL 基于完整 Section body；change validation SHALL 只接受 `ADDED`、`MODIFIED`、`REMOVED` Sections。

- **change 无任何 delta**

  - 校验一个解析到零个 contract 与结构操作的 change
  - SHALL 显示 `No deltas found` 类错误
  - SHALL 说明 change source 只支持 `## ADDED Sections`、`## MODIFIED Sections`、`## REMOVED Sections`

- **缺少必需章节**

  - change source 缺少必需章节
  - SHALL 给出期望标题与最小 canonical skeleton
  - SHALL 指向当前共享制品写作 reference，而不建议重复读取整套 instructions

### Section: Section 必须包含 normative body

Section 正文 SHALL 包含 whole-word `SHALL` 或 `MUST` 等 normative keyword；关键字出现在首条正文行或后续非 fence body 行均 SHALL 被识别。

- **缺失 normative 正文**

  - Section 标题后缺少描述正文
  - SHALL 报错说明必须先有包含 `SHALL` 或 `MUST` 的 normative body
  - SHALL 给出合规结构示例

- **跨行 body 上的 SHALL 或 MUST 被识别**

  - Section 首条正文行不含 normative keyword，但后续非 fence body 行包含 whole-word `SHALL` 或 `MUST`
  - SHALL NOT 仅因 keyword 不在首行报告 ERROR

- **仅 metadata 行承载 MUST 正文**

  - Section body 仅包含形如 `**Constraint**: The system MUST ...` 的 metadata 行
  - validation SHALL 将该行视为 Section body

- **Fence 后的正文用于 keyword 检测**

  - Section header 之后首先出现 fenced code block，随后在非 fence 行出现含 whole-word `SHALL` 或 `MUST` 的正文，再出现 `#### Acceptance Case:` 子块
  - validation SHALL 接受该 Section 的 keyword 检测
  - SHALL NOT 将 fence 打开行当作 Section text

### Section: 所有 issues 包含文件路径与结构化位置

Error、warning 与 info 消息 SHALL 包含 source 文件路径与结构化路径。

- **结构化定位**

  - schema validation 失败
  - 消息 SHALL 包含 file、path 与适用的 Required Corrections hint

### Section: Change validation effective preview

validate --change <name> --preview SHALL 显式请求该 Change 实际表达的 concise semantic changes，来自与目标验证相同的 compiler 和 Diff IR。默认不展示差异，成功无问题时静默；--json 不隐式开启 preview。

- 显式 --preview：stdout 提供实体级 summary 和以 entity kind、稳定 identity 表达的 concise entries；--json 返回这些结构化数据，不包含完整 before/after payload。
- 无语义变化：请求的预览仍返回有效空 entries 与相应 summary。
- 校验有问题：问题在 stderr，退出码按校验结论确定；只可返回确实可计算的预览，不将部分结果声称为完整有效目标。
- 命令 SHALL 只输出临时预览，不创建、更新或要求 review artifact，包括 effective-change.md。

### Section: 变更路径并行校验

Change validation SHALL 将 delta Contracts 与结构单元作为独立 source modules 校验并将问题合并到一个结果。

- **One source module fails**

  - behavior 或 structure delta validation 任一失败
  - the change SHALL be invalid 且 SHALL 报告 failing module

- **Partial diagnostics**

  - Contracts 或 Architecture 一侧失败而另一侧可计算
  - 显式 --preview 时 validation SHALL 保留可计算侧的 concise preview；未请求时仅报告问题
  - overall result SHALL 为 invalid

- **Delta references an unknown element**

  - architecture delta validation runs
  - it SHALL fail with the delta path and semantic error
  - formal architecture SHALL remain unchanged

### Section: 任务计划文件冲突检测

validate 命令 SHALL 只接受目标级 `tasks.md`，检查每个任务具有目标、可观察验证方向及目标级完成状态，不要求列文件或可执行 Check。旧式 `Files` 声明不再解析或参与互斥文件冲突检测；旧格式需要使用前必须重写。

- **新格式不预列文件**
  - tasks.md 只有目标与验证方向
  - 校验 SHALL 不报告缺少 Files，也不推测文件冲突

- **旧格式不受支持**
  - tasks.md 使用 `Files`/`Sections`/`Checks` 或 Actions/Checks 布局而非目标级格式
  - validation SHALL 报告格式错误并要求重写，不尝试兼容解析

### Section: 任务依赖顺序检测

validate 命令 SHALL 接受不预列文件或技术依赖的目标级 tasks，不从任务自然排列推断用户指定次序或技术依赖；用户指定次序由 Propose 与 Apply 依据确认来源和 Plan 审查。CLI 不提供基于旧式 Files 声明的任务依赖顺序检测。

- **不推断目标顺序语义**
  - tasks.md 列出多个目标
  - CLI SHALL 不从排列判断用户要求或技术依赖

### Section: Check 锚点与 Acceptance Case 标题匹配

validate 命令 SHALL 在目标级 tasks 中核对验证方向所指的 Element identity 和 Section 是否存在于目标或正式 Contract，不要求每项结果都指向一个 Acceptance Case，也不把 Acceptance Case 数量当作 Check 数量；不支持旧式 `Verifies:` / `Preserves:` Check 锚点。

- **目标级语义定位**
  - 目标任务引用目标 Contract 的 Element identity 与 Section
  - CLI SHALL 接受合法定位，拒绝不存在的身份或 Section，不要求文件路径式锚点

### Section: Check 测试动作校验

validate 命令 SHALL 对目标级 tasks 检查目标及验证方向非空、每项目标具有一个可更新的完成状态；SHALL NOT 要求预先声明 `Test action:`、`Command:`、`Evidence:`、`Expect:` 或 nested Check。旧式 coarse Tasks 与 Actions/Checks 布局不受支持，SHALL 报格式错误而非继续执行旧 Check 校验。

- **目标级任务**
  - tasks.md 采用目标级布局
  - CLI SHALL 接受目标和验证方向非空、完成状态可勾选的任务，不要求旧式 Check 字段

- **旧格式被拒绝**
  - tasks.md 使用旧式 `Files`/`Sections`/`Checks` 或 Actions/Checks 布局
  - CLI SHALL 报不支持格式并要求重写，不对其推测或部分解析

### Section: 无 delta change 的显式标记

validate 命令 SHALL 将 change-local `.delta-noop` 标记识别为显式无 delta 声明：存在该标记且 change 不携带任何 Semantic Delta 单元时，SHALL 不报无 delta 错误；标记不存在且无任何 delta 单元时，SHALL 报无 delta 错误。

- **标记存在时豁免无 delta 报错**

  - change 目录存在 `.delta-noop` 且四分区为空
  - validate SHALL 不报无 delta 错误

- **无标记且无 delta 时仍报错**

  - change 目录不存在 `.delta-noop` 且四分区为空
  - validate SHALL 报无 delta 错误

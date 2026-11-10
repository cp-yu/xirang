---
operation: MODIFIED
entity: element-declaration
identity: validation-commands
kind: element
parent: deterministic-operations
title: "Validation Commands"
definition: "Validation Commands 是顶层 validate 的确定性校验能力。它支持活动 Change 与 Element Contracts 的单项、批量和类型选择，联合验证完整目标模型与任务结构，并按显式请求呈现共享编译器的差异预览；它只读报告问题，不修改规范来源或生成持久审阅制品。"
---

## MODIFIED Sections

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

## REMOVED Sections

### Section: 无效结果包含 Next steps footer

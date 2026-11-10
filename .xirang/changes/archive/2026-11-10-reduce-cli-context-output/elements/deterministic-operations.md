---
operation: MODIFIED
entity: element-declaration
identity: deterministic-operations
kind: element
parent: cli
title: "Deterministic Operations"
definition: "Deterministic Operations 是 Realization 中提供可复现操作的 CLI 能力。它包含结构化查询、状态管理、程序化校验、验证证据持久化与原子状态转换，支持显式请求的差异和完整语义读取；静态工作指导由受管文件承载。它不替代用户意图裁决、Agent 语义判断或独立质量评估。"
---

## MODIFIED Sections

### Section: Formal 缺失时报告 Diff 不可用

当前 Formal Semantic Model 不存在且调用方请求 Candidate comparison 详情时，Candidate validation SHALL 返回 comparison.baseline: absent、comparison.diff: unavailable 与 reason: formal-model-absent，不构造无效空 diff 或假设空 Formal Model。有效 Candidate 的默认校验 SHALL 仍返回 reviewDigest；比较不可用不使本来有效的初次构建失败。

### Section: Formal 存在时生成 Promotion Diff

当前 Formal Semantic Model 存在且有效、调用方请求 Candidate comparison 详情时，Candidate validation SHALL 返回 comparison.baseline: formal、comparison.diff: available、Formal fingerprint 与从 Formal 到 Candidate 的真实 semantic diff。diff entries SHALL 完整表达 promotion 的 ADDED、MODIFIED 与 REMOVED 语义；未请求详情时不回传该比较内容。

### Section: 通过 Validation 呈现 Change 差异

xirang validate --change <name> SHALL 完整执行只读 Change 校验，默认只报告问题；成功且无问题时静默，JSON 模式同样适用。--preview SHALL 显式请求当前 Semantic Model 与 Expected Semantic Model 的差异预览，文本或 JSON 提供实体级 summary 与 concise entries，不创建展示文件。

系统 SHALL 使用同一 Change compiler 取得校验与差异，不注册独立 diff 命令，也不将预览持久化为 Change artifact。显式预览返回空变化也是有效查询结果；不能因成功静默规则吞掉请求的预览。

### Section: 隔离受控文件路径

Record lifecycle SHALL 仅操作 canonical `.xirang/records/` 下按合法文件名称寻址的 managed regular files，使用 Node.js path APIs、containment、lstat、symlink 拒绝。来源快照 `record-source.md` 与覆盖结果 `record-coverage.json` SHALL 仅写入显式 named Change 或 active Candidate 的受控位置。Windows、macOS 与 Linux SHALL 采用同一隔离语义。

- **Managed path 是 symlink**

  - 任一记录、来源快照或覆盖结果路径是 symlink 或逃逸受控根目录
  - CLI 返回稳定路径错误，不跟随链接也不写入目标

- **Windows 路径分隔符不同**

  - record 命令在 Windows project root 下构造 managed path
  - CLI 使用 Node.js path API 保持 `.xirang/records/` 与明确目标的 containment，并仅在 JSON presentation 中转换为 project-relative POSIX path

### Section: 管理统一确认记录生命周期

record SHALL 通过文件名称管理非空确认记录，Build 与 Change 各用独立实例，保留完整/选择读取、CLI 局部更新和内部模型基准。不使用 explorationId/slug 双身份，不引入记录修订号，不要求调用方提供 sourceVersion。条目显式区分 nature 与 decision，结构只承载已确认目标，缺失状态不得默认确认。

更新保留未提及内容与结构字段合并语义；默认成功静默，显式 --diff 返回本次差异。show 按请求返回完整内容，不回显内部 hash 或 baseline。实现 SHALL 支持用户直接编辑合法记录；Agent 工作面仍 SHALL 要求通过 CLI 操作，不提示绕过 CLI。CLI 校验格式与确定性关系，不代用户确认设计。

### Section: 返回记录校验与上下文变化

Record validation SHALL 分别报告格式、文件身份、结构部分的 Kind / parent / Relationship 端点解析、显式上下文关联与模型变化的确定性诊断，不推断自然语言冲突或完备性。相关上下文变化 SHALL 阻止复用旧检查结论；意图判断由 Agent 完成并由用户裁决。合法初始 Build 可无 formal model，存在而损坏的模型必须报错。

- **合法缺失与损坏分离**

  - 首次 Build 没有正式模型，或已有模型损坏
  - 前者可创建合法记录，后者失败并保持源与目标不变。

- **结构引用无法解析**

  - 结构对象的 kind、parent 或 Relationship 端点无法解析
  - 返回带对象与字段的稳定诊断，不写入。

- **格式合法不等于意图完整**

  - 记录通过格式与结构校验但仍可能遗漏某个行为例外
  - CLI 只报告确定性有效性，不输出已完成语义覆盖的结论。

### Section: 确定性交接确认来源

record coverage SHALL 按性质、决策与适用性记录覆盖检查；需落实的 accepted normative 内容须有原子细节、真实目标位置及适用原文摘录。影响目标的 pending 问题阻塞；不适用或不影响的声明须有理由；excluded/informative 不强制生成目标承诺。CLI 校验结果、位置、摘录及结构，不判断自然语言覆盖或用户授权。

coverage SHALL 将当前来源内容 hash 与 Expected Semantic Model 或 Candidate 模型指纹内部绑定到 record-coverage.json，保留活动 Record。consume SHALL 显式选定目标并重新计算核对，来源或目标模型变化时拒绝；不要求调用方提供 hash 或修订号。已确认结构须与目标逐字段一致，确认删除的对象须不存在。用户接受最终 Change 后，Propose 才可调用 consume。

交接 SHALL 先保存精确 record-source.md，再验证，最后删除活动来源；失败保留来源及既有目标，撤销本次未完成快照；同字节快照可重验恢复，冲突快照停止。两份文件仅为形成历史，不进入后续规范语义计算。

### Section: 提供稳定 Record JSON Contract

Record JSON SHALL 只编码请求的数据或必要交付结果，不输出通用成功/失败 envelope；无结果成功保持 stdout 为空。警告与错误 SHALL 写入 stderr，--json 时为结构化 JSON，失败退出码非零。必要的创建文件名正常返回，普通回执不暴露内部来源/目标指纹；选择读取与完整读取保留各自请求范围的完整内容。

### Section: 通过 Show 与 List 呈现 Change 编译结果

Deterministic Operations SHALL 从当前 Semantic Model 与 Change 的四分区 Semantic Delta 编译顶层 `show` JSON、顶层 `list` JSON 与 `--long` 文本结果，SHALL NOT 将 Change Plan 或 change-local `specs/` 作为 Semantic Delta 来源。

- **获取 Change JSON**

  - 用户或 Agent 运行 `xirang show sample --json`
  - CLI 返回 `id`、`title`、`valid`、实体级 `summary`、以 entity kind 和稳定 identity 表达的 concise `entries` ；compiler 警告与错误进入 stderr

- **获取稳定 Change 列表 JSON**

  - 用户或 Agent 运行 `xirang list --json`
  - CLI 返回 `{ changes: [...] }` envelope，每项保留 `name`、task、last-modified、status 与 freshness information，并增加 compiler-derived `title` 和 `deltaCount`

- **获取详细 Change 文本列表**

  - 用户运行 `xirang list --long`
  - 每个活动 Change 的文本结果包含 title、实体级 Delta 数量与 task status

- **列出 Change Delta 数量**

  - 用户或 Agent 请求包含 Delta 数量的 Change 列表
  - `deltaCount` 等于 compiler diff 的实体级 `summary.total`

- **Change 编译失败**

  - 四分区 Semantic Delta 无法形成有效 Expected Semantic Model
  - `show` 非零退出并向 stderr 返回结构化诊断，且消费者不得将返回的 `entries` 视为有效目标状态

- **忽略旧 Change 语义来源**

  - Change Plan 含有旧式 Delta 描述或 Change 目录含有 change-local `specs/`
  - Show 与 List 只使用四分区 Semantic Delta 和当前 Semantic Model 推导结果

---
entity: element-declaration
identity: deterministic-operations
kind: element
parent: cli
title: Deterministic Operations
definition: Deterministic Operations 是 Realization 中提供可复现操作的 CLI 能力。它包含结构化查询、状态管理、程序化校验、验证证据持久化与原子状态转换，支持显式请求的差异和完整语义读取；静态工作指导由受管文件承载。它不替代用户意图裁决、Agent 语义判断或独立质量评估。
---

## Specification

### Section: 对模型和 Change 提供结构化操作

Deterministic Operations SHALL 支持 Semantic Model 与 Change 的查询、搜索、影响分析、差异、验证与派生呈现，并以 identity 而非文件位置寻址语义对象。发现型命令 SHALL 默认返回完成其职责所需的最小投影；完整语义 SHALL 只在调用方显式提供 stable identity 后由 `arch query` 返回，完整 Contract SHALL 只在显式使用 `--contract` 时返回。CLI 不得以默认摘要、截断或改写替代完整 Definition 或 Contract。

- **渐进式模型读取**

  - Agent 尚不知道相关 identity
  - 使用 `xirang arch search <query> --limit <n> --json` 定位候选
  - 再按需使用 `arch outline` 或 `arch impact` 获取层级和关系范围，使用 `arch query` 获取选定 Declaration，最后使用 `arch query --contract` 获取选定完整 Contract

- **全局结构诊断**

  - Agent 需要恢复全局结构，或整体模型认知在上下文压缩、长会话或切换后丢失
  - 使用 `xirang arch snapshot` 获取完整 Declaration、Relationships 和 Metamodel
  - snapshot 不包含 Contract，普通探索不将其作为默认入口

- **显式完整读取**

  - Agent 已确定需要判断某个 Element 的完整语义
  - `arch query <identity> --json` 返回完整 Declaration，`--contract` 额外返回该 identity 自有的完整 Contract
  - 不从 impact、outline、旧摘要或实现证据猜测缺失语义

### Section: 原子提升 Candidate

Candidate promotion SHALL 在用户确认精确版本后原子整体替换正式模型。

- **Promotion 失败**

  - 原子替换无法完成
  - 正式模型不进入部分提升状态

### Section: 在 Sync 前完整验证

Delta sync SHALL 在应用前完整验证 Semantic Delta 与 Expected Semantic Model。

- **Delta 无效**

  - Sync 准备阶段发现验证错误
  - 正式模型保持不变

### Section: 最小重写 Sync 单元

Delta sync SHALL 只重写 Semantic Delta 实际影响的存储单元。

- **Delta 只影响一个 Element**

  - Sync 应用该 Delta
  - 无关模型单元保持原字节不变

### Section: Sync 失败完整回滚

Delta sync 任一环节失败时 SHALL 完整回滚到应用前状态。

- **Sync 中途失败**

  - 任一目标单元无法写入
  - 正式模型恢复到应用前状态

### Section: 持久化验证证据

Deterministic Operations SHALL 持久化 Verify 与 Change Closure 使用的可复现验证证据。

- **Closure 检查验证入口**

  - Change 请求进入 Closure
  - CLI 提供已持久化证据供入口判断

### Section: 序列化是 IR 的确定性函数

模型序列化 SHALL 是当前 IR 的确定性函数，相同 IR SHALL 产生逐字节相同输出。

- **重复序列化相同 IR**

  - 系统两次序列化相同 IR
  - 两次输出逐字节一致

### Section: 固定 Frontmatter 键顺序

模型序列化 SHALL 以固定键顺序输出 frontmatter。

- **序列化 Markdown 单元**

  - 系统写入同类实体
  - frontmatter 字段顺序保持确定

### Section: 排序 Relationship Entries

模型序列化 SHALL 按 `source`、`kind`、`target` 依次排序 Relationship entries。

- **输入容器顺序不同**

  - IR 包含相同 Relationship 集合
  - 序列化列表顺序一致

### Section: 验证序列化往返属性

测试层 SHALL 以属性测试验证 `parse(serialize(ir))` 与原 IR 相等，并覆盖转义、多行文本、空集合与缺省字段。

- **序列化边界输入**

  - 属性测试生成有效边界 IR
  - 序列化后重新解析得到语义相等 IR

### Section: 规范化无权威顺序集合

语义比较 SHALL 将 Elements、Relationships、Kinds、Authored Views 及 `parents`、`children`、`sourceKinds`、`targetKinds`、`include`、`exclude` 作为无序集合规范化后比较。

- **仅集合排列变化**

  - 两个模型只在无权威顺序的排列上不同
  - diff 不报告语义变化

### Section: 保留 Contract 条目顺序

Element Contract 内 Section 顺序与 Section 内 Acceptance Case 顺序 SHALL 保留并参与语义比较。

- **Section 顺序变化**

  - 同一 Contract 的 Sections 被重排
  - diff 报告语义变化

### Section: 规范化散文比较

散文比较 SHALL 只规范化行尾与文件末尾空白后逐字比较。

- **散文仅行尾不同**

  - 两份散文只存在行尾编码差异
  - diff 不报告语义变化

### Section: 排除非语义存储信息

派生字段、文件路径与文件名 SHALL NOT 参与语义比较。

- **单元只改变文件位置**

  - 实体内容与 identity 不变
  - diff 不报告语义变化

### Section: 以实体身份输出差异

差异输出 SHALL 以 entity type 与 identity 为键，SHALL NOT 携带存储分区信息。

- **输出模型差异**

  - CLI 报告变化实体
  - 使用 entity type 与 identity 定位条目

### Section: 区分初始化来源与 Formal Comparison

Candidate validation SHALL 将 `candidate.yaml.baseline` 的初始化来源与当前 Formal Semantic Model 的 comparison availability 分别表达。

- **Clean Candidate 面对现有 Formal Model**

  - Candidate 从 clean 初始化且当前 Formal Model 存在
  - validation 仍以当前 Formal Model 作为 comparison baseline

### Section: Formal 缺失时报告 Diff 不可用

当前 Formal Semantic Model 不存在且调用方请求 Candidate comparison 详情时，Candidate validation SHALL 返回 comparison.baseline: absent、comparison.diff: unavailable 与 reason: formal-model-absent，不构造无效空 diff 或假设空 Formal Model。有效 Candidate 的默认校验 SHALL 仍返回 reviewDigest；比较不可用不使本来有效的初次构建失败。

### Section: Formal 存在时生成 Promotion Diff

当前 Formal Semantic Model 存在且有效、调用方请求 Candidate comparison 详情时，Candidate validation SHALL 返回 comparison.baseline: formal、comparison.diff: available、Formal fingerprint 与从 Formal 到 Candidate 的真实 semantic diff。diff entries SHALL 完整表达 promotion 的 ADDED、MODIFIED 与 REMOVED 语义；未请求详情时不回传该比较内容。

### Section: Comparison 不参与 Review Digest

Candidate comparison availability 与 diff 输出 SHALL NOT 参与 review digest；digest SHALL 只绑定 Candidate 的审查内容。

- **Formal 状态在 Candidate 不变时变化**

  - 相同 Candidate 针对不同 comparison availability 进行校验
  - Candidate review digest 保持不变

### Section: 通过 Validation 呈现 Change 差异

xirang validate --change <name> SHALL 完整执行只读 Change 校验，默认只报告问题；成功且无问题时静默，JSON 模式同样适用。--preview SHALL 显式请求当前 Semantic Model 与 Expected Semantic Model 的差异预览，文本或 JSON 提供实体级 summary 与 concise entries，不创建展示文件。

系统 SHALL 使用同一 Change compiler 取得校验与差异，不注册独立 diff 命令，也不将预览持久化为 Change artifact。显式预览返回空变化也是有效查询结果；不能因成功静默规则吞掉请求的预览。

### Section: 完整处理 Element Definition

Deterministic Operations SHALL 在 IR、解析、校验、序列化、Semantic Delta、semantic diff、fingerprint、Candidate、Sync、查询、搜索与影响分析中保留完整 Element Definition，并 SHALL NOT 以展示 excerpt 替代或截断该规范文本。发现型 projection MAY 省略 Definition，但不得返回伪造摘要；显式 `arch query` 与 `arch query --contract` SHALL 返回选定 identity 的完整 Declaration 与 Contract。

- **发现与完整读取分离**

  - Agent 使用 search、outline 或 impact 定位范围
  - 这些发现 projection 可以只返回 identity、层级、匹配证据或关系摘要
  - Agent 对需要判断的 identity 使用 `arch query`，不得把发现结果当作完整语义

- **完整目标语义保持原样**

  - ADDED 或 MODIFIED Declaration、query、fingerprint、Candidate validation 与 Sync 需要 Definition
  - 使用完整 Definition 确定目标语义，不做摘要、截断或语义改写

### Section: 拒绝 Legacy Declaration Summary

Deterministic Operations SHALL 对当前 Semantic Model、Candidate 或活动 Change 中 Element Declaration 的 legacy `summary` 返回明确 ERROR，SHALL NOT 将其作为 alias、fallback 或未知字段静默删除。

- **Parser 遇到 Legacy Summary**

  - 当前输入的 `element-declaration` 包含 `summary`
  - 加载失败并指出应迁移为 `definition`

### Section: 隔离受控文件路径

Record lifecycle SHALL 仅操作 canonical `.xirang/records/` 下按合法文件名称寻址的 managed regular files，使用 Node.js path APIs、containment、lstat、symlink 拒绝。来源快照 `record-source.md` 与覆盖结果 `record-coverage.json` SHALL 仅写入显式 named Change 或 active Candidate 的受控位置。Windows、macOS 与 Linux SHALL 采用同一隔离语义。

- **Managed path 是 symlink**

  - 任一记录、来源快照或覆盖结果路径是 symlink 或逃逸受控根目录
  - CLI 返回稳定路径错误，不跟随链接也不写入目标

- **Windows 路径分隔符不同**

  - record 命令在 Windows project root 下构造 managed path
  - CLI 使用 Node.js path API 保持 `.xirang/records/` 与明确目标的 containment，并仅在 JSON presentation 中转换为 project-relative POSIX path

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

### Section: 使用 Verb-first CLI 与 Element Contract 术语

Deterministic Operations SHALL 仅通过顶层 verb-first commands 提供 Change 展示、列表与验证能力，并 SHALL 以 `contract` 作为 Element Contract 在 flags、type selectors、JSON discriminators、交互选项、completion 与 diagnostics 中的公开术语；CLI SHALL NOT 注册 deprecated `xirang change` command group，也 SHALL NOT 接受旧 `spec` forms 或 forwarding aliases。

- **使用唯一 Change 操作入口**

  - 用户运行顶层 `xirang show <change>`、`xirang list` 或 `xirang validate --change <change>`
  - CLI 提供对应有效能力，且 `xirang change ...` 不再是已注册 command group

- **创建 Change 不受影响**

  - 用户运行 `xirang new change <name>`
  - CLI 继续通过 verb-first `new` group 创建 Change

- **校验全部 Element Contracts**

  - 用户运行 `xirang validate --contracts --json`
  - CLI 校验 Formal Semantic Model 中携带 Contract 的 Elements，并以 `type: "contract"` 返回每项结果

- **按类型校验一个 Element Contract**

  - 用户运行 `xirang validate <element> --type contract`
  - CLI 以 Element identity 定位并校验其 Contract

- **拒绝旧公开形式**

  - 用户提供 `--specs`、`--type spec` 或 `xirang change ...`
  - CLI 将其视为未注册 option、type 或 command，而不静默转发到新形式

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

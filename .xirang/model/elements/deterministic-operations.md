---
entity: element-declaration
identity: deterministic-operations
kind: element
parent: cli
title: Deterministic Operations
definition: Deterministic Operations 在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
---

## Specification

### Section: 对模型和 Change 提供结构化操作

Deterministic Operations SHALL 支持 Semantic Model 与 Change 的查询、搜索、影响分析、差异、验证与派生呈现，并以 identity 而非文件位置寻址语义对象。

- **查询 Element**

  - Agent 按稳定 identity 查询 Element
  - CLI 返回其语义上下文

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

当前 Formal Semantic Model 不存在时，Candidate validation SHALL 返回 `comparison.baseline: absent`、`comparison.diff: unavailable` 与 `reason: formal-model-absent`，SHALL NOT 构造无效空 diff 或假设空 Formal Model。

- **构建首个 Formal Model**

  - 有效 Candidate 没有可比较的当前 Formal Model
  - validation 仍返回 review digest 且 comparison 明确不可用

### Section: Formal 存在时生成 Promotion Diff

当前 Formal Semantic Model 存在且有效时，Candidate validation SHALL 返回 `comparison.baseline: formal`、`comparison.diff: available`、Formal fingerprint 与从当前 Formal 到 Candidate 的真实 semantic diff。

- **Candidate 改变正式语义**

  - validation 比较有效 Formal Model 与 Candidate
  - diff entries 完整表达 promotion 将产生的 ADDED、MODIFIED 与 REMOVED 语义

### Section: Comparison 不参与 Review Digest

Candidate comparison availability 与 diff 输出 SHALL NOT 参与 review digest；digest SHALL 只绑定 Candidate 的审查内容。

- **Formal 状态在 Candidate 不变时变化**

  - 相同 Candidate 针对不同 comparison availability 进行校验
  - Candidate review digest 保持不变

### Section: 通过 Validation 呈现 Change 差异

Deterministic Operations SHALL 通过 `xirang validate --change <name>` 提供 Change 的只读文本差异预览与 JSON summary、entries 和 diagnostics，SHALL NOT 注册独立 `xirang diff` command 或将该差异持久化为 Change artifact。

- **校验 Change 并查看文本差异**

  - 用户或 Agent 运行 `xirang validate --change sample`
  - CLI 在校验结果中呈现当前 Semantic Model 与 Expected Semantic Model 的差异且不创建文件

- **获取结构化校验结果**

  - 用户或 Agent 运行 `xirang validate --change sample --json`
  - CLI 返回 validation status、summary、concise entries 与 diagnostics

- **调用已删除的 Diff command**

  - 用户或脚本运行 `xirang diff --change sample`
  - CLI 以 unknown command 失败且不修改 Change directory

### Section: 完整处理 Element Definition

Deterministic Operations SHALL 在 IR、解析、校验、序列化、Semantic Delta、semantic diff、fingerprint、Candidate、Sync、查询、搜索与影响分析中保留完整 Element Definition，并 SHALL NOT 以展示 excerpt 替代或截断该规范文本。

- **查询和搜索 Element**

  - Agent 通过 CLI query、search 或 impact 操作读取一个 Element
  - text 与 JSON 结果均返回完整 `definition`，search evidence 使用 `definition` 字段

- **比较和同步 Definition 变化**

  - ADDED 或 MODIFIED Declaration 携带完整目标 Definition
  - diff、fingerprint、Candidate validation 与 Sync 均以该完整文本确定目标语义

### Section: 拒绝 Legacy Declaration Summary

Deterministic Operations SHALL 对当前 Semantic Model、Candidate 或活动 Change 中 Element Declaration 的 legacy `summary` 返回明确 ERROR，SHALL NOT 将其作为 alias、fallback 或未知字段静默删除。

- **Parser 遇到 Legacy Summary**

  - 当前输入的 `element-declaration` 包含 `summary`
  - 加载失败并指出应迁移为 `definition`

### Section: 隔离受控文件路径

Framing lifecycle SHALL 仅操作 canonical .xirang/framing/ 下按合法记录身份寻址的 managed regular files，使用 Node.js path APIs、containment、lstat、symlink 拒绝与 filename/frontmatter 一致性检查。目标快照 SHALL 仅写入显式 named Change 或 active Candidate 的受控位置。Windows、macOS 与 Linux SHALL 采用同一隔离语义。

- **Managed path 是 symlink**

  - 任一记录或交接目标路径是 symlink 或逃逸受控根目录
  - CLI 返回稳定路径错误，不跟随链接也不写入目标

- **Windows 路径分隔符不同**

  - framing 在 Windows project root 下构造 managed path
  - CLI 使用 Node.js path API 保持 .xirang/framing/ 与明确消费目标的 containment，并仅在 JSON presentation 中转换为 project-relative POSIX path

### Section: 提供稳定 Framing JSON Contract

每个 `xirang framing` command SHALL 在 `--json` mode 向 stdout 输出唯一的 versioned envelope，区分 `ok`、`invalid` 与 `error` 并提供稳定 diagnostics 与 error codes。

- **Validation 发现相关 Drift**

  - command 成功读取对象但 关联上下文 已变化
  - JSON status 为 invalid、exit code 为 1 且不输出 spinner、颜色或 stack trace

### Section: 通过 Show 与 List 呈现 Change 编译结果

Deterministic Operations SHALL 从当前 Semantic Model 与 Change 的四分区 Semantic Delta 编译顶层 `show` JSON、顶层 `list` JSON 与 `--long` 文本结果，SHALL NOT 将 Change Plan 或 change-local `specs/` 作为 Semantic Delta 来源。

- **获取 Change JSON**

  - 用户或 Agent 运行 `xirang show sample --json`
  - CLI 返回 `id`、`title`、`valid`、实体级 `summary`、以 entity kind 和稳定 identity 表达的 concise `entries` 及 compiler `diagnostics`

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
  - `show` JSON 返回 `valid: false` 与结构化 `diagnostics`，且消费者不得将返回的 `entries` 视为有效目标状态

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

xirang framing create|list|show|status|validate|update|rename|consume|discard SHALL 管理非空已确认设计记录，以 exploration identity 寻址，使用统一 versioned 格式和彼此独立的 Build / Change 形成实例；CLI SHALL NOT 决定哪些用户内容重要。旧结构记录 SHALL 明确诊断不受支持，不自动迁移、删除或建立兼容副本。

- **创建并恢复记录**

  - create 接收合法 slug、明确形成上下文和已获用户授权的非空条目
  - 生成稳定 explorationId 并保存到受控位置，show 返回完整当前条目，list 与 status 可重新发现记录。

- **空记录和旧格式不隐式转换**

  - 输入为空或发现旧四分区结构记录
  - 拒绝无意义空记录或报告不支持的旧格式，既有文件不被迁移或删除。

### Section: 返回记录校验与上下文变化

Framing validation SHALL 分别报告格式、稳定身份、显式上下文关联与版本变化的确定性诊断，不推断自然语言冲突或完备性。相关上下文变化 SHALL 阻止复用旧检查结论；意图判断由 Agent 完成并由用户裁决。合法初始 Build 可无 formal model，存在而损坏的模型必须报错。

- **合法缺失与损坏分离**

  - 首次 Build 没有正式模型，或已有模型损坏
  - 前者可创建合法记录，后者失败并保持源与目标不变。

- **格式合法不等于意图完整**

  - 记录通过格式与身份检查但仍可能遗漏某个行为例外
  - CLI 只报告确定性有效性，不输出已完成语义覆盖的结论。

### Section: 确定性交接确认来源

framing consume SHALL 显式选择 named Change 或 active Candidate，核对当前源版本及适用目标校验；Agent 必须先完成该版本记录到目标的覆盖复核，CLI SHALL NOT 用四类结构相等或字符串存在性代替该语义判断。CLI SHALL 先保存精确来源快照，再完成适用校验，最后删除活动来源；任何前置失败 SHALL 保留来源与原有目标。同字节快照允许重验后恢复，冲突快照必须停止。

- **相同快照恢复交接**

  - 上次交接在复制后中断且来源与目标快照字节相同
  - 重验源版本及目标后完成清理，不覆盖来源快照。

- **冲突或失败保留来源**

  - 目标已有不同快照、版本变化或目标校验失败
  - 返回错误，保留活动来源及既有目标，不声明交接完成。

- **显式选择消费目标**

  - 同一项目存在活动 Candidate 与多个 Changes
  - 只向命令明确指定的合法目标交接，不从当前目录猜测目标。

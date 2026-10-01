---
entity: element-declaration
identity: deterministic-operations
kind: element
parent: cli
title: Deterministic Operations
definition: Deterministic Operations 在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
---

## MODIFIED Sections

### Section: 隔离受控文件路径

Record lifecycle SHALL 仅操作 canonical `.xirang/records/` 下按合法记录身份寻址的 managed regular files，使用 Node.js path APIs、containment、lstat、symlink 拒绝与 filename/frontmatter 一致性检查。来源快照 `record-source.md` 与覆盖结果 `record-coverage.json` SHALL 仅写入显式 named Change 或 active Candidate 的受控位置。Windows、macOS 与 Linux SHALL 采用同一隔离语义。

- **Managed path 是 symlink**

  - 任一记录、来源快照或覆盖结果路径是 symlink 或逃逸受控根目录
  - CLI 返回稳定路径错误，不跟随链接也不写入目标

- **Windows 路径分隔符不同**

  - record 命令在 Windows project root 下构造 managed path
  - CLI 使用 Node.js path API 保持 `.xirang/records/` 与明确目标的 containment，并仅在 JSON presentation 中转换为 project-relative POSIX path

### Section: 管理统一确认记录生命周期

`xirang record create|list|show|status|validate|update|rename|coverage|consume|discard` SHALL 管理非空已确认设计记录，以 explorationId 寻址，使用统一 versioned 格式和彼此独立的 Build / Change 形成实例；update 只接收本次变化并以 `--source-version` 拒绝过期写入，写入后返回差异与记录概况而非完整内容。CLI SHALL NOT 决定哪些用户内容重要，也不提供 `xirang framing` 兼容别名。旧格式记录 SHALL 明确诊断不受支持，不自动迁移、删除或建立兼容副本。

- **创建并恢复记录**

  - create 接收合法 slug、明确形成上下文与非空条目或结构对象
  - 生成稳定 explorationId 并保存到受控位置，show 返回完整当前内容，list 与 status 可重新发现记录。

- **空记录和旧格式不隐式转换**

  - 输入为空或发现旧 schemaVersion 记录
  - 拒绝无意义空记录或报告不支持的旧格式，既有文件不被迁移或删除。

- **版本过期拒绝写入**

  - update 携带的 sourceVersion 与当前记录不一致
  - 拒绝写入并返回当前版本，记录不变。

### Section: 返回记录校验与上下文变化

Record validation SHALL 分别报告格式、稳定身份、结构部分的 Kind / parent / Relationship 端点解析、显式上下文关联与版本变化的确定性诊断，不推断自然语言冲突或完备性。相关上下文变化 SHALL 阻止复用旧检查结论；意图判断由 Agent 完成并由用户裁决。合法初始 Build 可无 formal model，存在而损坏的模型必须报错。

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

`xirang record consume` SHALL 显式选择 named Change 或 active Candidate，核对当前源版本，并要求目标中存在绑定当前 sourceVersion 与目标指纹的有效覆盖结果；覆盖结果由 `xirang record coverage` 在校验每条 normative 条目均有原子细节且位置真实存在后记录。consume SHALL 逐字段比对记录结构部分与目标模型，不一致即拒绝。CLI SHALL 先保存精确来源快照，再完成适用校验，最后删除活动记录；任何前置失败 SHALL 保留活动记录与原有目标。同字节快照允许重验后恢复，冲突快照必须停止。CLI 只证明检查已执行、位置存在与结构一致，SHALL NOT 以此代替语义覆盖判断。

- **缺少有效覆盖结果**

  - 目标中没有覆盖结果，或其绑定的版本或指纹已过期
  - 拒绝交接并要求重新执行覆盖检查。

- **相同快照恢复交接**

  - 上次交接在复制后中断且来源与目标快照字节相同
  - 重验源版本、覆盖结果及目标后完成清理，不覆盖来源快照。

- **冲突或失败保留来源**

  - 目标已有不同快照、版本变化、结构不一致或目标校验失败
  - 返回错误，保留活动记录及既有目标，不声明交接完成。

- **显式选择消费目标**

  - 同一项目存在活动 Candidate 与多个 Changes
  - 只向命令明确指定的合法目标交接，不从当前目录猜测目标。

## ADDED Sections

### Section: 提供稳定 Record JSON Contract

每个 `xirang record` command SHALL 在 `--json` mode 向 stdout 输出唯一的 versioned envelope，区分 `ok`、`invalid` 与 `error` 并提供稳定 diagnostics 与 error codes。

- **Validation 发现相关 Drift**

  - command 成功读取对象但关联上下文已变化
  - JSON status 为 invalid、exit code 为 1 且不输出 spinner、颜色或 stack trace

## REMOVED Sections

### Section: 提供稳定 Framing JSON Contract

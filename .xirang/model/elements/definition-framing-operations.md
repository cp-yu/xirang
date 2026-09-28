---
entity: element-declaration
identity: definition-framing-operations
kind: element
parent: deterministic-operations
title: Definition Framing Operations
definition: Definition Framing Operations 是统一管理已确认设计记录的 CLI 确定性操作集合。它封装记录的生命周期、相关上下文、差异及面向 Build 和 Change 的交接，不包含自然语言设计裁决、完整性语义判断或正式模型提升。
---

## Specification

### Section: 隔离受控文件路径

Framing lifecycle SHALL 仅操作 canonical .xirang/framing/ 下按合法记录身份寻址的 managed regular files，使用 Node.js path APIs、containment、lstat、symlink 拒绝与 filename/frontmatter 一致性检查。目标快照 SHALL 仅写入显式 named Change 或 active Candidate 的受控位置。Windows、macOS 与 Linux SHALL 采用同一隔离语义。

- **Managed path 是 symlink**

  - 任一记录或交接目标路径是 symlink 或逃逸受控根目录
  - 返回稳定路径错误，不跟随链接也不写入目标。

- **Windows 路径隔离**

  - 命令在 Windows 上创建、读取、更新或交接记录
  - 使用平台 path API 和同一 containment 规则，存储的项目相对路径保持 canonical 表示。

### Section: 提供稳定 Framing JSON Contract

每个 `xirang framing` command SHALL 在 `--json` mode 向 stdout 输出唯一的 versioned envelope，区分 `ok`、`invalid` 与 `error` 并提供稳定 diagnostics 与 error codes。

- **Validation 发现相关 Drift**

  - command 成功读取对象但 关联上下文 已变化
  - JSON status 为 invalid、exit code 为 1 且不输出 spinner、颜色或 stack trace

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

### Section: 返回确认条目的相对变化

framing update SHALL 按稳定条目 identity 返回 added / modified / removed 差异：added 给出新增条目，modified 包含完整 before / after，removed 包含完整旧条目。合法显式更新返回 ok；差异供 Agent 审查，不代表用户已授权所有变化，也不构成自然语言冲突判断。

- **更新差异完整可审查**

  - 替换内容新增、修改或省略现有条目
  - 分别返回完整 added、before/after 和 removed 内容，使意外遗忘可见。

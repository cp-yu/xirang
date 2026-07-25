---
element: cap.verify.freshness-engine
---

# verify-freshness-engine Specification

## Purpose
Define the reviewed Consistency and Freshness Gate contract for tasksFileHash 计算; evidenceFingerprint 计算; Freshness 判定; and 6 additional reviewed Requirements.

## Requirements
### Requirement: tasksFileHash 计算

系统 SHALL 提供 `computeTasksFileHash(tasksPath)` 函数，计算 `tasks.md` 文件内容的 SHA-256 哈希。

#### Scenario: 正常计算

- **WHEN** 调用 `computeTasksFileHash('/path/to/tasks.md')`
- **AND** 文件存在且可读
- **THEN** 系统 SHALL 返回文件内容的 SHA-256 十六进制字符串
- **AND** 使用 `crypto.createHash('sha256')`

#### Scenario: 文件不存在

- **WHEN** 调用 `computeTasksFileHash('/path/to/missing.md')`
- **AND** 文件不存在
- **THEN** 系统 SHALL 返回 `null`

### Requirement: evidenceFingerprint 计算

系统 SHALL 提供 `computeEvidenceFingerprint(evidenceFiles, projectRoot)`，按规范化相对 POSIX 路径排序并基于文件内容 SHA-256 生成整体指纹；`.verify-result.json` SHALL 被排除。Windows 路径 SHALL 使用 Node.js path API 规范化。

每个 finding 通过 Phase 2 verification 时，系统 SHALL 在持久化前重算顶层 `verificationContext.evidenceFingerprint` 和 entries，使其反映当前成功 checkpoint。Finding-level target hashes SHALL 独立用于 optimizer 裁决后、master 实施前的新鲜度检查。

#### Scenario: Phase 2 finding PASS 后更新 fingerprint
- **WHEN** selected finding 的 reviewer verdict 为 PASS 或 PASS_WITH_WARNINGS
- **THEN** 系统 SHALL 从顶层 evidenceFiles 重算 fingerprint 和 entries
- **AND** SHALL 在一次 write 中更新 verificationContext

#### Scenario: 失败回滚不更新 fingerprint
- **WHEN** selected finding 验证失败且工作区回滚到最近成功 checkpoint
- **THEN** 系统 SHALL 保持最近成功状态的 evidence fingerprint

#### Scenario: 内容未变时 hash 稳定
- **WHEN** 文件内容未变但 mtime 或 size 元数据变化
- **THEN** evidence fingerprint 与 finding target hash SHALL 保持一致

### Requirement: Freshness 判定

系统 SHALL 提供 `checkFreshness(changeDir, projectRoot)` 函数，判定 `.verify-result.json` 的 freshness。

当 freshness 为 STALE 时，`details` 数组 SHALL 只包含阻塞 freshness 的诊断：

- fingerprint 不匹配时：列出 hash 变更的证据文件及其相对路径，格式为 `evidenceFingerprint mismatch — modified files: <path1>, <path2>, ...`
- 其他检查项（contractVersion、resultAcceptable）保持现有描述格式

当记录的 git HEAD 与当前 HEAD 不匹配时，系统 SHALL 将该差异写入 `information.gitHeadCommit`，不得将其写入 `checks` 或 `details`，且该信息 SHALL NOT 单独导致 STALE。

指纹差异计算 SHALL 通过对比 `.verify-result.json` 中记录的 `evidenceFingerprint.entries` 与重新计算的文件 hash 来确定变更文件列表。

#### Scenario: FRESH 判定

- **WHEN** 调用 `checkFreshness`
- **AND** `.verify-result.json` 存在
- **AND** `evidenceFingerprint` 匹配重新计算值
- **AND** `contractVersion` 为 `"1.0"`
- **AND** `result` 为 PASS 或 PASS_WITH_WARNINGS
- **THEN** 返回 `status: 'FRESH'`
- **AND** `checks` 只包含 freshness 硬条件
- **AND** `information` 可包含 Git HEAD 诊断信息

`tasksFileHash` SHALL NOT 参与 FRESH 判定 — tasks.md 已在 evidenceFiles 中被 evidenceFingerprint 覆盖，且 verify 后标记完成导致其内容必然变化。

#### Scenario: STALE 因 evidenceFingerprint 不匹配

- **WHEN** 调用 `checkFreshness`
- **AND** `.verify-result.json` 存在
- **AND** 重新计算的指纹与记录的 `evidenceFingerprint` 不一致
- **THEN** `status` 为 `STALE`
- **AND** `checks.evidenceFingerprint` 为 `false`
- **AND** `details` 包含一条以 `evidenceFingerprint mismatch — modified files:` 开头的条目
- **AND** 该条目 SHALL 列出所有 hash 不一致的文件路径

#### Scenario: FRESH 但 gitHeadCommit 不匹配

- **WHEN** 调用 `checkFreshness`
- **AND** 记录的 `gitHeadCommit` 与当前 HEAD 不一致
- **AND** 其他 freshness 硬条件均通过
- **THEN** `status` 为 `FRESH`
- **AND** `checks` SHALL NOT contain `gitHeadCommit`
- **AND** `details` SHALL NOT contain a Git HEAD failure or warning entry
- **AND** `information.gitHeadCommit` SHALL contain `matches: false`
- **AND** `information.gitHeadCommit` SHALL 包含 `recorded` 和 `current`（两者均可用时）

#### Scenario: 多处同时不匹配

- **WHEN** 调用 `checkFreshness`
- **AND** evidenceFingerprint 与 gitHeadCommit 同时不匹配
- **THEN** `status` 为 `STALE`
- **AND** `details` SHALL contain the fingerprint mismatch diagnostic
- **AND** `information.gitHeadCommit.matches` SHALL 为 `false`
- **AND** Git HEAD 信息 SHALL NOT 改变 stale 判定

### Requirement: Archive Compatibility 判定

`checkArchiveCompatibility` SHALL 继续将 SKIPPED、NOT_NEEDED、IMPROVED 和 DEGRADED 判定为 compatible，将 ABORTED_UNSAFE 和 PENDING_VERIFICATION 判定为不兼容。Finding 内部状态 MUST NOT 新增外部 archive terminal status。

旧 `.verify-result.json` 缺少 optimization 或 findings/history 时 SHALL 保持向后兼容。

#### Scenario: finding workflow 的兼容终态
- **WHEN** optimization.status 为 IMPROVED
- **AND** findings history 包含 resolved、invalidated 或 rejected findings
- **THEN** archive compatibility SHALL 返回 compatible true

#### Scenario: selected finding 尚未验证
- **WHEN** optimization.status 为 PENDING_VERIFICATION
- **AND** 存在 selected 或 implemented finding
- **THEN** archive compatibility SHALL 返回 compatible false

#### Scenario: legacy 结果无 findings
- **WHEN** 旧 verify result 不包含 findings/history
- **THEN** archive compatibility SHALL 使用现有 optimization.status 判定
- **AND** SHALL NOT 因新字段缺失而失败

### Requirement: formatVerifyGateFailure 输出格式

系统 SHALL 提供 `formatVerifyGateFailure(freshness, archiveCompatibility?)` 函数，生成结构化的 verify gate 失败消息。

输出 SHALL 按以下结构组织：

```
✗ Verify gate failed — <简述失败原因>

  证据文件指纹不匹配:
    - <相对路径>
    - <相对路径>

  建议操作:
    xirang verify phase1 <change-name>  # 重新验证
    xirang <command> <change-name> --no-verify  # 跳过门禁 (风险自负)
```

其中 `<command>` 由调用上下文决定 — sync 场景为 `xirang sync`，archive 场景为 `xirang archive`。如果 `archiveCompatibility` 指示不兼容，输出中 SHALL 包含对应的 `blockReason`。非阻塞的 Git HEAD informational 数据 SHALL NOT 作为失败段落输出。

如果没有任何指纹不匹配的文件，指纹部分 SHALL 被省略。

#### Scenario: 全部信息输出

- **WHEN** 调用 `formatVerifyGateFailure` 且 fingerprint 不匹配
- **AND** `archiveCompatibility` 不兼容（blockReason = PENDING_VERIFICATION）
- **THEN** 输出 SHALL 包含指纹不匹配的文件列表
- **AND** 包含 `archiveCompatibility: PENDING_VERIFICATION`
- **AND** 末尾包含建议操作段落
- **AND** 输出 SHALL NOT 包含 Git HEAD failure section

#### Scenario: 部分信息省略

- **WHEN** fingerprint 未通过但 git HEAD 不匹配
- **THEN** 输出 SHALL 包含 fingerprint 阻塞诊断
- **AND** 输出 SHALL 省略 Git HEAD 段落

#### Scenario: archive 上下文的建议操作

- **WHEN** `formatVerifyGateFailure` 用于 archive 命令的 verify gate 失败
- **THEN** 建议操作中 SHALL 使用 `xirang archive` 而非 `xirang sync`

### Requirement: sync 后 evidence fingerprint 增量刷新函数

系统 SHALL 提供 `refreshVerifyEvidenceAfterSync(changeDir, projectRoot, syncedFiles)` 函数，在 sync 完成后增量更新 `.verify-result.json` 中的 evidence fingerprint。

`syncedFiles` 参数 SHALL 是相对于 `projectRoot` 的 POSIX 路径数组，表示本次 sync 实际写入的文件集合。

函数 SHALL 读取 `.verify-result.json`，对 `evidenceFingerprintEntries` 中路径匹配 `syncedFiles` 的条目：
- 使用 `resolveEvidencePath` + `toPosixRelative` 进行路径标准化和比较（与 `computeEvidenceFingerprint` 使用相同函数）
- 读取当前文件内容，重算 SHA-256 哈希
- 更新 entry 的 hash 值

若任何 entry 被更新，SHALL 重算整体 `evidenceFingerprint`（对所有 entries 按路径排序后 JSON.stringify → SHA-256），并写回 `.verify-result.json`。

#### Scenario: 正常刷新

- **WHEN** 调用 `refreshVerifyEvidenceAfterSync(changeDir, projectRoot, ['.xirang/architecture/model.c4'])`
- **AND** `.verify-result.json` 存在且该路径在 entries 中
- **THEN** 重算该 entry 的 hash
- **AND** 重算 overall evidenceFingerprint
- **AND** 写回 `.verify-result.json`

#### Scenario: 无匹配路径

- **WHEN** 调用 `refreshVerifyEvidenceAfterSync` 且 `syncedFiles` 中无路径匹配任何 entry
- **THEN** 不修改 `.verify-result.json`

#### Scenario: .verify-result.json 不存在

- **WHEN** 调用 `refreshVerifyEvidenceAfterSync` 且 `.verify-result.json` 不存在
- **THEN** 静默返回，不报错

#### Scenario: 跨平台路径匹配

- **WHEN** 在 Windows 上调用 `refreshVerifyEvidenceAfterSync`
- **AND** `syncedFiles` 包含 `.xirang/architecture/model.c4`
- **AND** evidence entries 中也包含 `.xirang/architecture/model.c4`
- **THEN** 路径比较 SHALL 使用 POSIX 正斜杠标准化
- **AND** SHALL 正确匹配同一文件

### Requirement: Phase 2 验证通过后同步更新顶层快照

在 Phase 2 verification PASS 时，系统 SHALL 同步更新顶层 `verificationContext` 的三个时间敏感字段，确保快照自洽性。

#### Scenario: Phase 2 verification PASS 同步更新

- **GIVEN** Phase 2 optimization 已提议且文件已应用 patch
- **AND** `current.optimization.status === 'PENDING_VERIFICATION'`
- **WHEN** `handleVerification` 接收到 `input.result === 'PASS'` 或 `'PASS_WITH_WARNINGS'`
- **THEN** 系统 SHALL 调用 `computeEvidenceFingerprint(current.verificationContext.evidenceFiles, projectRoot)`
- **AND** SHALL 将返回的 `evidence.hash` 赋值给 `current.verificationContext.evidenceFingerprint`
- **AND** SHALL 将返回的 `evidence.entries` 赋值给 `current.verificationContext.evidenceFingerprintEntries`
- **AND** SHALL 调用 `await getGitHead(projectRoot)` 获取当前 HEAD
- **AND** SHALL 将获取的 commit SHA 赋值给 `current.verificationContext.gitHeadCommit`
- **AND** SHALL 将 `new Date().toISOString()` 赋值给 `current.verificationContext.timestamp`
- **AND** SHALL 在一次 `writeVerifyResult` 调用中原子性持久化所有字段

#### Scenario: baseline 快照保持不变

- **GIVEN** Phase 2 verification PASS 更新了顶层 `verificationContext`
- **WHEN** 读取 `current.optimization.baseline.verificationContext`
- **THEN** baseline 的 `gitHeadCommit` SHALL 保持为 Phase 1 时的 commit SHA
- **AND** baseline 的 `evidenceFingerprintEntries` SHALL 保持为 Phase 1 时的文件哈希
- **AND** baseline 的 `timestamp` SHALL 保持为 Phase 1 执行时刻

### Requirement: verificationContext 快照诊断字段

系统 SHALL 维护 `evidenceFingerprintEntries` 与 `evidenceFingerprint` 的自洽性不变式。`gitHeadCommit` 和 `timestamp` SHALL 作为采样诊断字段记录，不参与 freshness 硬判定。

#### Scenario: 顶层证据指纹自洽

- **GIVEN** Phase 2 verification 已完成且 `optimization.status === 'IMPROVED'`
- **WHEN** 读取 `verificationContext.evidenceFingerprintEntries`
- **THEN** `SHA256(JSON.stringify(evidenceFingerprintEntries))` SHALL 等于 `evidenceFingerprint`
- **AND** `timestamp` SHALL 为 ISO 8601 格式
- **AND** `gitHeadCommit` SHALL 保留采样时的 commit SHA（如果可用）

### Requirement: Selected finding 新鲜度校验

CLI SHALL 在 optimizer reconciliation 时为 selected finding 的目标文件记录 SHA-256 hashes，并在 master 实施前重新计算。路径 SHALL 通过项目既有跨平台规范化逻辑转换为项目相对 POSIX 路径。

若任何目标文件 hash 变化，selected finding SHALL 视为 stale；系统 MUST NOT 允许实施，并 SHALL 要求重新调用 optimizer reconciliation。

#### Scenario: 目标文件未变化
- **WHEN** selected finding 创建后其全部目标文件内容未变
- **THEN** 新鲜度校验 SHALL 通过
- **AND** master MAY 开始实现该 finding

#### Scenario: 目标文件发生变化
- **WHEN** selected finding 创建后任一目标文件内容发生变化
- **THEN** CLI SHALL 拒绝进入 implemented 状态
- **AND** SHALL 返回需要重新 reconciliation 的诊断

#### Scenario: Windows 路径正确匹配
- **WHEN** Windows 输入使用反斜杠表示 finding location
- **THEN** CLI SHALL 将其规范化为相对 POSIX 路径后查找和计算 hash
- **AND** SHALL 与 optimizer 持久化路径匹配

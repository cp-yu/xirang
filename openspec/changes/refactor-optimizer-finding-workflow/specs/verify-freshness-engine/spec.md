## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: evidenceFingerprint 计算

系统 SHALL 提供 `computeEvidenceFingerprint(evidenceFiles, projectRoot)`，按规范化相对 POSIX 路径排序并基于文件内容 SHA-256 生成整体指纹；`.verify-result.json` SHALL 被排除。Windows 路径 SHALL 使用 Node.js path API 规范化。

每个 finding 通过 Phase 2 verification 时，系统 SHALL 在持久化前重算顶层 `verificationContext.evidenceFingerprint` 和 entries，使其反映当前成功 checkpoint。Finding-level target hashes SHALL 独立用于 optimizer 裁决后、master 实施前的新鲜度检查。

#### Scenario: [ADDED] Phase 2 finding PASS 后更新 fingerprint
- **WHEN** selected finding 的 reviewer verdict 为 PASS 或 PASS_WITH_WARNINGS
- **THEN** 系统 SHALL 从顶层 evidenceFiles 重算 fingerprint 和 entries
- **AND** SHALL 在一次 write 中更新 verificationContext

#### Scenario: [ADDED] 失败回滚不更新 fingerprint
- **WHEN** selected finding 验证失败且工作区回滚到最近成功 checkpoint
- **THEN** 系统 SHALL 保持最近成功状态的 evidence fingerprint

#### Scenario: [ADDED] 内容未变时 hash 稳定
- **WHEN** 文件内容未变但 mtime 或 size 元数据变化
- **THEN** evidence fingerprint 与 finding target hash SHALL 保持一致

#### Scenario: [REMOVED] 正常计算

- **WHEN** 调用 `computeEvidenceFingerprint(['src/a.ts', 'src/b.ts'], projectRoot)`
- **AND** 所有文件存在
- **THEN** 系统 SHALL 对 `evidenceFiles` 按字母排序
- **AND** SHALL 对每个文件收集：标准化相对 POSIX 路径 + 文件内容 SHA-256 哈希
- **AND** SHALL 将所有 entries 通过 `JSON.stringify` 序列化后计算 SHA-256 作为整体指纹
- **AND** 返回十六进制哈希字符串

#### Scenario: [REMOVED] 排除 .verify-result.json

- **WHEN** 调用 `computeEvidenceFingerprint` 且 evidenceFiles 包含以 `.verify-result.json` 为文件名的路径
- **THEN** 系统 SHALL 使用 `path.basename` 检测该文件
- **AND** SHALL 将该文件放入 `skippedFiles`
- **AND** SHALL NOT 将该文件纳入 `entries` 参与哈希计算
- **AND** 不影响其他 evidenceFile 的正常处理

#### Scenario: [REMOVED] 跨平台路径处理

- **WHEN** 在 Windows 上调用 `computeEvidenceFingerprint` 传入 `['src\\a.ts']`
- **THEN** 系统 SHALL 使用 `path.join()`、`path.resolve()`、`path.normalize()` 处理路径
- **AND** SHALL 持久化路径为相对 POSIX 格式（正斜杠）
- **AND** SHALL NOT 硬编码路径分隔符

#### Scenario: [REMOVED] 部分文件不存在

- **WHEN** 某个 evidenceFile 在磁盘上不存在
- **THEN** 系统 SHALL 排除该文件
- **AND** 在返回结果中标注被跳过的文件

#### Scenario: [REMOVED] 内容哈希稳定性

- **WHEN** 证据文件内容未变更
- **AND** 文件 mtime 或 size 因文件系统操作（git checkout、编辑器保存）发生变化
- **THEN** 系统 SHALL 产生与之前相同的指纹哈希
- **AND** `checkFreshness` SHALL 判定为 FRESH

#### Scenario: [REMOVED] Phase 2 verification PASS 后 fingerprint 更新

- **WHEN** `handleVerification` 收到 `result` 为 PASS 或 PASS_WITH_WARNINGS
- **AND** `optimization.status` 从 PENDING_VERIFICATION 转为 IMPROVED
- **THEN** 系统 SHALL 从 `current.verificationContext.evidenceFiles` 读取证据文件列表
- **AND** SHALL 调用 `computeEvidenceFingerprint(evidenceFiles, projectRoot)` 重算指纹
- **AND** SHALL 将新指纹写入 `current.verificationContext.evidenceFingerprint`
- **AND** SHALL 在上述更新完成后才调用 `writeVerifyResult`

#### Scenario: [REMOVED] Phase 2 verification PASS 后 verify status 返回 FRESH

- **WHEN** Phase 2 verification 通过且 fingerprint 已更新
- **AND** 随后调用 `openspec verify status`
- **AND** 磁盘文件未再发生变更
- **THEN** `checkFreshness` SHALL 返回 `status: 'FRESH'`

#### Scenario: [REMOVED] DEGRADED 路径不更新 fingerprint

- **WHEN** `handleVerification` 收到 `result` 为 FAIL_NEEDS_REMEDIATION
- **AND** 重试次数已耗尽，`optimization.status` 转为 DEGRADED
- **THEN** 系统 SHALL NOT 重算 `evidenceFingerprint`
- **AND** 原始 Phase 1 fingerprint 保持不变（因为 checkpoint 已恢复磁盘文件到 Phase 1 状态）

### Requirement: Archive Compatibility 判定

`checkArchiveCompatibility` SHALL 继续将 SKIPPED、NOT_NEEDED、IMPROVED 和 DEGRADED 判定为 compatible，将 ABORTED_UNSAFE 和 PENDING_VERIFICATION 判定为不兼容。Finding 内部状态 MUST NOT 新增外部 archive terminal status。

旧 `.verify-result.json` 缺少 optimization 或 findings/history 时 SHALL 保持向后兼容。

#### Scenario: [ADDED] finding workflow 的兼容终态
- **WHEN** optimization.status 为 IMPROVED
- **AND** findings history 包含 resolved、invalidated 或 rejected findings
- **THEN** archive compatibility SHALL 返回 compatible true

#### Scenario: [ADDED] selected finding 尚未验证
- **WHEN** optimization.status 为 PENDING_VERIFICATION
- **AND** 存在 selected 或 implemented finding
- **THEN** archive compatibility SHALL 返回 compatible false

#### Scenario: [ADDED] legacy 结果无 findings
- **WHEN** 旧 verify result 不包含 findings/history
- **THEN** archive compatibility SHALL 使用现有 optimization.status 判定
- **AND** SHALL NOT 因新字段缺失而失败

#### Scenario: [REMOVED] Compatible

- **WHEN** `optimization.status` 为 SKIPPED、NOT_NEEDED、IMPROVED 或 DEGRADED
- **THEN** 返回 `{ compatible: true }`

#### Scenario: [REMOVED] ABORTED_UNSAFE 阻塞

- **WHEN** `optimization.status` 为 ABORTED_UNSAFE
- **THEN** 返回 `{ compatible: false, blockReason: 'ABORTED_UNSAFE' }`

#### Scenario: [REMOVED] Legacy 无 optimization 字段

- **WHEN** `.verify-result.json` 不包含 `optimization` 字段
- **THEN** 返回 `{ compatible: true }`（向后兼容）

#### Scenario: [REMOVED] PENDING_VERIFICATION 阻塞

- **WHEN** `optimization.status` 为 PENDING_VERIFICATION
- **THEN** 返回 `{ compatible: false, blockReason: 'PENDING_VERIFICATION' }`

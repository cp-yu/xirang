## MODIFIED Requirements

### Requirement: Archive Process

Archive SHALL 在 verify、sync、task 与 final change validation gates 通过后，重新生成与最终 Formal/change fingerprints 匹配的 `effective-change.md`，再将 active change directory 移动到 date-prefixed archive path。Archive MUST NOT 再次修改 Formal Semantic Model。

#### Scenario: 直接归档
- **WHEN** 所有 gates 通过且 change directory 存在
- **THEN** SHALL 运行等价于 `opsx diff --change <name> --write` 的 final report generation
- **AND** SHALL 确认 report status 为 Passed 且 fingerprints 当前
- **AND** SHALL 将 change directory 移动到 `YYYY-MM-DD-<change-name>`
- **AND** SHALL 输出 git handoff 提醒
- **AND** SHALL NOT 执行 git 写操作

#### Scenario: 已归档 change 检测
- **WHEN** target archive path 已存在且 active change 不存在
- **THEN** SHALL 输出已归档状态与 git handoff 提醒后退出

#### Scenario: Final report generation 失败
- **WHEN** final validation、Diff IR 或 `effective-change.md` atomic write 失败
- **THEN** SHALL 终止 archive
- **AND** active change directory SHALL 保持原样

#### Scenario: 归档失败不回写
- **WHEN**任一 archive gate 失败
- **THEN** SHALL 不移动 change directory
- **AND** SHALL NOT 修改 Formal Semantic Model

### Requirement: Archive Validation

Archive SHALL 在移动 change 前执行完整 change compiler validation，并要求 final generated review artifact 与当前 inputs 一致。`--no-validate` MAY 跳过一般 validation gate，但 MUST NOT 产生伪造的 Passed review report。

#### Scenario: Pre-archive validation
- **WHEN** 执行 `opsx archive change-name`
- **THEN** SHALL materialize Target Semantic Model 并验证完整 Semantic Delta
- **AND** validation 通过后 SHALL 生成 final `effective-change.md`

#### Scenario: Force archive without validation
- **WHEN** 执行 `opsx archive change-name --no-validate`
- **THEN** SHALL 显示 unsafe warning
- **AND** generated report SHALL 明确反映实际 validation 状态
- **AND** MUST NOT 将未验证结果标记为 Passed

#### Scenario: 跨平台 archive report path
- **WHEN** archive 在 Windows、macOS 或 Linux 生成并移动 report
- **THEN** SHALL 使用 Node.js path API 构造 active 与 archive paths
- **AND** SHALL 保留 report 内容字节不变

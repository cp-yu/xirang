---
entity: element-declaration
identity: change-sync
kind: element
parent: change-closure
title: Change Sync
definition: Change Sync 定义将 Change 的四分区 Semantic Delta 同步到正式 Semantic Model 的行为：从 immutable Formal snapshot 物化完整 Target Semantic Model、联合验证、原子写入与回滚、幂等判定、evidence fingerprint 增量刷新，以及 `xirang sync` 命令面的选择与门禁行为。
---
## MODIFIED Requirements

### Requirement: 同步执行

`xirang sync` SHALL 在 quality gate 通过后，从 immutable Formal snapshot 将 change-local 四分区 operations materialize 为一个完整 Target Semantic Model，执行 combined validation 与 fingerprint freshness check，再原子写入干净 formal modules。Sync SHALL NOT 生成 review metadata 或静默迁移记法版本。

#### Scenario: quality gate 失败输出指引
- **WHEN** 当前代码与通过的 Review 记录不一致，或 archive compatibility 不满足
- **THEN** SHALL 输出 changed files、重新执行 Review 的命令与 `--no-verify` option
- **AND** exit code SHALL 非零

#### Scenario: quality gate 通过后执行同步
- **WHEN** 代码状态为 `clean` 且 archive compatible
- **THEN** SHALL 构造 Target Semantic Model 与内部 Diff IR
- **AND** validation 与 Formal fingerprint recheck 通过后 SHALL 原子写入 formal 分区

#### Scenario: --no-verify 跳过 gate
- **WHEN** 用户运行 `xirang sync <change> --no-verify`
- **THEN** SHALL 跳过 quality gate
- **AND** MUST NOT 跳过 syntax、identity、integrity、fingerprint 与 target validation

#### Scenario: sync 不修改 change review source
- **WHEN** sync prepares Semantic Delta
- **THEN** MUST NOT 修改 change-local source
- **AND** MUST NOT 生成 Scenario operation metadata

#### Scenario: 同步后 evidence fingerprint 刷新
- **WHEN** sync 成功写入 formal 单元
- **THEN** SHALL 只刷新与实际 outputs 重叠的 evidence hashes
- **AND** SHALL 使用当前 `.xirang/model/` 路径

#### Scenario: sync 不生成持久化 review 输出
- **WHEN** sync 成功写入 formal 单元
- **THEN** SHALL NOT 创建、更新或删除任何持久化 review 输出
- **AND** effective diff 仅由只读 `xirang validate --change` 提供

#### Scenario: Review 记录与当前代码一致
- **WHEN** archive sync 运行时存在与当前代码一致的 Review 记录
- **THEN** system SHALL continue sync logic

#### Scenario: --no-verify 开关
- **WHEN** 用户执行 `xirang sync my-change --no-verify`
- **THEN** `skipVerify` 设为 `true`
- **AND** 不调用质量记录判定
- **AND** 同步照常执行

#### Scenario: Review 记录缺失或状态为 dirty
- **WHEN** archive sync 运行时不存在与当前代码一致的通过记录
- **THEN** system SHALL stop and require quality Review first

### Requirement: sync 完成后刷新 evidence fingerprint

sync 完成所有文件写入后，系统 SHALL 检测 change 目录下是否存在 `.quality-state.json`；若存在，SHALL 对 evidenceFingerprintEntries 中路径与本次 sync 输出重叠的条目重算文件哈希，并更新 evidenceFingerprint。

#### Scenario: evidence 中有 sync 输出文件时刷新
- **GIVEN** `.quality-state.json` 存在且包含与 sync 输出重叠的 evidence entries
- **WHEN** sync 完成写入
- **THEN** 系统 SHALL 重算受影响条目的 SHA-256 哈希
- **AND** SHALL 重算整体 `evidenceFingerprint` 并写回 `.quality-state.json`

#### Scenario: evidence 中无 sync 输出文件时跳过
- **GIVEN** `.quality-state.json` 存在且无重叠路径
- **WHEN** sync 完成写入
- **THEN** 系统 SHALL NOT 修改 `.quality-state.json`
- **AND** SHALL NOT 报错

#### Scenario: 记录不存在时跳过
- **GIVEN** change 目录下不存在 `.quality-state.json`
- **WHEN** sync 完成写入
- **THEN** 系统 SHALL 静默跳过刷新步骤

#### Scenario: 刷新后证据文件再次被外部修改
- **GIVEN** sync 后 evidence fingerprint 已刷新为一致
- **WHEN** 外部进程再次修改该文件
- **THEN** 后续状态判定 SHALL 变为 `dirty`
- **AND** details SHALL 列出该 normalized path 为变更文件

#### Scenario: 刷新后状态判定为 clean
- **GIVEN** sync 前记录与当前代码一致
- **AND** sync 改写一个 recorded 单元
- **AND** sync 完成后已执行 evidence fingerprint 刷新
- **WHEN** 执行状态判定
- **THEN** 结果 SHALL 为 `clean`

#### Scenario: 无 evidenceFingerprintEntries 时跳过
- **GIVEN** `.quality-state.json` 存在但不包含 `evidenceFingerprintEntries` 字段（legacy 格式）
- **WHEN** `applyPreparedChangeSync` 完成写入
- **THEN** 系统 SHALL 静默跳过刷新步骤

#### Scenario: change 级 delta 单元不受刷新影响
- **GIVEN** evidenceFingerprintEntries 中包含 `.xirang/changes/<name>/elements/<identity>.md`
- **AND** sync 不改写此路径（change-local delta 单元不在 sync 输出中）
- **WHEN** `applyPreparedChangeSync` 完成写入
- **THEN** 该 entry 的 hash 保持不变
- **AND** 若此文件被外部修改，后续状态判定正常变为 `dirty`

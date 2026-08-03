---
entity: element-declaration
identity: change-sync
kind: element
parent: change-closure
title: Change Sync
definition: Change Sync 定义将 Change 的四分区 Semantic Delta 同步到正式 Semantic Model 的行为：从 immutable Formal snapshot 物化完整 Target Semantic Model、联合验证、原子写入与回滚、幂等判定、evidence fingerprint 增量刷新，以及 `xirang sync` 命令面的选择与门禁行为。
---

## Requirements

### Requirement: Change 选择

`xirang sync` SHALL 同时支持交互式和直接指定两种 change 选择方式。

#### Scenario: 直接指定 change 名称
- **GIVEN** 用户执行 `xirang sync my-change`
- **WHEN** `.xirang/changes/my-change/` 存在
- **THEN** 对该 change 执行同步

#### Scenario: 交互式选择
- **GIVEN** 用户执行 `xirang sync`（无参数）
- **AND** 当前存在多个活跃 change
- **THEN** 列出所有活跃 change 供用户选择
- **AND** 排除 `archive/` 目录

#### Scenario: 无活跃 change
- **GIVEN** 用户执行 `xirang sync`
- **AND** 不存在任何活跃 change
- **THEN** 输出提示信息并退出

#### Scenario: 指定的 change 不存在
- **GIVEN** 用户执行 `xirang sync nonexistent`
- **WHEN** `.xirang/changes/nonexistent/` 不存在
- **THEN** 报错并退出

### Requirement: 同步执行

`xirang sync` SHALL 在 verify gate 通过后，从 immutable Formal snapshot 将 change-local 四分区 operations materialize 为一个完整 Target Semantic Model，执行 combined validation 与 fingerprint freshness check，再原子写入干净 formal modules。Sync SHALL NOT 生成 review metadata 或静默迁移记法版本。

#### Scenario: verify gate 失败输出指引
- **WHEN** freshness 为 STALE 或 archive compatibility 不满足
- **THEN** SHALL 输出 changed files、重新 verify 命令与 `--no-verify` option
- **AND** exit code SHALL 非零

#### Scenario: verify gate 通过后执行同步
- **WHEN** freshness 为 FRESH 且 archive compatible
- **THEN** SHALL 构造 Target Semantic Model 与内部 Diff IR
- **AND** validation 与 Formal fingerprint recheck 通过后 SHALL 原子写入 formal 分区

#### Scenario: --no-verify 跳过 gate
- **WHEN** 用户运行 `xirang sync <change> --no-verify`
- **THEN** SHALL 跳过 verify freshness gate
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
#### Scenario: Verify result is fresh
- **WHEN** archive sync runs with a fresh `.verify-result.json`
- **THEN** system SHALL continue sync logic
#### Scenario: --no-verify 开关
- **WHEN** 用户执行 `xirang sync my-change --no-verify`
- **THEN** `skipVerify` 设为 `true`
- **AND** 不调用 `checkFreshness` 或 `checkArchiveCompatibility`
- **AND** 同步照常执行
#### Scenario: Verify result is stale
- **WHEN** archive sync runs without a fresh `.verify-result.json`
- **THEN** system SHALL stop and require verify first
### Requirement: 不触发归档

`xirang sync` SHALL NOT 归档或移动 change directory。Sync 只 MAY 通过 prepared transaction 写入 formal 分区。

#### Scenario: 同步后 change 目录保持不变
- **WHEN** sync 成功完成
- **THEN** active change directory 与其中 artifacts SHALL 保持原路径
- **AND** sync SHALL NOT 因自身创建、更新或删除任何持久化 review 输出

### Requirement: 幂等性

`xirang sync` SHALL 保持 target-state 幂等性。重复执行不得引入额外语义或 formatting differences；identity operations 已全部反映在 Formal Model 时 SHALL 被判断为 already synchronized。

#### Scenario: 重复执行产生相同结果
- **GIVEN** 已对某 change 成功执行 sync
- **WHEN** Formal target 未被其他 change 修改且再次执行 sync
- **THEN** formal 分区 SHALL 与首次同步后字节一致

#### Scenario: removal-only delta 的目标已缺失
- **WHEN** change 只包含 REMOVED 操作且所有目标已在 Formal Model 缺失
- **THEN** SHALL 将该 contract delta 视为已同步

#### Scenario: 完整 MODIFIED Requirement 已同步
- **WHEN** Formal Requirement 已与 change-local 完整 target block 相同
- **THEN** sync SHALL 将 operation 视为已应用
- **AND** SHALL NOT 依赖 Scenario labels 判断等价性
#### Scenario: removal-only delta 的目标 headers 已缺失
- **GIVEN** change Contract 只包含 `## REMOVED Requirements`
- **AND** 所有 target headers 已从 Formal Contract 缺失
- **WHEN** 再次执行 sync
- **THEN** SHALL 将该 contract delta 视为已同步
#### Scenario: REMOVED requirements already absent
- **WHEN** removal-only delta 的全部 identities 已从 Formal Contract 缺失
- **THEN** SHALL 将该 delta 视为 already reconciled
#### Scenario: removal-only delta 清空 Contract
- **GIVEN**首次 sync 删除了 Formal Contract 最后一个 Requirement 并使 Element 单元变为 declaration-only
- **WHEN** 再次执行 sync
- **THEN** SHALL 将该 delta 视为已同步
- **AND** SHALL NOT 重建空 Contract 正文
#### Scenario: No changes needed
- **WHEN** Formal target 已与 delta target 一致
- **THEN** SHALL 显示 `Contracts already in sync - no changes needed`
### Requirement: 按实际 Semantic Delta operations 判断同步需求

Sync SHALL 根据四分区 Semantic Delta 的 operations 判断是否需要同步，而不是仅根据文件存在。省略某分区 delta SHALL 表示该 scope 无变化；空 operation block SHALL 被拒绝。

#### Scenario: 无任何 delta
- **WHEN** change 没有待同步 operations
- **THEN** SHALL 输出 `No sync required.`

#### Scenario: 只有 contract delta
- **WHEN** change 只有待同步 Requirements
- **THEN** SHALL 只更新对应 Element Contract
- **AND** SHALL 在完整 Target Semantic Model 上检查 contract policy

#### Scenario: Real delta 要求 formal model
- **WHEN** delta 包含实际 operations 且 formal model 不存在
- **THEN** SHALL 失败并报告无法构造 Target Semantic Model
#### Scenario: Archive 阻塞未同步 delta
- **WHEN** agent executes `xirang archive`
- **AND** 仍有未同步 delta contracts
- **THEN** archive SHALL 阻止归档并指引先完成 `xirang sync`
- **AND** SHALL NOT 在 archive 内执行 sync
#### Scenario: Sync 在 archive 前完成 reconciliation
- **WHEN** delta contracts exist
- **THEN** `xirang sync` SHALL 在 archive 之前将其 reconcile 到 Formal Semantic Model
- **AND** SHALL preserve idempotency
#### Scenario: 无 graph delta 且无 contract delta
- **WHEN** change 没有待同步 graph 或 contract operations
- **THEN** SHALL 输出 `No sync required.`
#### Scenario: Archive 要求 Sync 已完成
- **WHEN** agent executes `xirang archive`
- **AND** delta Contracts or 四分区 delta 单元 are present
- **THEN** archive SHALL 要求 Sync 已完成（pending delta 阻塞 archive），不在 archive 内执行 sync
#### Scenario: Real graph delta 要求 formal model
- **WHEN** graph delta 包含实际 operations 且 formal graph 不存在
- **THEN** SHALL 失败并报告无法构造 Target Semantic Model
#### Scenario: Real graph delta 要求 Formal Model
- **WHEN** graph delta 包含 operation 且 Formal graph 不存在
- **THEN** SHALL 失败并报告无法构造 Target Semantic Model
#### Scenario: 只有 contract delta（Sync 按实际 Sem）
- **WHEN** change 只有待同步 Contracts
- **THEN** SHALL 只更新对应 elements/ 单元
- **AND** SHALL 在完整 Target Semantic Model 上检查 contractPolicy
#### Scenario: 只有 contract delta（Sync 按实际 OPS）
- **WHEN** change 只有待同步 Contracts
- **THEN** SHALL 只更新对应 elements/ 单元
- **AND** SHALL 在完整 Target Semantic Model 上检查 contract policy
### Requirement: 拒绝非 canonical 空 delta

Sync SHALL 使用对应记法版本的 delta parser。`--no-validate` MUST NOT 绕过 syntax 与 integrity validation；空 section、只有 review hint 或无法解析 operation MUST NOT 被当作 no-op。

#### Scenario: 空 operation fail-fast
- **WHEN** delta 包含无任何 target change 的 operation block
- **THEN** sync SHALL 失败
- **AND** MUST NOT 写入 formal 分区

#### Scenario: Invalid syntax fail-fast
- **WHEN** delta 声明不支持记法或非法 operation
- **THEN** sync SHALL 返回 structured ERROR
- **AND** MUST NOT 部分应用 deltas
#### Scenario: 空 graph operation fail-fast
- **WHEN** `metamodel/`、`relationships/` 或 Declaration delta 分区包含无任何 target change 的 operation block
- **THEN** sync SHALL 失败
- **AND** MUST NOT 写入 formal 分区或 Contracts
#### Scenario: Invalid dialect syntax fail-fast
- **WHEN** delta 声明非法 operation 或无效记法
- **THEN** sync SHALL 返回 structured ERROR
- **AND** MUST NOT 部分应用 contract deltas
#### Scenario: Delta 文件必须包含真实 operation
- **WHEN** 分区 delta 单元存在
- **THEN** SHALL 至少包含一个 `ADDED`、`MODIFIED` 或 `REMOVED` identity operation
- **AND** 只有 review hint 的文件 SHALL 验证失败
#### Scenario: Invalid dialect syntax fail-fast（Sync 拒绝非 can）
- **WHEN** delta 使用无效 operation 或 invalid annotation
- **THEN** SHALL 返回 structured ERROR
- **AND** MUST NOT partial apply contract deltas
### Requirement: Semantic Delta SHALL 原子提升

Sync SHALL 在 temporary workspace 中完成 target materialization、identity index 重建、full validation、Diff IR generation 与 Formal fingerprint recheck，随后一次提交全部 formal writes。

#### Scenario: 联合成功
- **WHEN** Target validation 与 fingerprint recheck 通过
- **THEN** 全部受影响单元 SHALL 同时写入
- **AND** Formal identity index SHALL 可立即解析该状态

#### Scenario: 任一环节失败回滚
- **WHEN** materialization、validation 或 filesystem write 任一失败
- **THEN** 模型单元、identity index、fingerprint 全部修改 SHALL 回滚
- **AND** formal Semantic Model SHALL 保持 transaction 前状态

#### Scenario: Stale Formal snapshot
- **WHEN** prepare 后检测到 Formal fingerprint 改变
- **THEN** sync SHALL 拒绝全部 writes
- **AND** SHALL 指引重新 validate

#### Scenario: Windows 原子 sync
- **WHEN** sync 在 Windows filesystem 执行
- **THEN** temporary、backup 与 target paths SHALL 使用 Node.js path API
- **AND** rollback SHALL 恢复全部受影响的单元
#### Scenario: 联合编译成功
- **WHEN** Target Semantic Model 完整 validation 通过且 Formal fingerprint 未变化
- **THEN** 全部模型单元 SHALL 在同一 prepared transaction 中写入
- **AND** identity index SHALL 从写入后的模型单元确定性重建
#### Scenario: 结构与 contract 联合成功
- **WHEN** 结构 delta 新增 element 且其单元携带 Contract
- **AND** Target validation 与 fingerprint recheck 通过
- **THEN** 全部受影响单元 SHALL 同时写入
- **AND** Formal identity index SHALL 可立即解析该状态
#### Scenario: 结构 delta 在 archive 前完成 sync
- **WHEN** agent executes `xirang archive`
- **AND** 四分区 delta 单元存在
- **THEN** `xirang sync` SHALL 在 archive 前应用 Semantic Delta
- **AND** SHALL validate referential integrity before writing
- **AND** SHALL write updated model units atomically
- **AND** pending delta SHALL 阻塞 archive 直到 sync 完成
#### Scenario: Formal snapshot 变更
- **WHEN** prepare 后 Formal fingerprint 与读取时不同
- **THEN** sync SHALL 拒绝全部 writes
- **AND** SHALL 要求重新 validate 或 diff
#### Scenario: 任一 module 失败回滚
- **WHEN** 模型单元、identity index、validation 或 filesystem write 任一失败
- **THEN** SHALL 回滚全部 formal modifications
- **AND** formal Semantic Model SHALL 保持 transaction 前状态
#### Scenario: 合并失败回滚
- **WHEN** 模型单元、identity index、fingerprint 或 full validation 任一失败
- **THEN** SHALL 回滚全部 Formal modifications
#### Scenario: Contract failure 回滚结构
- **WHEN** target materialization 成功但 Contract validation 失败
- **THEN** 结构变化 SHALL NOT 留在 Formal source
#### Scenario: Embedded sync failure aborts archive
- **WHEN** inline sync would fail validation or integrity checks
- **THEN** the skill SHALL abort archive
- **AND** SHALL leave Formal Semantic Model unchanged
- **AND** SHALL leave model files unchanged
- **AND** SHALL leave the change directory in place
#### Scenario: Semantic delta is invalid
- **WHEN** the merged target model fails Xirang semantic validation
- **THEN** sync SHALL fail before formal writes
#### Scenario: A write fails mid-transaction
- **WHEN** one prepared write cannot be committed
- **THEN** all affected model units SHALL be restored
### Requirement: Sync-created contracts SHALL 使用 runtime projection

`xirang sync` 创建或重建 Formal Contracts 时 SHALL 消费 runtime projection，并写入 canonical unlabeled Scenario headings。任何 Scenario operation-like label SHALL 在 validation 阶段阻止 sync，而不是在写入时被清洗。

#### Scenario: 新 formal contract 使用投影的 prose 策略
- **WHEN** sync 创建尚不存在的 Formal Contract
- **THEN** SHALL 对生成 prose 使用 runtime projection
- **AND** SHALL 保留 canonical headers、normative keywords 与 BDD keywords

#### Scenario: Scenario label 阻止 sync
- **WHEN** change-local source 包含 Scenario operation-like label
- **THEN** combined validation SHALL 失败
- **AND** sync SHALL NOT 写入任何 Formal 单元
#### Scenario: 既有单元更新不注入无关 boilerplate
- **WHEN** sync 更新既有 Formal Contract
- **THEN** SHALL 将写入限制在 target reconciliation 范围
- **AND** SHALL NOT 修改无关 sections
#### Scenario: New formal contract uses projected prose policy
- **WHEN** sync 创建尚不存在的 Formal Contract
- **THEN** SHALL 对生成 prose 使用 runtime projection
- **AND** SHALL 保留 canonical headers、normative keywords 与 BDD keywords
#### Scenario: Sync skill explains projected prose boundary
- **WHEN** the skill instructs the agent to reconcile or create contracts
- **THEN** the prompt projection SHALL state how natural-language prose follows config-driven policy
- **AND** SHALL preserve canonical tokens such as `SHALL`, `MUST`, requirement headers, scenario headers, and BDD keywords
#### Scenario: Scenario operation label 被拒绝
- **WHEN** change-local Scenario heading 包含 operation-like label
- **THEN** SHALL 在 sync 前 validation 失败
- **AND** MUST NOT 清洗后继续写入
### Requirement: 同步 Requirement Operations

Contract reconciliation SHALL 使用 `ADDED`、`MODIFIED`、`REMOVED` Requirement headers 将 change-local 完整 target blocks 合入 Formal Contracts，对 normalized Requirement identity 做显式查找，并拒绝 `RENAMED Requirements` 与 Scenario operation labels。

#### Scenario: ADDED requirements
- **WHEN** delta 包含 ADDED Requirement 且 Formal Contract 不存在同名 identity
- **THEN** SHALL 将完整 Requirement 添加到 target Contract

#### Scenario: ADDED requirement already exists
- **WHEN** ADDED identity 已存在于 Formal Contract
- **THEN** SHALL 报 identity precondition ERROR
- **AND** SHALL NOT 将 ADDED 静默解释为 MODIFIED

#### Scenario: MODIFIED requirements
- **WHEN** delta 包含 MODIFIED Requirement 且 Formal Contract 存在同名 identity
- **THEN** SHALL 用完整 target block 替换 Formal Requirement
- **AND** omitted Formal Scenario SHALL 不进入 target

#### Scenario: REMOVED requirements
- **WHEN** delta 包含 REMOVED identity 且 Formal Contract 存在
- **THEN** SHALL 从 target Contract 删除该 Requirement

#### Scenario: RENAMED section 被拒绝
- **WHEN** delta 包含 `## RENAMED Requirements`
- **THEN** SHALL 报 ERROR
- **AND** SHALL 指引使用 REMOVED old 与 ADDED new
#### Scenario: 同步成功显示 counts
- **WHEN** reconciliation 成功
- **THEN** SHALL 显示每个 Element 的 requirements added、modified、removed counts
- **AND** SHALL NOT 显示独立 renamed count
- **AND** target 已一致时 SHALL 显示 "already in sync - no changes needed"
#### Scenario: 合并任意 kind element target
- **WHEN** graph delta 新增或修改任意 kind element
- **THEN** SHALL 将完整 target state 写入对应 Formal graph source module
- **AND** SHALL 保持 stable identity 与合法 containment
#### Scenario: Applying Requirement operations
- **WHEN** sync reconciles contract operations
- **THEN** SHALL 按 REMOVED、MODIFIED、ADDED 的 target result 验证 normalized identities
- **AND** SHALL 将完整 MODIFIED block 写为 formal target Requirement
- **AND** MUST NOT 解析 RENAMED section 或 Scenario operation labels
#### Scenario: Show applied changes
- **WHEN** reconciliation 成功
- **THEN** SHALL 显示每个 Contract 的 requirements added、modified、removed counts
- **AND** SHALL NOT 显示独立 renamed count
#### Scenario: 合并 semantic relationships
- **WHEN** delta 新增或删除 relationship（endpoint 或 kind 变化以 REMOVED 旧 tuple 与 ADDED 新 tuple 表达）
- **THEN** SHALL 按 canonical tuple reconcile Formal relationship set
- **AND** Relationship 实例 SHALL 只接受 ADDED/REMOVED，不接受 MODIFIED
- **AND** SHALL 检查 Metamodel endpoint constraints
#### Scenario: Handling conflicts during sync or archive
- **WHEN** Formal snapshot、identity precondition 或 target integrity 与 change 冲突
- **THEN** SHALL 报告具体 conflict
- **AND** SHALL 要求 resolution 后重新 validate 与 diff
- **AND** MUST NOT partial write 或 archive
#### Scenario: Show Architecture sync summary
- **WHEN** Architecture reconciliation 成功
- **THEN** SHALL 显示 elements 的 added、modified、removed counts、relationships 的 added/removed counts 与 Metamodel kinds 的 added、modified、removed counts
### Requirement: Target compiler 清空 Contract 时保留 Element Declaration

当一个 Formal Element 的全部 Requirements 均通过 change-local `REMOVED Requirements` 被显式删除，且 target 中没有 surviving、ADDED 或 MODIFIED Requirement 时，Target Semantic Model compiler SHALL 只清除该 Element 单元正文中的 Contract，保留同一单元中的 Element Declaration（identity、kind、parent、title、definition 不变）。

对于 contract policy 为 `optional` 的 Element Kind，序列化后 Element 单元 SHALL 只含 Declaration（declaration-only 单元）；对于 contract policy 为 `required` 的 Element Kind，Target Semantic Model validation SHALL 因 `MISSING_REQUIRED_CONTRACT` 失败。

只有 change-local 显式声明 `REMOVED` Element Declaration Entry，且删除后 containment 与 relationships 等依赖校验通过时（Element 的 Contract 随宿主单元一并删除），atomic writer SHALL 才允许删除整个 Element 单元。

#### Scenario: 全部 Requirements 被删除（optional kind）
- **GIVEN** formal Element 的 Kind contract policy 为 `optional`
- **WHEN** change 对其全部 Requirements 声明精确 REMOVED operation
- **AND** target 没有新增或修改 Requirement
- **THEN** compiler SHALL 保留该 Element 的 Declaration 与稳定 identity
- **AND** SHALL 序列化为只含 frontmatter Declaration 的 declaration-only 单元（正文不含 `## Requirements`）

#### Scenario: 全部 Requirements 被删除（required kind）
- **GIVEN** formal Element 的 Kind contract policy 为 `required`
- **WHEN** target 中该 Element 没有任何 Requirement
- **THEN** Target Semantic Model validation SHALL 返回 `MISSING_REQUIRED_CONTRACT` ERROR
- **AND** sync SHALL 失败且不写入该清空后的 target 状态

#### Scenario: 显式删除 Element Declaration 且依赖校验通过
- **GIVEN** change-local 对某 Element 声明显式 `REMOVED` Element Declaration Entry
- **WHEN** 删除后无 surviving descendants、relationships 引用该 identity（Contract 随单元一并删除）
- **THEN** atomic writer SHALL 删除整个 Element 单元（Declaration 与 Contract 一并移除）

#### Scenario: 显式删除 Element Declaration 但存在未处理依赖
- **WHEN** change-local 声明 `REMOVED` Element Declaration Entry 但该 Element 仍有 surviving children 或 relationships
- **THEN** validation SHALL 返回全部 unresolved dependencies
- **AND** MUST NOT 级联删除该 Element 单元

#### Scenario: 删除不完整
- **WHEN** formal Element 仍有 surviving Requirement
- **THEN** compiler SHALL 保留该 Contract 正文
- **AND** SHALL NOT 因 Requirement 数量减少而推断 whole-Contract 或 whole-Element removal
#### Scenario: 删除存在未处理依赖
- **WHEN** removed element 仍有 surviving descendants、relationships 或其他 references
- **THEN** SHALL 返回所有 unresolved dependencies
- **AND** MUST NOT cascade delete
#### Scenario: 严格 removal
- **WHEN** removed element 仍有 surviving descendants 或 relationships
- **THEN** SHALL 阻止 sync
- **AND** MUST NOT cascade delete
### Requirement: Sync diagnostics 可操作

Sync validation 失败 SHALL 标识 artifact、语义问题与受影响路径，而不输出不透明的 parser 结构。

#### Scenario: Delta validation fails
- **WHEN** 用户运行 `xirang sync <change>` 且 delta validation 失败
- **THEN** output SHALL 人类可读
- **AND** SHALL 标识受影响的语义单元与路径

### Requirement: sync 完成后刷新 evidence fingerprint

sync 完成所有文件写入后，系统 SHALL 检测 change 目录下是否存在 `.verify-result.json`；若存在，SHALL 对 evidenceFingerprintEntries 中路径与本次 sync 输出重叠的条目重算文件哈希，并更新 evidenceFingerprint。

#### Scenario: evidence 中有 sync 输出文件时刷新
- **GIVEN** `.verify-result.json` 存在且包含与 sync 输出重叠的 evidence entries
- **WHEN** sync 完成写入
- **THEN** 系统 SHALL 重算受影响条目的 SHA-256 哈希
- **AND** SHALL 重算整体 `evidenceFingerprint` 并写回 `.verify-result.json`

#### Scenario: evidence 中无 sync 输出文件时跳过
- **GIVEN** `.verify-result.json` 存在且无重叠路径
- **WHEN** sync 完成写入
- **THEN** 系统 SHALL NOT 修改 `.verify-result.json`
- **AND** SHALL NOT 报错

#### Scenario: .verify-result.json 不存在时跳过
- **GIVEN** change 目录下不存在 `.verify-result.json`
- **WHEN** sync 完成写入
- **THEN** 系统 SHALL 静默跳过刷新步骤

#### Scenario: 刷新后证据文件再次被外部修改
- **GIVEN** sync 后 evidence fingerprint 已刷新为 FRESH
- **WHEN** 外部进程再次修改该文件
- **THEN** 后续 freshness 检查 SHALL 检测到 STALE
- **AND** details SHALL 列出该 normalized path 为变更文件
#### Scenario: 刷新后 checkFreshness 返回 FRESH
- **GIVEN** sync 前 `.verify-result.json` 为 FRESH
- **AND** sync 改写一个 recorded 单元
- **AND** sync 完成后已执行 evidence fingerprint 刷新
- **WHEN** 调用 freshness 检查
- **THEN** 返回 `{ status: 'FRESH' }`
#### Scenario: 无 evidenceFingerprintEntries 时跳过
- **GIVEN** `.verify-result.json` 存在但不包含 `evidenceFingerprintEntries` 字段（legacy 格式）
- **WHEN** `applyPreparedChangeSync` 完成写入
- **THEN** 系统 SHALL 静默跳过刷新步骤
#### Scenario: change 级 delta 单元不受刷新影响
- **GIVEN** evidenceFingerprintEntries 中包含 `.xirang/changes/<name>/elements/<identity>.md`
- **AND** sync 不改写此路径（change-local delta 单元不在 sync 输出中）
- **WHEN** `applyPreparedChangeSync` 完成写入
- **THEN** 该 entry 的 hash 保持不变
- **AND** 若此文件被外部修改，后续 `checkFreshness` 正常检测到 STALE

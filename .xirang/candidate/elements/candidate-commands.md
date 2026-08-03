---
entity: element-declaration
identity: candidate-commands
kind: element
parent: deterministic-operations
title: Candidate Commands
definition: Candidate Commands 定义 `xirang candidate` 命令面的生命周期行为：`init` 创建隔离 workspace、`status` 只读报告状态、`validate` 确定性只读校验并生成 reviewDigest、`promote` 在 digest 门禁与历史保留下原子替换 formal source。
---

## Requirements

### Requirement: Candidate initialization SHALL 创建一个隔离 workspace
`xirang candidate init` SHALL 根据一个明确的起点创建唯一 active `.xirang/candidate/` workspace：current formal model、clean skeleton 或用户指定路径。

#### Scenario: 初始化 clean Candidate
- **WHEN** command 使用 clean starting point
- **THEN** SHALL 创建 `candidate.yaml`、`build.md`、四个 canonical Candidate 分区和空的 Candidate elements 目录
- **AND** SHALL NOT 修改 `.xirang/model/`

#### Scenario: 初始化 current Candidate
- **WHEN** command 使用 current model starting point
- **THEN** SHALL 将当前 `.xirang/model/` 完整复制到 Candidate
- **AND** SHALL 保留 source bytes 和稳定 identities

#### Scenario: Active Candidate 已存在
- **WHEN** `.xirang/candidate/` 已存在
- **THEN** initialization SHALL 失败且不得覆盖该 workspace
- **AND** status SHALL 提供 resume 或显式 restart 指引
#### Scenario: Windows Candidate path
- **WHEN** initialization 在 Windows 上运行
- **THEN** filesystem paths SHALL 使用 Node.js path APIs 构建
- **AND** `candidate.yaml` SHALL 只保存 canonical project-relative path representation
### Requirement: Candidate status SHALL 只读报告状态
`xirang candidate status` SHALL 在不修改 Candidate、formal source 或 history 的情况下，计算 active workspace state、starting point、source inventory、history count 和 disk usage。

#### Scenario: Candidate 存在
- **WHEN** status 读取 valid active workspace
- **THEN** text 与 JSON output SHALL 标识 starting point 并报告分区 inventory

#### Scenario: Candidate 不存在
- **WHEN** active Candidate 不存在
- **THEN** status SHALL 成功报告该状态并指引运行 `xirang candidate init`

### Requirement: Candidate validation SHALL 确定性且只读
`xirang candidate validate` SHALL 在不写入任何 workspace file 的情况下，对 `build.md` 与四个 Candidate 分区执行 canonical representation 与 Semantic Closure validation。valid result SHALL 包含绑定精确 reviewed bytes 的 SHA-256 `reviewDigest`。

#### Scenario: Valid Candidate 生成 review digest
- **WHEN** Candidate 具有一个 Project Root、合法 identity 与 containment、合法 kind policies、完整 required contracts、合法 Requirements 与合法 semantic relations
- **AND** 每个 Candidate file 满足 canonical encoding、newline、Unicode、ordering、path、frontmatter 与 no-symlink rules
- **THEN** validation SHALL 返回 valid、deterministic inventory、formal diff summary 与 `reviewDigest`
- **AND** 对未变化 bytes 重复 validation SHALL 返回相同 digest

#### Scenario: Non-canonical Candidate 被拒绝
- **WHEN** Candidate file 违反 canonical representation rule
- **THEN** validation SHALL 返回包含 file、location、violated rule 与 expected representation 的 failure diagnostic
- **AND** SHALL NOT 自动 format、reorder、normalize 或 rewrite Candidate

#### Scenario: Validate 不修改文件
- **WHEN** validation 成功或失败
- **THEN** Candidate、formal model 与 history 下的 bytes SHALL 保持不变

### Requirement: Candidate promotion SHALL 要求当前 confirmed digest
`xirang candidate promote --digest <reviewDigest>` SHALL 创建 immutable Candidate snapshot、重新执行 validation，并且只有 supplied digest 与新计算 digest 完全一致时才允许 promotion。

#### Scenario: Digest 仍然有效
- **WHEN** supplied digest 与 valid Candidate snapshot 匹配
- **THEN** promotion SHALL 准备完整 formal target
- **AND** SHALL 仅通过 atomic promotion transaction 继续

#### Scenario: 用户确认后 Candidate 发生变化
- **WHEN** `build.md` 或任一 Candidate 单元字节在 user confirmation 后发生变化
- **THEN** promotion SHALL 以 digest mismatch 失败
- **AND** current formal source 与 active Candidate SHALL 保持不变

#### Scenario: Revalidation 失败
- **WHEN** Candidate 在 promotion 时不再通过 validation
- **THEN** promotion SHALL 在 formal writes 前失败
- **AND** active Candidate SHALL 保留以便修复

### Requirement: Candidate promotion SHALL 保留 history 并原子替换 formal source
Promotion 在替换 formal source 前 SHALL 创建包含 `build.md`、promotion metadata 与完整 previous model 的 immutable `.xirang/history/builds/<build-id>/` entry，然后以一个可恢复 transaction 替换完整 formal 分区。

#### Scenario: Promotion 成功
- **WHEN** digest 与 revalidation gates 通过
- **THEN** history SHALL 包含完整 previous formal source 与 project-relative promotion metadata
- **AND** `.xirang/model/` SHALL 与 Candidate target 完全一致，包括删除 Candidate 中不存在的 stale formal files
- **AND** post-write formal validation SHALL 通过
- **AND** 只有所有前置步骤成功后才 SHALL 删除 active Candidate

#### Scenario: Backup 无法完成
- **WHEN** 无法将完整 previous formal source 写入 history
- **THEN** promotion SHALL 在替换 formal source 前失败
- **AND** SHALL NOT 留下 partial successful history entry

#### Scenario: Replacement 期间 promotion 失败
- **WHEN** staging、directory replacement 或 post-write validation 失败
- **THEN** transaction SHALL 恢复 previous formal model
- **AND** SHALL 保留 active Candidate
- **AND** SHALL 删除 incomplete transaction/history state

#### Scenario: History 保留
- **WHEN** promotion 重复成功
- **THEN** 息壤 SHALL 保留全部 build history entries，直到用户删除
- **AND** formal readers SHALL NOT 将 history 用作 runtime fallback semantic source

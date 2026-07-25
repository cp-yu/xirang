---
element: cap.cli.candidate
---
# cli-candidate Specification

## Purpose
This specification records behavior introduced by change project-opsx-build. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: Candidate initialization SHALL 创建一个隔离 workspace
`xirang candidate init` SHALL 根据一个明确的起点创建唯一 active `.xirang/candidate/` workspace：current formal OPSX、clean skeleton 或用户指定路径。

#### Scenario: 初始化 clean Candidate
- **WHEN** command 使用 clean starting point
- **THEN** SHALL 创建 `candidate.yaml`、`build.md`、四个 canonical Candidate Architecture modules 和空的 Candidate Specs directory
- **AND** SHALL NOT 修改 `.xirang/architecture/` 或 `.xirang/specs/`

#### Scenario: 初始化 current Candidate
- **WHEN** command 使用 current OPSX starting point
- **THEN** SHALL 将当前 `.xirang/architecture/` 和 `.xirang/specs/` 完整复制到 Candidate
- **AND** SHALL 保留 source bytes 和 stable element bindings

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
- **THEN** text 和 JSON output SHALL 标识 starting point，并报告 Architecture/Spec inventory
- **AND** SHALL 报告 validation 所需文件是否存在

#### Scenario: Candidate 不存在
- **WHEN** active Candidate 不存在
- **THEN** status SHALL 成功报告该状态
- **AND** SHALL 指引调用方运行 `xirang candidate init`

### Requirement: Candidate validation SHALL 确定性且只读
`xirang candidate validate` SHALL 在不写入任何 workspace file 的情况下，对 `build.md`、Candidate Architecture 和 Candidate Specs 执行 canonical representation 与 Semantic Closure validation。valid result SHALL 包含绑定精确 reviewed bytes 的 SHA-256 `reviewDigest`。

#### Scenario: Valid Candidate 生成 review digest
- **WHEN** Candidate 具有一个 Project Root、合法 identity 和 containment、合法 kind policies、完整 required contracts、singular Spec ownership、合法 Requirements 和合法 semantic relations
- **AND** 每个 Candidate file 均满足 canonical encoding、newline、Unicode、ordering、path、frontmatter 和 no-symlink rules
- **THEN** validation SHALL 返回 valid、deterministic inventory、formal diff summary 和 `reviewDigest`
- **AND** 对未变化 bytes 重复 validation SHALL 返回相同 digest

#### Scenario: Non-canonical Candidate 被拒绝
- **WHEN** Candidate file 违反 canonical representation rule
- **THEN** validation SHALL 返回包含 file、location、violated rule 和 expected representation 的 failure diagnostic
- **AND** SHALL NOT 自动 format、reorder、normalize 或 rewrite Candidate

#### Scenario: Validate 不修改文件
- **WHEN** validation 成功或失败
- **THEN** `.xirang/candidate/`、`.xirang/architecture/`、`.xirang/specs/` 和 `.xirang/history/` 下的 bytes SHALL 保持不变
- **AND** SHALL NOT 持久化 validation result 或 digest file

### Requirement: Candidate promotion SHALL 要求当前 confirmed digest
`xirang candidate promote --digest <reviewDigest>` SHALL 创建 immutable Candidate snapshot、重新执行 validation，并且只有 supplied digest 与新计算 digest 完全一致时才允许 promotion。

#### Scenario: Digest 仍然有效
- **WHEN** supplied digest 与 valid Candidate snapshot 匹配
- **THEN** promotion SHALL 准备完整 formal Architecture + Specs target
- **AND** SHALL 仅通过 atomic promotion transaction 继续

#### Scenario: 用户确认后 Candidate 发生变化
- **WHEN** `build.md` 或任一 Candidate Architecture/Spec byte 在 user confirmation 后发生变化
- **THEN** promotion SHALL 以 digest mismatch 失败
- **AND** current formal source 和 active Candidate SHALL 保持不变

#### Scenario: Revalidation 失败
- **WHEN** Candidate 在 promotion 时不再通过 validation
- **THEN** promotion SHALL 在 formal writes 前失败
- **AND** active Candidate SHALL 保留以便修复

### Requirement: Candidate promotion SHALL 保留 history 并原子替换 formal source
Promotion 在替换 formal source 前 SHALL 创建包含 `build.md`、`promotion.yaml` 和完整 previous Architecture + Specs 的 immutable `.xirang/history/builds/<build-id>/` entry，然后以一个可恢复 transaction 替换完整 formal trees。

#### Scenario: Promotion 成功
- **WHEN** digest 和 revalidation gates 通过
- **THEN** history SHALL 包含完整 previous formal source 和 project-relative promotion metadata
- **AND** `.xirang/architecture/` 与 `.xirang/specs/` SHALL 与 Candidate target trees 完全一致，包括删除 Candidate 中不存在的 stale formal files
- **AND** post-write formal validation SHALL 通过
- **AND** 只有所有前置步骤成功后才 SHALL 删除 active Candidate

#### Scenario: Backup 无法完成
- **WHEN** 无法将完整 previous formal source 写入 history
- **THEN** promotion SHALL 在替换 formal source 前失败
- **AND** SHALL NOT 留下 partial successful history entry

#### Scenario: Replacement 期间 promotion 失败
- **WHEN** staging、directory replacement 或 post-write validation 失败
- **THEN** transaction SHALL 恢复 previous formal Architecture + Specs
- **AND** SHALL 保留 active Candidate
- **AND** SHALL 删除 incomplete transaction/history state

#### Scenario: History 保留
- **WHEN** promotion 重复成功
- **THEN** OPSX SHALL 保留全部 build history entries，直到用户删除
- **AND** formal readers SHALL NOT 将 history 用作 runtime fallback semantic source


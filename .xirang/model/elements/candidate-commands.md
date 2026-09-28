---
entity: element-declaration
identity: candidate-commands
kind: element
parent: deterministic-operations
title: Candidate Commands
definition: Candidate Commands 定义 `xirang candidate` 命令面的生命周期行为：`init` 创建隔离 workspace、`status` 只读报告状态、`validate` 确定性只读校验并生成 reviewDigest、`promote` 在 digest 门禁与历史保留下原子替换 formal source。
---

## Specification

### Section: Candidate initialization SHALL 创建一个隔离 workspace

`xirang candidate init` SHALL 根据一个明确的起点创建唯一 active `.xirang/candidate/` workspace：current formal model、clean skeleton 或用户指定路径。

- **初始化 clean Candidate**

  - command 使用 clean starting point
  - 创建 candidate.yaml、build.md、四个 canonical Candidate 分区，以及与 setup 共用的 project、element、perspective Kind seeds 和 Project Root 骨架
  - 不推断业务 Elements 或 Contracts，不修改 .xirang/model/

- **初始化 current Candidate**

  - command 使用 current model starting point
  - SHALL 将当前 `.xirang/model/` 完整复制到 Candidate
  - SHALL 保留 source bytes 和稳定 identities

- **Active Candidate 已存在**

  - `.xirang/candidate/` 已存在
  - initialization SHALL 失败且不得覆盖该 workspace
  - status SHALL 提供 resume 或显式 restart 指引

- **Windows Candidate path**

  - initialization 在 Windows 上运行
  - filesystem paths SHALL 使用 Node.js path APIs 构建
  - `candidate.yaml` SHALL 只保存 canonical project-relative path representation

### Section: Candidate status SHALL 只读报告状态

`xirang candidate status` SHALL 在不修改 Candidate、formal source 或 history 的情况下，计算 active workspace state、starting point、source inventory、history count 和 disk usage。

- **Candidate 存在**

  - status 读取 valid active workspace
  - text 与 JSON output SHALL 标识 starting point 并报告分区 inventory

- **Candidate 不存在**

  - active Candidate 不存在
  - status SHALL 成功报告该状态并指引运行 `xirang candidate init`

### Section: Candidate validation SHALL 确定性且只读

`xirang candidate validate` SHALL 在不写入任何 workspace file 的情况下，对 `build.md`、存在时的已确认设计来源快照与四个 Candidate 分区执行 canonical representation 与 Semantic Closure validation。valid result SHALL 包含绑定精确 reviewed bytes 的 SHA-256 `reviewDigest`。

- **Valid Candidate 生成 review digest**

  - Candidate 具有一个 Project Root、合法 identity 与 containment、合法 kind policies、完整 required contracts、合法 Sections 与合法 semantic relations
  - 每个 Candidate file 满足 canonical encoding、newline、Unicode、ordering、path、frontmatter 与 no-symlink rules
  - validation SHALL 返回 valid、deterministic inventory、formal diff summary 与 `reviewDigest`
  - 对未变化 bytes 重复 validation SHALL 返回相同 digest

- **Non-canonical Candidate 被拒绝**

  - Candidate file 违反 canonical representation rule
  - validation SHALL 返回包含 file、location、violated rule 与 expected representation 的 failure diagnostic
  - SHALL NOT 自动 format、reorder、normalize 或 rewrite Candidate

- **Validate 不修改文件**

  - validation 成功或失败
  - Candidate、formal model 与 history 下的 bytes SHALL 保持不变

- **来源绑定 review digest**

  - Candidate 包含已交接的确认记录快照
  - 校验其格式与来源身份并将精确字节纳入 reviewDigest；来源字节改变使 digest 改变，校验不写文件。

### Section: Candidate promotion SHALL 要求当前 confirmed digest

`xirang candidate promote --digest <reviewDigest>` SHALL 创建 immutable Candidate snapshot、重新执行 validation，并且只有 supplied digest 与新计算 digest 完全一致时才允许 promotion。

- **Digest 仍然有效**

  - supplied digest 与 valid Candidate snapshot 匹配
  - promotion SHALL 准备完整 formal target
  - SHALL 仅通过 atomic promotion transaction 继续

- **用户确认后 Candidate 发生变化**

  - `build.md`、已确认设计来源快照或任一 Candidate 单元字节在 user confirmation 后发生变化
  - promotion SHALL 以 digest mismatch 失败
  - current formal source 与 active Candidate SHALL 保持不变

- **Revalidation 失败**

  - Candidate 在 promotion 时不再通过 validation
  - promotion SHALL 在 formal writes 前失败
  - active Candidate SHALL 保留以便修复

### Section: Candidate promotion SHALL 保留 history 并原子替换 formal source

Promotion 在替换 formal source 前 SHALL 创建包含 `build.md`、存在时的已确认设计来源快照、promotion metadata 与完整 previous model 的 immutable `.xirang/history/builds/<build-id>/` entry，然后以一个可恢复 transaction 替换完整 formal 分区。

- **Promotion 成功**

  - digest 与 revalidation gates 通过
  - history SHALL 包含完整 previous formal source 与 project-relative promotion metadata
  - `.xirang/model/` SHALL 与 Candidate target 完全一致，包括删除 Candidate 中不存在的 stale formal files
  - post-write formal validation SHALL 通过
  - 只有所有前置步骤成功后才 SHALL 删除 active Candidate

- **Backup 无法完成**

  - 无法将完整 previous formal source 写入 history
  - promotion SHALL 在替换 formal source 前失败
  - SHALL NOT 留下 partial successful history entry

- **Replacement 期间 promotion 失败**

  - staging、directory replacement 或 post-write validation 失败
  - transaction SHALL 恢复 previous formal model
  - SHALL 保留 active Candidate
  - SHALL 删除 incomplete transaction/history state

- **History 保留**

  - promotion 重复成功
  - 息壤 SHALL 保留全部 build history entries，直到用户删除
  - formal readers SHALL NOT 将 history 用作 runtime fallback semantic source

- **来源只进入 history**

  - 带确认记录来源的 Candidate 成功 promotion
  - history 保留该精确来源，formal target 仍仅由四个规范分区组成，不把来源作为运行时语义。

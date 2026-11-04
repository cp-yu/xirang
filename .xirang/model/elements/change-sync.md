---
entity: element-declaration
identity: change-sync
kind: element
parent: change-closure
title: Change Sync
definition: Change Sync 定义将 Change 的四分区 Semantic Delta 同步到正式 Semantic Model 的行为：从 immutable Formal snapshot 物化完整 Target Semantic Model、联合验证、原子写入与回滚、幂等判定及 `xirang sync` 命令面的选择与门禁行为。Sync 的 Quality 前置条件是已记录且 commit 对象仍存在的 Seal；Sync 不写 Quality record、不执行或关联测试，也不比较 Seal commit 与当前工作区。
---

## Specification

### Section: Change 选择

`xirang sync` SHALL 同时支持交互式和直接指定两种 change 选择方式。

- **直接指定 change 名称**

  - 用户执行 `xirang sync my-change`
  - `.xirang/changes/my-change/` 存在
  - 对该 change 执行同步

- **交互式选择**

  - 用户执行 `xirang sync`（无参数）
  - 当前存在多个活跃 change
  - 列出所有活跃 change 供用户选择
  - 排除 `archive/` 目录

- **无活跃 change**

  - 用户执行 `xirang sync`
  - 不存在任何活跃 change
  - 输出提示信息并退出

- **指定的 change 不存在**

  - 用户执行 `xirang sync nonexistent`
  - `.xirang/changes/nonexistent/` 不存在
  - 报错并退出

### Section: 同步执行

`xirang sync` SHALL 在 Quality Seal gate 通过后，从 immutable Formal snapshot 将 change-local 四分区 operations materialize 为一个完整 Target Semantic Model，执行 combined validation 与 Formal fingerprint freshness check，再原子写入干净 formal modules。Sync SHALL NOT 生成 Review metadata、改写 Quality JSON、执行测试或将测试和 Review 证据重新关联到同步后的代码。

- **Quality Seal gate 失败**：新格式 Quality JSON 缺失、没有 Seal 或 Seal commit 对象无法解析时，Sync SHALL 非零退出并给出具体诊断。Gate 不比较 HEAD、工作区 clean 状态或工作区内容与 Seal commit。
- **Quality Seal gate 通过**：JSON 中存在 Seal 且其 Git commit 对象可解析时，Sync MAY 构造 Target Semantic Model 与内部 Diff IR；validation 与 Formal fingerprint recheck 通过后 SHALL 原子写入 formal 分区。
- **`--no-verify` 跳过 Quality gate**：用户使用 `--no-verify` 时 SHALL 跳过 Quality Seal gate，但 MUST NOT 跳过 syntax、identity、integrity、Formal fingerprint 与 target validation。
- **不修改 Change Quality record**：Sync SHALL NOT 更新、创建或删除 Change 的 `.quality.json`，也 SHALL NOT 写入 Review metadata、测试结果或 Sync association。
- **Sync 不生成持久化 Review 输出**：effective diff 仅由只读 `xirang validate --change` 提供。

### Section: 不触发归档

`xirang sync` SHALL NOT 归档或移动 change directory。Sync 只 MAY 通过 prepared transaction 写入 formal 分区。

- **同步后 change 目录保持不变**

  - sync 成功完成
  - active change directory 与其中 artifacts SHALL 保持原路径
  - sync SHALL NOT 因自身创建、更新或删除任何持久化 review 输出

### Section: 幂等性

`xirang sync` SHALL 保持 target-state 幂等性。重复执行不得引入额外语义或 formatting differences；identity operations 已全部反映在 Formal Model 时 SHALL 被判断为 already synchronized。

- **重复执行产生相同结果**

  - 已对某 change 成功执行 sync
  - Formal target 未被其他 change 修改且再次执行 sync
  - formal 分区 SHALL 与首次同步后字节一致

- **removal-only delta 的目标已缺失**

  - change 只包含 REMOVED 操作且所有目标已在 Formal Model 缺失
  - SHALL 将该 contract delta 视为已同步

- **完整 MODIFIED Section 已同步**

  - Formal Section 已与 change-local 完整 target block 相同
  - sync SHALL 将 operation 视为已应用

- **removal-only delta 的目标 headers 已缺失**

  - change Contract 只包含 `## REMOVED Sections`
  - 所有 target headers 已从 Formal Contract 缺失
  - 再次执行 sync
  - SHALL 将该 contract delta 视为已同步

- **REMOVED sections already absent**

  - removal-only delta 的全部 identities 已从 Formal Contract 缺失
  - SHALL 将该 delta 视为 already reconciled

- **removal-only delta 清空 Contract**

  - 首次 sync 删除了 Formal Contract 最后一个 Section 并使 Element 单元变为 declaration-only
  - 再次执行 sync
  - SHALL 将该 delta 视为已同步
  - SHALL NOT 重建空 Contract 正文

- **No changes needed**

  - Formal target 已与 delta target 一致
  - SHALL 显示 `Contracts already in sync - no changes needed`

### Section: 按实际 Semantic Delta operations 判断同步需求

Sync SHALL 根据四分区 Semantic Delta 的 operations 判断是否需要同步，而不是仅根据文件存在。省略某分区 delta SHALL 表示该 scope 无变化；空 operation block SHALL 被拒绝。

- **无任何 delta**

  - change 没有待同步 operations
  - SHALL 输出 `No sync required.`

- **只有 contract delta**

  - change 只有待同步 Sections
  - SHALL 只更新对应 Element Contract
  - SHALL 在完整 Target Semantic Model 上检查 contract policy

- **Real delta 要求 formal model**

  - delta 包含实际 operations 且 formal model 不存在
  - SHALL 失败并报告无法构造 Target Semantic Model

- **Archive 阻塞未同步 delta**

  - agent executes `xirang archive`
  - 仍有未同步 delta contracts
  - archive SHALL 阻止归档并指引先完成 `xirang sync`
  - SHALL NOT 在 archive 内执行 sync

- **Sync 在 archive 前完成 reconciliation**

  - delta contracts exist
  - `xirang sync` SHALL 在 archive 之前将其 reconcile 到 Formal Semantic Model
  - SHALL preserve idempotency

- **无 graph delta 且无 contract delta**

  - change 没有待同步 graph 或 contract operations
  - SHALL 输出 `No sync required.`

- **Archive 要求 Sync 已完成**

  - agent executes `xirang archive`
  - delta Contracts or 四分区 delta 单元 are present
  - archive SHALL 要求 Sync 已完成（pending delta 阻塞 archive），不在 archive 内执行 sync

- **Real graph delta 要求 formal model**

  - graph delta 包含实际 operations 且 formal graph 不存在
  - SHALL 失败并报告无法构造 Target Semantic Model

- **Real graph delta 要求 Formal Model**

  - graph delta 包含 operation 且 Formal graph 不存在
  - SHALL 失败并报告无法构造 Target Semantic Model

- **只有 contract delta（Sync 按实际 Sem）**

  - change 只有待同步 Contracts
  - SHALL 只更新对应 elements/ 单元
  - SHALL 在完整 Target Semantic Model 上检查 contractPolicy

- **只有 contract delta（Sync 按实际 OPS）**

  - change 只有待同步 Contracts
  - SHALL 只更新对应 elements/ 单元
  - SHALL 在完整 Target Semantic Model 上检查 contract policy

### Section: 拒绝非 canonical 空 delta

Sync SHALL 使用对应记法版本的 delta parser。`--no-validate` MUST NOT 绕过 syntax 与 integrity validation；空 section、只有 review hint 或无法解析 operation MUST NOT 被当作 no-op。

- **空 operation fail-fast**

  - delta 包含无任何 target change 的 operation block
  - sync SHALL 失败
  - MUST NOT 写入 formal 分区

- **Invalid syntax fail-fast**

  - delta 声明不支持记法或非法 operation
  - sync SHALL 返回 structured ERROR
  - MUST NOT 部分应用 deltas

- **空 graph operation fail-fast**

  - `metamodel/`、`relationships/` 或 Declaration delta 分区包含无任何 target change 的 operation block
  - sync SHALL 失败
  - MUST NOT 写入 formal 分区或 Contracts

- **Invalid dialect syntax fail-fast**

  - delta 声明非法 operation 或无效记法
  - sync SHALL 返回 structured ERROR
  - MUST NOT 部分应用 contract deltas

- **Delta 文件必须包含真实 operation**

  - 分区 delta 单元存在
  - SHALL 至少包含一个 `ADDED`、`MODIFIED` 或 `REMOVED` identity operation
  - 只有 review hint 的文件 SHALL 验证失败

- **Invalid dialect syntax fail-fast（Sync 拒绝非 can）**

  - delta 使用无效 operation 或 invalid annotation
  - SHALL 返回 structured ERROR
  - MUST NOT partial apply contract deltas

### Section: Semantic Delta SHALL 原子提升

Sync SHALL 在 temporary workspace 中完成 target materialization、identity index 重建、full validation、Diff IR generation 与 Formal fingerprint recheck，随后一次提交全部 formal writes。

- **联合成功**

  - Target validation 与 fingerprint recheck 通过
  - 全部受影响单元 SHALL 同时写入
  - Formal identity index SHALL 可立即解析该状态

- **任一环节失败回滚**

  - materialization、validation 或 filesystem write 任一失败
  - 模型单元、identity index、fingerprint 全部修改 SHALL 回滚
  - formal Semantic Model SHALL 保持 transaction 前状态

- **Stale Formal snapshot**

  - prepare 后检测到 Formal fingerprint 改变
  - sync SHALL 拒绝全部 writes
  - SHALL 指引重新 validate

- **Windows 原子 sync**

  - sync 在 Windows filesystem 执行
  - temporary、backup 与 target paths SHALL 使用 Node.js path API
  - rollback SHALL 恢复全部受影响的单元

- **联合编译成功**

  - Target Semantic Model 完整 validation 通过且 Formal fingerprint 未变化
  - 全部模型单元 SHALL 在同一 prepared transaction 中写入
  - identity index SHALL 从写入后的模型单元确定性重建

- **结构与 contract 联合成功**

  - 结构 delta 新增 element 且其单元携带 Contract
  - Target validation 与 fingerprint recheck 通过
  - 全部受影响单元 SHALL 同时写入
  - Formal identity index SHALL 可立即解析该状态

- **结构 delta 在 archive 前完成 sync**

  - agent executes `xirang archive`
  - 四分区 delta 单元存在
  - `xirang sync` SHALL 在 archive 前应用 Semantic Delta
  - SHALL validate referential integrity before writing
  - SHALL write updated model units atomically
  - pending delta SHALL 阻塞 archive 直到 sync 完成

- **Formal snapshot 变更**

  - prepare 后 Formal fingerprint 与读取时不同
  - sync SHALL 拒绝全部 writes
  - SHALL 要求重新 validate 或 diff

- **任一 module 失败回滚**

  - 模型单元、identity index、validation 或 filesystem write 任一失败
  - SHALL 回滚全部 formal modifications
  - formal Semantic Model SHALL 保持 transaction 前状态

- **合并失败回滚**

  - 模型单元、identity index、fingerprint 或 full validation 任一失败
  - SHALL 回滚全部 Formal modifications

- **Contract failure 回滚结构**

  - target materialization 成功但 Contract validation 失败
  - 结构变化 SHALL NOT 留在 Formal source

- **Embedded sync failure aborts archive**

  - inline sync would fail validation or integrity checks
  - the skill SHALL abort archive
  - SHALL leave Formal Semantic Model unchanged
  - SHALL leave model files unchanged
  - SHALL leave the change directory in place

- **Semantic delta is invalid**

  - the merged target model fails Xirang semantic validation
  - sync SHALL fail before formal writes

- **A write fails mid-transaction**

  - one prepared write cannot be committed
  - all affected model units SHALL be restored

### Section: Sync-created contracts SHALL 使用 runtime projection

`xirang sync` 创建或重建 Formal Contracts 时 SHALL 消费 runtime projection，并写入与项目配置一致的 canonical 记法。combined validation 失败时 sync SHALL NOT 写入任何 Formal 单元。

- **新 formal contract 使用投影的 prose 策略**

  - sync 创建尚不存在的 Formal Contract
  - SHALL 对生成 prose 使用 runtime projection
  - SHALL 保留 template headings、`### Section:` 与 `#### Acceptance Case:` headers、normative keywords、IDs、schema keys、relation types、paths、commands 与 code identifiers

- **既有单元更新不注入无关 boilerplate**

  - sync 更新既有 Formal Contract
  - SHALL 将写入限制在 target reconciliation 范围
  - SHALL NOT 修改无关 sections

- **New formal contract uses projected prose policy**

  - sync 创建尚不存在的 Formal Contract
  - SHALL 对生成 prose 使用 runtime projection
  - SHALL 保留 template headings、`### Section:` 与 `#### Acceptance Case:` headers、normative keywords、IDs、schema keys、relation types、paths、commands 与 code identifiers

- **Sync skill explains projected prose boundary**

  - the skill instructs the agent to reconcile or create contracts
  - the prompt projection SHALL state how natural-language prose follows config-driven policy
  - SHALL preserve canonical tokens such as `SHALL`, `MUST`, `### Section:` and `#### Acceptance Case:` headers, and code identifiers

### Section: 同步 Section Operations

Contract reconciliation SHALL 使用 `ADDED`、`MODIFIED`、`REMOVED` Section headers 将 change-local 完整 target blocks 合入 Formal Contracts，对 normalized Section identity 做显式查找，并拒绝 `RENAMED Sections`。

- **ADDED sections**

  - delta 包含 ADDED Section 且 Formal Contract 不存在同名 identity
  - SHALL 将完整 Section 添加到 target Contract

- **ADDED section already exists**

  - ADDED identity 已存在于 Formal Contract
  - SHALL 报 identity precondition ERROR
  - SHALL NOT 将 ADDED 静默解释为 MODIFIED

- **MODIFIED sections**

  - delta 包含 MODIFIED Section 且 Formal Contract 存在同名 identity
  - SHALL 用完整 target block 替换 Formal Section
  - omitted Formal Acceptance Case SHALL 不进入 target

- **REMOVED sections**

  - delta 包含 REMOVED identity 且 Formal Contract 存在
  - SHALL 从 target Contract 删除该 Section

- **RENAMED section 被拒绝**

  - delta 包含 `## RENAMED Sections`
  - SHALL 报 ERROR
  - SHALL 指引使用 REMOVED old 与 ADDED new

- **同步成功显示 counts**

  - reconciliation 成功
  - SHALL 显示每个 Element 的 sections added、modified、removed counts
  - SHALL NOT 显示独立 renamed count
  - target 已一致时 SHALL 显示 "already in sync - no changes needed"

- **合并任意 kind element target**

  - graph delta 新增或修改任意 kind element
  - SHALL 将完整 target state 写入对应 Formal graph source module
  - SHALL 保持 stable identity 与合法 containment

- **Applying Section operations**

  - sync reconciles contract operations
  - SHALL 按 REMOVED、MODIFIED、ADDED 的 target result 验证 normalized identities
  - SHALL 将完整 MODIFIED block 写为 formal target Section
  - MUST NOT 解析 `RENAMED Sections`

- **Show applied changes**

  - reconciliation 成功
  - SHALL 显示每个 Contract 的 sections added、modified、removed counts
  - SHALL NOT 显示独立 renamed count

- **合并 semantic relationships**

  - delta 新增或删除 relationship（endpoint 或 kind 变化以 REMOVED 旧 tuple 与 ADDED 新 tuple 表达）
  - SHALL 按 canonical tuple reconcile Formal relationship set
  - Relationship 实例 SHALL 只接受 ADDED/REMOVED，不接受 MODIFIED
  - SHALL 检查 Metamodel endpoint constraints

- **Handling conflicts during sync or archive**

  - Formal snapshot、identity precondition 或 target integrity 与 change 冲突
  - SHALL 报告具体 conflict
  - SHALL 要求 resolution 后重新 validate 与 diff
  - MUST NOT partial write 或 archive

- **Show Architecture sync summary**

  - Architecture reconciliation 成功
  - SHALL 显示 elements 的 added、modified、removed counts、relationships 的 added/removed counts 与 Metamodel kinds 的 added、modified、removed counts

### Section: Target compiler 清空 Contract 时保留 Element Declaration

当一个 Formal Element 的全部 Sections 均通过 change-local `REMOVED Sections` 被显式删除，且 target 中没有剩余、ADDED 或 MODIFIED Section 时，Target Semantic Model compiler SHALL 只清除该 Element 单元正文中的 Contract，保留同一单元中的 Element Declaration（identity、kind、parent、title、definition 不变）。

对于 contract policy 为 `optional` 的 Element Kind，序列化后 Element 单元 SHALL 只含 Declaration（declaration-only 单元）；对于 contract policy 为 `required` 的 Element Kind，Target Semantic Model validation SHALL 因 `MISSING_REQUIRED_CONTRACT` 失败。

只有 change-local 显式声明 `REMOVED` Element Declaration Entry，且删除后 containment 与 relationships 等依赖校验通过时（Element 的 Contract 随宿主单元一并删除），atomic writer SHALL 才允许删除整个 Element 单元。

- **全部 Sections 被删除（optional kind）**

  - formal Element 的 Kind contract policy 为 `optional`
  - change 对其全部 Sections 声明精确 REMOVED operation
  - target 没有新增或修改 Section
  - compiler SHALL 保留该 Element 的 Declaration 与稳定 identity
  - SHALL 序列化为只含 frontmatter Declaration 的 declaration-only 单元（正文不含 `## Specification`）

- **全部 Sections 被删除（required kind）**

  - formal Element 的 Kind contract policy 为 `required`
  - target 中该 Element 没有任何 Section
  - Target Semantic Model validation SHALL 返回 `MISSING_REQUIRED_CONTRACT` ERROR
  - sync SHALL 失败且不写入该清空后的 target 状态

- **显式删除 Element Declaration 且依赖校验通过**

  - change-local 对某 Element 声明显式 `REMOVED` Element Declaration Entry
  - 删除后无 surviving descendants、relationships 引用该 identity（Contract 随单元一并删除）
  - atomic writer SHALL 删除整个 Element 单元（Declaration 与 Contract 一并移除）

- **显式删除 Element Declaration 但存在未处理依赖**

  - change-local 声明 `REMOVED` Element Declaration Entry 但该 Element 仍有 surviving children 或 relationships
  - validation SHALL 返回全部 unresolved dependencies
  - MUST NOT 级联删除该 Element 单元

- **删除不完整**

  - formal Element 仍有剩余 Section
  - compiler SHALL 保留该 Contract 正文
  - SHALL NOT 因 Section 数量减少而推断 whole-Contract 或 whole-Element removal

- **删除存在未处理依赖**

  - removed element 仍有 surviving descendants、relationships 或其他 references
  - SHALL 返回所有 unresolved dependencies
  - MUST NOT cascade delete

- **严格 removal**

  - removed element 仍有 surviving descendants 或 relationships
  - SHALL 阻止 sync
  - MUST NOT cascade delete

### Section: Sync diagnostics 可操作

Sync validation 失败 SHALL 标识 artifact、语义问题与受影响路径，而不输出不透明的 parser 结构。

- **Delta validation fails**

  - 用户运行 `xirang sync <change>` 且 delta validation 失败
  - output SHALL 人类可读
  - SHALL 标识受影响的语义单元与路径

### Section: sync 完成后刷新 evidence fingerprint

Sync 成功写入后 SHALL 关联本次实际输出与原完整验证结论之间的确定性模型转换，保留测试与 Review 原始执行时状态及结果，不把旧测试改绑为新状态。只处理实际输出重叠路径，无重叠或无质量记录不写无关记录。不支持旧格式时明确诊断，不自动转换；已提交模型事务后的关联失败须如实报告，不声称验证仍完整。

- **模型输出转换**：Sync 只修改已声明模型输出且关联完成，正常归档可识别该转换，不伪造新的测试通过。
- **外部代码变化**：Sync 后外部改写文件或新增/删除代码，后续门禁显示不一致，不能借 Sync 关联免除受影响验证。
- **跨平台与 Change 源**：Windows 反斜杠路径按同一项目相对 POSIX 路径关联，change-local Delta 未被 Sync 写入时其原证据不变。

### Section: 保持 Target 单元完整

Sync SHALL 按 entity type 与 identity 将 Target Semantic Model 的每个单元路由到各自的存储单元；同一 identity 并存于不同实体类型时，其单元 SHALL 完整物化，MUST NOT 丢失、被覆盖或被删除。

- **跨类型同名 Element 与 Element Kind 保真同步**

  - Formal Semantic Model 同时包含同名 element 与 element-kind
  - 对任意 change 执行 sync
  - 两个单元的存储文件 SHALL 均按各自目标内容存在
  - sync MUST NOT 删除仍存在于 Target Semantic Model 的实体单元

- **跨类型同名 Element 与 Authored View 保真同步**

  - Formal Semantic Model 同时包含同名 element 与 authored view
  - 对任意 change 执行 sync
  - element 单元与 view 单元 SHALL 均按各自目标内容存在

### Section: 拒绝目标路径冲突

当 Target Semantic Model 的两个单元映射到同一存储路径时，sync SHALL 在写入前显式失败并报告冲突路径与两个单元；Formal Semantic Model MUST NOT 被修改。

- **既有单元占用另一单元的目标路径**

  - 一个既有单元存放在另一新增单元的目标路径（如 element-kind `x` 位于 `elements/x.md` 而新增 element `x`）
  - sync 准备 Target 单元树
  - SHALL 报告冲突路径与两个单元并以非零退出失败
  - Formal Semantic Model SHALL 保持不变

## MODIFIED Requirements

### Requirement: Refresh mode SHALL support formal OPSX repositories

`openspec bootstrap` SHALL 将合法的 OPSX v2 两文件仓库识别为 `formal-opsx` 并仅暴露 `refresh`；缺少任一正式文件、schema 非 v2 或 relation semantic validation 失败 SHALL 识别为 `invalid-partial-opsx`。

#### Scenario: [ADDED] v2 formal baseline exposes refresh
- **WHEN** `project.opsx.yaml` 与 `project.opsx.relations.yaml` 均存在且合法
- **THEN** `detectBootstrapBaseline()` SHALL 返回 `formal-opsx`
- **AND** allowed modes SHALL 为 `['refresh']`
- **AND** code-map 是否存在 MUST NOT 影响判定

#### Scenario: [ADDED] 非法两文件模型拒绝 refresh
- **WHEN** 任一正式文件缺失或无法通过 v2 validation
- **THEN** baseline SHALL 为 `invalid-partial-opsx`
- **AND** bootstrap SHALL NOT 暴露 refresh 入口

#### Scenario: [REMOVED] formal-opsx baseline exposes refresh as the only supported mode

- **WHEN** 仓库已存在合法的 `openspec/project.opsx.yaml`、`openspec/project.opsx.relations.yaml` 与 `openspec/project.opsx.code-map.yaml`
- **THEN** `detectBootstrapBaseline()` SHALL 返回 `formal-opsx`
- **AND** `getAllowedBootstrapModes('formal-opsx')` SHALL 返回 `['refresh']`
- **AND** pre-init `status --json` / `instructions --json` SHALL 将下一步指向 `openspec bootstrap init --mode refresh`

#### Scenario: [REMOVED] invalid partial OPSX remains rejected

- **WHEN** 仓库只存在部分 formal OPSX 文件，或任一 formal OPSX 文件无法通过 schema 校验
- **THEN** `detectBootstrapBaseline()` SHALL 返回 `invalid-partial-opsx`
- **AND** `getAllowedBootstrapModes('invalid-partial-opsx')` SHALL 返回空列表
- **AND** bootstrap SHALL NOT 为该仓库暴露 `refresh` 入口

### Requirement: Refresh scan SHALL use a git anchor when available

Refresh SHALL 从当前 source、package/build metadata 与 formal specs 执行完整扫描并重建完整 candidate。CodeGraph 可用时 MAY 提供 symbol/call/import evidence；不可用时 SHALL 允许 agent 使用 ACE、`rg` 与 `read`。旧 formal OPSX、git anchor 与 changed-path mapping MUST NOT 作为 candidate 推导输入。

#### Scenario: [ADDED] Refresh 完整重建 candidate
- **GIVEN** 仓库存在 formal OPSX
- **WHEN** refresh scan/validate 重建 candidate
- **THEN** candidate SHALL 由当前 evidence 生成完整 domains、capabilities 与 relations
- **AND** 旧 formal OPSX SHALL 仅用于后续 diff

#### Scenario: [ADDED] CodeGraph 不可用时正常降级
- **WHEN** `codegraph` 不存在或项目未建立 index
- **THEN** refresh SHALL 继续执行
- **AND** guidance SHALL 使用 ACE、`rg` 与 `read` 收集代码证据
- **AND** MUST NOT 自动安装 CodeGraph

#### Scenario: [ADDED] Windows 全量扫描路径安全
- **WHEN** refresh 在 Windows 收集当前 source/spec files
- **THEN** 文件系统路径 SHALL 使用 Node.js `path` API
- **AND** SHALL NOT 使用 code-map path matching 或假设 `/` 为唯一分隔符

#### Scenario: [REMOVED] git-aware refresh narrows scan scope

- **GIVEN** refresh metadata 中存在可解析的锚点提交
- **AND** 仓库位于有效 git work tree 中
- **WHEN** 执行 refresh scan 或 validate 以重建 candidate
- **THEN** 系统 SHALL 收集锚点提交到当前 `HEAD` 的改动路径，并纳入 staged、unstaged 与 untracked 文件
- **AND** 仅对这些路径映射到的节点及其直接关系邻居执行增量重扫
- **AND** 未受影响的 formal OPSX 节点 SHALL 被视为现有约束输入，而不是重新从零推断

#### Scenario: [REMOVED] refresh falls back to full scan without git support

- **WHEN** 仓库不在 git 中、锚点提交缺失、锚点已不可达，或 diff 结果无法可信地映射到现有节点
- **THEN** refresh SHALL 回退到全量扫描
- **AND** 系统 SHALL 继续复用现有 formal OPSX、`openspec/specs/` 与保留的 `openspec/bootstrap/` 工作区作为输入约束
- **AND** SHALL NOT 因 git 不可用而中止 refresh workflow

#### Scenario: [REMOVED] changed-path mapping is cross-platform

- **WHEN** refresh 将 git diff 路径映射到 `project.opsx.code-map.yaml` 中的 refs
- **THEN** 系统 SHALL 使用 `path.resolve()` / `path.normalize()` 一类跨平台路径规范化机制进行比较
- **AND** SHALL NOT 假设 `/` 为唯一分隔符
- **AND** Windows 上的路径大小写与分隔符差异 SHALL NOT 导致已变更节点被静默漏扫

### Requirement: Refresh review and promote SHALL be delta-first

Refresh review SHALL 展示 fresh candidate 相对旧 formal OPSX 的 domain、capability 与 relation 差异，包括 relation add/remove/type/endpoint change。审批后 promote SHALL 原子替换两个 formal v2 文件，不执行 partial graph merge；输入不变时重复 refresh SHALL 产生相同 candidate。

#### Scenario: [ADDED] Review 仅将旧 OPSX 用作 diff
- **WHEN** refresh 生成 review
- **THEN** review SHALL 展示 added/modified/removed graph facts
- **AND** 旧 formal 内容 MUST NOT 被隐式复制进 candidate

#### Scenario: [ADDED] Promote 整体替换两文件
- **GIVEN** review approved 且 candidate current
- **WHEN** `openspec bootstrap promote` 执行
- **THEN** SHALL 原子写入 `project.opsx.yaml` 与 `project.opsx.relations.yaml`
- **AND** MUST NOT 写 code-map 或调用 partial relation merge

#### Scenario: [ADDED] 重复 refresh 幂等
- **GIVEN** source、specs、config 与 projection 未变化
- **WHEN** 连续执行两轮 refresh candidate generation
- **THEN** candidate outputs SHALL 字节一致

#### Scenario: [REMOVED] refresh review focuses on deltas against current formal OPSX

- **GIVEN** 仓库已有 formal OPSX
- **WHEN** refresh 生成 review 产物
- **THEN** review SHALL 明确展示相对当前 formal OPSX 的 ADDED / MODIFIED / REMOVED domains、capabilities 与 relations
- **AND** SHALL 标注哪些现有节点被保留为未变更基线
- **AND** review approval SHALL 在增量输入变化后变为 stale

#### Scenario: [REMOVED] refresh promote merges reviewed OPSX changes

- **GIVEN** refresh review 已批准且 candidate delta 仍为 current
- **WHEN** 执行 `openspec bootstrap promote`
- **THEN** 系统 SHALL 基于当前 formal OPSX 执行 merge/delta 应用
- **AND** SHALL NOT 直接用 candidate `project.opsx*.yaml` 整包覆盖 formal 三文件
- **AND** merge 后结果 SHALL 继续通过 referential integrity 与 code-map integrity 校验

#### Scenario: [REMOVED] refresh spec conflicts fail explicitly

- **GIVEN** refresh 识别出新增 capability 需要写入 formal spec
- **AND** 目标 `openspec/specs/<capability>/spec.md` 已存在且内容不属于本次新增目标
- **WHEN** 执行 promote
- **THEN** 命令 SHALL 失败并报告冲突路径
- **AND** SHALL NOT 隐式 merge、覆盖或删除已有 formal spec
- **AND** 对 formal OPSX 的写入 SHALL 一并中止

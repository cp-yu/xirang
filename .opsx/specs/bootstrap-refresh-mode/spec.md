# Spec: bootstrap-refresh-mode

## Purpose

定义 `formal-opsx -> refresh` 的 bootstrap 合同，包括 git-aware 扫描范围收敛、delta-first review，以及 merge-based promote。
## Requirements
### Requirement: Refresh mode SHALL support formal OPSX repositories

`opsx bootstrap` SHALL 将合法的 OPSX v2 两文件仓库识别为 `formal-opsx` 并仅暴露 `refresh`；缺少任一正式文件、schema 非 v2 或 relation semantic validation 失败 SHALL 识别为 `invalid-partial-opsx`。

#### Scenario: v2 formal baseline exposes refresh
- **WHEN** `project.opsx.yaml` 与 `project.opsx.relations.yaml` 均存在且合法
- **THEN** `detectBootstrapBaseline()` SHALL 返回 `formal-opsx`
- **AND** allowed modes SHALL 为 `['refresh']`
- **AND** code-map 是否存在 MUST NOT 影响判定

#### Scenario: 非法两文件模型拒绝 refresh
- **WHEN** 任一正式文件缺失或无法通过 v2 validation
- **THEN** baseline SHALL 为 `invalid-partial-opsx`
- **AND** bootstrap SHALL NOT 暴露 refresh 入口

### Requirement: Refresh scan SHALL use a git anchor when available

Refresh SHALL 从当前 source、package/build metadata 与 formal specs 执行完整扫描并重建完整 candidate。CodeGraph 可用时 MAY 提供 symbol/call/import evidence；不可用时 SHALL 允许 agent 使用 ACE、`rg` 与 `read`。旧 formal OPSX、git anchor 与 changed-path mapping MUST NOT 作为 candidate 推导输入。

#### Scenario: Refresh 完整重建 candidate
- **GIVEN** 仓库存在 formal OPSX
- **WHEN** refresh scan/validate 重建 candidate
- **THEN** candidate SHALL 由当前 evidence 生成完整 domains、capabilities 与 relations
- **AND** 旧 formal OPSX SHALL 仅用于后续 diff

#### Scenario: CodeGraph 不可用时正常降级
- **WHEN** `codegraph` 不存在或项目未建立 index
- **THEN** refresh SHALL 继续执行
- **AND** guidance SHALL 使用 ACE、`rg` 与 `read` 收集代码证据
- **AND** MUST NOT 自动安装 CodeGraph

#### Scenario: Windows 全量扫描路径安全
- **WHEN** refresh 在 Windows 收集当前 source/spec files
- **THEN** 文件系统路径 SHALL 使用 Node.js `path` API
- **AND** SHALL NOT 使用 code-map path matching 或假设 `/` 为唯一分隔符

### Requirement: Refresh review and promote SHALL be delta-first

Refresh review SHALL 展示 fresh candidate 相对旧 formal OPSX 的 domain、capability 与 relation 差异，包括 relation add/remove/type/endpoint change。审批后 promote SHALL 原子替换两个 formal v2 文件，不执行 partial graph merge；输入不变时重复 refresh SHALL 产生相同 candidate。

#### Scenario: Review 仅将旧 OPSX 用作 diff
- **WHEN** refresh 生成 review
- **THEN** review SHALL 展示 added/modified/removed graph facts
- **AND** 旧 formal 内容 MUST NOT 被隐式复制进 candidate

#### Scenario: Promote 整体替换两文件
- **GIVEN** review approved 且 candidate current
- **WHEN** `opsx bootstrap promote` 执行
- **THEN** SHALL 原子写入 `project.opsx.yaml` 与 `project.opsx.relations.yaml`
- **AND** MUST NOT 写 code-map 或调用 partial relation merge

#### Scenario: 重复 refresh 幂等
- **GIVEN** source、specs、config 与 projection 未变化
- **WHEN** 连续执行两轮 refresh candidate generation
- **THEN** candidate outputs SHALL 字节一致

### Requirement: Refresh restart SHALL preserve retained workspace audit history

对已完成的 retained workspace 显式执行 restart 以开启新的 refresh run 时，系统 SHALL 在创建新工作目录前保留上一轮 workspace 作为审计历史。

#### Scenario: completed retained workspace is snapshotted before restart

- **GIVEN** 仓库 baseline 为 `formal-opsx`
- **AND** 当前 `.opsx/bootstrap/` 是已完成 promote 的 retained workspace
- **WHEN** 用户执行 `opsx bootstrap init --mode refresh --restart`
- **THEN** 系统 SHALL 先将现有 workspace 移动到 OPSX 管理的显式历史目录
- **AND** SHALL 再创建新的 `.opsx/bootstrap/` 作为下一轮 refresh run 的工作目录
- **AND** 成功输出 SHALL 包含历史快照路径

#### Scenario: restart carries forward only stable input state

- **GIVEN** 已完成 retained workspace 的 metadata 中存在上一轮 scope，且可能存在 `refresh_anchor_commit`
- **WHEN** 用户执行 `opsx bootstrap init --mode refresh --restart`
- **THEN** 新 workspace SHALL 继承上一轮 scope，除非用户显式传入新的 `--scope`
- **AND** 未传 `--granularity` 时 SHALL 继承 retained `scope.yaml` 的 granularity，显式传入时 SHALL 覆盖 retained 值
- **AND** 新 workspace SHALL 继承可用的 `refresh_anchor_commit`
- **AND** `source_fingerprint`、`candidate_fingerprint`、`review_fingerprint` 与 `candidate_spec_paths` SHALL 被显式清空

#### Scenario: restart falls back to full scan when no prior anchor exists

- **GIVEN** 已完成 retained workspace 没有可用的 `refresh_anchor_commit`
- **WHEN** 用户执行 `opsx bootstrap init --mode refresh --restart`
- **THEN** restart SHALL 仍然成功创建新的 refresh workspace
- **AND** 后续 refresh scan SHALL 回退到全量扫描，直到新的 promote 写入锚点

## Why

模型更新与 Change 封存目前分属两条命令；后一步取消或失败时，前一步的模型写入仍然生效。另有一些 Change 已决定不再推进，需要保留提案和进度，而不是应用 Delta 或删除目录。

## What Changes

- 以一次 `archive` 完成模型更新与封存；`--quick` 只豁免 Seal，`--abandon` 只留档。成功后的修改通过新 Change 表达，不做撤销归档或跨进程恢复。
- **BREAKING**：删除 `xirang sync` 以及 archive 的 `--no-sync`、`--no-validate`、`--no-verify`。工作流、命令发现面和现行文档改用新协议。
- 归档保留 Delta 操作边界及现有正文校验。Formal Contract 的通用解析与 Markdown / HTML 可见正文识别单独交付。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `change-archive`、`change-sync`、`archive-quality-gate`：统一入口、模型写入、三种模式及结果、归档证据门禁。
- `change-closure`、`change-realization`、`project.root`：区分正常交付、免 Seal 的交付及未交付的放弃留档。
- `change-implementation`、`quality`：区分正常完成 Quality 与获授权豁免，不将放弃算作完成实现。
- `deterministic-operations`：进程内失败时模型与活动目录的一致性边界。
- `archive-role`、`agent-prompt-guidance`、`snack-workflow`、`post-propose-validation`：Agent 的分支选择、结果报告与只读阶段边界。
- `semantic-model-build`：避免用历史上的独立命令边界误判现行归档能力。
- `completion-command`、`completion-introspect`：区分普通 Change ID 与归档位置参数补全，归档历史补全与重试共享完成判定。

### Architecture Source

#### Added Elements

None

#### Modified Elements

- `change-archive`、`change-sync`、`archive-quality-gate`：沿用 identity 与 parent，改用现有 `capability-specification` Kind；分别负责收束入口、内部模型应用和模式对应的 Seal 门禁。
- `change-closure`、`change-realization`、`archive-role`：阶段与角色边界覆盖交付和放弃两种终态。

#### Removed Elements

None

#### Architecture Relations

None。命令退役不等于内部同步能力消失；不改变层级、关系、Kind 定义或 View。

## Impact

影响 CLI 注册与归档事务、两类历史目录的查找、Archive/Snack/Propose 提示词及投影、补全、现行命令文档和回归测试。旧调用方须显式迁移，不改写历史归档，不迁移已有模型。

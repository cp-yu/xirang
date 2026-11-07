## Why

当前 Reviewer 的委派输入、审查对象与 Quality opinion 字段仍沿用 `reviewId`、`scope` 和由调用方指定 commit 的旧协议；提示词、模型与生成权限还包含重复或互相冲突的判断规则。需要统一独立审查与主 Agent 编排之间的边界，使意见只对实际审查的提交和工作成立。

## What Changes

- **BREAKING**：Review opinion 移除 `reviewId`，以 `reviewKind` 区分 `full-change`、`incremental` 和 `supplemental`；Quality JSON 升为 v4，旧 v3 原样保留并明确报不支持，相应更新记录、门禁及指令投影。
- 主 Agent 可按质量维度并行委派 Reviewer，汇总为一条意见；Review 前提交待审代码并完成所需测试。
- Reviewer 自主确定审查 checkout 的 `HEAD`，以 `baseCommit` 到 `HEAD` 的累计差异定位 Change，独立判断相关代码、测试和目标语义；输入或状态失效时不提交 opinion。
- Reviewer 获得与主 Agent 相同的可用工具范围，以指令保持只读；精简重复、过期及由 Propose/CLI 负责的审查规则。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `reviewer`、`reviewer-protocol`、`reviewer-cleanliness`：审查输入、取证、判断、失败与输出规则。
- `review`、`quality`、`quality-cli-gate`、`quality-writeback`：三类 Review 的职责、v4 opinion 与门禁语义。
- `quality-orchestration`、`apply-quality-integration`、`agent`：主 Agent 的提交、测试、委派、等待和结果合并。
- `subagent-self-read`、`internal-agents`、`internal-subagent-generation`：Reviewer 的工具能力与跨平台投影。
- `quality-aware-instructions`、`agent-prompt-guidance`：Quality 状态及共享指令中的新意见协议。

### Architecture Source

#### Added Elements

None

#### Modified Elements

- `reviewer`：独立从委派 checkout 的 `HEAD` 确定被评估提交，而非接收调用方传入的 commit。
- `reviewer-cleanliness`：仅定义本次审查相关的清理判断，不再拥有旧式文件归因流程和结构化计数 schema。

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- Quality CLI 的 Review schema、持久化、状态和 Seal 门禁，以及由协议生成的说明。
- Apply/Archive 的 Review 委派和恢复指令，Reviewer 提示词及四种工具的内部 subagent 制品。
- 相关单元、集成与跨平台生成测试；现存未提交的实现和生成文件不属于本次 Formation 写入范围。

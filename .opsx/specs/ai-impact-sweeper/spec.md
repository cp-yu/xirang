---
element: cap.ai.impact-sweeper
---

# ai-impact-sweeper Specification

## Purpose
定义 `opsx-impact-sweeper` 的输入、只读证据收集、canonical JSON 输出与降级行为，使 Explore 能在不修改项目文件的前提下获得 OPSX-grounded 影响面报告。
## Requirements
### Requirement: Evidence Protocol 使用 CLI 查询接口

Impact sweeper SHALL 对每个 seed 通过 `opsx arch query <element-id-or-fqn> --relations --json` 获取 stable element、refinement context 与精确 relation paths，再通过 `opsx list --specs --json` 获取 element→Spec contracts。Sweeper MUST NOT 直接读取 formal OPSX YAML。代码证据 SHALL 优先使用可用且已索引的 CodeGraph；否则 SHALL 回退 ACE、`rg`、`read` 与 `git ls-files`。CodeGraph 缺失 MUST NOT 阻塞 sweep。

#### Scenario: OPSX relation path 优先
- **WHEN** concept 映射到一个或多个 element seeds
- **THEN** sweeper SHALL 批量查询 seeds 及必要深度的 relations
- **AND** SHALL 按 refinement context 与 `invokes`、`produces`、`consumes`、`precedes`、`constrains`、`validates` 的 propagation hint 构建候选路径
- **AND** refinement containment SHALL 只提供 abstraction context
- **AND** relation 本身 MUST NOT 单独证明 `mustChange`
- **AND** MUST NOT 将无解释的邻居集合直接声明为影响结论

#### Scenario: 查询 element→Spec 映射
- **WHEN** sweeper 需要行为合同
- **THEN** SHALL 执行 `opsx list --specs --json`
- **AND** SHALL 使用每个 Spec 的 singular `element` binding 选择需读取的 contracts

#### Scenario: CodeGraph 可选加速
- **GIVEN** `codegraph` 可调用且项目 index 可用
- **WHEN** sweeper 收集代码传播证据
- **THEN** MAY 使用 CodeGraph symbol、call/import path 与 blast-radius output
- **AND** MUST NOT 读取 `.codegraph/codegraph.db`

#### Scenario: CodeGraph 不可用时降级
- **WHEN** CodeGraph 不存在、未索引或调用失败
- **THEN** sweeper SHALL 使用 ACE、`rg`、`read` 与 tracked-file search 继续
- **AND** SHALL 将降低的代码图覆盖记录到 `unknown` 或 evidence gap
- **AND** MUST NOT 因缺少 CodeGraph 凭猜测升级为 `mustChange`

#### Scenario: OPSX 与代码 evidence 冲突

- **WHEN** semantic relation 与当前 call、import 或 symbol evidence 冲突
- **THEN** report SHALL 记录 `architectureDrift`
- **AND** SHALL 保留两侧 evidence

#### Scenario: 读取 Specs 时执行术语提取

- **WHEN** sweeper 读取相关 Specs 且 caller 提供 concept
- **THEN** SHALL 继续提取语义相近术语及分布
- **AND** SHALL 汇总到 `terminologyObservations`

### Requirement: 直接返回 canonical JSON report

`opsx-impact-sweeper` SHALL 在成功时直接返回一个符合 `opsx-report-schema.md` 的 JSON object。该对象 SHALL 使用 `mustChange`、`mustVerify`、`contextual`、`unknown`、`architectureDrift` 与 `questions` canonical fields；每个非 question finding SHALL 包含 `target`、`relationPath`、`reason` 与 `evidence`。Sweeper MUST NOT 返回 report path、Markdown code fence 或额外 summary。

#### Scenario: 成功返回影响面报告

- **WHEN** sweeper 完成一个 concept 的分析
- **THEN** SHALL 直接返回一个 canonical JSON object
- **AND** SHALL NOT 创建 report file
- **AND** SHALL NOT 返回 path 或 JSON 之外的说明文字

#### Scenario: 不确定性显式输出

- **WHEN** OPSX、Spec 或代码证据不足或相互冲突
- **THEN** SHALL 使用 `unknown` 或 `architectureDrift`
- **AND** MUST NOT 将模糊相关性升级为 `mustChange`

### Requirement: Sweeper 全程只读

`opsx-impact-sweeper` SHALL NOT 创建、修改、删除或覆盖任何文件，也 MUST NOT 通过 Bash 绕过只读边界。Sweeper SHALL NOT 运行 tests、builds、installs、`git diff`、`git status` 或 `git log` 作为 impact evidence；它 MAY 使用 `git ls-files`、文件读取与文本搜索。

#### Scenario: 只读收集 evidence

- **WHEN** sweeper 收集 impact evidence
- **THEN** SHALL 只使用只读 OPSX CLI、Spec/code reads、`git ls-files` 与文本搜索
- **AND** SHALL NOT 产生任何项目文件或 OPSX artifact

#### Scenario: Report 仅属于当前 Explore 对话

- **WHEN** Explore 消费 sweeper 返回的 JSON object
- **THEN** 该 object SHALL 仅作为当前对话的 impact evidence
- **AND** SHALL NOT 成为 sync 或 archive input

### Requirement: Impact sweeper description 提示 fast model

`opsx-impact-sweeper` agent description SHALL 明确提示调用方优先使用 fast model 执行该轻量级 OPSX-grounded impact sweep。该提示 MUST 保持为描述性偏好，不得要求模板设置具体 `model` 字段。

#### Scenario: description 包含 fast model 偏好

- **WHEN** 系统读取 `opsx-impact-sweeper` subagent template
- **THEN** `description` SHALL 包含 `Prefer a fast model for this lightweight OPSX-grounded impact sweep.`
- **AND** 模板 SHALL NOT 因该提示设置具体 `model` 字段

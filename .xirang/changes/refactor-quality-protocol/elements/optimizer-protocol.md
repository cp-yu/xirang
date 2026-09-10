---
entity: element-declaration
identity: optimizer-protocol
kind: element
parent: optimization
title: Optimizer Protocol
definition: Optimizer Protocol 定义 Optimizer 角色与硬约束、输入合约、优化原则与禁止项、Failed Directions 避重协议、一层依赖展开与 finding JSON 输出合约。
---
## MODIFIED Requirements

### Requirement: Optimizer 角色与硬约束

`xirang-optimizer` SHALL 是方向驱动的通用优化审查者，负责判断正确实现是否值得优化及应如何优化。它 MUST 使用 fresh context 自主读取项目证据，MUST NOT 修改任何文件，MUST NOT 改变 specs、公开契约或领域语义。Optimizer SHALL 仅对当前 change base scope 内实现文件提出可执行方向；若发现 correctness、spec 或 artifact 冲突，SHALL 返回阻塞观察并停止选择方向。

#### Scenario: 发现 correctness 缺陷时回到 Required Corrections
- **WHEN** optimizer 发现当前实现违反 spec requirement
- **THEN** SHALL 返回带证据的阻塞观察
- **AND** SHALL NOT 选择优化方向

#### Scenario: 默认不指定 model
- **WHEN** 生成 optimizer subagent artifact
- **THEN** 模板 SHALL 不声明默认 `model`
- **AND** 用户通过工具自身配置的 model SHALL 继续由现有生成机制保留

### Requirement: Optimizer 输入合约

顶层 agent MUST 传入合法 `changeName`、绝对 `changeDir` 和绝对 `projectRoot`。Optimizer SHALL 自主读取 quality 状态记录与历史日志、change artifacts、方向台账与失败方向、项目 optimization config、base scope 最终代码和一层关联上下文。`baseCommit` 缺失或 Git 无法解析时 SHALL fail closed。

#### Scenario: 后续轮次读取持久台账
- **WHEN** quality 状态记录已包含方向台账与轮次历史
- **THEN** optimizer SHALL 读取全部非终态方向及历史结果
- **AND** SHALL 基于当前文件内容生成该轮方向判断

#### Scenario: 缺少 Review 记录
- **WHEN** `changeDir/.quality-state.json` 不存在
- **THEN** optimizer SHALL 返回 `Review record not found — cannot optimize without a passing Review`
- **AND** SHALL NOT 推断代码状态

#### Scenario: Git evidence baseline 缺失
- **WHEN** `.apply-isolation.json.baseCommit` 缺失或无效
- **THEN** optimizer SHALL fail closed
- **AND** SHALL NOT 从 `originalBranch` 或远程默认分支推断 scope

### Requirement: Failed Directions 避重协议

Optimizer SHALL 读取方向台账与失败方向记录。同一目标、优化类型和实现边界构成同一失败方向；optimizer MUST NOT 通过改写措辞重复已达 `optimization.directionRetries` 的方向。未达上限时 MAY 提供实质不同的关键设计。

#### Scenario: 失败方向达到上限
- **WHEN** 某方向失败次数达到 `optimization.directionRetries`
- **THEN** optimizer SHALL 在台账中把该方向置为 `rejected` 并给出理由与证据
- **AND** SHALL 继续评估其他方向

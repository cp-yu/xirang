---
entity: element-declaration
identity: internal-agents
kind: domain
parent: agents
title: "Internal Agents"
summary: "在隔离 clean context 中承担独立判断的只读 Agents。"
---

## Requirements

### Requirement: 在 Clean Context 中判断
Internal Agents SHALL 在不受 Apply 上下文影响的 clean context 中作出判断。

#### Scenario: Agent 请求独立评估
- **WHEN** 当前项目状态需要 Review 或 Optimization
- **THEN** Internal Agent 在隔离上下文中开始评估

### Requirement: 独立读取判断依据
Internal Agents SHALL 独立读取 Semantic Model、Change 与项目证据。

#### Scenario: 形成评估结论
- **WHEN** Internal Agent 接手任务
- **THEN** 它从当前项目状态获取所需依据

### Requirement: 输出结构化结论
Internal Agents SHALL 输出结构化结论供 Agent 消费。

#### Scenario: 独立判断完成
- **WHEN** Internal Agent 完成评估
- **THEN** Agent 获得可执行的结构化结论

### Requirement: 不修改项目
Internal Agents SHALL NOT 修改项目。

#### Scenario: 发现需要修正或优化的事项
- **WHEN** Internal Agent 识别出项目改动
- **THEN** 它返回事项而不直接写入文件

### Requirement: 不关闭 Change
Internal Agents SHALL NOT 关闭 Change。

#### Scenario: 验证结论通过
- **WHEN** Internal Agent 判断当前状态满足门禁
- **THEN** Closure 仍由 Agent 编排

### Requirement: 不提升 Semantic Model
Internal Agents SHALL NOT 提升 Semantic Model。

#### Scenario: Candidate 通过评估
- **WHEN** Internal Agent 没有发现阻塞问题
- **THEN** 它不执行 promotion

### Requirement: 不替代确定性查询
影响发现、模型导航和关系查询 SHALL 由 CLI 与 Semantic Browser 承担，而不是由 Internal Agents 重做。

#### Scenario: 需要模型影响上下文
- **WHEN** Internal Agent 需要确定性关系信息
- **THEN** 它消费 Interaction Surface 提供的结果

---
entity: element-declaration
identity: semantic-model-build
kind: capability
parent: realization
title: "Semantic Model Build"
summary: "在授权范围和依据下构建或重建完整 Candidate Semantic Model 的过程。"
---

## Requirements

### Requirement: 遵守用户授权范围与依据
Semantic Model Build SHALL 在用户授权的探索范围与声明的权威依据下推进。

#### Scenario: 开始模型构建
- **WHEN** 用户明确范围与权威来源
- **THEN** Agent 只在授权边界内编译目标语义

### Requirement: 产出完整 Candidate
Semantic Model Build SHALL 产出一个完整四分区 Candidate Semantic Model。

#### Scenario: Candidate 可供审查
- **WHEN** 模型编写完成
- **THEN** Candidate 联合包含 Metamodel、Elements、Relationships 与 Views

### Requirement: 不通过 Change 构建模型
Semantic Model Build SHALL NOT 通过 Change 或 Semantic Delta 构建或重建 Semantic Model。

#### Scenario: 执行 Project Build
- **WHEN** 目标是整体构建模型
- **THEN** Agent 使用 Candidate 而不创建模型 Change

### Requirement: 只读校验 Candidate
CLI SHALL 对 Candidate 执行只读确定性校验。

#### Scenario: Candidate 存在错误
- **WHEN** 校验发现无效语义或记法
- **THEN** CLI 返回 diagnostics 且不修改 Candidate

### Requirement: 返回 Review Digest
CLI SHALL 为有效 Candidate 返回绑定该精确版本的 review digest。

#### Scenario: Candidate 校验通过
- **WHEN** Candidate 没有验证错误
- **THEN** CLI 返回可供确认的 digest

### Requirement: 由用户确认精确版本
Promotion SHALL 仅接受用户确认的 Candidate 精确版本。

#### Scenario: Candidate 在确认后改变
- **WHEN** 当前内容与用户确认的 digest 不一致
- **THEN** CLI 拒绝 promotion

### Requirement: 原子提升并保留 History
用户确认后，CLI SHALL 将 Candidate 原子提升为 Semantic Model 并保留必要 history。

#### Scenario: Promotion 成功
- **WHEN** 当前 Candidate 匹配已确认 digest
- **THEN** 正式模型整体进入新状态且历史保留

### Requirement: 整体替换正式模型
Promotion SHALL 以 Candidate 的四个分区整体替换 `.xirang/model/`；Candidate 中不存在的正式模型单元 SHALL NOT 被保留。

#### Scenario: Candidate 删除旧单元
- **WHEN** 已确认 Candidate 不包含旧模型中的实体
- **THEN** promotion 后该实体不再属于正式模型

### Requirement: 隔离临时构建依据
`build.md` 等临时 scaffolding SHALL NOT 成为提升后 Semantic Model 的组成。

#### Scenario: 提升 Candidate
- **WHEN** promotion 成功
- **THEN** `.xirang/model/` 仅包含四个规范分区

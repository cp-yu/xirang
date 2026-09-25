---
entity: "element-declaration"
identity: "semantic-model-build"
kind: "element"
parent: "realization-process"
title: "Semantic Model Build"
definition: "Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写完整的 Candidate Semantic Model，由 CLI 做只读确定性校验并给出 review digest，用户确认后由 CLI 原子提升为 Semantic Model 并保留必要 history；本过程不通过 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 按项目配置形成 Candidate hierarchy
Semantic Model Build SHALL 在 Modeling Decision Gate 与首次 Candidate hierarchy 写入前消费 normalized `decomposition`：完整读取解析路径指向的指导文件，并按其形成 Candidate hierarchy；文件缺失或不可读时 fail closed。CLI 解析是机械的名称到路径映射，SHALL NOT 解释方法论内容。拆分指导只决定 Element abstraction/refinement 使用的分解坐标系，SHALL NOT 覆盖用户授权、证据权威、Element Contract 或 Relationship 语义。

#### Scenario: 读取解析后的指导文件
- **WHEN** 有效配置的 `decomposition` 解析出指导文件路径
- **THEN** Build 在结构决策前完整读取该文件并遵循其拆分指导
- **AND** 对每个 sibling set 执行单维度、MECE 与 BFS 检查

#### Scenario: 指导文件不可用时停止结构形成
- **WHEN** 解析路径的指导文件缺失或不可读
- **THEN** Build fail closed 并报告该解析路径
- **AND** 不以任何默认方法继续写入 Candidate hierarchy

#### Scenario: 独立语义审查检查拆分一致性
- **WHEN** Candidate 进入 clean-context semantic review
- **THEN** review 检查 hierarchy 是否一致应用已选择的拆分指导
- **AND** 检查同一 sibling set 未混合不相容的职责、生命周期、部署或实现维度

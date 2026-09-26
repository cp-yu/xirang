---
entity: "element-declaration"
identity: "definition-framing"
kind: "element"
parent: "explore"
title: "Definition Framing"
definition: "Definition Framing 是项目意图形成过程中澄清并保留已确认关键设计的方法。它独立建模，为 Semantic Model Build 与 Explore 提供共同的确认依据形成方式，包含关键内容的识别、确认、冲突调和与记录修订；结构分解是其中适用的活动，而非全部范围。它不负责生成完整 Semantic Model 或 Change，也不承担项目实现。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 按项目拆分指导确认结构目标
Definition Framing SHALL 在提出或确认 Element hierarchy 目标前消费 normalized `decomposition`：完整读取解析路径指向的指导文件并按其指导形成结构。拆分指导 SHALL 与因果定义、identity 边界、单维度、MECE 和 BFS confirmation 联合使用，并 SHALL NOT 代替用户对本次记录内容的显式确认。

#### Scenario: 指导文件驱动结构讨论
- **WHEN** Definition Framing 需要为一个 parent 确定完整 sibling set 且配置有效
- **THEN** Agent 在结构讨论前完整读取该指导文件
- **AND** 再以单维度、MECE 与 BFS 检查该层结构

#### Scenario: 拆分指导不可读时停止
- **WHEN** 解析路径的指导文件缺失或不可读
- **THEN** Definition Framing 停止形成受影响结构目标并询问用户
- **AND** SHALL NOT 创建或更新 framing payload

#### Scenario: 拆分指导不覆盖 Formal 语义
- **WHEN** 拆分指导与 Formal Semantic Model、用户明确意图或已确认结构目标冲突
- **THEN** Agent 报告冲突并请求用户裁决
- **AND** SHALL NOT 用拆分指导静默替换规范语义

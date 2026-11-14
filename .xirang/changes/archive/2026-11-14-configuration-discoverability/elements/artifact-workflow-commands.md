---
entity: element-declaration
identity: "artifact-workflow-commands"
kind: "element"
parent: "deterministic-operations"
title: "Artifact Workflow Commands"
definition: "Artifact Workflow Commands 是 Change 制品推进的 CLI 命令面。它通过 status 展示制品依赖、完成概况与实现推进状态，通过 templates 查询模板位置，通过 new change 创建活动 Change；适用于 scaffolded 与已有 Change。静态制品写作和推进指导由工作流文件承载，Quality 详情由专门的质量查询提供。"
---

## ADDED Sections

### Section: Semantic Delta 制品查询

semantic-model 的 status、templates 及后续制品发现 SHALL 使用 semantic-delta 标识四分区语义差量。status SHALL 在对应制品上返回四分区输出范围和实际输出路径，以 semantic-delta 表达 tasks 缺失的差量依赖；templates SHALL 将 semantic-delta 映射到 schema 的 delta.md。

- proposal 与 design 已存在，差量和 .delta-noop 均缺失：semantic-delta 为 ready，tasks 为 blocked 且缺失依赖为 semantic-delta。
- 仅关系差量存在：状态在 semantic-delta 下列出实际关系文件，完成判定不要求 Element Contract 差量。

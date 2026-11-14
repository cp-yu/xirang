---
entity: element-declaration
identity: "artifact-graph"
kind: "element"
parent: "deterministic-operations"
title: "Artifact Graph"
definition: "Artifact Graph 定义 schema-driven workflows 使用的 artifact graph model：schema 加载、构建顺序计算、完成状态检测、ready/blocked 查询、完成检查与 schema 目录结构。"
---

## ADDED Sections

### Section: Semantic Model 制品图

semantic-model schema SHALL 使用 proposal、semantic-delta、design、tasks 四个制品 ID。proposal 无前置依赖；semantic-delta 与 design 依赖 proposal；tasks 依赖 semantic-delta 与 design；Apply 的 requires 为 tasks，tracks 为 tasks.md。

semantic-delta SHALL 表达完整四分区 Semantic Delta，输出匹配 `{elements,metamodel,relationships,views}/**/*`，模板为 delta.md，无语义差量时的完成标记为 .delta-noop。状态、ready/blocked、缺失依赖和模板映射 SHALL 使用同一制品 ID；所有分区均可独立构成差量，不把 semantic-delta 限于 Element Contracts。

- proposal 完成后：semantic-delta 与 design 可推进；只有 design 完成时，tasks 仍等待 semantic-delta。
- Change 只有 relationships 或 views 差量：semantic-delta 按输出存在性判为完成。
- 四分区无输出且有 .delta-noop：semantic-delta 完成；四分区和标记都缺失：未完成。
- template/status JSON 使用 semantic-delta 标识该制品，指向相同四分区及 delta.md。

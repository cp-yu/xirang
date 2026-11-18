---
operation: MODIFIED
entity: element-declaration
identity: status-command
kind: element
parent: deterministic-operations
title: Status Command
definition: Status Command 定义 xirang status 对 Change 制品、目标与默认 Quality 状态的查询，以及空查询和错误的结果。
---

## ADDED Sections

### Section: 不读取 Quality 的制品状态

`xirang status --no-quality` SHALL 保持制品状态、目标计数和非 Quality 诊断，不读取 Quality 记录、不评估 Review、Opt 或 Seal，也不输出 Quality 诊断。其 `ready` 与 `blocked` 只描述制品与目标，不表示该 Change 的 Quality 门禁已通过。未指定该选项时，状态查询保留既有的 Quality 评估行为。

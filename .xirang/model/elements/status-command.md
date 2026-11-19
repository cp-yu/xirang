---
entity: element-declaration
identity: status-command
kind: element
parent: deterministic-operations
title: Status Command
definition: Status Command 定义 xirang status 对 Change 制品、目标与默认 Quality 状态的查询，以及空查询和错误的结果。
---

## Specification

### Section: Status command exits gracefully when no changes exist

未提供 --change 且不存在任何活动 Change 时，status SHALL 返回有效的空查询结果并以 exit code 0 退出。JSON SHALL 返回 {"changes":[]}；文本 SHALL 明确表示没有活动 Change，不附创建指令或通用成功回执。该结果 SHALL 与无返回数据操作成功时的空 stdout 区分。

### Section: Existing status validation behavior is preserved

存在活动 Change 但用户未提供 --change 时，status SHALL 非零退出，并在 stderr 给出 Missing required option --change 及可用 Change。显式指定不存在的 Change 时 SHALL 非零退出，并报告 Change '<name>' not found。--json 时诊断 SHALL 为结构化 JSON。

无活动 Change 的优雅退出只适用于未选择目标的 status 查询；显式指定不存在的目标不得变成成功空结果。

### Section: 不读取 Quality 的制品状态

`xirang status --no-quality` SHALL 保持制品状态、目标计数和非 Quality 诊断，不读取 Quality 记录、不评估 Review、Opt 或 Seal，也不输出 Quality 诊断。其 `ready` 与 `blocked` 只描述制品与目标，不表示该 Change 的 Quality 门禁已通过。未指定该选项时，状态查询保留既有的 Quality 评估行为。

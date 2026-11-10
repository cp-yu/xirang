---
entity: element-declaration
identity: status-command
kind: element
parent: deterministic-operations
title: "Status Command"
definition: "Status Command 定义 `xirang status` 的行为：无 changes 时优雅退出，并保留既有 validateChangeExists 的错误路径行为。"
---

## MODIFIED Sections

### Section: Status command exits gracefully when no changes exist

未提供 --change 且不存在任何活动 Change 时，status SHALL 返回有效的空查询结果并以 exit code 0 退出。JSON SHALL 返回 {"changes":[]}；文本 SHALL 明确表示没有活动 Change，不附创建指令或通用成功回执。该结果 SHALL 与无返回数据操作成功时的空 stdout 区分。

### Section: Existing status validation behavior is preserved

存在活动 Change 但用户未提供 --change 时，status SHALL 非零退出，并在 stderr 给出 Missing required option --change 及可用 Change。显式指定不存在的 Change 时 SHALL 非零退出，并报告 Change '<name>' not found。--json 时诊断 SHALL 为结构化 JSON。

无活动 Change 的优雅退出只适用于未选择目标的 status 查询；显式指定不存在的目标不得变成成功空结果。

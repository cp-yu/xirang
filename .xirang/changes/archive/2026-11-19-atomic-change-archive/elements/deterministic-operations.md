---
entity: element-declaration
identity: deterministic-operations
kind: element
parent: cli
title: Deterministic Operations
definition: Deterministic Operations 是 Realization 中提供可复现操作的 CLI 能力。它包含结构化查询、状态管理、程序化校验、验证证据持久化与原子状态转换，支持显式请求的差异和完整语义读取；静态工作指导由受管文件承载。它不替代用户意图裁决、Agent 语义判断或独立质量评估。
---

## MODIFIED Sections

### Section: Sync 失败完整回滚

CLI SHALL 在默认或 quick 交付的同次调用中对模型写入与归档移动共同处理失败。移动失败时撤回本次模型写入并保留活动 Change。此保证不包括进程终止后的恢复；放弃只移动 Change，不应用或回退模型。

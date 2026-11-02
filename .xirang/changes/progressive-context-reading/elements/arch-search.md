---
entity: element-declaration
identity: arch-search
kind: element
parent: deterministic-operations
title: Arch Search
definition: Arch Search 定义 `xirang arch search` 的确定性文本检索行为：只读 Formal Semantic Model，在 Element identity、FQN、title、definition 与其单一 Contract 的 Section 标题中执行确定性检索，使用稳定匹配优先级并返回可解释的统一结果。
---

## MODIFIED Sections

### Section: arch search SHALL 返回可解释的统一结果

命令 SHALL 从一个 canonical result object 投影 human-readable 与 `--json` 输出。默认每个 match SHALL 返回最小候选投影：stable identity、title、parent、匹配字段、有限 match evidence，以及候选计数；默认不返回完整 Element Declaration 或 Contract。`--limit <n>` SHALL 只在完整排序后截断最终 matches。显式请求完整语义时由 `arch query <identity>` 返回，不得在 search 结果中摘要或截断完整语义内容。

- **JSON 输出保留有限 match evidence**

  - 用户执行 `xirang arch search "Impact" --json`
  - stdout SHALL 为可解析 JSON
  - 每个结果 SHALL 返回 identity、title、parent、匹配字段、有限证据与计数
  - 默认结果 SHALL NOT 携带完整 Definition、Sections 或 Acceptance Cases

- **limit 在排序后生效**

  - 完整结果包含多个已排序 matches 且用户传入 `--limit 2`
  - 命令 SHALL 返回完整排序结果的前两项
  - SHALL NOT 改变匹配分数或排序规则

- **无匹配正常返回**

  - 没有任何 Formal Element 字段或宿主 Element 的 Contract 文本命中 query
  - 命令 SHALL exit code `0`
  - JSON 输出 SHALL 包含空 `matches` 数组

- **按候选 identity 获取完整语义**

  - 用户从 search 结果选定一个 identity
  - `arch query <identity> --json` 返回其完整 Declaration
  - 需要 Contract 时使用 `--contract` 返回完整 Contract

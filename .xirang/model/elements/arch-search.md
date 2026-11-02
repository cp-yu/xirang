---
entity: element-declaration
identity: arch-search
kind: element
parent: deterministic-operations
title: Arch Search
definition: Arch Search 定义 `xirang arch search` 的确定性文本检索行为：只读 Formal Semantic Model，在 Element identity、FQN、title、definition 与其单一 Contract 的 Section 标题中执行确定性检索，使用稳定匹配优先级并返回可解释的统一结果。
---

## Specification

### Section: arch search SHALL 检索 Formal Semantic Model

`xirang arch search <query>` SHALL 只读取 Formal Semantic Model，并 SHALL 在 Element identity、FQN、title、definition、其单一 Contract 的 Section 标题中执行确定性文本检索。命令 MUST NOT 读取 active Change、Semantic Delta、implementation code 或 Git evidence。

- **检索 Element declaration 与 owned Contract**
  - query 出现在某 Element title 和 owned Contract 的 Section 标题中
  - 结果 SHALL 返回该 Element 一次
  - SHALL 分别记录 title 与 Section 标题的 match evidence

- **不读取 Change 或代码**
  - 项目同时存在 active Change 与实现文件
  - `arch search` SHALL 仅从 Formal Semantic Model 构建结果
  - SHALL NOT 返回 Change、文件 symbol、import 或 call evidence

### Section: arch search SHALL 使用稳定匹配优先级

匹配结果 SHALL 按以下优先级排序：exact identity、exact FQN、exact title、title substring、definition substring、Section 标题。同一优先级 SHALL 按稳定 identity 升序排序。CLI MUST NOT 执行同义词推断、embedding、LLM semantic search 或自动选择唯一 Element。

- **exact identity 优先于文本命中**
  - 一个 Element 的 identity exact match query，另一个 Element 仅在 definition 中包含 query
  - exact identity match SHALL 排在 definition match 之前

- **同级结果稳定排序**
  - 多个 Elements 以相同字段等级命中 query
  - 结果 SHALL 按稳定 identity 升序排列
  - repeated execution SHALL 返回相同顺序

- **Section 标题命中**
  - query 出现在某 Element 的 owned Contract Section 标题中（而非 title、definition）
  - 结果 SHALL 返回该宿主 Element 一次
  - match evidence SHALL 标记 `section` 字段并包含命中文本
  - 该命中 SHALL 排在 definition 命中之后、按稳定 identity 排序

- **CLI 不推断同义词**
  - query 与模型文本没有字面匹配但可能具有相近含义
  - 命令 SHALL 返回空 `matches`
  - SHALL NOT 生成 semantic similarity score

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

### Section: arch search SHALL 保持只读和跨平台一致

命令 SHALL NOT 创建、修改或删除任何文件。搜索 SHALL 在 Formal Semantic Model IR 上执行（elementId、title、definition 与 Section 标题），不使用 Contract registry、文件路径构造或 filesystem 遍历，因此结果在 macOS、Linux 与 Windows 上保持一致。

- **搜索不产生项目文件**
  - `arch search` 成功或返回空结果
  - 项目工作区 SHALL 不新增或修改任何文件

- **Windows 上命中 Contract Section 标题**
  - 在 Windows 上搜索命中某 Element 的 owned Contract Section 标题
  - CLI SHALL 从模型 IR 返回该 Element 的稳定 identity 与字段级 evidence
  - 不构造或依赖文件路径，输出 SHALL 与 Unix 平台一致

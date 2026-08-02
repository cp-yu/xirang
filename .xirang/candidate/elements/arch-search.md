---
entity: element-declaration
identity: arch-search
kind: capability
parent: deterministic-operations
title: Arch Search
definition: Arch Search 定义 `xirang arch search` 的确定性文本检索行为：只读 Formal Semantic Model，在 Element identity、FQN、title、definition 与其单一 Contract 的 Requirement 名称及规范文本中执行确定性检索，使用稳定匹配优先级并返回可解释的统一结果。
---

## Requirements

### Requirement: arch search SHALL 检索 Formal Semantic Model

`xirang arch search <query>` SHALL 只读取 Formal Semantic Model，并 SHALL 在 Element identity、FQN、title、definition、其单一 Contract 的 Requirement 名称与适用规范文本中执行确定性文本检索。命令 MUST NOT 读取 active Change、Semantic Delta、implementation code 或 Git evidence。

#### Scenario: 检索 Element declaration 与 owned Contract
- **WHEN** query 出现在某 Element title 和 owned Contract Requirement heading 中
- **THEN** 结果 SHALL 返回该 Element 一次
- **AND** SHALL 分别记录 title 与 Requirement heading 的 match evidence

#### Scenario: 不读取 Change 或代码
- **WHEN** 项目同时存在 active Change 与实现文件
- **THEN** `arch search` SHALL 仅从 Formal Semantic Model 构建结果
- **AND** SHALL NOT 返回 Change、文件 symbol、import 或 call evidence

### Requirement: arch search SHALL 使用稳定匹配优先级

匹配结果 SHALL 按以下优先级排序：exact identity、exact FQN、exact title、title substring、definition substring、Requirement heading、Requirement body、Scenario text。同一优先级 SHALL 按稳定 identity 升序排序。CLI MUST NOT 执行同义词推断、embedding、LLM semantic search 或自动选择唯一 Element。

#### Scenario: exact identity 优先于文本命中
- **WHEN** 一个 Element 的 identity exact match query，另一个 Element 仅在 definition 中包含 query
- **THEN** exact identity match SHALL 排在 definition match 之前

#### Scenario: 同级结果稳定排序
- **WHEN** 多个 Elements 以相同字段等级命中 query
- **THEN** 结果 SHALL 按稳定 identity 升序排列
- **AND** repeated execution SHALL 返回相同顺序

#### Scenario: Requirement 正文与 Scenario 文本命中
- **WHEN** query 出现在某 Element 的 Requirement 正文或 Scenario 文本中（而非标题）
- **THEN** 结果 SHALL 返回该宿主 Element 一次
- **AND** match evidence SHALL 标记 `requirement-body` 或 `scenario` 字段并包含命中文本
- **AND** 该命中 SHALL 排在 Requirement heading 命中之后、按稳定 identity 排序

#### Scenario: CLI 不推断同义词
- **WHEN** query 与模型文本没有字面匹配但可能具有相近含义
- **THEN** 命令 SHALL 返回空 `matches`
- **AND** SHALL NOT 生成 semantic similarity score

### Requirement: arch search SHALL 返回可解释的统一结果

命令 SHALL 从一个 canonical result object 投影 human-readable 与 `--json` 输出。每个 match SHALL 包含 host Element declaration（稳定 identity）与全部字段级 match evidence；`--limit <n>` SHALL 只在完整排序后截断最终 matches。

#### Scenario: JSON 输出保留 match evidence
- **WHEN** 用户执行 `xirang arch search "Impact" --json`
- **THEN** stdout SHALL 为可解析 JSON
- **AND** 每个结果 SHALL 标识具体命中字段与文本

#### Scenario: limit 在排序后生效
- **WHEN** 完整结果包含多个已排序 matches 且用户传入 `--limit 2`
- **THEN** 命令 SHALL 返回完整排序结果的前两项
- **AND** SHALL NOT 改变匹配分数或排序规则

#### Scenario: 无匹配正常返回
- **WHEN** 没有任何 Formal Element 字段或宿主 Element 的 Contract 文本命中 query
- **THEN** 命令 SHALL exit code `0`
- **AND** JSON 输出 SHALL 包含空 `matches` 数组

### Requirement: arch search SHALL 保持只读和跨平台一致

命令 SHALL NOT 创建、修改或删除任何文件。搜索 SHALL 在 Formal Semantic Model IR 上执行（elementId、title、definition、Requirement 名称、Requirement 正文与 Scenario 文本），不使用 Contract registry、文件路径构造或 filesystem 遍历，因此结果在 macOS、Linux 与 Windows 上保持一致。

#### Scenario: 搜索不产生项目文件
- **WHEN** `arch search` 成功或返回空结果
- **THEN** 项目工作区 SHALL 不新增或修改任何文件
#### Scenario: Windows 上命中 Contract Requirement 文本
- **WHEN** 在 Windows 上搜索命中某 Element 的 Requirement heading、Requirement 正文或 Scenario 文本
- **THEN** CLI SHALL 从模型 IR 返回该 Element 的稳定 identity 与字段级 evidence
- **AND** 不构造或依赖文件路径，输出 SHALL 与 Unix 平台一致

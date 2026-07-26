---
element: cap.cli.arch-search
---
# arch-search-command Specification

## Purpose
This specification records behavior introduced by change replace-impact-sweeper-with-arch-cli. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: arch search SHALL 检索 Formal Semantic Model

`xirang arch search <query>` SHALL 只读取 Formal Semantic Model，并 SHALL 在 Element `elementId`、FQN、title、summary、owned Spec ID、Spec Purpose 与 Requirement headings 中执行确定性文本检索。命令 MUST NOT 读取 active Change、Semantic Delta、implementation code 或 Git evidence。

#### Scenario: 检索 Element declaration 与 owned Contract
- **WHEN** query 出现在某 Element title 和 owned Spec Requirement heading 中
- **THEN** 结果 SHALL 返回该 Element 一次
- **AND** SHALL 分别记录 title 与 Requirement heading 的 match evidence

#### Scenario: 不读取 Change 或代码
- **WHEN** 项目同时存在 active Change 与 `src/` 实现文件
- **THEN** `arch search` SHALL 仅从 `.xirang/architecture/` 与 `.xirang/specs/` 构建结果
- **AND** SHALL NOT 返回 Change、文件 symbol、import 或 call evidence

### Requirement: arch search SHALL 使用稳定匹配优先级

匹配结果 SHALL 按以下优先级排序：exact `elementId`、exact FQN、exact title、title substring、summary substring、Spec ID 或 Purpose、Requirement heading。同一优先级 SHALL 按 stable `elementId` 升序排序。CLI MUST NOT 执行同义词推断、embedding、LLM semantic search 或自动选择唯一 Element。

#### Scenario: exact identity 优先于文本命中
- **WHEN** 一个 Element 的 `elementId` exact match query，另一个 Element 仅在 summary 中包含 query
- **THEN** exact `elementId` match SHALL 排在 summary match 之前

#### Scenario: 同级结果稳定排序
- **WHEN** 多个 Elements 以相同字段等级命中 query
- **THEN** 结果 SHALL 按 stable `elementId` 升序排列
- **AND** repeated execution SHALL 返回相同顺序

#### Scenario: CLI 不推断同义词
- **WHEN** query 与模型文本没有字面匹配但可能具有相近含义
- **THEN** 命令 SHALL 返回空 `matches`
- **AND** SHALL NOT 生成 semantic similarity score

### Requirement: arch search SHALL 返回可解释的统一结果

命令 SHALL 从一个 canonical result object 投影 human-readable 与 `--json` 输出。每个 match SHALL 包含 Element declaration、owned Spec identities 与全部 match evidence；`--limit <n>` SHALL 只在完整排序后截断最终 matches。

#### Scenario: JSON 输出保留 match evidence
- **WHEN** 用户执行 `xirang arch search "Impact" --json`
- **THEN** stdout SHALL 为可解析 JSON
- **AND** 每个结果 SHALL 标识具体命中字段与文本

#### Scenario: limit 在排序后生效
- **WHEN** 完整结果包含多个已排序 matches 且用户传入 `--limit 2`
- **THEN** 命令 SHALL 返回完整排序结果的前两项
- **AND** SHALL NOT 改变匹配分数或排序规则

#### Scenario: 无匹配正常返回
- **WHEN** 没有任何 Formal Element 或 Contract 字段命中 query
- **THEN** 命令 SHALL exit code `0`
- **AND** JSON 输出 SHALL 包含空 `matches` 数组

### Requirement: arch search SHALL 保持只读和跨平台路径一致

命令 SHALL NOT 创建、修改或删除任何文件。返回 Spec path 时 SHALL 使用 Node.js path utilities 从项目根与 Spec registry 构造实际路径，并 SHALL 在 macOS、Linux 与 Windows 上读取相同的逻辑 Contract。

#### Scenario: Windows 上读取 owned Contract
- **WHEN** 在 Windows 上搜索命中 owned Spec Purpose 或 Requirement heading
- **THEN** CLI SHALL 使用平台原生路径读取该 Spec
- **AND** JSON 中的 project-relative Spec identity SHALL 与 Unix 平台一致

#### Scenario: 搜索不产生项目文件
- **WHEN** `arch search` 成功或返回空结果
- **THEN** 项目工作区 SHALL 不新增或修改任何文件


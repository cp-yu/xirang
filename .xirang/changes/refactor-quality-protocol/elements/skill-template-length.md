---
entity: element-declaration
identity: skill-template-length
kind: element
parent: agent-workbench-projection
title: Skill Template Length
definition: Skill Template Length 定义生成 skill 行数限制的测试契约：验证所有 tool 变体的 `SKILL.md` 不超过 200 行、`referenceFiles[]` 不超过 500 行，并按文件分组报告超标。
---
## MODIFIED Requirements

### Requirement: 测试验证所有生成 skill 文件行数限制

测试 MUST 调用模板获取函数获取所有 skill 模板（包括全部 tool 变体），并验证每个生成的 `SKILL.md` 文件不超过 200 行、每个 `template.referenceFiles[]` 文件不超过 500 行。测试 MUST NOT 汇总同一 skill 目录下所有文件的总行数。

#### Scenario: 所有模板均未超标

- **WHEN** 运行测试套件
- **THEN** 测试通过，所有生成的 `SKILL.md` 文件均 ≤ 200 行
- **AND** 所有 `referenceFiles[]` 文件均 ≤ 500 行

#### Scenario: SKILL.md 超标时按路径分组报告

- **WHEN** 存在一个或多个 `SKILL.md` 文件超过 200 行
- **THEN** 测试失败并抛出 Error，错误信息包含超标文件变体数量与按 `<dirName>/<filePath>` 分组的列表，按最大行数降序排列

#### Scenario: reference 文件单独计算

- **WHEN** 某 SKILL.md 为 180 行且其 reference 文件为 501 行
- **THEN** 错误信息 MUST 只报告超标的 reference 文件
- **AND** 测试 MUST NOT 将两个文件相加后报告该 skill 超标

#### Scenario: reference 文件超标时按 500 行限制报告
- **WHEN** 存在一个或多个 `template.referenceFiles[]` 文件超过 500 行
- **THEN** 测试失败并抛出 Error，错误信息按 `<dirName>/<filePath>` 分组、以最大行数降序报告超限详情

#### Scenario: 同一文件的多个变体行数相同时合并显示
- **WHEN** `xirang-explore/SKILL.md` 的 default、claude、codex 三个变体均为 541 行
- **THEN** 错误信息 MUST 显示为一行：`• xirang-explore/SKILL.md (default, claude, codex): 541 lines (+341, limit 200)`

#### Scenario: 同一文件的不同变体行数不同时分别显示
- **WHEN** `xirang-propose/SKILL.md` 的 claude 和 codex 变体为 604 行，default 变体为 580 行
- **THEN** 错误信息 MUST 显示为两行：
  - `• xirang-propose/SKILL.md (claude, codex): 604 lines (+404, limit 200)`
  - `• xirang-propose/SKILL.md (default): 580 lines (+380, limit 200)`

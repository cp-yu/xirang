---
entity: element-declaration
identity: skill-template-length
kind: element
parent: agent-workbench-projection
title: Skill Template Length
definition: Skill Template Length 定义生成 skill 行数限制的测试契约：验证所有 tool 变体的 `SKILL.md` 不超过 200 行、`referenceFiles[]` 不超过 500 行，并按文件分组报告超标。
---

## Requirements

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

### Requirement: 测试覆盖所有 tool 变体

测试 MUST 通过多次调用模板获取函数获取所有可能的模板变体，确保每个 tool 特定实现都被验证。

#### Scenario: 获取所有变体

- **WHEN** 为全部变体调用模板获取函数
- **THEN** 返回的模板列表 MUST 包含所有已定义的 skill 变体

#### Scenario: 验证变体独立性

- **WHEN** 某 skill 针对不同 tool 有不同的生成文件内容
- **THEN** 测试 MUST 分别验证每个变体的行数

### Requirement: 现有超标 skill 模板必须拆分或精简

实现 MUST 拆分或精简当前所有超过限制的 workflow skill 文件，使每个 `SKILL.md` 不超过 200 行、每个 `referenceFiles[]` 不超过 500 行。拆分或精简 MUST 保留现有 contract tests 覆盖的关键行为短语。模板获取函数 SHALL 仅返回 workflow skill 模板，不返回 internal subagent 角色。

#### Scenario: 长协议拆分到共享 references home

- **WHEN** 刷新生成产物
- **THEN** 各 workflow skill 声明的长协议 MUST 物化到 `.xirang/references/xirang-<name>.md`
- **AND** 主 `SKILL.md` MUST 保留入口、输入、边界和 reference 清单

#### Scenario: 超标 workflow skill 被压缩或拆分

- **WHEN** 运行 `pnpm test test/skills/skill-template-length-validation.test.ts`
- **THEN** 测试通过，所有 default、claude、codex 变体的 workflow `SKILL.md` 文件均 ≤ 200 行
- **AND** 所有 default、claude、codex 变体的 `referenceFiles[]` 文件均 ≤ 500 行

#### Scenario: 关键契约语义仍由现有测试保护

- **WHEN** 运行 skill/template contract tests
- **THEN** apply、explore、propose、archive、reviewer、optimizer、sync 相关测试仍通过

#### Scenario: 生成的工具 skill 与模板源一致

- **WHEN** 刷新生成的 `.claude`、`.codex`、`.github` 工具产物
- **THEN** 生成文件中的 workflow `SKILL.md` 与 `.xirang/references/xirang-*.md` 内容与对应模板源保持一致

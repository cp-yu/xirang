---
entity: element-declaration
identity: snack-skill-generation
kind: capability
parent: agent-workbench-projection
title: Snack Skill Generation
definition: Snack Skill Generation 定义 snack skill 的生成管线职责：与核心工作流一致地纳入生成，生成的 snack skill MUST 表达 code-first artifact reconciliation、broader code-change evidence sources、conditional artifact updates 与 no-`tasks.md` 边界，且 instructions 部分不超过 200 行。
---

## Requirements

### Requirement: snack skill 纳入生成管线

skill 生成管线 SHALL 包含 snack skill，与核心工作流一致。Generated snack skill instructions MUST describe code-first artifact reconciliation、broader code-change evidence sources、conditional artifact updates 与 no-`tasks.md` 边界。

#### Scenario: 生成 snack skill 文件

- **WHEN** 运行 `xirang update` 或 `xirang setup`
- **THEN** 生成的 snack skill 文件包含：
  1. Frontmatter（name、description、license、compatibility、metadata）
  2. 输入检测逻辑（change-name 可选，默认检测 active）
  3. 共享上下文加载指令
  4. Code-change evidence collection，覆盖 conversation context、working-tree diff、staged diff、HEAD diff 与自然语言 commit/range selectors
  5. 代码证据步骤
  6. Contract 覆盖扫描步骤
  7. Artifact reconciliation guidance for missing、stale、inconsistent 与 current 制品
  8. 输出提示与修正路径
  9. 明确不生成 tasks.md 的说明

#### Scenario: skill 文件长度验证

- **WHEN** 生成 snack skill 文件后
- **THEN** 验证 `SKILL.md` instructions 部分不超过 200 行

#### Scenario: generated skill text exposes reconciliation guidance

- **WHEN** tests inspect generated snack skill
- **THEN** text 包含 artifact reconciliation、conversation context、staged diff、HEAD diff、commit/range evidence selectors、conditional artifact updates 与 no `tasks.md` 的关键 guidance

### Requirement: snack skill 描述

snack skill description SHALL 表达 snack 从已写代码使用可用 code-change evidence 执行快速 code-first artifact reconciliation，并有条件地创建或更新 proposal、delta contracts、simplified design 与 Semantic Delta，不生成 `tasks.md`。

#### Scenario: skill description 用于触发检测

- **WHEN** AI 工具加载 skill 列表
- **THEN** snack skill 的 description 清晰表达其适用场景（代码已完成、从 available code-change evidence 反向 reconcile artifacts，不生成 tasks.md）

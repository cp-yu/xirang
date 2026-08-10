---
entity: element-declaration
identity: skill-generation
kind: element
parent: agent-workbench-projection
title: Skill Generation
definition: Skill Generation 定义共享 skill 片段与 frontmatter 的生成契约：`XIRANG_PHILOSOPHY` 共享片段注入 workflow skills 与 internal subagents，以及生成的 skill frontmatter 必须是合法 YAML。
---

## ADDED Requirements

### Requirement: 共享生成结构拆分 guidance

Skill Generation SHALL 从一个 canonical `STRUCTURAL_DECOMPOSITION_GUIDANCE` 片段向 `xirang-build`、`xirang-explore`、`xirang-propose` 与 `xirang-snack` 生成一致的配置消费和失败语义；各 workflow MAY 在共享规则之外声明自身适用时机，但 SHALL NOT 内联相互漂移的方法解析逻辑。

#### Scenario: 四个结构形成 workflow 共享片段

- **WHEN** setup 或 update 为任一支持工具生成 Build、Explore、Propose 与 Snack skills
- **THEN** 四个 skill instructions 包含同一 `STRUCTURAL_DECOMPOSITION_GUIDANCE`
- **AND** method 只作为 opaque 名称交给 Agent，skill 只作为逻辑名称调用

#### Scenario: 非结构 workflow 不注入片段

- **WHEN** 生成 Apply、Archive、Reviewer 或 Optimizer artifacts
- **THEN** 这些 artifacts 不包含结构拆分 guidance
- **AND** 不要求其重新形成 hierarchy

#### Scenario: 项目专属规则不进入共享片段

- **WHEN** 本仓库通过 `xirang-project-decomposition` 表达 `semantic-objects`、`realization-process` 或 `collaboration-structure` 等专属方法
- **THEN** canonical shared fragment 不包含这些项目名称或规则正文
- **AND** 用户自有 skill 独立承载该内容

#### Scenario: 生成内容继续满足长度约束

- **WHEN** 四个 workflow 模板注入共享 fragment
- **THEN** 每个生成 `SKILL.md` 继续满足现有 200 行限制
- **AND** 所有 tool surface 的语义保持 parity

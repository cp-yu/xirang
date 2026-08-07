---
entity: element-declaration
identity: config-projection
kind: element
parent: project-config-management
title: Config Projection
definition: Config Projection 定义项目配置编译为 prompt/runtime projections 的契约：投影结构、共享 projection contract、prose language 字段边界、英文术语嵌入、projection fragment 作用域、surface-specific projection 与 legacy docLanguage fallback。
---

## ADDED Requirements

### Requirement: 原样投影结构拆分选择

Config Projection SHALL 向结构形成 workflow 暴露经过项目配置加载器校验的 `decomposition.method` 或 `decomposition.skill` tagged union，并保持所选名称不变。Projection SHALL NOT 将 `method` 映射到 CLI 内建方法论、扩展教程或 allowlist，也 SHALL NOT 将 `skill` 映射到工具专属路径。

#### Scenario: 投影方法名

- **WHEN** normalized project config 包含 `decomposition: { method: "c4" }`
- **THEN** `xirang config project --json` 与适用 prompt projection 输出相同方法名
- **AND** 输出不包含任何由 CLI 生成的 C4 拆分步骤

#### Scenario: 投影 skill 名

- **WHEN** normalized project config 包含 `decomposition: { skill: "xirang-project-decomposition" }`
- **THEN** 适用结构形成 workflow 获得该逻辑名称
- **AND** projection 不猜测 `.pi`、`.claude`、`.codex` 或其他工具目录

#### Scenario: 非结构 workflow 不消费拆分指导

- **WHEN** Apply、Archive、Verify、Reviewer 或 Optimizer surface 构建 projection
- **THEN** 这些 surface SHALL NOT 获得要求其重新形成 Semantic Model hierarchy 的 guidance

#### Scenario: 非法配置不产生隐式 projection

- **WHEN** config loading 因非法 `decomposition` 省略该字段
- **THEN** projection SHALL 同样省略结构拆分选择
- **AND** SHALL NOT 注入默认 C4 作为修复

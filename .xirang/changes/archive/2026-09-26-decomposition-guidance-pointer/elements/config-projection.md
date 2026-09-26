---
entity: "element-declaration"
identity: "config-projection"
kind: "element"
parent: "project-config-management"
title: "Config Projection"
definition: "Config Projection 定义项目配置编译为 prompt/runtime projections 的契约：投影结构、共享 projection contract、prose language 字段边界、英文术语嵌入、projection fragment 作用域、surface-specific projection 与 legacy docLanguage fallback。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 原样投影结构拆分选择
Config Projection SHALL 向结构形成 workflow 暴露经过项目配置加载器解析的 `decomposition` 指导文件路径字符串，并保持解析结果稳定。Projection SHALL NOT 维护方法名单、映射 CLI 内建方法论或猜测工具专属路径。

#### Scenario: 投影解析后的指导路径
- **WHEN** normalized project config 包含 `decomposition: c4`
- **THEN** `xirang config project --json` 与适用 prompt projection 输出 `.xirang/references/c4.md`
- **AND** 输出不包含任何由 CLI 生成的拆分步骤

#### Scenario: 投影路径形态原样输出
- **WHEN** normalized project config 包含路径形态的 `decomposition` 值
- **THEN** 适用结构形成 workflow 获得相同的项目根相对路径
- **AND** projection 不猜测 `.pi`、`.claude`、`.codex` 或其他工具目录之外的额外路径

#### Scenario: 非结构 workflow 不消费拆分指导
- **WHEN** Apply、Archive、Quality、Reviewer 或 Optimizer surface 构建 projection
- **THEN** 这些 surface SHALL NOT 获得要求其重新形成 Semantic Model hierarchy 的 guidance

#### Scenario: 非法配置不产生隐式 projection
- **WHEN** config loading 因非法 `decomposition` 省略该字段
- **THEN** projection SHALL 同样省略结构拆分选择
- **AND** SHALL NOT 注入默认指导路径作为修复

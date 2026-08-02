---
entity: element-declaration
identity: skill-generation
kind: capability
parent: agent-workbench-projection
title: Skill Generation
definition: Skill Generation 定义共享 skill 片段与 frontmatter 的生成契约：`XIRANG_PHILOSOPHY` 共享片段注入 workflow skills 与 internal subagents，以及生成的 skill frontmatter 必须是合法 YAML。
---

## Requirements

### Requirement: Xirang Philosophy 片段定义

系统 SHALL 在共享片段常量中提供 `XIRANG_PHILOSOPHY` 共享片段。该片段 SHALL 以英文书写，不受 prose language projection 管辖，并 SHALL 只表达项目定义：Xirang 是可被 Agent 编译的 human intent 的结构化表述；Semantic Model 是唯一权威语义，由模型分区与 Element-owned Contract modules 共同构成；Change 将 Semantic Delta reconcile 到 target steady state，proposal/design/tasks 是 compilation scaffolding；模型只有在 Agent 无需猜测影响 hierarchy、contracts 或 relationships 的决策时才完整；Agent 执行类似 compiler 的操作，现有代码是 current implementation evidence。

#### Scenario: 片段定义统一 Semantic Model
- **WHEN** `XIRANG_PHILOSOPHY` 被读取
- **THEN** 文本 SHALL 声明 Xirang 是可被 Agent 编译的 human intent 的结构化表述
- **AND** SHALL 声明模型分区与 Element-owned Contracts 共同组成一个 Semantic Model
- **AND** MUST NOT 使用双源作为核心定义

#### Scenario: 片段定义 completeness 与 Agent compiler 类比
- **WHEN** model 缺少会改变 hierarchy、contracts 或 relationships 的决策
- **THEN** 文本 SHALL 说明 Semantic Model 尚不完整
- **AND** SHALL 禁止 Agent 通过猜测补足该决策
- **AND** SHALL 将 compiler 表述为 Agent 操作类比，而非真实 compiler 或持久化 IR

#### Scenario: 片段排除操作规则
- **WHEN** `XIRANG_PHILOSOPHY` 被读取
- **THEN** 文本 MUST NOT 包含 definition-first、canonical syntax 或 validation gate 指令
- **AND** MUST NOT 包含独立 AST/IR pipeline、static analysis pass 或 decompilation 类比
#### Scenario: 片段定义统一 Xirang Semantic Model
- **WHEN** `XIRANG_PHILOSOPHY` 被读取
- **THEN** 文本 SHALL 声明 Xirang 是可被 Agent 编译的 human intent 的结构化表述
- **AND** SHALL 声明 模型分区 与 element-owned Contracts 共同组成一个 Semantic Model
- **AND** MUST NOT 使用 `durable semantic source` 或 Behavior/Architecture 双源作为核心定义
#### Scenario: 片段定义 scaffolding 与 reconciliation
- **WHEN** `XIRANG_PHILOSOPHY` 被读取
- **THEN** 文本 SHALL 声明 change 朝 target steady state reconciliation Semantic Delta
- **AND** SHALL 声明 proposal、design、tasks 是 compilation scaffolding，而非竞争性的 source of truth
### Requirement: Xirang Philosophy 注入 workflow skill 模板

六个用户可调用 workflow skill 模板 SHALL 在首句职责描述之后、操作步骤之前注入 `XIRANG_PHILOSOPHY`。

#### Scenario: 6 个 workflow skills 共享同一片段
- **WHEN** 生成任一受管 workflow skill
- **THEN** instructions SHALL 包含完整的 `XIRANG_PHILOSOPHY`
- **AND** 各 workflow MUST NOT 内联另一份改写后的项目哲学

### Requirement: Xirang Philosophy 注入 internal subagent 模板

`reviewer` 与 `optimizer` internal subagent SHALL 在 Role 段之后注入 `XIRANG_PHILOSOPHY`；其他 internal surface SHALL NOT 注入该片段。

#### Scenario: reviewer 与 optimizer 包含共享哲学
- **WHEN** reviewer 或 optimizer prompt 被生成
- **THEN** prompt SHALL 在 Role 与 Hard Constraints 之间包含完整的 `XIRANG_PHILOSOPHY`

#### Scenario: 排除 surface 不包含共享哲学
- **WHEN** 其他 internal surface 被生成
- **THEN** 输出 SHALL NOT 包含共享哲学标题
#### Scenario: 排除决策编码在片段注释中
- **WHEN** `XIRANG_PHILOSOPHY` 常量在 `xirang-fragments.ts` 中被定义
- **THEN** 其上方 JSDoc 注释 SHALL 列出使用方和排除名单及排除原因
### Requirement: skill frontmatter 必须生成合法 YAML
系统 SHALL 将 skill template 的 `name`、`description`、`license`、`compatibility` 与 metadata 字段作为可解析的 YAML 字符串写入 `SKILL.md` frontmatter。

#### Scenario: description 包含 YAML 敏感字符
- **WHEN** skill template 的 `description` 包含 `sync:`、双引号或换行
- **THEN** 生成的 frontmatter MUST 能被 YAML parser 解析
- **AND** 解析后的字段值 MUST 与原始 template 字符串语义一致

#### Scenario: init 和 update 生成的 skill 文件
- **WHEN** 用户运行 `xirang setup` 或 `xirang update` 生成 skill files
- **THEN** 生成的 frontmatter MUST 能被 YAML parser 解析
- **AND** 测试通过解析后的字段校验语义，而不是依赖未加引号的 YAML 表面格式

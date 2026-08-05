---
entity: element-declaration
identity: workflow-templates
kind: element
parent: agent-workbench-projection
title: Workflow Templates
definition: Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、verify 模板对 subagent 使用明确 delegation 指令、checkpoint state machine 表格、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与 definition-first authoring。
---

## MODIFIED Requirements

### Requirement: 统一加载协议与优雅降级

Core workflows SHALL 使用同一 Semantic Model loading protocol：从唯一 Project Root 读取 project-level intent，沿 containment 获取 abstraction/refinement context，通过 `xirang arch query` 获取 stable elements、owned Contracts 与 semantic relationships；需要项目模型总览时先通过 `xirang arch snapshot` 一次性注入全部 Element Declarations、Relationships 与 Metamodel Kinds（不含 Contract），再按需点查。当 Semantic Model 缺失或不完整时，只读 workflow MAY 使用部分 context 继续并声明不可用；需要编译或写入语义的 workflow MUST NOT 将缺失 source 当作空且完整的模型。

#### Scenario: Model 不存在

- **WHEN** Formal Semantic Model 不存在
- **THEN** 只读 workflow MAY 继续使用 code evidence
- **AND** SHALL 声明 Semantic Model unavailable

#### Scenario: Target model 不完整

- **WHEN** apply 或 sync 发现 root、identity 或 required contract error
- **THEN** SHALL 停止需要完整语义的操作
- **AND** MUST NOT 以空 collection 掩盖 error

#### Scenario: Shared context 使用统一模型

- **WHEN** workflow 启动且新版 model 存在
- **THEN** SHALL 定位 Project Root
- **AND** SHALL 按需读取 relevant parent/child hierarchy、Element Contracts 与 relations
- **AND** MUST NOT 使用 domain/capability 固定层级或 parallel YAML graph

#### Scenario: Shared context 先注入模型骨架总览

- **WHEN** workflow 需要项目模型整体认知
- **THEN** shared context fragment SHALL 指引先运行 `xirang arch snapshot` 注入完整模型骨架（全部 Element Declarations、Relationships 与 Metamodel Kinds，不含 Contract）
- **AND** SHALL 说明 Contract 用 `xirang arch query <identity> --relations --depth <n> --json` 加 `--contract` 按需点查

#### Scenario: Code evidence 与 Semantic Model 分层

- **WHEN** workflow 需要 source path、symbol、import 或 call facts
- **THEN** SHALL 将其作为 current implementation evidence
- **AND** MUST NOT 将其自动提升为 element 或 relation

#### Scenario: Templates 使用同一 fragment

- **WHEN** 检查 generated workflow templates
- **THEN** relevant surfaces SHALL 复用同一 exported constant
- **AND** SHALL 使用一致 canonical terminology

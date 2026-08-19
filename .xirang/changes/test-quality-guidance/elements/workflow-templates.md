---
entity: element-declaration
identity: workflow-templates
operation: MODIFIED
kind: element
parent: agent-workbench-projection
title: Workflow Templates
definition: Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、verify 模板对 subagent 使用明确 delegation 指令、checkpoint state machine 表格、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与制品定义先行写作。
---

## MODIFIED Requirements

### Requirement: 统一加载协议与优雅降级

Core workflows SHALL 使用同一无状态 Semantic Model loading protocol：`arch outline` 返回完整 Element hierarchy、Relationships 与 Metamodel，并按项目配置局部加载 Element Definitions；`arch impact` 返回影响 identities 与结构路径；batch `arch query` 返回显式 identities 的完整 Declarations 与可选 Contracts。`arch snapshot` SHALL 保留为完整导出工具，不作为默认 Agent onboarding command。Semantic Model 缺失或不完整时，只读 workflow MAY 使用部分 context 继续并声明不可用；需要编译或写入语义的 workflow MUST NOT 将缺失 source 当作空且完整的模型。Explore、Propose、Apply 与 Reviewer SHALL 复用同一测试品质片段；Build、Propose 与 Snack SHALL 复用含 Scenario 行为纪律的同一 Element Contract 语义片段。

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
- **THEN** SHALL 使用 outline 获取完整 identity/hierarchy/Relationship/Metamodel context，并使用 impact 与 query 按需读取更深语义
- **AND** MUST NOT 使用 domain/capability 固定层级或 parallel YAML graph

#### Scenario: Shared context 使用 outline 恢复模型总览

- **WHEN** workflow 需要项目模型整体认知或怀疑整体认知已丢失
- **THEN** shared context fragment SHALL 指引运行 `xirang arch outline --format json`
- **AND** SHALL 说明 `architecture.outline.elementDefinitionDepth` 只控制 Element Definition projection，完整 Contract 必须通过显式 batch query 获取

#### Scenario: Code evidence 与 Semantic Model 分层

- **WHEN** workflow 需要 source path、symbol、import 或 call facts
- **THEN** SHALL 将其作为 current implementation evidence
- **AND** MUST NOT 将其自动提升为 Element、Relationship、Definition 或 Contract

#### Scenario: Templates 使用同一 fragment

- **WHEN** 检查 generated workflow templates
- **THEN** relevant surfaces SHALL 复用同一 exported constant
- **AND** SHALL 使用一致 canonical terminology 与认知恢复规则

#### Scenario: 测试品质片段被四阶段复用

- **WHEN** 生成 Explore、Propose、Apply 或 Reviewer workflow 模板
- **THEN** 输出 SHALL 包含同一测试品质片段
- **AND** 该片段 SHALL 定义可重复隔离、锁行为不锁结构、单一失败原因与难测先改设计
- **AND** SHALL NOT 把项目特定锁词规则写入该通用片段

---
element: ai_integration.workflow_templates
---
## MODIFIED Requirements

### Requirement: 统一加载协议

Core workflows SHALL 使用同一 OPSX Semantic Model loading protocol：从唯一 Project Root 读取 project-level intent，沿 containment 获取 abstraction/refinement context，通过 `opsx arch query` 获取 stable elements、owned Specs 与 semantic relationships。Code locations SHALL 继续由 CodeGraph 或 ACE/`rg`/`read` 提供。

#### Scenario: [ADDED] Shared context 使用统一模型
- **WHEN** workflow 启动且新版 model 存在
- **THEN** SHALL 定位 Project Root
- **AND** SHALL 按需读取 relevant parent/child hierarchy、Spec bindings 与 relations
- **AND** MUST NOT 使用 domain/capability 固定层级或 parallel YAML graph

#### Scenario: [ADDED] Code evidence 与 Semantic Model 分层
- **WHEN** workflow 需要 source path、symbol、import 或 call facts
- **THEN** SHALL 将其作为 current implementation evidence
- **AND** MUST NOT 将其自动提升为 element 或 relation

#### Scenario: [REMOVED] Shared context 使用两文件语义模型
- **WHEN** workflow 启动且 formal OPSX v2 存在
- **THEN** SHALL 读取 project 元数据和 domain/capability structure
- **AND** SHALL 使用 `opsx opsx query` 获取 relation detail
- **AND** MUST NOT 引用 `project.opsx.code-map.yaml`

#### Scenario: [REMOVED] Code evidence 与 OPSX 分层
- **WHEN** workflow 需要实现位置或 symbol dependency
- **THEN** SHALL 将 OPSX 作为语义边界模型
- **AND** SHALL 使用可选 CodeGraph 或 ACE/`rg`/`read` 作为当前代码事实

### Requirement: 优雅降级

当 OPSX Semantic Model 缺失、language version 不受支持或 model 不完整时，workflow SHALL 明确暴露可用范围。只读 exploration MAY 使用部分 context 继续；需要编译或写入语义的 workflow MUST NOT 将缺失 source 当作空且完整的模型。

#### Scenario: [ADDED] Model 不存在
- **WHEN** `.opsx/architecture/` 不存在
- **THEN**只读 workflow MAY 继续使用 code evidence
- **AND** SHALL 声明 Semantic Model unavailable

#### Scenario: [ADDED] Target model 不完整
- **WHEN** apply、sync 或 migration 发现 root、identity、binding 或 required contract error
- **THEN** SHALL 停止需要完整语义的操作
- **AND** MUST NOT 以空 collection 掩盖 error

#### Scenario: [REMOVED] OPSX 文件不存在时不报错
- **GIVEN** `opsx/project.opsx.yaml` 不存在
- **WHEN** 任一工作流启动
- **THEN** 跳过 OPSX 加载，继续正常执行
- **AND** 不输出错误或警告

#### Scenario: [REMOVED] 部分 OPSX 文件缺失
- **GIVEN** `project.opsx.yaml` 存在
- **AND** `project.opsx.relations.yaml` 不存在
- **WHEN** 工作流启动
- **THEN** 加载可用的 OPSX 文件
- **AND** 缺失的文件视为空集合

### Requirement: Fragment 一致性

Explore、propose、apply、snack 与 internal review surfaces SHALL 引用同一个 Semantic Model context fragment，避免 root、identity、refinement 与 binding guidance 分叉。

#### Scenario: [ADDED] Templates 使用同一 fragment
- **WHEN** 检查 generated workflow templates
- **THEN** relevant surfaces SHALL 复用同一 exported constant
- **AND** SHALL 使用一致 canonical terminology

#### Scenario: [REMOVED] 三个模板使用同一 fragment 常量
- **GIVEN** `OPSX_SHARED_CONTEXT` 定义在 `opsx-fragments.ts` 中
- **WHEN** 检查 explore / propose / apply 模板源码
- **THEN** 三者均引用 `OPSX_SHARED_CONTEXT`
- **AND** 加载的 OPSX 要点集合一致

### Requirement: CLI 点查询互补定位

Shared query fragment SHALL 将 `opsx arch query <elementId> --relations --depth <n> --json` 定义为 hierarchy、contract 与 relation detail interface。Guidance SHALL 解释 FQN 与 stable elementId 的区别。

#### Scenario: [ADDED] Query guidance 与新版 output 一致
- **WHEN** 检查 fragment
- **THEN** SHALL 说明 parent、children、Specs 与 incoming/outgoing relationships
- **AND** SHALL 使用 elementId 作为 canonical identity
- **AND** SHALL NOT 承诺 code-map refs

#### Scenario: [REMOVED] Query fragment 与 v2 output 一致
- **WHEN** 检查 shared query fragment
- **THEN** SHALL 引导读取 incoming/outgoing 或 subgraph relation paths
- **AND** SHALL NOT 包含 `codeMap`、`--code-map` 或 code-map file guidance

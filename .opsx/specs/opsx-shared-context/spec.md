# Spec: opsx-shared-context

## Purpose

统一 explore / propose / apply 三个核心工作流对 OPSX 的加载协议，使 OPSX 成为共享一等上下文而非各模板各自为政的附加信息。
## Requirements
### Requirement: 统一加载协议

Core workflows SHALL 使用同一 OPSX Semantic Model loading protocol：从唯一 Project Root 读取 project-level intent，沿 containment 获取 abstraction/refinement context，通过 `opsx arch query` 获取 stable elements、owned Specs 与 semantic relationships。Code locations SHALL 继续由 CodeGraph 或 ACE/`rg`/`read` 提供。

#### Scenario: Shared context 使用统一模型
- **WHEN** workflow 启动且新版 model 存在
- **THEN** SHALL 定位 Project Root
- **AND** SHALL 按需读取 relevant parent/child hierarchy、Spec bindings 与 relations
- **AND** MUST NOT 使用 domain/capability 固定层级或 parallel YAML graph

#### Scenario: Code evidence 与 Semantic Model 分层
- **WHEN** workflow 需要 source path、symbol、import 或 call facts
- **THEN** SHALL 将其作为 current implementation evidence
- **AND** MUST NOT 将其自动提升为 element 或 relation

### Requirement: 优雅降级

当 OPSX Semantic Model 缺失、language version 不受支持或 model 不完整时，workflow SHALL 明确暴露可用范围。只读 exploration MAY 使用部分 context 继续；需要编译或写入语义的 workflow MUST NOT 将缺失 source 当作空且完整的模型。

#### Scenario: Model 不存在
- **WHEN** `.opsx/architecture/` 不存在
- **THEN**只读 workflow MAY 继续使用 code evidence
- **AND** SHALL 声明 Semantic Model unavailable

#### Scenario: Target model 不完整
- **WHEN** apply、sync 或 migration 发现 root、identity、binding 或 required contract error
- **THEN** SHALL 停止需要完整语义的操作
- **AND** MUST NOT 以空 collection 掩盖 error

### Requirement: Fragment 一致性

Explore、propose、apply、snack 与 internal review surfaces SHALL 引用同一个 Semantic Model context fragment，避免 root、identity、refinement 与 binding guidance 分叉。

#### Scenario: Templates 使用同一 fragment
- **WHEN** 检查 generated workflow templates
- **THEN** relevant surfaces SHALL 复用同一 exported constant
- **AND** SHALL 使用一致 canonical terminology

### Requirement: CLI 点查询互补定位

Shared query fragment SHALL 将 `opsx arch query <elementId> --relations --depth <n> --json` 定义为 hierarchy、contract 与 relation detail interface。Guidance SHALL 解释 FQN 与 stable elementId 的区别。

#### Scenario: Query guidance 与新版 output 一致
- **WHEN** 检查 fragment
- **THEN** SHALL 说明 parent、children、Specs 与 incoming/outgoing relationships
- **AND** SHALL 使用 elementId 作为 canonical identity
- **AND** SHALL NOT 承诺 code-map refs


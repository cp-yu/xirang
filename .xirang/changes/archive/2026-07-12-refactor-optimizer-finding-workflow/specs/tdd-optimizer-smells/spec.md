## ADDED Requirements

### Requirement: 优化候选信号

Optimizer SHALL 将长方法、浅模块、原始类型、重复、Feature Envy、深层嵌套、死代码及其他结构指标作为非穷尽候选信号。阈值或信号本身 MUST NOT 强制产生 finding；optimizer MUST 结合实际收益、代码证据、风险和 preservation constraints 判断是否 actionable。

Optimizer MAY 发现未列出的算法、数据结构、I/O、分配或资源效率机会，并 SHALL 使用开放文本描述，不受固定 Code Smell 枚举限制。

#### Scenario: 长方法不自动要求拆分
- **WHEN** 方法超过 30 行但职责单一、流程清晰且拆分会增加间接性
- **THEN** optimizer SHALL NOT 仅因行数生成 actionable finding

#### Scenario: 重复逻辑产生候选 finding
- **WHEN** 两处以上存在语义相同且维护时必须同步的逻辑
- **AND** optimizer 可证明共享边界不会改变行为
- **THEN** optimizer MAY 生成 duplication finding
- **AND** SHALL 提供位置、影响、关键设计和保持约束

#### Scenario: 发现未预定义的算法机会
- **WHEN** optimizer 从当前代码证明某算法存在可避免的更高时间复杂度
- **THEN** SHALL 允许使用开放文本描述该 finding
- **AND** SHALL NOT 要求映射到固定 smell 类型

## REMOVED Requirements

### Requirement: 长方法拆分检测

**Reason**: 固定行数不能证明拆分具有实际收益，绝对规则会制造间接性。

**Migration**: 使用“优化候选信号”Requirement，在证据和保持约束成立时才生成 finding。

### Requirement: 浅模块加深检测

**Reason**: 方法数量或参数数量不是必须合并、函数化或封装的充分条件。

**Migration**: 将模块深度作为候选信号，由 optimizer 提供具体影响和关键设计。

### Requirement: 原始类型痴迷消除检测

**Reason**: 强制创建值对象可能扩大 scope 或引入未要求的领域抽象。

**Migration**: 仅在重复领域规则和行为保持可证明时提出 finding。

### Requirement: 重复消除增强指标

**Reason**: 重复检测已由开放的“优化候选信号”统一覆盖。

**Migration**: 使用通用 finding 的 evidence、impact 和 keyDesign 字段表达重复机会。

### Requirement: 局部性优化增强指标

**Reason**: Feature Envy 和 getter 链是候选证据，不应直接强制迁移代码。

**Migration**: 使用通用 finding 判断职责边界与行为风险。

### Requirement: 控制流清晰增强指标

**Reason**: 固定嵌套和返回数量不等于必须重构。

**Migration**: 将控制流指标作为非穷尽候选信号。

### Requirement: 坏味道类型标注

**Reason**: 封闭枚举限制通用 optimizer，并与 finding-first JSON 合约重复。

**Migration**: 使用开放的 `opportunity`、`impact` 和 `recommendation` 字段描述优化。

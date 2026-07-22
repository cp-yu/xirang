---
element: project.root/domain.ai_integration/cap.ai.review-roles
---

# tdd-optimizer-smells Specification

## Purpose
定义 Optimizer Phase 2 的 Pocock 坏味道检测与 Search/Replace 输出标注要求，确保优化提案覆盖关键结构问题并保持可追溯。
## Requirements
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

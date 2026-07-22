## MODIFIED Requirements

### Requirement: Task 间矛盾检测

apply-change skill SHALL 在实现前扫描 tasks.md 的 Goal、Files、Requirements 与 Checks，检测 task 间互斥声明，以及 task 与 canonical change-local Specs、design.md 或 Architecture delta 的冲突。Scenario anchors SHALL 直接使用无 operation metadata 的 exact canonical title。

#### Scenario: 检测到 task 间文件声明互斥
- **WHEN**两个非依赖 task 都声明 Create 同一路径
- **THEN** SHALL 标记矛盾 finding
- **AND** SHALL 一次性呈现全部 findings

#### Scenario: 检测到 task 需求与 Spec 冲突
- **WHEN** Task Requirement 或 Check anchor 与 change-local target behavior 矛盾
- **THEN** SHALL 标记矛盾 finding

#### Scenario: Scenario anchor 使用 exact canonical title
- **WHEN** task 包含 `Verifies: ... / Scenario "已调整场景"`
- **AND** change-local Spec 包含 `#### Scenario: 已调整场景`
- **THEN** SHALL 直接匹配该 Scenario
- **AND** MUST NOT 执行 label stripping 或接受 labeled heading

#### Scenario: 扫描干净时无声继续
- **WHEN** pre-flight scan 未检测到 contradiction 或 dependency ordering issue
- **THEN** SHALL 无声继续执行
- **AND** SHALL NOT 报告“扫描通过”

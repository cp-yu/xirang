---
element: project.root/domain.apply/cap.apply.execution
---

# apply-preflight-scan Specification

## Purpose
Define the reviewed Evidence-Gated Apply Execution contract for Task 间矛盾检测; Task 依赖顺序检测.
## Requirements
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

### Requirement: Task 依赖顺序检测

apply-change skill SHALL 检测 task 间的隐式依赖顺序问题：当 Task N 的 Files 中包含 Modify 或 Delete 某文件，而该文件由执行顺序在后的 Task M（M > N）的 Files Create 声明产生时，标记为依赖顺序问题。

#### Scenario: 检测到前序 task 依赖后序 task 的产出

- **WHEN** Task N（N < M）的 Files 声明 Modify 或 Delete 某路径，该路径由 Task M 的 Files 声明 Create
- **THEN** 系统 SHALL 将此标记为依赖顺序 finding
- **AND** finding SHALL 包含涉及的两个 task 编号和文件路径

#### Scenario: 用户决策后继续执行

- **WHEN** pre-flight scan 呈现 findings 给用户
- **THEN** 系统 SHALL 等待用户决策（修改 tasks.md 或确认忽略）
- **AND** 用户确认后系统 SHALL 继续进入 Step 3 所选方法 reference


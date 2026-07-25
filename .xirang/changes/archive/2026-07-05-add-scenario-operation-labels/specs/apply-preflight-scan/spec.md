## MODIFIED Requirements

### Requirement: Task 间矛盾检测

apply-change skill SHALL 在完成 OPSX 导航（Step 5）之后、Branch Isolation 之前，扫描 tasks.md 全部 task 的 Goal、Files、Requirements 和 Checks，检测不同 task 对同一文件或接口的互斥声明，以及 task 声明与 change-local specs 或 design.md 的冲突。当 change-local specs 的 scenario headings 含有 scenario operation labels 时，pre-flight scan SHALL 使用 label-free scenario title 来匹配 task `Verifies:` 引用。

#### Scenario: 检测到 task 间文件声明互斥

- **WHEN** Task A 的 Files 声明对某文件执行 Create，而 Task B（非 A 的后继）的 Files 也声明对同一文件执行 Create
- **THEN** 系统 SHALL 将此标记为矛盾 finding
- **AND** 系统 SHALL 在扫描完成后一次性呈现所有 findings 给用户

#### Scenario: 检测到 task 需求与 spec 冲突

- **WHEN** Task 的 Requirements 或 Check 的 Verifies 描述的行为与对应 change-local spec 的 requirement 矛盾
- **THEN** 系统 SHALL 将此标记为矛盾 finding

#### Scenario: labeled scenario Verifies 使用 clean title 匹配

- **WHEN** change-local spec 包含 `#### Scenario: [MODIFIED] 已调整场景`
- **AND** task check 包含 `Verifies: specs/<capability>/spec.md / Requirement "能力" / Scenario "已调整场景"`
- **THEN** pre-flight scan SHALL 将 task 引用匹配到该 labeled scenario
- **AND** SHALL NOT 要求 task 在 scenario 标题中包含 `[MODIFIED]`

#### Scenario: 扫描干净时无声继续

- **WHEN** pre-flight scan 未检测到任何矛盾或依赖顺序问题
- **THEN** 系统 SHALL 无声继续进入 Branch Isolation 步骤
- **AND** 系统 SHALL NOT 向用户报告"扫描通过"

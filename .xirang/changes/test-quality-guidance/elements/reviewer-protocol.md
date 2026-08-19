---
entity: element-declaration
identity: reviewer-protocol
operation: MODIFIED
kind: element
parent: review
title: Reviewer Protocol
definition: Reviewer Protocol 定义 Reviewer 角色与硬约束、输入合约、6 步验证协议、严重性阈值与证据标准、三个验证维度、结构化输出合约与跨工具 skill 路径兼容。
---

## MODIFIED Requirements

### Requirement: 6 步验证协议

`xirang-reviewer` skill SHALL 为每个 delta requirement 定义并强制执行 6 步客观验证循环：Locate（识别候选文件）、Read（检查最终磁盘内容）、Analyze（对比 requirement 意图与其可观察行为）、Cite（记录文件路径与行范围）、Judge（分配 PASS/WARNING/CRITICAL）、Explain（准确说明缺失、偏离或不确定内容）。覆盖按可观察行为与可信证据判断，不按 Scenario 与测试文件 1:1 映射。

#### Scenario: 需求被实现证据清晰满足

- **WHEN** finalFileContents 中某文件清晰实现了 requirement 行为
- **AND** 关联 Scenario 所具体化的可观察行为均有可信证据
- **THEN** reviewer SHALL 分配 PASS
- **AND** SHALL 引用文件路径和行范围作为证据
- **AND** SHALL NOT 仅因缺少与 Scenario 同名的独立测试文件而拒绝 PASS

#### Scenario: 搜索后未找到可信证据

- **WHEN** 经过对 scope 内候选文件的彻底 Read
- **AND** 未找到 requirement 行为的可信实现证据
- **THEN** reviewer SHALL 分配 CRITICAL
- **AND** SHALL 说明搜索过程和为何判定为缺失

### Requirement: 三个验证维度

`xirang-reviewer` skill SHALL 覆盖四个验证维度及可选的对齐检查，并按 Check 的锚点类型分派判定模式：`Verifies` 普通 requirement 执行存在性判定，`Verifies ... REMOVED Requirement` 执行缺失性判定，`Preserves` 执行等价性判定。存在性判定 SHALL 接受一条测试覆盖多个 Scenario、以及 Change 明确分类的 one-time evidence；SHALL NOT 把缺少 1:1 测试文件本身升级为 CRITICAL。

#### Scenario: 仅有 tasks.md 的变更

- **WHEN** 变更仅有 tasks.md 无 delta contracts 无 design.md
- **THEN** reviewer SHALL 仅验证任务完成度
- **AND** SHALL 跳过正确性、一致性、清洁性和对齐检查并注明

#### Scenario: Correctness 按行为证据判定覆盖

- **WHEN** delta contract 中某 requirement 包含 Scenario 块
- **AND** 代码、测试或 Check 声明的 one-time evidence 能证明这些 Scenario 具体化的可观察行为
- **THEN** reviewer SHALL 判定该 requirement 覆盖充分
- **AND** SHALL NOT 因没有与每个 Scenario 一一对应的测试文件而判定 CRITICAL "Scenario not covered"

#### Scenario: 行为无证据或弱断言升级为 CRITICAL

- **WHEN** 某 required behavior 没有可信实现或验证证据
- **OR** 声称覆盖该行为的测试在翻转关键比较或删除关键赋值后仍会通过
- **THEN** reviewer SHALL 判定为 CRITICAL
- **AND** recommendation SHALL 要求补强行为证据，而不是补锁词测试

#### Scenario: 正式模型原文锁词升级为 CRITICAL

- **WHEN** 本次变更新增测试读取正式 `.xirang/model/` 并断言 Requirement 或 Scenario 原文
- **THEN** reviewer SHALL 判定为 CRITICAL
- **AND** recommendation SHALL 要求改为验证项目代码行为或 CLI fixture

#### Scenario: 缺失性判定要求多角度搜索后引用证据

- **WHEN** 某 Check 锚定 `Verifies: ... REMOVED Requirement "<name>"`
- **THEN** reviewer SHALL 对该交付物执行缺失性判定：搜索符号名、文件路径与 import 引用
- **AND** 判定 PASS 时 SHALL 引用搜索命令与空结果作为证据
- **AND** 发现任何残留引用时 SHALL 判定为 CRITICAL 并引用残留位置

#### Scenario: Delete 声明与 git diff 逐项核对

- **WHEN** 某 task 的 `Files` 包含 `Delete:` 条目且该 task 的 Check 已勾选
- **THEN** reviewer SHALL 在 `git diff <baseCommit>...HEAD` 与 `git status --short` scope 中确认该文件已删除
- **AND** 文件仍存在时 SHALL 判定为 CRITICAL 并将该 Check 列入 writeBackPlan

#### Scenario: 完整制品的变更

- **WHEN** 变更包含所有制品（proposal、specs、design、tasks）
- **THEN** reviewer SHALL 验证所有四个维度 + Xirang 对齐

#### Scenario: Coherence 维度升级设计违背为 CRITICAL

- **WHEN** design.md 说"用 Redis 缓存"
- **AND** 代码使用了 Map
- **AND** 代码中无注释说明理由
- **THEN** reviewer SHALL 判定为 CRITICAL "Design decision violated"
- **AND** recommendation SHALL 要求对齐设计或更新 design.md

#### Scenario: 等价性判定不接受仅测试证据

- **WHEN** 某 Check 锚定 `Preserves:` 且关联测试全部通过
- **AND** 该 Check `Expect:` 点名的旧形态在最终代码中仍然存在
- **THEN** reviewer SHALL 判定为 CRITICAL（新旧实现并存即半迁移）
- **AND** SHALL NOT 仅凭测试通过判定该 Check 完成

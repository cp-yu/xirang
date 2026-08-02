---
entity: element-declaration
identity: reviewer-protocol
kind: capability
parent: review
title: Reviewer Protocol
definition: Reviewer Protocol 定义 Reviewer 角色与硬约束、输入合约、6 步验证协议、严重性阈值与证据标准、三个验证维度、结构化输出合约与跨工具 skill 路径兼容。
---

## Requirements

### Requirement: Reviewer 角色与硬约束
`xirang-reviewer` skill SHALL 将 subagent 定义为 Phase 1 验证审查者，拥有所有 completeness、correctness、coherence 判定权，且 MUST 遵循以下硬约束：不引用或依赖任何实现对话历史；自主读取文件并基于读取内容做判断；为每个判断引用具体文件路径和行范围；在判定严重性级别前执行完整的 6 步验证循环；不修改任何文件；通过 Bash 只执行测试命令和 git 只读命令。

#### Scenario: Subagent invoke reviewer skill
- **WHEN** 顶层 agent spawn reviewer subagent 并 invoke `xirang-reviewer` skill
- **THEN** subagent SHALL 加载完整 skill 指令
- **AND** SHALL 使用 Read 和 Bash 工具自主获取验证所需信息
- **AND** SHALL 将其角色认定为拥有所有验证判定权的 clean-context 审查者

#### Scenario: Reviewer 拒绝基于记忆的判断
- **WHEN** reviewer 读取候选文件后某需求未找到实现证据
- **AND** reviewer 自己的训练数据中可能有相关知识
- **THEN** reviewer MUST NOT 基于训练数据推测实现存在
- **AND** SHALL 将缺失的证据报告为 CRITICAL（经彻底搜索后）或证据缺口

### Requirement: Reviewer 输入合约

`xirang-reviewer` skill SHALL 定义顶层 agent MUST 传入的轻量定位信息：changeName、changeDir 与 projectRoot。Reviewer SHALL 自主完成 changeArtifacts、scopeFiles、finalFileContents、priorVerifyResult 与语义上下文的信息获取；Reviewer MUST NOT 把 `git diff` 的内容级输出作为判断证据；缺失定位信息时 fail closed。

#### Scenario: 所有定位信息完整传入

- **WHEN** 顶层 agent 传入 changeName、changeDir 和 projectRoot
- **THEN** reviewer SHALL 自行读取所有必要文件并继续执行验证协议
- **AND** SHALL NOT 要求 master 传入文件内容

#### Scenario: 缺少定位信息

- **WHEN** changeDir 未传入或路径不存在
- **THEN** reviewer SHALL 返回 FAIL_NEEDS_CORRECTIONS 和 CRITICAL issue "Missing required input: changeDir"
- **AND** SHALL 停止，不执行进一步验证

#### Scenario: 不依赖 diff 内容判断行为

- **WHEN** reviewer 评估某 requirement 是否实现
- **THEN** SHALL 仅以 Read 到的最终文件内容作为证据
- **AND** SHALL NOT 引用 `git diff` hunk 或某次 commit 的局部变化作为判断依据

#### Scenario: baseCommit 缺失或无效时关闭验证

- **WHEN** `.apply-isolation.json` 缺少 `baseCommit` 或 Git 无法解析该 SHA
- **THEN** reviewer SHALL 返回包含 CRITICAL issue 的 `FAIL_NEEDS_CORRECTIONS`
- **AND** SHALL NOT 以可移动 branch ref 猜测证据基线
#### Scenario: 首次 verify 无 prior result
- **WHEN** `changeDir/.verify-result.json` 不存在
- **THEN** reviewer SHALL 通过 `git diff <baseCommit>...HEAD --name-only`、`git status --short` 与 change artifacts 关键词推断候选实现文件
- **AND** SHALL Read 推断出的候选文件最终内容
- **AND** SHALL 将 priorVerifyResult 视为 null 继续验证
#### Scenario: 利用 verify-result 作为导航 manifest
- **WHEN** `.verify-result.json` 存在且包含 `verificationContext.evidenceFiles`
- **THEN** reviewer SHALL Read evidenceFiles 列表中的每个文件最终内容作为候选
- **AND** SHALL 结合 `git diff` 与 `git status` 补充列表中未覆盖的文件
### Requirement: 6 步验证协议

`xirang-reviewer` skill SHALL 为每个 delta requirement 定义并强制执行 6 步客观验证循环：Locate（识别候选文件）、Read（检查最终磁盘内容）、Analyze（对比 requirement 意图与全部 Scenario）、Cite（记录文件路径与行范围）、Judge（分配 PASS/WARNING/CRITICAL）、Explain（准确说明缺失、偏离或不确定内容）。

#### Scenario: 需求被实现证据清晰满足

- **WHEN** finalFileContents 中某文件清晰实现了 requirement 行为
- **AND** 所有关联 Scenario 条件均已覆盖
- **THEN** reviewer SHALL 分配 PASS
- **AND** SHALL 引用文件路径和行范围作为证据

#### Scenario: 搜索后未找到可信证据

- **WHEN** 经过对 scope 内候选文件的彻底 Read
- **AND** 未找到 requirement 行为的可信实现证据
- **THEN** reviewer SHALL 分配 CRITICAL
- **AND** SHALL 说明搜索过程和为何判定为缺失

### Requirement: 严重性阈值与证据标准

`xirang-reviewer` skill SHALL 定义 CRITICAL、WARNING、SUGGESTION 三级严重性及其触发条件与阻塞/写回语义。Severity assignment philosophy：默认立场严格，证据薄弱时升级到 CRITICAL；举证责任在于证明完整性；不确定时升级到 CRITICAL。

#### Scenario: 实现与 spec 矛盾

- **WHEN** 实现逻辑与 spec 明确矛盾（如 spec 要求失败 3 次锁定，代码检查 2 次）
- **THEN** reviewer SHALL 分配 CRITICAL（非 WARNING）
- **AND** recommendation SHALL 提供两条路径："对齐代码与 spec" 或 "更新 spec 如果实现是故意的"

#### Scenario: 装饰性 drift 降级为 WARNING

- **WHEN** spec 说 "validate input"，代码函数名是 checkInput 且行为逻辑完全一致
- **THEN** reviewer SHALL 分配 WARNING（而非 CRITICAL）
- **AND** SHALL 在 summary 中注明这是装饰性差异
#### Scenario: 实现存在于非 diff 文件中
- **WHEN** requirement 由已有代码（非当前 diff 中的文件）满足
- **AND** 最终文件内容确认了此行为
- **THEN** reviewer SHALL 分配 PASS 并引用最终文件证据
- **AND** SHALL 在 gitDiffSummary 中注明由已有代码覆盖
### Requirement: 三个验证维度
`xirang-reviewer` skill SHALL 覆盖四个验证维度及可选的对齐检查，并按 Check 的锚点类型分派判定模式：`Verifies` 普通 requirement 执行存在性判定，`Verifies ... REMOVED Requirement` 执行缺失性判定，`Preserves` 执行等价性判定。

#### Scenario: 仅有 tasks.md 的变更
- **WHEN** 变更仅有 tasks.md 无 delta contracts 无 design.md
- **THEN** reviewer SHALL 仅验证任务完成度
- **AND** SHALL 跳过正确性、一致性、清洁性和对齐检查并注明

#### Scenario: Correctness 维度升级 scenario 未覆盖为 CRITICAL
- **WHEN** delta contract 中某 requirement 包含 Scenario 块
- **AND** 代码或测试中未找到该 Scenario 条件的处理证据
- **THEN** reviewer SHALL 判定为 CRITICAL "Scenario not covered"
- **AND** recommendation SHALL 要求添加测试和实现

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
### Requirement: 结构化输出合约
`xirang-reviewer` skill SHALL 定义 reviewer MUST 返回的精确 JSON 输出 schema：result（PASS/PASS_WITH_WARNINGS/FAIL_NEEDS_CORRECTIONS）、issues、summary（四维度）、writeBackPlan（仅 CRITICAL 时存在）、evidenceFiles、gitDiffSummary。规格外改动发现的 writeBackPlan 条目 taskLine SHALL 为 `null` 且 action SHALL 为 `append_correction`。

#### Scenario: Reviewer 产出完整评估
- **WHEN** reviewer 完成验证
- **THEN** SHALL 返回符合定义 schema 的单个结构化 JSON 对象
- **AND** SHALL NOT 包含散文式前言或对话性填充

#### Scenario: 无 CRITICAL issue 时 writeBackPlan 为空
- **WHEN** 评估中所有 issue 严重性 ≤ WARNING
- **THEN** writeBackPlan SHALL 为空数组
- **AND** result SHALL 为 PASS 或 PASS_WITH_WARNINGS

#### Scenario: 规格外发现的 writeBackPlan 条目
- **WHEN** reviewer 将某个规格外改动判定为 CRITICAL
- **THEN** 对应 writeBackPlan 条目的 taskLine SHALL 为 `null`
- **AND** action SHALL 为 `append_correction`
- **AND** correctionType SHALL 为 `artifact_fix`（改动合理）或 `code_fix`（改动不应存在）

### Requirement: 跨工具 skill 路径兼容
`xirang-reviewer` skill 文件 SHALL 通过 `path.join()` 构建安装路径，确保在 Windows、macOS 和 Linux 上的正确性。Skill 指令中引用的文件路径 SHALL 使用相对 POSIX 路径。

#### Scenario: Windows 上安装 reviewer skill
- **WHEN** 在 Windows 上为 Claude Code 执行 setup
- **THEN** skill 文件 SHALL 写入到对应的 `agents` 或 `skills` 目录（路径使用 `path.join()` 构建）

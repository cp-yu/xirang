---
entity: element-declaration
identity: reviewer-protocol
kind: element
parent: review
title: Reviewer Protocol
definition: Reviewer Protocol 定义 Reviewer 角色与硬约束、输入合约、6 步验证协议、严重性阈值与证据标准、三个验证维度、结构化输出合约与跨工具 skill 路径兼容。
---
## MODIFIED Requirements

### Requirement: Reviewer 角色与硬约束

`xirang-reviewer` skill SHALL 将 subagent 定义为 quality Review 的审查者，拥有所有 completeness、correctness、coherence 判定权，且 MUST 遵循以下硬约束：不引用或依赖任何实现对话历史；自主读取文件并基于读取内容做判断；为每个判断引用具体文件路径和行范围；在判定严重性级别前执行完整的 6 步验证循环；不修改任何文件；通过 Bash 只执行测试命令和 git 只读命令。

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

`xirang-reviewer` skill SHALL 定义顶层 agent MUST 传入的轻量定位信息：changeName、changeDir 与 projectRoot。Reviewer SHALL 自主完成 changeArtifacts、scopeFiles、finalFileContents、priorQualityRecord 与语义上下文的信息获取；Reviewer MUST NOT 把 `git diff` 的内容级输出作为判断证据；缺失定位信息时 fail closed。

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

#### Scenario: 首次 Review 无 prior record

- **WHEN** `changeDir/.quality-state.json` 不存在
- **THEN** reviewer SHALL 通过 `git diff <baseCommit>...HEAD --name-only`、`git status --short` 与 change artifacts 关键词推断候选实现文件
- **AND** SHALL Read 推断出的候选文件最终内容
- **AND** SHALL 将 priorQualityRecord 视为 null 继续验证

#### Scenario: 利用 quality 记录作为导航 manifest

- **WHEN** `.quality-state.json` 存在且包含 `evidenceFiles`
- **THEN** reviewer SHALL Read evidenceFiles 列表中的每个文件最终内容作为候选
- **AND** SHALL 结合 `git diff` 与 `git status` 补充列表中未覆盖的文件

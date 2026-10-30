---
entity: element-declaration
identity: reviewer-protocol
kind: element
parent: review
title: Reviewer Protocol
definition: Reviewer Protocol 定义 Reviewer 角色与硬约束、输入合约、6 步验证协议、严重性阈值与证据标准、三个验证维度、结构化输出合约与跨工具 skill 路径兼容。
---

## MODIFIED Sections

### Section: Reviewer 输入合约

`xirang-reviewer` skill SHALL 定义顶层 agent MUST 传入的轻量定位信息：changeName、changeDir 与 projectRoot。Reviewer SHALL 自主完成 changeArtifacts、scopeFiles、finalFileContents、priorQualityRecord 与语义上下文的信息获取；Reviewer MUST NOT 把 `git diff` 的内容级输出作为判断证据；缺失定位信息时 fail closed。

- **所有定位信息完整传入**

  - 顶层 agent 传入 changeName、changeDir 和 projectRoot
  - reviewer SHALL 自行读取所有必要文件并继续执行验证协议
  - SHALL NOT 要求 master 传入文件内容

- **缺少定位信息**

  - changeDir 未传入或路径不存在
  - reviewer SHALL 返回 FAIL_NEEDS_CORRECTIONS 和 CRITICAL issue "Missing required input: changeDir"
  - SHALL 停止，不执行进一步验证

- **不依赖 diff 内容判断行为**

  - reviewer 评估某 Section 语义是否实现
  - SHALL 仅以 Read 到的最终文件内容作为证据
  - SHALL NOT 引用 `git diff` hunk 或某次 commit 的局部变化作为判断依据

- **baseCommit 缺失或无效时关闭验证**

  - `.apply-isolation.json` 缺少 `baseCommit` 或 Git 无法解析该 SHA
  - reviewer SHALL 返回包含 CRITICAL issue 的 `FAIL_NEEDS_CORRECTIONS`
  - SHALL NOT 以可移动 branch ref 猜测证据基线

- **首次 Review 无 prior record**

  - `changeDir/.quality-state.json` 不存在
  - reviewer SHALL 通过 `git diff <baseCommit>...HEAD --name-only`、`git status --short` 与 change artifacts 关键词推断候选实现文件
  - SHALL Read 推断出的候选文件最终内容
  - SHALL 将 priorQualityRecord 视为 null 继续验证

- **利用 quality 记录作为导航 manifest**

  - `.quality-state.json` 存在且包含 `evidenceFiles`
  - reviewer SHALL Read evidenceFiles 列表中的每个文件最终内容作为候选
  - SHALL 结合 `git diff` 与 `git status` 补充列表中未覆盖的文件

- **读取重启历史**：当前 Change 存在受控轮换保存的质量历史时，Reviewer SHALL 按共享恢复 reference 自主读取旧快照、日志、失败原因与重启原因，作为问题与候选文件导航参考；历史 PASS 不构成本轮通过依据。即使代码未变，也 SHALL 在 fresh context 重新读取当前模型、Change、最终实现与证据并形成新结论。根目录尚无新活动记录时，priorQualityRecord 仍为 null，历史只作为独立参考。

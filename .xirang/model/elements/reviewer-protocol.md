---
entity: element-declaration
identity: reviewer-protocol
kind: element
parent: review
title: Reviewer Protocol
definition: Reviewer Protocol 定义 Reviewer 角色与硬约束、输入合约、6 步验证协议、严重性阈值与证据标准、三个验证维度、结构化输出合约与跨工具 skill 路径兼容。
---

## Specification

### Section: Reviewer 角色与硬约束

`xirang-reviewer` skill SHALL 将 subagent 定义为 quality Review 的审查者，拥有所有 completeness、correctness、coherence 判定权，且 MUST 遵循以下硬约束：不引用或依赖任何实现对话历史；自主读取文件并基于读取内容做判断；为每个判断引用具体文件路径和行范围；在判定严重性级别前执行完整的 6 步验证循环；不修改任何文件；通过 Bash 只执行测试命令和 git 只读命令。

- **Subagent invoke reviewer skill**

  - 顶层 agent spawn reviewer subagent 并 invoke `xirang-reviewer` skill
  - subagent SHALL 加载完整 skill 指令
  - SHALL 使用 Read 和 Bash 工具自主获取验证所需信息
  - SHALL 将其角色认定为拥有所有验证判定权的 clean-context 审查者

- **Reviewer 拒绝基于记忆的判断**

  - reviewer 读取候选文件后某需求未找到实现证据
  - reviewer 自己的训练数据中可能有相关知识
  - reviewer MUST NOT 基于训练数据推测实现存在
  - SHALL 将缺失的证据报告为 CRITICAL（经彻底搜索后）或证据缺口

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

### Section: 6 步验证协议

`xirang-reviewer` skill SHALL 为每个 delta Section 定义并强制执行 6 步客观验证循环：Locate（识别候选文件）、Read（检查最终磁盘内容）、Analyze（对比 Section 语义与其可观察行为）、Cite（记录文件路径与行范围）、Judge（分配 PASS/WARNING/CRITICAL）、Explain（准确说明缺失、偏离或不确定内容）。覆盖按可观察行为与可信证据判断，不按 Acceptance Case 与测试文件 1:1 映射。

- **需求被实现证据清晰满足**

  - finalFileContents 中某文件清晰实现了 Section 语义
  - 关联 Acceptance Case 所具体化的可观察行为均有可信证据
  - reviewer SHALL 分配 PASS
  - SHALL 引用文件路径和行范围作为证据
  - SHALL NOT 仅因缺少与 Acceptance Case 同名的独立测试文件而拒绝 PASS

- **搜索后未找到可信证据**

  - 经过对 scope 内候选文件的彻底 Read
  - 未找到 Section 语义的可信实现证据
  - reviewer SHALL 分配 CRITICAL
  - SHALL 说明搜索过程和为何判定为缺失

### Section: 严重性阈值与证据标准

`xirang-reviewer` skill SHALL 定义 CRITICAL、WARNING、SUGGESTION 三级严重性及其触发条件与阻塞/写回语义。Severity assignment philosophy：默认立场严格，证据薄弱时升级到 CRITICAL；举证责任在于证明完整性；不确定时升级到 CRITICAL。

- **实现与 spec 矛盾**

  - 实现逻辑与 spec 明确矛盾（如 spec 要求失败 3 次锁定，代码检查 2 次）
  - reviewer SHALL 分配 CRITICAL（非 WARNING）
  - recommendation SHALL 提供两条路径："对齐代码与 spec" 或 "更新 spec 如果实现是故意的"

- **装饰性 drift 降级为 WARNING**

  - spec 说 "validate input"，代码函数名是 checkInput 且行为逻辑完全一致
  - reviewer SHALL 分配 WARNING（而非 CRITICAL）
  - SHALL 在 summary 中注明这是装饰性差异

- **实现存在于非 diff 文件中**

  - Section 语义由已有代码（非当前 diff 中的文件）满足
  - 最终文件内容确认了此行为
  - reviewer SHALL 分配 PASS 并引用最终文件证据
  - SHALL 在 gitDiffSummary 中注明由已有代码覆盖

### Section: 降级为 WARNING 的补充条件

当实现可能存在但 reviewer 缺乏验证工具（如运行时行为、外部 API 集成），或设计决策偏离已在代码注释中显式说明理由时，reviewer SHALL 判定为 WARNING 而非 CRITICAL；不确定时仍 SHALL 升级到 CRITICAL。

- **设计决策偏离已注释说明理由**

  - design.md 决策与代码实现不同
  - 代码注释显式说明偏离理由
  - reviewer SHALL 判定为 WARNING（而非 CRITICAL）
  - SHALL 在 summary 中注明注释位置

- **缺乏验证工具时降级为 WARNING**

  - 实现可能存在但 reviewer 缺乏验证工具（如运行时行为、外部 API 集成）
  - reviewer SHALL 判定为 WARNING（而非 CRITICAL）
  - SHALL 在 summary 中注明证据缺口

### Section: 三个验证维度

`xirang-reviewer` skill SHALL 覆盖四个验证维度及可选的对齐检查，并按 Check 的锚点类型分派判定模式：`Verifies` 普通 Section 执行存在性判定，`Verifies ... REMOVED Section` 执行缺失性判定，`Preserves` 执行等价性判定。存在性判定 SHALL 接受一条测试覆盖多个 Acceptance Case、以及 Change 明确分类的 one-time evidence；SHALL NOT 把缺少 1:1 测试文件本身升级为 CRITICAL。

- **仅有 tasks.md 的变更**

  - 变更仅有 tasks.md 无 delta contracts 无 design.md
  - reviewer SHALL 仅验证任务完成度
  - SHALL 跳过正确性、一致性、清洁性和对齐检查并注明

- **Correctness 按行为证据判定覆盖**

  - delta contract 中某 Section 包含 Acceptance Case
  - 代码、测试或 Check 声明的 one-time evidence 能证明这些 Acceptance Case 具体化的可观察行为
  - reviewer SHALL 判定该 Section 覆盖充分
  - SHALL NOT 因没有与每个 Acceptance Case 一一对应的测试文件而判定 CRITICAL "Acceptance Case not covered"

- **行为无证据或弱断言升级为 CRITICAL**

  - 某 required behavior 没有可信实现或验证证据
- **OR** 声称覆盖该行为的测试在翻转关键比较或删除关键赋值后仍会通过
- **THEN** reviewer SHALL 判定为 CRITICAL
- **AND** recommendation SHALL 要求补强行为证据，而不是补锁词测试

- **正式模型原文锁词升级为 CRITICAL**

  - 本次变更新增测试读取正式 `.xirang/model/` 并断言 Section 或 Acceptance Case 原文
  - reviewer SHALL 判定为 CRITICAL
  - recommendation SHALL 要求改为验证项目代码行为或 CLI fixture

- **缺失性判定要求多角度搜索后引用证据**

  - 某 Check 锚定 `Verifies: ... REMOVED Section "<name>"`
  - reviewer SHALL 对该交付物执行缺失性判定：搜索符号名、文件路径与 import 引用
  - 判定 PASS 时 SHALL 引用搜索命令与空结果作为证据
  - 发现任何残留引用时 SHALL 判定为 CRITICAL 并引用残留位置

- **Delete 声明与 git diff 逐项核对**

  - 某 task 的 `Files` 包含 `Delete:` 条目且该 task 的 Check 已勾选
  - reviewer SHALL 在 `git diff <baseCommit>...HEAD` 与 `git status --short` scope 中确认该文件已删除
  - 文件仍存在时 SHALL 判定为 CRITICAL 并将该 Check 列入 writeBackPlan

- **完整制品的变更**

  - 变更包含所有制品（proposal、specs、design、tasks）
  - reviewer SHALL 验证所有四个维度 + Xirang 对齐

- **Coherence 维度升级设计违背为 CRITICAL**

  - design.md 说"用 Redis 缓存"
  - 代码使用了 Map
  - 代码中无注释说明理由
  - reviewer SHALL 判定为 CRITICAL "Design decision violated"
  - recommendation SHALL 要求对齐设计或更新 design.md

- **等价性判定不接受仅测试证据**

  - 某 Check 锚定 `Preserves:` 且关联测试全部通过
  - 该 Check `Expect:` 点名的旧形态在最终代码中仍然存在
  - reviewer SHALL 判定为 CRITICAL（新旧实现并存即半迁移）
  - SHALL NOT 仅凭测试通过判定该 Check 完成

### Section: 结构化输出合约

`xirang-reviewer` skill SHALL 定义 reviewer MUST 返回的精确 JSON 输出 schema：result（PASS/PASS_WITH_WARNINGS/FAIL_NEEDS_CORRECTIONS）、issues、summary（四维度）、writeBackPlan（仅 CRITICAL 时存在）、evidenceFiles、gitDiffSummary。规格外改动发现的 writeBackPlan 条目 taskLine SHALL 为 `null` 且 action SHALL 为 `append_correction`。

- **Reviewer 产出完整评估**

  - reviewer 完成验证
  - SHALL 返回符合定义 schema 的单个结构化 JSON 对象
  - SHALL NOT 包含散文式前言或对话性填充

- **无 CRITICAL issue 时 writeBackPlan 为空**

  - 评估中所有 issue 严重性 ≤ WARNING
  - writeBackPlan SHALL 为空数组
  - result SHALL 为 PASS 或 PASS_WITH_WARNINGS

- **规格外发现的 writeBackPlan 条目**

  - reviewer 将某个规格外改动判定为 CRITICAL
  - 对应 writeBackPlan 条目的 taskLine SHALL 为 `null`
  - action SHALL 为 `append_correction`
  - correctionType SHALL 为 `artifact_fix`（改动合理）或 `code_fix`（改动不应存在）

### Section: 跨工具 skill 路径兼容

`xirang-reviewer` skill 文件 SHALL 通过 `path.join()` 构建安装路径，确保在 Windows、macOS 和 Linux 上的正确性。Skill 指令中引用的文件路径 SHALL 使用相对 POSIX 路径。

- **Windows 上安装 reviewer skill**

  - 在 Windows 上为 Claude Code 执行 setup
  - skill 文件 SHALL 写入到对应的 `agents` 或 `skills` 目录（路径使用 `path.join()` 构建）

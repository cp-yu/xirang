---
entity: element-declaration
identity: reviewer-protocol
kind: element
parent: review
title: Reviewer Protocol
definition: Reviewer Protocol 定义 Reviewer 角色与只读约束、commit-bound 输入合约、6 步验证协议、严重性阈值与证据标准、验证维度、结构化 Review opinion 输出合约及跨工具 skill 路径兼容。
---

## Specification

### Section: Reviewer 角色与硬约束

`xirang-reviewer` skill SHALL 将 subagent 定义为 clean-context、只读 Review Agent。它拥有实际受托范围内独立 completeness、correctness、coherence 判定权，MUST 自主读取证据、为判断引用具体文件路径和行范围、先完成完整验证再判严重性，且 MUST NOT 依赖实现对话历史或修改任何文件、任务状态、Quality JSON 与 Git history。Review opinion SHALL 绑定调用方指定的 Git commit；Required Corrections 交由主 Agent 处理。

### Section: Reviewer 输入合约

`xirang-reviewer` skill SHALL 要求顶层 Agent 传入 `changeName`、`changeDir`、`projectRoot`、审查范围与被审查 Git commit identity。Reviewer SHALL 只针对该 commit 和实际范围形成 opinion；不得将 `git diff` hunks 或未提交工作区内容作为该 commit 的实现证据。缺失或无法读取指定 commit 时 SHALL fail closed。Reviewer 可读取同一新 Quality JSON 中已有意见作为上下文，但历史 PASS 不能代替本次读取与判断；不得读取旧 snapshot/log/evidence 并将其当作新协议依据。

- **定位信息完整**：收到 changeName、changeDir、projectRoot、scope 与 commit 后，Reviewer 自行读取必要的 Change、Semantic Model 和 commit 内容。
- **缺少 commit identity**：Reviewer SHALL 返回证据缺口，不猜测 HEAD 或 branch ref。
- **意见与 commit 绑定**：输出 commit identity 必须与调用方指定值相同；后续提交不得重绑该 Review。

### Section: 6 步验证协议

`xirang-reviewer` skill SHALL 为基线 Review 的每个 delta Section，以及增量/基线缺陷修复 Review 实际委托范围内的语义与受影响行为 定义并强制执行 6 步客观验证循环：Locate（识别候选文件）、Read（检查最终磁盘内容）、Analyze（对比 Section 语义与其可观察行为）、Cite（记录文件路径与行范围）、Judge（分配 PASS/WARNING/CRITICAL）、Explain（准确说明缺失、偏离或不确定内容）。覆盖按可观察行为与可信证据判断，不按 Acceptance Case 与测试文件 1:1 映射。

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

`xirang-reviewer` skill SHALL 覆盖四个验证维度及可选的对齐检查，并按目标的验证方向分派判定模式：存在性判定针对目标声明的行为或结果，缺失性判定针对验证删除的目标，等价性判定针对行为保持目标。存在性判定 SHALL 接受一条测试覆盖多个 Acceptance Case、以及 Change 明确分类的 one-time evidence；SHALL NOT 把缺少 1:1 测试文件本身升级为 CRITICAL。

- **仅有 tasks.md 的变更**

  - 变更仅有 tasks.md 无 delta contracts 无 design.md
  - reviewer SHALL 仅验证目标完成度
  - SHALL 跳过正确性、一致性、清洁性和对齐检查并注明

- **Correctness 按行为证据判定覆盖**

  - delta contract 中某 Section 包含 Acceptance Case
  - 代码、测试或目标声明的 one-time evidence 能证明这些 Acceptance Case 具体化的可观察行为
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

  - 某目标验证声明的删除是否完成
  - reviewer SHALL 对该交付物执行缺失性判定：搜索符号名、文件路径与 import 引用
  - 判定 PASS 时 SHALL 引用搜索命令与空结果作为证据
  - 发现任何残留引用时 SHALL 判定为 CRITICAL 并引用残留位置

- **目标声明的删除与 git diff 逐项核对**

  - 某目标验证声明删除文件或行为
  - reviewer SHALL 在 `git diff <baseCommit>...HEAD` 与 `git status --short` scope 及最终仓库内容中确认该删除已完成
  - 声明的删除未完成时 SHALL 判定为 CRITICAL

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

  - 某行为保持目标的关联测试全部通过
  - 该目标验证方向点名的旧形态在最终代码中仍然存在
  - reviewer SHALL 判定为 CRITICAL（新旧实现并存即半迁移）
  - SHALL NOT 仅凭测试通过判定该目标完成

优化工作 SHALL 结合委托、实际报告和代码判断归属，允许当前 Change 目标所需新增/删除/移动文件和多层依赖上的公共辅助函数；不只因实现文件未在目标级 tasks 中预列或超过一层依赖而判 CRITICAL。公共函数检查其他调用方，另一套无关查询系统重构仍超出授权。增量或基线缺陷修复 Review SHALL 仅报告实际检查范围，不声称未检查部分已被重新审查。

### Section: 结构化输出合约

`xirang-reviewer` skill SHALL 定义单个结构化 JSON opinion，至少包含 `commit`、`scope`、`result`（`PASS`、`PASS_WITH_WARNINGS` 或 `FAIL_NEEDS_CORRECTIONS`）、`issues`、`summary` 与 `evidenceFiles`。`issues` SHALL 具体描述证据、偏离或 Required Corrections；可选 `gitDiffSummary` 只作上下文，不替代最终内容证据。输出 SHALL NOT 包含 `writeBackPlan`、task checkbox 修改指令或要求 Reviewer 编辑 `tasks.md` 的字段。CLI 负责在保存时验证 commit identity 并追加到 Quality JSON；主 Agent 决定如何处理 opinion。

- **Opinion 结构完整**：Reviewer 完成验证后返回符合该 JSON schema 的单个对象，不添加对话前言。
- **没有阻塞问题**：result 为 PASS 或 PASS_WITH_WARNINGS，opinion 仍绑定实际 commit 与审查范围。
- **发现阻塞问题**：result 为 FAIL_NEEDS_CORRECTIONS，并返回足以让主 Agent 修正的 findings；Reviewer 不直接写入任务文件。

### Section: 跨工具 skill 路径兼容

`xirang-reviewer` skill 文件 SHALL 通过 `path.join()` 构建安装路径，确保在 Windows、macOS 和 Linux 上的正确性。Skill 指令中引用的文件路径 SHALL 使用相对 POSIX 路径。

- **Windows 上安装 reviewer skill**

  - 在 Windows 上为 Claude Code 执行 setup
  - skill 文件 SHALL 写入到对应的 `agents` 或 `skills` 目录（路径使用 `path.join()` 构建）

### Section: 依据目标级任务与实际变更审查

Reviewer SHALL 依据目标 Semantic Delta、目标级 `tasks.md`、实际 commit 差异和可复现行为证据判断 Change 的实现范围与完成度，不依赖旧式 `Files`、`Verifies:`、`Preserves:` 或 nested `Checks`。Reviewer SHALL 自主定位相关实现与测试；不得仅因某个实际变更文件未在任务中预列而判定越界或未完成。目标 checkbox 不替代行为证据，目标未达到时 SHALL 给出基于 Contract 和项目证据的 Required Correction。

- **实现文件未预列**
  - 某个实现文件未在目标级 tasks 中列出，但 commit 变更涉及该文件
  - Reviewer SHALL 对照 Change 目标、Contract 与证据判断是否相关，不因缺少旧式 Files 声明单独报错

- **目标尚未实现**
  - 任务 checkbox 已完成，但目标语义缺少可信实现或验证证据
  - Reviewer SHALL 判定未通过并指出目标与证据缺口

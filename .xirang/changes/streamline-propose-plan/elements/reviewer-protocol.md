---
entity: element-declaration
identity: reviewer-protocol
kind: element
parent: review
title: Reviewer Protocol
definition: Reviewer Protocol 定义 Reviewer 角色与只读约束、commit-bound 输入合约、6 步验证协议、严重性阈值与证据标准、验证维度、结构化 Review opinion 输出合约及跨工具 skill 路径兼容。
---

## ADDED Sections

### Section: 依据目标级任务与实际变更审查

Reviewer SHALL 依据目标 Semantic Delta、目标级 `tasks.md`、实际 commit 差异和可复现行为证据判断 Change 的实现范围与完成度，不依赖旧式 `Files`、`Verifies:`、`Preserves:` 或 nested `Checks`。Reviewer SHALL 自主定位相关实现与测试；不得仅因某个实际变更文件未在任务中预列而判定越界或未完成。目标 checkbox 不替代行为证据，目标未达到时 SHALL 给出基于 Contract 和项目证据的 Required Correction。

- **实现文件未预列**
  - 某个实现文件未在目标级 tasks 中列出，但 commit 变更涉及该文件
  - Reviewer SHALL 对照 Change 目标、Contract 与证据判断是否相关，不因缺少旧式 Files 声明单独报错

- **目标尚未实现**
  - 任务 checkbox 已完成，但目标语义缺少可信实现或验证证据
  - Reviewer SHALL 判定未通过并指出目标与证据缺口

## MODIFIED Sections

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

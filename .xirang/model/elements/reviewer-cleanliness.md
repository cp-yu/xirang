---
entity: element-declaration
identity: reviewer-cleanliness
kind: element
parent: review
title: Reviewer Cleanliness
definition: Reviewer Cleanliness 定义 Review 的 Cleanliness 验证维度：检测"本次变更应清理但未清理"的遗留物、工具无关的检测策略、Cleanliness summary schema、与 Optimizer 的职责边界，以及规格外改动检测与归因。
---

## Specification

### Section: Cleanliness 维度定义

Reviewer SHALL 在 Coherence 维度之后增加 Cleanliness 维度，用于检测"本次变更应清理但未清理"的遗留物：重构后的孤儿代码、过时的 TODO/FIXME 标记、本次变更引入的死 import、半迁移状态与不可达代码路径。Scope SHALL 限定为本次变更范围的文件并集，SHALL NOT 检查本次变更之外的历史技术债。

- **检测重构后的孤儿代码**

  - tasks.md 中有已勾选的任务包含"重构"/"迁移"/"替换"关键词
  - git diff 显示删除了部分旧代码
  - 通过 grep 或 Read 发现旧 API 仍然存在且被导出
  - reviewer SHALL 判定为 CRITICAL "Incomplete refactor: <old-entity> still exists"
  - SHALL 在 recommendation 中要求完成移除或在 tasks.md 中说明保留理由

- **检测过时的 TODO 标记**

  - 代码中存在 TODO/FIXME/HACK 注释
  - 注释文本与 tasks.md 中已勾选任务描述匹配
  - reviewer SHALL 判定为 CRITICAL "Stale TODO for completed work"
  - SHALL 引用具体文件路径和行号

- **检测本次变更引入的死 import**

  - git diff 显示本次新增了 import 语句
  - 在同一文件中未找到该 import 的使用
  - reviewer SHALL 判定为 CRITICAL "Unused import introduced"
  - recommendation SHALL 建议移除该 import 语句

- **不可达代码降级为 WARNING**

  - 检测到本次变更引入了逻辑不可达的代码路径
  - reviewer SHALL 判定为 WARNING（而非 CRITICAL）
  - recommendation SHALL 询问这是否为故意的防御性代码

- **检测半迁移状态**

  - tasks.md 中有已勾选的迁移任务
  - git diff 显示同时引入了新 API 和保留了旧 API 的调用
  - reviewer SHALL 判定为 CRITICAL "Incomplete migration: <old-pattern> and <new-pattern> coexist"
  - recommendation SHALL 建议完成迁移或拆分为分阶段任务

- **未来工作 TODO 降级为 SUGGESTION**

  - TODO 注释显式引用未来工作或独立 issue（如 "TODO(GH-123): add caching"）
  - reviewer SHALL 判定为 SUGGESTION（而非 CRITICAL）
  - summary SHALL 标记为 "Future work marker"

### Section: 工具无关的检测策略

Reviewer SHALL 采用工具无关的检测策略声明，agent 根据项目类型自主选择适配方法。Prompt SHALL 提供可选方法库而非强制协议，并优先选择轻量级方法（grep + Read）而非重型工具。

- **TypeScript 项目使用可用工具检测死 import**

  - 项目包含可用且可靠的 TypeScript lint/typecheck 命令
  - 本次 diff 新增了 import 语句
  - reviewer MAY 使用该项目原生工具辅助检测死 import
  - SHALL 仍以最终文件内容确认 import 是否被使用

### Section: Cleanliness summary schema 扩展

Reviewer 输出的 summary 对象 SHALL 在 coherence 字段之后增加 cleanliness 字段，包含 `checked` 与各计数器字段；当 tasks.md 缺失或为空时 `cleanliness.checked` SHALL 为 false 且其他计数器字段省略。

- **完整 cleanliness 检查输出**

  - reviewer 完成 Cleanliness 维度检查
  - 检测到 1 个孤儿代码和 2 个过时 TODO
  - summary.cleanliness SHALL 包含 `checked: true`、`orphanedCodeFound: 1`、`staleTodosFound: 2` 等对应计数

- **无 tasks.md 时跳过 Cleanliness**

  - 变更无 tasks.md 或 tasks.md 为空
  - summary.cleanliness.checked SHALL 为 false
  - 各计数器字段 SHALL 省略

- **summary 包含 cleanliness 字段**

  - reviewer 输出 summary 对象
  - SHALL 在 coherence 之后包含 cleanliness 对象
  - cleanliness.checked SHALL 为 true（如果执行了检查）
  - 各计数器字段 SHALL 反映检测到的问题数量

- **规格外改动计入计数器**

  - reviewer 检测到 2 个规格外改动（无论严重级别）
  - summary.cleanliness.unaccountedChangesFound SHALL 为 2

### Section: Cleanliness 与 Optimizer 的职责边界

Review SHALL 判断实际审查范围中的工作是否完整、正确和清洁；Optimization SHALL 在独立审查基线上判断并实施有实际收益且保持语义行为的改进。本次 Change 的真实正确性或清理缺陷不能作为可放弃优化：优化前已存在而被基线漏掉的缺陷由主 Agent 判断并安排修复，修复后必须针对问题及影响独立 Review。优化引入的问题可局部修正或撤销并验证；其他优化后 Review 按主 Agent 风险判断决定，不强制每方向复核。

- **应清理旧 API 仍保留**：Reviewer 独立报告当前 Change 的 completeness/cleanliness 问题；Opt 不以非阻塞可选优化掩盖该缺陷。
- **正确代码的算法机会**：Opt 可在委托范围内实施有证据的复杂度改进并局部测试，主 Agent 决定是否需要增量 Review。

### Section: 规格外改动检测

Reviewer SHALL 在 Cleanliness 维度内检测 diff 中无法归因到任何 task 的规格外改动。普通实现的归因宇宙 SHALL 由各 task Files 声明的条目、各 Check Command 涉及的测试与证据文件、change 制品自身的并集构成（显式列表查找，不使用模式匹配推断）。优化工作 SHALL 同时读取委托、实际报告及代码证据，根据当前 Change 目标与实际影响判断归属；必要的新建、删除、移动文件及多层依赖公共辅助函数不因未列原 tasks Files 而自动成为规格外改动。公共辅助函数须检查其他调用方，另一套无关查询系统重构仍不被本委托授权。

- **无法归因的行为代码升级为 CRITICAL**

  - git diff 中存在归因宇宙之外的文件
  - reviewer 读取该文件后判定其包含行为代码改动
  - reviewer SHALL 判定为 CRITICAL "Unaccounted change"
  - recommendation SHALL 提供两种出口：补充 task 呈现（artifact_fix）或移除该改动（code_fix）

- **机械性良性改动降级**

  - git diff 中存在归因宇宙之外的文件
  - reviewer 读取后判定其为机械性良性改动（lockfile、纯生成物、纯格式化）
  - reviewer SHALL 判定为 WARNING 或 SUGGESTION（而非 CRITICAL）

- **生成面以目录粒度归因**

  - 某 task 的 `Files` 以目录条目声明生成面
  - git diff 包含该目录下的多个再生成文件
  - 这些文件 SHALL 全部归因到该 task
  - SHALL NOT 被报告为规格外改动

- **跨平台路径归因**

  - 归因宇宙的条目与 git diff 文件路径做匹配
  - 实现 SHALL 将两侧路径规范化为 POSIX 相对路径后比较
  - Windows 反斜杠路径 SHALL 在规范化后正确归因

- **判定不确定时升级**

  - 某个归因宇宙之外的文件无法确定是否包含行为改动
  - reviewer SHALL 判定为 CRITICAL（维持 strict 姿态）
  - SHALL 引用该文件路径与不确定原因

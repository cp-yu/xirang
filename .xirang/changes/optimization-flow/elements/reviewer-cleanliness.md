---
entity: element-declaration
identity: "reviewer-cleanliness"
kind: "element"
parent: "review"
title: "Reviewer Cleanliness"
definition: "Reviewer Cleanliness 定义 Review 的 Cleanliness 验证维度：检测\"本次变更应清理但未清理\"的遗留物、工具无关的检测策略、Cleanliness summary schema、与 Optimizer 的职责边界，以及规格外改动检测与归因。"
---

## MODIFIED Sections

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

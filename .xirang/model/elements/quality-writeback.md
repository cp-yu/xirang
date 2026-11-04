---
entity: element-declaration
identity: quality-writeback
kind: element
parent: quality
title: Quality Writeback
definition: Quality Writeback 是 Quality 的修正回写与证据持久化能力，独立维护 CRITICAL 修正、当前快照、追加历史及必要保存边界。它关联基线 Review、优化委托与实际交付、执行时证据及主 Agent 结论，保护版本和历史完整性；适用性判断属于 Quality Freshness，命令输入属于 Quality CLI Gate。
---

## Specification

### Section: CRITICAL 不一致触发回写

当 Review 发现 CRITICAL 级的 spec-code 不一致时，系统 SHALL 把 `tasks.md` 中对应任务的完成标记从 `[x]` 回退为 `[ ]`，并生成修正事项清单。

- **CRITICAL 不一致触发 task unmark**

  - Review 检测到某个 Section 语义在代码中完全缺失实现
  - 该 Section 对应的 task 在 `tasks.md` 中标记为 `[x]`
  - 系统 SHALL 将该 task 的 `[x]` 替换为 `[ ]`
  - SHALL 在修正事项清单中记录 unmark 原因和对应的 Section

- **WARNING 级别不触发自动回写**

  - Review 检测到 WARNING 级别的不一致
  - 系统 SHALL 仅在报告中列出 WARNING
  - SHALL NOT 自动修改 `tasks.md`

- **无 CRITICAL 不一致时不修改 tasks.md**

  - Review 完成且无 CRITICAL 级 issue
  - 系统 SHALL NOT 修改 `tasks.md`

### Section: Required Corrections 清单生成

系统 SHALL 在发现问题时生成结构化的修正事项清单，区分 `code_fix` 和 `artifact_fix` 两类。

- **生成 code_fix 类型修正事项**

  - Review 发现代码未实现某个 Section 语义
  - 修正事项清单 SHALL 包含一条 `code_fix` 条目
  - 条目 SHALL 包含对应的 Section 名称、缺失的具体行为与建议修改的文件

- **生成 artifact_fix 类型修正事项**

  - Review 发现代码实现与 spec 或 design 描述不一致，但代码实现是合理的
  - 修正事项清单 SHALL 包含一条 `artifact_fix` 条目
  - 条目 SHALL 包含需要更新的 artifact 与当前描述与实际行为的差异

- **Required Corrections 清单追加到 tasks.md**

  - 修正事项清单非空
  - 系统 SHALL 在 `tasks.md` 末尾追加 `## Required Corrections` section
  - 每条修正事项 SHALL 以 `- [ ]` checkbox 格式列出并标注类型

### Section: 状态快照持久化

系统 SHALL 保存当前质量快照，将基线 Review、委托/交付、实际测试及主 Agent 最终验证结论分别关联。CLI 生成身份、记录版本、时间与代码状态，Agent 不手写哈希；提交 SHALL 检查所依据版本并拒绝过期覆盖。报告与实际执行证据保持关联，不能以后来报告时状态替换测试/Review 时状态。使用平台 path API，Windows 带空格路径与 POSIX 具有相同保护。

### Section: append-only 历史日志

质量历史 SHALL 只追加，保存过去 Review、委托、实际失败/过期测试、放弃事项及主 Agent 结论，不改写或删除已有历史。先追加记录再更新当前快照；日志与快照不一致时不得声明完成，应给出可恢复诊断并保留两者。回滚代码不回退记录进度或复活旧完成结论。

### Section: 回写内容遵循 runtime projection

系统 SHALL 在为 `tasks.md` 生成回写内容时使用从项目配置编译的 runtime projection 决定自然语言散文。

- **回写散文遵循投影语言策略**

  - 系统追加或刷新 `## Required Corrections` 内容
  - runtime projection 定义了 prose language policy
  - 回写描述 SHALL 遵循该策略
  - task checkbox、`### Section:` header、Section 引用与其他 canonical token SHALL 保持不变

### Section: 质量记录的受控轮换

显式重新验证 SHALL 在原流程停止后保留原代码、commits/checkpoints、全部旧记录及原因，以新的验证关联隔离旧结论，不通过删除终态或篡改日志重启。普通修正和中断恢复不触发记录轮换。无法确认写入或恢复边界时保留所有材料并报告证据缺口，不猜测应删除哪份。不支持的旧质量格式、旧命令输入和退役优化配置 SHALL 给出明确诊断，不静默解释、自动迁移或启用兼容执行路径。旧活动记录不自动转换为新完成结论；既有代码、commits/checkpoints、归档和历史记录 SHALL 保留，由主 Agent 与用户判断旧 Change 如何继续。

### Section: 必要持久化边界

系统 SHALL 在优化修改前保存委托范围、起始代码状态、关联基线 Review 与可恢复位置；放弃已尝试优化时保存事项、原因及处理结果；交付、主动暂停或交回主 Agent 时保存进度、实际测试和遗留问题；最终完成时保存主 Agent 验证结论。其他进度按恢复/交接需要保存，不要求每个小动作或每次保存创建 commit。未交付中断不能记为完成。

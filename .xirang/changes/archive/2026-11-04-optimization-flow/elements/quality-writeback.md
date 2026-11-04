---
operation: "MODIFIED"
entity: "element-declaration"
identity: "quality-writeback"
kind: "element"
parent: "quality"
title: "Quality Writeback"
definition: "Quality Writeback 是 Quality 的修正回写与证据持久化能力，独立维护 CRITICAL 修正、当前快照、追加历史及必要保存边界。它关联基线 Review、优化委托与实际交付、执行时证据及主 Agent 结论，保护版本和历史完整性；适用性判断属于 Quality Freshness，命令输入属于 Quality CLI Gate。"
---

## MODIFIED Sections

### Section: 状态快照持久化

系统 SHALL 保存当前质量快照，将基线 Review、委托/交付、实际测试及主 Agent 最终验证结论分别关联。CLI 生成身份、记录版本、时间与代码状态，Agent 不手写哈希；提交 SHALL 检查所依据版本并拒绝过期覆盖。报告与实际执行证据保持关联，不能以后来报告时状态替换测试/Review 时状态。使用平台 path API，Windows 带空格路径与 POSIX 具有相同保护。

### Section: append-only 历史日志

质量历史 SHALL 只追加，保存过去 Review、委托、实际失败/过期测试、放弃事项及主 Agent 结论，不改写或删除已有历史。先追加记录再更新当前快照；日志与快照不一致时不得声明完成，应给出可恢复诊断并保留两者。回滚代码不回退记录进度或复活旧完成结论。

### Section: 质量记录的受控轮换

显式重新验证 SHALL 在原流程停止后保留原代码、commits/checkpoints、全部旧记录及原因，以新的验证关联隔离旧结论，不通过删除终态或篡改日志重启。普通修正和中断恢复不触发记录轮换。无法确认写入或恢复边界时保留所有材料并报告证据缺口，不猜测应删除哪份。不支持的旧质量格式、旧命令输入和退役优化配置 SHALL 给出明确诊断，不静默解释、自动迁移或启用兼容执行路径。旧活动记录不自动转换为新完成结论；既有代码、commits/checkpoints、归档和历史记录 SHALL 保留，由主 Agent 与用户判断旧 Change 如何继续。

## ADDED Sections

### Section: 必要持久化边界

系统 SHALL 在优化修改前保存委托范围、起始代码状态、关联基线 Review 与可恢复位置；放弃已尝试优化时保存事项、原因及处理结果；交付、主动暂停或交回主 Agent 时保存进度、实际测试和遗留问题；最终完成时保存主 Agent 验证结论。其他进度按恢复/交接需要保存，不要求每个小动作或每次保存创建 commit。未交付中断不能记为完成。

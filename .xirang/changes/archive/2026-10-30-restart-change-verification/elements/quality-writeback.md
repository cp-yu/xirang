---
entity: element-declaration
identity: quality-writeback
kind: element
parent: quality
title: Quality Writeback
definition: Quality Writeback 定义 quality 如何把关键诊断结果回写到 change 工件，以及如何持久化自己的记录：CRITICAL 级不一致触发 `tasks.md` 任务 unmark、Required Corrections 清单生成、状态快照 `.quality-state.json` 的覆盖写与 append-only 历史日志 `.quality-log.jsonl` 的追加。它不定义状态判定规则（属于 Quality Freshness），也不定义命令面的输出形状。
---

## MODIFIED Sections

### Section: append-only 历史日志

系统 SHALL 把每次记录追加到 change 目录下的 `.quality-log.jsonl`，每行一条 JSON 记录。每组活动日志 SHALL 只追加，既有行 MUST NOT 被改写或删除；轮次判断、失败方向与被否决方向的记录 SHALL 保留。用户授权并按共享恢复 reference 完整保存、校验后，允许将整组快照与日志原样轮换到当前 Change 的质量历史目录，再由现有 Review 命令建立新的活动记录。该受控轮换是记录位置的变化，不允许截断日志、改写旧行、仅删终态或丢弃失败证据。

- **每次记录追加一行**

  - `review` 或 `optimize` 成功写入记录
  - 系统 SHALL 向 `.quality-log.jsonl` 追加一行 JSON
  - 既有行 SHALL 保持不变

- **快照与日志的写入顺序**

  - 系统持久化一轮记录
  - SHALL 先追加历史日志，再写入状态快照
  - 两者不一致时后续状态判定 SHALL 按保守方向判为 `dirty`

- **失败方向可从日志恢复**

  - 需要判断某方向是否已被否决或其失败原因
  - 系统 SHALL 能从日志中的历史记录得到该结论

## ADDED Sections

### Section: 质量记录的受控轮换

Agent SHALL 在共享恢复 reference 规定的授权和串行前提下，先完整保存 `.quality-state.json`、`.quality-log.jsonl` 的原始字节和重启原因，再校验保存内容，最后才移走根目录的活动记录。每次历史保存 SHALL 关联原轮次，使用当前 Change 内独立且不覆盖已有历史的位置；路径 SHALL 使用平台 path API，macOS、Linux、Windows 遵循相同完整性规则。

保存、校验或轮换不完整时 SHALL 停止，不启动新 Review、不伪造通过记录。再次执行 SHALL 检查已有备份与活动文件；一致的保存可用于继续完成该次轮换，不得覆盖已有历史或把新产生的活动记录误当作旧记录移走。内容冲突或无法确认轮换边界时 SHALL 保留全部现有文件并报告具体证据缺口，不猜测哪份应被删除。

轮换后的旧质量快照、日志、失败原因及重启原因 SHALL 保持可读，并在后续优化失败回滚及最终原样归档时完整保留。新活动日志与历史日志 SHALL 分开保存，不把旧 PASS 或旧台账复制进新活动记录。

- **保存失败**：第二个文件保存或内容校验失败时，旧原件与已保存副本仍可用，不进入 fresh Review。
- **轮换中断**：两个原始文件均已完整保存并校验，活动快照已移走而日志尚在；重入时检查字节和关联信息后完成剩余轮换，不覆盖历史，再启动新 Review。
- **备份冲突**：已有历史位置包含不同内容时，不覆盖或删除任一版本，不继续轮换或启动验证。
- **Windows 路径**：Change 位于带空格的 Windows 路径时，以平台 path API 定位两份记录和历史目录；原始文件字节与 POSIX 平台相同地受保护。

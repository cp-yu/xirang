---
entity: element-declaration
identity: quality-freshness
kind: element
parent: quality
title: Quality Freshness
definition: Quality Freshness 是质量证据适用性与完成状态的判定能力，独立关联实际验证时状态、当前代码文件集合和内容、委托交付及最终结论。它检测新增、删除、过期、失败和不完整证据，区分基线审查与优化后的验证，不以记录保存时状态代替执行状态；不判断自然语言证据是否充分或优化价值。
---

## Specification

### Section: tasksFileHash 计算

系统 SHALL 提供 `computeTasksFileHash(tasksPath)` 函数，计算 `tasks.md` 文件内容的 SHA-256 哈希。

- **正常计算**

  - 调用 `computeTasksFileHash` 且文件存在可读
  - 系统 SHALL 返回文件内容的 SHA-256 十六进制字符串

- **文件不存在**

  - 调用 `computeTasksFileHash` 且文件不存在
  - 系统 SHALL 返回 `null`

### Section: evidenceFingerprint 计算

系统 SHALL 基于规范化项目相对 POSIX 路径及内容哈希关联验证时状态，文件集合变化也参与比较，包括新增、删除和移动；不能仅重读旧 evidenceFiles 列表而漏掉新代码。质量记录本身不参与代码指纹。mtime、仅 Git HEAD 改变不使相同内容过期；路径通过平台 path API 规范化。

- **新建/删除代码文件**：测试后新增相关实现或删除已有文件，状态差异 SHALL 被发现，即使原 evidenceFiles 未列出新路径。
- **Windows 路径**：同一逻辑路径使用反斜杠与正斜杠时得到一致关联；缺失文件不是静默跳过的有效证据。

### Section: 记录匹配与状态判定

系统 SHALL 分别判断基线 Review 的被审查状态、各测试/Review 的执行状态、当前委托交付和最终验证结论的适用性，不以最新一次通过 Review 的指纹作为唯一活动路由。测试 SHALL 在实际运行时捕获状态与真实结果，记录开始/结束状态不一致或非零退出时保留其事实，不当作成功当前验证。稍后报告只引用原证据，不将旧通过结果重新绑定当前代码。

- **测试 S1、报告 S2**：在 S1 测试通过，代码改为 S2 后提交报告；证据仍指向 S1，不能据此声称 S2 已通过，需要主 Agent 重新判断受影响验证。
- **验证适用性重判**：后续改动 SHALL 触发差异检查和主 Agent 对受影响验证的判断，不自动要求重跑未受影响的全部测试。主 Agent 可基于实际差异、验证范围和依赖影响，明确记录原成功测试或 scoped Review 对当前状态仍适用的范围与理由；该判断单独关联当前状态，不改写原执行指纹，也不声称重新运行过测试或 Review。失败结果、缺失结果或已经确认受影响而未补齐的验证不能因此满足完成条件。
- **A 在 S1、B 在 S2**：A 在 S1 的局部测试通过，随后独立改动 B 并在 S2 测试通过；主 Agent 根据实际差异和依赖证据确认 B 不影响 A 的验证，可保留 A 的原运行证据并记录其对 S2 的适用判断，不强制重跑 A。若 B 修改 A 依赖的公共辅助函数，则须检查实际影响、补齐受影响验证后才能据此完成。
- **失败或未交付**：保留失败/过期结果与未完成进度，但它们不能满足成功测试或完整交付条件。
- **恢复历史代码**：旧匹配证据可按实际范围供判断，当前报告、放弃记录及最终结论不回退成旧版本；历史 PASS 不自动满足新声明验证。

完成条件 SHALL 关联优化前通过的独立基线 Review、已完整交付的委托或配置禁用/用户拒绝的明确跳过、实际成功测试、主 Agent 的最终验证范围与理由、所有已声明必需的增量 Review，以及当前 Change 基线缺陷修复后必需的针对性独立 Review；所需验证全部通过且证据适用当前状态、无未解决正确性或恢复问题，才可保存最终 successful checkpoint 并完成。未追加 Review 的风险判断不记为 Reviewer PASS，基线 PASS 不声称覆盖优化后代码。

### Section: Archive Compatibility 判定

Archive compatibility SHALL 消费与 seal 相同的完整完成条件。完成条件 SHALL 关联优化前通过的独立基线 Review、已完整交付的委托或配置禁用/用户拒绝的明确跳过、实际成功测试、主 Agent 的最终验证范围与理由、所有已声明必需的增量 Review，以及当前 Change 基线缺陷修复后必需的针对性独立 Review；所需验证全部通过且证据适用当前状态、无未解决正确性或恢复问题，才可保存最终 successful checkpoint 并完成。未追加 Review 的风险判断不记为 Reviewer PASS，基线 PASS 不声称覆盖优化后代码。 配置禁用或用户拒绝的明确跳过可以满足优化处置要求，不伪造交付或免除基线 Review。不支持的旧质量格式、旧命令输入和退役优化配置 SHALL 给出明确诊断，不静默解释、自动迁移或启用兼容执行路径。旧活动记录不自动转换为新完成结论；既有代码、commits/checkpoints、归档和历史记录 SHALL 保留，由主 Agent 与用户判断旧 Change 如何继续。

### Section: gate 失败输出格式

系统 SHALL 提供 `formatQualityGateFailure` 函数，生成结构化的 quality gate 失败消息：指纹不匹配时列出变更文件，archive 不兼容时包含 blockReason，末尾提供建议操作段落；非阻塞 Git HEAD 数据不作为失败段落输出。

- **archive 上下文的建议操作**

  - `formatQualityGateFailure` 用于 archive 命令的 gate 失败
  - 建议操作中 SHALL 使用 `xirang archive` 而非 `xirang sync`

- **指纹无变化时省略指纹段**

  - 没有指纹不匹配的文件
  - 输出 SHALL 省略指纹部分

- **全部信息输出**

  - 调用 `formatQualityGateFailure` 且 fingerprint 不匹配
  - `archiveCompatibility` 不兼容
  - 输出 SHALL 包含指纹不匹配的文件列表
  - SHALL 包含不兼容的 blockReason
  - 末尾 SHALL 包含建议操作段落
  - 输出 SHALL NOT 包含 Git HEAD failure section

### Section: sync 后 evidence fingerprint 增量刷新

Sync 成功后 SHALL 只关联实际同步输出对应的确定性模型转换，保留测试与 Review 原始执行状态及结果；不得把执行时指纹改写为同步后代码状态。模型同步关联不能覆盖同时发生的实现修改或未列出的外部变化，后者 SHALL 使受影响最终证据不可复用。无记录或无重叠输出时不写无关记录；不支持格式给出明确诊断而不转换。

- **同步后外部修改**：Sync 记录实际模型输出后外部修改同一路径，或新增/删除实现文件，状态比较显示差异并要求重新判断受影响验证。

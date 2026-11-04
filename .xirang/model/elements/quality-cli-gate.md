---
entity: element-declaration
identity: quality-cli-gate
kind: element
parent: quality
title: Quality CLI Gate
definition: Quality CLI Gate 是质量操作的确定性接口与完成门禁，独立承载独立 Review、优化委托/交付、真实验证证据、主 Agent 结论、status 和 seal 的关联校验及诊断。它管理身份、版本、状态和已声明条件，不承担优化排序、分组、继续投入或自然语言充分性判断；持久化细节属于 Quality Writeback。
---

## Specification

### Section: Review 记录入口

系统 SHALL 提供独立 Review 的记录入口，关联实际审查范围和被审查状态，支持基线 Change 级、优化累计增量和基线缺陷修复 Review。校验结果、issues、证据和关联版本；后写记录不重绑更晚代码。失败结论亦保存为实际证据，不能满足通过条件。主 Agent 无需追加 Review 的判断不得通过此入口记为 PASS。

### Section: Optimization 记录入口

系统 SHALL 提供优化委托起点、进度及交付的记录操作，保留范围、约束、起始状态、基线 Review 与恢复位置，关联实际报告与测试证据，由 CLI 生成委托身份、时间、版本及指纹。交付包含实际结果、验证、未完成/遗留及后续建议四类信息，允许自然语言灵活表达，不要求逐方向表单。过期版本或无效关联 SHALL 拒绝写入且保留原记录；CLI 不维护方向排序、选择、依赖队列、收益分级、重试或数量限制。

### Section: Seal 校验

quality seal SHALL 以同一声明完成条件检查当前结果，通过时输出 seal hash，否则逐项报告缺口。完成条件 SHALL 关联优化前通过的独立基线 Review、已完整交付的委托或配置禁用/用户拒绝的明确跳过、实际成功测试、主 Agent 的最终验证范围与理由、所有已声明必需的增量 Review，以及当前 Change 基线缺陷修复后必需的针对性独立 Review；所需验证全部通过且证据适用当前状态、无未解决正确性或恢复问题，才可保存最终 successful checkpoint 并完成。未追加 Review 的风险判断不记为 Reviewer PASS，基线 PASS 不声称覆盖优化后代码。 后续代码变化 SHALL 重新判断受影响验证，旧 seal 不证明新状态。

### Section: Status 输出语义

quality status SHALL 只读报告基线 Review、委托/交付、验证结果及其当前适用性、主 Agent 声明要求与结论、checkpoint 和未满足完成条件，给出合法后续操作。HEAD 差异单独作为 informational；缺失基线、未交付、过期测试、需 Review 和恢复不确定分别诊断，不把优化后代码变化一律判为必须整条 Review 重跑。status/help SHALL 不创建或修改文件。

### Section: 统一输出与诊断结构

所有 `xirang quality` 子命令 SHALL 使用统一输出形状。成功返回 `ok: true` 与 `allowedNextOperations`；入口或状态条件不满足返回 `ok: false`、稳定 `code`、`diagnostics` 与 `allowedNextOperations`，并以 exit 1 退出；输入形状非法返回 `ok: false`、`code: INVALID_INPUT` 与 `diagnostics`，并以 exit 2 退出。`diagnostics` 条目 SHALL 包含字段路径 `path`、期待值 `expected`、当前值或状态 `actual` 以及修正方式 `fix`。

- **字段非法时给出可操作诊断**

  - 输入中某个字段缺失或取值非法
  - `diagnostics` SHALL 包含该字段的 `path`、`expected` 与 `fix`
  - 以 exit 2 退出

- **入口条件不满足时给出后续操作**

  - 入口条件不满足
  - 输出 SHALL 包含稳定 `code` 与 `allowedNextOperations`
  - 以 exit 1 退出

### Section: 协议说明的单一来源与投影

系统 SHALL 从实现使用的同一批协议常量和字段定义生成 help 及 Apply/Archive references，覆盖入口、关联版本、必要信息、执行时证据与完成条件、最小合法示例和退出语义，不维护并行手写 schema 或退役方向指令。CLI 校验结构和已声明条件，不评分自然语言或选择下一项工作。

### Section: 记录实际测试证据

CLI SHALL 在测试执行时关联代码状态和实际结果，记录非零退出、运行中状态变化及证据不新鲜的事实，不能用报告时状态接受旧通过结果。测试输出和引用须可供主 Agent 检查。过期/失败记录可保存，但不能满足最终成功条件。

### Section: 记录主 Agent 最终结论

CLI SHALL 接受主 Agent 对累计交付的最终验证范围与理由，区分所需测试、增量 Review、基线缺陷修复 Review 和无需追加 Review 的判断。记录最终结论时检查必需结果和当前状态关联；主 Agent 对未受影响的原成功证据可明确记录适用范围、所依据实际差异与理由，单独关联当前状态并保留原运行状态，不把它记为新测试或 Reviewer PASS。失败、缺失或已确认受影响却未补齐的验证不得通过此关联绕过。允许多委托共享最终验证，不强制每次交付新 Review 或全量测试。CLI 不判断范围选择或自然语言依据是否充分。

### Section: 拒绝退役协议

不支持的旧质量格式、旧命令输入和退役优化配置 SHALL 给出明确诊断，不静默解释、自动迁移或启用兼容执行路径。旧活动记录不自动转换为新完成结论；既有代码、commits/checkpoints、归档和历史记录 SHALL 保留，由主 Agent 与用户判断旧 Change 如何继续。

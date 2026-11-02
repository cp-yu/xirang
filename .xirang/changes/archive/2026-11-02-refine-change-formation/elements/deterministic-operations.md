---
entity: element-declaration
identity: deterministic-operations
kind: element
parent: cli
title: Deterministic Operations
definition: Deterministic Operations 在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
---

## MODIFIED Sections

### Section: 管理统一确认记录生命周期

xirang record SHALL 统一管理非空中间设计记录，Build 与 Change 各用独立实例，保留稳定 explorationId、完整读取、局部更新与记录级 sourceVersion。条目显式区分 nature（normative/informative）与 decision（pending/accepted/excluded），结构部分只承载已确认目标。使用 schemaVersion: 4，旧格式不支持、不自动迁移、不默认确认，也不提供 framing 兼容别名。

show 可一次选择一条或多条 identity，返回所选完整内容及状态、记录身份和当前 sourceVersion，不附无关条目或完整基准；无选择时仍完整读取。update 保留未提及内容、结构字段合并及版本过期拒绝机制，返回差异、状态概况与新版本，不回传整份记录。CLI 校验格式与确定性关系，不代用户确认设计。

### Section: 确定性交接确认来源

record coverage SHALL 按性质、决策状态及适用性记录检查：需落实的 accepted normative 内容须有逐项原子细节、真实目标位置及适用摘录；pending 问题影响当前目标时阻塞，不影响须有理由；excluded 与 informative 不强制生成目标承诺。非当前目标的规范内容须声明不适用并说明理由。CLI 校验结果类型、完整性、位置与摘录，不判断自然语言语义覆盖或授权。

record consume SHALL 显式选择 named Change 或 active Candidate，核对源版本，要求覆盖结果绑定当前 sourceVersion 与目标指纹，并逐字段比对已确认结构目标。先保存精确 record-source.md，再完成适用校验，最后删除活动记录；任一前置失败保留来源与既有目标。同字节快照可重验恢复，冲突快照停止，不猜测目标。来源与覆盖只作为形成历史，不进入后续语义计算。

## REMOVED Requirements

### Requirement: Propose 必须检测 explore 上下文

**Reason**: 该行为与目标 semantic readiness、Design Summary reuse 合同重复，统一由 `propose-workflow` 定义。

**Migration**: 使用 `propose-workflow` 中的 Propose semantic readiness 与 Design Summary scenarios。

### Requirement: 判断输入详细程度

**Reason**: 字符数和技术关键词评分对窄修改、重构、prompt 与文档变更存在领域偏置。

**Migration**: 使用 problem、impact scope、approach、verification method 与 unresolved source decisions 判断 readiness。

### Requirement: 检测多子系统

**Reason**: 多 subsystem 只是 impact scope 证据，不应由独立关键词规则自动形成 routing gate。

**Migration**: 将 subsystem scope 纳入 semantic readiness；只有 scope 不能形成一致 change 时才报告缺口。

### Requirement: 从 Design Summary 提取信息

**Reason**: Design Summary 路由与 artifact authoring 统一归 `propose-workflow` 所有。

**Migration**: 使用 `propose-workflow` 的 Design Summary reuse 与 definition-first authoring 合同。

### Requirement: 生成粗粒度 tasks.md

**Reason**: tasks 结构由 artifact definition/template 与 `propose-workflow` authoring 合同定义，不属于独立 routing Spec。

**Migration**: 使用 resolved tasks definition 和 coarse task template。

### Requirement: 智能路由决策透明

**Reason**: 输入长度、detail score 与写入 proposal comment 的行为被删除。

**Migration**: readiness、缺失项与 override 结果只在对话中报告。

### Requirement: 向后兼容

**Reason**: `propose.smartRouting` 与 `propose.requireExplore` 被批准为 breaking removal，不再提供旧 routing 行为开关。

**Migration**: 旧配置静默忽略；Propose 统一执行 semantic readiness。

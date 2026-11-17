## Why

现有实现纪律容易把避免抽象当作目标，Opt 又可由实现者自行跳过，缺少独立的维护质量发现；优化改动也没有必须独立审查的完整流程门禁。项目阶段指导只能混入全局背景或制品规则，作用范围不够明确。

## What Changes

- 以职责、控制流清晰和修改局部性指导 Apply 的抽象取舍。
- 基线 Review 后默认独立只读 Opt 检查，按明确授权组实施，允许新的干净上下文检查与有依据停止。
- 协调者提交实际保留结果并记录真实交付，累计优化改动必须独立 Review；CLI 联合写入序号和 Git 提交关联控制 Seal。
- 添加六阶段独立 stageRules，保持共同背景、阶段指导与制品规则的作用域分离。
- **BREAKING**：Quality 采用 v5，明确拒绝 v4 及更旧记录，不迁移或恢复历史顺序。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `agent`：负责优化范围与最终验证。
- `agent-prompt-guidance`：共享 quality gate 指引片段；Quality 模板 CLI 错误恢复指南。
- `agent-workbench-projection`：Business Logic；Key Acceptance Cases。
- `apply`：实现取舍与维护质量；集成受托优化执行。
- `apply-quality-integration`：以委托交付推进优化；主 agent 和 subagent 角色分工；Review 记录先写回再持久化；共享恢复 reference 编排重验。
- `apply-role`：交付状态与证据。
- `apply-workflow`：Apply 模板 SHALL 处理中间验证状态；Apply 完成全部 Tasks 后统一进入 Change 级 Review。
- `archive-quality-gate`：归档前必须具备新鲜的完整验证记录。
- `change-implementation`：实现并独立验证目标状态；不在本阶段更新正式模型。
- `config-command`：Business Logic；Key Acceptance Cases。
- `internal-agents`：输出结构化结论；按角色限定操作能力；独立读取判断依据。
- `optimization`：无需继续优化时完成；在独立审查基线后开始；委托内执行与局部验证；优先消除不必要复杂度；读取完整优化依据。
- `optimization-execution`：最优性检验执行；主 Agent 决定最终验证；Git 管理优化代码状态与恢复。
- `optimizer`：交付结构化 Optimization 结论；在委托范围内修改并测试；保存进展并可靠恢复。
- `optimizer-findings`：交付实际结果与验证建议；交付不代替最终判断。
- `optimizer-protocol`：Optimizer 角色与硬约束；Optimizer 输入合约；执行并交付实际结果；按必要边界保存并恢复；先补测试再修改实现；依据影响追踪执行范围；保留失败依据并停止无进展尝试。
- `optimizer-smells`：优化候选信号。
- `project-config-loading`：Business Logic；Edge Cases and Exception Handling；Key Acceptance Cases。
- `project-config-management`：Business Logic；Key Acceptance Cases。
- `project-tooling-configuration`：Business Logic；Key Acceptance Cases。
- `quality`：仅以最新成功状态完成；按阶段与证据缺口推进；收口后确认可进入 Change Closure；单一 Quality Record 承载意见与 Seal。
- `quality-aware-instructions`：联合目标与 Quality 判定推进状态。
- `quality-cli-gate`：Review 记录入口；Optimization 记录入口；Seal 校验；Status 输出语义；拒绝退役协议；统一输出与诊断结构。
- `quality-execution-model`：Quality 模板选择遵循执行模型。
- `quality-orchestration`：Git recovery 与 Seal 顺序；Coordinator 角色声明。
- `quality-writeback`：状态快照持久化；append-only 历史日志。
- `review`：修改后重新 Review；在每次 Apply 修改后执行。
- `skill-generation`：Business Logic；Key Acceptance Cases。
- `subagent-self-read`：Subagent 工具权限定义；Subagent 测试策略（L1）。

### Architecture Source

#### Added Elements

None

#### Modified Elements

- `apply-quality-integration`：完整 Definition 对齐检查/实施角色、提交责任或强制累计审查边界；保持 identity、kind 与 parent。
- `change-implementation`：完整 Definition 对齐检查/实施角色、提交责任或强制累计审查边界；保持 identity、kind 与 parent。
- `internal-agents`：完整 Definition 对齐检查/实施角色、提交责任或强制累计审查边界；保持 identity、kind 与 parent。
- `optimization`：完整 Definition 对齐检查/实施角色、提交责任或强制累计审查边界；保持 identity、kind 与 parent。
- `optimization-execution`：完整 Definition 对齐检查/实施角色、提交责任或强制累计审查边界；保持 identity、kind 与 parent。
- `optimizer`：完整 Definition 对齐检查/实施角色、提交责任或强制累计审查边界；保持 identity、kind 与 parent。
- `optimizer-protocol`：完整 Definition 对齐检查/实施角色、提交责任或强制累计审查边界；保持 identity、kind 与 parent。
- `optimizer-smells`：完整 Definition 对齐检查/实施角色、提交责任或强制累计审查边界；保持 identity、kind 与 parent。
- `quality`：完整 Definition 对齐检查/实施角色、提交责任或强制累计审查边界；保持 identity、kind 与 parent。
- `quality-cli-gate`：完整 Definition 对齐检查/实施角色、提交责任或强制累计审查边界；保持 identity、kind 与 parent。
- `quality-execution-model`：完整 Definition 对齐检查/实施角色、提交责任或强制累计审查边界；保持 identity、kind 与 parent。
- `quality-orchestration`：完整 Definition 对齐检查/实施角色、提交责任或强制累计审查边界；保持 identity、kind 与 parent。
- `subagent-self-read`：完整 Definition 对齐检查/实施角色、提交责任或强制累计审查边界；保持 identity、kind 与 parent。

#### Removed Elements

None

#### Architecture Relations

None

## Impact

涉及 Apply/Optimizer 与共享 Quality/恢复提示、Quality schema/engine/CLI/status、项目配置解析/字段说明/投影/检查、common 与六阶段生成面及对应验证。正式模型层级、关系、Kinds 与 Views 无变更；相关父级承诺与角色 Definition 同步更新。无新增运行时依赖，无固件实现工作；受管生成使用现有显式登记和跨平台路径机制。

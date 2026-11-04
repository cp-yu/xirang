## Why

现有 Optimization 将候选排序、逐方向实现、每项独立 Review、提交与重试额度绑定为固定循环，增加交接和重复读取成本。已确认设计将执行判断交给受托的 Optimizer，并以真实证据和主 Agent 的最终风险判断保证收尾质量。

## What Changes

- Optimizer 在委托范围内自主发现、分组、合并、修改与局部测试；主 Agent 决定范围、后续委托与最终验证。
- 保留优化前独立 Review、可靠恢复、必要测试与当前状态证据；优化后按风险追加全量测试或独立 Review，修复基线遗漏的当前 Change 缺陷必须针对性独立 Review。
- 以委托与交付组织记录，支持同一委托中断续跑、局部修正或撤销，以及失败优化的及时记录和用户告知。
- **BREAKING**：移除逐方向排序、选择、状态迁移、数量及重试限制和固定收益等级；诊断旧输入、旧质量格式与退役配置，不自动迁移或增加兼容执行路径，保留既有代码与历史。
- 本次只调整 Optimization 及必要的角色、权限、配置、Apply、Archive/Sync 集成；普通 Apply 的任务实现与其他阶段不扩展改造。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `change-implementation`: 基线独立评估与优化后风险验证的阶段保证。
- `quality`: 活动进入、恢复、证据及完整收尾条件。
- `optimization`: 受托执行、价值判断、测试与按需继续。
- `optimizer`: 可写执行职责、证据交付与边界。
- `internal-agents`: 角色操作权限及交付区分。
- `agent`: 优化委托、后续投入与最终验证责任。
- `apply`: 优化执行归属及修正分流。
- `apply-role`: 主 Agent 编排与受托优化执行分工。
- `review`: 基线、按风险增量及缺陷修复 Review 的适用范围。
- `reviewer`: 独立结论明确实际评估范围。
- `reviewer-protocol`: scoped Review 输入、检查与输出，以及优化文件范围归属。
- `reviewer-cleanliness`: 优化文件归属与清理缺陷的独立审查边界。
- `checkpoint`: 可恢复基线、按需中间状态及最终成功状态。
- `optimization-execution`: 委托执行、持久化时点、恢复和失败处理。
- `optimizer-protocol`: 独立读取、证据化范围、先补测试、可写执行及灵活交付。
- `optimizer-findings`: 实际结果与证据报告、放弃记录及后续建议。
- `quality-execution-model`: 主 Agent 判断与独立 Reviewer 的责任边界。
- `quality-orchestration`: 委托、等待、恢复与验证编排。
- `quality-writeback`: 记录关联、版本、必要保存边界及历史保护。
- `quality-freshness`: 测试时状态、新增/删除文件及完成证据一致性。
- `quality-cli-gate`: 委托、交付、验证证据和完成门禁的确定性校验。
- `apply-quality-integration`: 优化协议、共享恢复及输出集成。
- `quality-aware-instructions`: 基于具体缺口的 instructions 路由。
- `archive-quality-gate`: 当前完整验证结果与共享恢复门禁。
- `change-archive`: 归档验证路由及质量结果披露。
- `change-sync`: 同一完成门禁与不篡改执行时证据的同步关联。
- `change-closure`: 有效基线、优化交付及最终验证的入口保证。
- `agent-prompt-guidance`: 共享协议投影与可选失败诊断 reference。
- `subagent-self-read`: Optimizer 可写与必需局部测试，Reviewer 保持只读。
- `internal-subagent-generation`: 工具原生可写 Optimizer 权限。
- `apply-workflow`: 优化修改不无条件重启整条 Change Review。
- `project-config-loading`: 项目优化默认值和退役配置诊断。
- `global-config`: 全局优化默认值与旧配置诊断。
- `project-config-management`: 优化配置退役的共同边界。

### Architecture Source

#### Added Elements

None

#### Modified Elements

- `quality`: 以基线独立 Review 和最终风险验证组织质量完成。
- `optimization`: 从只读方向评估改为委托内优化执行活动。
- `optimizer`: 从只读建议者改为受托执行者。
- `internal-agents`: 覆盖独立审查、受托优化执行与实验结果。
- `apply`: 优化由 Opt 受托实施，保留普通实现责任。
- `apply-role`: 编排优化而非逐方向亲自编码。
- `review`: 明确基线、增量与基线缺陷修复的独立评估边界。
- `reviewer`: 结论限于实际评估范围，不拥有最终优化决策。
- `checkpoint`: 恢复状态与最终成功状态分离。
- `optimization-execution`: 委托执行及恢复协议，取消方向循环。
- `optimizer-protocol`: 可写执行、动态证据范围及交付协议。
- `optimizer-findings`: 同一 identity 承载实际优化结果与证据，不再承载方向台账。
- `quality-execution-model`: 主 Agent 可以读取代码并判断验证范围。
- `quality-orchestration`: 主 Agent 的范围、继续投入与收尾编排。
- `quality-writeback`: 保存委托、交付、验证结论与真实证据。
- `quality-freshness`: 以执行时证据与当前状态关系判断适用性。
- `quality-cli-gate`: 管理少量证据关联和声明完成条件。
- `apply-quality-integration`: Apply 对受托优化及最终风险验证的集成。
- `archive-quality-gate`: 消费完整完成证据而非当前代码 Review 单一状态。
- `change-sync`: 关联实际同步输出与原始验证证据，保留测试和 Review 的执行状态。
- `agent-prompt-guidance`: 投影委托协议及可选诊断方法。
- `subagent-self-read`: 按角色定义读取、写入及测试能力。

#### Removed Elements

None

#### Architecture Relations

None。复用既有 identities、kind、parent 与语义关系；不新增或重排层级，不修改 Kinds 或 Views。

## Impact

涉及 `src/commands/quality.ts`、`src/core/quality/`、配置加载与投影、`instructions apply`、Sync/Archive 门禁、共享 workflow/subagent 模板与生成 references，以及既有对应测试。协议采用破坏性替换；旧质量记录、已归档制品、实现 commits/checkpoints 原样保留。确认依据为记录 `20261103T031501Z-1c618bb0` 的完整版本 `725c09f70054886338cc60b22da54d8bb62499c701b3debbb5eb812e1873d5b3`；形成来源的交接由后续审查完成后执行。

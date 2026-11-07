## Context

现行 Review opinion 同时用 `reviewId` 和自由文本 `scope`，Review 委派另传目标 commit；Reviewer 生成面限制了可用工具，提示词还混入 Apply 的测试时序、Propose 的模型结构校验和已过期的输出字段。现行单一 `.quality.json` 使用 `schemaVersion: 3`；Propose 已在 Formation 阶段调用 `xirang arch validate --change` 与 `xirang validate --change`。

## Goals / Non-Goals

**Goals:**
- 让 Reviewer、主 Agent、Quality CLI 使用同一套 commit-bound `reviewKind` 协议，支持按质量维度并行审查和主 Agent 汇总。
- 让 Review 评估最终已提交状态的相关行为及证据，不代替 Propose 的结构校验或 Apply/Optimizer 的测试执行。
- 保证四种工具的 Reviewer 投影不因固定工具清单屏蔽用户提供的检索能力。

**Non-Goals:**
- 不增加 Quality CLI 的并发委派、测试输出存储、按 opinion 内容或 commit 去重，也不把 Review 的质量维度写成结构化字段。
- 不自动迁移、覆盖或删除旧 `.quality.json`；不更改 Opt 的模型与权限。

## Decisions

1. **Quality opinion 与门禁**：`reviewKind` 取 `full-change`、`incremental`、`supplemental`，`reviewId` 与 `scope` 退出 Review opinion；新 `.quality.json` 使用 v4。CLI 以 `reviewKind` 识别最新同类结果，完整 Review 的 PASS 满足 Opt 前置门禁；Seal 仍要求必需 Review 通过、没有未解决的失败。旧 v3 文件仅报不支持并保持原样。选择破坏性版本而非将任意旧 `scope` 猜测映射成新的审查类别。
2. **主 Agent 的单轮委派**：在 Reviewer 启动前提交待审实现并完成本次所需测试，交付 `changeName`、该 checkout 的绝对 `projectRoot`、`reviewKind` 及选定的非冲突质量维度；Reviewers 可并行运行，主 Agent 收齐所有意见后合并为一条 Quality opinion。任一必需维度失败或未解决时不写 PASS；Reviewer 的输入错误或执行期间 HEAD 变化不冒充实现失败。选择主 Agent 合并而非让 CLI 保存每个维度的并发记录。
3. **审查快照与文件发现**：Reviewer 从 `projectRoot` 的 HEAD 自取审查 commit，从隔离元数据读取 `baseCommit`，用二者树的累计差异定位 Change；依关系、搜索和 Section 关键词主动检查相关的未修改文件。仅已提交 HEAD 内容能支持实现结论，不从未提交工作区读取证据，也不要求逐个审查中间 commit。开始与返回前核对 HEAD；状态或委派无效时将错误交回主 Agent而不输出 opinion。三种 `reviewKind` 共用累计差异导航，实际审查对象分别是完整 Change、受托的累计 Opt 改动及其影响、漏审的原有 Change 缺陷修复及影响。
4. **Reviewer 判断边界**：对最终项目状态检查目标语义、设计、正确性与清理；保留未经目标承诺覆盖的行为改动和设计违背为 CRITICAL。缺失可信行为证据不 PASS；可测试却无对应测试或测试弱断言为 CRITICAL；已有可信证据但持久测试必要性不确定时允许 WARNING 并交主 Agent/用户判断。按可观察行为判断测试充分性，不要求 Acceptance Case 与测试一一对应。移除旧式 `evidenceFiles`、结构化 `xirangAlignment`、TODO 标记巡检、独立归因流程、层级循环复检及固定不可达代码分级。
5. **工具能力与只读责任**：Reviewer 不设置工具白名单、编辑工具否决或只读沙箱；仍在指令中禁止写项目、Change、Quality、Checkpoint 及 Git 历史。Claude/Pi 省略固定 tools 限制、OpenCode 允许 edit、Codex 使用与可写 Agent 对应的工作区沙箱；Pi Reviewer 后台运行以按运行环境加载扩展工具，Optimizer 的启动提示不变。权限放开是用户确认的取舍，不把可写工具的存在解释为修改授权。

## Risks / Trade-offs

- [旧 v3 活动 Change 无法通过 v4 门禁] → 报明确的格式不支持诊断，保留文件原样，交由用户决定如何处理该 Change，不隐式导入旧意见。
- [Reviewers 并行时 checkout 的 HEAD 变化] → Reviewer 返回前核对 HEAD；发现变化不输出 opinion，主 Agent 对新提交重新委派。
- [解除硬工具权限后误修改] → 在 Reviewer 提示词保留明确只读职责；验证各工具的生成配置与行为，主 Agent 不将被修改状态当作原审查快照。
- [历史模板/测试仍引用旧字段或旧类别] → 同步审查 Quality CLI、Apply/Archive references、Reviewer、工具投影及相关测试；Propose 的目标模型合法性检查仍由现有 CLI 完成。

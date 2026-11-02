## Context

本 Change 处理一次 Explore/Propose 会话中反复读取完整上下文造成的成本增长。当前 CLI 已能按 stable identity 查询模型，也已有 `record show --entry`，但默认回执仍可能携带完整文档、baseline、关系路径或过多 Definition；现有 workflow instructions 也把完整读取放在过宽的入口和重复场景中。

确认记录 `20261102T060213Z-5fa50c9a` 的 `sourceVersion` 为 `0f88f1e688da3c93e6f59276689482c484a8d3bf714ff856f278a271dbc00bfe`，状态为 `fresh`，6 条记录全部 accepted，作为本 Change 的设计依据。该 Change 是 breaking change，目标是降低默认输出和重复读取，不改变完整语义的内容。

## Goals / Non-Goals

**Goals:**

- 让每个 `record` 与 `arch` 命令的默认返回值只承担其当前职责所需的投影。
- 保留按 identity 显式读取完整 Declaration、Contract、record payload、snapshot 和 drift baseline 的能力。
- 让 Explore、Propose 采用阶段门禁、sourceVersion 复用、局部补读和确定性恢复。
- 让源模板、受管生成面、测试和 CLI 输出行为保持一致。

**Non-Goals:**

- 不实现 Contract 自动摘要、语义压缩或截断。
- 不修改 Pi compaction 算法。
- 不修改 Browser/Web Diff。
- 不重新设计 Semantic Model identity、hierarchy 或 Relationship 语义。
- 不重新设计已经存在的 `record show --entry` 能力。

## Decisions

1. **使用命令职责投影，不引入通用投影开关**

   `record list/create/rename` 返回索引或操作回执；`record show` 返回完整 design payload、结构和 metadata 但排除 baseline；`record status/validate/update` 返回状态、差异、诊断、结构比较、摘要和 sourceVersion。baseline 仍由内部 drift 检查使用，不进入普通 Agent 返回值。这样可以隔离持久化完整性与普通读取成本。

   不采用通用 `--summary/--full`，因为它会让调用方在每个命令上重新判断投影含义；不新增 `record index`，因为 `record list` 已承担发现职责。

2. **让 arch 发现命令默认导航化，显式查询负责完整语义**

   `arch search` 返回候选 identity、title、parent、命中字段、有限证据和计数；`arch outline` 默认只返回 hierarchy 导航；`arch impact` 默认只返回 focus、refinement context、相关 identities 和必要关系摘要。Definitions、Relationships、Metamodel 与 canonical paths 使用命令专属的显式展开选项。

   具体选项命名作为本 Change 的实现细节统一落为：outline 继续使用 `--definition-depth` 请求 Definition，并新增用于 Relationships 与 Metamodel 的显式选项；impact 新增用于 canonical paths 的显式选项。默认行为和完整信息边界由 Contract 约束，选项名称不引入通用 `--full` 语义。

   `arch query` 仍对显式 identities 返回完整 Declaration，`--contract` 才返回完整 Contract；`arch snapshot` 仍提供完整 Declaration、Relationships 和 Metamodel 的无 Contract 全局结构诊断，不作为普通探索入口。

3. **按渐进链路读取 Semantic Model**

   普通 Explore/Propose 使用 `arch search --limit`、`arch outline` 或 `arch impact`、`arch query`、`arch query --contract` 逐层展开。不得自动 query impact 返回的全部 identity；只有整体认知丢失、上下文压缩、长会话切换或需要全局结构诊断时使用 `arch snapshot`。

4. **按阶段门禁复用 record 上下文**

   首次进入阶段运行 `xirang list --json`，发现记录后在阶段入口建立完整基础。普通确认复用最近成功操作的 sourceVersion、summary 和已知 identity；完整 `record show/status/validate` 只在阶段入口、恢复入口和收尾门禁执行；局部问题使用 `record show --entry`，更新使用最近有效 sourceVersion，并检查 update 的 diff 与 summary。

   上下文压缩、会话切换、版本冲突、相关模型 drift 或当前状态未知时，必须重新建立完整依据。减少读取不能授权 Agent 从旧摘要、路径或残余对话猜测缺失语义。

5. **把输出边界作为行为验证对象**

   持久化测试验证默认回执、baseline 隔离、显式展开、版本失败和完整语义读取；模板测试只锁定协议 tokens、读取路由、fail-closed 门禁和禁止操作，不锁定普通说明文字。一次性验证测量代表性输出体积、工具截断风险、构建、类型和完整测试。

## Risks / Trade-offs

- [Risk] breaking projection 可能影响依赖旧 JSON 字段的 Agent 或脚本。→ 在 JSON contract 测试中固定新的 envelope 和显式展开行为，并在任务中检查所有仓内调用方。
- [Risk] 默认 outline/impact 变轻后，调用方可能把 identity-only 结果误当作完整语义。→ 在 workflow instructions 中固定 search → outline/impact → query → query --contract 的读取链，并保留缺失语义时 fail-closed 规则。
- [Risk] workflow source 与 generated surfaces 可能不同步。→ 将源模板、生成 skills/references 和 parity 检查放在同一实现闭环，并运行项目既有生成/同步验证。
- [Risk] 输出投影调整可能误触及 baseline drift 语义。→ baseline 只改变普通返回投影，继续持久化并由 drift/consume 路径读取，增加针对 drift 与 stale sourceVersion 的行为检查。
- [Risk] 路径和 JSON 输出存在差异。→ 使用 Node.js path APIs 与 project-relative POSIX JSON 路径，并验证代表性 CLI JSON 输出。

6. **本 Change 不要求 Windows runner 验证**

   本 Change 的一次性回归范围为 build、完整测试、lint/typecheck 与代表性 CLI 投影验证。Windows runner 执行不作为本 Change 的完成门禁；该范围调整不删除或修改仓库已有的 Windows CI 工作流。

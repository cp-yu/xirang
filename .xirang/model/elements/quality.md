---
entity: element-declaration
identity: quality
kind: element
parent: change-implementation
title: Quality
definition: Quality 是 Change Implementation 中以 commit 绑定的 Review、Opt 交付与 Seal 声明协调实现判断并控制进入 Closure 的阶段。它承载独立基线审查、默认独立机会检查、授权改进及保留改动的累计独立审查；主 Agent 负责投入和声明，Reviewer 独立判断，CLI 校验意见顺序与提交关联。它不负责代码恢复或工作区新鲜度判定。
---

## Specification

### Section: Review 通过后建立 Baseline

Quality SHALL 在 Opt 或 Seal 前要求至少一条通过的 `full-change` Review。Review opinion 绑定已提交且在审查期间 HEAD 不变的 Git commit；完整 Review 失败后的修正形成不同 Git commit 并重新审查。通过的完整 Review 是后续 Opt 的基线，不证明 Opt 以后的改动经过独立审查；Quality 不为 commit 保存代码恢复状态。

### Section: 成功优化推进 Checkpoint

最终状态完成主 Agent 判断所需的全部验证且证据仍适用时，Quality SHALL 保存最终 successful checkpoint。优化中的中间状态按恢复需要保存；局部测试通过不自动构成最终成功，也不要求每个方向 commit 或 Review。

### Section: 失败优化恢复 Checkpoint

优化引入的问题 SHALL 依据实际证据局部修正或撤销并验证，保留其他可靠优化，不因测试或 Review 失败固定整批回滚。合并后无法直接定位时 MAY 拆分、二分或采用更合适方法；各部分单测通过但组合失败时 SHALL 检查组合影响。无法确认局部恢复可靠时 SHALL 恢复到可确认基线；仍无法确认时停止并交回主 Agent，不以未解决状态完成。

### Section: 保留失败方向与优化历史

Quality SHALL 在唯一质量 JSON 中保留 Review opinion 历史及 Opt opinions，包含已放弃方向、原因和处理结果，以供主 Agent 后续判断并避免重复尝试。该记录保存意见，不保存代码快照、测试输出或恢复事件；Git 承载代码修改和恢复历史。

### Section: 仅以最新成功状态完成

优化前实现 SHALL 通过独立 full-change Review。Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。

协调者根据累计改动、行为保持依据与覆盖确定适用测试和范围并说明理由，Opt 自测不替代独立 Review；已确认的当前 Change 基线缺陷须修复并通过针对问题及影响的 supplemental Review。只有所需验证全部通过、证据适用、交付完整且无未解决正确性或恢复问题，才可保存最终 successful checkpoint 并完成。

### Section: 收口后确认可进入 Change Closure

Quality SHALL 仅在基线 Review 与累计保留改动的独立 Review 均已通过、Seal 前已有真实 Opt 处置、且主 Agent 已记录有效 Seal 声明时认定 Quality 完成并取得默认交付归档的质量资格；quick 的豁免与放弃留档不表示 Quality 完成。已执行 Opt 的处置 SHALL 包含 opinion 及 `baseCommit`、`resultCommit`；未执行 Opt 的处置 SHALL 包含简短理由。Seal 声明 SHALL 绑定一个 Git commit，并由主 Agent 声明该版本可运行且预期通过适用测试。CLI 不执行测试、不保存测试输出、不要求工作区 clean、不要求 Seal commit 等于 HEAD 或工作区内容，也不要求在 Seal 或 Archive 前单独提交 Quality JSON。Archive 的 Quality 门禁只确认 Seal commit 对象仍存在。

存在变更 Opt 时，CLI SHALL 要求其后的 full-change 或 incremental PASS，受审 commit 等于最后一次变更 Opt 的结果或为其 Git 后继，Seal 绑定该受审 commit。只读交付不能抹去此前义务，其他类别 PASS 不能掩盖未解决 FAIL；supplemental 不自动代表累计优化审查。

### Section: 活动 Change 的显式重新验证

用户明确要求活动 Change 从头重新验证时，Quality SHALL 在原流程已停止、无旧执行者或待处理写入与恢复后，在同一 Change 保留原代码、commits/checkpoints、旧记录和失败原因，并建立新的验证依据。新基线 SHALL 由 fresh-context Reviewer 重新审查，旧 PASS 只作历史参考；不修改历史冒充新结果。普通修正、局部撤销和中断续跑 SHALL 继续原委托，不自动变为从头重验。

- **同代码重审**：用户因旧证据不可信要求从头 Review/Optimization，即使代码相同也取得新的独立 Review，保留旧历史。
- **旧执行者未结束**：Reviewer 或 Opt 仍在运行时，不开启并行重验或更换写入者。
- **旧格式记录**：不支持的旧记录给出诊断并原样保留，如何继续由主 Agent 与用户判断，不自动转换成新完成结论。

### Section: 按阶段与证据缺口推进

通过基线 full-change Review 后，协调 Agent SHALL 默认委托干净上下文的 Optimizer 执行一次只读 inspection，再依据证据、项目目标、约束、预期收益、成本和风险授权一组相关改进或说明停止理由；无需先找到具体改法才委托检查。每批 implementation 交付后，协调者核对实际改动与验证证据，决定继续当前 Opt、请求新的干净上下文 inspection 或停止；后续实施保持明确授权范围，以实际进展和预期价值判断继续，不强制每轮重启或固定轮数。

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。

Review findings、WARNING 和 Required Corrections SHALL 由协调者处理，Quality 不自动修改 tasks.md。已确认的基线缺陷修复必须 supplemental Review；没有有效 Seal 不得执行默认交付归档；quick 与放弃不代表 Quality 完成。

### Section: 单一 Quality Record 承载意见与 Seal

Quality SHALL 仅将 Review opinions、Opt opinions 或明确不做 Opt 的处置及当前 Seal 声明持久化在每个 Change 的一个 Git-tracked JSON 文档中。代码状态、执行过程、测试输出与恢复状态不复制进该文档；CLI 对更新执行原子写入与 revision compare-and-swap。

Review 与 Opt opinions SHALL 保存 CLI 分配的写入 revision，复用同一个 CAS revision，不新增时间戳或第二套计数器。schemaVersion 为 5；旧版本明确拒绝并保持原样，不迁移、不补造历史顺序。

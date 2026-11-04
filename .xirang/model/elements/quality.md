---
entity: element-declaration
identity: quality
kind: element
parent: change-implementation
title: Quality
definition: Quality 是 Change Implementation 中以 commit 绑定的 Review 意见、可选 Opt 意见与 Seal 声明协调项目实现判断并控制进入 Change Closure 的阶段。它确保每个 Change 具有通过的独立基线 Review、明确的 Opt 处置及主 Agent 对 Seal commit 的声明；Review 负责独立判断，Optimization 负责保持目标语义的改进，CLI 负责意见关联和记录门禁，不负责代码恢复或当前工作区新鲜度判定。
---

## Specification

### Section: Review 通过后建立 Baseline

Quality SHALL 要求每个 Change 在可 Seal 前至少具有一条通过的独立基线 Review。Review opinion SHALL 绑定已提交且在审查期间保持不变的 Git commit；失败 Review 的修正 SHALL 形成不同的 Git commit，并在该 commit 上重新 Review，直至基线 Review 通过。通过的基线 Review 是 Opt 与 Seal 的必要前置条件；Quality 不为该 commit 创建或保存代码恢复状态。

### Section: 成功优化推进 Checkpoint

最终状态完成主 Agent 判断所需的全部验证且证据仍适用时，Quality SHALL 保存最终 successful checkpoint。优化中的中间状态按恢复需要保存；局部测试通过不自动构成最终成功，也不要求每个方向 commit 或 Review。

### Section: 失败优化恢复 Checkpoint

优化引入的问题 SHALL 依据实际证据局部修正或撤销并验证，保留其他可靠优化，不因测试或 Review 失败固定整批回滚。合并后无法直接定位时 MAY 拆分、二分或采用更合适方法；各部分单测通过但组合失败时 SHALL 检查组合影响。无法确认局部恢复可靠时 SHALL 恢复到可确认基线；仍无法确认时停止并交回主 Agent，不以未解决状态完成。

### Section: 保留失败方向与优化历史

Quality SHALL 在唯一质量 JSON 中保留 Review opinion 历史及 Opt opinions，包含已放弃方向、原因和处理结果，以供主 Agent 后续判断并避免重复尝试。该记录保存意见，不保存代码快照、测试输出或恢复事件；Git 承载代码修改和恢复历史。

### Section: 仅以最新成功状态完成

优化前实现 SHALL 先通过独立 Review。主 Agent SHALL 根据累计优化改动、行为保持依据与测试覆盖确定最终验证范围并简短说明理由；测试必需，全量测试和优化后增量 Review 按实际风险决定，不增加固定风险审批。已确认的当前 Change 基线正确性缺陷 SHALL 修复并通过针对问题及其影响的独立 Review。只有所需验证全部完成且通过、证据对应当前状态、交付完整且无未解决的正确性或恢复问题时，才可保存最终 successful checkpoint 并完成。基线 Review 不证明后续改动经过独立审查；无需追加 Review 的判断不记为 Reviewer PASS。后续代码变化 SHALL 重新判断受影响的验证。

### Section: 收口后确认可进入 Change Closure

Quality SHALL 仅在基线 Review 已通过、Seal 前已有明确 Opt 处置、且主 Agent 已记录有效 Seal 声明时允许 Change 进入 Change Closure。已执行 Opt 的处置 SHALL 包含 opinion 及 `baseCommit`、`resultCommit`；未执行 Opt 的处置 SHALL 包含简短理由。Seal 声明 SHALL 绑定一个 Git commit，并由主 Agent 声明该版本可运行且预期通过适用测试。CLI 不执行测试、不保存测试输出、不要求工作区 clean、不要求 Seal commit 等于 HEAD 或工作区内容，也不要求在 Seal 或 Archive 前单独提交 Quality JSON。Archive 的 Quality 门禁只确认 Seal commit 对象仍存在。

### Section: 活动 Change 的显式重新验证

用户明确要求活动 Change 从头重新验证时，Quality SHALL 在原流程已停止、无旧执行者或待处理写入与恢复后，在同一 Change 保留原代码、commits/checkpoints、旧记录和失败原因，并建立新的验证依据。新基线 SHALL 由 fresh-context Reviewer 重新审查，旧 PASS 只作历史参考；不修改历史冒充新结果。普通修正、局部撤销和中断续跑 SHALL 继续原委托，不自动变为从头重验。

- **同代码重审**：用户因旧证据不可信要求从头 Review/Optimization，即使代码相同也取得新的独立 Review，保留旧历史。
- **旧执行者未结束**：Reviewer 或 Opt 仍在运行时，不开启并行重验或更换写入者。
- **旧格式记录**：不支持的旧记录给出诊断并原样保留，如何继续由主 Agent 与用户判断，不自动转换成新完成结论。

### Section: 按阶段与证据缺口推进

Quality SHALL 按基线 Review、主 Agent 决定的可选 Opt、Opt 处置和 Seal 顺序推进。Review findings 与 Required Corrections 交由主 Agent 判断和处理；Quality SHALL NOT 自动修改 `tasks.md`。没有 Seal 时不得进入 Change Closure；Opt 后是否追加 Review 由主 Agent 按实际风险决定，不由 CLI 推断或要求。

### Section: 单一 Quality Record 承载意见与 Seal

Quality SHALL 仅将 Review opinions、Opt opinions 或明确不做 Opt 的处置及当前 Seal 声明持久化在每个 Change 的一个 Git-tracked JSON 文档中。代码状态、执行过程、测试输出与恢复状态不复制进该文档；CLI 对更新执行原子写入与 revision compare-and-swap。

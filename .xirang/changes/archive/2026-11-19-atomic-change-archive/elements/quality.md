---
entity: element-declaration
identity: quality
kind: element
parent: change-implementation
title: Quality
definition: Quality 是 Change Implementation 中以 commit 绑定的 Review、Opt 交付与 Seal 声明协调实现判断并控制进入 Closure 的阶段。它承载独立基线审查、默认独立机会检查、授权改进及保留改动的累计独立审查；主 Agent 负责投入和声明，Reviewer 独立判断，CLI 校验意见顺序与提交关联。它不负责代码恢复或工作区新鲜度判定。
---

## MODIFIED Sections

### Section: 收口后确认可进入 Change Closure

Quality SHALL 仅在基线 Review 与累计保留改动的独立 Review 均已通过、Seal 前已有真实 Opt 处置、且主 Agent 已记录有效 Seal 声明时认定 Quality 完成并取得默认交付归档的质量资格；quick 的豁免与放弃留档不表示 Quality 完成。已执行 Opt 的处置 SHALL 包含 opinion 及 `baseCommit`、`resultCommit`；未执行 Opt 的处置 SHALL 包含简短理由。Seal 声明 SHALL 绑定一个 Git commit，并由主 Agent 声明该版本可运行且预期通过适用测试。CLI 不执行测试、不保存测试输出、不要求工作区 clean、不要求 Seal commit 等于 HEAD 或工作区内容，也不要求在 Seal 或 Archive 前单独提交 Quality JSON。Archive 的 Quality 门禁只确认 Seal commit 对象仍存在。

存在变更 Opt 时，CLI SHALL 要求其后的 full-change 或 incremental PASS，受审 commit 等于最后一次变更 Opt 的结果或为其 Git 后继，Seal 绑定该受审 commit。只读交付不能抹去此前义务，其他类别 PASS 不能掩盖未解决 FAIL；supplemental 不自动代表累计优化审查。

### Section: 按阶段与证据缺口推进

通过基线 full-change Review 后，协调 Agent SHALL 默认委托干净上下文的 Optimizer 执行一次只读 inspection，再依据证据、项目目标、约束、预期收益、成本和风险授权一组相关改进或说明停止理由；无需先找到具体改法才委托检查。每批 implementation 交付后，协调者核对实际改动与验证证据，决定继续当前 Opt、请求新的干净上下文 inspection 或停止；后续实施保持明确授权范围，以实际进展和预期价值判断继续，不强制每轮重启或固定轮数。

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。

Review findings、WARNING 和 Required Corrections SHALL 由协调者处理，Quality 不自动修改 tasks.md。已确认的基线缺陷修复必须 supplemental Review；没有有效 Seal 不得执行默认交付归档；quick 与放弃不代表 Quality 完成。

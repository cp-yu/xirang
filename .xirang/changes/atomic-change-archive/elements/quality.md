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

---
entity: element-declaration
identity: quality-cli-gate
kind: element
parent: quality
title: Quality CLI Gate
definition: Quality CLI Gate 是 Quality 的确定性接口与门禁，负责在单一 JSON record 中记录 Review opinions、可选 Opt opinions 或明确不做 Opt 的处置及 Seal 声明，并校验 commit identity 和流程关联。它提供只读状态诊断与 Archive Seal commit 检查；不执行测试、不比较工作区新鲜度、不自动修改 tasks.md，也不判断是否值得 Opt 或是否需要 Opt 后 Review。
---

## MODIFIED Sections

### Section: Review 记录入口

`xirang quality review <change-name>` SHALL 以 CAS revision 接受一条符合 v4 schema 的完整 Review opinion，并追加至该 Change 的 `.quality.json`：`reviewKind` 仅为 `full-change`、`incremental` 或 `supplemental`，还包含真实存在的 Git `commit`、`result`（`PASS` 或 `FAIL`）、非空 `summary` 和 `findings`；不包含 `reviewId` 或 `scope`，CLI 不要求或保存 Review identity，不因重复 `reviewId` 拒绝。结果只适用于该 commit 与该类别实际审查的工作。失败的同类 Review 只有在不同的修正 commit 上取得 PASS 才满足其门禁；无效委派与输入错误不保存为 FAIL。CLI 不解释 findings 的充分性、不修改任务或代替主 Agent 合并质量维度意见。

### Section: Seal 校验

`xirang quality seal` SHALL 要求通过的最新 `full-change` Review、每类已执行 Review 的最新结果均无未解决的 FAIL、明确的 Opt 处置与主 Agent 的 Seal 声明。Seal 仍绑定存在的 Git commit 和 `canRun`、`testsExpectedToPass`、`testScope`、`assessment`；CLI 不执行测试、不保存输出、不比较 HEAD/工作区、不要求 Quality JSON 单独提交，也不从其他类别的 PASS 推定同类失败已解决。

### Section: Status 输出语义

`quality status` SHALL 只读解析 v4 Quality JSON，按 `reviewKind` 报告通过的完整 Review、同类失败是否已由不同 commit 上的通过意见解决、Opt 处置与 Seal。缺少通过的 `full-change` 或存在未解决失败时为 `needs_review`；通过完整 Review 但缺少 Opt 处置或 Seal 时为 `needs_optimize`；所有门禁通过且 Seal commit 有效时为 `all_done`。Status 不比较 HEAD/工作区；缺少记录时报告缺失，v3 或更旧格式不当作新意见。

### Section: 记录主 Agent 最终结论

CLI SHALL 接受主 Agent 对最终验证范围的 Seal 声明，记录该声明与实际必需 Review 的 `reviewKind` 和 commit 关联。主 Agent 可认为未受后续改动影响的原测试证据仍适用，但不能将其冒充新测试或 Reviewer PASS；失败、缺失或已确认受影响却未验证的证据不能支撑正向 Seal 声明。CLI 不决定风险范围，不存储或评分测试输出与自然语言依据。

### Section: 拒绝退役协议

Quality JSON SHALL 使用 `schemaVersion: 4`。旧 `schemaVersion: 3` 的 `.quality.json` 以及更旧的 snapshot、event log 与 evidence 格式均不作为有效 v4 意见，不自动读取为通过结果、迁移、重写或删除；CLI 给出明确格式不支持诊断并保留原文件，由用户决定受影响活动 Change 如何继续。既有忽略规则和历史归档保持原样。

## REMOVED Sections

### Section: 记录实际测试证据

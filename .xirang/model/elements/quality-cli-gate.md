---
entity: element-declaration
identity: quality-cli-gate
kind: element
parent: quality
title: Quality CLI Gate
definition: Quality CLI Gate 是 Quality 的确定性接口与门禁，负责在单一 JSON record 中记录 Review opinions、可选 Opt opinions 或明确不做 Opt 的处置及 Seal 声明，并校验 commit identity 和流程关联。它提供只读状态诊断与 Archive Seal commit 检查；不执行测试、不比较工作区新鲜度、不自动修改 tasks.md，也不判断是否值得 Opt 或是否需要 Opt 后 Review。
---

## Specification

### Section: Review 记录入口

`xirang quality review <change-name>` SHALL 以 CAS revision 接受一条符合 v4 schema 的完整 Review opinion，并追加至该 Change 的 `.quality.json`：`reviewKind` 仅为 `full-change`、`incremental` 或 `supplemental`，还包含真实存在的 Git `commit`、`result`（`PASS` 或 `FAIL`）、非空 `summary` 和 `findings`；不包含 `reviewId` 或 `scope`，CLI 不要求或保存 Review identity，不因重复 `reviewId` 拒绝。结果只适用于该 commit 与该类别实际审查的工作。失败的同类 Review 只有在不同的修正 commit 上取得 PASS 才满足其门禁；无效委派与输入错误不保存为 FAIL。CLI 不解释 findings 的充分性、不修改任务或代替主 Agent 合并质量维度意见。

### Section: Optimization 记录入口

`xirang quality opt <change-name>` SHALL 接受并记录以下一种 Opt 处置：至少一条交付 opinion，每条绑定 `baseCommit`、`resultCommit` 与意见文本；或带非空简短理由的 `not_performed`。CLI SHALL 校验 opinion identity 与两个 Git commit objects，追加 delivered opinions 并在并发 revision 冲突时拒绝写入且保留原 JSON。它不记录委托起点、进度、测试输出或恢复位置，不判断是否应执行 Opt、跳过理由或 opinion 文本是否充分，也不维护方向排序、选择、依赖队列、收益分级、重试或数量限制。

### Section: Seal 校验

`xirang quality seal` SHALL 要求通过的最新 `full-change` Review、每类已执行 Review 的最新结果均无未解决的 FAIL、明确的 Opt 处置与主 Agent 的 Seal 声明。Seal 仍绑定存在的 Git commit 和 `canRun`、`testsExpectedToPass`、`testScope`、`assessment`；CLI 不执行测试、不保存输出、不比较 HEAD/工作区、不要求 Quality JSON 单独提交，也不从其他类别的 PASS 推定同类失败已解决。

### Section: Status 输出语义

quality status SHALL 只读解析 v4 Quality JSON，按 reviewKind 报告当前 Review 结论及 commit 关联、同类失败是否已由不同 commit 上的通过意见解决、Opt 处置与 Seal。缺少通过的 full-change 或存在未解决失败时为 needs_review；通过完整 Review 但缺少 Opt 处置或 Seal 时为 needs_optimize；所有门禁通过且 Seal commit 有效时为 all_done。Status SHALL 不比较 HEAD/工作区；缺少记录时报告缺失及 revision 0，v3 或更旧格式不当作新意见。

默认结果 SHALL 包含当前 revision、当前门禁结论及具体缺口，不展开历史或完整 opinion 正文。quality status <change> --history SHALL 额外返回完整 Quality record；历史意见及已记录的处置 SHALL 不因默认输出精简而被删除。

- 两条历史意见最终形成有效 PASS：默认展示当前结论及关联 commit，--history 保留两条完整意见。
- 完整 Review 通过而 Opt 或 Seal 缺失：默认结果指出具体缺项，不回显既有 Review 的全部 findings。
- 记录无法解析或格式不受支持：非零退出并在 stderr 给出诊断，原记录保持不变。

### Section: 统一输出与诊断结构

所有 xirang quality 子命令 SHALL 将请求的结果写入 stdout，将警告和错误写入 stderr。写入成功 SHALL 只返回供后续 CAS 使用的新 revision，不回显提交的完整 opinion、Opt 或 Seal，也不附 ok 或通用 allowedNextOperations。

门槛或关联不满足 SHALL 以 exit 1 退出；输入形状非法 SHALL 以 exit 2 退出并使用 INVALID_INPUT。失败诊断 SHALL 保留稳定 code；适用的字段诊断 SHALL 包含 path、expected、actual 与 fix。--json 时 stderr SHALL 使用结构化 JSON。成功状态查询的待办缺口 SHALL 作为所请求的状态数据返回；命令执行失败不得伪装成空成功。

### Section: 协议说明的单一来源与投影

系统 SHALL 从实现使用的同一批协议常量和字段定义生成 Quality help 及 Apply/Archive references，覆盖 Review opinion、Opt disposition、Seal、commit 关联、最小合法 JSON 示例、CAS revision 和失败诊断。不维护平行手写 schema 或旧方向指令；CLI 只校验 JSON 结构、Git commit identity、声明的流程条件及关联，不运行测试或评分自然语言充分性。

### Section: 记录主 Agent 最终结论

CLI SHALL 接受主 Agent 对最终验证范围的 Seal 声明，记录该声明与实际必需 Review 的 `reviewKind` 和 commit 关联。主 Agent 可认为未受后续改动影响的原测试证据仍适用，但不能将其冒充新测试或 Reviewer PASS；失败、缺失或已确认受影响却未验证的证据不能支撑正向 Seal 声明。CLI 不决定风险范围，不存储或评分测试输出与自然语言依据。

### Section: 拒绝退役协议

Quality JSON SHALL 使用 `schemaVersion: 4`。旧 `schemaVersion: 3` 的 `.quality.json` 以及更旧的 snapshot、event log 与 evidence 格式均不作为有效 v4 意见，不自动读取为通过结果、迁移、重写或删除；CLI 给出明确格式不支持诊断并保留原文件，由用户决定受影响活动 Change 如何继续。既有忽略规则和历史归档保持原样。

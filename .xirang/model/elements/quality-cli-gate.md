---
entity: element-declaration
identity: quality-cli-gate
kind: element
parent: quality
title: Quality CLI Gate
definition: Quality CLI Gate 是 Quality 的确定性接口与门禁，独立负责单一记录中的 Review、Opt 处置及 Seal，校验 commit identity、共享写入序号、变更交付后的审查关联和失败状态。它提供状态诊断与 Archive Seal commit 检查；不执行测试、不比较工作区、不修改任务、不评价优化价值或选择 Review 范围。
---

## Specification

### Section: Review 记录入口

xirang quality review SHALL 以 CAS revision 接受完整 Review payload：reviewKind 为 full-change、incremental 或 supplemental，真实 Git commit、PASS/FAIL、非空 summary 和 findings。CLI 将本次成功事务的新 revision 写入 opinion.recordedRevision，追加历史并清除现有 Seal；调用方不提供 recordedRevision。结果仅适用于实际受审 commit 及范围，不保存 reviewId/scope 或自动修改 tasks。

同类 FAIL 只有在不同修正 commit 的同类 PASS 后才解决；无效委派和 HEAD 变化不记录为 FAIL。CLI 不评价 findings 充分性或替代协调者合并质量维度。

### Section: Optimization 记录入口

xirang quality opt SHALL 记录至少一条真实 delivered opinion，或确未运行时带简短非空理由的 not_performed。每条 opinion 保留 opinionId、baseCommit、resultCommit、summary、findings，CLI 校验身份唯一与 commit objects，并赋本次成功事务的新 revision 为 recordedRevision；同次提交的多条意见共享 revision，保持数组交付顺序，不创建第二计数器。

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

baseCommit SHALL 承接最近已交付结果；该交付之后有基于其结果或后继提交的通过 Review 时，可承接该最新受审提交，无既有交付则承接通过的 full-change 基线。同批意见逐条承接前一 resultCommit。承接后续受审提交仅确定起点，不能以 supplemental PASS 抹去累计优化审查义务。结果提交由协调者核对并提交；相等提交不代表过程只读，不同提交形成新交付状态，无需 readonly 字段或提交树比较。

已有 delivered 历史 SHALL NOT 被 not_performed 替换；无变更意见继续追加而不覆盖历史。CLI 不保存进度、恢复位置或原始测试输出，不评价跳过理由或优化价值。CAS 冲突保留原 JSON，不写入部分意见。

### Section: Seal 校验

xirang quality seal SHALL 要求最新 full-change 为 PASS、每类最新 Review 无未解决 FAIL、真实 Opt 处置及合法 Seal 声明。存在 baseCommit != resultCommit 的 Opt 时，取写入顺序中最后一条此类交付 O（同事务按数组顺序）。必须存在当前通过的 full-change 或 incremental 意见 R，满足 R.recordedRevision > O.recordedRevision，且 R.commit 等于 O.resultCommit 或 O.resultCommit 是 R.commit 的 Git 祖先；Seal.commit 必须等于 R.commit。supplemental 不能单独满足累计优化门禁。

没有变更 Opt 时不新增这项后审义务；之后的无变更意见不改变最后一次变更 O。后续变更交付使旧 PASS 不再满足顺序条件；未解决 FAIL 仍按原类别处理。Seal 绑定存在的 Git commit，记录 canRun、testsExpectedToPass、testScope、assessment。CLI 不比较 HEAD/工作区，不执行测试，不要求 Quality JSON 单独提交。

- Review①→Opt修改②：缺少后审，拒绝 Seal。
- Review①→Opt修改②→Review通过③，提交关联正确：其他门禁满足时允许 Seal。
- Review①→Opt只读检查②：不新增后审义务。
- Review①→Opt修改②→Opt只读检查③：仍须审查②。
- 基线Review(A)通过→Opt交付B→Review(B)失败→协调者提交修正C→Review(C)通过：B是C的祖先、同类FAIL已解决且其他门禁满足，允许Seal(C)。晚写旧A的Review不能覆盖B。
- B经重写历史变为与B无祖先关系的C：该Review不能沿用B的关联；拒绝Seal，不自动补造Opt或迁移历史。
- Review(C)通过后声明Seal(D)：即使D存在，也不满足本次后审提交匹配；仅Quality记录推进HEAD不要求把Seal改绑到新HEAD。

### Section: Status 输出语义

quality status SHALL 只读解析 v5 Quality JSON，按 reviewKind 报告当前结论、commit 关联及未解决 FAIL，并报告 Opt 处置、累计审查缺口与 Seal。缺少通过的 full-change、存在未解决 FAIL，或最后一次变更 Opt 缺少满足写入顺序及祖先关联的 full-change/incremental PASS 时为 needs_review；Review 门禁满足但缺少 Opt 处置或 Seal 时为 needs_optimize；所有门禁满足且 Seal 的提交关联及 commit object 有效时为 all_done。只读 Opt 不单独造成 needs_review。

默认输出当前 revision、门禁与具体缺口，不展开历史正文；--history 返回完整记录，包括意见 recordedRevision。缺少记录报告缺失与 revision 0。Status 不比较 HEAD/工作区；记录不可解析、序号非法或版本不支持时非零退出并诊断，原记录保持不变。

- 基线PASS、变更Opt、无后审：needs_review。
- 后审顺序有效但审查旧基线提交：仍needs_review。
- 只读Opt且基线有效、Seal缺失：needs_optimize。
- 默认查询保留当前概况，--history仍保留全部历史意见和写入序号。

### Section: 统一输出与诊断结构

所有 xirang quality 子命令 SHALL 将请求的结果写入 stdout，将警告和错误写入 stderr。写入成功 SHALL 只返回供后续 CAS 使用的新 revision，不回显提交的完整 opinion、Opt 或 Seal，也不附 ok 或通用 allowedNextOperations。

门槛或关联不满足 SHALL 以 exit 1 退出；输入形状非法 SHALL 以 exit 2 退出并使用 INVALID_INPUT。失败诊断 SHALL 保留稳定 code；适用的字段诊断 SHALL 包含 path、expected、actual 与 fix。--json 时 stderr SHALL 使用结构化 JSON。成功状态查询的待办缺口 SHALL 作为所请求的状态数据返回；命令执行失败不得伪装成空成功。

缺少 Opt 后通过 Review、写入顺序不满足、Git 祖先关联不满足或 Seal 受审提交不匹配 SHALL 返回稳定的具体门禁诊断；不能判定 Git 关联时报告失败，不当作满足。字段输入、CAS 或写入失败不推进 revision，不产生部分历史。

### Section: 协议说明的单一来源与投影

系统 SHALL 从实现使用的同一批协议常量和字段定义生成 Quality help 及 Apply 的 Quality 执行 references，覆盖 Review opinion、Opt disposition、Seal、commit 关联、最小合法 JSON 示例、CAS revision 和失败诊断。不维护平行手写 schema 或旧方向指令；CLI 只校验 JSON 结构、Git commit identity、声明的流程条件及关联，不运行测试或评分自然语言充分性。

Archive 工作面 SHALL NOT 投影 Apply 专属的 Quality 执行或恢复 references。默认交付时，Archive SHALL 仅通过归档 CLI 消费已记录的有效 Seal；Seal 被拒绝时转达具体诊断并交回 Apply，不在 Archive 中执行或恢复 Quality。

### Section: 记录主 Agent 最终结论

CLI SHALL 接受主 Agent 对最终验证范围的 Seal 声明，记录该声明与实际必需 Review 的 `reviewKind` 和 commit 关联。主 Agent 可认为未受后续改动影响的原测试证据仍适用，但不能将其冒充新测试或 Reviewer PASS；失败、缺失或已确认受影响却未验证的证据不能支撑正向 Seal 声明。CLI 不决定风险范围，不存储或评分测试输出与自然语言依据。

### Section: 拒绝退役协议

Quality JSON SHALL 使用 schemaVersion: 5。v4 及更早记录均返回 UNSUPPORTED_QUALITY_VERSION 并保留原文件，不迁移、不补造意见顺序、不重写或删除；历史 snapshot/event log/evidence 不解释为新协议结果。本次不提供活动旧 Change 升级路径或历史顺序恢复，既有忽略规则和归档保持原样。

## Context

本 Change 复用已确认 Explore 设计，修正实现取舍、独立优化发现、提交与累计审查流程，并增加阶段配置作用域。正式模型已分别在过程父级、角色和协议表达现有流程；必须同步这些承诺，不能只更新 Apply Step 4。保留既有 Element identities、Kinds、parents、Relationships 和 Views，仅调整受影响 Definition 与 Contract Sections。

历史 Airway 案例实际记录的是 not_performed，理由含小程序体积及已有边界精简；不是 Optimizer 已执行却未找到机会。此证据支持检查入口和评估维度的改进需求，不证明某句话造成历史失败，也不证明新提示词已改善行为。

## Goals / Non-Goals

**Goals:**

- 使实现组织服务于当前可读性、维护性及相关质量目标，独立发现机会后再决定投入。
- 在明确授权组内推进行为保持改进，提交、交付、累计独立 Review 和 Seal 形成可检查的关联。
- 项目共同背景、制品规则和六个阶段的执行指导分别表达、按各自作用域消费。
- 模板源、工具投影、模型与 CLI 对协议形成一致表达。

**Non-Goals:**

- 不强制产生优化、不设复杂度指标门槛或穷尽维度、不规定固定迭代次数。
- 不增加工作区扫描、内容等价判定、时间戳、独立顺序计数器、readonly 字段或 Quality 执行日志。
- 不迁移旧 Quality，不恢复旧意见时序，不重构无关模型层级或清理无关旧协议。
- 不实现固件改动；本阶段不更新正式模型、项目源码或已生成工作面。

## Decisions

### 实现取舍与 Opt 模式

Apply 的 Implementation Discipline 保留既有优先删除、标准库、平台支持及直接表达的偏好，替换禁止一切非必需抽象的笼统句子，采用已确认文字：

> Choose abstractions and code organization that make responsibilities and control flow clear and changes easier to localize. Avoid added structure without a concrete benefit to the current implementation.

Optimizer 角色使用明确 mode，检查与实施共享判断原则但具有不同写入边界。沿用已确认核心文字，落位时消除重复和矛盾：

> Work in the assigned mode: inspection or implementation.
>
> In inspection mode, independently assess the current implementation without modifying it. Consider dimensions such as readability, maintainability, cognitive and structural complexity, performance, resource use, robustness, encapsulation, type safety and extensibility, among others. Select relevant dimensions from the actual work. Return worthwhile opportunities with concrete evidence, expected benefits, costs, risks and verification approaches, or explain why further work is not warranted. Structural signals alone do not justify a change.
>
> In implementation mode, carry out the authorized group of improvements and verify the resulting behavior. Preserve the target semantics and behavior. Report retained changes, actual benefits, verification results and remaining opportunities. Report opportunities outside the authorized scope without implementing them.
>
> Treat previous findings and attempts as evidence to reassess against the current implementation, not conclusions you must preserve. A valid outcome may be no changes; do not manufacture work to justify the assignment.

维度是开放示例，代码体积、函数/文件/层数只提供调查线索。允许合理抽取或合并。检查发现已确认缺陷时交回协调者安排修复和独立 Review；可选优化的停止规则不能成为遗留缺陷的理由。

### 协调、提交与累计 Review

Apply Step 4 使用已确认核心文字，并保留缺陷分流、恢复、真实记录与具体 CLI 入口：

> After a passing full-change Review, delegate an initial read-only inspection to a clean-context Optimizer. Assess its findings against the project goals, constraints, expected benefits, costs and risks. Authorize a group of worthwhile improvements or stop with reasons; you need not identify specific edits before requesting inspection.
>
> After each implementation delivery, inspect the actual changes and verification evidence. Decide whether to continue with the current Optimizer, request a fresh-context inspection to reconsider potential opportunities, or stop. Keep further work within an explicit scope and use actual progress and expected value to guide continuation.
>
> Before Seal, obtain independent Review for all retained changes not yet reviewed. Choose full-change or incremental Review according to the cumulative changes and their impact; risk determines the scope, not whether Review occurs. You may review earlier when useful. Further changes require renewed Review of those changes and their impact.
>
> Record actual Opt deliveries, including inspections that produce no changes. Use `not_performed` only when Opt did not run. Preserve findings and reasons when you decline an identified opportunity. The Optimizer’s verification does not replace independent Review.

面向当前执行者用直接祈使或 you；内部角色称呼另一协调角色时保留身份，不作全局词替换。共享参考、Apply/Archive 恢复路径和内部角色同步采用同一规则。

每组实施交付后，由协调者核对、提交保留改动，再记录真实 base/result。Optimizer 不创建结果 Git history。没有保留改动复用原提交，修改后撤销也如实报告；相同 commit 不是过程只读的证明。默认检查实际运行即 delivered；用户明确不运行等实际未运行情形才如实记录 not_performed，不由 CLI 判断其理由是否充分。

### Quality 写入顺序与提交关联

使用 Quality schemaVersion 5。现有全局 CAS revision 每次成功事务加一；新增意见字段 recordedRevision 由 CLI 在同一个事务中赋值。Review payload 不增加调用者可写序号；同事务多条 Opt 共享序号，数组顺序区分批内先后。失败写入不推进 revision。由共享定义生成 schema、help 和 references，不维护第二套手写协议。

Seal 门禁取最后一次 base != result 的 Opt O。适用 full-change/incremental PASS R 必须晚于 O，且受审提交等于 O.resultCommit 或为其 Git 后继，Seal.commit 等于 R.commit。采用 Git commit identity 与祖先关系检查，不比较提交树内容，不以祖先关系证明代码质量；实际累计变更及影响仍由 Reviewer 判断。未解决同类 FAIL 保留，supplemental 只覆盖基线缺陷，不自动覆盖全部优化。

未记录 Seal 时，status 可先判断是否存在顺序和祖先关系满足的通过 Review；缺少则 needs_review，通过后但 Seal 缺失则 needs_optimize。有 Seal 时还检查所绑定的受审提交。Change status 复用同一判定，避免状态与写入门禁分叉。仅 Quality 记录提交使 HEAD 推进时，继续引用实际受审实现提交，不把当前 HEAD 当作新的 Seal 目标。

边界推演：

| 事件 | 结果与依据 |
|---|---|
| Review(A) PASS → Opt A→B | 最后变更 O 尚无后审，不能 Seal |
| 上述之后只读 Opt B→B | 不改变 O，仍须后审 |
| 上述之后晚写 Review(A) PASS | 顺序可能满足，祖先方向不满足，拒绝 |
| Review(B) FAIL → 协调者修正 C → 同类 Review(C) PASS | C 是 B 后继，失败已由不同提交解决，其他门禁满足可 Seal(C) |
| Review(C) PASS → Opt C→D | 新 O 晚于旧 PASS，D 需要后审 |
| Review(C) PASS → 只读 Opt C→C | 不增加后审义务，既有合格 Review 仍可支持 Seal(C) |
| supplemental(C) PASS，但没有累计优化 Review | 不单独满足累计审查门禁 |
| 与 B 无祖先关系的重写 C | 不沿用 B 的关联，不能以内容相似自动放行 |

允许 Review 后修正继续 Opt，因此现有 baseCommit 连续性不能固定在旧交付结果：在最近交付之后，基于该结果或其后继提交的通过 Review 可提供新的已受审起点；下一交付从该 commit 开始。同批意见继续逐条相接。此为已确认“修正可由协调者提交、不得伪造 Opt”在后续循环的配套展开，不减少累计审查义务。supplemental 可提供真实起点，但不能替代累计 Review。

已有 delivered 不能被 not_performed 覆盖，源于已确认“只用于确未运行”和原有 append-only 历史约束。意见顺序非法、Git 关系无法判断等情况给出具体诊断，不冒充通过；保留现有 CAS/原子失败边界。具体错误常量在 Apply 对齐现有命名，行为由 Contract 决定。

### stageRules 的解析与投影

沿用现有字段定义、归一化、点路径投影和 check 管线，增加 stageRules 及六个精确阶段键，复用已登记阶段集合。无新增查询命令：阶段入口查询 `config project --select stageRules.<stage> --json`；common 说明作用域。--artifact 只处理制品 rules，不影响明确选中的阶段数据。

缺失与空数组无附加要求；未知键或非法成员的普通读取采用现有 rules 的独立诊断与过滤习惯，check 以错误报告，其他有效字段保留。该错误处理是既有配置机制的局部展开。阶段切换重新选择当前阶段数据；context 在仍有效时复用。内部角色不自动继承 Apply 规则，协调者仅传任务相关约束。

字段说明、配置示例、schema、查询和检查同时更新；stageRules 为可选字段，不需要配置版本迁移或自动填写用户规则。现有 optional 字段示例机制与受管清单负责新安装说明，不为旧配置重写增加独立迁移流程。

### 实现影响与验证策略

实现沿现有边界落位：Apply/Optimizer 模板及共享 references；Quality command-schema、engine、status 和协议生成；project-config、config-fields、config-projection、config/schema/check；common 与六阶段模板及工具投影。逐处同步角色职责、版本和分支，不重构无关代码。若受管生成有增删改，按既有显式登记清单定位，不用 glob/模式识别归属。

优先扩展现有 Quality 与配置行为测试，覆盖事务顺序、同批多个意见、CAS 失败不留部分数据、无改动与累计改动、旧提交晚写、C 修正后审与继续 Opt、supplemental/FAIL 不被掩盖、Seal 绑定、旧版本原样拒绝；配置覆盖六阶段选择、命名空间、空值/非法输入及有效内容保留。选能发现实际行为回归的最低成本边界，不按 Section 数量拆测试。

生成面检查保留协议 token、模式权限、fail-closed 门禁与明确退役操作的约束，替换依赖旧“按风险免审”行为的测试。普通解释散文、标题顺序、样例措辞不新增持久精确文本断言；上述精确 prompt 是实施依据，字符串存在不证明行为有效。

实际 Agent 行为验证观察：inspection 保持只读、implementation 遵守授权组并报告越界机会、无收益时可停止、变更后安排独立 Review、阶段指导不串用。使用环境支持且获授权的运行方式，记录场景、设置、实际行为与局限，不把未运行或单次表现声称为稳定收益。构建/typecheck、退役用法检查可作为一次性证据，不制造持久散文测试。

平台沿用 Node.js path.join/path.resolve 与现有工具适配；Windows、macOS、Linux 上阶段规则、Git 关联、记录原子性和生成入口语义相同。实际验证包含 Windows CI 对路径消费者的保护，预期路径也使用平台 API；未运行平台不宣称通过。

## Risks / Trade-offs

- [独立检查增加调用成本] → 不强制实施或固定轮数；协调者按证据与价值停止，必要时再开干净上下文。
- [写入顺序只能证明记录顺序] → 结合 commit/Git 祖先关联和独立审查；CLI 不判断意见自然语言充分性。
- [重写历史失去祖先关系] → 明确拒绝直接沿用原关联，不用内容等价猜测。
- [会话仍记得旧阶段规则] → 明确后续阶段不执行其规则，独立查询当前阶段；不声称清除了记忆。
- [模板测试通过不能证明维护质量提升] → 分别报告确定性测试与 Agent 实际观察，保留未验证限制。
- [旧 Quality 不再可用] → 明确拒绝并保留文件；这是已确认的 breaking 边界。

## Migration Plan

Quality 使用 v5；不提供旧版本迁移、兼容分支、历史顺序重建或活动 Change 升级工具。旧归档与忽略规则保持原样。stageRules 可选，未配置项目沿用内置指导；不为其自动写入规则或引入配置版本迁移。受管工作面经现有生成/更新机制交付。

## Open Questions

无阻塞目标语义或实现方案的未决项。实际 Agent 改善效果尚无运行证据，Apply 须按实际验证报告，不能由本设计或文本校验推定。

---
entity: confirmed-design-record
explorationId: 20261103T031501Z-1c618bb0
slug: optimization-flow
semanticModelFingerprint: c0fda3bf31bf21a344845503791674308b7ca45b2630a02f8db6bd3d409cba9e
---
schemaVersion: 4
context: change
relatedIdentities:
  - quality
  - optimization
  - optimization-execution
  - optimizer-findings
  - review
  - optimizer
  - optimizer-protocol
  - checkpoint
  - internal-agents
  - quality-execution-model
  - quality-orchestration
  - quality-writeback
  - quality-freshness
  - quality-cli-gate
  - apply-quality-integration
  - archive-quality-gate
  - quality-aware-instructions
  - internal-subagent-generation
  - change-implementation
entries:
  - identity: exploration-scope
    nature: normative
    decision: accepted
    content: |
      本次聚焦 Optimization 流程的提速与减轻流程负担。Apply 的其他阶段留待后续讨论，不纳入本次目标。用户确认：“感觉主要是 opt流程的问题。 后面再看apply的问题。    现在来逐步深入讨论。”
  - identity: risk-based-validation
    nature: normative
    decision: accepted
    content: |
      Optimization 按实际风险决定是否需要独立 Review，允许依据充分的低风险优化免去独立 Review，但依然需要测试。局部修改后可运行对应局部测试验证；没有对应测试时，在修改前补充对应测试。最后根据实际风险判断是否需要统一执行全量测试和增量 Review，不固定要求每项优化都执行全量测试或独立 Review。
      用户确认原文：“按实际风险决定。  然后我现在有个想法， 其实opt修改局部之后，运行局部的测试验证就可以了。如果没有对应的测试，这个时候修改前可以补充上。  最后看情况是否需要统一一个全量测试和增量review     按照实际风险决定，依然需要测试。”
  - identity: validation-decision-owner
    nature: normative
    decision: accepted
    content: |
      主 Agent 负责根据实际风险判断 Optimization 最终需要的验证范围，决定是否需要全量测试和增量 Review，不增加固定的独立风险审批环节。主 Agent 确定优化委托范围、处理越界问题，收尾时根据累计改动与 Opt 交付的结果和证据作出验证范围判断并简短说明依据。
      Optimizer 在委托范围内负责发现优化机会、分组、修改、补充和运行局部测试，提供优化结果、需要保持的行为、实际改动、测试结果与相关证据，以及建议验证范围。发现影响超出预期时向主 Agent 交付该情况及依据，供主 Agent 调整验证范围。Opt 自身的测试与判断不作为独立 Review。
      用户先确认“认可主agent判断”，后在允许 Opt 执行优化的分工讨论中明确：“我感觉现在的opt更合理。 主agnet负责 最终验证范围判断。  opt需要提供给主agent 结果、证据等信息。   opt优化的时候，感觉可以允许多个优化合并。”本次确认将原先由主 Agent/Apply 承担的优化分组、实现与局部验证职责交给 Opt，保留主 Agent 的最终验证范围判断。
  - identity: on-demand-optimizer-reassessment
    nature: normative
    decision: accepted
    content: |
      Optimizer 按需重新评估，不在每项或每批优化结束后固定重新调用。一次委托中 Opt 可以发现多个候选，自主分组、连续执行与局部验证，并允许将适合一起处理的多个优化合并；不要求每项优化完成后都返回主 Agent 再重新委托。已有建议依据仍成立时无需逐项重新启动 fresh Optimizer、读取全部上下文和排序剩余建议。
      再次调用须有实际评估需要，例如前一项修改使后续建议不再适用、实现发现关键假设不成立，或出现值得进一步判断的新优化机会。已知候选处理完且结果与证据已交付后，主 Agent 可以判断最终验证并收尾，不强制再次调用 Optimizer 证明没有更多优化。
      用户确认“按需重新评估”，后确认 Opt 承担优化执行且“opt优化的时候，感觉可以允许多个优化合并”。据此次确认，分组、实现与局部验证由 Opt 承担，取代此前由主 Agent 执行的分工。
  - identity: optimizer-write-responsibility
    nature: normative
    decision: accepted
    content: |
      Optimizer 是受托完成优化的执行者，具有在主 Agent 委托范围内修改优化实现及相关测试的权限，承担发现优化机会、分组、修改、补充和运行局部测试的职责；可以合并多个优化，不强制逐项交接。Opt 向主 Agent 交付优化结果与证据，主 Agent 保留最终验证范围判断。需要时由 Reviewer 独立检查优化结果。
      用户确认原文：“我感觉现在的opt更合理。 主agnet负责 最终验证范围判断。  opt需要提供给主agent 结果、证据等信息。   opt优化的时候，感觉可以允许多个优化合并。”
  - identity: optimization-failure-diagnosis
    nature: normative
    decision: accepted
    content: |
      多个优化允许合并。失败处理优先根据实际证据定位问题并局部修正，不要求 Review 一旦失败就整批回滚。
      局部测试失败且原因明确时，Opt 可直接定位、修正并重新验证。最终测试或增量 Review 发现问题且能定位到某项改动时，针对该改动修正或撤销，保留其他有效优化。合并后无法直接定位时，可以拆分或二分排查；若问题来自多项优化的相互作用，单独测试各部分可能都通过，需检查组合。
      将这些优化失败定位方法放入新的 reference 文档，供实际排查时参考；它们用于判断优化哪里出现问题，不是必须按固定顺序执行的算法。实际工作存在更合适的方法时允许采用，不强制二分，不强制每次失败都完整回滚重跑。
      用户确认原文：“合并是ok的。   这个内容是用于判断优化哪里出现的问题。 但是实际上工作的时候会有更好的方法。 可以放到reference一个新的文档。  认可你的这个说法。”
      当前 Explore 只记录设计；新增 reference 文档由后续 Change 编译与实现落地。
  - identity: optimization-checkpoints
    nature: normative
    decision: accepted
    content: |
      优化开始前保留可恢复基线，确保能撤销本次优化并保留原实现。优化过程中由 Opt 按需要保存中间状态，例如完成一组相对独立的优化或即将进行较大调整时；不强制每个优化方向创建 Git commit。
      最终状态完成主 Agent 判定所需的验证后，再保存成功 checkpoint。只通过局部测试的中间状态可用于排查和恢复，但不自动等于最终验证通过。Git 提交和 Review 不再绑定到每个优化方向。
      用户对“保留优化前基线，中间按需保存，最终验证通过后保存成功 checkpoint”确认：“yes”。
  - identity: optimization-completion-gate
    nature: normative
    decision: accepted
    content: |
      Change 必须有独立 Review，不能整条流程都免 Review。优化前的实现须先通过独立 Review，作为本次优化的基线；这次 Review 可以满足流程必需的 Review，不要求优化后一定再次 Review。
      优化后的收尾门禁为：主 Agent 已根据实际风险确定最终验证范围，该范围内的验证全部完成且通过，并有对应当前代码状态的证据。测试仍然必需；优化后的全量测试和增量 Review 是否需要，由主 Agent 判断。
      例如 Opt 合并完成两项局部优化且对应测试通过，主 Agent 根据改动范围、行为保持依据与测试覆盖判断无需全量测试或增量 Review，记录判断及依据后即可完成优化并保存成功 checkpoint。若主 Agent 判断需要增量 Review，则必须等该 Review 通过才可完成。
      记录明确区分“执行了 Review 并通过”与“经判断无需追加 Review”；不把后者记为 Reviewer PASS，也不声称优化前的 Review 独立审查过优化后的改动。优化前已通过的 Review、优化改动及其测试证据、主 Agent 的最终验证判断共同支持收尾。
      此后代码再次改变，需要重新判断受影响的验证，不能沿用不再适用的结论。
      用户对“所需验证已完成”作为优化收尾门禁确认并补充原文：“yes。   不过review一定要有是必须的。 只不过这个review可能是opt之前的review>”
  - identity: abandon-unsuccessful-optimization
    nature: normative
    decision: accepted
    content: |
      某项优化尝试后仍无法修好时，允许放弃该项并继续完成其他优化，不因优化未成功而阻塞已正确的原始实现。
      Opt 可以撤销有问题的改动、保留其他有效优化，并向主 Agent 交付失败原因及恢复后的测试证据；主 Agent 判断剩余结果是否满足最终验证要求。无法确认局部撤销后状态可靠时，恢复到可确认的基线；恢复也无法确认时停止并交回主 Agent，不把未解决的问题带入最终结果。
      无法完成的优化须保留记录，记录该优化事项、无法完成的原因和处理结果，最终交付时告知用户。失败记录与已保留的有效优化结果应明确区分。
      优化用于使整个 Change 完成后的效果更好；优化机会未能实现不应阻止正确、已满足验证要求的 Change 完成。
      用户确认原文：“可以的。 然后这个无法完成的优化 留个记录， 后面跟用户告知。    优化本身是为了整个change形成之后的效果更好， 不能因噎废食。”
  - identity: model-owned-optimization-budget
    nature: normative
    decision: accepted
    content: |
      取消 directionLimit 与 directionRetries 对优化方向数量及同方向失败次数的逐方向硬限制，将是否继续、放弃或停止优化的判断交给模型。Opt 和主 Agent 都有权根据收益、成本、风险与实际进展作出判断，不要求 CLI 按逐方向计数控制执行。
      主 Agent 可以在委托时给出明确预算或停止条件，Opt 在委托约束内执行；用户明确给出的约束仍须遵守。没有新证据或实质进展的重复尝试应停止并记录，不以取消固定次数限制为由无进展地循环。主 Agent 对最终验证范围的判断责任保持不变。
      用户对取消逐方向硬限制、由模型判断的确认原文：“之前是模型性能不够。 现在模型性能足够了。我觉得这个判断可以交给模型负责了。  所以opt和主agent都有权限。”
  - identity: model-capability-rationale
    nature: informative
    decision: accepted
    content: |
      用户说明过去设置限制的背景是模型性能不足，现在认为模型能力足以承担是否继续优化的判断，因此希望 Opt 与主 Agent 均具有此判断权限。这是用户给出的设计理由，不作为本次会话已独立验证的模型能力测量结论。
  - identity: breaking-protocol-change
    nature: normative
    decision: accepted
    content: |
      本次 Optimization 流程改造允许 breaking change，可重新设计现有优化协议、命令输入输出、台账结构及相关配置，不以保持旧形式兼容为设计前提。
      Xirang 不为旧 Change 增加向后兼容或自动迁移逻辑。已归档记录原样保留为历史证据；旧活动质量记录不自动转换为新协议的完成结论。旧 Change 如何继续、是否重建验证依据等兼容处理由模型结合项目状态与用户判断，不为此在 CLI 内建立第二套执行路径。
      旧命令输入、退役配置及不支持的旧质量格式给出明确诊断，不静默解释成新语义；识别不支持格式不等于实现兼容层。保留已有代码、commits/checkpoints 与历史记录，不因升级自行清理或重写旧制品。
      用户先确认：“允许break change.  思考一下有什么更好的形式？”后明确：“可以的。  旧的change 其实不用在xirang中增加 向后兼容。 向后兼容问题由模型和用户判断如何处理即可。”
  - identity: optimization-delivery-form
    nature: normative
    decision: accepted
    content: |
      Optimization 以一次优化委托及其实际交付为单位组织。Opt 在委托范围内自主发现、分组、修改和局部验证，交付结果；主 Agent 决定最终所需验证并负责收尾；CLI 管理证据与完成条件，取消逐方向选择、排序、依赖调度和状态迁移控制。
      分开保留基线独立 Review、Opt 执行报告、主 Agent 最终验证结论三类证据；它们不必对应三个独立文件。Opt 执行报告围绕实际保留的改动及收益、行为保持依据、实际测试与证据、未完成或撤销事项及原因、遗留问题与验证建议组织；不要求所有内部想法预先成为正式候选，不强制每个候选永久 ID、排序分值、重复字段或逐项登记。报告详略随复杂度变化，须足以支持主 Agent 判断。
      中间按实际恢复和交接需要保存进度，未交付的中断状态不得作为完成。主 Agent 结合报告、实际代码和证据决定追加验证；发现问题可交回 Opt 处理并更新交付，不要求重走全套候选发现、排序和选择。
      CLI 关联基线、执行报告、最终验证结论及对应代码状态，校验证据新鲜度、必要信息与完成条件。采用少量结构化关联和验证字段加自然语言说明，避免维护内容重复的机器台账与人类报告。具体命令名、文件名与 schema 尚未确定。
      已撤销的失败优化记录在报告中，不因某次优化未成功便将整个最终结果笼统认定为质量下降；是否可完成取决于剩余实现正确且所需验证通过。
      用户确认原文：“\"以优化委托和交付为单位\" 合理的     这个形式ok。”
  - identity: earlier-record-conflict
    nature: informative
    decision: accepted
    content: |
      用户已裁决本次优化探索仅保留当前 optimization-flow 记录（explorationId 20261103T031501Z-1c618bb0），删除较早的同主题记录 optimization-workflow-simplification（explorationId 20261103T025745Z-f614fb17）。用户原文：“删除另外一份。  保留现在我们使用的这一份即可。”
      已通过 xirang record discard 20261103T025745Z-f614fb17 --json 执行，CLI 返回 discarded: true。旧记录中每项全量测试、批末必做 Review、失败必二分的冲突不再作为当前确认来源；本次探索以当前记录为准。
  - identity: fresh-optimizer-followup
    nature: normative
    decision: accepted
    content: |
      每次 Opt 完成本次委托并交付后，由主 Agent 判断是否值得继续优化。Opt 交付只表示本次工作已交付，不表示整个 Optimization 必须结束。
      主 Agent 可将具体问题交回 Opt 修正；也可委托新的 fresh-context Opt 探索新机会，无需先自行发现具体新方向。不得强制每轮再启动 fresh Opt，也不设置固定轮数或要求证明已不存在任何优化机会才可停止。继续与否综合已有收益、已覆盖范围、潜在机会和额外投入成本判断，没有新发现或收益已很小时可以停止。
      新 Opt 独立读取当前代码，可以读取前轮结果与失败记录，避免重复已证伪的尝试；不需要继承前轮完整推理上下文。前轮优化后的新代码状态也可能呈现新的优化机会。
      最终验证可覆盖多次委托的累计改动，不要求每次交付都执行全量测试或增量 Review；发现具体风险时及时验证。主 Agent 决定不再追加优化后，完成必要验证并收尾。
      用户对上述规则确认：“可以的。”
  - identity: optimization-persistence-boundaries
    nature: normative
    decision: accepted
    content: |
      优化记录采用必要边界必存、中途按需的保存方式。
      开始修改前保存委托起点，包括委托范围、起始代码状态、关联基线 Review 与可恢复位置，使中断后可辨明起点和授权范围。
      放弃一项已尝试的优化时保存事项、原因与处理结果，避免后续 Opt 重复尝试，并保证最终告知用户；不将此类记录一律推迟至最终交付。
      交付、主动暂停或交回主 Agent 时保存当前进展、实际测试结果与遗留问题。最终完成时保存主 Agent 的验证结论。
      其余中间进度由 Opt 按实际恢复和交接需要保存，例如工作较长、即将进行较大调整或上下文将耗尽时，不强制每个小动作登记。
      保存进度不要求同时创建 Git commit；需要保存可恢复代码状态时按已确认 checkpoint 机制处理。
      用户对“开始修改前、放弃已尝试的优化时、交付或主动暂停时、最终完成时必须保存，其余中途按需保存”确认：“可以的。”
  - identity: optimization-record-and-recovery-design
    nature: normative
    decision: accepted
    content: |
      优化中断后默认检查现场并继续原委托，不因中断固定重启整个优化流程。主 Agent 先确认前一个 Opt 已停止，避免两个执行者同时写入。原 Opt 或接手的新 Opt 读取委托记录、最近进度和当前代码差异，判断实际进展；对未记录、未验证或证据已过期的改动补充检查，再决定继续、修正或撤销。
      保留原委托及历史，不因更换执行者重新建立一整套流程。主 Agent 主动决定开启下一轮新探索时，才建立新的优化委托。
      例如记录显示 A 已完成，但磁盘上还有改到一半的 B，接手者检查 B 后决定处理方式，不将 B 直接视为完成，也不自动丢弃 A 和 B。无法辨明改动归属或恢复是否可靠时，交回主 Agent 决定。
      意外中断可能来不及保存最新进度，协议不能假设退出前必有完整报告。中断本身不固定触发整批回滚、重新执行 Review 或重新发现全部优化方向；根据实际证据判断所需恢复和验证。
      用户对默认继续原委托并核对现场恢复的确认：“可以的。没有问题。”
  - identity: optimization-report-content
    nature: normative
    decision: accepted
    content: |
      Opt 交付报告包含四类必要信息，表达形式和详略由 Opt 按工作复杂度自主决定，不规定固定标题、逐项表单或每个方向重复填写。
      一、实际结果：保留的改动、改善内容及影响范围。二、验证证据：测试覆盖的行为、实际结果及证据位置。三、未完成与遗留事项：放弃的优化及原因、改动是否撤销、是否仍有未解决问题；无此类事项时明确说明，无需制造空清单。四、后续建议：是否值得继续优化、是否建议扩大测试或追加 Review，以及理由。
      多项小优化可以合并成简短说明与共享测试证据；复杂算法替换等情形按实际行为约束展开。代码状态、时间、委托标识、记录版本等机械信息由 CLI 生成，Opt 不手工维护哈希或内容重复的报告。
      测试证据须准确关联运行时验证的代码状态，不能直接把后来记录报告时的代码状态当成测试时状态。Opt 可报告本次委托完成且无遗留问题，但是否继续新一轮及整个 Change 是否满足收尾条件仍由主 Agent 判断。
      用户确认原文：“yes 没有问题。 现在就是从cli逐步放权给模型。”
  - identity: optimization-agent-cli-boundary
    nature: normative
    decision: accepted
    content: |
      本次 Optimization 改造将优化排序、分组、继续或放弃的取舍、以及验证范围判断逐步从 CLI 控制转交给模型，具体责任按 Opt 与主 Agent 的已确认分工执行。CLI 保留确定性的记录、关联、版本和代码状态校验及已声明完成条件检查，不代替模型判断自然语言证据是否足够、优化是否值得或下一项做什么。
      用户确认方向：“现在就是从cli逐步放权给模型。”该方向限于本次优化流程设计，不自动扩大到其他未讨论的框架职责。
  - identity: optimization-evidence-based-scope
    nature: normative
    decision: accepted
    content: |
      Opt 以当前 Change 的优化目标和实际影响范围为边界，由模型根据证据判断需要读取与修改的文件，不限制为当前 Change 已涉及的固定实现文件列表，也不限制仅展开一层依赖。
      可按需追踪调用和依赖；可修改相关实现和测试，也可新增、删除或移动完成优化所必要的文件。文件范围可随证据调整，但须服务于当前 Change，保持目标语义与行为，不自动扩大为无关工作。
      遇到无关的历史问题或需要改变需求的机会，记录并交给主 Agent，不自行扩大范围或改变目标语义。涉及公共辅助函数时须检查其他调用方的影响。
      确认用例：优化当前 Change 新增的查询逻辑，需要调整其调用的公共辅助函数，可以纳入，但必须检查其他调用方；顺便重构另一套无关查询系统则超出本次委托。
      用户确认原文：“可以的，这是合理的。这是逐步放权需要的。”
  - identity: optimization-correctness-discoveries
    nature: normative
    decision: accepted
    content: |
      区分优化引入的问题、当前 Change 的原有正确性缺陷、无关历史问题和需求契约冲突，不能把真实缺陷都作为可放弃的优化处理。
      优化引入的问题由 Opt 修正或撤销，并按已确认规则验证。Opt 发现优化前实现已有、被基线 Review 漏掉的当前 Change 正确性缺陷时，将证据交给主 Agent，由主 Agent 判断并安排修正；已确认缺陷解决前不得收尾。主 Agent 可继续委托 Opt 修复或自行处理，修复后追加针对该问题及其影响的独立 Review。
      发现可处理的缺陷不自动将流程永久锁定为 ABORTED_UNSAFE，不要求用户手动重启整个优化流程。无法确认恢复状态可靠时仍按已确认恢复协议停止并交回主 Agent。
      无关历史问题记录并告知，不自动扩大当前工作。需求或契约冲突交给主 Agent 澄清，需要用户决策时询问用户，不由 Opt 擅自改变目标语义。
      用户对上述处理确认：“可以的。”
  - identity: agent-responsibility-over-rigid-flow
    nature: normative
    decision: accepted
    content: |
      本次 Optimization 设计将模型作为能够承担责任、依据事实调整方法的协作者。流程明确目标、授权范围、角色责任、交付及必要保障，具体执行方法交由模型判断，不将每种情况都固化成必须遵循的程序步骤或审批链。
      已确认的测试义务、基线独立 Review、风险验证、证据真实性、失败记录及可靠恢复要求仍成立；方法指导尽量通过 reference 表达为可选实践，允许模型采取更合适的方法。
      用户原文：“现在模型需要当成是人一样。不能用程序流程禁锢死。”
  - identity: optimization-integration-scope
    nature: normative
    decision: accepted
    content: |
      本次优化改造须同步调整主 Agent、Optimizer、Reviewer 与 CLI 的相关职责表达、工具原生权限、质量记录与状态校验、Apply 的优化集成、Archive/Sync 收尾门禁及相应测试。主 Agent 可读取实际代码和证据并判断继续优化及最终验证，不再只允许传递路径和记录结果；不以其判断替代必需的基线独立 Review或缺陷修复后的针对性独立 Review。
      移除 CLI 逐方向排序、选择、重试计数与过时执行状态约束；保留证据关联、新鲜度和已声明完成条件校验。Opt 在工具原生权限中实际可写，Reviewer 继续只读。方法指导在 reference 中表达为可选实践。Apply 其他阶段及不相关框架能力不扩展改造。
      用户对上述放权与集成边界的确认：“yes”。
  - identity: remove-minimum-impact-level
    nature: normative
    decision: accepted
    content: 取消 optimization.minImpactLevel 及固定收益分级门槛，不再要求逐项收益等级或由 CLI 根据等级筛选优化。保留实际收益须有证据、保持目标语义与行为、成本风险相称及可执行验证的要求；Opt 与主 Agent 根据证据和委托约束判断是否值得执行。用户可在委托中直接提出收益与范围约束。用户确认原文：‘可以的，取消这一个 mini impact level 的设计。’
structure:
  elements: []
  relationships: []
  elementKinds: []
  relationshipKinds: []
<!-- XIRANG:SEMANTIC_MODEL_BASELINE
modelState: present
objects:
  element-kind:element:
    identity: element
    contract: optional
    body: "`element` 标识 Semantic Model 中承载规范性语义的普通 Element。层级位置与细化关系由 parent/children 决定，不因 Element Kind 受限；任何 Element 都可以在任意抽象层级出现。"
  element-kind:perspective:
    identity: perspective
    contract: optional
    nodePresentation:
      shape: document
      color: indigo
      border: solid
    body: "`perspective` 标识从一个独立分解角度组织 descendants 的 Element。Perspective 本身表达该分解角度的概念边界，children 构成该角度下的抽象或进一步 Perspectives；它不是 View，也不以颜色、形状或布局定义语义。Perspective 的层级位置与其 children 的 Element Kind 不受 Metamodel 白名单限制，由抽象与细化关系决定。"
  element-kind:project:
    identity: project
    contract: required
    root: true
    body: The single Project Root of the Semantic Model.
  element:agent:
    declaration:
      identity: agent
      kind: element
      parent: agents
      title: Agent
      definition: Agent 是与用户交互、并端到端编排 Realization 的默认执行身份。它可写入项目与 Change 制品，消费 CLI 的查询与投影，在需要时委托 Internal Agents；不得替代用户作出需明确授权的决策，也不得自行重做 CLI 已提供的确定性操作。
    sections:
      - name: 写入获授权制品
        body: |-
          Agent SHALL 在授权范围内写入项目与 Change 制品。

          - **Apply 获准修改项目**
            - Change 已进入 Implementation
            - Agent 写入实现所需项目文件
        acceptanceCases: []
      - name: 消费 CLI 查询与投影
        body: |-
          Agent SHALL 消费 CLI 提供的查询与投影结果推进编排。

          - **需要模型上下文**
            - Agent 需要确定性模型信息
            - 它使用 CLI 查询结果
        acceptanceCases: []
      - name: 按需委托 Internal Agents
        body: |-
          Agent SHALL 在需要独立判断时委托 Internal Agents。

          - **当前实现需要 Review**
            - Apply 完成一次修改
            - Agent 委托 Reviewer 独立评估
        acceptanceCases: []
      - name: 不替代用户授权
        body: |-
          Agent SHALL NOT 替代用户作出需要明确授权的决策。

          - **Candidate 等待确认**
            - CLI 返回有效 review digest
            - Agent 请求用户确认而不自行 promotion
        acceptanceCases: []
      - name: 不重做确定性操作
        body: |-
          Agent SHALL NOT 自行重做 CLI 已提供的确定性操作。

          - **CLI 提供原子转换**
            - Realization 需要 promotion、sync 或 archive
            - Agent 调用 CLI 而不手工模拟转换
        acceptanceCases: []
  element:agent-workbench-projection:
    declaration:
      identity: agent-workbench-projection
      kind: element
      parent: project-tooling-configuration
      title: Agent 工作面投影与同步
      definition: Agent 工作面投影与同步是 CLI 中维护息壤托管的 Agent 工作面及其 instructions、templates 与 references 的能力。它通过共享 artifact sync engine 与 canonical workflow manifest 生成六个固定 workflow skills 与 internal subagent artifacts，将共享片段与 references 物化到项目本地，并保证生成产物的行为等价与长度约束。
    sections:
      - name: 使用共享生成引擎
        body: |-
          Setup 和 update SHALL 使用 shared artifact sync engine 与 canonical workflow manifest 生成受管 workflow skills 与 internal subagent artifacts，并收敛到六个 fixed workflow set。

          - **Setup/update 保持 parity**

            - setup 或 update 写入 workflow skills
            - 两者使用同一个 manifest-derived engine，且输出收敛到六个固定 workflow set
        acceptanceCases: []
      - name: 物化共享片段与 references
        body: |-
          Workflow skill 模板 SHALL 复用共享片段常量，并将长协议物化到 `.xirang/references/` 目录作为唯一物理位置；各工具 skill 目录 SHALL NOT 再包含 references 子目录。

          - **update 物化全部内置 reference**

            - 用户在已配置工具的项目中运行 `xirang update`
            - `.xirang/references/` 包含全部模板声明的 reference 文件
            - 各工具 skill 目录不包含 references 子目录

          - **前缀所有权边界**

            - update 写入 `.xirang/references/`
            - 只逐文件覆盖生成清单内的受管前缀文件，不执行目录级删除，不触碰用户文件
        acceptanceCases: []
      - name: 保持生成产物行为等价
        body: |-
          生成测试 SHALL 验证 manifest-derived projections 保持一致，且代表性 workflow/tool 组合的生成 skill artifacts 与已批准基线行为等价。

          - **投影 parity 检查**

            - CI 运行模板生成测试
            - 检测缺失 exports 或缺失 workflow registration
        acceptanceCases: []
      - name: 维护 internal subagent 制品
        body: |-
          系统 SHALL 显式注册 `xirang-reviewer`、`xirang-optimizer` 与 `xirang-experimenter` 三个 internal subagents，并按工具原生格式渲染与写入 subagent artifacts。

          - **显式注册三个 internal subagents**

            - 读取 internal subagent 模板常量
            - 只包含 `xirang-reviewer`、`xirang-optimizer` 与 `xirang-experimenter` 三个显式条目

          - **写入路径遵循工具原生规范**

            - 为支持的工具生成 internal subagent artifact
            - 写入 `<projectRoot>/<agentsDir>/agents/<name>.<ext>`，不指向任何全局 agent 目录
        acceptanceCases: []
      - name: 遵守生成行数约束
        body: |-
          生成的 workflow `SKILL.md` 与 reference 文件 SHALL 分别不超过 200 行与 500 行。

          - **超标报告**

            - 存在超标的 `SKILL.md` 或 reference 文件
            - 测试按文件分组报告变体、最大行数与超限行数，不汇总同一 skill 目录的总行数
        acceptanceCases: []
  element:agents:
    declaration:
      identity: agents
      kind: element
      parent: participants
      title: Agents
      definition: Agents 是可代表息壤推进 Realization 的执行主体。它们理解 Semantic Model 与项目证据，形成或调和 Change，实现 Change，组织独立评估，并在用户授权下推进模型构建与 Change 收束；Agents 分为 Agent 与 Internal Agents。
    sections:
      - name: 理解语义与项目证据
        body: |-
          Agents SHALL 理解 Semantic Model、Change、用户决策与项目证据，并以其作为推进依据。

          - **判断下一步行动**
            - Agent 接手 Realization
            - 它先读取适用语义与证据
        acceptanceCases: []
      - name: 形成或调和 Change
        body: |-
          Agents SHALL 按适用 Formation Path 形成或调和 Change。

          - **Change 尚未形成**
            - 用户意图或已有实现需要规范化
            - Agent 使用 Intent-first 或 Implementation-first Path
        acceptanceCases: []
      - name: 实现 Change
        body: |-
          Agents SHALL 将已形成 Change 落实到项目。

          - **Change 进入 Implementation**
            - Change 已完成 Formation
            - Agent 依据 Expected Semantic Model 修改项目
        acceptanceCases: []
      - name: 组织独立评估
        body: |-
          Agents SHALL 组织对项目结果的独立评估。

          - **Apply 产生项目状态**
            - 当前实现可供验证
            - Agent 委托适用 Internal Agent 评估
        acceptanceCases: []
      - name: 经授权推进构建与收束
        body: |-
          Agents SHALL 仅在用户授权下推进 Semantic Model Build 与需要授权的 Change 收束事项。

          - **授权尚未获得**
            - 下一状态转换需要用户确认
            - Agent 暂停推进并请求授权
        acceptanceCases: []
      - name: 分为两类协作身份
        body: |-
          Agents SHALL 分为 Agent 与 Internal Agents。

          - **分配执行与判断**
            - Realization 同时需要编排和独立评估
            - 分别由 Agent 与 Internal Agent 承担
        acceptanceCases: []
  element:apply:
    declaration:
      identity: apply
      kind: element
      parent: change-implementation
      title: Apply
      definition: Apply 是 Change Implementation 中落实项目改动的活动。它以 Expected Semantic Model 为目标，结合 Change Plan 与当前项目状态，落实 Change 要求的全部项目改动；在 `tasks.md` 存在时按其中的执行与验证安排推进；在 Verify 返回 Required Corrections 或已确认的优化事项时继续完成相应改动。
    sections:
      - name: 以 Expected Semantic Model 为目标
        body: |-
          Apply SHALL 以 Expected Semantic Model 为项目目标状态。

          - **开始 Change Implementation**
            - 当前模型与 Delta 可推导 Expected Model
            - Apply 依据该目标判断实现工作
        acceptanceCases: []
      - name: 落实全部项目改动
        body: |-
          Apply SHALL 结合 Change Plan 与当前项目状态落实 Change 要求的全部项目改动。

          - **Change 含多个影响面**
            - 实现尚未覆盖全部目标语义
            - Apply 继续直到完整落实
        acceptanceCases: []
      - name: 遵循现有 Tasks 安排
        body: |-
          当 `tasks.md` 存在时，Apply SHALL 按其中的执行与验证安排推进。

          - **Change 具有任务清单**
            - Apply 开始执行
            - 工作按适用任务安排推进
        acceptanceCases: []
      - name: 处理 Required Corrections
        body: |-
          Verify 返回 Required Corrections 时，Apply SHALL 完成相应修正。

          - **Review 未通过**
            - 当前状态收到阻塞修正项
            - Apply 修正实现并重新进入 Review
        acceptanceCases: []
      - name: 实现已确认优化事项
        body: |-
          Verify 返回已确认优化事项时，Apply SHALL 完成相应实现。

          - **Optimization 选择事项**
            - 事项返回 Apply
            - Apply 实现后重新进入 Review
        acceptanceCases: []
      - name: 产出可独立评估的项目状态
        body: |-
          Apply SHALL 产出可交由 Verify 独立评估的项目状态。

          - **一轮 Apply 完成**
            - 当前修改已完成
            - 项目状态可供 clean-context Review
        acceptanceCases: []
      - name: 提供可复现证据
        body: |-
          Apply SHALL 为当前项目状态提供可复现证据。

          - **状态交给 Verify**
            - Apply 声明当前实现可评估
            - Verify 可取得证明目标行为的证据
        acceptanceCases: []
  element:apply-quality-integration:
    declaration:
      identity: apply-quality-integration
      kind: element
      parent: apply
      title: Apply Quality Integration
      definition: Apply Quality Integration 定义 Apply 与 Quality 的集成契约：Review 记录先写回再持久化、以轮为单位的优化循环、失败方向记录、主 agent 与 subagent 的角色分工、配置驱动的优化控制，以及 Apply reference 拥有的 checkpoint 编排。它不定义 Quality 自身的状态判定与命令面。
    sections:
      - name: Review 记录先写回再持久化
        body: |-
          `xirang-apply-change` SHALL 先委托 fresh reviewer，再校验其结构化 payload，只应用 CRITICAL `writeBackPlan`，最后调用 `xirang quality review` 持久化该 payload。CLI 持久化 SHALL 发生在 writeback 之后，使 `tasksFileHash` 对应最终写入的 `tasks.md`。

          - **CRITICAL writeback 先于记录**

            - reviewer 返回包含 CRITICAL `writeBackPlan` 的合法 payload
            - Apply SHALL 先更新 `tasks.md`
            - SHALL 在更新完成后调用 `xirang quality review "<change-name>" --input '<json>' --json`
            - CLI SHALL 从最终 `tasks.md` 计算 `tasksFileHash`

          - **非 CRITICAL finding 不写回**

            - reviewer payload 只包含 WARNING 或 SUGGESTION
            - Apply SHALL NOT 将这些 finding 写入 `tasks.md`
        acceptanceCases: []
      - name: 优化循环以轮为单位
        body: |-
          `xirang-apply-change` SHALL 从生成 reference 读取优化循环协议。每轮 SHALL 创建非空 baseline commit、调用 fresh optimizer 取得方向台账、只实现本轮选中的方向、由 master 按 TDD 编码，再由 fresh reviewer 复核并通过 `xirang quality review` 记录该轮结论。普通实现轮次 SHALL NOT 创建 commit；Checkpoint 使用 git commit，失败回滚使用 `git reset --hard HEAD` 与 `git clean -fd`。

          - **方向驱动的优化循环**

            - Optimization 开始
            - apply SHALL 创建非空 baseline checkpoint，并将其 SHA 写入 `.apply-isolation.json.optimizationBaselineCommit`
            - SHALL 委托 fresh optimizer 取得方向台账
            - SHALL 只实现本轮唯一选中的方向
            - SHALL 委托 fresh reviewer 复核该轮改动
            - SHALL 在该轮结束后重新判断剩余方向

          - **成功 checkpoint 包含方向 ID**

            - 选中的方向通过该轮复核
            - apply SHALL 创建包含方向 ID 的增量 checkpoint commit
            - SHALL 保留该 commit 供后续轮次作为最近成功状态

          - **失败回滚保留 quality 记录且不残留改动**

            - 该轮复核返回 `FAIL_NEEDS_CORRECTIONS`
            - CLI 已把失败事件与失败方向写入 quality 记录
            - Apply SHALL 把三份当前状态文件 `.quality-state.json`、`.quality-log.jsonl`、`.apply-isolation.json` 与完整质量历史目录保存到 repository 外并记录清单与 SHA-256
            - SHALL 在确认当前 `HEAD` 为最近成功 checkpoint 后执行 `git reset --hard HEAD` 和 `git clean -fd`
            - SHALL 恢复三份当前状态文件与完整质量历史目录，并校验文件集合及各自 SHA-256
            - 恢复失败、hash 不匹配或仍有未回滚文件时 SHALL 停止
        acceptanceCases: []
      - name: 失败方向记录
        body: |-
          系统 SHALL 以方向 ID、目标位置、关键设计边界与 reviewer 失败证据记录失败方向。未达 `optimization.directionRetries` 时 optimizer MAY 提供实质不同的方案；达到上限后该方向 SHALL 被否决，但系统 SHALL 继续评估其他方向。

          - **记录方向失败**

            - 选中方向的该轮复核失败
            - 系统 SHALL 追加该方向的失败事件与失败证据
            - SHALL 在失败方向记录中写入该方向的设计边界与失败原因

          - **后续 optimizer 避免重复**

            - optimizer 重新判断方向
            - SHALL 读取失败方向记录
            - SHALL NOT 通过换措辞重复已达上限的方向
        acceptanceCases: []
      - name: 主 agent 和 subagent 角色分工
        body: |-
          系统 SHALL 区分三类职责：reviewer 判断行为是否正确；optimizer 判断正确实现是否值得及如何优化；master agent 负责 TDD 编码、证据收集与有证据的撤销。Master SHALL 按选中方向的 keyDesign 与 preservation constraints 实现，MUST NOT 自行生成、跳过或否决优化方向。要撤销某个方向时 SHALL 在台账中提交理由与证据。

          - **optimizer 提供判断与关键设计**

            - 优化轮次执行
            - 系统 SHALL 委托 fresh optimizer
            - optimizer SHALL 输出方向、修改意见、keyDesign 与 validation
            - SHALL NOT 修改文件或输出逐字补丁

          - **master 实现选中方向**

            - CLI 已记录本轮选中方向
            - master SHALL 按 TDD 修改代码与测试
            - SHALL 记录方向 ID 及任何非实质实现细节差异

          - **reviewer 独立复核**

            - master 完成选中方向
            - 系统 SHALL 委托 fresh reviewer
            - reviewer SHALL 判断 preservation constraints 是否保持
            - SHALL NOT 重新判断该方向是否值得优化
        acceptanceCases: []
      - name: 配置驱动优化控制
        body: |-
          `optimization.enabled` SHALL 控制 Optimization 是否运行；`optimization.directionLimit` SHALL 限制可选取的新方向数；`optimization.directionRetries` SHALL 只限制同一方向的失败次数，不限制成功轮次数；`optimization.minImpactLevel` SHALL 声明可选取的最低 `impactLevel`，未配置时视为 `low`。门槛由 CLI 在选择阶段确定性执行，低于门槛的方向永不被选中。

          - **方向数上限与失败额度互不消耗**

            - `directionRetries` 为 2 且存在三个依次通过复核的方向
            - 三个方向 SHALL 均允许完成，成功不消耗失败额度

          - **门槛由 CLI 确定性执行**

            - 已配置 `minImpactLevel` 且某方向低于该值
            - CLI 在选择阶段不选取该方向
            - 当全部待选方向均低于门槛时该轮以 `NO_ACTIONABLE` 收口
        acceptanceCases: []
      - name: Apply 读取 Quality 诊断信息
        body: |-
          当 quality 状态记录存在时，apply SHALL 读取其中的诊断信息，把它作为修复上下文注入任务实现循环。

          - **检测到失败的 Review 记录**

            - apply 检测到 `.xirang/changes/<name>/.quality-state.json` 存在且 result 为 `FAIL_NEEDS_CORRECTIONS`
            - apply SHALL 读取该记录的 `issues` 数组
            - 对每个被 unmark 的 task，将对应的 issue 作为修复指导注入上下文

          - **检测到 Required Corrections section**

            - apply 读取 `tasks.md` 发现存在 `## Required Corrections` section
            - apply SHALL 将修正事项条目视为优先修复项
            - SHALL 在实现被 unmark 的 task 时引用对应条目作为修复方向

          - **artifact_fix 类型的修正事项处理**

            - apply 遇到 `[artifact_fix]` 类型的修正事项条目
            - apply SHALL 修改对应的 artifact 而非代码
            - SHALL 标记该修正事项为完成

          - **记录通过或不存在**

            - quality 状态记录不存在，或 result 为 `PASS` 或 `PASS_WITH_WARNINGS`
            - apply SHALL 按原有逻辑执行，不注入额外修复上下文
        acceptanceCases: []
      - name: Apply reference 拥有 checkpoint 编排
        body: |-
          checkpoint 创建、成功提交、失败回滚与状态恢复 SHALL 由 Apply reference 定义。Reviewer 合约 SHALL 只负责该轮复核结论，不得创建、恢复或消费 git checkpoint。

          - **Reviewer 只返回复核结论**

            - reviewer subagent 执行该轮复核
            - reviewer SHALL 验证选中方向的 preservation constraints
            - SHALL NOT 执行 git commit、reset、clean 或 worktree 操作

          - **Apply reference 编排 checkpoint**

            - Apply 模板执行优化循环
            - reference SHALL 定义非空 baseline commit 与成功方向 checkpoint commit
            - SHALL 定义失败时对 quality 记录与 `.apply-isolation.json` 的 repository-external snapshot、实现回滚、原子恢复与 SHA-256 校验
            - SHALL 保留失败历史、失败方向与 `optimizationBaselineCommit`

          失败回滚的 repository-external 保存范围 SHALL 包含三份当前状态文件 `.quality-state.json`、`.quality-log.jsonl`、`.apply-isolation.json` 和完整质量历史目录。Apply reference SHALL 先保存清单与 SHA-256，再回滚 speculative code，最后恢复并校验全部当前及历史文件；未跟踪的历史不得被 `git clean -fd` 永久清除。恢复不完整时停止，不进入后续优化判断。
        acceptanceCases: []
      - name: 共享恢复 reference 编排重验
        body: |-
          Apply SHALL 提供共享恢复 reference，Archive SHALL 复用同一 reference；恢复使用现有 `quality review`、`quality optimize`、`quality status` 和 `quality seal`，不提供 `xirang quality reset` 子命令。

          遇到 `ABORTED_UNSAFE` 时，Agent SHALL 保留阻塞观察与 CLI 诊断，停止自动推进，并加载恢复 reference 说明后续行动。用户明确要求重新开始验证（例如“从头 review optimize”）即授权 Agent 保存历史、轮换当前质量记录并记录原因，无须用户手工执行或重复确认同一意图。其他优化终态后的显式重验使用同一流程。未获得重启授权时保持停止，不把普通修正、回滚或中断续跑自动升级为重启。

          恢复前 SHALL 确认原流程已停稳，无仍在运行的 Reviewer、Optimizer、实现任务或待处理结果、回写、提交、回滚。恢复 SHALL 沿用 `.apply-isolation.json` 的工作区身份与不可变 `baseCommit`，不重新初始化隔离，不自动回退或删除代码，也不删除已有 commits/checkpoints。Agent 依据已知任务与工作区信息遵守串行前提；CLI 不承担外部 subagent 进程检测或取消职责。

          Apply 的进入与中断续跑 SHALL 在依据根目录记录路由到 Review 前检查未完成的轮换；部分缺失不得被误当作可以新建活动记录的入口。

          Agent SHALL 按受控轮换规则保存并校验旧快照、日志与原因，轮换完成后检查 `quality status` 为 `dirty`，再委派 fresh Reviewer。新 Review 失败返回修正循环；通过后才按现有规则建立或验证本轮 checkpoint 并进入 Optimization。新台账不继承旧终态或计数，历史仅供判断参考。

          - **已有明确请求**：用户说“从头 review optimize”，原流程已结束；Agent 执行恢复 reference，不再次询问是否重启。
          - **未授权 unsafe**：Optimizer 报告冲突并记为 `ABORTED_UNSAFE`，用户尚未要求重启；Agent 展示问题与恢复路径，不轮换记录或自动修正后复审。
          - **保留原工作区**：原 Change 使用 worktree，已有 `baseCommit` 和多个 checkpoint；重启保留同一 worktree 身份、原证据基线、代码与 commits，新 Review 自主读取当前实现。
        acceptanceCases: []
      - name: 恢复交付的验证证据
        body: |-
          恢复实现的交付 SHALL 具有可复现的行为证据。既有状态引擎与 CLI 回滚测试 SHALL 保护历史 PASS 匹配后最新失败计数、方向状态和 unsafe 终态仍保留的行为；优先修改现有测试，不建立平行的重复套件。

          reference 中的文件操作 SHALL 通过一次性临时 Change 与临时 Git 仓库流程验证，不为解释性文档措辞新增持久锁词测试。验证 SHALL 覆盖：代码未变时轮换后仍须新 Review，Optimization 新额度从零开始；保存或轮换中断不丢历史；后续失败优化回滚仍保留历史；Apply、Archive 生成结果可达同一恢复 reference，Reviewer 与 Optimizer 能读取历史。

          持久测试 SHALL 验证可观察状态或 CLI 门禁，可因真实行为变异而失败；构建、类型检查、平台路径与生成结果检查 SHALL 保留一次性证据。路径操作 SHALL 具有 Windows 与 POSIX 一致的验证结果。
        acceptanceCases: []
  element:apply-role:
    declaration:
      identity: apply-role
      kind: element
      parent: agent
      title: Apply Role
      definition: Apply 是 Agent 落实 Change 所描述项目改动的工作身份。它以 Expected Semantic Model 为目标，结合 Change Plan 与当前项目状态修改项目；在存在执行安排时按安排推进，并处理 Verify 返回的 Required Corrections 与已确认优化事项。
    sections:
      - name: 写入项目实现
        body: |-
          Apply Role SHALL 在 Change Implementation 范围内修改项目文件。

          - **Apply 识别待落实改动**
            - 当前状态不符合 Expected Semantic Model
            - Agent 写入实现所需修改
        acceptanceCases: []
      - name: 接收 Verify 返回事项
        body: |-
          Apply Role SHALL 接收 Required Corrections 与已确认优化事项，并再次执行 Apply。

          - **Verify 返回工作**
            - 当前状态需要修正或优化
            - Agent 将事项带回写入活动
        acceptanceCases: []
      - name: 交付状态与证据
        body: |-
          Apply Role SHALL 将 Apply 产出的项目状态与可复现证据交付给 Verify。

          - **一轮写入完成**
            - Agent 完成当前实现工作
            - 它组织独立 Review
        acceptanceCases: []
  element:archive-quality-gate:
    declaration:
      identity: archive-quality-gate
      kind: element
      parent: change-closure
      title: Archive Quality Gate
      definition: Archive Quality Gate 定义归档前必须具备的质量记录门禁：必须先存在与当前代码一致且通过的 Review 记录，并且 Optimization 已收口且终态不是 ABORTED_UNSAFE；freshness 基于显式持久化的证据判定，archive rerun 复用与 standalone quality 一致的 subagent-orchestrated 执行模型。它不定义 Review 与 Optimization 自身的判断标准，也不定义归档移动、git 交接或 sync 的行为。
    sections:
      - name: 归档前必须具备新鲜的完整验证记录
        body: |-
          系统 SHALL 在归档任意活动 change 之前取得一份与当前代码一致且通过的 Review 记录，并通过 CLI 工具执行门禁校验。该 change SHALL 同时具备已收口的 Optimization 记录，其终态必须与 quality 生命周期语义一致。

          - **Archive 通过 CLI 校验 quality gate**

            - agent 准备归档某个 change
            - CLI 校验 quality 记录为 fresh 且 archive-compatible
            - archive SHALL 复用该结果继续执行后续归档步骤
            - SHALL NOT 退回到轻量 inline conformance check

          - **Review 记录缺失或状态为 dirty 时由 CLI 提示**

            - agent 调用 archive 相关 CLI
            - 不存在 quality 状态记录，或当前代码与通过的 Review 记录不一致
            - CLI SHALL 以 exit 1 退出并输出具体原因
            - agent SHALL 向用户展示选项：先运行 quality Review / 强制继续 / 放弃

          - **优化被跳过的记录仍然有效**

            - Optimization 终态为 `SKIPPED`
            - 跳过原因合理（config 禁用或用户显式拒绝）
            - 结果 SHALL 被视为 archive-compatible

          - **尚未收口时不得归档复用**

            - 还没有任何 Optimization 收口记录
            - 该结果 SHALL NOT 被视为 archive-compatible
            - CLI SHALL 输出未收口的具体原因

          - **ABORTED_UNSAFE 硬阻塞**

            - Optimization 终态为 `ABORTED_UNSAFE`
            - 即使 Review 记录为通过也不得复用
            - CLI SHALL 输出恢复指示

          - **Seal 后仅 Git HEAD 推进时复用记录**

            - Optimization 已收口且记录已通过 seal
            - 当前工作区的 evidence fingerprint 未发生变化
            - 当前 Git HEAD 与记录中的 HEAD 不一致
            - 代码状态 SHALL 保持为 `clean`
            - archive SHALL 复用 archive-compatible 的记录
            - archive SHALL NOT 仅因 HEAD 差异重新执行 full quality 流程
        acceptanceCases: []
      - name: Freshness 基于显式验证证据判定
        body: |-
          系统 SHALL 基于显式持久化的验证证据判定 Review 记录是否可用于归档。Optimization 字段存在不影响 freshness 判定，但其终态会影响 archive 是否可复用该结果。

          - **Freshness 判定标准**

            - archive 检查 Review 记录
            - 系统 SHALL 判定为 fresh 当且仅当 ALL of:
            - 记录的 `evidenceFingerprint` 匹配重新计算的 fingerprint
            - 记录的 `contractVersion` 是当前版本
            - result 为 `PASS` 或 `PASS_WITH_WARNINGS`
            - `tasksFileHash` 不参与 fresh/`dirty` 判定
            - `gitHeadCommit` 不匹配时 SHALL 作为 informational 报告，不单独改变状态判定

          - **Fresh 但 optimization 不可复用**

            - Review 记录通过 freshness 判定
            - Optimization 终态为 `ABORTED_UNSAFE`
            - archive SHALL 仍然拒绝复用该结果
            - SHALL 将其报告为"验证记录新鲜，但优化恢复状态不安全"
        acceptanceCases: []
      - name: Archive rerun 使用 quality 执行模型
        body: |-
          系统 SHALL 在 Review 记录缺失或不一致触发 full quality rerun 时，复用与 standalone quality 一致的 subagent-orchestrated execution model。

          - **archive rerun 复用 subagent orchestration**

            - archive 检测到 Review 记录 missing 或 dirty
            - archive SHALL 执行与 standalone quality 相同的 subagent-orchestrated full quality 合约
            - SHALL 复用相同的 Optimization eligibility、checkpoint 与失败回滚语义

          - **archive-time full quality 不得私自跳过可执行的 Optimization**

            - archive 因 Review 记录缺失或 dirty 而重新执行 full quality 流程
            - 新的 Review result 为 `PASS` 或 `PASS_WITH_WARNINGS`
            - `.xirang/config.yaml` 未禁用 optimization
            - 用户未显式拒绝优化
            - 该流程 SHALL 继续执行与 standalone quality 完全一致的 Optimization 合约
            - SHALL NOT 仅因 archive-time 存在未提交改动风险而降级成 Review-only 流程
            - 只有在 config 禁用或用户显式拒绝时，记录才可包含 `SKIPPED` 终态

          Archive Agent SHALL 与 Apply 使用同一共享恢复 reference。遇到当前 `ABORTED_UNSAFE` 时，SHALL 在常规 dirty/clean 路由前停止自动推进并展示该 reference；用户明确要求重新验证且原流程停止后，才可按 reference 保存并校验历史、轮换活动记录、重新执行 fresh Review 和从零开始的 Optimization。其他优化终态后的显式重验同样适用。未经新轮次有效 Review 和优化收口，不得复用历史目录中的旧 PASS 或终态进入正常归档；既有显式绕过门禁通道的授权规则不受影响。
        acceptanceCases: []
      - name: Archive 与 Sync 双重门禁
        body: |-
          `xirang archive` 命令 SHALL 在执行归档前校验 quality 和 sync 状态。默认强制执行，`--no-verify` 标志提供显式用户授权绕过通道。

          - **双重门禁通过，继续 archive**

            - agent 执行 `xirang archive <change-name>`
            - quality gate 通过（记录 fresh、result 可接受、Optimization 终态非 `ABORTED_UNSAFE`）
            - sync 已完成
            - 系统 SHALL 继续执行 archive 逻辑

          - **门禁不通过，合并询问**

            - agent 执行 `xirang archive <change-name>`
            - quality gate 或 sync gate 任一不通过
            - 系统 SHALL 输出两个门禁的合并状态
            - SHALL 以 exit 1 退出
            - agent SHALL 向用户展示合并选项：先运行 quality+sync / 仅 sync / 强制继续 / 放弃

          - **用户显式授权绕过门禁**

            - agent 执行 `xirang archive <change-name> --no-verify`
            - 用户未同时使用 `--yes` 标志
            - 系统 SHALL 显示风险警告并要求交互式确认
            - 用户拒绝确认
            - archive SHALL 取消并提示使用标准 quality gate
            - 用户确认授权
            - 系统 SHALL 记录 `[AUTHORIZED]` 审计日志
            - SHALL 跳过 quality 和 sync 门禁检查
            - SHALL 继续执行 archive 逻辑

          - **--yes 模式下的 --no-verify 静默绕过**

            - agent 执行 `xirang archive <change-name> --no-verify --yes`
            - 系统 SHALL 跳过交互式确认
            - SHALL 记录 `[AUTHORIZED]` 审计日志
            - SHALL 直接跳过 quality 和 sync 门禁检查
        acceptanceCases: []
  element:archive-role:
    declaration:
      identity: archive-role
      kind: element
      parent: agent
      title: Archive Role
      definition: Archive 是 Agent 在验证有效后编排 Change Closure 的工作身份。它确认入口条件已满足，协调 CLI 将 Semantic Delta 应用于 Semantic Model，并保存已完成 Change 及其最终证据、结束 Change 的活动状态；Archive 不重新判定目标语义，也不替代 CLI 的原子状态转换。
    sections:
      - name: 通过 CLI 编排 Closure
        body: |-
          Archive Role SHALL 依据 Change Closure 的阶段规则调用 CLI 提供的 Sync 与 Archive 操作。

          - **Change Closure 可推进**
            - Closure 活动要求执行确定性状态转换
            - Agent 调用对应 CLI 操作
        acceptanceCases: []
      - name: 限定 Closure 制品处理范围
        body: |-
          Archive Role SHALL 在 Change Closure 范围内协调保存已完成 Change 与最终证据。

          - **CLI 需要 Closure 制品输入**
            - Agent 编排归档操作
            - 它只提供该 Change 及其最终证据
        acceptanceCases: []
      - name: 不重新判定目标语义
        body: |-
          Archive Role SHALL NOT 重新判定 Change 的目标语义。

          - **Agent 编排已验证 Change**
            - Closure 消费 Semantic Delta
            - Agent 使用既有目标而不改写意图
        acceptanceCases: []
      - name: 不替代 CLI 原子转换
        body: |-
          Archive Role SHALL NOT 手工重做 CLI 提供的原子状态转换。

          - **Closure 需要改变规范状态**
            - CLI 提供对应确定性操作
            - Agent 使用 CLI 而不直接模拟转换
        acceptanceCases: []
  element:change:
    declaration:
      identity: change
      kind: element
      parent: semantic-objects
      title: Change
      definition: Change 是承载一次项目演进意图的语义对象，独立建模以使目标变化能够相对于当前 Semantic Model 被形成、实现、验证和收束。它包含规范性的 Semantic Delta 与辅助性的 Change Plan，不包含应用后的稳定 Semantic Model 或负责落实变更的 Realization 过程。
    sections:
      - name: 由 Delta 与 Plan 共同组成
        body: |-
          每个 Change SHALL 包含规范性的 Semantic Delta 与解释意图和路径的 Change Plan；Semantic Delta SHALL 与当前 Semantic Model 共同唯一确定 Expected Semantic Model。

          - **编译 Change**

            - Agent 或 CLI 评估一个活动 Change
            - 系统从当前模型和 Semantic Delta 推导唯一目标状态，并用 Change Plan 辅助执行
        acceptanceCases: []
      - name: 以 Delta 为规范依据
        body: |-
          当 Change Plan 与 Semantic Delta 冲突时，系统 SHALL 以 Semantic Delta 为目标语义依据。

          - **Plan 与 Delta 不一致**

            - Change Plan 描述的目标与 Semantic Delta 不同
            - Agent 与 CLI 以 Semantic Delta 为目标语义且不使用 Plan 覆盖 Delta
        acceptanceCases: []
  element:change-closure:
    declaration:
      identity: change-closure
      kind: element
      parent: change-realization
      title: Change Closure
      definition: Change Closure 是 Change Realization 中将已验证的 Change 收束为项目新稳定状态的阶段。它以 Change Implementation 的有效验证结果为入口，先通过 Sync 将 Semantic Delta 应用于 Semantic Model，使 Expected Semantic Model 成为新的 Semantic Model；再通过 Archive 原样保存已完成的 Change 及其最终证据，并结束 Change 的活动状态。
    sections:
      - name: 仅接受有效验证结果
        body: |-
          Change Closure SHALL 以仍然有效的 Change Implementation 验证结果为入口，SHALL NOT 基于未验证或已过期的项目状态同步或归档。

          - **验证结果不再有效**

            - Closure 无法确认当前项目状态仍由该验证结果覆盖
            - Closure 拒绝推进并要求重新验证
        acceptanceCases: []
      - name: 先同步后归档
        body: |-
          Closure SHALL 先通过 CLI Sync 将 Semantic Delta 原子应用于 Semantic Model，使 Expected Semantic Model 成为新正式模型；再由 Archive 保存已完成 Change 与最终证据并结束活动状态。

          - **完成 Change Closure**

            - Sync 与 Archive 均成功
            - 项目实现和 Semantic Model 进入一致的新稳定状态
        acceptanceCases: []
      - name: 原样归档 Change 制品
        body: |-
          Archive SHALL 在适用门禁通过后原样移动 active Change directory，SHALL NOT 创建、重算、校验或覆盖任何 View presentation artifact。

          - **Change 不含持久化呈现结果**

            - 一个通过归档门禁的 active Change 不含 View presentation artifact
            - Archive 成功移动该 Change 且不创建额外呈现文件

          - **Change 含已有 legacy 文件**

            - 一个通过归档门禁的 active Change 含已有 legacy presentation file
            - Archive 随目录移动该文件并保持其内容字节不变
        acceptanceCases: []
  element:change-formation:
    declaration:
      identity: change-formation
      kind: element
      parent: change-realization
      title: Change Formation
      definition: Change Formation 是 Change Realization 中形成完整 Change 的阶段。它在阶段内完成必要的审查与确认，并产出完整的 Semantic Delta 与 Change Plan；它可以通过 Intent-first Path 或 Implementation-first Path 完成。
    sections:
      - name: 产出完整 Semantic Delta
        body: |-
          Change Formation SHALL 产出完整 Semantic Delta。

          - **目标语义已明确**
            - Formation 完成
            - Delta 完整表达该 Change 的目标语义
        acceptanceCases: []
      - name: 产出适用的完整 Change Plan
        body: |-
          Change Formation SHALL 产出对所选形成路径完整且适用的 Change Plan。

          - **Intent-first Formation**
            - 实现尚未发生
            - Plan 包含意图、决策、执行与验证安排

          - **Implementation-first Formation**
            - 实现已经发生
            - Plan 包含意图与决策说明且不虚构 tasks
        acceptanceCases: []
      - name: 完成 Formation 审查与确认
        body: |-
          Change Formation SHALL 在本阶段内完成必要审查与确认。

          - **Change 存在未决目标语义**
            - 关键语义尚未确认
            - Formation 不得完成
        acceptanceCases: []
      - name: 选择 Formation Path
        body: |-
          Change Formation SHALL 通过 Intent-first Path 或 Implementation-first Path 完成。

          - **选择形成路径**
            - Agent 判断实现是否已经发生
            - 使用与事实相符的 Formation Path
        acceptanceCases: []
      - name: 形成可进入实现的 Change
        body: |-
          Change Formation 完成后，完整 Change SHALL 可进入 Change Implementation。

          - **Formation 出口**
            - Delta、Plan、审查和确认均已完成
            - Change 进入 Change Implementation
        acceptanceCases: []
  element:change-implementation:
    declaration:
      identity: change-implementation
      kind: element
      parent: change-realization
      title: Change Implementation
      definition: Change Implementation 是 Change Realization 中落实 Change 并确认其结果的阶段。Agent 依据 Semantic Model、Semantic Delta 与 Change Plan，将 Change 描述的内容落实到项目，并通过独立评估与可复现证据确认项目结果与 Expected Semantic Model 一致；验证通过后，Change 可进入 Change Closure，本阶段不以 Semantic Delta 更新 Semantic Model，也不关闭 Change。
    sections:
      - name: 实现并独立验证目标状态
        body: |-
          Change Implementation SHALL 由 Apply 依据 Expected Semantic Model 修改项目，并由 Verify 使用独立判断与可复现证据确认完整性、正确性和一致性。

          - **Apply 修改项目**
            - 项目状态在 Verify 后发生任何修改
            - 修改后的状态必须重新接受 Review
        acceptanceCases: []
      - name: 不在本阶段更新正式模型
        body: |-
          Change Implementation SHALL NOT 将 Semantic Delta 应用于正式 Semantic Model，也 SHALL NOT 关闭 Change。

          - **Verify 通过**
            - 最新项目状态通过 Review 且 Optimization 完成
            - Change 获得进入 Closure 的资格但尚未同步或归档
        acceptanceCases: []
  element:change-realization:
    declaration:
      identity: change-realization
      kind: element
      parent: realization-process
      title: Change Realization
      definition: Change Realization 是 Realization 推进过程中落实单次 Change 的过程。它通过 Change Formation 形成完整 Change，通过 Change Implementation 实现并验证，再通过 Change Closure 将经验证的 Semantic Delta 更新到 Semantic Model 并关闭 Change，使项目实现与语义模型进入新的稳定状态。
    sections:
      - name: 按形成、实现、收束推进
        body: |-
          Change Realization SHALL 先完成 Change Formation，再通过 Change Implementation 落实并验证，最后仅以有效验证结果进入 Change Closure。

          - **推进一个 Change**

            - 用户授权新的演进意图
            - Change 依次形成、实现并验证、同步和归档
        acceptanceCases: []
      - name: 保持实现与模型一致
        body: |-
          Change Closure 完成后，项目实现与同步后的 Semantic Model SHALL 共同进入表达同一用户意图的新稳定状态。

          - **Change 完成**

            - Change 被成功关闭
            - 正式模型表达已验证实现所落实的目标语义
        acceptanceCases: []
  element:checkpoint:
    declaration:
      identity: checkpoint
      kind: element
      parent: quality
      title: Checkpoint
      definition: Checkpoint 是 Quality 中隔离已经通过 Review 的项目状态与尚未通过 Review 的优化改动的机制。首次 Review 通过后形成 baseline checkpoint，每个优化轮次经 Apply 实现并重新通过 Review 后形成新的 successful checkpoint；优化改动未通过 Review 时项目恢复到最近的 successful checkpoint。
    sections:
      - name: Checkpoint 隔离状态
        body: |-
          Quality SHALL 使用 Checkpoints 隔离已经通过 Review 的项目状态与尚未通过 Review 的优化改动。

          - **Baseline checkpoint 形成**

            - 首次 Review 通过
            - 当前项目状态形成 baseline checkpoint

          - **Successful checkpoint 推进**

            - 优化轮次经 Apply 实现并重新通过 Review
            - 当前项目状态形成新的 successful checkpoint

          - **优化失败恢复**

            - 优化轮次未通过 Review
            - 项目恢复到最近的 successful checkpoint
            - 保留 Review 结论、失败方向与优化判断记录
            - 基于恢复后的项目状态继续评估

          - **最新状态成为 successful checkpoint 才完成 Quality**

            - 最新项目状态已成为 successful checkpoint
            - Optimization 已收口
            - Review 证据仍然有效
            - Quality 完成并允许 Change 进入 Change Closure
        acceptanceCases: []
  element:cli:
    declaration:
      identity: cli
      kind: element
      parent: interaction-surfaces
      title: CLI
      definition: CLI 是息壤的配置与确定性操作界面。它建立和维护息壤工作区、项目配置与所选 Agent 工具集成，管理息壤配置，并在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
    sections:
      - name: 提供一致可复现的操作
        body: |-
          CLI SHALL 管理工作区、项目配置与 Agent 工具集成，并为 Realization 提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化和原子状态转换。

          - **Agent 执行确定性操作**

            - Agent 需要查询、校验、同步、提升或归档
            - CLI 对相同有效输入产生一致结果，并以明确失败语义拒绝无效操作
        acceptanceCases: []
      - name: 保持 Agent 与 CLI 职责分离
        body: |-
          CLI SHALL 负责可确定性复现的操作，SHALL NOT 替代用户授权或 Agent、Reviewer、Optimizer 的语义判断。

          - **操作需要目标语义决策**

            - 输入不足以唯一决定目标层级或行为
            - CLI 报告问题而不创作或规范化语义
        acceptanceCases: []
      - name: 提供 model-driven authoring help
        body: |-
          `xirang help authoring semantic-delta` SHALL 从当前项目 Semantic Model 的 Metamodel 只读投影 Relationship Kinds，SHALL NOT 维护代码内置默认 relationship kinds 或预设 relationship entries。

          - **Relationship Kinds 来自当前 Metamodel**

            - 用户运行 `xirang help authoring semantic-delta`
            - output SHALL 列出当前 `.xirang/model/metamodel/` 声明的全部 Relationship Kinds
            - SHALL NOT 包含当前 Metamodel 未声明的 Kind

          - **同时指导 Relationship 与 Relationship Kind 新增**

            - help 渲染 authoring 指导
            - output SHALL 包含新增 Relationship 的占位语法
            - SHALL 包含新增 Relationship Kind 的占位语法
            - SHALL NOT 输出预设的 Relationship entries 或伪 Element identities

          - **端点约束区分缺失与显式空**

            - Relationship Kind 的 `sourceKinds` 或 `targetKinds` 缺失
            - help SHALL 显示为 unrestricted
            - Relationship Kind 的 `sourceKinds` 或 `targetKinds` 为显式空数组
            - help SHALL 显示为不允许任何 Element Kind
            - 两种语义 SHALL NOT 合并为同一显示

          - **Kind body 原样输出**

            - Relationship Kind 声明了非空 body
            - help SHALL 原样输出该 body
            - SHALL NOT 由 CLI 补写、摘要或改写其语义

          - **缺失或空 Semantic Model 被拒绝**

            - 当前项目缺少 `.xirang/model/` 或该目录存在但无任何 Element Kind 与 Element
            - help SHALL 报告 Semantic Model unavailable 而非显示空 Kind 列表

          - **语义无效 Semantic Model 被拒绝**

            - 当前 Semantic Model 存在 ERROR 级别 semantic diagnostic
            - help SHALL 报告该 diagnostic 而非基于无效模型生成输出

          - **Authoring help JSON 返回 Metamodel 声明**

            - 用户运行 `xirang help authoring semantic-delta --json`
            - stdout SHALL be valid JSON with `file`、`definition`、`relationshipDelta` 和 `relationshipKinds`
            - `relationshipKinds` SHALL 包含当前 Metamodel 声明的 Kind identity、可选 endpoint constraints 与 body
            - SHALL NOT 包含名为 `relations` 的虚构 Relationship entries 属性
        acceptanceCases: []
      - name: 从已安装运行时启动嵌入式 LikeC4
        body: |-
          `xirang view` SHALL 在缺少 LikeC4 workspace 源码的部署安装中从随包发布的 LikeC4 dist 启动嵌入式浏览器服务，且 SHALL NOT 因缺少 workspace 源码或 tsx 而失败；在包含 LikeC4 workspace 源码的开发环境中，CLI SHALL 在任一 CLI runtime 包的源码新于其 dist 产物时以 tsx 从源码运行，否则 SHALL 使用 dist。

          - **生产安装后启动浏览器服务**

            - 用户通过 `scripts/build_and_install.sh` 全局安装 xirang 后运行 `xirang view`
            - CLI 从随包部署的 LikeC4 dist 启动嵌入式浏览器服务
            - 不因缺少 workspace 源码或 tsx 而失败

          - **开发环境 dist 陈旧回退源码**

            - 开发环境中任一 CLI runtime 包的源码新于其 dist 产物
            - CLI 以 tsx 从源码运行
            - 输出重建生产构建的提示

          - **开发环境 dist 同步使用构建产物**

            - 开发环境中所有 CLI runtime 包的 dist 产物均不陈旧
            - CLI 使用 dist 运行
        acceptanceCases: []
      - name: 配置 Web 监听地址
        body: |-
          `xirang view` SHALL 接受可选 `--listen <address>` 并将该地址传递给嵌入式 LikeC4 服务；未提供该参数时 SHALL 保持 LikeC4 的默认本地监听策略。

          - **从 Windows 访问 WSL 浏览服务**

            - 用户在 WSL 中运行 `xirang view --listen 0.0.0.0 --port 61000`
            - CLI 在启动前重新生成 LikeC4 缓存，并使服务监听 `0.0.0.0:61000` 以供 Windows 通过转发地址访问

          - **未显式开放网络接口**

            - 用户运行 `xirang view` 且未提供 `--listen`
            - CLI 不注入监听地址并保留 LikeC4 默认绑定行为

          - **自定义端口**

            - 用户运行 `xirang view --port 8080`
            - CLI 在端口 8080 启动浏览器服务
            - 输出服务器地址 `http://localhost:8080`
        acceptanceCases: []
  element:collaboration-structure:
    declaration:
      identity: collaboration-structure
      kind: perspective
      parent: realization
      title: 协作结构
      definition: 协作结构是按谁授权、判断、编排和操作的协作角度组织 Participants 与 Interaction Surfaces 的 Perspective。它包含用户、Agents 及其使用的界面结构，不包含落实工作的阶段顺序、入口或过程结果。
    sections:
      - name: 协作结构维度组织
        body: |-
          collaboration-structure SHALL 从协作角度组织 Realization 的主体与界面：Participants 承担授权、判断与编排，Interaction Surfaces 提供配置、呈现与确定性操作。两个维度在自身层级完整描述，跨维度语义覆盖是允许的。

          - **协作结构容纳主体与界面**

            - 浏览 collaboration-structure 的 descendants
            - 呈现 Participants（用户、Agents 与 Internal Agents）与 Interaction Surfaces（CLI、Web）

          - **工作身份描述所承担活动**

            - Agent 工作身份描述其所承担 Activity 的相关语义
            - 该跨维度语义覆盖是允许的
            - 推进过程与协作结构两个维度都不作为另一个维度的差量表达
        acceptanceCases: []
  element:confirmed-design-record:
    declaration:
      identity: confirmed-design-record
      kind: element
      parent: design-record
      title: 中间设计记录
      definition: 中间设计记录是 Design Record 维护的当前设计制品，独立承载形成过程所需的设计状态与依据。它包含具有内容性质和决策状态的自由文本条目、已确认结构目标及相关模型基准；不等同于完整模型、Semantic Delta 或执行计划，也不独立确定 Expected Semantic Model。
    sections:
      - name: 以条目与结构两部分表达确认内容
        body: |-
          记录 SHALL 包含条目与结构两部分。每条条目具有稳定 identity、nature（normative 或 informative）、decision（pending、accepted 或 excluded）及自由文本 content，可用多行文本保留条件、例外、具体例子和必要依据，不设 examples、counterexamples、timing 等固定细节子字段。nature 表达内容性质，decision 表达用户决策，二者相互独立；有条目不等于已确认，更不等于实现义务。

          结构部分按 Semantic Model 的形状，以语义 identity 表达 Element Declarations、Relationships、Element Kinds、Relationship Kinds；Relationship 使用 source、kind、target。纳入结构部分即表示用户已确认该对象及出现的字段，只保存已确认结构目标。未确认方案留在 pending 自由文本中，不要求先结构化，不引入第二套 identity，也不要求完整目标模型。Build 与 Change 形成共享格式，使用独立实例。

          - 只确认一个行为条件即可保存 accepted 条目，不要求先补全 hierarchy。
          - 待确认 Element parent 记入 pending 自由文本；用户确认后才纳入结构部分。
          - informative 实验依据不因实验成功成为 accepted normative 设计。
        acceptanceCases: []
      - name: 结构部分表达目标状态
        body: |-
          结构部分的每个对象 SHALL 表达用户确认后的目标状态；删除 SHALL 以 `removed: true` 显式标出。未出现在结构部分的对象只表示尚未确认，SHALL NOT 解释为删除。记录 SHALL NOT 保存 ADDED / MODIFIED / REMOVED 操作；新增或修改由 CLI 对照当前模型推导并报告，编译时再生成带 operation 的 Delta。Element Declaration MAY 只含已确认的字段；后续字段确定时若需修改已确认字段，SHALL 经用户裁决。

          - **未提及不等于删除**

            - 记录结构部分只含 Element A，而当前模型还有 Element B
            - B 视为尚未确认，不生成删除。

          - **显式删除**

            - 用户确认删除 Element C
            - 结构部分以 identity C 加 `removed: true` 表达，编译为 REMOVED Delta 条目。

          - **部分确认的 Declaration**

            - 用户只确认 Element D 的 parent 与 kind，definition 未定
            - 记录只含这两个字段；之后 definition 确定时发现 parent 需调整，经用户裁决后修改，并标为修改已确认字段。

          - **模型变化后重新推导**

            - 记录对象时当前模型不含该对象，之后另一 Change 已加入同一对象
            - CLI 按新模型重新推导为修改或一致，不保留过时的操作标签。
        acceptanceCases: []
      - name: 保持稳定身份与最新状态
        body: |-
          记录 SHALL 使用不可变 explorationId、可变 slug 和稳定条目及结构对象身份，表达最新实际设计及其决策状态。修订局部更新并保留无关内容，不累积相互冲突的对话版本，不要求 revision history 或整体 readiness 字段。记录级 sourceVersion 覆盖完整内容，不增加条目级版本。

          - 重命名 slug 后 explorationId 及未变条目身份不变。
          - 获用户允许修订已采纳条目时保存最新内容，不并列保留冲突版本，也不通过降为 pending 绕过确认。
        acceptanceCases: []
      - name: 保存相关 Semantic Model 基准快照
        body: |-
          记录 SHALL 保存 CLI 计算的来源版本标识及相关上下文基准，以区分捕获时不存在的 formal model、存在且有效的模型及之后上下文变化。相关语义身份包括结构部分的对象及显式关联的 identity，SHALL NOT 以自然语言猜测完整依赖范围；CLI 比较能确定的上下文变化，其结果不是语义覆盖证明。

          - **首次 Build 无正式模型**

            - 合法 Build 上下文中尚不存在 formal model
            - 基准明确记录缺失状态，允许保存已确认设计。

          - **模型损坏不等于缺失**

            - formal source 存在但解析或校验失败
            - 返回错误，不以不存在的基准继续写入。

          - **上下文变化可见**

            - 记录捕获后关联的模型上下文发生变化
            - 报告变化与可用差异，消费者重查相关结论，不宣称自动判断语义冲突。
        acceptanceCases: []
      - name: 仅作为形成来源与历史记录
        body: |-
          记录 SHALL 为 Build 或 Propose 提供形成依据；目标完成覆盖检查与适用校验后，精确来源快照与覆盖检查结果仅作为形成历史保存，便于后续审计。Candidate 来源与覆盖结果可绑定 review digest 并进入 Build history，但 SHALL NOT 提升进 formal partitions；Change 来源与覆盖结果 SHALL NOT 参与 Expected Semantic Model、sync 或 Closure 的规范语义计算。

          - **Change 来源完成交接**

            - 完整 Change 通过覆盖门禁与校验并完成来源消费
            - 来源快照与覆盖结果保留为形成历史，目标语义仍仅由 Semantic Model 与 Semantic Delta 决定。

          - **Build 来源保留而不提升**

            - 带来源快照与覆盖结果的 Candidate 被确认并成功提升
            - 二者进入 Build history，不进入正式模型四分区。
        acceptanceCases: []
  element:delivery-validation:
    declaration:
      identity: delivery-validation
      kind: element
      parent: realization-process
      title: Delivery Validation
      definition: Delivery Validation 定义仓库当前维护的可执行交付面：Nix 打包/开发环境与 GitHub 跨平台验证工作流。它是项目自身的交付契约，作为 Project Root 的细化 Element 独立演进。
    sections:
      - name: 版本化 Nix 交付面
        body: |-
          Nix flake SHALL 声明用于构建息壤和进入其开发 shell 的 Node.js 与 pnpm 包。

          - **Nix 包或开发 shell 被求值**

            - 贡献者求值 package 或进入默认开发 shell
            - flake SHALL 提供其固定的 Node.js 与 pnpm 工具链
            - SHALL 从锁定的 pnpm dependency closure 构建当前 package.json 版本
        acceptanceCases: []
      - name: 跨平台 GitHub 验证
        body: |-
          GitHub workflow SHALL 在 Linux、macOS 与 Windows 上、以其固定的 Node.js 与 pnpm 版本运行声明的 root 与 vendored 验证命令。

          - **跨平台工作流运行**

            - pull request 或 main-branch push 触发验证
            - root install、identity audit、lint、build、tests 与 browser tests SHALL 在每个声明的操作系统上运行
            - vendored install、typecheck、tests 与 build SHALL 在每个声明的操作系统上运行
        acceptanceCases: []
      - name: 交付声明跟随可执行配置
        body: |-
          交付文档与契约 SHALL 只描述 versioned flake 或 workflow 配置中存在的 job、命令、操作系统与工具版本。

          - **交付配置变化**

            - Nix package、workflow job、命令、操作系统或固定工具版本被增删或改变
            - 相应交付契约 SHALL 在同一 Change 中调和
        acceptanceCases: []
  element:design-exploration:
    declaration:
      identity: design-exploration
      kind: element
      parent: explore
      title: Design Exploration
      definition: Design Exploration 是 Explore 中澄清和确认设计的阶段。它基于 Semantic Model 与项目证据，通过一次一问和方案比较推进设计；复杂变更分段确认适用的行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing 与 risks，窄变更至少确认 problem、impact scope、approach 与 verification method，最终形成不持久化的 Design Summary。
    sections:
      - name: 处理确定性影响
        body: |-
          Design Exploration SHALL 将 CLI 返回的格式、版本与显式上下文变化纳入设计复核；CLI 可提供确定性影响线索，但不能据此断言自然语言设计无冲突或完整。

          - **上下文变化后复核设计**

            - 记录关联的正式模型上下文发生变化
            - 重查相关设计和授权，区分预期模型演进与未解决矛盾，而非直接丢弃记录或接受新状态。
        acceptanceCases: []
      - name: 确认适用设计
        body: |-
          Design Exploration SHALL 主动发现需要用户选择的决策点，通过一次一问、方案比较与适用 section confirmation，确认行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing、risks 及其他必要设计维度。Agent SHALL 解释适用的异常结果、竞争事件与时间起点或容差，给出推荐及理由并等待用户确认；推荐与未选方案不得当作已确认决定。关键条件、动作与可观察验收结果 SHALL 随设计确认，不能仅确认测试工具或技术方案名称；完整 Sections、Acceptance Cases 与 tasks 留给 Propose 文档化。

          - **多个实现方案符合目标语义**

            - 多个方案具有不同权衡
            - Design Exploration 比较方案并请求用户选择

          需要实践求证的可行性问题 SHALL 交 Experimenter 设计并执行实验，在 Explore 内取得结果再确认相关方案；实验事实与用户决策分开记录。
        acceptanceCases: []
      - name: 形成不持久化的 Design Summary
        body: |-
          适用设计已确认、必要可行性实验完成后，Design Exploration SHALL 形成 conversation-only Design Summary 供 Propose 使用。存在记录时先完整重载当前设计及状态，检查内部冲突、与拟议设计的冲突及影响当前目标的 pending 问题，先由用户裁决。用户确认即授权相应记录更新，无需额外写入授权；保存后核对差异与受影响设计。

          - 冲突或影响当前目标的未决决策未解决：不输出可交接 Summary。
          - 用户裁决修订后：按裁决更新，重查受影响结论再输出。
          - Summary 后记录变化：相关结论失效，重查后才能交接。
        acceptanceCases: []
      - name: 设计自查与忠实交接
        body: |-
          Design Exploration SHALL 在交接前用适用的边界或竞争事件序列检查机制、不变量、时序和失败行为。已确认设计能确定答案的表达或推导错误 SHALL 由 Agent 修正；需要新增或改变决策时 SHALL 询问用户。影响当前目标的未决决策 SHALL 阻塞可交接声明；延后或排除范围 SHALL 经用户确认，不能把当前必需行为静默推给 Propose。

          Design Summary SHALL 保留已确认行为、范围、决策及理由，包含适用条件、数值、例外、时序和关键验收结果；推荐、未选方案、未决事项与用户明确排除的范围 SHALL 保持可区分。有记录时引用记录身份与已核对版本，不重复记录全文；Summary 保持会话内，不新增永久决策台账。Propose 仍可在文档化时发现新缺口。
        acceptanceCases: []
      - name: 使用完整当前确认记录
        body: |-
          Design Exploration SHALL 在开始、恢复和准备输出 Summary 时读取存在的完整当前记录，联合 Semantic Model、项目证据与实验结果使用当前设计，区分 pending、accepted 与 excluded；只将已采纳规范内容作为确认依据，不得仅依赖最近对话或记录摘要。无记录时 SHALL 直接按通常流程探索。

          - **恢复已有记录的探索**

            - 已有记录而对话中仅剩部分上下文
            - 通过 CLI 读取完整当前记录后继续，保留未出现在最近对话中的确认。

          - **没有记录时正常继续**

            - 记录不存在
            - 基于模型与项目证据自审设计，不要求建立空记录。
        acceptanceCases: []
  element:design-record:
    declaration:
      identity: design-record
      kind: element
      parent: explore
      title: Design Record
      definition: Design Record 是形成过程中维护当前设计及确认依据的方法。它独立建模以支持 Build、Explore 与 Propose 的记录维护、冲突调和、编译和覆盖检查；包含待确认内容捕获、用户确认、局部更新与交接，不负责结构分解、完整 Change 编写或项目实现。
    sections:
      - name: 确认即记录
        body: |-
          Explore 与 Propose 中的 Agent MAY 主动新增、维护待确认问题、假设和建议，明确标为 pending，避免遗忘后续提问。只有用户决定才能将设计标为 accepted 或 excluded；实验成功只构成事实依据，不代表用户采纳。已采纳或已排除内容的实质修改、删除、状态改变及已确认结构字段修改 SHALL 先获用户允许；不得先降为 pending 再自行改写。

          用户确认即授权记录该部分内容。Agent SHALL 立即通过 CLI 局部写入，不再请求持久化确认，不在写入前展示完整拟保存内容。首次出现需保存的设计内容时可建立非空记录，空列表不构成确认内容免记的依据。写入后只报告本次变更、状态与记录概况，修改已确认内容须单独标出；冲突先说明影响并由用户裁决，不默认以最新陈述覆盖先前确认。

          - 已有 18 条，新增 1 条、修改 1 条后报告新增、修改及共 19 条，不重贴其余 17 条。
          - Agent 推荐尚未获用户选择：可记 pending，不得记 accepted；实验验证推荐可行后仍不自动改为 accepted。
          - 用户新陈述与既有确认矛盾：先裁决，再按裁决局部更新。
        acceptanceCases: []
      - name: 条目写入标准
        body: |-
          记录 SHALL 表达当前设计、决策状态及影响设计的必要依据，不保存完整讨论流水。待确认条目保留问题、假设或建议；已采纳的规范条目须让下游不看会话也能写出 Contract 与验收内容，保留条件、数值、例外、时序及原样正反例。用户明确要求保留的材料优先保存，不以 Agent 的重要性判断省略。理由与实验事实以 informative 保存，不升格为规范义务；已排除方案仅保留必要内容与理由。

          已确认的组件结构 SHALL 写入结构部分，未确认结构方案先以 pending 条目的自由文本表达，不提前结构化，不混入未确认字段。

          - 用户以“当前画像为 A、C 时，事件 ABC、ACD 可以入选；事件 AB 不行（缺少 C）”对齐规则：同时保留规则与例子原文，不能只记概括。
          - 用户确认新增 Element、parent 与 kind：写入结构部分；尚未确认的候选 parent 只记 pending。
          - 实验测得某方案可行：记录实验依据，方案是否采纳仍由用户决定。
        acceptanceCases: []
      - name: 保持依赖设计一致
        body: |-
          已确认设计记录变化时，Design Record SHALL 标识受影响的设计、Summary 与覆盖结论，要求消费者重载并重新检查；未受影响内容保持不变，不得复用已经失效的确认。

          - **记录修订使结论失效**

            - 一个已确认条件或结构位置被修订
            - 依赖旧条目的设计、Summary 与覆盖结论不再视为有效，重新核对后才能继续交接。
        acceptanceCases: []
      - name: 在交接前落定记录决策
        body: |-
          Design Record SHALL 在形成过程交接前落定恰好一个记录决策：已持久化记录、用户明确授予的豁免、或本次确认不含 normative 内容的声明。交接前 SHALL 对照确认对话检查各规范性确认均已记录或明确豁免；已有部分记录不覆盖后续遗漏的确认，缺失时先补录。存在 normative 确认而三者皆缺时 SHALL 停止交接。豁免 SHALL 由用户授予并将其理由记录于 Design Summary（Explore）或 `build.md`（Build）与 provenance。SHALL NOT 以静默跳过代替任何一态，SHALL NOT 为满足决策而创建空记录，并在后续新增 normative 确认时重新开启已豁免的决策。

          - **有规范确认却未落定决策**

            - 已确认设计含至少一条 normative 确认，且既无记录也无豁免
            - 停止交接并先补录；用户拒绝记录时记录其豁免与理由
            - 不创建空记录，也不以无记录继续

          - **用户授予豁免**

            - 用户明确表示本次不建立记录
            - 记录该豁免及其理由，进入 Design Summary 或 `build.md` 与 provenance 并可被下游验证
            - 后续新增 normative 确认时重新开启记录决策

          - **本次无规范内容**

            - 已确认设计仅含说明性材料、备选讨论或实施计划
            - 显式声明本次无 normative 内容，不要求建立记录
        acceptanceCases: []
      - name: 按原子细节检查覆盖
        body: |-
          Build 与 Propose 在交接前 SHALL 完整重载最新记录，按 nature、decision 与对当前目标的适用性检查。accepted 且适用的 normative 条目须拆成条件、数值、例子、反例、时序、例外等原子细节，各给出目标模型中的具体位置及当前位置的原文摘录；未覆盖项阻塞交接。非当前目标的条目须说明不适用依据，不得靠不适用声明绕过已确认承诺。pending 条目须判断是否影响当前目标，影响则先解决，不能忽略后声明就绪；确实不影响时记录理由。excluded 及 informative 不强制编成 Contract，仅保留必要设计依据。

          目标为 Expected Semantic Model 或 active Candidate；位置精确到 Element Declaration、Section、Acceptance Case、Relationship、Element Kind、Relationship Kind 或 Authored View。现有正式语义已满足的细节可用 no-op 位置，不制造 Delta。摘录 SHALL 取自当前文件，不凭记忆改写。结构部分由 CLI 逐字段比对，不拆原子细节。CLI 记录并校验版本、位置和摘录，不替代语义判断；覆盖结果记录后目标或记录变化须重查。

          - 条目含规则与“A、C 时 ABC、ACD 可以，AB 不行”，只落实规则而没有具体例子：例子未覆盖，阻塞交接，直到落入验收内容。
          - 将该例子指向只写“一个事件覆盖全部当前标签，另一个只覆盖部分”的泛化案例：仍未覆盖，不能用泛化摘录代替具体输入与结果。
          - 仅声明“已逐项核对”而没有逐项细节及位置：CLI 拒绝。
          - 用户已明确排除某实现方案：保留必要理由，不把排除方案强写成宿主 Contract 义务。
        acceptanceCases: []
      - name: 按写作规则编译细节
        body: |-
          从记录编译目标语义时，仅将已采纳、适用的规范内容编成目标承诺，不能将待确认建议或实验事实当作用户决定。用户确认的例子 SHALL 写成验收内容（business-specification Contract 写入 Key Acceptance Cases 的 Acceptance Case，其他 Contract 写入对应 Section 的具体情形），原样或以等价的具体形式出现，SHALL NOT 抽象为概括性描述；已确认的数值、时序与例外 SHALL 写进宿主 Contract 的业务机制或例外处理内容，SHALL NOT 换成泛化描述。记录的结构对象 SHALL 编成对应的 Delta 条目，或在正式模型已一致时作为 no-op。

          - **例子写成具体验收情形**

            - 记录含“当前画像为 A、C 时，事件 ABC、ACD 可以入选；事件 AB 不行”
            - Acceptance Case 使用具体标签 A、C 与事件 ABC、ACD、AB 及各自结果，而不是“一个事件覆盖全部当前标签，另一个只覆盖部分标签”。

          - **数值不泛化**

            - 记录确认每路候选上限 K 可配置、默认 32
            - Contract 写明默认值 32，而不是“存在一个可配置上限”。
        acceptanceCases: []
  element:deterministic-operations:
    declaration:
      identity: deterministic-operations
      kind: element
      parent: cli
      title: Deterministic Operations
      definition: Deterministic Operations 在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
    sections:
      - name: 对模型和 Change 提供结构化操作
        body: |-
          Deterministic Operations SHALL 支持 Semantic Model 与 Change 的查询、搜索、影响分析、差异、验证与派生呈现，并以 identity 而非文件位置寻址语义对象。发现型命令 SHALL 默认返回完成其职责所需的最小投影；完整语义 SHALL 只在调用方显式提供 stable identity 后由 `arch query` 返回，完整 Contract SHALL 只在显式使用 `--contract` 时返回。CLI 不得以默认摘要、截断或改写替代完整 Definition 或 Contract。

          - **渐进式模型读取**

            - Agent 尚不知道相关 identity
            - 使用 `xirang arch search <query> --limit <n> --json` 定位候选
            - 再按需使用 `arch outline` 或 `arch impact` 获取层级和关系范围，使用 `arch query` 获取选定 Declaration，最后使用 `arch query --contract` 获取选定完整 Contract

          - **全局结构诊断**

            - Agent 需要恢复全局结构，或整体模型认知在上下文压缩、长会话或切换后丢失
            - 使用 `xirang arch snapshot` 获取完整 Declaration、Relationships 和 Metamodel
            - snapshot 不包含 Contract，普通探索不将其作为默认入口

          - **显式完整读取**

            - Agent 已确定需要判断某个 Element 的完整语义
            - `arch query <identity> --json` 返回完整 Declaration，`--contract` 额外返回该 identity 自有的完整 Contract
            - 不从 impact、outline、旧摘要或实现证据猜测缺失语义
        acceptanceCases: []
      - name: 原子提升 Candidate
        body: |-
          Candidate promotion SHALL 在用户确认精确版本后原子整体替换正式模型。

          - **Promotion 失败**

            - 原子替换无法完成
            - 正式模型不进入部分提升状态
        acceptanceCases: []
      - name: 在 Sync 前完整验证
        body: |-
          Delta sync SHALL 在应用前完整验证 Semantic Delta 与 Expected Semantic Model。

          - **Delta 无效**

            - Sync 准备阶段发现验证错误
            - 正式模型保持不变
        acceptanceCases: []
      - name: 最小重写 Sync 单元
        body: |-
          Delta sync SHALL 只重写 Semantic Delta 实际影响的存储单元。

          - **Delta 只影响一个 Element**

            - Sync 应用该 Delta
            - 无关模型单元保持原字节不变
        acceptanceCases: []
      - name: Sync 失败完整回滚
        body: |-
          Delta sync 任一环节失败时 SHALL 完整回滚到应用前状态。

          - **Sync 中途失败**

            - 任一目标单元无法写入
            - 正式模型恢复到应用前状态
        acceptanceCases: []
      - name: 持久化验证证据
        body: |-
          Deterministic Operations SHALL 持久化 Verify 与 Change Closure 使用的可复现验证证据。

          - **Closure 检查验证入口**

            - Change 请求进入 Closure
            - CLI 提供已持久化证据供入口判断
        acceptanceCases: []
      - name: 序列化是 IR 的确定性函数
        body: |-
          模型序列化 SHALL 是当前 IR 的确定性函数，相同 IR SHALL 产生逐字节相同输出。

          - **重复序列化相同 IR**

            - 系统两次序列化相同 IR
            - 两次输出逐字节一致
        acceptanceCases: []
      - name: 固定 Frontmatter 键顺序
        body: |-
          模型序列化 SHALL 以固定键顺序输出 frontmatter。

          - **序列化 Markdown 单元**

            - 系统写入同类实体
            - frontmatter 字段顺序保持确定
        acceptanceCases: []
      - name: 排序 Relationship Entries
        body: |-
          模型序列化 SHALL 按 `source`、`kind`、`target` 依次排序 Relationship entries。

          - **输入容器顺序不同**

            - IR 包含相同 Relationship 集合
            - 序列化列表顺序一致
        acceptanceCases: []
      - name: 验证序列化往返属性
        body: |-
          测试层 SHALL 以属性测试验证 `parse(serialize(ir))` 与原 IR 相等，并覆盖转义、多行文本、空集合与缺省字段。

          - **序列化边界输入**

            - 属性测试生成有效边界 IR
            - 序列化后重新解析得到语义相等 IR
        acceptanceCases: []
      - name: 规范化无权威顺序集合
        body: |-
          语义比较 SHALL 将 Elements、Relationships、Kinds、Authored Views 及 `parents`、`children`、`sourceKinds`、`targetKinds`、`include`、`exclude` 作为无序集合规范化后比较。

          - **仅集合排列变化**

            - 两个模型只在无权威顺序的排列上不同
            - diff 不报告语义变化
        acceptanceCases: []
      - name: 保留 Contract 条目顺序
        body: |-
          Element Contract 内 Section 顺序与 Section 内 Acceptance Case 顺序 SHALL 保留并参与语义比较。

          - **Section 顺序变化**

            - 同一 Contract 的 Sections 被重排
            - diff 报告语义变化
        acceptanceCases: []
      - name: 规范化散文比较
        body: |-
          散文比较 SHALL 只规范化行尾与文件末尾空白后逐字比较。

          - **散文仅行尾不同**

            - 两份散文只存在行尾编码差异
            - diff 不报告语义变化
        acceptanceCases: []
      - name: 排除非语义存储信息
        body: |-
          派生字段、文件路径与文件名 SHALL NOT 参与语义比较。

          - **单元只改变文件位置**

            - 实体内容与 identity 不变
            - diff 不报告语义变化
        acceptanceCases: []
      - name: 以实体身份输出差异
        body: |-
          差异输出 SHALL 以 entity type 与 identity 为键，SHALL NOT 携带存储分区信息。

          - **输出模型差异**

            - CLI 报告变化实体
            - 使用 entity type 与 identity 定位条目
        acceptanceCases: []
      - name: 区分初始化来源与 Formal Comparison
        body: |-
          Candidate validation SHALL 将 `candidate.yaml.baseline` 的初始化来源与当前 Formal Semantic Model 的 comparison availability 分别表达。

          - **Clean Candidate 面对现有 Formal Model**

            - Candidate 从 clean 初始化且当前 Formal Model 存在
            - validation 仍以当前 Formal Model 作为 comparison baseline
        acceptanceCases: []
      - name: Formal 缺失时报告 Diff 不可用
        body: |-
          当前 Formal Semantic Model 不存在时，Candidate validation SHALL 返回 `comparison.baseline: absent`、`comparison.diff: unavailable` 与 `reason: formal-model-absent`，SHALL NOT 构造无效空 diff 或假设空 Formal Model。

          - **构建首个 Formal Model**

            - 有效 Candidate 没有可比较的当前 Formal Model
            - validation 仍返回 review digest 且 comparison 明确不可用
        acceptanceCases: []
      - name: Formal 存在时生成 Promotion Diff
        body: |-
          当前 Formal Semantic Model 存在且有效时，Candidate validation SHALL 返回 `comparison.baseline: formal`、`comparison.diff: available`、Formal fingerprint 与从当前 Formal 到 Candidate 的真实 semantic diff。

          - **Candidate 改变正式语义**

            - validation 比较有效 Formal Model 与 Candidate
            - diff entries 完整表达 promotion 将产生的 ADDED、MODIFIED 与 REMOVED 语义
        acceptanceCases: []
      - name: Comparison 不参与 Review Digest
        body: |-
          Candidate comparison availability 与 diff 输出 SHALL NOT 参与 review digest；digest SHALL 只绑定 Candidate 的审查内容。

          - **Formal 状态在 Candidate 不变时变化**

            - 相同 Candidate 针对不同 comparison availability 进行校验
            - Candidate review digest 保持不变
        acceptanceCases: []
      - name: 通过 Validation 呈现 Change 差异
        body: |-
          Deterministic Operations SHALL 通过 `xirang validate --change <name>` 提供 Change 的只读文本差异预览与 JSON summary、entries 和 diagnostics，SHALL NOT 注册独立 `xirang diff` command 或将该差异持久化为 Change artifact。

          - **校验 Change 并查看文本差异**

            - 用户或 Agent 运行 `xirang validate --change sample`
            - CLI 在校验结果中呈现当前 Semantic Model 与 Expected Semantic Model 的差异且不创建文件

          - **获取结构化校验结果**

            - 用户或 Agent 运行 `xirang validate --change sample --json`
            - CLI 返回 validation status、summary、concise entries 与 diagnostics

          - **调用已删除的 Diff command**

            - 用户或脚本运行 `xirang diff --change sample`
            - CLI 以 unknown command 失败且不修改 Change directory
        acceptanceCases: []
      - name: 完整处理 Element Definition
        body: |-
          Deterministic Operations SHALL 在 IR、解析、校验、序列化、Semantic Delta、semantic diff、fingerprint、Candidate、Sync、查询、搜索与影响分析中保留完整 Element Definition，并 SHALL NOT 以展示 excerpt 替代或截断该规范文本。发现型 projection MAY 省略 Definition，但不得返回伪造摘要；显式 `arch query` 与 `arch query --contract` SHALL 返回选定 identity 的完整 Declaration 与 Contract。

          - **发现与完整读取分离**

            - Agent 使用 search、outline 或 impact 定位范围
            - 这些发现 projection 可以只返回 identity、层级、匹配证据或关系摘要
            - Agent 对需要判断的 identity 使用 `arch query`，不得把发现结果当作完整语义

          - **完整目标语义保持原样**

            - ADDED 或 MODIFIED Declaration、query、fingerprint、Candidate validation 与 Sync 需要 Definition
            - 使用完整 Definition 确定目标语义，不做摘要、截断或语义改写
        acceptanceCases: []
      - name: 拒绝 Legacy Declaration Summary
        body: |-
          Deterministic Operations SHALL 对当前 Semantic Model、Candidate 或活动 Change 中 Element Declaration 的 legacy `summary` 返回明确 ERROR，SHALL NOT 将其作为 alias、fallback 或未知字段静默删除。

          - **Parser 遇到 Legacy Summary**

            - 当前输入的 `element-declaration` 包含 `summary`
            - 加载失败并指出应迁移为 `definition`
        acceptanceCases: []
      - name: 隔离受控文件路径
        body: |-
          Record lifecycle SHALL 仅操作 canonical `.xirang/records/` 下按合法记录身份寻址的 managed regular files，使用 Node.js path APIs、containment、lstat、symlink 拒绝与 filename/frontmatter 一致性检查。来源快照 `record-source.md` 与覆盖结果 `record-coverage.json` SHALL 仅写入显式 named Change 或 active Candidate 的受控位置。Windows、macOS 与 Linux SHALL 采用同一隔离语义。

          - **Managed path 是 symlink**

            - 任一记录、来源快照或覆盖结果路径是 symlink 或逃逸受控根目录
            - CLI 返回稳定路径错误，不跟随链接也不写入目标

          - **Windows 路径分隔符不同**

            - record 命令在 Windows project root 下构造 managed path
            - CLI 使用 Node.js path API 保持 `.xirang/records/` 与明确目标的 containment，并仅在 JSON presentation 中转换为 project-relative POSIX path
        acceptanceCases: []
      - name: 通过 Show 与 List 呈现 Change 编译结果
        body: |-
          Deterministic Operations SHALL 从当前 Semantic Model 与 Change 的四分区 Semantic Delta 编译顶层 `show` JSON、顶层 `list` JSON 与 `--long` 文本结果，SHALL NOT 将 Change Plan 或 change-local `specs/` 作为 Semantic Delta 来源。

          - **获取 Change JSON**

            - 用户或 Agent 运行 `xirang show sample --json`
            - CLI 返回 `id`、`title`、`valid`、实体级 `summary`、以 entity kind 和稳定 identity 表达的 concise `entries` 及 compiler `diagnostics`

          - **获取稳定 Change 列表 JSON**

            - 用户或 Agent 运行 `xirang list --json`
            - CLI 返回 `{ changes: [...] }` envelope，每项保留 `name`、task、last-modified、status 与 freshness information，并增加 compiler-derived `title` 和 `deltaCount`

          - **获取详细 Change 文本列表**

            - 用户运行 `xirang list --long`
            - 每个活动 Change 的文本结果包含 title、实体级 Delta 数量与 task status

          - **列出 Change Delta 数量**

            - 用户或 Agent 请求包含 Delta 数量的 Change 列表
            - `deltaCount` 等于 compiler diff 的实体级 `summary.total`

          - **Change 编译失败**

            - 四分区 Semantic Delta 无法形成有效 Expected Semantic Model
            - `show` JSON 返回 `valid: false` 与结构化 `diagnostics`，且消费者不得将返回的 `entries` 视为有效目标状态

          - **忽略旧 Change 语义来源**

            - Change Plan 含有旧式 Delta 描述或 Change 目录含有 change-local `specs/`
            - Show 与 List 只使用四分区 Semantic Delta 和当前 Semantic Model 推导结果
        acceptanceCases: []
      - name: 使用 Verb-first CLI 与 Element Contract 术语
        body: |-
          Deterministic Operations SHALL 仅通过顶层 verb-first commands 提供 Change 展示、列表与验证能力，并 SHALL 以 `contract` 作为 Element Contract 在 flags、type selectors、JSON discriminators、交互选项、completion 与 diagnostics 中的公开术语；CLI SHALL NOT 注册 deprecated `xirang change` command group，也 SHALL NOT 接受旧 `spec` forms 或 forwarding aliases。

          - **使用唯一 Change 操作入口**

            - 用户运行顶层 `xirang show <change>`、`xirang list` 或 `xirang validate --change <change>`
            - CLI 提供对应有效能力，且 `xirang change ...` 不再是已注册 command group

          - **创建 Change 不受影响**

            - 用户运行 `xirang new change <name>`
            - CLI 继续通过 verb-first `new` group 创建 Change

          - **校验全部 Element Contracts**

            - 用户运行 `xirang validate --contracts --json`
            - CLI 校验 Formal Semantic Model 中携带 Contract 的 Elements，并以 `type: "contract"` 返回每项结果

          - **按类型校验一个 Element Contract**

            - 用户运行 `xirang validate <element> --type contract`
            - CLI 以 Element identity 定位并校验其 Contract

          - **拒绝旧公开形式**

            - 用户提供 `--specs`、`--type spec` 或 `xirang change ...`
            - CLI 将其视为未注册 option、type 或 command，而不静默转发到新形式
        acceptanceCases: []
      - name: 管理统一确认记录生命周期
        body: |-
          xirang record SHALL 统一管理非空中间设计记录，Build 与 Change 各用独立实例，保留稳定 explorationId、完整读取、局部更新与记录级 sourceVersion。条目显式区分 nature（normative/informative）与 decision（pending/accepted/excluded），结构部分只承载已确认目标。使用 schemaVersion: 4，旧格式不支持、不自动迁移、不默认确认，也不提供 framing 兼容别名。

          show 可一次选择一条或多条 identity，返回所选完整内容及状态、记录身份和当前 sourceVersion，不附无关条目或完整基准；无选择时仍完整读取。update 保留未提及内容、结构字段合并及版本过期拒绝机制，返回差异、状态概况与新版本，不回传整份记录。CLI 校验格式与确定性关系，不代用户确认设计。
        acceptanceCases: []
      - name: 返回记录校验与上下文变化
        body: |-
          Record validation SHALL 分别报告格式、稳定身份、结构部分的 Kind / parent / Relationship 端点解析、显式上下文关联与版本变化的确定性诊断，不推断自然语言冲突或完备性。相关上下文变化 SHALL 阻止复用旧检查结论；意图判断由 Agent 完成并由用户裁决。合法初始 Build 可无 formal model，存在而损坏的模型必须报错。

          - **合法缺失与损坏分离**

            - 首次 Build 没有正式模型，或已有模型损坏
            - 前者可创建合法记录，后者失败并保持源与目标不变。

          - **结构引用无法解析**

            - 结构对象的 kind、parent 或 Relationship 端点无法解析
            - 返回带对象与字段的稳定诊断，不写入。

          - **格式合法不等于意图完整**

            - 记录通过格式与结构校验但仍可能遗漏某个行为例外
            - CLI 只报告确定性有效性，不输出已完成语义覆盖的结论。
        acceptanceCases: []
      - name: 确定性交接确认来源
        body: |-
          record coverage SHALL 按性质、决策状态及适用性记录检查：需落实的 accepted normative 内容须有逐项原子细节、真实目标位置及适用摘录；pending 问题影响当前目标时阻塞，不影响须有理由；excluded 与 informative 不强制生成目标承诺。非当前目标的规范内容须声明不适用并说明理由。CLI 校验结果类型、完整性、位置与摘录，不判断自然语言语义覆盖或授权。

          record consume SHALL 显式选择 named Change 或 active Candidate，核对源版本，要求覆盖结果绑定当前 sourceVersion 与目标指纹，并逐字段比对已确认结构目标。先保存精确 record-source.md，再完成适用校验，最后删除活动记录；任一前置失败保留来源与既有目标。同字节快照可重验恢复，冲突快照停止，不猜测目标。来源与覆盖只作为形成历史，不进入后续语义计算。
        acceptanceCases: []
      - name: 提供稳定 Record JSON Contract
        body: |-
          每个 `xirang record` command SHALL 在 `--json` mode 向 stdout 输出唯一的 versioned envelope，区分 `ok`、`invalid` 与 `error` 并提供稳定 diagnostics 与 error codes。

          - **Validation 发现相关 Drift**

            - command 成功读取对象但关联上下文已变化
            - JSON status 为 invalid、exit code 为 1 且不输出 spinner、颜色或 stack trace
        acceptanceCases: []
  element:explore:
    declaration:
      identity: explore
      kind: element
      parent: intent-first-path
      title: Explore
      definition: Explore 是 Intent-first Path 的起始阶段。它通过 Design Exploration，基于 Semantic Model 与项目证据澄清用户意图、范围、影响和设计；在探索过程中通过 Design Record 随用户确认记录关键设计，用户的设计确认即授权记录该部分内容。它在适用设计已确认且记录冲突已解决后形成不持久化的 Design Summary，交由 Propose 收成完整 Change；它不写入完整 Change，也不实现项目。
    sections:
      - name: 识别语义影响面
        body: |-
          Explore SHALL 结合 Semantic Model 的 Elements、Relationships、Element Contracts 与授权项目证据识别影响面。普通探索 SHALL 按明确问题渐进读取：先用 `arch search --limit` 定位候选，再用层级或影响 projection 缩小范围，再查询选定 identity 的完整 Declaration，只有需要判断完整规范语义时才查询完整 Contract。Explore 不得自动读取影响分析返回的全部 Elements Contracts。

          - **逐步确定语义范围**

            - 用户意图涉及尚未定位的模型概念
            - Explore 按 `arch search`、`arch outline`/`arch impact`、`arch query`、`arch query --contract` 顺序按需展开
            - 每次扩大读取都回答一个明确的设计问题

          - **保留完整语义读取**

            - 选定 Element 的 Definition 或 Contract 影响判断
            - Explore 查询该 stable identity 的完整语义
            - 未加载的 Definition、impact identity、旧摘要或实现证据不得代替该读取

          - **全局恢复有明确触发条件**

            - 整体模型理解已丢失、上下文压缩或需要全局结构诊断
            - Explore 使用 `arch outline` 显式展开所需结构，必要时使用无 Contract 的完整 `arch snapshot`
            - snapshot 不是普通探索的默认入口
        acceptanceCases: []
      - name: 一次一问并比较方案
        body: |-
          Explore SHALL 主动识别行为、边界与实现方案中的决策点，通过一次一问与方案比较推进设计，并由用户确认选择。Agent SHALL 给出推荐与可观察后果，不将推荐当作确认；适用的关键验收结果随设计确认，完整制品留给 Propose。

          - **存在多个合理方案**

            - 不同方案具有不同权衡
            - Explore 比较方案并一次请求一个用户决策
        acceptanceCases: []
      - name: 分段确认复杂变更设计
        body: |-
          对复杂变更，Explore SHALL 分段确认适用的行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing 与 risks。

          - **变更跨越多个设计维度**

            - 单次确认不足以审查设计
            - Explore 逐段呈现并确认适用维度
        acceptanceCases: []
      - name: 确认窄变更最低设计集
        body: |-
          对窄变更，Explore SHALL 至少确认 problem、impact scope、approach 与 verification method。

          - **变更范围有限**

            - 完整复杂设计分段不适用
            - Explore 仍确认最低设计集
        acceptanceCases: []
      - name: 不形成完整 Change
        body: |-
          Explore SHALL 使用中间设计记录完善设计，不提前展开完整 Change 草稿；整体设计接近完成后，由 Propose 组织并编写实际草稿。探索中后续发现可以使此前设计修订，记录按当前状态更新，避免每次反复都重写完整制品。Explore SHALL NOT 实现正式 Change。

          - 先确定的条件因后续发现改变：取得必要用户裁决后更新中间记录，未进入 Propose 时不展开完整 Delta、Plan。
        acceptanceCases: []
      - name: 澄清 Element Definition 影响
        body: |-
          Explore SHALL 在新增 Element 或改变概念身份、范围、parent、children 或 siblings 边界时澄清完整目标 Definition。用户确认的 Declaration 字段 SHALL 通过 Design Record 记录到记录的结构部分，允许只含已确认字段；没有记录时保留在对话设计中。仅改变规范行为时 SHALL NOT 制造 Declaration 变化。

          - **Change 改变 Element 概念边界**

            - 不同 Definition 边界会产生不同 Semantic Delta
            - Explore 一次请求一个用户决策，直到目标 Definition 足以交由 Propose 编译

          - **部分确认的 Declaration**

            - 用户已确认新 Element 的 parent 与 kind，definition 仍在讨论
            - 立即记录已确认的两个字段，definition 确认后补充
        acceptanceCases: []
      - name: 形成不持久化的 Design Summary
        body: |-
          Explore SHALL 在适用设计确认并完成边界、竞争与一致性自查后输出 conversation-only Design Summary。Summary SHALL 保留已确认决策的条件、数值、例外、时序和关键验收结果，区分推荐、未决事项与用户确认的排除范围；影响当前目标的未决决策 SHALL 阻塞交接，Agent 不自行延期。输出前 SHALL 对照已确认对话确认所有规范性确认均已记录或明确豁免，已有部分记录不代表后续确认已被覆盖。带记录时，只有完整重载、冲突调和和一致性复核通过后才能输出，并一起交付该记录身份及受核对版本；带豁免时 SHALL 交付无记录声明及其理由；本次无 normative 内容时 SHALL 声明该事实。SHALL NOT 创建空记录，也不以省略上述内容代替声明。

          - **带记录完成 Explore**

            - 当前完整记录与拟议设计无未决冲突且适用设计已确认
            - 输出 Design Summary 并交付记录身份及该次核对版本，不把 Summary 另存为记录。

          - **带豁免完成 Explore**

            - 用户已授予豁免且设计已确认
            - 输出 Design Summary 并交付无记录声明及其理由

          - **无规范内容完成 Explore**

            - 设计已确认但仅含说明性材料
            - 输出 Design Summary 并显式声明本次无 normative 内容，不建立记录
        acceptanceCases: []
      - name: 按确认即记录使用 Design Record
        body: |-
          发现相关记录、需保存影响设计的 pending 问题/假设、产生未豁免的设计确认、用户要求记录或修订、Summary 前发现记录缺口时，Explore SHALL 加载共享 Design Record reference。按协议主动维护 pending 内容，用户确认后立即通过 `xirang record` 局部更新；不等待用户要求记录，不另行索要持久化授权。修改已确认内容须用户允许，写入后只报告变化与概况。

          Explore SHALL 在每个阶段入口先运行 `xirang list --json` 发现当前记录，并读取必要的完整基础状态；完整 show/status/validate 用于入口、恢复和收尾门禁，不用于普通讨论或每次局部更新前的重复仪式。有效上下文未发生相关变化时，SHALL 复用最近成功操作返回的 `sourceVersion`、summary 与已知 identity；局部设计问题使用 `record show --entry`，update 使用最近有效 `sourceVersion` 并检查返回的 diff 与 summary。

          发生上下文压缩、session 切换、sourceVersion 冲突、相关模型 drift 或无法确认当前状态时，SHALL 重新读取完整记录与状态，并重建受影响的模型或项目证据。记录变化使受影响设计与 Summary 需重查。交接前仍须完成完整覆盖检查，并落定已持久化记录、用户明确豁免或无 normative 内容声明之一；不创建空记录，不默认豁免。
        acceptanceCases: []
      - name: 委托可行性实验
        body: |-
          必要的方案可行性实验 SHALL 在 Explore 完成，为 Propose 奠定设计基础。Explore 向专门 Experimenter 提供待回答问题、约束和决策背景；由 Experimenter 自主设计并执行最小实验，交付方法、结果、分析与限制。Explore 依据证据继续比较方案、请求用户确认，不把实验成功当作方案已获采纳。不得以统一只读能力禁令阻止实验编写与执行。

          实验使用当前工作区、临时目录、项目副本或 worktree 等，由主 Agent 与 Experimenter 根据情况选择；框架不预设选择策略，也不把执行细节逐项交用户设计。实验产物不视为正式 Change 实现。

          - Propose 前必须确认某 API 能力：Explore 提供问题与约束，Experimenter 设计并运行最小验证，Explore 将可行性证据和限制用于设计确认。
        acceptanceCases: []
  element:explore-role:
    declaration:
      identity: explore-role
      kind: element
      parent: agent
      title: Explore Role
      definition: Explore 是 Agent 在 Intent-first Path 中澄清用户意图、范围、影响和设计的工作身份。它结合 Semantic Model、CLI 查询与项目证据推进 Design Exploration，并在用户确认设计后通过 Design Record 经 CLI 立即记录该部分已确认内容；在适用设计确认和记录冲突调和后，交付 conversation-only Design Summary 与可用的记录身份，不编写完整 Change，也不实现项目。
    sections:
      - name: 交付 Design Summary
        body: |-
          Explore Role SHALL 在适用设计确认及当前记录冲突检查通过后向 Propose 交付 conversation-only Design Summary；存在记录时同时交付其稳定身份与核对版本，无记录时不强制创建。

          - **Explore 活动完成**

            - 适用设计已确认，存在时的记录已重载且无未决冲突
            - 交付有效 Summary 与可用来源身份，不以记录取代完整设计。
        acceptanceCases: []
      - name: 不实现项目
        body: Explore Role SHALL NOT 落实正式项目改动。必要的可行性实验可由 Experimenter 编写并运行；实验结果用于设计判断，不作为正式 Change 已实现的交付。设计稳定后进入 Propose 成文。
        acceptanceCases: []
      - name: 维护中间设计并委托实验
        body: |-
          Explore Role SHALL 通过 CLI 维护当前设计记录，可自主保存 pending 问题、假设与建议；accepted、excluded 及已确认内容的实质修订由用户决定。必要可行性实验委托 Experimenter 同时设计和执行，提供问题、约束及背景，并消费其证据继续设计。

          Explore 不写完整 Change、不提升正式模型，也不落实正式项目改动；允许实验所需的编写、运行及记录维护。用户确认设计只授权相应记录变化，不自行推导为普通项目文件、生成工作面或 Change 制品的修改授权。
        acceptanceCases: []
      - name: 按需读取并恢复当前语义
        body: |-
          Explore 工作身份 SHALL 按当前设计问题渐进读取 Semantic Model：先定位候选与范围，再读取所选 identity 的完整 Declaration，并仅在需要判断规范承诺时读取完整 Contract。Explore SHALL 复用当前阶段内仍有效的读取结果和 record-level `sourceVersion`；不得将普通讨论或每次局部记录更新变成完整读取仪式。

          当上下文压缩、会话切换、版本冲突、相关模型 drift 或无法确定当前状态时，Explore SHALL 重新建立完整记录、状态与受影响模型语义依据。未重新读取的 Definition 或 Contract 不得从 identity、title、旧摘要、残余对话或实现证据推断。每次扩大读取须对应明确问题，且读取范围不得超过回答该问题所需的 identities。
        acceptanceCases: []
  element:framework-identity:
    declaration:
      identity: framework-identity
      kind: element
      parent: semantic-objects
      title: Framework Identity
      definition: Framework Identity 定义息壤开发框架的统一产品身份：唯一 `xirang` CLI 可执行入口、隐藏 `.xirang` durable workspace 与无兼容层合同。它是项目级身份不变量，可直接在 Project Root 下独立演进，不依赖实现结构。
    sections:
      - name: CLI 可执行命令 SHALL 为 xirang
        body: |-
          息壤 CLI 的唯一可执行命令 SHALL 为 `xirang`，不提供其他命令别名。

          - **运行 CLI 命令**

            - 用户在终端执行 `xirang --help`
            - 系统 SHALL 显示息壤 CLI 帮助信息
            - 帮助信息 SHALL 包含 `xirang` 作为命令名称

          - **尝试使用其他命令名称**

            - 用户尝试通过其他命令名称调用本框架
            - 系统 SHALL 报告命令不存在
            - SHALL NOT 自动路由到 `xirang`

          - **Shell completion**

            - 用户安装 shell completion
            - 补全脚本 SHALL 为 `xirang` 命令注册
            - SHALL NOT 为其他命令名称注册
        acceptanceCases: []
      - name: 项目工作区 SHALL 为 .xirang
        body: |-
          目标项目的息壤 durable workspace SHALL 位于项目根目录 `.xirang/`。Project Setup、Candidate 与 history 均 SHALL 使用该唯一 workspace，且 SHALL NOT 回退或双写其他目录。

          - **Setup 新项目**

            - 用户运行 `xirang setup`
            - 系统 SHALL 创建 `.xirang/` durable core
            - SHALL NOT 创建 non-hidden legacy workspace

          - **跨平台路径处理**

            - CLI 在 Windows、macOS 或 Linux 构建 `.xirang/` 路径
            - SHALL 使用 `path.join()` 或 `path.resolve()`
            - SHALL NOT 硬编码路径分隔符
        acceptanceCases: []
      - name: 工作区目录结构 SHALL 完整
        body: |-
          `.xirang/` SHALL 包含 formal Semantic Model、change-local deltas、Agent references 和配置，并 MAY 按操作需要物化一个 active Candidate 与 durable history。

          - **标准工作区结构**

            - 初始化息壤项目
            - durable core SHALL 包含四分区模型、`changes/`、`references/` 和 `config.yaml`
            - Project Build MAY 物化 `.xirang/candidate/`
            - promotion 和 retired workspace cleanup MAY 物化 `.xirang/history/`
            - SHALL NOT 物化 active bootstrap 或 migration workspaces

          - **History 不是 fallback source**

            - CLI 读取 formal model
            - SHALL 只读取 `.xirang/model/`
            - SHALL NOT 从 `.xirang/history/` 自动恢复或补全 source
        acceptanceCases: []
      - name: CLI 命令引用 SHALL 一致
        body: |-
          所有 active user-facing documentation、generated workflow templates、Agent instructions、skills、prompts 和 active Element Contracts SHALL 仅引用当前 `xirang --help` 暴露的命令与当前 managed skill names。

          - **Project Build command references**

            - active surface 描述 setup 或 Project Build
            - SHALL 使用 `xirang setup`、`xirang candidate init|status|validate|promote` 与 `xirang-build`
            - SHALL NOT 使用退役命令名或 bootstrap 工作流名称

          - **Archive history 残留**

            - stale references 仅存在于 `.xirang/changes/archive/**` 或 `.xirang/history/**`
            - MAY 将其保留为历史证据
            - active surfaces SHALL NOT 从这些文件生成 guidance
        acceptanceCases: []
      - name: 不提供迁移兼容层
        body: |-
          息壤 SHALL NOT 提供其他命令别名、non-hidden legacy workspace 回退或自动迁移工具。

          - **无命令别名**

            - CLI 注册可执行命令
            - 系统 SHALL 仅注册 `xirang`
            - SHALL NOT 注册其他别名

          - **无目录双读**

            - CLI 读取项目配置、模型或 changes
            - 系统 SHALL 仅从 `.xirang/` 读取
            - SHALL NOT 回退到 non-hidden legacy workspace 或提示迁移

          - **无自动迁移工具**

            - 用户在仅含 non-hidden legacy workspace 的项目运行 `xirang` 命令
            - 系统 SHALL 报告未找到 `.xirang/` 项目
            - SHALL NOT 自动迁移该 workspace
        acceptanceCases: []
      - name: Telemetry command identity SHALL 为 xirang
        body: |-
          Telemetry events SHALL 使用 `xirang` 作为 executable identity，并使用当前 command path 作为 command property。

          - **记录 setup**
            - 用户执行 `xirang setup`
            - telemetry SHALL 记录 command `setup`
            - SHALL NOT 记录 `init`

          - **记录 Candidate subcommand**
            - 用户执行 `xirang candidate validate`
            - telemetry SHALL 记录完整 command path `candidate:validate`
            - SHALL NOT 记录 Candidate paths、digest 或项目内容
        acceptanceCases: []
      - name: Package.json bin entry SHALL 为 xirang
        body: |-
          npm package 的 bin entry SHALL 为 `xirang`。

          - **npm 安装后可执行**

            - 用户通过 npm 安装框架
            - 系统 SHALL 在 PATH 中创建 `xirang` 可执行链接
            - SHALL NOT 创建其他框架命令链接
        acceptanceCases: []
  element:hierarchical-elements:
    declaration:
      identity: hierarchical-elements
      kind: element
      parent: semantic-model
      title: Hierarchical Elements
      definition: 从 Project Root 开始、可任意深入的项目抽象结构。每个 Element 表达项目在某一抽象层级上可独立理解的语义单元，父 Element 表达较高层抽象，子 Element 对其进一步精化。
    sections:
      - name: 以父子层级精化语义
        body: |-
          Hierarchical Elements SHALL 只有一个 Project Root；每个非根 Element SHALL 通过显式 parent identity 归属父 Element，子 Element SHALL 对父 Element 作进一步精化。

          - **下钻项目抽象**

            - 用户从一个 Element 查看其 children
            - 每个 child 在更具体的抽象层级细化该 Element

          - **唯一 Project Root 校验通过**
            - 模型包含一个标记为 root 的 project element 且其他 elements 均可追溯到该 root
            - root validation SHALL 通过
        acceptanceCases: []
      - name: 联合声明与契约
        body: |-
          每个 Element SHALL 由 Element Declaration 与其至多一个 Element Contract 共同表达，且 Contract 是否必需 SHALL 由对应 Element Kind 决定。

          - **理解一个 Element**

            - Agent 读取一个 Element
            - Agent 联合其 Declaration 与 Contract 判断结构身份和规范行为
        acceptanceCases: []
      - name: Containment 表达抽象精化
        body: |-
          非根 Element 的 parent SHALL 表达其高层抽象；`belongs_to`、`refines` 与 `abstracts` SHALL NOT 作为重复的持久化 Relationship edges。

          - **多层精化合法**

            - 模型使用任意深度的 single-parent nesting 且满足全部可选 Metamodel constraints
            - containment validation SHALL 通过，query SHALL 返回 parent、children 与 depth
        acceptanceCases: []
  element:implementation-first-path:
    declaration:
      identity: implementation-first-path
      kind: element
      parent: change-formation
      title: Implementation-first Path
      definition: Implementation-first Path 是 Change Formation 的路径之一：从已发生的项目实现出发，再形成完整 Change。该路径通过 Snack 对照 Semantic Model 与实现证据，形成完整 Change。
    sections:
      - name: 从已发生实现出发
        body: |-
          Implementation-first Path SHALL 以已经发生的项目实现为形成 Change 的起点。

          - **实现先于 Change**
            - 项目改动已经存在
            - Agent 不重做标准 Apply
        acceptanceCases: []
      - name: 通过 Snack 对照模型与证据
        body: |-
          Implementation-first Path SHALL 通过 Snack 对照 Semantic Model 与实现证据。

          - **识别语义影响**
            - Snack 检查已有实现
            - 它结合模型与证据识别影响面
        acceptanceCases: []
      - name: 形成完整 Change
        body: |-
          Implementation-first Path SHALL 通过 Snack 形成完整 Change。

          - **Snack Formation 完成**
            - Delta 与适用 Plan 已完整并确认
            - 已有实现获得对应的完整 Change
        acceptanceCases: []
      - name: 不生成执行任务清单
        body: |-
          Implementation-first Path SHALL 因实现已经完成而不生成 `tasks.md`。

          - **编写 Change Plan**
            - Snack 记录已有实现的意图与决策
            - Plan 不包含执行任务清单
        acceptanceCases: []
      - name: 移交验证与收束
        body: |-
          Implementation-first Path 形成完整 Change 后 SHALL 进入后续验证与 Change Closure。

          - **已有实现完成调和**
            - Formation 审查与确认通过
            - 当前实现交由 Verify 独立评估
        acceptanceCases: []
  element:intent-first-path:
    declaration:
      identity: intent-first-path
      kind: element
      parent: change-formation
      title: Intent-first Path
      definition: Intent-first Path 是 Change Formation 的路径之一：从用户意图出发，先形成 Change，再进入实现。该路径先通过 Explore 澄清意图、范围与影响并形成 Change 雏形，再通过 Propose 将雏形收成完整 Change，最终得到可进入 Change Implementation 的 Change。
    sections:
      - name: 从用户意图出发
        body: |-
          Intent-first Path SHALL 以尚待形成 Change 的用户意图为起点，并在项目实现前形成 Change。

          - **用户提出新意图**
            - 目标实现尚未发生
            - Agent 先进入 Formation
        acceptanceCases: []
      - name: 先由 Explore 形成 Change 雏形
        body: |-
          Intent-first Path SHALL 先通过 Explore 澄清意图、范围与影响，并形成 conversation-only Design Summary 作为 Change 雏形。

          - **设计需要澄清**
            - 用户意图尚不能直接编译为 Change
            - Explore 推进设计确认并形成 Summary
        acceptanceCases: []
      - name: 再由 Propose 形成完整 Change
        body: |-
          Intent-first Path SHALL 再通过 Propose 将 Change 雏形收成包含 Semantic Delta 与 Change Plan 的完整 Change。

          - **Design Summary 已确认**
            - Propose 接收已确认 Summary
            - 它将内容编译为完整 Change
        acceptanceCases: []
      - name: Formation 后方可实现
        body: |-
          Intent-first Path SHALL 在完整 Change 形成并完成必要审查与确认后方可进入 Change Implementation。

          - **Change 尚未完整**
            - Delta、Plan 或确认任一缺失
            - 项目实现不得开始
        acceptanceCases: []
  element:interaction-surfaces:
    declaration:
      identity: interaction-surfaces
      kind: element
      parent: collaboration-structure
      title: Interaction Surfaces
      definition: Interaction Surfaces 是 Realization 中供用户与 Agents 配置、理解和操作息壤的交互界面体系。它建立和维护息壤项目、项目配置与 Agent 工具集成，提供确定性操作，并以 Views 呈现 Semantic Model 与 Change-derived information；CLI 支持 Text Presentation，Web 支持 Visual Presentation。
    sections:
      - name: 维护项目与工具集成
        body: |-
          Interaction Surfaces SHALL 建立和维护息壤项目、项目配置与 Agent 工具集成。

          - **配置项目**

            - 用户建立或更新息壤项目
            - 界面维护项目与所选 Agent 工具的配置
        acceptanceCases: []
      - name: 提供确定性操作
        body: |-
          Interaction Surfaces SHALL 为 Realization 提供确定性操作。

          - **重复相同有效操作**

            - CLI 接收相同有效输入
            - 操作产生一致结果
        acceptanceCases: []
      - name: 通过 Views 呈现语义信息
        body: |-
          Interaction Surfaces SHALL 以 Views 呈现 Semantic Model 与 Change-derived information。

          - **用户浏览 Change**

            - 用户选择一个活动 Change
            - 界面使用适用 View 呈现模型和差异
        acceptanceCases: []
      - name: 不构成语义来源
        body: |-
          Interaction Surfaces SHALL NOT 构成新的规范性语义来源。

          - **界面显示派生信息**

            - 界面组织或布局模型信息
            - 规范语义仍由 Semantic Model、Change 与用户决策决定
        acceptanceCases: []
      - name: 保持呈现方法非独占
        body: |-
          CLI 与 Web 对 Text/Visual Presentation 的支持 SHALL NOT 表示某种呈现方法被某一界面独占。

          - **CLI 输出文本 View**

            - CLI 以人类可读文本呈现模型信息
            - 该文本呈现不因 CLI 存在而转归 Web 所有
        acceptanceCases: []
      - name: 由 CLI 与 Web 组成
        body: |-
          Interaction Surfaces SHALL 由 CLI 与 Web 两类界面共同支撑 Realization。

          - **选择交互界面**

            - 用户或 Agent 需要操作或理解息壤
            - 使用 CLI 或 Web
        acceptanceCases: []
  element:internal-agents:
    declaration:
      identity: internal-agents
      kind: element
      parent: agents
      title: Internal Agents
      definition: Internal Agents 是在与主 Agent 隔离的上下文中接受委托、提供独立判断或实验结果的执行主体。它们包含 Reviewer、Optimizer 与 Experimenter，各角色定义自己的操作能力；不承担用户设计确认、Change 关闭或 Semantic Model 提升。
    sections:
      - name: 在 Clean Context 中判断
        body: Internal Agents SHALL 在与主 Agent 隔离的上下文中接受委托并独立工作。Reviewer 与 Optimizer 在不受 Apply 过程判断影响的 clean context 中评估；Experimenter 独立设计与执行所委托实验。
        acceptanceCases: []
      - name: 独立读取判断依据
        body: Internal Agents SHALL 按角色与委托问题独立读取所需依据。Reviewer、Optimizer 读取 Semantic Model、Change 与当前项目证据；Experimenter 读取问题、约束、决策背景和所需项目证据，不要求尚未形成的完整 Change。
        acceptanceCases: []
      - name: 输出结构化结论
        body: Internal Agents SHALL 向主 Agent 返回结构化判断或实验结果。评估角色返回证据及所需修正或优化事项，Experimenter 返回方法、观察结果与限制；由主 Agent 编排后续过程，不替用户确认设计。
        acceptanceCases: []
      - name: 不关闭 Change
        body: |-
          Internal Agents SHALL NOT 关闭 Change。

          - **验证结论通过**

            - Internal Agent 判断当前状态满足门禁
            - Closure 仍由 Agent 编排
        acceptanceCases: []
      - name: 不提升 Semantic Model
        body: |-
          Internal Agents SHALL NOT 提升 Semantic Model。

          - **Candidate 通过评估**

            - Internal Agent 没有发现阻塞问题
            - 它不执行 promotion
        acceptanceCases: []
      - name: 不替代确定性查询
        body: |-
          影响发现、模型导航和关系查询 SHALL 由 CLI 与 Web 承担，而不是由 Internal Agents 重做。

          - **需要模型影响上下文**

            - Internal Agent 需要确定性关系信息
            - 它消费 Interaction Surface 提供的结果
        acceptanceCases: []
      - name: 按角色限定操作能力
        body: Reviewer 与 Optimizer SHALL 保持只读，只返回事项，不通过 Bash 绕过编辑/写入限制。Experimenter MAY 编写并执行实验所需代码与文件，其能力限制由实验职责决定；不得以内部 Agent 统一只读禁止实验。所有角色都不承担用户确认、正式模型提升或 Change 关闭。
        acceptanceCases: []
  element:internal-subagent-generation:
    declaration:
      identity: internal-subagent-generation
      kind: element
      parent: agent-workbench-projection
      title: Internal Subagent Generation
      definition: Internal Subagent Generation 是框架内部 Agent 的工具原生制品投影能力，独立承载显式注册、按工具渲染、按角色配置权限、安装更新及用户模型设置保留；覆盖 Reviewer、Optimizer 与 Experimenter，不形成用户工作流，也不承担各角色的任务执行。
    sections:
      - name: Internal subagent 模板注册
        body: |-
          系统 SHALL 在共享常量中显式注册 xirang-reviewer、xirang-optimizer 与 xirang-experimenter，成员不通过目录扫描、glob 或 regex 推断，不包含 xirang-implementer。内部角色不注册到 workflow manifest，不生成用户可调用 workflow 或实验 skill。

          SubagentTemplate 至少有 name、description、prompt，可使用 tools、disallowedTools、model、mode、metadata、referenceFiles 等语义字段，不包含工具专属 frontmatter 字段名。Experimenter 模板 SHALL 承载实验设计、执行、证据交付与角色边界。
        acceptanceCases: []
      - name: Per-tool subagent artifact 渲染
        body: |-
          系统 SHALL 通过渲染函数把统一 `SubagentTemplate` 渲染为 tool-native subagent artifact 内容：Claude、Pi 与 OpenCode 使用 Markdown 与工具原生 frontmatter，Codex 使用 TOML。所有 renderer SHALL 仅在 `template.model` 存在且不等于 `"inherit"` 时输出 `model`。

          - **Claude renderer 输出 Markdown agent 文件**

            - 为 Claude 渲染 reviewer 模板
            - 返回内容 SHALL 以 YAML frontmatter 开头并包含 `name`、`description`、`tools`
            - frontmatter 后 SHALL 跟 Markdown body 承载 prompt

          - **Codex renderer 输出 TOML**

            - 为 Codex 渲染模板
            - 返回内容 SHALL 为合法 TOML
            - SHALL 包含 `name`、`description`、`developer_instructions`、`sandbox_mode`

          - **显式设置 model 时输出 model 字段**

            - `template.model` 设为非 `"inherit"` 的具体模型标识
            - 所有 renderer SHALL 输出对应 `model`

          - **Pi renderer 输出 foreground guidance**
            - 为 `xirang-reviewer` 或 `xirang-optimizer` 渲染 Pi artifact
            - frontmatter SHALL 包含 `name`、`description`、`tools`
            - `description` SHALL 追加 Pi-only 提示：`Pi callers: run foreground and omit timeoutMs/maxRuntimeMs.`
            - 其他工具 renderer SHALL NOT 追加该提示

          - **TOML multiline 安全转义**
            - template `prompt` 包含三引号序列或反斜杠字面量
            - Codex renderer SHALL 安全转义并保持合法 TOML

          - **OpenCode renderer 输出 subagent mode 与 permission**
            - 调用 `generateSubagentContent(template, 'opencode', version)`
            - frontmatter SHALL 包含 `mode: subagent`
            - Reviewer、Optimizer SHALL 声明 `permission.edit: deny`；Experimenter SHALL 按可编写实验的角色能力生成 edit 权限，不继承统一 deny
        acceptanceCases: []
      - name: Subagent artifact 写入路径
        body: |-
          系统 SHALL 将渲染后的 artifact 写入 `path.join(projectRoot, tool.agentsDir, 'agents', '<name>.<ext>')`，路径构造使用 `path.join()`。Subagent artifact 目录名与文件名 SHALL 定义为显式常量。

          - **Windows 上 reviewer 路径一致**

            - 在 Windows 上为 Claude 写入 reviewer artifact
            - 写入路径 SHALL 通过 `path.join(projectRoot, '.claude', 'agents', '<name>.md')` 构造
            - SHALL 使用平台原生路径分隔符

          - **Codex artifact 使用 toml 扩展名**
            - 为 Codex 写入 `xirang-optimizer`
            - 文件扩展名 SHALL 为 `.toml`
            - 路径 SHALL 通过 `path.join()` 构造

          - **Markdown artifact 使用 md 扩展名**
            - 为 Pi 写入 `xirang-reviewer`
            - 文件扩展名 SHALL 为 `.md`
        acceptanceCases: []
      - name: Tool metadata 声明 subagent 支持
        body: |-
          `AIToolOption` SHALL 通过可选字段 `agentsDir` 与 `agentFormat` 声明该工具是否支持 tool-native subagent artifact。未声明 `agentsDir` 的工具 SHALL NOT 生成 subagent artifact。

          - **四个目标工具声明 agentsDir 与 agentFormat**

            - 查询 `claude`、`pi`、`opencode`、`codex` 的 `AIToolOption`
            - 每个工具 SHALL 声明 `agentsDir`
            - `claude`、`pi`、`opencode` SHALL 声明 `agentFormat: 'markdown'`
            - `codex` SHALL 声明 `agentFormat: 'toml'`
        acceptanceCases: []
      - name: Init 与 Update 集成 subagent artifact 生成
        body: |-
          `xirang setup` 与 `xirang update` SHALL 通过 shared ArtifactSyncEngine 生成 workflow skills 和 internal subagent artifacts；Project Build 的完成 SHALL NOT 依赖 subagent artifact availability。

          - **Setup 生成 subagent artifacts**
            - 用户执行 `xirang setup` 并选择支持 internal subagents 的工具
            - 系统 SHALL 生成 managed internal subagent artifacts
            - SHALL 同时生成 `xirang-build` workflow skill

          - **Build 不依赖 subagents**
            - Agent 运行 `xirang-build`，且当前工具不支持 internal subagents
            - Build SHALL 仍可通过 Candidate authoring、validation 和 promotion 完成
            - SHALL NOT 因缺少 subagent artifact 而改变 Candidate contract

          支持原生 subagent 的工具 SHALL 经现有显式列表和安装流程生成/更新三种角色；更新已有 Experimenter 时同样保留非 inherit 的用户 model。新增角色不改变 workflow 集合，不添加独立安装入口；受管清理仍按显式名单与 ownership 检查，不删除用户同名非受管文件。
        acceptanceCases: []
      - name: 旧 internal skill 目录迁移 cleanup
        body: |-
          Setup/update SHALL 使用显式 managed name list 清理退役 internal artifacts。删除前 SHALL 验证现有 ownership/header 能证明文件由 Xirang 生成；系统 MUST NOT 仅凭文件名、glob 或 regex 删除文件。

          - **用户同名文件保持不变**

            - 用户创建了同名 agent 或 skill 文件且该文件不具有 Xirang generated ownership/header
            - setup/update SHALL 保留该文件
            - SHALL NOT 因名称匹配而删除

          - **Cleanup 跨平台构造路径**
            - 在 Windows、macOS 或 Linux 上执行 cleanup
            - 所有候选路径 SHALL 由 `path.join()` 和显式受管名称构造
            - 行为 SHALL 在支持平台上一致
        acceptanceCases: []
      - name: 用户自定义 model 值在 update 时保留
        body: |-
          ArtifactSyncEngine 在写入 subagent artifact 前，SHALL 检查目标文件是否已存在；若已存在文件包含用户显式设置的 `model` 值（非 `"inherit"`），SHALL 将该值注入重新生成的内容中。

          - **Markdown agent 文件的用户 model 被保留**

            - 某工具的 agents 目录下已存在 reviewer 文件
            - 其 frontmatter 包含用户自定义 model
            - 用户执行 `xirang update`
            - 重新生成的文件 SHALL 包含该 model 值
            - 其余内容 SHALL 为模板重新生成的最新内容

          - **model 值为 inherit 时不保留**

            - 已存在的 agent 文件的 model 值为 `"inherit"`
            - 用户执行 `xirang update`
            - 重新生成的 agent 文件 SHALL NOT 包含 `model` 字段

          - **TOML agent 文件的用户 model 被保留**
            - 某工具的 `agents/` 目录下已存在 `xirang-reviewer.toml`
            - 其中包含 `model = "gpt-5"`
            - 用户执行 `xirang update`
            - 重新生成的 `xirang-reviewer.toml` SHALL 包含 `model = "gpt-5"`

          - **首次生成不带 model 字段**
            - agent 文件不存在（首次 `xirang setup` 或 `xirang update`）
            - `template.model` 未设置
            - 生成的 agent 文件 SHALL NOT 包含 `model` 字段
        acceptanceCases: []
      - name: 按角色编码工具原生权限
        body: |-
          生成制品 SHALL 在工具原生字段中编码角色权限。Reviewer、Optimizer 允许 read/search/bash，拒绝 edit/write 或使用等价 read-only sandbox；prompt 禁止借 Bash 绕过只读，与 subagent-self-read 对应角色一致。Experimenter 允许读取、搜索、编写、编辑与执行实验，不得只在 prompt 宣称可写却仍由统一只读字段阻止。

          - Claude 的 Experimenter tools 包含 Read、Grep、Glob、Bash、Write、Edit；Pi 包含 read、grep、find、bash、write、edit。
          - OpenCode 的 Reviewer、Optimizer edit 为 deny，Experimenter edit 为 allow；bash 沿用工具的执行授权配置。
          - Codex 的评估角色 sandbox_mode 为 read-only，Experimenter 为 workspace-write。
          - Pi-only 的 Reviewer、Optimizer foreground 提示与其他工具的模型输出、TOML 转义规则继续按对应角色渲染。
        acceptanceCases: []
  element:metamodel:
    declaration:
      identity: metamodel
      kind: element
      parent: semantic-model
      title: Metamodel
      definition: Semantic Model 使用的可扩展语义记法。它声明用于表达 Hierarchical Elements 的 Element Kinds 与用于表达 Relationships 的 Relationship Kinds，并可为每种 Kind 定义其所有实例共享的语义。
    sections:
      - name: 声明模型记法
        body: |-
          Metamodel SHALL 以稳定 identity 声明 Element Kinds 与 Relationship Kinds，并可规定各 Kind 的共享语义、契约策略、层级约束与关系端点约束。

          - **验证模型实体**

            - Element 或 Relationship 引用一个 Kind
            - 该 Kind 在 Metamodel 中存在且实体满足其约束
        acceptanceCases: []
      - name: 联合理解 Kind 变更
        body: |-
          Metamodel Kind 的变化 SHALL 与使用该 Kind 的 Element Declarations 或 Relationships 联合验证。

          - **修改 Kind 约束**

            - 一个 Kind 的共享约束发生变化
            - 目标模型中的全部相关实例按新约束重新验证
        acceptanceCases: []
      - name: 使用规范 Kind 字段
        body: |-
          Element Kind SHALL 声明 `identity` 与 `contract`，并可声明 `root`、`parents`、`children`、`nodePresentation`；`nodePresentation` SHALL 是可选 mapping，可声明 `shape`、`color`、`border`，其值域由 Xirang 与 LikeC4 适配所使用的显式枚举定义并由校验器约束。Relationship Kind SHALL 声明 `identity`，并可声明 `sourceKinds`、`targetKinds` 与 Kind 级 `presentation`；`presentation` SHALL 是可选 mapping，仅可声明 `color`、`line`、`head`、`tail`，各字段值域 SHALL 完整复用 LikeC4 公开支持的对应合法集合并由 Xirang 输入校验器严格执行。Kind 正文可表达其所有实例共享的语义。

          - **声明受约束 Relationship Kind**

            - Relationship Kind 限制允许的 endpoint Kinds
            - Metamodel 以 `sourceKinds` 与 `targetKinds` 声明并由模型校验器执行约束

          - **Element Kind 声明节点呈现**

            - Element Kind 声明合法 `nodePresentation`
            - 呈现只作为全局默认节点呈现，不改变该 Kind 的规范语义
            - 校验器验证字段和值合法性

          - **Relationship Kind 声明关系呈现**

            - Relationship Kind 声明合法 `presentation`
            - 该 Kind 的全部 Relationship instances 共享已声明的 `color`、`line`、`head` 与 `tail`
            - 未声明子字段分别继承 LikeC4 默认值
            - presentation 不改变 Relationship 的规范语义或 identity

          - **Relationship presentation 缺失**

            - Relationship Kind 未声明 `presentation`
            - 该 Kind 的 Relationships 使用 LikeC4 默认关系呈现

          - **非法 Kind presentation 被拒绝**

            - `nodePresentation` 或 Relationship `presentation` 包含未知字段、非法值或错误类型
            - 模型校验器返回 `ERROR`
            - 系统不将未知值自由透传给 LikeC4 renderer
        acceptanceCases: []
      - name: 默认开放 nesting
        body: |-
          未声明的 Kind pair constraint 不构成隐式禁止；显式声明的 parent/child 约束 SHALL 由验证器执行。

          - **未声明约束时通过**

            - parent kind 与 child kind 均存在且 Metamodel 未声明对应限制
            - containment SHALL 通过验证，不因深度或 kind pair 未列入固定表而失败
        acceptanceCases: []
  element:optimization:
    declaration:
      identity: optimization
      kind: element
      parent: quality
      title: Optimization
      definition: Optimization 是 Quality 中，在代码已通过 Review 的状态上对实现进行优化评估的活动，以一轮为单位推进。它由 Optimizer 作为 Internal Agent 在不受 Apply 阶段上下文影响的 clean context 中执行，判断哪些不必要的复杂度可以通过删除或简化消除，以及必要工作是否可以通过更合适的方式提高效率；每个优化方向都必须具有可说明的实际收益、充分的代码证据，并保持 Expected Semantic Model 与项目行为不变。
    sections:
      - name: 仅在 Successful Checkpoint 上开始
        body: |-
          Optimization SHALL 仅在 Review 通过并保存 successful checkpoint 后执行。

          - **Review 尚未通过**

            - 当前状态没有 successful checkpoint
            - Optimization 不开始
        acceptanceCases: []
      - name: 读取完整优化依据
        body: |-
          Optimization SHALL 读取 Semantic Model、Change、successful checkpoint 对应代码、项目证据与既有优化记录。

          - **Optimizer 评估当前状态**

            - Optimization 开始
            - 全部适用依据参与判断
        acceptanceCases: []
      - name: 优先消除不必要复杂度
        body: |-
          Optimization SHALL 优先识别可删除或简化的不必要复杂度。

          - **正确实现含冗余复杂度**

            - 删除或简化可保持行为
            - Optimization 将其作为候选事项
        acceptanceCases: []
      - name: 优化必须存在的工作
        body: |-
          Optimization SHALL 评估必要工作是否可通过更合适的算法、数据结构、控制流、I/O 或资源使用提高效率。

          - **必要工作存在可证明低效**

            - 更合适实现可保持目标语义
            - Optimization 可形成候选事项
        acceptanceCases: []
      - name: 只选择有价值且可验证的事项
        body: |-
          每项选中优化 SHALL 有实际收益、充分代码证据、行为保持约束、相称成本风险与可执行验证方式，且其 `impactLevel` SHALL 不低于 `optimization.minImpactLevel`。低于门槛的方向 SHALL NOT 作为 actionable 报告、SHALL NOT 被标注为 deferred 以填充结果、SHALL NOT 通过抬高 `impactLevel` 越过门槛。`impactLevel` SHALL 度量改动价值而非实现难度：有真实可证效果的小改动仍可为 `high`，仅重排代码而无效果的大重构在任何规模下都低于门槛。

          - **建议无法证明收益**

            - 候选事项不满足选择条件
            - Optimization 延后或拒绝该事项

          - **方向低于收益门槛**

            - 某个待选方向的 `impactLevel` 低于 `optimization.minImpactLevel`
            - 该方向不报告为 actionable，也不标注为 deferred
            - 不通过抬高其 `impactLevel` 使其越过门槛
        acceptanceCases: []
      - name: 将选中事项返回 Apply
        body: |-
          选中的 Optimization 事项 SHALL 返回 Apply 实现。

          - **优化事项被确认**

            - Optimization 选择事项
            - 当前 checkpoint 保持不变，事项交给 Apply
        acceptanceCases: []
      - name: 正确性问题返回 Review
        body: |-
          Optimization 发现正确性问题时 SHALL 停止并将问题返回 Review。

          - **当前实现不符合 Expected Model**

            - Optimizer 识别行为缺陷
            - 问题不作为优化事项处理
        acceptanceCases: []
      - name: 语义变化形成新 Change
        body: |-
          改变 Expected Semantic Model 的建议 SHALL 形成新的 Change。

          - **建议会改变目标行为**

            - 候选方向不是行为保持优化
            - 它不在当前 Optimization 中实施
        acceptanceCases: []
      - name: 无需继续优化时完成
        body: |-
          最新 successful checkpoint 不再存在需要执行的优化方向，或全部待选方向均低于 `optimization.minImpactLevel`，或方向数上限用尽，或用户拒绝继续优化时，Optimization SHALL 收口。全部方向低于门槛时 SHALL 以 `NO_ACTIONABLE` 收口并在 summary 中说明剩余机会低于门槛，该结论 SHALL 被视为正当结果而非未找到工作的失败。

          - **没有满足方向**

            - Optimizer 完成当前评估且不存在满足选择条件的方向
            - Optimization SHALL 以 `NO_ACTIONABLE` 收口
            - Quality 可判断 Optimization 已完成

          - **全部方向低于门槛**

            - 该轮所有待选方向的 `impactLevel` 均低于 `optimization.minImpactLevel`
            - Optimization SHALL 以 `NO_ACTIONABLE` 收口并在 summary 说明门槛
            - 不消耗方向额度，也不报告任何 sub-threshold 方向
        acceptanceCases: []
  element:optimization-execution:
    declaration:
      identity: optimization-execution
      kind: element
      parent: quality
      title: Optimization Execution
      definition: Optimization Execution 定义 Quality 中优化活动的执行协议：以代码已通过 Review 为入口条件逐轮推进、每轮由 fresh optimizer 判断方向、checkpoint 与失败回滚、两级优化额度控制、轮次台账持久化、每轮实现后的 clean-context 复核，以及收口驱动。它不定义方向数据合约（属于 Optimizer Findings），也不定义命令面的输入与诊断形状（属于 Quality CLI Gate）。
    sections:
      - name: 最优性检验执行
        body: |-
          系统 SHALL 在当前代码已通过 Review、Optimization 尚未收口、未因 `ABORTED_UNSAFE` 阻塞、且方向数未达 `optimization.directionLimit` 时进入下一轮 Optimization，除非配置或用户显式拒绝。每轮 MUST 至少由 fresh optimizer 判断一次是否存在可优化方向，master agent MUST NOT 替代 optimizer 判断。Optimizer SHALL 返回一份方向台账；发现正确性、spec 或 artifact 冲突时 SHALL 返回阻塞观察并停止选择方向。

          - **代码通过 Review 后进入 Optimization**

            - 当前代码已通过 Review
            - optimization 已启用且未显式拒绝
            - 系统 SHALL 委托 fresh optimizer 判断当前代码是否存在可优化方向

          - **配置或用户拒绝优化**

            - `optimization.enabled` 为 false 或用户显式拒绝优化
            - 收口记录 SHALL 使用 `stopReason: USER_DECLINED`
            - 终态 SHALL 为 `SKIPPED`
            - 已有的 Review 记录 SHALL 保持不变

          - **Review 副作用不阻止 Optimization**

            - Review 已写回 `tasks.md` 或更新 quality 记录
            - optimization 未被拒绝
            - 系统 SHALL 继续判断优化方向
            - SHALL NOT 因工作区非空而自动跳过
        acceptanceCases: []
      - name: Checkpoint 与回滚
        body: |-
          系统 SHALL 以非空 git commit 保存每个已通过 Review 的状态，并在每个优化轮次通过复核后创建增量 checkpoint。轮次复核失败时 SHALL 丢弃当轮未提交实现并恢复最近成功 checkpoint，同时保留已写入的 quality 记录；达到该方向失败上限时 SHALL 将该方向标记为 `rejected`，并继续处理其他方向。

          - **创建 baseline checkpoint**

            - 代码已通过 Review 且 Optimization 即将开始
            - 工作区包含本次 Apply 的未提交变更
            - 系统 SHALL 执行 `git add -A && git commit -m "wip: opt-checkpoint-r0 (baseline)"`
            - SHALL 将 commit SHA 持久化为 `.apply-isolation.json.optimizationBaselineCommit`

          - **干净工作区不得创建空 baseline**

            - Optimization 启动时工作区干净
            - 系统 SHALL 只复用已验证 baseline 或用户明确记录的完整实现 commit
            - MUST NOT 使用 `--allow-empty`

          - **以方向 ID 创建增量 checkpoint**

            - 某方向通过该轮复核
            - 系统 SHALL 执行 `git add -A && git commit -m "wip: opt-r${N} (<direction-id>: <description>)"`

          - **失败轮次回滚**

            - 该轮复核返回 `FAIL_NEEDS_CORRECTIONS`
            - CLI 已把该轮结论与失败方向写入 quality 记录
            - Apply SHALL 把更新后的 quality 记录与 `.apply-isolation.json` 快照到 repository 外
            - SHALL 执行 `git reset --hard HEAD` 和 `git clean -fd` 丢弃该轮实现
            - SHALL 原子恢复三份当前状态文件并验证各自 SHA-256
            - SHALL 从最近成功 checkpoint 与恢复后的台账重新判断方向

          - **终局状态保持兼容**

            - Optimization 收口
            - 终态 SHALL 为 `IMPROVED`、`DEGRADED`、`NOT_NEEDED`、`SKIPPED` 或 `ABORTED_UNSAFE`
            - 所有 `wip: opt-*` commits SHALL 保留

          - **优化完成后保留 checkpoints**

            - Optimization 收口
            - 所有 `wip: opt-*` commits SHALL 保留
            - 系统 SHALL NOT 自动清理这些 commits

          回滚保护 SHALL 覆盖当前 `.quality-state.json`、`.quality-log.jsonl`、`.apply-isolation.json` 及当前 Change 内的全部质量历史目录。执行 `git reset --hard HEAD` 和 `git clean -fd` 前，SHALL 将这些数据完整保存到 repository 外并记录文件清单与 SHA-256；之后恢复并逐项校验，包括历史中未被 Git 跟踪的文件，不因 HEAD 中没有这些文件而删除它们。历史目录原先不存在时 SHALL 保留该事实，不伪造旧轮次。

          恢复失败、校验不一致或历史文件缺失时 SHALL 停止，不提交新的优化结果。普通失败回滚 SHALL 保留当前台账的失败记录与预算，不调用重新验证的记录轮换流程。

          - **重启后的优化失败**：旧轮次历史已保存在 Change 内，新方向未通过 Review；回滚只丢弃本次 speculative code，三份当前状态文件和所有旧轮次历史均保持保存时的字节，状态匹配成功 checkpoint 后可按当前台账报告失败尝试。
          - **未跟踪的历史目录**：历史文件尚未被 Git 跟踪，`git clean -fd` 会清理它们；repository 外保存及恢复 SHALL 确保回滚后这些历史文件仍完整可读。
        acceptanceCases: []
      - name: 重试预算控制
        body: |-
          `config.optimization.directionLimit` SHALL 限制可选取的新方向数；`config.optimization.directionRetries` SHALL 只限制同一方向的失败次数；`config.optimization.minImpactLevel` SHALL 声明可选取的最低 `impactLevel`，默认 `low`。成功方向 MUST NOT 消耗方向失败额度，也 MUST NOT 被该额度限制；低于门槛的方向 MUST NOT 被选取，也 MUST NOT 消耗方向额度；方向数用尽后 SHALL 只允许收口。

          - **成功方向不消耗失败额度**

            - 选中方向通过该轮复核
            - 该方向的失败计数 SHALL 保持不变
            - 系统 SHALL 继续判断其他方向

          - **失败方向达到上限**

            - 同一方向失败次数达到 `directionRetries`
            - 该方向 SHALL 转为 `rejected`
            - 系统 SHALL 继续处理其他可执行方向

          - **方向数用尽**

            - 已选方向数达到 `directionLimit`
            - 系统 SHALL 拒绝选择新方向
            - SHALL 要求以 `DIRECTION_LIMIT_REACHED` 收口

          - **低于门槛的方向不被选取**

            - 某个待选方向的 `impactLevel` 低于 `minImpactLevel`
            - 该方向 SHALL 永不被选取，也不消耗方向额度
            - 当全部待选方向均低于门槛时 SHALL 以 `NO_ACTIONABLE` 收口
        acceptanceCases: []
      - name: 优化结果持久化
        body: |-
          系统 SHALL 把每轮的 optimizer 判断、方向台账、两级计数与收口结论持久化到当前状态快照，并把该轮记录追加到 append-only 日志。台账 SHALL 只保存方向数据、判断理由、证据引用与 hashes，不重复保存代码、diff 或完整实现快照。旧记录缺少新字段时 SHALL 按空集合读取。

          - **旧记录按空集合读取**

            - 状态记录包含 optimization 但不含 directions 或轮次历史
            - 系统 SHALL 将缺失字段解释为空数组
            - SHALL NOT 阻止 status、seal 或 archive compatibility

          - **Degraded 结果持久化**

            - Optimization 因一个或多个 `rejected` 方向收口但 Review 记录保持可用
            - Review 记录的 result SHALL 保持 `PASS_WITH_WARNINGS` 或 `PASS`
            - Optimization 终态 SHALL 为 `DEGRADED`
            - 已验证方向的历史 SHALL 保留

          - **记录失败方向与方向事件**

            - 选中方向导致该轮复核失败
            - 系统 SHALL 追加该方向的 `failed` 事件及失败证据
            - SHALL 更新该方向的失败方向记录与失败计数
        acceptanceCases: []
      - name: 优化 finding reconciliation
        body: |-
          每个优化轮次完成或失败后 SHALL 重新由 fresh optimizer 判断是否存在可优化方向。每轮判断 SHALL 基于当前代码、已有方向台账、失败方向与当前计数，并 SHALL 说明本轮选中方向的相对优先理由。Master agent SHALL 只实现本轮选中的方向。

          - **每轮结束后重新判断**

            - 选中方向通过该轮复核
            - 系统 SHALL 保存当前成功 checkpoint
            - SHALL 重新委托 fresh optimizer 判断剩余可优化方向

          - **master 发现冲突时提交证据**

            - master 发现选中方向与 spec、代码或测试证据冲突
            - SHALL 在台账中提交该方向的撤销理由与证据
            - SHALL NOT 静默跳过该方向
        acceptanceCases: []
      - name: 每轮实现后由 fresh reviewer 复核
        body: |-
          Master 实现选中方向后，系统 SHALL 委托 clean-context reviewer 复核该轮改动。Reviewer SHALL 验证该方向的 preservation constraints 是否保持，但 SHALL NOT 重新判断该方向的优化价值。该轮结论 SHALL 通过 `xirang quality review` 记录为一次 Review。

          - **fresh reviewer 复核轮次改动**

            - master 已实现选中方向
            - 系统 SHALL 委托 fresh reviewer，并传入方向 ID、preservation constraints、实现证据与当前代码
            - SHALL 以该 reviewer 的结论记录一次 Review
            - 顶层 agent MUST NOT 自行决定该结论
        acceptanceCases: []
  element:optimizer:
    declaration:
      identity: optimizer
      kind: element
      parent: internal-agents
      title: Optimizer
      definition: Optimizer 在已通过 Review 并保存为 Checkpoint 的实现上，评估是否存在值得执行且不改变目标语义的优化。它输出可说明收益与证据的优化事项，由 Apply 实现后再经 Review；不修改代码，不推进 Checkpoint；正确性问题返回 Review，改变目标语义的建议形成新的 Change。
    sections:
      - name: 独立取得 Optimization 依据
        body: |-
          Optimizer SHALL 自主读取最近 successful checkpoint、Semantic Model、Change、项目证据与优化记录。

          - **Optimizer 接受评估任务**
            - Optimization 开始
            - Optimizer 从当前成功状态取得依据
        acceptanceCases: []
      - name: 保持只读且不推进 Checkpoint
        body: |-
          Optimizer SHALL NOT 修改项目或推进 Checkpoint。

          - **Optimizer 选择事项**
            - 当前实现存在有价值优化
            - Optimizer 返回事项而不改变代码状态
        acceptanceCases: []
      - name: 交付结构化 Optimization 结论
        body: |-
          Optimizer SHALL 将选中事项、正确性问题或无需优化的结论作为结构化结果交付给 Agent。

          - **Optimization 判断完成**
            - Optimizer 完成当前评估
            - Agent 获得用于 Apply、Review 或完成阶段的结论
        acceptanceCases: []
  element:optimizer-findings:
    declaration:
      identity: optimizer-findings
      kind: element
      parent: quality
      title: Optimizer Findings
      definition: Optimizer Findings 定义 Quality 优化活动的方向台账合约：方向数据字段与稳定标识分配、方向状态集合、优先级与选择、每轮台账的判断与历史保留，以及优化循环的终止条件。它不定义命令面的输入形状（属于 Quality CLI Gate），也不定义执行顺序与回滚（属于 Optimization Execution）。
    sections:
      - name: Finding 数据合约与稳定标识
        body: |-
          一轮 Optimization 台账 SHALL 以 JSON 表达 `directions`（该轮方向候选）、`selected`（本轮选中方向）、可选的上一轮 `attempt` 结果，以及收口时的 `stopReason`。新方向 SHALL 包含 `location`、`opportunity`、`impact`、`evidence`、`recommendation`、`keyDesign`、`preservationConstraints`、`implementationOutline`、`validation`、`impactLevel`、`confidence`、`risk`、`cost`、`dependencies` 与 `priorityReason`；`impactLevel`、`confidence`、`risk`、`cost` SHALL 使用 `high | medium | low`。方向稳定 ID SHALL 由 CLI 分配：新方向在输入中 MUST 省略 `id`，CLI SHALL 在输出中回显分配结果。

          - **CLI 为新方向分配 ID**

            - 一轮台账包含两个合法新方向
            - CLI SHALL 使用同一批次时间戳和连续序号为其分配稳定 ID
            - SHALL 在输出中回显分配结果

          - **拒绝 agent 自构造 ID**

            - 输入中的新方向携带自行构造的 `id`
            - CLI SHALL 拒绝该输入
            - SHALL NOT 修改任何记录

          - **同批依赖解析**

            - 同一轮中某个新方向的 dependencies 包含 `{ "actionIndex": 0 }`
            - CLI SHALL 将其替换为第一个新方向获得的正式 ID
            - 持久化结果 SHALL NOT 保留 `actionIndex` 引用
        acceptanceCases: []
      - name: Finding 优先级与选择
        body: |-
          Optimizer SHALL 先排除静态证据不足或 preservation constraints 无法闭合的方向，再按高 `impactLevel`、高 `confidence`、低 `risk`、低 `cost` 的词典序排序。未满足的 dependencies SHALL 优先于依赖它的方向。每一轮 SHALL 最多存在一个 `selected` 方向，且该方向 MUST 是 dependencies 已满足后的最高优先级 `pending` 方向。

          - **选择依赖已满足的最高优先级方向**

            - 一轮台账产生多个 pending 方向
            - 最高收益方向依赖另一个 pending 方向
            - CLI SHALL 选择 prerequisite 方向
            - SHALL NOT 同时选择第二个方向

          - **拒绝跳过排序首项**

            - master 尝试选择低于当前首个可执行方向的建议
            - CLI SHALL 拒绝该输入
            - SHALL 要求在台账中提交撤销理由与证据后重新判断
        acceptanceCases: []
      - name: Selected finding 的 priorityReason 说明相对优先理由
        body: |-
          CLI 选择首个 actionable finding 后，其 `priorityReason` SHALL 说明该 finding 相对下一项的优先理由，使选择依据可追溯。

          - **priorityReason 记录相对优先理由**

            - CLI 选择首个 actionable finding
            - 该 finding 的 `priorityReason` SHALL 说明其相对下一项的优先理由
        acceptanceCases: []
      - name: 优化循环终止
        body: |-
          优化循环 SHALL 在不存在满足条件的方向、全部待选方向均低于 `optimization.minImpactLevel`、用户或配置拒绝继续优化、方向失败达上限且无其他可执行方向、或方向数达到 `optimization.directionLimit` 时收口。收口 SHALL 记录 `stopReason`，并据此推导终态。

          - **多个成功方向不受失败额度限制**

            - `directionRetries` 为 2 且连续三个方向依次通过复核
            - 系统 SHALL 允许三个方向依次完成
            - SHALL NOT 以成功次数消耗失败额度

          - **无方向时收口**

            - 一轮判断确认不存在满足条件的方向
            - 收口记录 SHALL 使用 `stopReason: NO_ACTIONABLE`
            - 终态 SHALL 为 `NOT_NEEDED`

          - **全部方向低于门槛时收口**

            - 一轮判断确认所有待选方向的 `impactLevel` 均低于 `minImpactLevel`
            - 收口记录 SHALL 使用 `stopReason: NO_ACTIONABLE`
            - 终态 SHALL 为 `NOT_NEEDED`

          - **方向数用尽时收口**

            - 已选方向数达到 `directionLimit` 且仍有满足条件的方向
            - 收口记录 SHALL 使用 `stopReason: DIRECTION_LIMIT_REACHED`
            - 终态 SHALL 为 `IMPROVED` 或 `DEGRADED`
        acceptanceCases: []
      - name: 方向状态集合
        body: |-
          方向状态 SHALL 为 `pending | selected | implemented | verified | failed | rejected | deferred`。达到同一方向失败上限时 CLI SHALL 将其置为 `rejected`。Optimizer MAY 主动将方向置为 `rejected` 或 `deferred`，但 MUST 同时给出理由，且 `rejected` 与 `deferred` SHALL 携带支撑证据。

          - **失败达上限转为 rejected**

            - 同一方向失败次数达到 `optimization.directionRetries`
            - CLI SHALL 将该方向置为 `rejected`
            - SHALL NOT 因此拒绝其他可执行方向

          - **主动撤销必须带理由与证据**

            - Optimizer 在台账中把方向置为 `rejected` 或 `deferred`
            - 该方向 SHALL 携带理由
            - SHALL 携带支撑证据
        acceptanceCases: []
      - name: 每轮台账与历史保留
        body: |-
          每个优化轮次 SHALL 生成或更新一份方向台账，并把该轮判断结果追加到 append-only 历史。既有轮次记录 MUST NOT 被覆盖或删除。

          - **每轮追加历史**

            - 一轮 Optimization 被记录
            - 该轮的方向判断结果 SHALL 追加到历史
            - 既有轮次记录 SHALL 保持不变

          - **拒绝覆盖既有历史**

            - 输入尝试替换或删除已持久化的轮次记录
            - CLI SHALL 拒绝该输入
            - 原历史 SHALL 保持不变
        acceptanceCases: []
  element:optimizer-protocol:
    declaration:
      identity: optimizer-protocol
      kind: element
      parent: optimization
      title: Optimizer Protocol
      definition: Optimizer Protocol 定义 Optimizer 角色与硬约束、输入合约、优化原则与禁止项、Failed Directions 避重协议、一层依赖展开与 finding JSON 输出合约。
    sections:
      - name: Optimizer 角色与硬约束
        body: |-
          `xirang-optimizer` SHALL 是方向驱动的通用优化审查者，负责判断正确实现是否值得优化及应如何优化。它 MUST 使用 fresh context 自主读取项目证据，MUST NOT 修改任何文件，MUST NOT 改变 specs、公开契约或领域语义。Optimizer SHALL 仅对当前 change base scope 内实现文件提出可执行方向；若发现 correctness、spec 或 artifact 冲突，SHALL 返回阻塞观察并停止选择方向。

          - **发现 correctness 缺陷时回到 Required Corrections**

            - optimizer 发现当前实现违反 spec 的 Section 语义
            - SHALL 返回带证据的阻塞观察
            - SHALL NOT 选择优化方向

          - **默认不指定 model**

            - 生成 optimizer subagent artifact
            - 模板 SHALL 不声明默认 `model`
            - 用户通过工具自身配置的 model SHALL 继续由现有生成机制保留
        acceptanceCases: []
      - name: Optimizer 输入合约
        body: |-
          顶层 agent MUST 传入合法 `changeName`、绝对 `changeDir` 和绝对 `projectRoot`。Optimizer SHALL 自主读取 quality 状态记录与历史日志、change artifacts、方向台账与失败方向、项目 optimization config、base scope 最终代码和一层关联上下文。`baseCommit` 缺失或 Git 无法解析时 SHALL fail closed。

          - **后续轮次读取持久台账**

            - quality 状态记录已包含方向台账与轮次历史
            - optimizer SHALL 读取全部非终态方向及历史结果
            - SHALL 基于当前文件内容生成该轮方向判断

          - **缺少 Review 记录**

            - `changeDir/.quality-state.json` 不存在
            - optimizer SHALL 返回 `Review record not found — cannot optimize without a passing Review`
            - SHALL NOT 推断代码状态

          - **Git evidence baseline 缺失**

            - `.apply-isolation.json.baseCommit` 缺失或无效
            - optimizer SHALL fail closed
            - SHALL NOT 从 `originalBranch` 或远程默认分支推断 scope

          - **区分当前与历史轮次**：当前 Change 存在质量历史目录时，Optimizer SHALL 按共享恢复 reference 读取旧判断、失败原因与重启原因，并基于当前代码重新评估。活动根目录的 Review、方向台账和计数是本轮执行依据；不得将旧轮次 PASS、已完成结论、方向状态、已用额度或失败次数导入本轮台账。新轮次仍须先有新通过的 Review，历史 PASS 不能满足缺少活动 Review 的前提。
        acceptanceCases: []
      - name: Optimizer scope 导航 SHALL 使用不可变证据基线
        body: |-
          Optimizer SHALL 从 `.apply-isolation.json.baseCommit` 读取不可变证据基线，并以 `git diff <baseCommit>...HEAD --name-only` 与 `git status --short` 的并集导航 scope；评估代码时 SHALL 以最终文件内容为准，不得以 diff hunks 或某次 commit 的局部变化替代。

          - **以 name-only diff 与 status 并集导航 scope**

            - optimizer 需要定位当前 change 的 base scope
            - SHALL 从 `.apply-isolation.json.baseCommit` 读取不可变证据基线
            - SHALL 使用 `git diff <baseCommit>...HEAD --name-only` 与 `git status --short` 的并集导航 scope
            - SHALL NOT 从 `originalBranch` 或远程默认分支推断 scope

          - **不以 diff hunks 替代最终文件内容**

            - optimizer 评估当前代码是否值得优化
            - SHALL 以 Read 到的最终文件内容为准
            - SHALL NOT 以 diff hunks 或某次 commit 的局部变化作为判断依据
        acceptanceCases: []
      - name: 优化原则与禁止项
        body: |-
          Optimizer SHALL 寻找具有实际收益、静态证据且可保持行为的通用优化。扫描面包括但不限于删除、简化、重复、控制流、职责边界、局部性、算法复杂度、数据结构、重复 I/O、无效分配和资源使用。任何列表或标签均为非穷尽候选信号，不得成为能力边界或强制分类。Finding 的 preservation constraints SHALL 覆盖适用的输入、输出、顺序、重复项、键唯一性、副作用次数、错误时机、精度和兼容性。依赖 workload、profile 或缓存命中率才能证明的建议 MUST 为 `deferred`。

          - **静态可证明的数据结构优化**

            - 当前代码在无顺序语义的成员查询中重复执行线性扫描
            - optimizer 可从代码证明键语义和重复项行为不变
            - optimizer MAY 提出使用适当 lookup 结构的 finding
            - SHALL 明确复杂度收益与 preservation constraints

          - **运行时收益无法证明**

            - 缓存建议的收益依赖未知 workload 或命中率
            - optimizer SHALL 将 finding 标记为 `deferred`
            - SHALL NOT 声称该优化具有已证明收益
        acceptanceCases: []
      - name: Failed Directions 避重协议
        body: |-
          Optimizer SHALL 读取方向台账与失败方向记录。同一目标、优化类型和实现边界构成同一失败方向；当前活动轮次内，optimizer MUST NOT 通过改写措辞重复已达 `optimization.directionRetries` 的方向。未达上限时 MAY 提供实质不同的关键设计。

          - **失败方向达到上限**

            - 某方向失败次数达到 `optimization.directionRetries`
            - optimizer SHALL 在台账中把该方向置为 `rejected` 并给出理由与证据
            - SHALL 继续评估其他方向

          已轮换历史中的失败计数不占用新轮次额度，也不直接恢复为新轮次 rejected 状态；旧失败证据仍 SHALL 作为判断参考，不能以新轮次从零计数为由忽略其设计边界或声称旧失败方案已经验证成功。
        acceptanceCases: []
      - name: 一层依赖展开扩大优化候选
        body: |-
          Optimizer SHALL 从 base scope 通过直接 imports、callers 与关系展开一层读取上下文。展开 SHALL 过滤项目外路径、gitignored 路径及构建产物目录。展开文件 MUST NOT 成为 actionable finding 的修改目标；scope 外机会 SHALL 标记为 `deferred`。

          - **展开文件只提供上下文**

            - base scope 文件调用 scope 外共享模块
            - optimizer SHALL 读取共享模块判断重复或契约风险
            - finding location SHALL NOT 要求修改该 scope 外文件

          - **展开仅一层**

            - `a.ts` import `b.ts` 且 `b.ts` import `c.ts`
            - optimizer SHALL 读取 `b.ts`
            - SHALL NOT 因该链继续展开 `c.ts`
        acceptanceCases: []
      - name: Optimizer finding JSON 输出合约
        body: |-
          `xirang-optimizer` SHALL 返回严格 JSON envelope，不得返回 Search/Replace、unified diff 或可直接应用的逐字补丁。每个 finding SHALL 提供具体代码位置、机会及影响、代码证据、修改建议、实现级关键设计、preservation constraints、实现步骤和验证建议。

          - **输出多个证据化 findings**

            - optimizer 在当前 scope 中发现多个值得执行的优化
            - SHALL 在同一 envelope 中返回全部 findings 及相对排序
            - 每项 SHALL 包含足以指导 master 实现和 reviewer 验证的设计与证据字段

          - **不输出逐字补丁**

            - optimizer 给出实现建议
            - 输出 SHALL NOT 包含 Search/Replace blocks 或 unified diff
            - SHALL 由 master agent 负责编码
        acceptanceCases: []
      - name: 跨工具 skill 路径兼容
        body: |-
          Optimizer subagent artifact SHALL 通过现有 per-tool renderer 和路径 API 生成，路径处理 MUST 跨 macOS、Linux 和 Windows。Finding location SHALL 持久化为项目相对 POSIX 路径。

          - **Windows 路径输入规范化**

            - optimizer 在 Windows 环境读取反斜杠路径
            - 输出 finding location SHALL 规范化为项目相对 POSIX 路径
            - SHALL 与 CLI hash 校验使用同一逻辑路径
        acceptanceCases: []
  element:participants:
    declaration:
      identity: participants
      kind: element
      parent: collaboration-structure
      title: Participants
      definition: Participants 是 Realization 中参与意图授权、语义判断与项目落实的行为主体。由用户与 Agents 组成：用户保留意图与关键授权；Agents 依据 Semantic Model、Change、用户决策与项目证据推进 Realization，并通过 Interaction Surfaces 完成查询、投影与确定性操作。
    sections:
      - name: 由用户与 Agents 组成
        body: |-
          Participants SHALL 由用户与 Agents 组成。

          - **识别协作主体**

            - Realization 分配授权或执行职责
            - 职责归属于用户或适用 Agent
        acceptanceCases: []
      - name: 用户保留意图与关键授权
        body: |-
          Participants 的协作结构 SHALL 保留用户对意图与关键事项的授权权力。

          - **需要关键授权**

            - 事项必须由用户判断
            - Agents 等待用户授权
        acceptanceCases: []
      - name: Agents 依据语义与证据推进
        body: |-
          Participants 的协作结构 SHALL 由 Agents 依据 Semantic Model、Change、用户决策与项目证据推进 Realization。

          - **Agent 推进工作**

            - 用户已提供必要授权
            - Agent 使用规范语义与证据继续落实
        acceptanceCases: []
      - name: 通过 Interaction Surfaces 操作
        body: |-
          Participants SHALL 通过 Interaction Surfaces 完成查询、投影与确定性操作。

          - **需要确定性查询**

            - Participant 需要模型或 Change 信息
            - 通过 Interaction Surface 获取结果
        acceptanceCases: []
  element:post-propose-validation:
    declaration:
      identity: post-propose-validation
      kind: element
      parent: propose-workflow
      title: Post-propose Validation
      definition: Post-propose Validation 定义 Propose 收尾的一致性验证门禁：先执行计划一致性复核，对照 change-local Contracts、design.md 与 Semantic Delta 检测 tasks.md 的语义矛盾，发现矛盾时自行修正制品，仅当矛盾反映与用户意图或已确认决策不对齐时呈现给用户裁决；随后在最终制品上执行确定性校验作为收尾门禁，对完整 change 执行联合验证、生效差异审阅与任务结构校验，由确定性操作承担，报错阻塞 Apply 就绪声明，最多修复一轮、复检一次，警告只披露。
    sections:
      - name: 计划一致性复核
        body: |-
          Post-propose Validation SHALL 在确定性校验前将 change-local Contracts、design.md、Semantic Delta 与 tasks.md 联合对照 Explore 及 Propose 内的用户确认，检查计划与目标的一致性；不得仅以制品相互一致代替来源忠实性。已确认来源能确定修正方式时 SHALL 自行修正；需要改变已确认承诺、扩大范围或裁决重大业务及架构权衡时 SHALL 呈现全部发现，一次请求一个决策并等待确认。既定范围与方案内细枝末节 MAY 在完成时披露，无需逐项确认，但不以合理推导为名自行大量扩写设计。新确认的行为及推导补充的可观察保证 SHALL 贯穿相关 Delta 与 Plan，不得只藏在 design 或 tasks 中。 复核 SHALL 同时检查可用当前确认记录到目标语义、需实施的目标语义到 tasks 实现安排与 Checks 两段覆盖；第一段按性质、决策状态与适用性筛出需落实的已采纳规范内容，再按原子细节（条件、数值、例子、反例、时序、例外）逐项给出位置与摘录，并经 `xirang record coverage` 记录，任一应落实细节无位置即阻塞完成；影响当前目标的 pending 决策先解决，excluded 与 informative 不强造 Contract 义务；引用存在只是结构合法，不是行为覆盖证明。共同遗漏的已确认细节同样阻塞完成；缺失行为先补 Contract，再调整 Plan，未决意图交给用户。

          - **检测到矛盾时自行修正**

            - 复核发现 task 间声明矛盾或 task 与 change-local 目标语义冲突
            - 已确认来源能确定修正方式时 SHALL 自行修正制品，否则先询问用户
            - SHALL 修正后继续复核

          - **矛盾反映用户意图不对齐**

            - 矛盾反映与用户意图或已确认决策不对齐
            - SHALL 一次性呈现全部发现
            - SHALL 等待用户裁决后再继续

          - **复核干净时无声继续**

            - 复核未发现矛盾
            - SHALL 无声继续进入确定性校验

          - **复核不再由 Apply 承担**

            - apply workflow 启动实现
            - apply SHALL NOT 执行计划一致性复核
            - 复核 SHALL 由 Propose 收尾门禁在 Formation 内完成

          - **有效引用不代表实际覆盖**

            - Check 引用了存在的 Section 与 Acceptance Case，但命令或证据不能验证其行为
            - 修正实现安排或验证方式后重新复核，不用引用校验通过替代语义覆盖。

          - **目标到任务存在遗漏**

            - 目标 Contract 已表达条件分支，但任务与检查没有安排实现或验证
            - 补足相应行为闭环与检查，不在任务内另造规范语义。
        acceptanceCases: []
      - name: 完整机制自查
        body: Propose SHALL 用适用的边界或竞争事件序列检验机制、不变量、时序及验收结果，具体推演初始状态、事件顺序与预期结果，并检查实现方案能否落实这些结果；只列出场景名称不构成机制检查。发现问题时 SHALL 区分表达或推导错误与缺失决策。前者依据已确认设计修正，后者先向用户询问；结构合法与引用有效不能证明机制正确。
        acceptanceCases: []
      - name: 收尾确定性校验门禁
        body: |-
          Post-propose Validation SHALL 在计划一致性复核与用户裁决后的最终制品上执行确定性校验作为收尾门禁：对完整 change 执行联合验证、生效差异审阅与任务结构校验，由确定性操作承担；报错阻塞 Apply 就绪声明，最多修复一轮、复检一次，警告只披露。格式修复 SHALL 仅重述已有承诺，不得为了满足校验器而新增限制或行为；修复后 SHALL 重新核对受影响的语义结论。

          - **报错阻塞 Apply 就绪声明**

            - 确定性校验返回报错
            - SHALL 阻塞 Apply 就绪声明
            - SHALL 最多修复一轮并复检一次

          - **修复后报错残留**

            - 修复一轮并复检后仍有报错
            - SHALL 保持阻塞并报告残留报错

          - **仅警告不阻塞**

            - 确定性校验仅有警告且语义就绪已满足
            - 警告本身 SHALL 不阻塞 Apply 就绪声明
            - SHALL 在汇总中披露警告
        acceptanceCases: []
  element:project-build-role:
    declaration:
      identity: project-build-role
      kind: element
      parent: agent
      title: Project Build Role
      definition: Project Build 是 Agent 构建或重建 Semantic Model 的工作身份。它在用户授权的探索范围与声明的权威依据下，编写完整的 Candidate Semantic Model，使用 CLI 做只读校验，向用户呈现 valid Candidate 与 review digest；仅在用户确认后，由 CLI 将 Candidate 原子提升为 Semantic Model。
    sections:
      - name: 在授权边界内写入 Candidate
        body: |-
          Project Build Role SHALL 在用户授权范围与权威依据下写入 Candidate Semantic Model 与临时 `build.md`。

          - **Project Build 需要编译语义**

            - Agent 已获得范围和依据授权
            - 它只在 Candidate 工作区写入构建制品
        acceptanceCases: []
      - name: 呈现 Candidate 并请求确认
        body: |-
          Project Build Role SHALL 仅在完整 Candidate 通过 deterministic validation 与 clean-context semantic review 后，向用户呈现 Candidate、Formal comparison、审查信息与 review digest，并请求用户确认精确版本。

          - **Candidate 完成全部审查**

            - CLI 返回有效 digest 且 semantic review PASS
            - Agent 请求确认而不自行作出授权决定
        acceptanceCases: []
      - name: 通过 CLI 推进确定性门禁
        body: |-
          Project Build Role SHALL 使用 CLI 执行 Candidate 校验与经授权的 promotion，SHALL NOT 手工重做这些确定性操作。

          - **用户确认当前 Digest**

            - Agent 获得精确版本授权
            - 它调用 CLI promotion
        acceptanceCases: []
      - name: 编排 Modeling Decision Gate
        body: |-
          Project Build Role SHALL 识别会改变目标 Semantic Model 的未决选择，向用户提供受限选项，并将裁决作为例外 provenance 记录到 `build.md`。

          - **实现证据不能唯一确定用户意图**

            - 多个目标语义与现有权威相容
            - Agent 暂停相关编写并请求用户裁决
        acceptanceCases: []
      - name: 委托 Clean-context Semantic Review
        body: |-
          Project Build Role SHALL 将 structurally valid Candidate 的审查入口和权威依据交给通用 read-only clean-context subagent，SHALL NOT 将自身完成声明作为审查证据。

          - **Subagent 返回阻塞 Finding**

            - semantic review 返回 BLOCKER 或 HIGH
            - Agent 修正 Candidate 或返回 Modeling Decision Gate
        acceptanceCases: []
      - name: 执行 Promotion 后检查
        body: |-
          Project Build Role SHALL 在经授权 promotion 后执行 Candidate status、四分区目录和 Formal validation 检查，并只在全部满足时报告完成。

          - **Formal validation 失败**

            - promotion 命令已经成功但 post-check 失败
            - Agent 报告当前状态且不自动重试 promotion
        acceptanceCases: []
      - name: 初始阶段检测 subagent 可用性并询问模型
        body: |-
          Project Build Role SHALL 在初始询问阶段（与探索范围选择同时）检测当前环境是否可用 subagent，可用时询问用户 subagent 应使用什么模型。

          - **检测 subagent 可用性**

            - Build 启动且用户已选择探索范围
            - Agent SHALL 检测当前环境是否提供 subagent 能力
            - 可用时 SHALL 询问用户后续 subagent 使用什么模型

          - **Subagent 不可用**

            - 当前环境无法提供 subagent
            - Agent SHALL 继续使用自身模型完成迁移工作
            - 非复制改写仍应由 Agent 选择内容归属
        acceptanceCases: []
      - name: 审查已恢复内容不复活退役语义
        body: |-
          Project Build Role SHALL 在委托 clean-context semantic review 时，要求 subagent 检查 recovered legacy/formal 内容是否匹配当前行为且不复活退役词汇或已记录排除项。

          - **Review 发现已恢复内容包含退役行为**

            - subagent 发现 recovered 内容正向使用已排除的语义（如 Spec store、architecture-delta.c4 持久化、impact-sweeper）
            - review 返回 BLOCKER 或 HIGH finding
            - Agent 修正 Candidate 后重新审查
        acceptanceCases: []
      - name: 区分用户与 Agent 修改后的 promotion 处理
        body: |-
          Project Build Role SHALL 在 promotion 前重跑 `candidate validate --json` 并呈现新 digest。若 digest 自上次审查后变化：由用户手动修改的视为用户对当前内容认可，可直接 promote；由 Agent 修改的使 review 结论失效，需重新审查。

          - **用户手动修改后 digest 变化**

            - 用户直接在 Candidate 中编辑文件
            - 重新 validate 后 digest 与上次审查不同
            - Agent SHALL 视为用户已认可当前内容
            - 可不经重新审查直接 promote

          - **Agent 修改后 digest 变化**

            - Agent 因修正 review finding 或用户要求修改 Candidate
            - 重新 validate 后 digest 与上次审查不同
            - Agent SHALL 启动新的 clean-context review
            - SHALL NOT 跳过审查直接 promote

          - **用户介入通常意味着返修**

            - 用户参与 Build 过程中手动修改或要求更改
            - Agent SHALL 将多次 review 轮次与重新验证视为预期流程
            - SHALL NOT 视为失败
        acceptanceCases: []
  element:project-tooling-configuration:
    declaration:
      identity: project-tooling-configuration
      kind: element
      parent: cli
      title: Project and Tooling Configuration
      definition: Project and Tooling Configuration 是 CLI 中建立和维护息壤项目及其工具环境的能力。它通过相应 CLI commands 初始化和更新息壤工作区，读取和管理项目配置，选择、安装、刷新与同步 Agent 工具集成，并维护息壤托管的 Agent 工作面及其 instructions、templates 与 references。
    sections:
      - name: 管理项目与 Agent 工作面
        body: |-
          Project and Tooling Configuration SHALL 建立和维护息壤工作区、项目配置与所选 Agent 工具集成，并持续管理息壤托管的 Agent 工作面。

          - **建立新项目**

            - 用户选择项目与 Agent 工具
            - CLI 建立工作区、项目配置与对应工具集成
        acceptanceCases: []
      - name: 保持配置一致
        body: |-
          Project and Tooling Configuration SHALL 通过 CLI 维护项目配置和 Agent 工具集成的一致状态。

          - **更新已配置项目**

            - 用户请求维护现有项目配置与工具集成
            - CLI 依据当前配置刷新息壤托管的工作面
        acceptanceCases: []
      - name: 投影共享 Element Contract 语义
        body: |-
          Project and Tooling Configuration SHALL 从单一共享 authoring fragment 向 `xirang-build`、`xirang-explore`、`xirang-propose` 与 `xirang-snack` 投影 Element Definition 与 Element Contract 的边界及写作规则，SHALL NOT 为这些工作面维护相互独立的定义副本。

          - **刷新 Agent 工作面**

            - CLI 生成或更新 Build、Explore、Propose 与 Snack skills
            - 四个工作面消费一致的 Definition authoring contract，且存储记法仍由独立 notation fragment 提供
        acceptanceCases: []
      - name: 以 Project Definition 初始化根 Element
        body: |-
          Project and Tooling Configuration SHALL 在建立新 Xirang 工作区时收集 Project Definition，并以该完整 Definition 初始化 Project Root Declaration，SHALL NOT 将紧凑 summary 作为根 Element 的规范性概念表述。

          - **跨平台初始化项目**

            - 用户在 macOS、Linux 或 Windows 上建立新项目
            - CLI 通过平台路径 API 写入包含 `definition` 的 Project Root 单元，且结果不依赖路径分隔符
        acceptanceCases: []
      - name: 管理 Outline Element Definition 深度配置
        body: |-
          Project and Tooling Configuration SHALL 将 `architecture.outline.elementDefinitionDepth` 作为项目级 functional configuration 管理。该字段 SHALL 为非负整数，缺失时有效默认值 SHALL 为 `2`；默认值 SHALL 由同一配置常量用于 setup/update 磁盘物化、resilient parsing 后的 effective config、normalized projection 与 `arch outline` command resolution。

          - **新项目物化默认值**

            - `xirang setup` 或 config default migration 创建项目配置
            - `.xirang/config.yaml` SHALL 包含 `architecture.outline.elementDefinitionDepth: 2`
            - SHALL 使用现有 functional default materialization path，而不是独立硬编码

          - **既有项目补充缺失默认值**

            - update 或 default migration 处理未声明 outline config 的既有 `.yaml` 或 `.yml` 配置
            - CLI SHALL 只补充缺失的 nested mapping keys
            - SHALL NOT 覆盖用户已有的合法 `elementDefinitionDepth`

          - **读取合法配置值**

            - 项目配置包含 `architecture.outline.elementDefinitionDepth: 4`
            - normalized project config 与未显式覆盖的 `arch outline` SHALL 使用值 `4`
            - SHALL NOT 将该值解释为模型结构裁剪深度

          - **非法配置回退有效默认值**

            - 配置值为负数、非整数或 nested shape 非法
            - resilient parser SHALL 输出 field-specific warning
            - effective normalized projection 与 `arch outline` SHALL 使用默认值 `2`
            - 其他有效项目配置字段 SHALL 继续可用

          - **config project 显示有效值**

            - 用户运行 `xirang config project --json`
            - normalized output SHALL 包含有效 `architecture.outline.elementDefinitionDepth`
            - 缺失 raw config 时 SHALL 仍显示默认值 `2`

          - **Agent config projection 显示有效值**

            - CLI 为 Agent-facing artifact instructions 构建 `configProjection.prompt.fragments`
            - projection SHALL 包含 `architecture` fragment 与 `architecture.outline.elementDefinitionDepth: <effective value>`
            - fragment SHALL 只投影有效值，不重复静态 Semantic Model 恢复协议

          - **跨平台配置路径一致**

            - 在 Windows、macOS 或 Linux 上读取、创建或迁移 `.xirang/config.yaml` 或 `.xirang/config.yml`
            - CLI SHALL 使用 Node.js path utilities
            - 两种扩展名 SHALL 产生相同 outline configuration semantics
        acceptanceCases: []
      - name: 投影共享 Design Record 协议
        body: |-
          Project and Tooling Configuration SHALL 从 Xirang-owned 单一生成源向 Build、Explore、Propose 及共享 references 投影同版本 Design Record 协议与默认 semantic-refinement 指导，不运行时依赖用户级 problem-framing skill。受管生成面的新增、更新和删除 SHALL 按显式 manifest 名单定位，不按名称模式扫描替换；更名后不再投影的旧 Definition Framing reference SHALL 作为受管生成面被删除，用户专用拆分 skill 不受覆盖。

          - **共享协议在三入口可用**

            - CLI 同步所选 Agent 工具集成
            - Build、Explore、Propose 指向同版本可达的 Design Record reference，入口包含适用的读取与重读条件。

          - **旧受管 reference 被清理**

            - 工作区中存在由框架投影的旧 Definition Framing reference
            - 同步后该文件被删除，新 Design Record reference 可达，用户自有文件不受影响。

          - **受管同步不覆盖用户内容**

            - 刷新受本 Change 影响的模板、reference 与生成面
            - 只按登记名单更新相关工作面，保留用户 skill 与未登记内容，不直接修改生成文件代替源模板。
        acceptanceCases: []
  element:project.root:
    declaration:
      identity: project.root
      kind: project
      parent: null
      title: 息壤（Xirang）
      definition: 面向 Agent、以结构化用户意图驱动项目构建与持续演进的开发框架。它包含表达项目应该是什么的 Semantic Model、承载新的演进意图的 Change，以及负责落实这些意图的 Realization；三者共同使 Agent 能够基于统一的项目认知完成需求探索、方案形成、代码实现、独立审查和变更收束。
    sections:
      - name: 以用户意图驱动项目演进
        body: |-
          息壤 SHALL 以 Semantic Model 表达用户意图，以 Change 承载新的演进意图，并通过 Realization 落实项目构建与变更。

          - **推进项目演进**
            - 用户表达项目目标或新的变更意图
            - Agent 依据相应 Semantic Model 或 Change 推进 Realization
        acceptanceCases: []
      - name: 保留用户授权
        body: |-
          息壤 SHALL 由用户保留意图确认和无法由语义与项目证据确定之决策的授权权力。

          - **遇到未决语义**
            - 目标层级、契约或关系无法从权威依据确定
            - Agent 请求用户裁决而不自行猜测
        acceptanceCases: []
      - name: 表达项目意图与范围
        body: |-
          息壤 SHALL 让用户表达项目行为、架构意图、所有权、边界与语义协作，构成 Agent 可在不发明重大决策的前提下编译的模型。

          - **Agent 编译一个 Change**
            - Agent 探索、提议、实现、验证、同步或归档一个 Change
            - 它 SHALL 将模型分区与 Element Contracts 视为同一个 Xirang Semantic Model 的组成来源
            - SHALL 只把实现代码用作当前证据
        acceptanceCases: []
      - name: 保持稳定成功标准
        body: |-
          息壤 SHALL 提供稳定的 CLI 与生成的 Agent 工作流表面，保留 Explore → Propose → Apply → Verify → Sync → Archive 生命周期，校验 Semantic Delta，并仅在证据支撑的审查后提升 source。

          - **Change 达到稳态**
            - 一个 Change 完成
            - 其外部可观察行为 SHALL 由 Element-owned Contracts 表达
            - 其架构意图 SHALL 由稳定 Elements、refinement containment 与类型化语义关系表达
            - validation SHALL 在提升前检测不完整或矛盾的 source
        acceptanceCases: []
      - name: 维护全局语义不变量
        body: |-
          Project Root SHALL 唯一；每个非根 Element SHALL 恰有一个 parent；稳定 Element identity SHALL 独立于 containment path；每个 Element Contract SHALL 有一个显式 owner Element；contract required 的 Elements SHALL 具有真实契约。

          - **source 不完整**
            - 绑定、层级决策、契约、关系端点或必需策略无法从授权 source 确定
            - 息壤 SHALL 报告审查缺口
            - SHALL NOT 从文件名、imports、calls、source 布局、文本相似性或 catch-all owner 推断该决策
        acceptanceCases: []
      - name: 独立产品与持久工作区
        body: |-
          息壤 SHALL 通过唯一 `xirang` CLI 与 `.xirang` workspace 独立运行。Setup、Project Build、Candidate、formal source 与 history SHALL 具有明确边界，且不得存在 migration 或 history fallback semantic stores。

          - **项目 setup 或 build**
            - 息壤创建 setup skeleton 或 Agent 构建 Candidate
            - generated workflows SHALL 使用当前 Xirang identity 和统一 Semantic Model
            - retired bootstrap/migration workspaces SHALL 仅归档为 history evidence
            - runtime SHALL NOT 消费这些 retired inputs
        acceptanceCases: []
      - name: 证据门禁的源提升
        body: |-
          Candidate 模型与本次用户要求 SHALL 在 `.xirang/candidate/` 中保持隔离，直到记法、identities、policies、relationships、平台行为与 rollback path 通过 validation，且用户明确授权当前 `reviewDigest`。

          - **Candidate 有未解决缺口**
            - required validation 或 human decision 缺失
            - formal `.xirang/model/` SHALL 保持不变

          - **用户确认后 Candidate 改变**
            - `build.md` 或 Candidate source 在用户确认后发生变化
            - prior authorization SHALL 失效
            - promotion SHALL 要求新的 valid `reviewDigest`

          - **Promotion 成功**
            - confirmed digest 仍新鲜且原子转换完成
            - formal `.xirang/model/` SHALL 被完整替换
            - previous formal source SHALL 保存在 `.xirang/history/`
        acceptanceCases: []
  element:propose:
    declaration:
      identity: propose
      kind: element
      parent: intent-first-path
      title: Propose
      definition: Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录，按 Design Record 的写作规则将规范性确认内容（含用户确认的例子、数值、时序与例外）编译为完整 Semantic Delta，并以 Change Plan 解释意图、决策与实现路径。它在 Formation 内完成记录到目标语义的原子细节覆盖检查并经 CLI 门禁记录与交接、目标语义到任务的覆盖复核、必要审查与确认，使 Change 可进入实现；它不实现项目、不更新正式模型，也不关闭 Change。
    sections:
      - name: 复用已确认 Design Summary
        body: |-
          Propose SHALL 承接并复用 Explore 形成的已确认 Design Summary，以完整文档化为主要职责，不静默重做设计。 存在确认记录时 SHALL 核对 Summary 所依赖的记录版本；受影响内容变化或冲突未决时，先调和和重新确认，不能直接沿用旧 Summary。

          - **Design Summary 已存在**

            - Propose 接收完整 Summary
            - Agent 忠实编译已确认决策
        acceptanceCases: []
      - name: 补足最低语义就绪条件
        body: |-
          缺少 Design Summary 时，Propose SHALL 先确认 problem、impact scope、approach 与 verification method 足够清晰。

          - **用户直接进入 Propose**

            - 对话中没有完整 Summary
            - Agent 在编写 Change 前确认最低设计集
        acceptanceCases: []
      - name: 查缺补漏与决策确认
        body: |-
          Propose SHALL 思考并与用户交互，组织实际 Change 草稿，提出想法并讨论成文时发现的问题。MAY 自主处理既定范围和方案内的细枝末节、案例组织与表达或推导修正；不得以合理补充为名自主大量扩写或替用户形成实质设计。补出的分支、默认值、错误结果及限制 SHALL 对照确认来源，不能静默改变承诺。

          改变已确认承诺、扩大范围或涉及重大业务及架构权衡时，先说明缺口、选项与推荐理由，一次一问等待确认。小范围内容或方案调整可在 Propose 内讨论确认并继续，不因任何设计讨论或记录修订都切回 Explore。需要设计实验重新判断可行性、重选方向或大幅重做设计时，SHALL 返回 Explore 完成实验与设计调整，再继续 Propose。

          用户说“细枝末节的内容点的话，我觉得可以放权”时，Agent 可处理局部细节，但不能自行写很多实质内容；允许交互不等于无需确认。直接要求 Propose、不追问或 override 就绪建议都不提供缺失决策，无法确认时报告阻碍。
        acceptanceCases: []
      - name: 编写完整 Semantic Delta
        body: |-
          Propose SHALL 以 Semantic Delta 表达 Change 的完整目标语义。

          - **目标设计已明确**

            - Agent 编译目标状态
            - Delta 完整表达新增、修改或移除的语义
        acceptanceCases: []
      - name: 编写完整 Change Plan
        body: |-
          Propose SHALL 以 Change Plan 解释意图与实现路径。

          - **Change 需要审查与执行**

            - Agent 形成 Plan
            - Plan 提供适用的意图、决策和执行安排
        acceptanceCases: []
      - name: 完成 Formation 审查与确认
        body: |-
          Propose SHALL 根据复杂度安排用户审阅：简单变更先写完整草稿，再集中呈现具体差异及待决问题；复杂变更围绕一项机制或一组相关 Elements 分段编写、审阅，确认后继续，不机械地逐个 Element 请求确认。

          Formation 内 SHALL 对照确认来源检查完整机制、制品一致性和适用边界/竞争序列，不以制品互相一致或 CLI 通过替代语义判断。新确认的决策及允许自主处理的可观察细节 SHALL 贯穿 Delta 与 Plan；推导内容不得写回为用户确认。影响当前目标的未决问题阻塞完成。
        acceptanceCases: []
      - name: 完成时披露文档化补充
        body: |-
          Propose 完成汇报 SHALL 区分沿用的 Explore 确认或当前已确认输入、文档化时补出的内容及其依据和制品位置、Propose 内经用户确认的新决策，以及未决事项对就绪的影响；没有补充或新决策时 SHALL 明确说明。补充清单保留在会话，不新增永久台账或向规范正文混入确认过程状态。

          制品齐全与 CLI 校验通过 SHALL NOT 代替语义就绪判断；影响目标行为、范围或实现方案的未决重大决策 SHALL 阻止 ready-for-apply 声明；合理推导并披露的细节不因缺少单独确认而阻塞。完成报告 SHALL 区分实际 CLI 结果、Agent 语义检查发现与仍存在的证据缺口，以简明的检查发现及相关制品位置支持就绪结论；不得以制品数量、引用合法或依赖声明代替实际覆盖、机制与可执行性检查，也不要求输出完整自查过程或新增报告制品。
        acceptanceCases: []
      - name: 不实现项目
        body: |-
          Propose SHALL NOT 实现项目。

          - **Change 已完整形成**

            - Propose 到达出口
            - 项目实现仍由后续 Apply 落实
        acceptanceCases: []
      - name: 不更新或关闭 Change 状态
        body: |-
          Propose SHALL NOT 将 Semantic Delta 同步到 Semantic Model，也 SHALL NOT 关闭 Change。

          - **Delta 校验通过**

            - 完整 Change 可进入 Change Implementation
            - 正式模型与活动 Change 状态保持未收束
        acceptanceCases: []
      - name: 遵循共享 Contract 语义
        body: |-
          Propose SHALL 按共享 Element Contract、Section 与 Acceptance Case 语义编写 Contract Delta，并以 Section 的独立演进边界确定 Entries。

          - **编写多个 Section 义务**

            - 已确认设计包含可独立变化的规范承诺
            - Propose 将其表达为独立 Section Entries，并仅以 Acceptance Cases 具体化各自宿主 Section
        acceptanceCases: []
      - name: 编写完整 Definition 目标态
        body: |-
          Propose SHALL 为每个 ADDED 或 MODIFIED Element Declaration 编写完整目标态 Definition，SHALL NOT 以本次变化摘要、proposal 动机、design 实现方案或 Contract 义务代替 Definition；Contract-only Change SHALL NOT 顺带改写 Definition。

          - **Design Summary 已确认概念边界**

            - Propose 编译受影响 Declaration
            - Delta 携带变化后完整 Definition，而非只描述本次新增或修改的部分

          - **Definition 边界仍未确认**

            - 现有证据不能唯一确定目标概念身份或边界
            - Propose 返回 Explore 或一次询问一个用户决策，且不猜测 Declaration 目标态
        acceptanceCases: []
      - name: 处理已确认设计记录
        body: |-
          Propose SHALL 在入口读取共享 Design Record reference，通过 `xirang record list --json` 主动发现相关 Change-context 记录，不以 Summary 是否提及为前提。开始 Formation 时按共享 **Inputs and authority** 完整读取最新记录、状态与校验结果，核对 sourceVersion、上下文与 Summary；收尾覆盖验证前再次完整读取。编写相关部分确需核对时 MAY 使用 `record show <explorationId> --entry ... --json` 选择条目，不要求每段或每次局部更新前重读全文。

          Propose 与 Explore 共用记录。MAY 自主写入和维护 pending 问题、假设、建议；accepted、excluded 及既有确认的实质修改 SHALL 获用户允许，再经 CLI 局部更新，不将自行推导写成用户确认。有效上下文未发生变化时 SHALL 复用最近成功操作的 record-level `sourceVersion`、summary 和已知 identity；局部更新携带该版本，并检查返回的差异、summary 与新版本。版本冲突时重新加载当前记录并调和，不猜测或覆盖。

          完整 `record show/status/validate` SHALL 只用于阶段入口、恢复入口与收尾门禁。发生上下文压缩、会话切换、相关 Semantic Model drift 或无法确定当前记录状态时，重新建立完整依据。只编译已采纳且适用的规范内容，保留条件、数值、时序、例外与具体例子；结构部分编成匹配 Delta 或确认 no-op，不按实现关系重新派生。记录不是完整 Semantic Delta；说明材料按性质进入 Plan 或 provenance。

          无记录时 SHALL 核对用户明确豁免或本次无 normative 内容声明；未声明不得当作隐式豁免或默认已覆盖，先取得记录决策，不建立空记录。记录维护本身不要求返回 Explore；需要重新实验或方向重探时返回 Explore。
        acceptanceCases: []
      - name: 验证确认内容到目标语义的覆盖
        body: |-
          Propose 收尾 SHALL 完整读取最新记录，按内容性质、决策状态及当前 Change 适用性执行共享覆盖检查。已采纳且需落实的规范内容逐项保留条件、例外、数值、时序及正反例，并给出具体位置与当前位置摘录；无落位或摘录只含泛化规则仍算未覆盖。既有语义满足可确认 no-op，不制造 Delta。

          影响当前 Change 的 pending 问题须解决，不能忽略后宣布就绪；不影响当前目标时记录理由。excluded 仅保留必要理由，informative 进入 Plan 或来源历史，不强写为 Contract 承诺。输出简明语义判断与未覆盖身份，不以位置存在或 CLI 通过证明语义完整；缺义务先补 Contract，缺决策先询问用户。豁免或无 normative 内容时显式声明无条目需覆盖。
        acceptanceCases: []
      - name: 交接已确认设计来源
        body: |-
          存在记录时，完整 Change 通过确定性 validation 后，Propose SHALL 按共享规则区分性质、决策状态与适用性，对需落实的已采纳规范条目执行原子细节覆盖，并检查 pending 问题对就绪的影响，并通过 `xirang record coverage` 记录结果；CLI 拒绝时 SHALL 先把缺失细节补进目标 Contract 或 Delta，再重新检查并记录，不得以笼统描述代替逐项结果。覆盖结果有效后 SHALL 通过 `xirang record consume` 向该 Change 交接；consume 因覆盖过期、结构不一致或其他前置失败而拒绝时，保留来源且不声明 Formation 完成。检查后若再修改 Delta，SHALL 重新检查并记录。豁免或无记录时 SHALL 跳过覆盖记录与消费，同时保留已声明的记录决策，不建立空记录。来源快照与覆盖结果不参与 Expected Semantic Model。

          - **交接成功才完成 Formation**

            - validation 通过、覆盖结果有效且结构比对一致
            - 保存精确来源快照与覆盖结果并完成 Formation

          - **覆盖检查被拒绝**

            - `xirang record coverage` 报告某条目的例子没有落位
            - 把例子写入对应 Acceptance Case 后重新检查并记录，再执行 consume

          - **Consume 失败**

            - `xirang record consume` 返回失败
            - 保留来源且不声明 Formation 完成，按共享恢复协议处理

          - **豁免时跳过消费但保留决策**

            - 来源已声明豁免
            - 跳过覆盖记录与消费
            - 保留该记录决策于 Formation 证据中，不建立空记录
        acceptanceCases: []
  element:propose-role:
    declaration:
      identity: propose-role
      kind: element
      parent: agent
      title: Propose Role
      definition: Propose 是 Agent 将 Change 雏形收成完整 Change 的工作身份。它复用已确认设计与有效 Design Summary，消费可用的已确认设计记录，按写作规则编写完整 Semantic Delta 与 Change Plan，并编排原子细节覆盖检查及其 CLI 记录、确定性校验与来源交接；它交付可进入实现的 Change，不修改项目实现、不更新正式模型，也不关闭 Change。
    sections:
      - name: 写入 Change 制品
        body: |-
          Propose Role SHALL 组织并写入完整 Semantic Delta 与 Change Plan，按复杂度与用户审阅；可讨论并确认小范围调整、自主处理细枝末节，不自行大量扩写设计。需要重新实验判断方案时返回 Explore。

          可通过 CLI 维护与 Explore 共用的设计记录：pending 内容可主动维护，accepted、excluded 与已确认内容实质修改遵循用户确认边界。除此之外不任意写入 Change 目录外项目文件，不实现项目或更新正式模型。
        acceptanceCases: []
      - name: 交付可进入实现的 Change
        body: |-
          Propose Role SHALL 将 Propose 完成的完整 Change 交付给 Change Implementation。

          - **Propose 活动完成**

            - Delta、Plan、审查与确认均完整
            - Agent 报告该 Change 可进入 Change Implementation
        acceptanceCases: []
      - name: 不修改项目或正式模型
        body: |-
          Propose Role SHALL NOT 修改项目实现，也 SHALL NOT 将 Delta 应用于 Semantic Model。

          - **Change 已形成**

            - Propose 到达出口
            - 项目实现与正式模型保持未落实该 Change 的状态
        acceptanceCases: []
      - name: 编排确认记录消费
        body: |-
          Propose Role SHALL 在完整 Change 通过 validation 后，先经 `xirang record coverage` 记录原子细节覆盖检查结果，再调用 `xirang record consume`，核对版本、覆盖结果、结构比对、目标快照和来源生命周期成功才交付 Formation 结果；目标语义到任务的覆盖复核同样通过后才交付。没有记录时直接按普通 Propose 路径交付，不执行空覆盖记录或空消费。

          - **带记录交付 Change**

            - 覆盖结果已记录且有效、最终校验通过且来源版本未改变
            - 向明确的目标 Change 消费记录，核对成功结果后交付。

          - **覆盖记录前不得消费**

            - 目标 Change 中尚无有效覆盖结果
            - 不调用 consume，先完成覆盖检查并记录。

          - **无记录交付 Change**

            - 完整 Change 仅由已确认设计与模型形成
            - 不调用 `xirang record coverage` 或 consume，不为流程创建空记录。
        acceptanceCases: []
      - name: 复用有效上下文并按需补读
        body: |-
          Propose 工作身份 SHALL 在阶段入口与收尾执行完整 Design Record 门禁，在上下文有效期间复用最近成功读取的 record-level `sourceVersion`、摘要与已知 identity；局部问题通过 `record show --entry` 选择读取，局部更新使用最近有效版本并检查 diff 与 summary。Semantic Model 读取 SHALL 从候选定位逐步展开到显式 identity 的完整 Declaration 与 Contract，不自动查询 impact 返回的全部 identities。

          上下文压缩、会话切换、版本冲突、相关模型 drift 或无法确定当前状态时，Propose SHALL 重新建立完整依据。Agent MUST NOT 从旧摘要、路径、残余会话内容或实现证据猜测缺失的 Definition、Contract 或记录状态。完整 Contract 与 Acceptance Cases 不得被摘要、截断或改写。
        acceptanceCases: []
  element:propose-workflow:
    declaration:
      identity: propose-workflow
      kind: element
      parent: propose
      title: Propose Workflow
      definition: Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、制品定义先行写作、架构范围 reconcile、post-propose validation 一致性验证门禁与状态输出收敛。
    sections:
      - name: Propose 创建完整 change 制品
        body: |-
          系统 SHALL 提供 propose workflow，在不实施代码的前提下创建或更新 change，并生成 `proposal.md`、delta Contracts、`design.md`、`tasks.md` 与架构变化所需的结构目标制品。Workflow SHALL 在 semantic readiness 通过或用户明确 override 后才创建新 change，并 SHALL 将 graph 与 contract impacts 解释为同一 Semantic Model 的 module scopes。

          - **创建新 change**

            - 用户明确要求创建 new change
            - semantic readiness 已通过或用户已明确 override
            - 派生 change ID 不存在
            - workflow SHALL 执行 `xirang new change`
            - SHALL 按 artifact dependency order 生成 apply 所需制品

          - **Readiness 未通过时不创建 change**

            - semantic readiness 不完整且用户未 override
            - SHALL 报告缺失项并停止
            - SHALL NOT 创建 change directory

          - **更新 existing change**

            - 用户明确要求更新 existing change
            - SHALL 原地更新
            - SHALL 合并现有 artifacts、当前输入、Design Summary、formal model 与 implementation evidence 判断 readiness

          - **Workflow stage 边界**

            - 生成 propose skill
            - 声明 PROPOSE 只写目标 Change 制品，禁止修改 implementation 或正式模型
            - 允许通过 CLI 维护共享设计记录，pending 可主动维护，accepted、excluded 及确认内容的实质修改须用户允许；允许 record coverage 记录覆盖结果，并在版本、覆盖、结构及校验门禁通过后 record consume。除此之外不得任意写入 Change 目录外文件，不将记录权限视为正式实现权限

          - **New change ID 冲突**

            - 用户要求 new change 且 ID 已存在
            - SHALL 停止并要求另一个 ID
            - SHALL NOT 覆盖或自动改名

          - **Identity 不明确且 ID 已存在**

            - 用户意图未明确区分 update existing change 或 create new change
            - 派生 ID 已存在
            - SHALL 一次询问用户选择
            - non-interactive mode SHALL fail fast

          - **等价 artifact 结果**

            - 用户调用 propose
            - change directory 与 planning artifact set SHALL 完整创建
        acceptanceCases: []
      - name: Propose smart routing
        body: |-
          Propose SHALL 优先复用 conversation 中已确认的 `Design Summary`，忠实文档化已确认设计。它 MAY 在既定范围内自主处理细枝末节、组织案例和任务及修正表达或推导错误，不得自主大量扩写实质设计；新发现的决策点 SHALL 先说明选项与推荐，再一次一问等待用户确认。小范围内容与方案调整可在 Propose 内交互确认并维护记录；需要重新设计实验判断可行性或大幅重做设计时返回 Explore；完成披露不能代替决策前确认。没有 summary 时，SHALL 依据 problem、impact scope、approach、verification method 与未决 Source decisions 判断 semantic readiness，不得使用输入长度或技术关键词评分。Readiness 与 override 结果 SHALL 只存在于对话状态，不得写入 artifacts。

          - **复用 Design Summary**

            - conversation 包含已确认的 `Design Summary`
            - propose SHALL 说明正在复用该 summary
            - SHALL 将其中的 architecture、testing、risk 与 trade-off decisions 路由到对应 artifacts
            - SHALL NOT 重新执行字符数或 detail score 判断

          - **Semantic readiness 不完整**

            - 任一 readiness 项缺失或 source decision 未决
            - propose SHALL 在对话中列出具体缺口；孤立决策可就地询问，大幅设计工作建议 Explore
            - readiness 通过或被明确 override 前 SHALL NOT 创建 change 或写入制品
            - 新决策确认前 SHALL NOT 将依赖它的内容写成确定方案；routing decision 保留在会话

          - **用户显式 override**

            - propose 已报告 readiness 缺口且用户明确要求直接生成
            - propose SHALL 接受 override 并继续
            - override SHALL NOT 授权 Agent 猜测影响 behavior 或 architecture 的关键决策
            - 直接要求 propose 或不追问不提供缺失决策，必要确认无法取得时 SHALL 报告阻碍

          - **Semantic readiness 完整**

            - conversation 不包含已确认的 Design Summary
            - problem、impact scope、approach 与 verification method 均明确
            - 不存在会改变 Behavior Source 或 Architecture Source 的未决决策
            - propose SHALL 说明 readiness 已满足并继续 artifact generation

          - **多 subsystem scope**

            - 请求涉及多个 subsystem
            - propose SHALL 将其作为 impact scope 证据
            - 只有无法形成单一一致 change scope 时才 SHALL 报告 readiness 缺口
            - MUST NOT 仅凭 subsystem 数量强制 Explore

          - **Test Maintenance 分发**

            - Testing Strategy 包含过时测试信息
            - 过时原因 SHALL 进入 `design.md`
            - 具体更新或删除操作 SHALL 进入 `tasks.md`

          - **One-time Verification 分发**

            - Testing Strategy 包含 `One-time Verification`
            - 项目 SHALL 生成 evidence-only Check 且 SHALL NOT 创建 persistent test file
            - absence assertion SHALL 锚定 REMOVED Section

          - **Routing decision 不污染 artifacts**

            - propose 报告 readiness、缺失项或用户 override
            - 这些运行过程信息 SHALL 仅保留在对话中
            - SHALL NOT 写入 `proposal.md` comment 或其他 change artifacts
        acceptanceCases: []
      - name: Proposal 分离 behavior 与 architecture source impact
        body: |-
          Proposal SHALL 保留 canonical `## Source Impact` 兼容结构，并分别声明 behavior source scope 与 architecture source scope。两部分 SHALL 明确属于同一个 Semantic Model；Element 的 Contract 由该 Element 的稳定 identity 定位（Section 全局寻址为 `<element identity>#<Section name>`），不存在独立 Spec ID 或 Contract 绑定 registry。

          - **Contract scope 使用 Element identity**

            - Element Contract behavior 或 guarantee 变化
            - Behavior Source SHALL 使用受影响 Element 的稳定 identity
            - change-local delta SHALL 只为这些 Elements 在 change `elements/` 分区创建或修改对应单元

          - **Graph scope 使用 elementId**

            - Metamodel、element、containment、definition、relationship 或 view 变化
            - Architecture Source SHALL 使用稳定 identity 或明确的新 element identity
            - exact graph operations SHALL 定义在四分区 Semantic Delta 中

          - **Source module 不变化**

            - 某 module scope 确认不变
            - 对应 section SHALL 写 `None`
            - unresolved impact MUST NOT 表示为 `None`

          - **Proposal 分离 source impact**

            - Agent 获取 proposal definition
            - Behavior Source SHALL 使用 Element 稳定 identity
            - Architecture Source SHALL 使用 stable element identities

          - **Optional contract 缺失不创建 Spec**

            - optional element 没有 Contract
            - propose MUST NOT 仅凭该状态创建 Contract 单元
            - required element 缺失 contract SHALL 作为 source completeness gap 处理
        acceptanceCases: []
      - name: Propose 在架构 delta 前 reconcile architecture scope
        body: |-
          Contracts 与 `design.md` 完成后，propose SHALL 重新读取 proposal graph scope、design decisions、formal Semantic Model 与 implementation evidence，再生成结构目标。Workflow SHALL 在完整 Target Semantic Model 上联合检查 Element Declarations、Relationships 与 Element Contracts。

          - **Design 改变 graph scope**

            - design 记录的用户确认使 graph impact 与 proposal 初稿不同；写入 design 本身不构成确认
            - SHALL 更新 proposal Architecture Source
            - exact target graph SHALL 写入 Semantic Delta

          - **无 graph change**

            - Architecture Source 为 `None`
            - SHALL 省略结构目标
            - SHALL NOT 从 contract change 发明 graph operations

          - **指导生成 Semantic Delta**

            - change 影响 Architecture semantics
            - skill SHALL 指导在对应分区创建顶层 ADDED、MODIFIED、REMOVED sections
            - SHALL 要求 MODIFIED entity 使用完整 target payload

          - **Binding 指向同一 delta 新 element**

            - Contract 的宿主 Element 只存在于同一 delta 中新增
            - propose SHALL 在 Target Semantic Model 上联合验证
            - MUST NOT 将其误报为 formal model missing element

          - **Graph no-op**

            - Architecture Source 为 None
            - SHALL 省略 `metamodel/`、`relationships/` 与 `views/` delta 单元
            - SHALL NOT 创建空 model 单元
        acceptanceCases: []
      - name: Propose 状态输出保持收敛
        body: |-
          Propose SHALL 只在 readiness、blocker 与 final summary 节点输出状态；需要用户决定时一次询问一个问题。

          - **Readiness 状态**

            - propose 完成 semantic readiness 判断
            - SHALL 报告 Design Summary reuse、readiness 或具体 gap

          - **最终总结**

            - propose 完成 artifacts、validation 与 report generation
            - SHALL 汇总 artifacts、errors/warnings、effective diff review 与 ready-for-apply 状态
            - SHALL 区分沿用的确认、Propose 合理推导的细节与配套保证及其依据与制品位置、在 Propose 内新确认的重大决策和未决事项；合理细节无需逐项确认，无补充或新决策时明确说明
            - SHALL 不把补充声称为 Explore 原有确认，不新增永久补充台账
            - SHALL 区分实际 CLI 结果、Agent 语义检查发现与剩余证据缺口，以具体检查发现及相关制品位置支持结论；不以产物数量或引用合法推断语义通过，也不要求完整自查过程或额外报告制品
            - 制品完成与 CLI 通过不等于语义就绪，影响当前目标或实现方案的未决决策 SHALL 阻塞 ready-for-apply

          - **Blocker 状态**

            - identity、source decision、validation 或 effective diff 阻塞流程
            - SHALL 报告最小必要 blocker
            - 需要用户决定时 SHALL 一次询问一个问题
        acceptanceCases: []
      - name: 仅在 Propose 形成结构目标时应用拆分指导
        body: |-
          Propose Workflow SHALL 在需要形成尚未确认的新增或重组 hierarchy 时消费 normalized decomposition；对已经确认的记录或 Summary 结构决策 SHALL 忠实编译而不重新裁决。精简记录的存在不表示全部结构都已确认；尚未决部分仍须指导和用户确认。Contract-only 变化不因默认方法制造 Architecture Source。

          - **无记录时形成结构 Delta**

            - 设计要求新增或重组结构且不存在记录
            - 使用配置指导确认目标结构，再编译对应 Delta。

          - **已确认记录优先**

            - 记录结构部分已确认部分 identity、parent 或 Kind，但仍有未决结构
            - 保持已确认决策；仅对未决部分使用指导并请求用户确认，不能跳过全部结构设计或静默重做旧决策。

          - **Architecture Source 为 None**

            - Change 只改变 Contracts 或 implementation scaffolding
            - 不调用拆分 skill，不从默认方法发明结构变化。

          - **拆分指导不可用时阻塞 Formation**

            - 必须形成结构但方法不明确或 skill 不可用
            - 停止相关结构写入并询问用户，不猜测默认方法或实现目录作为目标。
        acceptanceCases: []
      - name: Propose 按 TDD 闭环划分 Tasks
        body: |-
          Propose 生成 `tasks.md` 时 SHALL 以可独立实现与验证的完整闭环划分 task 边界，SHALL NOT 按 component、module、directory、file type、Section 数量或 Acceptance Case 数量机械拆分；SHALL 按共享测试品质判断每个 Check 的语义价值，将同一可观察行为与同一失败原因的 Acceptance Case 归入一个 Check；声明 ready-for-apply 前 SHALL 交叉检查所有 task 边界与 Check 价值，并 reconcile 违反独立验证或制造低价值持久化测试的划分。 Tasks SHALL 以具体实施事项与完整 Contract 引用承接规范目标，不能把记录摘要直接当成完整行为定义；相关 prompt 与受管生成面须归入所属行为闭环。ready-for-apply 前 SHALL 执行记录到语义及语义到实施/Checks 的语义覆盖检查，不能只验证引用存在。

          - **按行为闭环而非组件划分**

            - 多个组件共同交付一个行为
            - Propose SHALL 将它们放入同一 task

          - **Section 数量不构成拆分理由**

            - 一个 task 的 Sections 超过上限
            - Propose SHALL 合并细节或将验证细节下沉到 Checks
            - SHALL NOT 仅因数量拆分 task

          - **Acceptance Case 数量不构成拆分理由**

            - 一个 Section 含多个描述同一行为与同一失败原因的 Acceptance Case
            - Propose SHALL 将它们编译进同一个 Check
            - SHALL NOT 为每个 Acceptance Case 各创建一个 persistent test Check

          - **Propose 必须判断 Check 价值**

            - Propose 编译 `tasks.md` Checks
            - SHALL 应用共享测试品质：优先 reuse 或 modify 已有测试，只在现有测试无法保护该行为时 add
            - SHALL 把不值得持久化的证据编译为 one-time Check
            - SHALL NOT 以「不得判断 Check 是否语义足够」为由保留机械测试

          - **新增边界必须指向独特缺陷**

            - Propose 为同一行为增加额外边界 Check 或测试
            - SHALL 写明该边界能捕获、已有测试捕获不到的合理缺陷
            - 无法指出独特缺陷时 SHALL 不创建该 Check

          - **ready-for-apply 前边界自检**

            - Propose 准备声明 Change ready-for-apply
            - SHALL 交叉检查 Goals、Files、Sections 与 Checks
            - SHALL 按执行顺序从每个 Check 实际需要的实现、文件与命令反推依赖，确认仅用已有实现、此前 GREEN 的任务与当前任务即可达到 GREEN；若依赖后续任务则调整顺序或合并任务，引用的测试文件与命令须已存在或安排在此时提供，不能仅复述声明的依赖
            - 发现 task 依赖后续 task、Check 按 Acceptance Case 1:1 机械拆分或假防护测试时 SHALL reconcile 后再声明

          - **确认细节贯穿执行安排**

            - 用户确认的条件、例外与时序已经写入 Contract
            - 任务安排其实现与检查并引用该 Contract，不复制规范文本；缺少安排时不声明 ready-for-apply。
        acceptanceCases: []
      - name: Propose 使用制品定义先行写作
        body: |-
          每个 artifact 写入前，workflow SHALL 读取 resolved definition，按 content boundaries 路由语义，再执行 artifact instruction 与 template。Delta Contracts SHALL 只包含 target-state 的 Sections 与 Acceptance Cases；Acceptance Case SHALL 描述特定条件下的可观察行为，SHALL NOT 规定实现结构、文档排版、说明性措辞、标题顺序或测试拆分，除非该精确表示本身就是可观察契约；完成 artifacts 后 SHALL 使用统一 change compiler 审阅 effective changes。

          - **Acceptance Case operations 通过 diff 审阅**

            - Agent 已完成 delta Contracts、design、结构目标与 combined validation
            - SHALL 审阅 validate concise preview
            - 非预期 operation SHALL 阻塞 ready-for-apply 并要求修正 source

          - **Sections 按 Behavior Source 生成**

            - propose 创建 change-local Contracts
            - SHALL 只消费 proposal Behavior Source 中的 Element identities
            - SHALL 读取 Formal Contract 的 exact Section titles 后 author delta

          - **Specs boundary 不重复定义**

            - workflow 生成 Contracts
            - SHALL 依赖 `xirang instructions specs --change "<name>" --json` 返回的 definition（Element-owned Contract delta authoring 指导）
            - SHALL NOT 在 workflow template 维护竞争的 behavior boundary

          - **Acceptance Case 写行为而非排版**

            - Propose 编写或修改 Acceptance Case
            - Acceptance Case SHALL 描述条件与可观察结果
            - SHALL NOT 把生成文档标题、段落顺序或完整例句当作行为，除非该精确 token 本身是对外协议
        acceptanceCases: []
      - name: 按复杂度组织交互审阅
        body: Workflow SHALL 指导简单变更先形成完整草稿并集中审阅具体差异与问题，复杂变更按一项机制或相关 Elements 分组编写、审阅，确认后继续；不按 Element 数量机械要求逐个确认。成文中提出新想法与用户讨论，明确细节自主权与重大决策确认边界，不以一次调用后无须交互为目标。
        acceptanceCases: []
  element:quality:
    declaration:
      identity: quality
      kind: element
      parent: change-implementation
      title: Quality
      definition: Quality 是 Change Implementation 中评估并改进项目结果代码质量的环节，由 Review 与 Optimization 两个活动共同完成。它以当前代码是否已经过 Review 作为唯一驱动：存在未经 Review 的代码变更时必须先执行 Review，只有当前代码已通过 Review 才可以执行 Optimization，二者交替进行直到当前代码已通过 Review 且不存在需要继续执行的优化事项。它包含代码状态判定、两个活动的进入与收口、优化过程中的判断记录，以及确认 Change Implementation 可以进入 Change Closure 的证据；它不包含 Apply 如何产生改动、Change Closure 如何收束，也不包含两个活动各自的判断标准。
    sections:
      - name: 每次修改后先执行 Review
        body: |-
          Quality SHALL 在每次 Apply 修改项目后先执行 clean-context Review。

          - **项目状态被修改**

            - Apply 完成一轮写入
            - Quality 进入 Review
        acceptanceCases: []
      - name: 代码状态决定进入的活动
        body: |-
          Quality SHALL 以当前代码是否已经过 Review 作为选择活动的唯一依据。存在未经 Review 的代码变更时 SHALL 进入 Review；当前代码已通过 Review 时才可以进入 Optimization。Review 依据 SHALL 来自当前活动质量记录，已受控轮换的历史不满足本轮门禁；`clean` 不解除当前台账的终态约束。

          - **存在未检测的代码变更**

            - 当前代码与最近一条通过的 Review 记录不一致，或尚无 Review 记录
            - Quality 的状态为 `dirty`
            - 只有 Review 可以继续

          - **当前代码已通过 Review**

            - 当前活动记录中存在一条 Review 记录，其 result 为 `PASS` 或 `PASS_WITH_WARNINGS`，且其 fingerprint 与当前代码一致
            - Quality 的状态为 `clean`
            - Optimization 在当前台账允许继续时可以开始
        acceptanceCases: []
      - name: Review 通过后建立 Baseline
        body: |-
          首次 Review 通过的项目状态 SHALL 成为 baseline checkpoint。

          - **初始实现通过 Review**

            - 当前状态首次满足正确性门禁
            - Quality 保存 baseline checkpoint
        acceptanceCases: []
      - name: 成功优化推进 Checkpoint
        body: |-
          每个优化轮次经 Apply 实现并重新通过 Review 后，当前项目状态 SHALL 成为新的 successful checkpoint。

          - **优化实现通过 Review**

            - 优化轮次产生的代码变更通过 Review
            - Quality 推进 successful checkpoint
        acceptanceCases: []
      - name: 失败优化恢复 Checkpoint
        body: |-
          优化轮次未通过 Review 时，Quality SHALL 恢复最近的 successful checkpoint。

          - **优化产生不合格状态**

            - 优化轮次产生的代码变更未通过 Review
            - Quality 回到最近成功状态
        acceptanceCases: []
      - name: 保留失败方向与优化历史
        body: |-
          失败轮次恢复后，Quality SHALL 保留 Review 结论、失败方向与优化判断记录，使后续评估仍可读取失败证据与历史。

          - **恢复成功状态**

            - Quality 丢弃未通过的优化改动
            - 恢复后的状态仍可读取失败方向与轮次记录
        acceptanceCases: []
      - name: 仅以最新成功状态完成
        body: |-
          Quality SHALL 仅在最新项目状态已成为 successful checkpoint 时完成。

          - **当前状态尚未通过 Review**

            - 最新修改仍是未通过 Review 的状态
            - Quality 不得完成
        acceptanceCases: []
      - name: 收口后确认可进入 Change Closure
        body: |-
          Quality SHALL 仅在当前代码已通过 Review、Optimization 已收口且终态不是 `ABORTED_UNSAFE`、且用于判断的证据仍然有效时，确认 Change Implementation 可以进入 Change Closure。

          - **Optimization 尚未收口**

            - 还没有任何收口记录
            - Quality 不得确认进入 Change Closure

          - **验证证据必须仍然有效**

            - Quality 无法以现有记录支持当前代码已通过 Review 的结论
            - 它要求重新执行 Review
        acceptanceCases: []
      - name: 活动 Change 的显式重新验证
        body: |-
          Quality SHALL 允许尚未归档的活动 Change 在用户明确要求重新验证后，通过共享恢复 reference 在原 Change 内重新开始 Review → Optimization，不要求创建接续 Change。适用情况包括：`ABORTED_UNSAFE` 中止原因处理后重验；`NOT_NEEDED`、`IMPROVED` 等优化终态后实现或契约改变；旧 Review 的证据或审查依据不可信，即使代码未变仍要求重审。

          原流程 SHALL 已停止推进，Reviewer、Optimizer、实现任务及其结果处理、回写和回滚 SHALL 与重启串行执行；Reviewer 仍在运行时 MUST NOT 重启。系统不提供并行旧任务结果提交的轮次标识协议。

          重启 SHALL 保留当前代码、已有 commits/checkpoints、旧质量日志与失败原因。旧轮次的验证结论、优化进度、终态、已用方向额度和方向失败计数 SHALL 不满足或占用新轮次的验证与优化门禁；旧记录仅作为历史参考。新轮次 SHALL 重新执行 fresh-context Review，即使旧 PASS 的文件指纹仍匹配，也不得直接复用该 PASS。新 Review 未通过时 SHALL 修正后再次 Review；通过后才可建立或验证本轮 checkpoint 并开始从零计算的 Optimization，随后按正常规则 seal 与进入 Closure。

          普通 Review 失败后的修正、优化方向失败后的回滚、会话中断后的续跑 SHALL 继续使用原轮次并保留计数与进度，不得自动转换为重启。

          - **同代码重新审查**：旧轮次已得到 `NOT_NEEDED`，用户因证据不足要求重审；完成受控轮换后当前状态为 `dirty`，新 Review 通过前不进入 Optimization，旧 PASS 不使本轮变为 `clean`。
          - **unsafe 原 Change 重验**：旧轮次为 `ABORTED_UNSAFE`，用户授权原 Change 重验；保留原代码和失败历史，fresh Review 仍可报告未解决的问题，重启本身不构成问题已解决的证明。
          - **运行中的 Reviewer**：Reviewer 尚未返回时用户要求重启；Agent 不轮换记录、不启动并行的新 Review，须先结束原流程。
        acceptanceCases: []
  element:quality-aware-instructions:
    declaration:
      identity: quality-aware-instructions
      kind: element
      parent: deterministic-operations
      title: Quality-aware Instructions
      definition: Quality-aware Instructions 定义 `xirang instructions apply` 集成 quality 状态检查的行为：判定 change 的 `state` 时同时考虑 task checkbox 完成度与 quality 记录状态，产生 `needs_review`、`needs_optimize`、`all_done` 与 `ready`。它只描述指令投影的状态判定，不定义 quality 命令本身的入口条件与诊断。
    sections:
      - name: Apply 指令依据 quality 状态判定 state
        body: |-
          `xirang instructions apply` 命令在判定 change 的 `state` 时 SHALL 集成 quality 状态检查，而非仅依赖 task checkbox 完成度。

          - **全部 tasks 完成但尚无 Review 记录**

            - `tasks.md` 中所有 checkbox 均为 `[x]`
            - change 目录中没有 quality 状态记录
            - `state` SHALL 为 `'needs_review'`
            - `instruction` SHALL 包含引导执行 `xirang quality review` 的文本

          - **全部 tasks 完成但存在未检测的代码变更**

            - `tasks.md` 中所有 checkbox 均为 `[x]`
            - 当前代码与最近一条通过的 Review 记录不一致
            - `state` SHALL 为 `'needs_review'`

          - **已通过 Review 但 Optimization 尚未收口**

            - 当前代码已通过 Review
            - 还没有收口记录
            - `state` SHALL 为 `'needs_optimize'`
            - `instruction` SHALL 包含引导继续 Optimization 与 seal 的文本

          - **全部 tasks 完成且已收口**

            - `tasks.md` 中所有 checkbox 均为 `[x]`
            - 当前代码已通过 Review
            - Optimization 已收口且 archive compatibility 为 `{ compatible: true }`
            - `state` SHALL 为 `'all_done'`

          - **非 semantic-model schema 无 tracksFile**

            - schema 未配置 `apply.tracks`（`tracksFile` 为 null）
            - required artifacts 全部存在
            - 保持现有行为，`state` 为 `'ready'`

          - **unsafe 恢复指引优先**：当前活动台账为 `ABORTED_UNSAFE` 时，不得报告 `all_done`；instruction SHALL 指向共享恢复 reference，要求先停止自动推进、取得重启授权并确认串行条件，不因代码为 `dirty` 就绕过该恢复前提。
          - **轮换后重新 Review**：受控轮换完成、全部 tasks 已完成且根目录没有活动质量记录时，state SHALL 为 `needs_review`；即使历史目录保存匹配当前代码的 PASS，也不得投影为 `all_done` 或复用旧结论。新 Review 通过后才按新活动台账进入 `needs_optimize`，沿用其他既有路由。
        acceptanceCases: []
  element:quality-cli-gate:
    declaration:
      identity: quality-cli-gate
      kind: element
      parent: quality
      title: Quality CLI Gate
      definition: Quality CLI Gate 定义 `xirang quality` 命令面的门禁与协议契约：`review`、`optimize`、`status`、`seal` 四个入口各自的输入形状、入口条件与收口条件，以及统一输出、结构化诊断、退出码语义和机器可读协议说明的投影。它不定义各入口背后的判断标准（属于 Review 与 Optimization），也不定义记录载体的持久化细节（属于 Quality Writeback）。
    sections:
      - name: Review 记录入口
        body: |-
          系统 SHALL 提供 `xirang quality review <change-name>` 命令，在校验入口条件后接受一次 Review 结论。入口条件为当前代码存在未经 Review 的变更；不满足时 MUST NOT 写入任何记录，并 SHALL 回报当前状态与合法后续操作。接受时 SHALL 校验 `result`、`issues`、`evidenceFiles` 结构，计算 `tasksFileHash` 与 `evidenceFingerprint`，持久化结论与指纹，并输出当前状态与 `allowedNextOperations`。

          - **入口条件通过并记录结论**

            - agent 执行 `xirang quality review <change-name> --input '<json>'`
            - 当前代码存在未经 Review 的变更
            - 系统 SHALL 校验输入结构并计算 `tasksFileHash` 与 `evidenceFingerprint`
            - SHALL 持久化该结论与指纹
            - SHALL 输出 `state` 与 `allowedNextOperations`
            - 以 exit 0 退出

          - **代码未变更时拒绝重复记录**

            - 当前代码与最近一条通过的 Review 记录一致
            - 系统 SHALL 以 exit 1 拒绝
            - SHALL 说明现有结论仍然有效，并给出 `allowedNextOperations`
            - MUST NOT 修改任何记录

          - **输入结构非法**

            - 输入缺少 `result`、`issues`、`evidenceFiles` 或取值不合法
            - 系统 SHALL 以 exit 2 拒绝
            - SHALL 以结构化诊断指出字段路径、期待值与当前值
            - MUST NOT 修改任何记录
        acceptanceCases: []
      - name: Optimization 记录入口
        body: |-
          系统 SHALL 提供 `xirang quality optimize <change-name>` 命令，以一轮为单位接受一份优化判断台账。入口条件为当前代码已通过 Review、Optimization 尚未收口、终态不是 `ABORTED_UNSAFE`、且已选方向数未达 `optimization.directionLimit`。系统 SHALL 为台账中省略 `id` 的新方向分配稳定 ID 并在输出中回显，校验方向 ID 引用与状态迁移，按方向数与同方向失败次数更新两级计数，并按 `optimization.minImpactLevel` 过滤低于门槛的方向，并持久化该轮台账。

          - **已选方向数达到上限**

            - 已选方向数达到 `optimization.directionLimit`
            - 系统 SHALL 拒绝选择新方向并要求收口

          - **门槛过滤在选择阶段生效**

            - 台账中存在 `impactLevel` 低于 `optimization.minImpactLevel` 的待选方向
            - 该方向 SHALL 不被选取，也不消耗方向额度
            - 当全部待选方向均低于门槛时该轮不选取任何方向
        acceptanceCases: []
      - name: 收口终态由 stopReason 推导
        body: |-
          Optimization 收口时 SHALL 要求 `stopReason`，并据此推导终态：`USER_DECLINED` 对应 `SKIPPED`；`NO_ACTIONABLE` 对应 `NOT_NEEDED`；`DIRECTION_REJECTED` 与 `DIRECTION_LIMIT_REACHED` 在有成功落地方向时对应 `IMPROVED`，否则对应 `DEGRADED`；`UNSAFE` 对应 `ABORTED_UNSAFE`。全部待选方向低于 `optimization.minImpactLevel` 时 SHALL 以 `NO_ACTIONABLE` 收口，并据此推导为 `NOT_NEEDED`。

          - **被方向数上限截断但已有成功方向**

            - 收口输入的 `stopReason` 为 `DIRECTION_LIMIT_REACHED`
            - 台账中存在已验证的方向
            - 终态 SHALL 为 `IMPROVED`
            - `stopReason` SHALL 保留为 `DIRECTION_LIMIT_REACHED`

          - **仅有被否决方向**

            - 收口输入的 `stopReason` 为 `DIRECTION_REJECTED`
            - 台账中不存在已验证的方向
            - 终态 SHALL 为 `DEGRADED`

          - **全部方向低于门槛**

            - 台账中所有待选方向的 `impactLevel` 均低于 `minImpactLevel`
            - 收口输入 SHALL 使用 `stopReason: NO_ACTIONABLE`
            - 终态 SHALL 为 `NOT_NEEDED`

          - **unsafe 中止**

            - 收口输入的 `stopReason` 为 `UNSAFE`
            - 终态 SHALL 为 `ABORTED_UNSAFE`
            - 当前活动台账仍为该终态时后续 optimize 入口 SHALL 被拒绝；恢复代码或重新记录 Review 不解除该终态。诊断 SHALL 指向共享恢复 reference，只有按用户授权完成受控轮换并重新通过 Review，才可在新活动台账开始优化
        acceptanceCases: []
      - name: Seal 校验
        body: |-
          系统 SHALL 提供 `xirang quality seal <change-name>` 命令，校验当前记录的结构完整性、当前代码已通过 Review、以及 Optimization 已收口且终态不是 `ABORTED_UNSAFE`。通过时 SHALL 输出 seal hash。

          - **Seal 校验通过**

            - agent 执行 `xirang quality seal <change-name>`
            - 当前代码已通过 Review 且 Optimization 已收口
            - 系统 SHALL 输出 seal hash
            - 以 exit 0 退出

          - **Seal 校验失败**

            - 记录缺失必需字段、当前代码未通过 Review，或 Optimization 尚未收口
            - 系统 SHALL 列出未满足的条件
            - 以 exit 1 退出
        acceptanceCases: []
      - name: Status 输出语义
        body: |-
          系统 SHALL 提供 `xirang quality status <change-name>` 命令，只读地报告当前代码状态、Review 结论、已用方向数与各方向失败次数、剩余方向额度，以及 `allowedNextOperations`。它 SHALL 区分阻塞条件与非阻塞 informational 诊断，并把 Git HEAD 差异作为 informational 输出。

          - **存在未检测的代码变更**

            - 当前代码与最近一条通过的 Review 记录不一致
            - 输出 SHALL 将状态设为 `dirty`
            - `allowedNextOperations` SHALL 包含 `review`
            - SHALL 给出对应的命令模板

          - **已通过 Review 但尚未收口**

            - 当前代码已通过 Review 且还没有收口记录
            - 输出 SHALL 将状态设为 `clean`
            - `allowedNextOperations` SHALL 包含 `optimize` 与 `seal` 的适用条件

          - **JSON status 单独暴露 Git HEAD 信息**

            - agent 执行 `xirang quality status <change-name> --json`
            - 记录的 Git HEAD 与当前 HEAD 不一致
            - 其他硬条件均通过
            - 输出 SHALL 把该差异放在 informational 字段中
            - SHALL NOT 因此改变代码状态判定

          - **status 为只读命令**

            - agent 执行 `xirang quality status <change-name>` 或任意 help
            - 系统 MUST NOT 创建、修改或删除任何记录文件

          - **Review 证据与台账分离**：回滚匹配历史 PASS 时，status SHALL 显示匹配的 Review 结论与最新活动台账中的计数、方向状态和终态，不显示旧台账作为当前进度。
          - **恢复路径可发现**：当前活动台账为 `ABORTED_UNSAFE` 时，status 的人类可读指引 SHALL 引用共享恢复 reference，说明需用户授权且原流程停止后才能轮换；不得宣称仅恢复代码即可解除终态，或展示可直接 optimize/seal/archive 的操作。完成轮换后，无当前记录的状态 SHALL 为 `dirty`，后续操作为 `review`，历史目录中的 PASS 不改变该结果。
          - **优化已收口**：当前台账已为其他终态时，正常操作仍为 seal/archive；用户明确要求重新验证时，可按同一恢复 reference 开始新轮次，不增加 reset 命令。
        acceptanceCases: []
      - name: 统一输出与诊断结构
        body: |-
          所有 `xirang quality` 子命令 SHALL 使用统一输出形状。成功返回 `ok: true` 与 `allowedNextOperations`；入口或状态条件不满足返回 `ok: false`、稳定 `code`、`diagnostics` 与 `allowedNextOperations`，并以 exit 1 退出；输入形状非法返回 `ok: false`、`code: INVALID_INPUT` 与 `diagnostics`，并以 exit 2 退出。`diagnostics` 条目 SHALL 包含字段路径 `path`、期待值 `expected`、当前值或状态 `actual` 以及修正方式 `fix`。

          - **字段非法时给出可操作诊断**

            - 输入中某个字段缺失或取值非法
            - `diagnostics` SHALL 包含该字段的 `path`、`expected` 与 `fix`
            - 以 exit 2 退出

          - **入口条件不满足时给出后续操作**

            - 入口条件不满足
            - 输出 SHALL 包含稳定 `code` 与 `allowedNextOperations`
            - 以 exit 1 退出
        acceptanceCases: []
      - name: 协议说明的单一来源与投影
        body: |-
          系统 SHALL 从同一批实现常量派生 quality 协议说明，并投影到 `xirang quality` 命令的 help 与 apply/archive skill 的 reference 文档。投影 SHALL 覆盖各入口的输入字段、枚举取值、最小合法示例、退出码，以及静态结构无法表达的状态约束。系统 MUST NOT 在 help 与 reference 中各自维护一套与实现并行的协议描述。

          - **help 与 reference 具有同一来源**

            - 协议说明被渲染到 help 或 reference
            - 两者 SHALL 由同一批导出常量生成
            - 枚举取值 SHALL 与校验实现使用同一常量

          - **静态结构无法表达的约束单独说明**

            - 渲染协议说明
            - SHALL 说明入口条件、收口推导、两级计数与记录匹配规则
            - SHALL NOT 重复描述可机械展开的字段定义
        acceptanceCases: []
  element:quality-execution-model:
    declaration:
      identity: quality-execution-model
      kind: element
      parent: quality
      title: Quality Execution Model
      definition: Quality Execution Model 定义 quality 与 archive 复用的固定 subagent-orchestrated 执行模型：所有工具使用同一模板骨架，顶层 agent 只负责输入收集、subagent orchestration、write-back 应用、checkpoint 管理与结果持久化，且不存在 reread fallback。它不定义 reviewer 与 optimizer 自身的判断标准，也不定义命令面的输入形状。
    sections:
      - name: Quality 模板选择遵循执行模型
        body: |-
          系统 SHALL 使用 subagent-orchestrated quality 模板骨架，而不是按工具选择 execution model。

          - **所有工具使用 subagent 骨架**

            - 系统生成 quality 工作流 skill
            - 系统 SHALL 选择 subagent-orchestrated quality 模板骨架
            - 该骨架中的顶层 agent SHALL 只负责输入收集、subagent orchestration、write-back 应用、checkpoint 管理与结果持久化
            - 顶层模板 SHALL NOT 内嵌 completeness、correctness 或 coherence 的直接判断步骤

          - **不存在 reread fallback**

            - 系统为任一受支持工具生成 quality 工作流 skill
            - 系统 SHALL NOT 选择 current-agent-reread 模板骨架
            - SHALL 使用 subagent-orchestrated 模板骨架

          - **选择逻辑使用显式 lookup**

            - 系统解析 quality 模板骨架
            - 系统 SHALL 返回 subagent-orchestrated execution model
            - SHALL NOT 通过工具查找、字符串模式匹配、路径模式匹配或隐式约定推断 subagent 支持能力
        acceptanceCases: []
      - name: Archive 重跑复用同一执行模型骨架
        body: |-
          系统 SHALL 在 archive 需要重跑 full quality 流程时，复用与 standalone quality 相同的 subagent-orchestrated orchestration 合约。

          - **archive 复用 subagent 骨架**

            - archive 因 Review 记录缺失或状态为 `dirty` 而需要执行 full quality 流程
            - 系统 SHALL 复用与 standalone quality 相同的 subagent-orchestrated 模板骨架
            - SHALL NOT 维护另一套 archive-only Review skeleton

          - **archive 不存在 reread fallback**

            - archive 因 Review 记录缺失或状态为 `dirty` 而需要执行 full quality 流程
            - 系统 SHALL NOT 使用 current-agent-reread skeleton
            - SHALL 保持与 standalone quality 一致的 Optimization eligibility 语义
        acceptanceCases: []
  element:quality-freshness:
    declaration:
      identity: quality-freshness
      kind: element
      parent: quality
      title: Quality Freshness
      definition: Quality Freshness 定义 quality 的记录匹配与状态判定引擎：`tasksFileHash` 计算、`evidenceFingerprint` 计算、按当前代码匹配历史记录得到的 `clean`/`dirty` 判定、归档兼容判定、gate 失败输出格式，以及 sync 后的 evidence fingerprint 增量刷新。它不定义命令面的输入与诊断形状，也不定义记录的写入时序（属于 Quality Writeback）。
    sections:
      - name: tasksFileHash 计算
        body: |-
          系统 SHALL 提供 `computeTasksFileHash(tasksPath)` 函数，计算 `tasks.md` 文件内容的 SHA-256 哈希。

          - **正常计算**

            - 调用 `computeTasksFileHash` 且文件存在可读
            - 系统 SHALL 返回文件内容的 SHA-256 十六进制字符串

          - **文件不存在**

            - 调用 `computeTasksFileHash` 且文件不存在
            - 系统 SHALL 返回 `null`
        acceptanceCases: []
      - name: evidenceFingerprint 计算
        body: |-
          系统 SHALL 提供 `computeEvidenceFingerprint(evidenceFiles, projectRoot)`，按规范化相对 POSIX 路径排序并基于文件内容 SHA-256 生成整体指纹。quality 的状态快照与历史日志 SHALL 被排除在指纹之外。Windows 路径 SHALL 使用 Node.js path API 规范化。

          - **内容未变时 hash 稳定**

            - 文件内容未变但 mtime 或 size 元数据变化
            - evidence fingerprint SHALL 保持不变

          - **记录文件不参与指纹**

            - 计算 evidence fingerprint
            - `.quality-state.json` 与 `.quality-log.jsonl` SHALL 被排除
            - SHALL NOT 因这些文件的写入而使指纹变化
        acceptanceCases: []
      - name: 记录匹配与状态判定
        body: |-
          系统 SHALL 仅在当前 Change 根目录的活动质量快照及其配套日志中，按 evidence fingerprint 查找与当前代码一致的通过 Review 证据，而不是只读取最新一条 Review。存在当前格式、非空证据且 result 为 `PASS` 或 `PASS_WITH_WARNINGS`、fingerprint 与当前代码一致的记录时，状态 SHALL 为 `clean`；否则状态 SHALL 为 `dirty`。快照不存在或快照在配套日志中无对应记录时 SHALL 保守地为 `dirty`。

          Review 证据匹配与当前 Optimization 台账 SHALL 独立取值。匹配到较早的通过记录时，当前方向状态、失败计数、已用方向额度、轮次判断、`stopReason` 与终态 SHALL 继续取自最新活动快照；不得回退到匹配 Review 附带的旧台账，也不得在最新快照无台账时从旧记录复活台账。status、后续 Review/Optimization 写入与 seal/Sync/Archive 门禁 SHALL 对同一当前台账作出一致判断。

          已轮换到质量历史目录的记录 SHALL 不参与 `clean` 判定或当前台账选择。当前快照和日志轮换完成后，即使历史目录含与代码匹配的 PASS，当前状态仍 SHALL 为 `dirty`；新 Review 建立活动记录后只匹配该组活动记录。历史目录不成为额外的 runtime quality store。

          - **记录匹配当前代码时为 clean**

            - 历史中存在一条 result 为 `PASS` 或 `PASS_WITH_WARNINGS` 且 fingerprint 与当前代码一致的 Review 记录
            - 状态 SHALL 为 `clean`

          - **无记录时为 dirty**

            - change 目录中没有 Review 记录
            - 状态 SHALL 为 `dirty`

          - **指纹不一致时为 dirty**

            - 重新计算的 fingerprint 与所有 Review 记录均不一致
            - 状态 SHALL 为 `dirty`
            - 输出 SHALL 列出导致不一致的文件路径

          - **失败回滚后回到 clean**

            - 最新一条 Review 记录为 `FAIL_NEEDS_CORRECTIONS`
            - 工作区已回滚到更早一条通过的 Review 记录所对应的状态
            - 状态 SHALL 为 `clean`
            - SHALL NOT 因最新记录为失败而判为 `dirty`

          - **匹配到的记录为失败时为 dirty**

            - 与当前代码 fingerprint 一致的记录 result 为 `FAIL_NEEDS_CORRECTIONS`
            - 状态 SHALL 为 `dirty`

          - **Windows 路径正确匹配**

            - evidence 路径使用反斜杠表示
            - 系统 SHALL 将其规范化为相对 POSIX 路径后计算与比较指纹
            - SHALL 与已持久化路径匹配

          - **恢复代码不恢复旧台账**：代码 A 的历史 PASS 台账已用方向数为 0，代码 B 后的最新活动台账已用方向数为 1 且终态为 `ABORTED_UNSAFE`；仅恢复代码 A 并完整保留活动记录后，状态 SHALL 为 `clean`，当前台账仍为已用方向数 1 和 `ABORTED_UNSAFE`，Optimization、seal、Sync 和 Archive 不得因此通过 unsafe 门禁。
          - **失败计数不回退**：最新活动台账中方向已失败 2 次并被 `rejected`；回滚匹配到首次 PASS 后，该方向仍 SHALL 为 `rejected` 且失败计数为 2，后续写入保留最新历史。
          - **台账独立于 Review 证据**：最新快照记录失败 Review、代码已恢复到历史 PASS 的状态时，SHALL 使用该 PASS 证明 `clean`，同时保留最新快照的优化进度；原始历史记录不得被改写。
        acceptanceCases: []
      - name: Archive Compatibility 判定
        body: |-
          `checkArchiveCompatibility` SHALL 将 `SKIPPED`、`NOT_NEEDED`、`IMPROVED` 与 `DEGRADED` 判定为 compatible，将 `ABORTED_UNSAFE` 判定为不兼容。尚未收口（不存在收口记录）SHALL 判定为不兼容。旧记录缺少 optimization 字段时 SHALL 保持向后兼容。

          - **已收口终态兼容**

            - Optimization 终态为 `IMPROVED`
            - 台账包含 `rejected` 或 `deferred` 方向
            - archive compatibility SHALL 返回 compatible true

          - **尚未收口**

            - 不存在 Optimization 收口记录
            - archive compatibility SHALL 返回 compatible false
            - blockReason SHALL 指明尚未收口

          - **legacy 记录无 optimization**

            - 旧记录不包含 optimization 字段
            - archive compatibility SHALL 判定为不兼容
            - SHALL NOT 因字段缺失而崩溃
        acceptanceCases: []
      - name: gate 失败输出格式
        body: |-
          系统 SHALL 提供 `formatQualityGateFailure` 函数，生成结构化的 quality gate 失败消息：指纹不匹配时列出变更文件，archive 不兼容时包含 blockReason，末尾提供建议操作段落；非阻塞 Git HEAD 数据不作为失败段落输出。

          - **archive 上下文的建议操作**

            - `formatQualityGateFailure` 用于 archive 命令的 gate 失败
            - 建议操作中 SHALL 使用 `xirang archive` 而非 `xirang sync`

          - **指纹无变化时省略指纹段**

            - 没有指纹不匹配的文件
            - 输出 SHALL 省略指纹部分

          - **全部信息输出**

            - 调用 `formatQualityGateFailure` 且 fingerprint 不匹配
            - `archiveCompatibility` 不兼容
            - 输出 SHALL 包含指纹不匹配的文件列表
            - SHALL 包含不兼容的 blockReason
            - 末尾 SHALL 包含建议操作段落
            - 输出 SHALL NOT 包含 Git HEAD failure section
        acceptanceCases: []
      - name: sync 后 evidence fingerprint 增量刷新
        body: |-
          系统 SHALL 提供 `refreshQualityEvidenceAfterSync(changeDir, projectRoot, syncedFiles)` 函数，在 sync 完成后增量更新状态快照中的 evidence fingerprint。对路径匹配 `syncedFiles` 的条目重算 SHA-256；若任何 entry 被更新，SHALL 重算整体 fingerprint 并写回。

          - **正常刷新**

            - 调用刷新函数且 `syncedFiles` 中的路径存在于 entries
            - 系统 SHALL 重算该 entry 的 hash、重算整体 fingerprint 并写回状态快照

          - **无匹配路径或文件不存在**

            - `syncedFiles` 中无路径匹配任何 entry，或状态快照不存在
            - 系统 SHALL NOT 修改任何记录并静默返回

          - **跨平台路径匹配**

            - 在 Windows 上比较 `syncedFiles` 与 evidence entries
            - 路径比较 SHALL 使用 POSIX 正斜杠标准化并正确匹配同一文件

          - **刷新后外部修改再次触发 dirty**

            - sync 后指纹已刷新为一致
            - 外部进程再次修改该文件
            - 后续状态判定 SHALL 变为 `dirty`
            - 输出 SHALL 列出该规范化路径为变更文件
        acceptanceCases: []
  element:quality-orchestration:
    declaration:
      identity: quality-orchestration
      kind: element
      parent: quality
      title: Quality Orchestration
      definition: Quality Orchestration 定义 quality 工作流提示词的编排契约：Coordinator 角色声明、阶段模式标签、显式 subagent delegation 指令、subagent 超时与等待规则、checkpoint 有序执行步骤与语言一致性。它保证顶层 agent 只做编排与持久化，不替代 reviewer 与 optimizer 的判断，也不定义这两个角色自身的判断标准。
    sections:
      - name: Coordinator 角色声明
        body: |-
          quality 工作流提示词 SHALL 以显式 coordinator 角色声明开头，把顶层 agent 定义为 quality coordinator，而不是 judge。角色声明 SHALL 定义 coordinator、Reviewer Subagent、Optimizer Subagent 与 CLI 四个互相独立的角色及其边界，并显式包含约束：顶层 agent MUST NOT 用自己的完整性、正确性或一致性判断替代 reviewer 的判断。

          - **Agent 理解自身是 coordinator**

            - 顶层 agent 加载 quality prompt
            - 第一个内容块 SHALL 声明 coordinator 角色
            - SHALL 列出四个角色及其职责
            - SHALL 显式禁止 coordinator 自行作出裁决

          - **Evidence 步骤不再读取文件内容**

            - coordinator 进入证据准备步骤
            - coordinator SHALL 仅确定 changeDir 与 projectRoot 路径
            - SHALL NOT 读取候选实现文件的内容
            - SHALL NOT 执行 git diff 或 git status（由 subagent 自行执行）
        acceptanceCases: []
      - name: 阶段模式标签
        body: |-
          quality 工作流提示词 SHALL 使用 mode label 标记主要阶段切换，以提示认知上下文切换。Mode label SHALL NOT 应用于 checkpoint 子状态；这些只是单一 `[Mode: Checkpoint]` 认知模式内的实现分支。

          - **主要阶段切换带有 mode label**

            - 工作流从证据准备切换到 reviewer 委派
            - step header SHALL 包含 `[Mode: Delegate Review]`
            - mode label SHALL 作为 step number 的前缀

          - **Checkpoint 子状态不单独使用 mode label**

            - 工作流处于 checkpoint 管理阶段
            - 单个 checkpoint 状态 SHALL NOT 获得独立 mode label
            - SHALL 在 `[Mode: Checkpoint]` section 内描述
        acceptanceCases: []
      - name: 显式 subagent delegation 指令
        body: |-
          quality 工作流提示词 SHALL 提供明确的 subagent delegation 指令，用于启动 reviewer 与 optimizer subagent。提示词 SHALL NOT 写入任何工具专属 API 调用语法，只描述工作流意图、subagent 角色、输入信息与等待规则。

          - **委派 reviewer 时只传定位信息**

            - coordinator 进入委派 reviewer 的步骤
            - coordinator SHALL 传入 changeName、changeDir、projectRoot 三个字符串
            - SHALL 指定 fresh context，确保 subagent 不继承对话历史
            - SHALL NOT 传入文件内容、change artifacts 或 git 证据的完整文本
            - SHALL 声明 reviewer 拥有 Read 与 Bash 工具能力

          - **委派 optimizer 时只传定位信息**

            - coordinator 进入委派 optimizer 的步骤
            - coordinator SHALL 传入 changeName、changeDir、projectRoot 三个字符串
            - SHALL 指定 fresh context
            - SHALL NOT 传入已有结论、文件内容或配置的完整文本
            - SHALL 声明 optimizer 拥有 Read 与 Bash 工具能力
        acceptanceCases: []
      - name: Subagent 超时和等待规则
        body: |-
          quality 工作流提示词 SHALL 为所有 subagent delegation 包含显式 timeout 与 waiting rules：等待完整 subagent 结果、超时后继续等待、询问用户而不是终止 subagent，且顶层 agent MUST 在进入下一步前接收完整 payload。

          - **Subagent 未及时返回**

            - subagent 在预期时间内没有返回
            - coordinator SHALL NOT 将其视为失败
            - SHALL 继续等待
            - SHALL NOT 在收到结果前进入 payload 校验

          - **等待时间过长**

            - coordinator 等待某个 subagent 超过设定的等待预算
            - coordinator SHALL 询问用户是否继续等待或终止
            - SHALL NOT 在未经用户确认时终止 subagent
        acceptanceCases: []
      - name: Checkpoint 协议使用有序执行步骤
        body: |-
          quality 工作流提示词 SHALL 以有序步骤描述 checkpoint 与回滚边界：先创建非空 baseline commit；每个成功方向创建含方向 ID 的 commit；失败记录写入后把 quality 记录与 `.apply-isolation.json` 快照到 repository 外并记录 SHA-256；最后回滚该轮实现、原子恢复三份当前状态文件并校验 hash。协议 SHALL 明确禁止空 baseline、stash 与 tag，并要求状态恢复异常时停止。

          - **Agent 执行失败回滚**

            - coordinator 处理某轮复核失败
            - prompt SHALL 先指示持久化三份当前状态文件的 snapshot
            - SHALL 再指示回滚该轮实现并原子恢复三份当前状态文件

          回滚保护 SHALL 覆盖当前 `.quality-state.json`、`.quality-log.jsonl`、`.apply-isolation.json` 及当前 Change 内的全部质量历史目录。执行 `git reset --hard HEAD` 和 `git clean -fd` 前，SHALL 将这些数据完整保存到 repository 外并记录文件清单与 SHA-256；之后恢复并逐项校验，包括历史中未被 Git 跟踪的文件，不因 HEAD 中没有这些文件而删除它们。历史目录原先不存在时 SHALL 保留该事实，不伪造旧轮次。

          恢复失败、校验不一致或历史文件缺失时 SHALL 停止，不提交新的优化结果。普通失败回滚 SHALL 保留当前台账的失败记录与预算，不调用重新验证的记录轮换流程。

          - **重启后的优化失败**：旧轮次历史已保存在 Change 内，新方向未通过 Review；回滚只丢弃本次 speculative code，三份当前状态文件和所有旧轮次历史均保持保存时的字节，状态匹配成功 checkpoint 后可按当前台账报告失败尝试。
          - **未跟踪的历史目录**：历史文件尚未被 Git 跟踪，`git clean -fd` 会清理它们；repository 外保存及恢复 SHALL 确保回滚后这些历史文件仍完整可读。
        acceptanceCases: []
      - name: 语言一致性
        body: |-
          quality 工作流中新增或修改的 prompt text SHALL 使用与现有模板一致的语言。Mode label SHALL 使用 `[Mode: ...]` 形式。

          - **Mode label 使用固定形式**

            - quality prompt 被组装
            - 所有 mode label SHALL 以 `[Mode: <Label>]` 形式出现
        acceptanceCases: []
  element:quality-writeback:
    declaration:
      identity: quality-writeback
      kind: element
      parent: quality
      title: Quality Writeback
      definition: Quality Writeback 定义 quality 如何把关键诊断结果回写到 change 工件，以及如何持久化自己的记录：CRITICAL 级不一致触发 `tasks.md` 任务 unmark、Required Corrections 清单生成、状态快照 `.quality-state.json` 的覆盖写与 append-only 历史日志 `.quality-log.jsonl` 的追加。它不定义状态判定规则（属于 Quality Freshness），也不定义命令面的输出形状。
    sections:
      - name: CRITICAL 不一致触发回写
        body: |-
          当 Review 发现 CRITICAL 级的 spec-code 不一致时，系统 SHALL 把 `tasks.md` 中对应任务的完成标记从 `[x]` 回退为 `[ ]`，并生成修正事项清单。

          - **CRITICAL 不一致触发 task unmark**

            - Review 检测到某个 Section 语义在代码中完全缺失实现
            - 该 Section 对应的 task 在 `tasks.md` 中标记为 `[x]`
            - 系统 SHALL 将该 task 的 `[x]` 替换为 `[ ]`
            - SHALL 在修正事项清单中记录 unmark 原因和对应的 Section

          - **WARNING 级别不触发自动回写**

            - Review 检测到 WARNING 级别的不一致
            - 系统 SHALL 仅在报告中列出 WARNING
            - SHALL NOT 自动修改 `tasks.md`

          - **无 CRITICAL 不一致时不修改 tasks.md**

            - Review 完成且无 CRITICAL 级 issue
            - 系统 SHALL NOT 修改 `tasks.md`
        acceptanceCases: []
      - name: Required Corrections 清单生成
        body: |-
          系统 SHALL 在发现问题时生成结构化的修正事项清单，区分 `code_fix` 和 `artifact_fix` 两类。

          - **生成 code_fix 类型修正事项**

            - Review 发现代码未实现某个 Section 语义
            - 修正事项清单 SHALL 包含一条 `code_fix` 条目
            - 条目 SHALL 包含对应的 Section 名称、缺失的具体行为与建议修改的文件

          - **生成 artifact_fix 类型修正事项**

            - Review 发现代码实现与 spec 或 design 描述不一致，但代码实现是合理的
            - 修正事项清单 SHALL 包含一条 `artifact_fix` 条目
            - 条目 SHALL 包含需要更新的 artifact 与当前描述与实际行为的差异

          - **Required Corrections 清单追加到 tasks.md**

            - 修正事项清单非空
            - 系统 SHALL 在 `tasks.md` 末尾追加 `## Required Corrections` section
            - 每条修正事项 SHALL 以 `- [ ]` checkbox 格式列出并标注类型
        acceptanceCases: []
      - name: 状态快照持久化
        body: |-
          系统 SHALL 把当前状态持久化到 change 目录下的 `.quality-state.json`，供 gate 与 archive 读取。快照 SHALL 包含 record 类型、时间戳、`result`、`issues`、`tasksFileHash`、验证上下文，以及已收口时的 Optimization 终态与 `stopReason`。

          - **持久化当前状态**

            - `xirang quality review` 或 `xirang quality optimize` 成功
            - 系统 SHALL 写入 `.xirang/changes/<name>/.quality-state.json`
            - 写入 SHALL 使用跨平台路径处理（`path.join`、`path.resolve`）
            - SHALL NOT 硬编码路径分隔符

          - **记录验证上下文**

            - 系统写入状态快照
            - 验证上下文 SHALL 包含 `contractVersion`、`evidenceFiles`、`evidenceFingerprint`、`evidenceFingerprintEntries`、`gitHeadCommit` 与时间戳
            - 指纹 entries 的排序 JSON 哈希 SHALL 等于整体 `evidenceFingerprint`
        acceptanceCases: []
      - name: append-only 历史日志
        body: |-
          系统 SHALL 把每次记录追加到 change 目录下的 `.quality-log.jsonl`，每行一条 JSON 记录。每组活动日志 SHALL 只追加，既有行 MUST NOT 被改写或删除；轮次判断、失败方向与被否决方向的记录 SHALL 保留。用户授权并按共享恢复 reference 完整保存、校验后，允许将整组快照与日志原样轮换到当前 Change 的质量历史目录，再由现有 Review 命令建立新的活动记录。该受控轮换是记录位置的变化，不允许截断日志、改写旧行、仅删终态或丢弃失败证据。

          - **每次记录追加一行**

            - `review` 或 `optimize` 成功写入记录
            - 系统 SHALL 向 `.quality-log.jsonl` 追加一行 JSON
            - 既有行 SHALL 保持不变

          - **快照与日志的写入顺序**

            - 系统持久化一轮记录
            - SHALL 先追加历史日志，再写入状态快照
            - 两者不一致时后续状态判定 SHALL 按保守方向判为 `dirty`

          - **失败方向可从日志恢复**

            - 需要判断某方向是否已被否决或其失败原因
            - 系统 SHALL 能从日志中的历史记录得到该结论
        acceptanceCases: []
      - name: 回写内容遵循 runtime projection
        body: |-
          系统 SHALL 在为 `tasks.md` 生成回写内容时使用从项目配置编译的 runtime projection 决定自然语言散文。

          - **回写散文遵循投影语言策略**

            - 系统追加或刷新 `## Required Corrections` 内容
            - runtime projection 定义了 prose language policy
            - 回写描述 SHALL 遵循该策略
            - task checkbox、`### Section:` header、Section 引用与其他 canonical token SHALL 保持不变
        acceptanceCases: []
      - name: 质量记录的受控轮换
        body: |-
          Agent SHALL 在共享恢复 reference 规定的授权和串行前提下，先完整保存 `.quality-state.json`、`.quality-log.jsonl` 的原始字节和重启原因，再校验保存内容，最后才移走根目录的活动记录。每次历史保存 SHALL 关联原轮次，使用当前 Change 内独立且不覆盖已有历史的位置；路径 SHALL 使用平台 path API，macOS、Linux、Windows 遵循相同完整性规则。

          保存、校验或轮换不完整时 SHALL 停止，不启动新 Review、不伪造通过记录。再次执行 SHALL 检查已有备份与活动文件；一致的保存可用于继续完成该次轮换，不得覆盖已有历史或把新产生的活动记录误当作旧记录移走。内容冲突或无法确认轮换边界时 SHALL 保留全部现有文件并报告具体证据缺口，不猜测哪份应被删除。

          轮换后的旧质量快照、日志、失败原因及重启原因 SHALL 保持可读，并在后续优化失败回滚及最终原样归档时完整保留。新活动日志与历史日志 SHALL 分开保存，不把旧 PASS 或旧台账复制进新活动记录。

          - **保存失败**：第二个文件保存或内容校验失败时，旧原件与已保存副本仍可用，不进入 fresh Review。
          - **轮换中断**：两个原始文件均已完整保存并校验，活动快照已移走而日志尚在；重入时检查字节和关联信息后完成剩余轮换，不覆盖历史，再启动新 Review。
          - **备份冲突**：已有历史位置包含不同内容时，不覆盖或删除任一版本，不继续轮换或启动验证。
          - **Windows 路径**：Change 位于带空格的 Windows 路径时，以平台 path API 定位两份记录和历史目录；原始文件字节与 POSIX 平台相同地受保护。
        acceptanceCases: []
  element:realization:
    declaration:
      identity: realization
      kind: perspective
      parent: project.root
      title: Realization
      definition: Realization 是将项目意图落实为项目状态的 Perspective，独立建模以从推进过程与协作结构两个互补角度组织 Semantic Model 构建和 Change 演进。在推进过程上，它通过 Semantic Model Build 构建或重建 Semantic Model，通过 Change Realization 将已授权 Change 落实为项目新状态并收束；在协作结构上，由 Participants 承担授权、判断与编排，由 Interaction Surfaces 提供配置、呈现与确定性操作。
    sections:
      - name: 通过 Semantic Model Build 构建模型
        body: |-
          Realization SHALL 通过 Semantic Model Build 构建或重建 Semantic Model。

          - **项目需要建立模型**

            - 用户授权模型构建范围与依据
            - Realization 进入 Semantic Model Build
        acceptanceCases: []
      - name: 通过 Change Realization 落实变更
        body: |-
          Realization SHALL 通过 Change Realization 将已授权 Change 落实为项目新状态并完成收束。

          - **Change 获得授权**

            - 完整 Change 可进入实现
            - Realization 推进 Change Implementation 与 Closure
        acceptanceCases: []
      - name: Participants 承担协作职责
        body: |-
          Realization SHALL 由 Participants 承担授权、判断与编排。

          - **推进需要语义判断**

            - 确定性操作不足以完成决策
            - 适用 Participant 承担判断
        acceptanceCases: []
      - name: Interaction Surfaces 提供操作支撑
        body: |-
          Realization SHALL 由 Interaction Surfaces 提供配置、呈现与确定性操作。

          - **推进需要模型操作**

            - Agent 需要查询、校验或状态转换
            - 它通过适用 Interaction Surface 完成操作
        acceptanceCases: []
      - name: 以两个维度完整描述落实
        body: |-
          Realization SHALL 由推进过程完整描述 Activity 或 Stage 的入口、推进、约束与结果，并由协作结构完整描述 Participant 或 Agent 工作身份的授权、责任、判断、操作、协调与交付。

          - **理解同一落实工作**

            - 用户或 Agent 查看一个 Realization 工作
            - 推进过程说明工作如何成立且协作结构说明主体承担什么职责
        acceptanceCases: []
      - name: 允许跨维度语义覆盖
        body: |-
          推进过程与协作结构 MAY 在各自维度表达相互覆盖的规范语义，且任一维度 SHALL NOT 被表达为另一维度的差量。

          - **Role 承担 Activity**

            - Agent 工作身份描述其承担 Activity 的相关职责
            - Activity 与 Role Contracts 分别保持各自维度的完整语义
        acceptanceCases: []
  element:realization-process:
    declaration:
      identity: realization-process
      kind: perspective
      parent: realization
      title: 推进过程
      definition: 推进过程是按落实工作如何发生的过程角度组织 Semantic Model Build 与 Change Realization 的 Perspective。它包含各阶段和活动的入口、顺序、约束与结果，不包含承担这些工作的 Participants、Agent 工作身份或 Interaction Surfaces。
    sections:
      - name: 推进过程维度组织
        body: |-
          realization-process SHALL 从过程推进角度组织 Realization 的落实活动：Semantic Model Build 构建或重建 Semantic Model，Change Realization 将已授权 Change 落实为项目新状态并收束。

          - **推进过程容纳两类落实活动**

            - 浏览 realization-process 的 descendants
            - 呈现 Semantic Model Build 与 Change Realization 及其细化阶段

          - **过程维度不定义语义来源**

            - 用户或 Agent 依据推进过程推进项目
            - 过程维度自身不构成新的语义来源
            - 规范性语义仍由 Semantic Model 与 Change 表达
        acceptanceCases: []
  element:relationships:
    declaration:
      identity: relationships
      kind: element
      parent: semantic-model
      title: Relationships
      definition: Relationships 是 Elements 之间显式的、类型化的语义联系。每个 Relationship 连接 source Element 与 target Element，并使用由 Metamodel 声明的 Relationship Kind，表达 Elements 之间的协作、依赖或约束；它补充 Hierarchical Elements 无法表达的联系。
    sections:
      - name: 表达跨层级语义联系
        body: |-
          Relationship SHALL 以 source Element identity、Relationship Kind identity 与 target Element identity 表达层级结构无法表达的协作、依赖或约束。

          - **建立语义联系**
            - 两个 Elements 存在需要显式表达的协作关系
            - 模型以 Metamodel 已声明的 Relationship Kind 连接二者
        acceptanceCases: []
      - name: 以全部内容确定 identity
        body: |-
          Relationship identity SHALL 由有方向的 source、kind 与 target 三元组完整确定，并且 Relationship SHALL NOT 包含其他字段或 MODIFIED 状态。

          - **改变关系端点**
            - source、kind 或 target 任一项变化
            - 该变化表示移除旧 Relationship 并新增不同 Relationship
        acceptanceCases: []
      - name: 保持容器无语义
        body: |-
          Relationship 容器 SHALL 仅包含 `relationships` 列表，条目 SHALL 仅含 `source`、`kind` 与 `target`；文件名、路径和分组方式 SHALL NOT 参与 identity 或语义。

          - **按不同 Kind 重新分组**
            - 相同 Relationship entries 被移动到不同容器文件
            - 模型比较不报告语义差异
        acceptanceCases: []
      - name: 保持关系词汇精确
        body: |-
          Relationship SHALL 使用 Metamodel 声明的 Relationship Kind；containment 派生语义（`belongs_to`、`refines`、`abstracts`）SHALL NOT 作为持久化 relationship edges。

          - **持久化 containment 关系被拒绝**
            - 模型显式声明 `belongs_to`、`refines` 或 `abstracts` edge
            - validation SHALL 返回重复语义 ERROR
        acceptanceCases: []
      - name: 校验关系端点
        body: |-
          Relationship endpoints SHALL 引用可解析 Elements，并遵守 Metamodel 可选 `sourceKinds` 与 `targetKinds`；未声明 endpoint constraint 时默认开放。

          - **Endpoint 约束违规**
            - relationship endpoint kind 不满足显式 Metamodel constraint
            - validation SHALL 返回包含 relation 与 endpoint kinds 的 ERROR
        acceptanceCases: []
  element:review:
    declaration:
      identity: review
      kind: element
      parent: quality
      title: Review
      definition: Review 是 Quality 中由代码状态反复触发的正确性门禁：只要存在未经 Review 的代码变更，就必须先执行 Review。它由 Reviewer 作为 Internal Agent 在不受 Apply 阶段上下文影响的 clean context 中执行，独立评估 Change 是否完整落实、项目行为是否正确、实现是否遵循决策与约束、必要清理是否完成，并判断当前结果是否符合 Expected Semantic Model。
    sections:
      - name: 在每次 Apply 修改后执行
        body: |-
          Review SHALL 在每次 Apply 修改项目后执行。

          - **项目状态被修改**

            - Apply 完成一轮写入
            - 最新状态进入 Review
        acceptanceCases: []
      - name: 在 Clean Context 中独立评估
        body: |-
          Review SHALL 由 Reviewer 在不受 Apply 上下文影响的 clean context 中执行。

          - **Review 开始**

            - 当前状态可供评估
            - Reviewer 使用隔离上下文
        acceptanceCases: []
      - name: 读取完整评估依据
        body: |-
          Review SHALL 读取 Semantic Model、Change、当前项目状态与项目证据。

          - **Reviewer 形成判断**

            - Review 获取输入
            - 四类依据共同支持结论
        acceptanceCases: []
      - name: 评估目标实现质量
        body: |-
          Review SHALL 评估 Change 是否完整落实、行为是否正确、实现是否一致、项目约束是否遵循以及必要清理是否完成。

          - **检查当前状态**

            - Reviewer 对照 Expected Semantic Model
            - 逐项评估完整性、正确性、一致性与清理
        acceptanceCases: []
      - name: 先证据后结论
        body: |-
          Review SHALL 只以当前项目状态中独立获得的充分证据判定通过。

          - **只有完成声明**

            - 当前状态缺少覆盖目标行为的证据
            - Review 不推测通过
        acceptanceCases: []
      - name: 输出 Required Corrections 或证据缺口
        body: |-
          证据缺失、证据矛盾或实现不符合目标时，Review SHALL 输出 Required Corrections 或明确证据缺口。

          - **发现阻塞问题**

            - 当前实现未满足门禁
            - 问题返回 Apply
        acceptanceCases: []
      - name: 通过状态具备 Checkpoint 资格
        body: |-
          Review 通过时，当前项目状态 SHALL 有资格成为 baseline 或 successful checkpoint。

          - **当前状态通过 Review**

            - 没有阻塞问题且证据充分
            - Quality 可保存该状态为 Checkpoint
        acceptanceCases: []
      - name: 结论绑定被评估状态
        body: |-
          Review 结论 SHALL 只适用于被评估的项目状态。

          - **Review 后项目修改**

            - 当前项目状态发生任何修改
            - 旧 Review 结论不适用于新状态
        acceptanceCases: []
      - name: 修改后重新 Review
        body: |-
          任何项目修改 SHALL 要求修改后的状态重新执行 Review。

          - **Apply 实现修正或优化**

            - 项目产生新状态
            - 该状态成为 `dirty`
            - Quality 再次进入 Review
        acceptanceCases: []
  element:reviewer:
    declaration:
      identity: reviewer
      kind: element
      parent: internal-agents
      title: Reviewer
      definition: Reviewer 评估当前项目状态是否完整、正确且一致地实现 Expected Semantic Model。它独立读取 Semantic Model、Change、项目状态与证据，先证据、后结论；阻塞问题形成 Required Corrections 返回 Apply。Review 通过时，当前状态才有资格成为 Checkpoint；Reviewer 不创建或恢复 Checkpoint，不修改项目。
    sections:
      - name: 独立取得 Review 证据
        body: |-
          Reviewer SHALL 自主读取 Review 所需的 Semantic Model、Change、项目状态与证据，不依赖 Apply 的完成声明。

          - **Reviewer 接受评估任务**
            - Review 开始
            - Reviewer 从当前状态独立取得依据
        acceptanceCases: []
      - name: 保持只读且不管理 Checkpoint
        body: |-
          Reviewer SHALL NOT 修改项目、创建 Checkpoint 或恢复 Checkpoint。

          - **Reviewer 发现问题**
            - 当前状态需要修正
            - Reviewer 返回结论而不改变被评估状态
        acceptanceCases: []
      - name: 交付结构化 Review 结论
        body: |-
          Reviewer SHALL 将通过结论、Required Corrections 或证据缺口作为结构化结果交付给 Agent。

          - **Review 完成**
            - Reviewer 已完成证据判断
            - Agent 获得用于下一步编排的结论
        acceptanceCases: []
  element:semantic-delta:
    declaration:
      identity: semantic-delta
      kind: element
      parent: change
      title: Semantic Delta
      definition: Semantic Delta 是 Change 的规范性组成，由一组相对于当前 Semantic Model 声明的 Semantic Delta Entries 构成。它与当前 Semantic Model 共同唯一确定 Expected Semantic Model；持久化于 `.xirang/changes/<change>/` 的四分区，其修改语为 ADDED、MODIFIED 与 REMOVED。
    sections:
      - name: 唯一确定目标模型
        body: |-
          Semantic Delta SHALL 由一组 Semantic Delta Entries 构成，并与当前 Semantic Model 共同唯一确定 Expected Semantic Model。

          - **应用完整 Delta**
            - 同一 Change 的全部 Entries 一并应用
            - 结果是唯一的 Expected Semantic Model
        acceptanceCases: []
      - name: 与 Model 同构存储
        body: |-
          Semantic Delta SHALL 持久化于 `.xirang/changes/<change>/` 的四个模型分区，并在 Model 单元字段基础上为每个 Entry 携带 operation。

          - **加载 Change Delta**
            - CLI 读取一个活动 Change
            - CLI 从四分区联合加载全部 Entries 而不从 Plan 推断缺失语义

          - **创建结构 delta**
            - change 修改 Metamodel、elements、containment 或 semantic relationships
            - SHALL 在 `.xirang/changes/<name>/` 对应分区（`metamodel/`、`elements/` Declaration Entry、`relationships/`）写入 delta 单元
            - 使用与 Model 同构的单元记法并携带 operation 字段

          - **结构模块与 Contract 同属一个 delta**
            - change 同时修改结构与 Element Contracts
            - Metamodel、Element Declaration 与 Relationship operations SHALL 写入对应分区单元
            - Section operations SHALL 写入对应 change-local `elements/` 单元正文
            - 系统 SHALL 共同 materialize 一个 Target Semantic Model
        acceptanceCases: []
      - name: 不污染目标状态
        body: |-
          Delta operation 与变更历史 SHALL 只属于 Change，SHALL NOT 成为 Expected Semantic Model 或同步后 Semantic Model 的组成。

          - **同步 Delta**
            - Semantic Delta 成功应用到正式模型
            - 结果只保留目标语义内容而不保留修改语
        acceptanceCases: []
      - name: 使用统一修改语
        body: |-
          Semantic Delta 的修改语 SHALL 只有 ADDED、MODIFIED 与 REMOVED；ADDED 与 MODIFIED 携带对应实体的完整目标内容，REMOVED 只声明需要移除实体的 identity。

          - **修改现有实体**
            - 一个现有实体在目标状态中内容变化
            - MODIFIED Entry 直接声明其完整目标态而不叙述变化过程

          - **改变 kind 使用 MODIFIED Declaration**
            - element 的 kind、Definition、title 或 parent 在相同稳定 identity 下发生变化
            - delta SHALL 使用携带完整目标态的 `MODIFIED` Element Declaration
            - 该 Element 的稳定 identity SHALL 保持不变

          - **identity 变化使用 REMOVED + ADDED**
            - element 的稳定 identity 本身发生变化
            - delta SHALL 使用 `REMOVED` old element 与一个完整 `ADDED` new element
            - MUST NOT 使用 `MODIFIED` 改变 identity

          - **禁止 raw extend reconciliation**
            - skill 指导 delta authoring
            - MUST NOT 将 raw LikeC4 `extend` 描述为 canonical operation
            - SHALL 指引使用 identity-level 单元记法
        acceptanceCases: []
      - name: 在 Entry 粒度表达 operation
        body: |-
          Delta 中的 Metamodel、View 与 Element Declaration Entry SHALL 在 frontmatter 携带 `operation`；Element Contract 的 Section Entries SHALL 通过 `## ADDED Sections`、`## MODIFIED Sections` 与 `## REMOVED Sections` 分节获得修改语；Relationship entries SHALL 各自携带 operation（仅 ADDED 或 REMOVED，endpoint/kind 变化以 REMOVED 旧 tuple 与 ADDED 新 tuple 表达）。

          - **仅修改 Element Contract**
            - Delta 只改变一个 Element 的 Sections
            - Element frontmatter 只用于定位且不声明 Declaration operation
        acceptanceCases: []
      - name: 支持 Element 单元内独立 Entries
        body: |-
          一个 Element Delta 单元 SHALL 能独立表达 Declaration Entry 与零到多个 Section Entries；仅修改 Declaration 时正文 SHALL 为空。

          - **同时修改声明和契约**
            - 一个 Element 的 parent 与多个 Sections 均需改变
            - 同一单元分别以 frontmatter operation 和 Sections 分节表达完整目标 Entries
        acceptanceCases: []
      - name: 禁止冲突操作
        body: |-
          同一 identity 在一个 Semantic Delta 中 SHALL NOT 出现冲突操作；`ADDED` identity 已存在、`MODIFIED`/`REMOVED` identity 不存在、声明 MODIFIED 无有效变化 SHALL 被验证拒绝。

          - **检测身份前置条件**
            - `ADDED` identity 已存在于当前模型，或 `MODIFIED`/`REMOVED` identity 不存在
            - validation SHALL 返回包含 operation、identity 与 source location 的 ERROR

          - **声明 MODIFIED 无有效变化**
            - `MODIFIED` payload 与当前模型聚合相同
            - validation SHALL 返回 operation reconciliation ERROR

          - **Operation identity precondition**
            - `ADDED` identity 已存在，或 `MODIFIED`/`REMOVED` identity 不存在
            - SHALL 返回包含 operation、identity 与 source location 的 ERROR

          - **Declared MODIFIED 无 effective change**
            - `MODIFIED` payload 与 Formal aggregate 相同
            - validation SHALL 返回 operation reconciliation ERROR

          - **同一 identity operation 冲突**
            - 同一 identity 出现多个不构成合法 structural replacement 的 operations
            - validation SHALL 返回 conflict ERROR
            - MUST NOT 依赖 source order 选择 operation
        acceptanceCases: []
      - name: 联合验证 Kind 目标
        body: |-
          Metamodel Entry 以 Element Kinds 与 Relationship Kinds 的稳定 identity 识别对象；Kind 变化 SHALL 与 Expected Semantic Model 中的 Element Declarations 与 Relationships 联合理解。

          - **修改 Kind 约束**
            - delta `MODIFIED` element kind 或 relationship kind
            - payload SHALL 包含该 identity 的完整目标 constraints
            - Expected Model 中全部 elements 与 relationships SHALL 重新验证
        acceptanceCases: []
  element:semantic-model:
    declaration:
      identity: semantic-model
      kind: element
      parent: semantic-objects
      title: Semantic Model
      definition: Semantic Model 是项目用户意图的完整结构化规范表达，独立建模以统一声明项目是什么并为 Agent 导航、验证和演进提供依据。它包含 Metamodel、Hierarchical Elements、Relationships 与 Views，不包含单次演进的 Semantic Delta、Change Plan 或落实这些意图的 Realization 过程。
    sections:
      - name: 完整表达项目语义
        body: |-
          Semantic Model SHALL 在可扩展 Metamodel 约束下，以任意深度的 Hierarchical Elements、显式 Relationships 与 Views 完整表达项目用户意图。

          - **Agent 理解项目**

            - Agent 导航或验证项目
            - Agent 可从模型获得所需层级、契约和关系而无需猜测
        acceptanceCases: []
      - name: 使用稳定 identity
        body: |-
          Semantic Model SHALL 只以稳定 identity 引用语义对象，且文件路径、目录结构与语法位置 SHALL NOT 构成 identity 或层级语义。

          - **移动存储单元**

            - 一个语义实体的文件被移动但 identity 与内容不变
            - 模型语义保持不变
        acceptanceCases: []
      - name: 完整四分区持久化
        body: |-
          Semantic Model SHALL 完整持久化于 `.xirang/model/` 的 `metamodel`、`elements`、`relationships` 与 `views` 四个分区。

          - **加载正式模型**

            - CLI 读取 `.xirang/model/`
            - CLI 联合四个分区构建完整模型
        acceptanceCases: []
      - name: 使用 Element 存储单元
        body: |-
          `elements` 中每个 Markdown 单元 SHALL 表达一个 Element Declaration 及其至多一个 Element Contract。

          - **加载 Element 单元**

            - CLI 读取 `elements` 分区中的 Markdown 单元
            - 它联合 frontmatter Declaration 与正文 Contract 构建一个 Element
        acceptanceCases: []
      - name: 使用 Metamodel 存储单元
        body: |-
          `metamodel` 中每个 Markdown 单元 SHALL 表达一个 Element Kind 或 Relationship Kind。

          - **加载 Kind 单元**

            - CLI 读取 `metamodel` 分区中的 Markdown 单元
            - 它依据 entity 加载一个 Kind
        acceptanceCases: []
      - name: 使用 Authored View 存储单元
        body: |-
          `views` 中每个 Markdown 单元 SHALL 表达一个 Authored View。

          - **加载 View 单元**

            - CLI 读取 `views` 分区中的 Markdown 单元
            - 它依据 frontmatter 加载一个 Authored View
        acceptanceCases: []
      - name: 使用 Relationship 列表容器
        body: |-
          `relationships` 文件 SHALL 仅作为任意多条 Relationship 的结构化列表容器。

          - **重组 Relationship 文件**

            - Relationship entries 在容器文件之间重新分组但三元组集合不变
            - 模型语义保持不变
        acceptanceCases: []
      - name: 自声明实体类型
        body: |-
          除 Relationship 容器文件外，每个 Markdown 单元 SHALL 在 frontmatter 以 `entity` 声明自身类型；分区 SHALL NOT 决定 entity type，错置单元 SHALL 按自声明解析并产生 `ENTITY_PARTITION_MISMATCH` WARNING。

          - **Element 单元位于错误分区**

            - 一个自声明 `element-declaration` 的单元出现在非 `elements` 分区
            - 加载器按 Element 解析、报告 warning，且不因该 warning 判定模型无效
        acceptanceCases: []
      - name: 约束 Identity 语法
        body: |-
          持久 identity SHALL 匹配 `[A-Za-z0-9._-]+`，SHALL NOT 包含路径分隔符或文件系统保留字符。

          - **Identity 含路径分隔符**

            - 一个模型实体声明不合法 identity
            - CLI 拒绝该模型
        acceptanceCases: []
      - name: 保持 Kind Identity 全局唯一
        body: |-
          Element Kind 与 Relationship Kind identities 在 Metamodel 内 SHALL 全局唯一。

          - **两类 Kind 使用相同 Identity**

            - Metamodel 声明重复 Kind identity
            - CLI 拒绝该模型
        acceptanceCases: []
      - name: 不以 LikeC4 持久化语义
        body: |-
          LikeC4 SHALL NOT 参与 Semantic Model 的规范持久化。

          - **保存正式模型**

            - 系统写入 `.xirang/model/`
            - 只写入四分区源而不写入 `.c4`
        acceptanceCases: []
      - name: 整体生成 LikeC4 缓存
        body: |-
          `.c4` SHALL 由完整 Semantic Model 整体生成到 `.xirang/.cache-likec4/`。

          - **生成可视化源**

            - CLI 为模型生成 LikeC4 表示
            - 产物只写入缓存
        acceptanceCases: []
      - name: 不回写生成期结构
        body: |-
          生成期局部名与嵌套结构 SHALL NOT 回写 Semantic Model。

          - **LikeC4 派生局部名**

            - 生成器为当前输出分配局部名
            - 该名称不成为持久 identity
        acceptanceCases: []
      - name: 只以 Identity 建立引用
        body: |-
          `parent`、Relationship endpoints、Kind 的 `parents`、`children`、`sourceKinds`、`targetKinds` 以及 View 的 `of`、`include`、`exclude` SHALL 只引用对应语义对象的 identity。

          - **被引用单元改名**

            - 一个存储文件改名但其中实体 identity 不变
            - 全部语义引用仍解析到同一实体
        acceptanceCases: []
      - name: 建立 Identity Source Index
        body: |-
          加载器 SHALL 以 entity type 与 identity 共同建立 `(entity type, identity) → source module` 索引；同一 identity 在不同实体类型下 SHALL 分别定位到各自的存储单元。

          - **定位语义实体来源**

            - CLI 需要读取或重写一个实体
            - 它 SHALL 按该实体的 entity type 与 identity 通过索引定位对应存储单元

          - **跨类型同名单元各自定位**

            - 模型同时包含同名 element 与 element-kind
            - CLI 通过索引定位其中任一实体
            - SHALL 定位到该实体所属类型的存储单元
            - MUST NOT 定位到另一类型实体的存储单元
        acceptanceCases: []
      - name: 保持文件组织非规范
        body: |-
          目录内文件名与位置 SHALL 只作为组织约定；默认可使用 `elements/<identity>.md`、`metamodel/<kind identity>.md`、`views/<view identity>.md` 并按 Relationship Kind 分组容器，但偏离默认 SHALL NOT 改变模型语义。

          - **使用非默认文件名**

            - 有效单元使用不同文件名
            - 加载与模型比较依据 entity 和 identity 正常处理该单元
        acceptanceCases: []
      - name: 保持 Section Name 唯一
        body: |-
          同一 Element Contract 内的 Section names SHALL 唯一。

          - **Contract 包含重名 Sections**

            - Validator 发现同一 Element Contract 中两个 Sections 使用相同 name
            - Validator 返回 `DUPLICATE_SECTION_NAME` ERROR
        acceptanceCases: []
      - name: 保持 Acceptance Case Name 唯一
        body: |-
          同一 Section 内的 Acceptance Case names SHALL 唯一。

          - **Section 包含重名 Acceptance Cases**

            - Validator 发现同一 Section 中两个 Acceptance Cases 使用相同 name
            - Validator 返回 `DUPLICATE_ACCEPTANCE_CASE_NAME` ERROR
        acceptanceCases: []
      - name: 验证 Element Kind 引用
        body: |-
          每个 Element Declaration 的 `kind` SHALL 引用已声明的 Element Kind。

          - **Element 使用未声明 Kind**

            - Validator 无法在 Metamodel 中解析 Element 的 kind
            - Validator 返回 `UNDECLARED_ELEMENT_KIND` ERROR
        acceptanceCases: []
      - name: 验证 Relationship Kind 引用
        body: |-
          每个 Relationship 的 `kind` SHALL 引用已声明的 Relationship Kind。

          - **Relationship 使用未声明 Kind**

            - Validator 无法在 Metamodel 中解析 Relationship 的 kind
            - Validator 返回 `UNDECLARED_RELATIONSHIP_KIND` ERROR
        acceptanceCases: []
      - name: 验证 Kind Constraint 引用
        body: |-
          Element Kind 的 `parents`、`children` 与 Relationship Kind 的 `sourceKinds`、`targetKinds` SHALL 只引用已声明的 Element Kinds；该引用闭包 SHALL NOT 要求 `parents` 与 `children` 机械对称。

          - **Constraint 引用未声明 Kind**

            - Validator 在任一 Kind constraint 字段发现无法解析的 identity
            - Validator 返回 `UNRESOLVED_KIND_REFERENCE` ERROR
        acceptanceCases: []
      - name: 验证 Authored View 引用
        body: |-
          Authored View 的 `of`、list-form `include` 与 `exclude` SHALL 只引用已声明的 Elements；`include: '*'` SHALL 不要求逐项引用检查。

          - **View 引用未声明 Element**

            - Validator 无法解析 `of`、list-form `include` 或 `exclude` 中的 Element identity
            - Validator 返回 `UNRESOLVED_VIEW_REFERENCE` ERROR
        acceptanceCases: []
      - name: 保持 Identity 命名空间独立
        body: |-
          Semantic Model SHALL 将 identity 唯一性约束在各自的实体类型命名空间内：Element identity、Metamodel Kind identity（Element Kind 与 Relationship Kind 共用）与 Authored View identity SHALL 各自独立；不同命名空间使用相同 identity SHALL 合法，MUST NOT 被报告为冲突，且引用 SHALL 按字段的实体类型解析。

          - **Element 与 Element Kind 跨类型同名**

            - 模型同时包含 element-declaration `implementation` 与 element-kind `implementation`
            - CLI 加载该模型
            - 两个实体 SHALL 各自独立存在且 MUST NOT 产生冲突诊断
            - Element 的 `kind` 引用 SHALL 解析到 element-kind，引用 MUST NOT 因同名而解析到另一类型的实体
        acceptanceCases: []
  element:semantic-model-build:
    declaration:
      identity: semantic-model-build
      kind: element
      parent: realization-process
      title: Semantic Model Build
      definition: Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写完整的 Candidate Semantic Model，由 CLI 做只读确定性校验并给出 review digest，用户确认后由 CLI 原子提升为 Semantic Model 并保留必要 history；本过程不通过 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。
    sections:
      - name: 遵守用户授权范围与依据
        body: |-
          Semantic Model Build SHALL 在用户授权的探索范围与声明的权威依据下推进。

          - **开始模型构建**

            - 用户明确范围与权威来源
            - Agent 只在授权边界内编译目标语义
        acceptanceCases: []
      - name: 选择探索范围与 Candidate 起点
        body: |-
          Build 启动时 SHALL 让用户选择探索范围（whole project、code and tests、documentation and current Xirang 或 custom paths and rules），并在当前 formal model 存在时显式选择 Candidate 起点（基于当前模型构建、重新构建或使用指定内容作为起点）。

          - **用户选择探索范围**

            - Build 在无 active Candidate 时启动
            - 用户声明的 source-of-truth 约束被记录在 `build.md`
            - 不静默将代码、测试、文档、配置、Git history 或当前 Xirang 指定为 source of truth

          - **用户选择基于当前模型构建**

            - 用户选择“基于当前 Xirang 构建”
            - Candidate 从当前 formal source 初始化，且 digest-confirmed promotion 前当前 formal source 保持不变

          - **用户选择重新构建**

            - 用户选择“重新构建 Xirang”
            - 初始化 clean Candidate skeleton，当前 formal source MAY 作为选定证据但不被复制到 Candidate

          - **用户指定构建起点**

            - 用户选择"使用指定内容作为起点"
            - Candidate 仅从用户批准的路径初始化
            - SHALL NOT 推断额外的 baseline 路径
        acceptanceCases: []
      - name: 产出完整 Candidate
        body: |-
          Semantic Model Build SHALL 产出一个完整四分区 Candidate Semantic Model。

          - **Candidate 可供审查**

            - 模型编写完成
            - Candidate 联合包含 Metamodel、Elements、Relationships 与 Views

          - **Candidate 按四分区编写**

            - Agent 已解决所需的 semantic decisions
            - SHALL 编写 `.xirang/candidate/{metamodel,elements,relationships,views}/`，使其共同组成一个 Candidate
            - 每个 `elements/<identity>.md` 单元 SHALL 同时承载一个 Element Declaration 与至多一个 Element Contract（正文为 `## Specification`）
            - SHALL NOT 创建 `candidate/architecture`、`candidate/contracts` 或其他平行 Contract store

          - **Required element 需要 contract**

            - Agent 编写 `contract: required` 的 element kind
            - 每个 required element SHALL 在其自身 `elements/` 单元正文中携带 Contract（至少一个 Section）
            - Agent SHALL 将缺失 Contract 视为 decision gap，不得创建 catch-all owner 或独立 Spec 单元
        acceptanceCases: []
      - name: 不通过 Change 构建模型
        body: |-
          Semantic Model Build SHALL NOT 通过 Change 或 Semantic Delta 构建或重建 Semantic Model。

          - **执行 Project Build**

            - 目标是整体构建模型
            - Agent 使用 Candidate 而不创建模型 Change
        acceptanceCases: []
      - name: 只读校验 Candidate
        body: |-
          CLI SHALL 对 Candidate 执行只读确定性校验。

          - **Candidate 存在错误**

            - 校验发现无效语义或记法
            - CLI 返回 diagnostics 且不修改 Candidate
        acceptanceCases: []
      - name: 返回 Review Digest
        body: |-
          CLI SHALL 为有效 Candidate 返回绑定该精确版本的 review digest。

          - **Candidate 校验通过**

            - Candidate 没有验证错误
            - CLI 返回可供确认的 digest
        acceptanceCases: []
      - name: 由用户确认精确版本
        body: |-
          Promotion SHALL 仅接受用户确认的 Candidate 精确版本。

          - **Candidate 在确认后改变**

            - 当前内容与用户确认的 digest 不一致
            - CLI 拒绝 promotion
        acceptanceCases: []
      - name: 原子提升并保留 History
        body: |-
          用户确认后，CLI SHALL 将 Candidate 原子提升为 Semantic Model 并保留必要 history。

          - **Promotion 成功**

            - 当前 Candidate 匹配已确认 digest
            - 正式模型整体进入新状态且历史保留
        acceptanceCases: []
      - name: 整体替换正式模型
        body: |-
          Promotion SHALL 以 Candidate 的四个分区整体替换 `.xirang/model/`；Candidate 中不存在的正式模型单元 SHALL NOT 被保留。

          - **Candidate 删除旧单元**

            - 已确认 Candidate 不包含旧模型中的实体
            - promotion 后该实体不再属于正式模型
        acceptanceCases: []
      - name: 隔离临时构建依据
        body: |-
          `build.md` 等临时 scaffolding SHALL NOT 成为提升后 Semantic Model 的组成。 已确认设计来源快照同样 SHALL 只进入 Build history，不提升为正式模型分区。

          - **提升 Candidate**

            - promotion 成功
            - `.xirang/model/` 仅包含四个规范分区
        acceptanceCases: []
      - name: 先初始化再记录构建依据
        body: |-
          Semantic Model Build SHALL 在确定 Candidate baseline 并执行 `candidate init` 后，才将授权范围、权威顺序和当前要求写入 `.xirang/candidate/build.md`。 独立的 CLI-managed 已确认设计记录 MAY 在 Candidate 初始化前建立，但不得提前写入尚不存在的 Candidate build.md；它不能绕过后续范围、依据与精确版本确认。

          - **开始新的 Build**

            - 用户已选择 Candidate baseline
            - Agent 先初始化 Candidate workspace，再写入 build.md
        acceptanceCases: []
      - name: 显式处理 Active Candidate
        body: |-
          进入 Build 时已存在 active Candidate，Semantic Model Build SHALL 向用户呈现其 baseline、inventory 与 status，并要求用户明确选择继续或授权丢弃后重新初始化。

          - **检测到 Active Candidate**

            - Candidate status 报告 active
            - Build 不静默继续或替换该 Candidate
        acceptanceCases: []
      - name: 在编写前通过 Modeling Decision Gate
        body: |-
          Semantic Model Build SHALL 在探索授权证据后、首次编写 Candidate 前解决所有会改变目标模型的未决选择，并按权威冲突、Element identity 与边界、hierarchy、Metamodel、Contracts、Relationships、Authored Views 的依赖顺序推进。

          - **多个目标模型符合现有依据**

            - 一个未决选择会改变稳定 identity、层级、契约、Kind、Relationship 或 View
            - Agent 提供受限选项并一次请求一个用户裁决
        acceptanceCases: []
      - name: 仅记录例外 Provenance
        body: |-
          `build.md` SHALL 仅在全局权威顺序之外记录用户裁决、权威冲突解决、非显然证据选择和明确排除的实现事实，并 SHALL 标识决策、依据及影响范围。

          - **语义直接来自全局权威**

            - 目标语义可从已记录权威唯一确定
            - Build 不为该语义重复创建逐条来源记录
        acceptanceCases: []
      - name: 按 BFS 语义层编写 Candidate
        body: |-
          Semantic Model Build SHALL 依次编写 Metamodel、Element Declarations 与 hierarchy、Element Contracts、Relationships、Authored Views；每个 Declaration SHALL 在对应 Contract 之前完成完整 Definition，并在每层完成后执行针对该层的 Agent 检查。

          - **中间层尚不完整**

            - required Contracts 尚未在 Declaration 层之后写入
            - Build 不对故意不完整的中间状态要求完整 candidate validate
        acceptanceCases: []
      - name: 按独立演进边界编写 Sections
        body: |-
          Semantic Model Build SHALL 以规范承诺能否独立新增、修改或移除判断 Section 边界，SHALL NOT 按句子、分句、`SHALL` 数量或目标条数机械拆分。

          - **动作与结果不可分**

            - 条件、动作、结果与保证共同构成同一不可独立演进的承诺
            - Build 将它们保留在一个 Section 中
        acceptanceCases: []
      - name: 保留独立整体约束
        body: |-
          Element Contract 中只复述 Declaration Definition 或 sibling Sections 语义并集且不增加规范承诺的条目 SHALL NOT 成为 Section；独立的不变量、顺序、原子性、一致性或完成条件 SHALL 保留为 Section。

          - **父级定义跨子能力顺序**

            - 整体 Element 需要约束多个子行为的顺序
            - Build 保留该整体 Section
        acceptanceCases: []
      - name: 确定性校验后执行独立语义审查
        body: |-
          完整 Candidate 通过 `candidate validate` 后，Semantic Model Build SHALL 启动一个新的 read-only clean-context 通用 subagent，要求其自行读取 `build.md`、四分区、权威来源、必要证据与 validation 结果并审查授权完整性和语义正确性。

          - **Candidate 结构有效**

            - deterministic validation 没有 ERROR
            - Build 在向用户呈现 digest 前执行独立 semantic review

          - **可选 subagent 加速探索**

            - 并行探索有助于 Agent 理解用户批准的项目范围
            - Agent MAY 使用 task-specific prompts 调用 subagents
            - Candidate validation 与 promotion SHALL NOT 依赖 subagent availability 或固定 subagent role
        acceptanceCases: []
      - name: 只以阻塞语义问题拒绝审查
        body: |-
          Candidate semantic review SHALL 只以 `BLOCKER` 或 `HIGH` findings 判定 FAIL，SHALL NOT 将措辞偏好或非阻塞样式意见送入修正循环。

          - **Review 只有样式意见**

            - Subagent 未发现授权、完整性或语义正确性问题
            - Semantic review 返回 PASS
        acceptanceCases: []
      - name: Candidate 修改后重新审查
        body: |-
          任何 Candidate 修改 SHALL 使先前 semantic review 结论失效；Build SHALL 重新运行 deterministic validation，并启动另一个新的 clean-context subagent。

          - **修正 Review Finding**

            - Agent 修改 Candidate source
            - Build 不恢复或复用原 subagent 上下文
        acceptanceCases: []
      - name: 缺少 Clean Context 时 Fail Closed
        body: |-
          当前工具无法提供 clean-context subagent 时，Semantic Model Build SHALL 暂停并报告缺失能力，SHALL NOT 退化为 authoring Agent 自审。

          - **工具不支持隔离委托**

            - Build 到达 semantic review gate
            - Build 不向用户声明 Candidate 已通过完整审查
        acceptanceCases: []
      - name: Promotion 后验证 Build 后置条件
        body: |-
          Promotion 成功后，Semantic Model Build SHALL 依次确认 Candidate inactive、`.xirang/model/` 四个分区均为真实目录且 `arch validate --json` success，才报告 Build 完成。

          - **Post-promotion Validation 有 Warning**

            - Formal validation success 且包含 warnings
            - Build 报告 warnings 但仍可完成
        acceptanceCases: []
      - name: 后置条件失败时不自动重试
        body: |-
          任一 promotion 后置条件失败时，Semantic Model Build SHALL 报告 promotion 是否成功、失败条件及当前 Formal/Candidate 状态，SHALL NOT 自动再次 promotion。

          - **Promotion 成功但 Candidate 仍 Active**

            - post-promotion status 不满足生命周期条件
            - Build 停止完成声明并报告异常
        acceptanceCases: []
      - name: 编写完整 Element Definition
        body: |-
          Semantic Model Build SHALL 结合 Element 的 parent、children 与 siblings 编写完整 Definition，使 Agent 可仅从 Declaration 与相邻层级上下文识别该 Element 的概念身份、独立理由和范围边界。

          - **Definition 只是标题换写**

            - Candidate Declaration 未完整表达 Element 的概念身份或边界
            - Build 在进入 Contract 层前修正该 Definition
        acceptanceCases: []
      - name: 独立审查 Definition 质量
        body: |-
          Candidate semantic review SHALL 检查每个 Definition 是否完整、是否混入 Contract 或实现语义，以及是否与 parent、children 或 siblings 重复、冲突或发生边界漂移。

          - **Clean-context Review 发现概念边界冲突**

            - 两个 Elements 的 Definitions 无法区分各自独立概念范围
            - review 返回阻塞 finding，Build 修正 Candidate 或返回 Modeling Decision Gate
        acceptanceCases: []
      - name: Element Kind 是语义标签不约束层级
        body: |-
          Semantic Model Build 编写 Element Declaration 时 SHALL 将 Element Kind 视为项目定义的语义标签，而非层级约束：优先选择最能准确表达该 Element 语义的最具体既有 Kind；当无合适 Kind 时，通过 Metamodel 新增或细化 Kind，而不是削弱 Element 的语义仅因能通过验证就使用泛化 Kind。任何 Kind 可出现在任意深度，父 Element 的 Kind 不限制子 Element 的 Kind。层级只表达抽象→细化。`parent` 字段必需，children 由 parents 推导获得。

          - **跨 kind 层级**

            - Agent 编写一个 element 其为任意 Kind
            - Build SHALL 接受该层级结构
            - SHALL NOT 因 kind 不匹配白名单而拒绝

          - **无合适 Kind 时通过 Metamodel 新增**

            - 项目当前没有 Kind 能准确表达 Element 的语义
            - Build SHALL 在 Metamodel 中新增或细化一个 Kind
            - SHALL NOT 使用一个虽然可验证但语义不匹配的泛化 Kind
        acceptanceCases: []
      - name: 从 legacy 文档恢复语义需 agent 选择归属
        body: |-
          Semantic Model Build 从 legacy 文档或正式模型恢复仍适用的行为时，SHALL 由 Agent 确定每段内容归属于哪个 Element、哪个层级、哪个 Contract Section。内容归属是语义选择，需要 model 理解能力，不得由文件名称、标题匹配或程序化映射自动决定。

          - **纯复制可直接做**

            - 恢复内容可直接复制且无需改写
            - Agent MAY 直接复制

          - **非复制改写必须通过 subagent**

            - 恢复内容需要改写或词汇迁移（如 `spec` → `contract`、`architecture-delta.c4` → 四分区 Semantic Delta、`.opsx` → `.xirang`）
            - Agent SHALL 通过 subagent 完成（有 subagent 时）
            - SHALL 使用初始阶段用户选择的模型

          - **已覆盖内容不重复添加**

            - Candidate 已有内容覆盖 legacy 文档的同义行为
            - Agent SHALL 跳过该内容

          - **退役行为不复活**

            - legacy 文档包含已明确排除的退役行为（如 architecture-delta.c4 持久化、Spec store/registry/frontmatter、`xirang change/spec/diff` 命令组、archive-time sync 或 `--no-sync`、impact-sweeper、operation label 接受）
            - Agent SHALL NOT 将该行为写入 Candidate
            - SHALL 在 `build.md` 中记录 covered、added 与 retired 的 sources
        acceptanceCases: []
      - name: 按项目配置形成 Candidate hierarchy
        body: |-
          Semantic Model Build SHALL 在 Modeling Decision Gate 与首次 Candidate hierarchy 写入前消费 normalized `decomposition`：完整读取解析路径指向的指导文件，并按其形成 Candidate hierarchy；文件缺失或不可读时 fail closed。CLI 解析是机械的名称到路径映射，SHALL NOT 解释方法论内容。拆分指导只决定 Element abstraction/refinement 使用的分解坐标系，SHALL NOT 覆盖用户授权、证据权威、Element Contract 或 Relationship 语义。

          - **读取解析后的指导文件**

            - 有效配置的 `decomposition` 解析出指导文件路径
            - Build 在结构决策前完整读取该文件并遵循其拆分指导
            - 对每个 sibling set 执行单维度、MECE 与 BFS 检查

          - **指导文件不可用时停止结构形成**

            - 解析路径的指导文件缺失或不可读
            - Build fail closed 并报告该解析路径
            - 不以任何默认方法继续写入 Candidate hierarchy

          - **独立语义审查检查拆分一致性**

            - Candidate 进入 clean-context semantic review
            - review 检查 hierarchy 是否一致应用已选择的拆分指导
            - 检查同一 sibling set 未混合不相容的职责、生命周期、部署或实现维度
        acceptanceCases: []
      - name: 复用确认记录形成 Candidate
        body: |-
          Semantic Model Build SHALL 使用统一中间设计记录格式及共享写作、确认权和覆盖规则，实例与 Change 记录隔离。用户确认即授权记录，只报告局部变更；记录容纳当前设计及显式决策状态，不将旧格式或 pending 当作确认。

          存在记录时重载、调和冲突，仅将已采纳且适用的规范内容编写为 Candidate；拆出条件、数值、例外、时序与原样正反例的原子细节，给出 Candidate 中的位置与摘录，经 xirang record coverage --candidate 记录。影响目标的 pending 问题先解决，不适用项说明理由；excluded 与 informative 保留必要依据，不强造义务。结构部分与 Candidate 逐字段比对。用户例子写为具体验收内容，不能泛化。

          无记录时 build.md 的授权范围须声明用户豁免或本次无 normative 内容，未声明阻塞 promotion readiness，不创建空记录。沿用 Candidate review、digest、promotion 与 history，不增加 Design Summary 门禁；覆盖及结构门禁通过后才允许来源交接。
        acceptanceCases: []
      - name: 交接记录后确认精确 Candidate
        body: |-
          Build SHALL 在覆盖结果经 CLI 记录有效、结构比对一致与适用校验通过后经 `xirang record consume --candidate` 向 active Candidate 交接精确记录来源，再验证带来源的最终 Candidate 并执行既有独立审查与用户 digest 确认。源或目标变化使受影响覆盖与确认失效。豁免或无记录时 SHALL 跳过 consumption 并在 promotion readiness 前核对已声明的记录决策，SHALL NOT 跳过确定性校验或独立语义审查本身。来源快照与覆盖结果 SHALL 进入 history 而不进入正式模型。

          - **确认最终带来源版本**

            - 覆盖复核与校验通过且来源可消费
            - 交接精确来源，验证带来源的最终 Candidate 并以其 digest 完成确认

          - **来源交接失败**

            - `xirang record consume` 返回失败
            - 保留来源与既有目标，阻塞 promotion readiness

          - **豁免时跳过消费但不跳过校验**

            - 来源已声明豁免或无记录
            - 跳过 consumption 并在 promotion readiness 前核对 `build.md` 上的记录决策
            - 确定性校验与独立语义审查仍照常执行
        acceptanceCases: []
  element:semantic-objects:
    declaration:
      identity: semantic-objects
      kind: perspective
      parent: project.root
      title: 语义对象
      definition: 语义对象是从项目规范语义构成角度组织 Semantic Model 与 Change 的 Perspective。它独立建模以将项目应该是什么及应该如何变化，与负责落实这些意图的 Realization 区分开；包含 Semantic Model 与 Change，不包含落实过程、参与者或交互界面。
    sections:
      - name: 语义对象维度组织
        body: |-
          semantic-objects SHALL 从语义角度组织 Semantic Model 与 Change：Semantic Model 表达项目当前状态下的结构化语义，Change 表达针对该模型的一次演进意图。两个维度在自身层级完整描述，跨维度语义覆盖是允许的。

          - **语义对象容纳模型与变更**

            - 浏览 semantic-objects 的 descendants
            - 同时呈现 Semantic Model 的组成（Metamodel、Hierarchical Elements、Relationships、Views）与 Change 的组成（Semantic Delta、Change Plan）

          - **维度独立演进**

            - Change 以 Semantic Delta 表达针对 Semantic Model 的演进意图
            - Semantic Model 与 Change 各自作为独立语义对象演进
            - 语义对象的组织不引入新的规范性语义
        acceptanceCases: []
  element:snack:
    declaration:
      identity: snack
      kind: element
      parent: implementation-first-path
      title: Snack
      definition: Snack 是 Implementation-first Path 的形成阶段。它从已发生的项目实现出发，对照 Semantic Model 形成完整 Change：通过 CLI 查询 Elements、Relationships 与 Element Contracts，并结合 conversation context、working-tree / staged / HEAD 与用户指定 diff 等实现证据识别影响面；再按证据与 Semantic Model 写出或更新 Semantic Delta 以及 `proposal.md` 与 `design.md`，不生成 `tasks.md`。
    sections:
      - name: 从已发生实现开始 Formation
        body: |-
          Snack SHALL 以已经发生的项目实现作为 Change Formation 输入。

          - **实现先于 Change**

            - 项目改动已经存在
            - Snack 对该状态进行语义调和
        acceptanceCases: []
      - name: 对照模型与实现证据识别影响
        body: |-
          Snack SHALL 结合 Semantic Model 查询以及 conversation context、working tree、staged、HEAD 与用户指定 diff 等适用证据识别影响面。

          - **收集已有实现证据**

            - Snack 开始
            - 它读取可用证据并与模型对照
        acceptanceCases: []
      - name: 形成或更新 Semantic Delta
        body: |-
          Snack SHALL 按实现证据与 Semantic Model 写出或更新 Semantic Delta。

          - **实现改变规范行为**

            - 当前模型未表达已实现目标状态
            - Snack 形成对应 Delta Entries
        acceptanceCases: []
      - name: 形成或更新意图与决策说明
        body: |-
          Snack SHALL 写出或更新 `proposal.md` 与 `design.md`。

          - **解释已有实现**

            - Change 需要记录原因与关键决策
            - Snack 调和 proposal 与 design
        acceptanceCases: []
      - name: 保持已一致内容不变
        body: |-
          Snack SHALL 保持已经与实现证据和 Semantic Model 一致的 Change 内容不变。

          - **现有 Entry 已匹配实现**

            - 某项语义无需调整
            - Snack 不改写该内容
        acceptanceCases: []
      - name: 不生成 Tasks
        body: |-
          Snack SHALL NOT 生成 `tasks.md`。

          - **实现已经完成**

            - Snack 形成 Change Plan
            - Plan 不包含虚构的执行任务
        acceptanceCases: []
      - name: 完成 Formation 审查与确认
        body: |-
          Snack SHALL 在 Change Formation 内完成必要审查与确认。

          - **实现意图存在歧义**

            - 证据不能唯一确定目标语义
            - Snack 等待用户确认
        acceptanceCases: []
      - name: 移交验证与收束
        body: |-
          Snack 完成后，已有实现 SHALL 对照完整 Change 进入后续验证与 Change Closure。

          - **Snack Formation 完成**

            - Change 已完整且确认
            - 当前实现进入 Verify
        acceptanceCases: []
      - name: 遵循共享 Contract 语义
        body: |-
          Snack SHALL 按共享 Element Contract、Section 与 Acceptance Case 语义调和 Contract Delta，并以 Section 的独立演进边界确定 Entries。

          - **已有实现影响多个规范承诺**

            - 实现证据分别改变可独立演进的语义
            - Snack 将变化调和为独立 Section Entries，并保持 Acceptance Cases 从属于各自宿主 Section
        acceptanceCases: []
      - name: 仅从充分证据调和 Definition
        body: |-
          Snack SHALL 只有在已确认用户意图与实现证据足以确定稳定概念身份和边界时才创建或修改 Element Definition；文件名、类名、符号、调用关系或实现移动 SHALL NOT 单独证明 Declaration 变化。

          - **代码结构不足以确定概念边界**

            - 多个 Definition 均与当前实现证据相容
            - Snack 标记未决内容并等待用户确认，不从代码结构自动生成 Definition

          - **实现重构不改变概念**

            - 已发生修改只移动代码或重命名实现符号且 Element 概念边界不变
            - Snack 不产生 Declaration Delta
        acceptanceCases: []
  element:snack-role:
    declaration:
      identity: snack-role
      kind: element
      parent: agent
      title: Snack Role
      definition: Snack 是 Agent 在 Implementation-first Path 中、从已发生实现出发形成或调和 Change 的工作身份。它对照 Semantic Model 与实现证据写出或更新 Semantic Delta 以及 Plan 中的意图与决策说明；因实现已完成，不生成执行任务清单。
    sections:
      - name: 限定 Change 写入范围
        body: |-
          Snack Role MAY 写入或更新 Semantic Delta、`proposal.md` 与 `design.md`，SHALL NOT 生成 `tasks.md`。

          - **Snack 需要调和制品**
            - 活动识别出不一致或缺失内容
            - Agent 只写入适用的 Change 制品
        acceptanceCases: []
      - name: 保留一致制品内容
        body: |-
          Snack Role SHALL 避免改写已被 Snack 判定与模型和实现证据一致的内容。

          - **某项 Change 内容已一致**
            - Agent 执行制品更新
            - 该内容保持不变
        acceptanceCases: []
      - name: 交付当前实现供独立验证
        body: |-
          Snack Role SHALL 将完整 Change 与当前项目状态交付给 Verify。

          - **Snack 活动完成**
            - Formation 审查与确认通过
            - Agent 组织后续独立评估
        acceptanceCases: []
  element:text-presentation:
    declaration:
      identity: text-presentation
      kind: element
      parent: view-presentation
      title: Text Presentation
      definition: Text Presentation 是通过人类可读文本向用户传达 View 所组织语义信息的呈现方法。它可以使用标题、段落、列表、表格或文本差异等形式组织内容，使用户能够阅读、引用和审查 View；文本的排版、措辞与输出载体只服务于呈现。
    sections:
      - name: 以人类可读文本传达 View
        body: |-
          Text Presentation SHALL 通过标题、段落、列表、表格或文本差异等人类可读形式组织并传达 View 的语义信息，使用户能够阅读、引用和审查该 View。

          - **阅读 Change-derived View**

            - 系统以 Text Presentation 呈现一个 Change-derived View
            - 用户可从文本中识别该 View 组织的语义变化
        acceptanceCases: []
      - name: 排除程序化结构数据
        body: |-
          文本的排版、措辞与输出载体 SHALL 只服务于呈现且 SHALL NOT 构成规范性语义；仅供程序消费的结构化数据 SHALL NOT 属于 Text Presentation。

          - **CLI 返回 JSON IR**

            - CLI 输出仅供程序消费的结构化结果
            - 该结果不因采用文本编码而成为 Text Presentation
        acceptanceCases: []
  element:user:
    declaration:
      identity: user
      kind: element
      parent: participants
      title: 用户
      definition: 用户表达并确认用户意图，裁决无法仅从 Semantic Model、Change 与项目证据确定的语义与范围问题，并授权需要用户判断的重要决策与状态转换；用户不必亲自执行项目修改或确定性 CLI 操作。
    sections:
      - name: 表达用户意图
        body: |-
          用户 SHALL 表达项目或 Change 的用户意图。

          - **发起项目演进**
            - 用户希望建立项目或改变目标状态
            - 用户说明期望意图
        acceptanceCases: []
      - name: 确认用户意图
        body: |-
          用户 SHALL 确认将被落实的用户意图。

          - **Agent 形成目标表达**
            - Agent 将意图编译为 Candidate 或 Change
            - 用户确认该目标表达
        acceptanceCases: []
      - name: 裁决证据无法确定的问题
        body: |-
          用户 SHALL 裁决无法仅从 Semantic Model、Change 与项目证据确定的语义与范围问题。

          - **存在多个合理解释**
            - 不同解释会改变目标语义
            - 用户选择目标解释
        acceptanceCases: []
      - name: 授权重要决策与状态转换
        body: |-
          用户 SHALL 授权需要用户判断的重要决策与状态转换。

          - **提升 Candidate**
            - Candidate 已验证并呈现 digest
            - 用户决定是否授权 promotion
        acceptanceCases: []
      - name: 无需亲自执行落实操作
        body: |-
          用户 SHALL NOT 被要求亲自执行项目修改或确定性 CLI 操作。

          - **已完成必要授权**
            - 后续步骤可由 Agent 与 CLI 确定推进
            - Agent 代表用户完成操作
        acceptanceCases: []
  element:view-presentation:
    declaration:
      identity: view-presentation
      kind: perspective
      parent: views
      title: View Presentation
      definition: View Presentation 是 Views 按语义信息如何传达给用户划分的呈现维度。View 可以采用 Visual Presentation、Text Presentation，或者同时提供两种呈现方法；呈现方法不改变 View 的呈现视角、组成方式或所依据的规范性语义。
    sections:
      - name: 支持一种或多种呈现方法
        body: |-
          View Presentation SHALL 允许一个 View 采用 Visual Presentation、Text Presentation 或同时采用两种方法。

          - **同时提供视觉与文本呈现**

            - 一个 View 需要支持浏览和引用
            - 系统可同时提供 Visual Presentation 与 Text Presentation
        acceptanceCases: []
      - name: 不改变 View 语义依据
        body: |-
          同一个 View 的不同呈现方法 SHALL 表达同一呈现视角，并 SHALL NOT 改变该 View 的组成方式或规范性依据。

          - **切换呈现方法**

            - 用户在同一 View 的视觉与文本形式之间切换
            - View 选择和组织的语义保持一致
        acceptanceCases: []
  element:views:
    declaration:
      identity: views
      kind: element
      parent: semantic-model
      title: Views
      definition: Views 是 Semantic Model 面向用户的呈现层。View 面向特定的理解、讨论、审查或决策目的，选择、组织并呈现 Semantic Model 的语义对象及与 Change 相关的派生信息；Views 不引入规范性语义，也不改变或替代 Semantic Model 与 Change 所表达的规范性语义。
    sections:
      - name: 组织面向用户的模型视角
        body: |-
          View SHALL 从 Semantic Model 中选择并组织 Elements 与 Relationships，以形成面向用户的特定视角。

          - **用户切换视角**

            - 用户选择一个 View
            - 系统按该视角组织相关 Elements 与 Relationships
        acceptanceCases: []
      - name: 不承载规范性语义
        body: |-
          View SHALL NOT 引入规范性语义，且 View 的变化 SHALL NOT 改变 Semantic Model 的语义。

          - **调整 View 布局**

            - View 的选择或布局发生变化
            - 模型规范性语义保持不变
        acceptanceCases: []
      - name: 区分 Authored 与 Derived Views
        body: |-
          Views SHALL 由 Authored Views 与 Derived Views 组成。

          - **确定 View 来源**

            - 系统提供一个 View
            - 该 View 要么由用户声明，要么由语义输入派生
        acceptanceCases: []
      - name: 区分 View Composition 与 View Presentation
        body: |-
          Views SHALL 以 View Composition 表达呈现视角如何形成，并以 View Presentation 表达语义信息如何传达给用户；两个维度 SHALL 相互独立。

          - **同一 View 采用多种呈现方法**

            - 一个 Authored View 或 Derived View 同时提供 Visual Presentation 与 Text Presentation
            - 两种方法表达同一呈现视角且不改变该 View 的组成方式
        acceptanceCases: []
      - name: 排除纯程序化数据
        body: |-
          仅供程序消费的结构化数据 SHALL NOT 属于 Views。

          - **CLI 输出结构化结果**

            - CLI 输出仅供程序消费的 JSON 结果
            - 该结果不因文本编码而成为 View
        acceptanceCases: []
  element:visual-presentation:
    declaration:
      identity: visual-presentation
      kind: element
      parent: view-presentation
      title: Visual Presentation
      definition: Visual Presentation 是通过图形元素、空间组织与视觉编码向用户传达 View 所组织语义信息的呈现方法。它可以提供选择、导航和下钻等交互，使用户能够观察整体结构并查看局部语义；图形布局、视觉样式与交互状态只服务于呈现。
    sections:
      - name: 以视觉形式传达 View
        body: |-
          Visual Presentation SHALL 通过图形元素、空间组织与视觉编码向用户传达 View 所组织的语义信息，并 MAY 提供选择、导航和下钻交互。

          - **浏览层级结构**

            - 用户通过 Visual Presentation 查看一个层级 View
            - 用户可观察整体结构并导航到局部语义
        acceptanceCases: []
      - name: 视觉选择不构成规范性语义
        body: |-
          图形布局、视觉样式与 runtime interaction state SHALL 只服务于呈现，SHALL NOT 成为 Semantic Model 或 Change 的规范性语义。持久 presentation MAY 存在于 Metamodel，作为 Element Kind 的 `nodePresentation` 或 Relationship Kind 的 `presentation` 全局默认值；它不改变 Kind 的规范语义、View composition 或 Relationship identity。Renderer SHALL 使用 LikeC4 默认值补全缺失字段，且非法值 SHALL 在 Xirang 输入校验阶段被拒绝。

          - **调整视觉布局**

            - 同一 semantic projection 的节点位置、routing 或 viewport 发生变化
            - View Selection 与模型规范语义保持不变

          - **Kind presentation 不改变语义**

            - Element Kind 声明 `nodePresentation` 或 Relationship Kind 声明 `presentation`
            - 该 Kind 实例的职责、行为、层级与 Relationship 语义保持不变
            - presentation 不参与 View Selection 决策

          - **缺失 Relationship presentation 字段**

            - Relationship Kind 未声明 `presentation` 或只声明部分子字段
            - 缺失内容分别使用 LikeC4 默认值
        acceptanceCases: []
      - name: 使用原生 LikeC4 布局管线
        body: |-
          Visual Presentation SHALL 基于由官方 LikeC4 parser 与 validator 建立的 base model，让每个 Web runtime projection 通过官方 compute-view 与 Graphviz layout 产生最终 geometry 与 Relationship routing；正常呈现 SHALL NOT 在 layout 后使用另一套固定网格或手工 spline 替换结果。

          - **呈现 Model 与等价 Authored View**

            - Model Selection 与 Authored View Selection 形成相同可见语义集合
            - 两者使用相同 LikeC4/Graphviz 管线
            - 不因 View 来源不同切换布局算法

          - **Graphviz 失败**

            - 当前 projection 无法完成 Graphviz layout
            - Browser 显示结构化错误与 retry
            - 不静默回退低质量 renderer
        acceptanceCases: []
      - name: 叠加差异而不覆盖业务呈现
        body: |-
          Visual Presentation SHALL 将 Element Kind 与 Relationship Kind presentation 作为前景业务样式，并通过独立 overlay 呈现 ADDED、MODIFIED 与 REMOVED；diff state SHALL 同时使用非颜色视觉标记，SHALL NOT 仅通过覆盖业务 color、line、head、tail、shape 或 border 表达。

          - **呈现修改的 Relationship**

            - 一个具有 Kind presentation 的 Relationship 为 MODIFIED
            - 前景 edge 保持该 Kind 的 color、line、head 与 tail
            - 更宽的半透明 underlay 与状态图标表达 MODIFIED

          - **呈现 REMOVED Element**

            - diff-capable projection 包含 REMOVED Element
            - Element 保留 before-state 业务样式并降低主体透明度
            - 状态描边与图标明确表示 REMOVED

          - **非颜色识别**

            - 用户无法依赖颜色区分 diff state
            - 状态图标、形态与 tooltip 仍可区分 ADDED、MODIFIED 与 REMOVED
        acceptanceCases: []
      - name: 分离 Relationship Edges
        body: |-
          Visual Presentation SHALL 为每个 Xirang Relationship 保留独立 visual edge，分别使用各自 identity、Kind presentation、diff state、label、arrow 与 details mapping。布局前，映射到相同可见 endpoints 的同向 Relationships 聚合为单条携带全部 relation identities 的官方 Graphviz edge 以复用 geometry，避免平行关系数导致的布局/内存爆炸；布局后，Xirang 依据聚合 edge 携带的 identities 恢复独立 visual edges，并重新应用各自的 Kind presentation 与 diff state。A→B 与 B→A 作为不同方向由 Graphviz 分别 routing，不得方向合并；同向不同 Kind 或同向不同 diff operation 的 Relationships 保持独立 identity、label、presentation 与详情映射，共享 geometry 不改变语义或交互身份。

          - **同时呈现两个方向**

            - 当前 projection 包含 A→B 与 B→A
            - 两个方向的路径由 Graphviz 分别 routing，且任一 edge 可独立 hover、选择和打开详情

          - **一个方向发生变化**

            - reciprocal pair 中只有一个 Relationship 携带 diff operation
            - diff overlay 只作用于该方向
            - 另一方向的业务 presentation 保持不变

          - **同向 Relationships 具有不同 Kind presentation**

            - 多个同向 Relationships 映射到相同可见 source/target 且使用不同 Kind presentation
            - 每个 Relationship 保留独立 visual edge、label 与业务 presentation
            - 一个 edge 的 diff operation 不改变其他 edge
        acceptanceCases: []
      - name: 在重新布局时保持视觉锚点
        body: |-
          Graphviz 在 focus、展开或 Mode 变化后 MAY 重新排列 projection；Visual Presentation SHALL 以触发 Element 或当前 focus 作为视觉锚点，尽量保持其屏幕位置与 viewport，并以平滑过渡更新其他节点。系统 SHALL NOT 在每次交互后自动 fit 全图。

          - **就地展开 Element**

            - 用户展开一个具有 children 的 Element并收到新 layout
            - 该 Element 尽量保持原屏幕锚点
            - viewport 不被自动重置为全图

          - **首次打开 projection**

            - 一个 projection 首次显示且没有既有视觉锚点
            - Browser MAY 执行初始 fit view
        acceptanceCases: []
      - name: 跳过 Compound Projection 的 disconnected-node chaining 预处理
        body: |-
          Visual Presentation SHALL 在官方 Graphviz layout 之前，对包含 compound endpoint edges 的 Element View projection 跳过 `unflatten` 的 disconnected-node chaining 预处理，直接使用 LikeC4 printer 生成的原始 DOT 进入 Graphviz layout；对不包含 compound endpoint edges 的 Element View projection，SHALL 保留既有 `unflatten` 预处理。判定 SHALL 基于 layout 前已建立的 compound endpoint 拓扑，不依赖 View 来源、focus、expanded set 或 Presentation Mode。

          - **呈现 Compound Projection**

            - 当前 Element View projection 至少一条 visual edge 的 source 或 target endpoint 是 compound container
            - 布局前 SHALL NOT 执行 `unflatten`
            - 该 projection 的原始 DOT 直接进入 Graphviz layout

          - **呈现非 Compound Projection**

            - 当前 Element View projection 不含 compound endpoint edges
            - 布局前 SHALL 执行既有 `unflatten` 预处理
            - 布局行为与预处理加入前保持一致

          - **Compound 存在但 edges 均为 leaf-to-leaf**

            - 视图包含 compound nodes，但所有 visual edges 的 endpoints 均不是 compound
            - 布局前 SHALL 执行既有 `unflatten` 预处理
            - 判定依据为 edge endpoints 而非视图是否包含 compound nodes
        acceptanceCases: []
  element:web:
    declaration:
      identity: web
      kind: element
      parent: interaction-surfaces
      title: Web
      definition: Web 是息壤在浏览器中的可视化交互界面，以经 Xirang 改造的 LikeC4 为技术支撑，与 CLI 并列作为 Interaction Surface，向用户呈现 Semantic Model、active Candidate 与 active Changes 的层级浏览与差异审查。它独立建模以承接面向用户的浏览编排语义；不包含 CLI 的配置维护与确定性操作，不构成规范性语义来源，不负责规范语义持久化、Candidate promotion 与 Change Closure。
    sections:
      - name: 启动边界：项目根发现与无项目失败
        body: |-
          `xirang view` SHALL 从嵌套目录沿父目录向上发现最近的 `.xirang/` 项目根，并仅在该项目根下启动嵌入式浏览器；不存在 `.xirang/` 项目时 SHALL 以非零状态失败。

          - **项目根向上发现**

            - 用户从 `.xirang/changes/some-change/` 等子目录运行 `xirang view`
            - CLI 沿父目录向上查找最近包含 `.xirang/` 的目录作为项目根
            - 使用该项目根的 Formal source 与 active changes

          - **未找到项目**

            - 用户在不包含 `.xirang/` 的目录运行 `xirang view`
            - CLI 报错："未找到 Xirang 项目"
            - 以非零状态退出且不启动服务器
        acceptanceCases: []
      - name: 支持分层语义浏览
        body: |-
          Web SHALL 在单一 route 中使用 Full Model 或 Authored View Selection，并可结合 Model Selection（active Candidate 或活动 Change 的 Expected Semantic Model），在被浏览 Model 实例内呈现不同抽象层级的 Elements、Element Contracts 与 Relationships；普通 Browser 的当前层 SHALL 由 View Selection 边界、focus、direct children、已就地展开后代与可映射到不同可见 endpoints 的 Relationships 共同确定。

          - **下钻 Full Model 或 Authored View**

            - 用户在 Full Model 或 Authored View Selection 中进入具有 children 的 Element
            - Browser 保持当前 View Selection，更新 focus、runtime projection、breadcrumb 与导航历史

          - **浏览 Element 详情**

            - 用户选择没有 children 的 Element
            - Browser 展示其声明、Contract、Relationships 与 refinement context
            - 不创建新的 View identity 或空 route
        acceptanceCases: []
      - name: 保持 Authored View 声明视角
        body: |-
          Authored View SHALL 以持久化 `include`、`exclude` 与可选 `of` 确定 View Selection 边界，并 SHALL 在该边界内支持与 Model 相同的 focus、下钻、breadcrumb 与就地展开；这些 runtime 状态 SHALL NOT 修改 View Definition。

          - **浏览 Authored View 子树**

            - 用户在 Authored View 中 focus 或展开具有 children 的 Element
            - Browser 只显露该 View 选择闭包内且未被 `exclude` 剪除的 descendants
            - Authored View 文件保持不变

          - **切换后呈现声明边界内内容**

            - 用户从 Model View 切换到 Authored View
            - 投影只呈现该 View 选择闭包内的 Elements，边界外 Elements 不呈现
            - 初始 focus 为该 View 的根 Element，不引用 View 外 Element

          - **在 Authored View 内就地展开**

            - 用户在 Authored View 内就地展开选择闭包内的 Element
            - Browser 以与 Model View 一致的方式呈现其 children

          - **在 Authored View 内显示 focus breadcrumb**

            - 用户在 Authored View 内下钻到闭包内 Element
            - focus breadcrumb 以该 View 根为起点呈现路径
            - 路径在该 View 边界处截断，不包含 View 外祖先
        acceptanceCases: []
      - name: focus 失效时确定性回退
        body: |-
          Semantic Model、Candidate 或 Semantic Delta 刷新使当前 focus 不再存在时，Web SHALL 沿刷新前的 ancestor 链回退到最近仍存在的 Element，并在没有可用 ancestor 时回退 Project Root。

          - **Change 更新移除当前 focus**

            - 用户正在 Change-derived View 中浏览的 Element 被更新后的 Semantic Delta 移除
            - Browser 选择最近仍存在的 ancestor、更新布局和 breadcrumb，且旧请求不得恢复已移除 focus

          - **Candidate 更新移除当前 focus**

            - 用户正在 Candidate 目标模型中浏览的 Element 被更新后的 Candidate 移除
            - Browser 选择最近仍存在的 Candidate ancestor、更新布局和 breadcrumb，且旧 source 内容不得恢复已移除 focus
        acceptanceCases: []
      - name: URL 编码导航状态并响应浏览器前进后退
        body: |-
          Web SHALL 在单一 route 的 URL 中编码 `view`、`model`、`mode` 与 `focus`，并将三维选择与 focus 变化呈现为浏览器历史步；expanded set SHALL 只存储于 Controller 会话和 browser history state，不进入 URL。浏览器前进/后退 SHALL 恢复对应状态，且同步 SHALL NOT 产生循环或重复历史条目。

          - **下钻与 breadcrumb 跳转**

            - 用户下钻 Element 或点击 breadcrumb ancestor
            - Browser 将新 focus 写入 URL 并新增历史步
            - 浏览器后退恢复先前 focus 与 projection

          - **控件变化**

            - 用户改变 View Selection、Model Selection 或 Presentation Mode
            - Browser 将对应 `view`、`model` 或 `mode` 写入 URL
            - 一次用户操作只形成一个历史步

          - **expanded 不进入 URL**

            - 用户就地展开任意数量的 Elements
            - URL 不增加 expanded identities
            - 前进后退可通过 history state 恢复，刷新后使用当前 focus 的默认折叠状态

          - **深链恢复**

            - 用户直接打开携带有效 `view`、`model`、`mode` 或 `focus` 的 URL
            - Controller 建立对应合法状态
            - 不存在的 identity 触发确定性默认回退而不是空白画布
        acceptanceCases: []
      - name: focus breadcrumb 可拖动
        body: |-
          Web 的 focus breadcrumb 导航 SHALL 可通过拖动手柄在 diagram 容器内移动，使用户可将它移开以避免遮挡编辑器控件；拖动 SHALL NOT 触发 diagram 平移，且 breadcrumb 内元素按钮的 focus 导航 SHALL 保持可用。

          - **拖动 breadcrumb**

            - 用户按住 breadcrumb 拖动手柄并在 diagram 容器内移动指针
            - breadcrumb 跟随指针移动
            - diagram 视图 SHALL NOT 随之平移或缩放

          - **breadcrumb 按钮仍可导航**

            - 用户点击 breadcrumb 内的元素按钮
            - 对应元素成为 focus
            - 该点击 SHALL NOT 启动拖动
        acceptanceCases: []
      - name: 提供当前 view 的层级树导出
        body: |-
          Web SHALL 为当前 view 提供层级树导出：按视图内呈现元素的父子层级构建树，根为视图根元素，子元素按声明层级嵌套，且树 SHALL 仅包含当前 view 呈现的元素。

          - **导出当前 view 层级树**

            - 用户从导出菜单选择层级树导出
            - 打开层级树导出页，内容为当前 view 的元素层级树
            - 根节点为当前 view 的根元素，子孙按父子关系嵌套

          - **树仅含当前 view 元素**

            - 当前 view 只呈现模型的一部分元素
            - 层级树 SHALL 只包含该 view 呈现的元素及其层级
            - SHALL NOT 混入 view 之外的模型元素
        acceptanceCases: []
      - name: 层级树多格式与字段选择
        body: |-
          层级树导出 SHALL 支持三种序列化格式——纯文本缩进树（`├──`/`└──` 树形线）、Markdown 嵌套列表与 JSON 结构化层级——由用户在导出页选择；文本与 Markdown 每行内容 SHALL 按 `title`/`fqn`/`kind` 字段组合呈现，JSON SHALL 恒包含 `title`、`fqn`、`kind` 与 `children`。

          - **切换导出格式**

            - 用户在层级树导出页选择纯文本、Markdown 或 JSON 格式
            - 内容按所选格式重新渲染
            - 复制与下载的文件扩展名与所选格式一致（`.tree.txt`/`.tree.md`/`.tree.json`）

          - **选择每行字段**

            - 用户勾选 `title`、`fqn` 与 `kind` 字段
            - 文本与 Markdown 的每行按选中字段组合呈现
            - 未选中的字段不出现在行内容中

          - **JSON 输出全字段**

            - 格式为 JSON
            - 输出为嵌套 JSON，每个节点包含 `title`、`fqn`、`kind` 与 `children`
            - 不受字段选择影响
        acceptanceCases: []
      - name: 图片导出所见即所得
        body: |-
          Web SHALL 通过既有图片导出入口导出当前 layouted projection：PNG/JPG SHALL 包含当前 View Selection、optional Change、Presentation Mode、focus、direct children 与已就地展开后代对应的画布内容；交互式 Browser chrome SHALL 被排除，在没有可用 snapshot 时 SHALL 回退到既有默认导出行为。

          - **导出聚焦且就地展开的 Authored View**

            - 用户在 Authored View Selection 中 focus 并展开部分后代后导出 PNG 或 JPG
            - 导出节点和 edges 与屏上 projection 一致
            - 不包含三个控制器或 breadcrumb

          - **导出 Complete with diff**

            - 用户在 `complete-with-diff` 中导出 PNG 或 JPG
            - 导出图片保留业务 presentation、diff overlay 与 REMOVED ghosts

          - **无前置 snapshot**

            - 用户直接打开导出页且没有交互 Browser 写入的 snapshot
            - 导出回退到既有默认行为且不产生错误
        acceptanceCases: []
      - name: 文件类导出保持完整模型结构
        body: |-
          Web 的 dot、d2、mmd、puml、Draw.io 与层级树导出 SHALL 导出当前所选 source 的完整模型结构（全部 Elements 与其层级），SHALL NOT 反映当前 focus 与就地展开状态；该行为是导出能力的既定范围而非缺陷，图片导出（PNG/JPG）按“图片导出所见即所得”呈现当前视图。

          - **导出 dot/mmd/puml/d2/Draw.io 文件**

            - 用户在聚焦并就地展开后导出 dot、d2、mmd、puml 或 Draw.io
            - 导出内容为完整模型结构，包含全部 Elements 与其层级，与当前 focus 和就地展开无关

          - **导出层级树**

            - 用户在聚焦后导出层级树
            - 树包含当前 source 的完整模型层级，而非仅当前 focus 视图
        acceptanceCases: []
      - name: 提供三维独立控制
        body: |-
          Web SHALL 在单一 Browser route 中以持久可见且相互独立的 Model Selection、View Selection 与 Presentation Mode 控件形成当前浏览状态。Model Selection SHALL 为 baseline、active Candidate（若存在，`model=candidate`）或一个活动 Change 的 Expected Semantic Model（`model=change:<identity>`），Candidate 不存在时 SHALL NOT 出现该值；View Selection SHALL 只选择 Full Model 或一个对当前 Model 实例解析非空的 Authored View；Presentation Mode SHALL 在非 baseline Model 时提供 `complete`、`complete-with-diff` 与 `diff-only`，baseline 时锁定为 `complete`。

          - **三维独立切换**

            - 用户改变 Model Selection、View Selection 或 Presentation Mode
            - 另外两个维度的选择保持不变
            - 新的组合状态立即生成对应 projection

          - **Candidate 提供三态 Mode**

            - Model Selection 为 active Candidate
            - Presentation Mode 控件列出 `complete`、`complete-with-diff` 与 `diff-only`
            - 默认为 `complete`
        acceptanceCases: []
      - name: 协调 View Selection 运行时状态
        body: |-
          Web SHALL 在切换 View Selection 时保留仍属于新选择边界的 focus，并将 expanded set 限制为新选择中仍有效且可达的 Elements；focus 不再有效时 SHALL 回到新 View 默认 root，Model Selection 与 Presentation Mode SHALL 保持不变。

          - **切换到仍包含当前 focus 的 Authored View**

            - 当前 focus 与部分 expanded Elements 仍属于新 Authored View 的选择边界
            - Browser 保留 focus 与仍有效的 expanded Elements
            - 使用新 projection key 重新布局

          - **切换后 focus 不可用**

            - 当前 focus 不在新选择中或被 `exclude` 剪除
            - Browser 回到新 View 默认 root
            - 被排除或不可达的 expanded Elements 不得重新出现

          - **当前 Model 在新 View 中无差异**

            - 保留的非 baseline Model Selection 与新 View Selection 没有交集
            - Browser 显示明确的空差异状态
            - 不自动修改 View、Model 或 Mode
        acceptanceCases: []
      - name: 静态渲染不呈现交互式 Browser Chrome
        body: |-
          Web 的三个控制器、breadcrumb、loading/error controls 与其他交互式 Browser chrome SHALL 只在交互页面呈现；首页卡片、悬停预览与 PNG/JPG 导出 SHALL 只呈现当前 layouted projection。

          - **导出当前 projection**

            - 用户从交互 Browser 导出 PNG 或 JPG
            - 图片包含当前 projection 内容
            - 不包含 View、Change、Mode 控件、breadcrumb 或 diagnostics chrome
        acceptanceCases: []
      - name: 首页提供 Candidate 与活动 Change 快速入口
        body: |-
          Web 首页 SHALL 为 active Candidate（若存在）与每个活动 Change 提供快速入口卡片；Candidate 卡片 SHALL 以 `model=candidate` 状态打开单一 route 并省略 `mode`；活动 Change 卡片 SHALL 以 `model=change:<name>&mode=diff-only` 状态打开单一 route；活动 Change 与 Candidate SHALL NOT 因首页入口而形成独立 View source。

          - **点击 Candidate 卡片**

            - 用户在首页点击 Candidate 入口卡片
            - Browser 以 `model=candidate` 状态打开，URL 不含 `mode`
            - Model Selection 显示 Candidate，Mode 为 `complete`

          - **点击活动 Change 卡片**

            - 用户在首页点击一个活动 Change 卡片
            - Browser 以 `model=change:<name>&mode=diff-only` 状态打开
            - View Selection 保持 Full Model
        acceptanceCases: []
      - name: 切换 View、Model 或 Mode 后自动适配视口
        body: |-
          Web SHALL 在 View Selection、Model Selection 或 Presentation Mode 切换产生的新 projection 应用后，自动缩放并居中，使该 projection 的全部内容完整可见；由 focus 下钻或就地展开引起的 projection 更新 SHALL NOT 触发自动适配，SHALL 保持用户当前视口。

          - **切换 View 后适配**

            - 用户在交互式 Browser 中切换 View Selection
            - 新 projection 应用后视口自动缩放并居中
            - 该 projection 的全部内容完整可见

          - **切换 Model 后适配**

            - 用户切换 Model Selection
            - 新 projection 应用后视口自动缩放并居中
            - 该 projection 的全部内容完整可见

          - **切换 Mode 后适配**

            - 用户切换 Presentation Mode
            - 新 projection 应用后视口自动缩放并居中
            - 该 projection 的全部内容完整可见

          - **快速入口进入后适配**

            - 用户通过首页快速入口卡片以 `view`/`model`/`mode` 状态打开单一 route
            - 首个 projection 应用后视口自动缩放并居中
            - 该 projection 的全部内容完整可见

          - **下钻与就地展开不触发适配**

            - 用户下钻 focus 或就地展开后代
            - 视口保持用户当前位置
            - 不自动缩放或居中
        acceptanceCases: []
      - name: 呈现 Model 目标与差异
        body: |-
          Web SHALL 将 Model Selection、View Selection 与 Presentation Mode 确定性组合并呈现对应 projection；非 baseline Model SHALL 提供 `complete`、`complete-with-diff` 与 `diff-only` 三种 Presentation Mode，默认值按 Model 值区分（Candidate 为 `complete`，活动 Change 为 `complete-with-diff`），baseline SHALL 锁定为 `complete`；系统 SHALL NOT 为每个 Model 值创建独立可选 View source。`complete` 与 `complete-with-diff` projection SHALL 使用该 Model 的 target-only sources，`diff-only` projection SHALL 使用 baseline 与该 Model 的 union sources；REMOVED elements SHALL 仅在 `diff-only` 中以 ghost 保留。

          - **Complete 模式**

            - 用户使用 `complete`
            - baseline 呈现当前模型，非 baseline Model 呈现其目标模型
            - 不添加 diff overlay

          - **Complete with diff 模式**

            - 用户使用 `complete-with-diff`
            - Browser 呈现该 Model 的 target projection
            - 可见节点与边叠加 ADDED、MODIFIED 与 REMOVED 差异标记
            - REMOVED elements 不属于 target projection，不在该模式中呈现

          - **Diff only 模式**

            - 用户使用 `diff-only`
            - Browser 仅保留 changed objects、必要 ancestors、Relationship endpoints 与 removed ghosts
            - unchanged context 不计入 diff counts

          - **浏览 Candidate 默认目标态**

            - 用户以 `model=candidate` 打开
            - Browser 呈现 Candidate 目标模型，Mode 为默认 `complete`，无差异标记
        acceptanceCases: []
  element:workspace-init-update:
    declaration:
      identity: workspace-init-update
      kind: element
      parent: project-tooling-configuration
      title: 工作区初始化与更新
      definition: 工作区初始化与更新是 CLI 中初始化和更新息壤工作区的能力。它通过 `xirang setup` 与 `xirang update` 创建或保留 `.xirang` durable workspace、安装固定 Agent workflow 集合、刷新受管 Agent surfaces，并维护配置默认值与退役 workspace 的迁移。
    sections:
      - name: 初始化完整工作区
        body: |-
          `xirang setup` SHALL 创建或保留 `.xirang` durable core、项目配置、formula Semantic Model skeleton 与 Agent workflow 集合，且不得声称 Project Build 已完成。

          - **新项目 setup**

            - 项目不存在 `.xirang/` workspace
            - setup SHALL 创建 config、四分区模型骨架、changes 与 references，并安装固定 workflow 集合
            - SHALL NOT 从项目证据推断 Candidate 语义

          - **既有项目 setup**

            - `.xirang/` 已存在
            - setup SHALL 保留 existing formal source、配置与用户内容，并仅在用户明确选择工具后刷新 managed Agent surfaces
        acceptanceCases: []
      - name: 安装固定 Agent Workflow 集合
        body: |-
          `xirang setup` 与 `xirang update` SHALL 安装固定 workflow 集合：propose、explore、apply、archive、build 和 snack。

          - **安装 Build workflow**

            - configured tool 支持 skills
            - setup SHALL 生成 `xirang-build`
            - SHALL NOT 生成退役的 bootstrap workflow artifacts
        acceptanceCases: []
      - name: 支持跨平台与 non-interactive 运行
        body: |-
          Setup SHALL 对所有 workspace paths 使用 Node.js path APIs，并 SHALL 提供显式 non-interactive tool selection。

          - **Windows setup**

            - setup 在 Windows、macOS 或 Linux 上运行
            - generated workspace paths 与 formal source 内容等价，且 filesystem operations 使用 path-aware APIs

          - **Non-interactive setup**

            - setup 在无 prompts 环境中运行
            - SHALL 要求显式 supported `--tools` value，invalid values 返回可操作 diagnostics
        acceptanceCases: []
      - name: 更新受管工作面
        body: |-
          `xirang update` SHALL 根据全局配置刷新项目中的受管 skills 指令文件，SHALL NOT 刷新退役的 slash-command workflow artifacts。

          - **刷新现有工具制品**

            - 项目中已配置 AI 工具
            - 检测已安装的工具 skills 目录并为每个检测到的工具重新生成固定 workflow skills

          - **无变化时保持稳定**

            - installed skills 匹配固定 workflow 集合且所有模板为最新
            - update SHALL 显示 "Already up to date."
        acceptanceCases: []
      - name: 迁移配置默认值
        body: |-
          `xirang update` SHALL 以 missing-only 方式在 `.xirang/config.yaml` 或 `.xirang/config.yml` 中物化缺失的功能性默认值，且 SHALL NOT 覆盖用户已设置的值。

          - **配置缺失时创建**

            - 项目没有 config 文件且用户运行 `xirang update`
            - 命令创建包含 `schema`、`optimization`、`apply` 与 `git` 默认节点的 config 文件
            - 不写入退役的 git 字段（`git.autoCommit`、`commitMessage.convention` 等）

          - **缺失嵌套默认值补齐**

            - config 包含部分用户值且缺少 `optimization.directionLimit` 或 `optimization.directionRetries` 等默认值
            - 命令保留用户值并补齐缺失默认值
        acceptanceCases: []
      - name: 清理退役工作区
        body: |-
          当 update 或 setup 发现退役 workspace 时，SHALL 在用户确认后将其移动到显式 `.xirang/history/legacy-<timestamp>/` entry。

          - **Retired workspace cleanup**

            - 检测到退役 workspace 且用户确认 cleanup
            - 完整移动该 directory 并用 manifest 记录原始相对路径，runtime 不再读取旧 active path

          - **用户拒绝 cleanup**

            - 用户拒绝 cleanup
            - setup/update 失败且不删除或部分移动退役 workspace
        acceptanceCases: []
  relationship-kind:constrains:
    identity: constrains
    body: ""
  relationship-kind:consumes:
    identity: consumes
    body: ""
  relationship-kind:invokes:
    identity: invokes
    body: ""
  relationship-kind:precedes:
    identity: precedes
    body: ""
  relationship-kind:produces:
    identity: produces
    body: ""
  relationship-kind:responsible-for:
    identity: responsible-for
    body: "`responsible-for` 从 Participant 或工作身份指向其承担职责的 Activity 或 Stage。该关系表示职责关联，不表示 source 独占或独自执行 target，也不转移用户、CLI 或其他 Participants 在该过程中的职责。"
  relationship-kind:supports-presentation:
    identity: supports-presentation
    body: "`supports-presentation` 从 Interaction Surface 指向其支持的 View Presentation，表示该交互界面能够通过目标呈现方法向用户传达 Views。该关系不表示排他归属，也不改变 View 的组成方式、呈现视角或规范性依据。"
  relationship-kind:validates:
    identity: validates
    body: ""
  "relationship:agent\0invokes\0deterministic-operations":
    source: agent
    kind: invokes
    target: deterministic-operations
  "relationship:apply\0consumes\0semantic-delta":
    source: apply
    kind: consumes
    target: semantic-delta
  "relationship:apply\0precedes\0review":
    source: apply
    kind: precedes
    target: review
  "relationship:apply-role\0responsible-for\0apply":
    source: apply-role
    kind: responsible-for
    target: apply
  "relationship:archive-role\0responsible-for\0change-closure":
    source: archive-role
    kind: responsible-for
    target: change-closure
  "relationship:change-closure\0consumes\0semantic-delta":
    source: change-closure
    kind: consumes
    target: semantic-delta
  "relationship:change-closure\0invokes\0deterministic-operations":
    source: change-closure
    kind: invokes
    target: deterministic-operations
  "relationship:change-closure\0produces\0semantic-model":
    source: change-closure
    kind: produces
    target: semantic-model
  "relationship:change-formation\0consumes\0semantic-model":
    source: change-formation
    kind: consumes
    target: semantic-model
  "relationship:change-formation\0precedes\0change-implementation":
    source: change-formation
    kind: precedes
    target: change-implementation
  "relationship:change-formation\0produces\0change":
    source: change-formation
    kind: produces
    target: change
  "relationship:change-implementation\0consumes\0change":
    source: change-implementation
    kind: consumes
    target: change
  "relationship:change-implementation\0precedes\0change-closure":
    source: change-implementation
    kind: precedes
    target: change-closure
  "relationship:change-realization\0consumes\0change":
    source: change-realization
    kind: consumes
    target: change
  "relationship:cli\0supports-presentation\0text-presentation":
    source: cli
    kind: supports-presentation
    target: text-presentation
  "relationship:delivery-validation\0validates\0framework-identity":
    source: delivery-validation
    kind: validates
    target: framework-identity
  "relationship:design-exploration\0consumes\0confirmed-design-record":
    source: design-exploration
    kind: consumes
    target: confirmed-design-record
  "relationship:design-record\0produces\0confirmed-design-record":
    source: design-record
    kind: produces
    target: confirmed-design-record
  "relationship:deterministic-operations\0consumes\0change":
    source: deterministic-operations
    kind: consumes
    target: change
  "relationship:deterministic-operations\0consumes\0confirmed-design-record":
    source: deterministic-operations
    kind: consumes
    target: confirmed-design-record
  "relationship:deterministic-operations\0consumes\0semantic-model":
    source: deterministic-operations
    kind: consumes
    target: semantic-model
  "relationship:deterministic-operations\0produces\0confirmed-design-record":
    source: deterministic-operations
    kind: produces
    target: confirmed-design-record
  "relationship:deterministic-operations\0validates\0semantic-delta":
    source: deterministic-operations
    kind: validates
    target: semantic-delta
  "relationship:deterministic-operations\0validates\0semantic-model":
    source: deterministic-operations
    kind: validates
    target: semantic-model
  "relationship:explore\0invokes\0deterministic-operations":
    source: explore
    kind: invokes
    target: deterministic-operations
  "relationship:explore\0precedes\0propose":
    source: explore
    kind: precedes
    target: propose
  "relationship:explore-role\0responsible-for\0explore":
    source: explore-role
    kind: responsible-for
    target: explore
  "relationship:framework-identity\0constrains\0workspace-init-update":
    source: framework-identity
    kind: constrains
    target: workspace-init-update
  "relationship:metamodel\0constrains\0hierarchical-elements":
    source: metamodel
    kind: constrains
    target: hierarchical-elements
  "relationship:metamodel\0constrains\0relationships":
    source: metamodel
    kind: constrains
    target: relationships
  "relationship:optimization\0consumes\0change":
    source: optimization
    kind: consumes
    target: change
  "relationship:optimizer\0responsible-for\0optimization":
    source: optimizer
    kind: responsible-for
    target: optimization
  "relationship:post-propose-validation\0invokes\0deterministic-operations":
    source: post-propose-validation
    kind: invokes
    target: deterministic-operations
  "relationship:project-build-role\0responsible-for\0semantic-model-build":
    source: project-build-role
    kind: responsible-for
    target: semantic-model-build
  "relationship:propose\0consumes\0confirmed-design-record":
    source: propose
    kind: consumes
    target: confirmed-design-record
  "relationship:propose\0invokes\0deterministic-operations":
    source: propose
    kind: invokes
    target: deterministic-operations
  "relationship:propose\0precedes\0apply":
    source: propose
    kind: precedes
    target: apply
  "relationship:propose-role\0responsible-for\0propose":
    source: propose-role
    kind: responsible-for
    target: propose
  "relationship:quality\0validates\0change-implementation":
    source: quality
    kind: validates
    target: change-implementation
  "relationship:review\0consumes\0change":
    source: review
    kind: consumes
    target: change
  "relationship:review\0precedes\0optimization":
    source: review
    kind: precedes
    target: optimization
  "relationship:review\0validates\0change-implementation":
    source: review
    kind: validates
    target: change-implementation
  "relationship:reviewer\0responsible-for\0review":
    source: reviewer
    kind: responsible-for
    target: review
  "relationship:semantic-delta\0constrains\0apply":
    source: semantic-delta
    kind: constrains
    target: apply
  "relationship:semantic-model-build\0consumes\0confirmed-design-record":
    source: semantic-model-build
    kind: consumes
    target: confirmed-design-record
  "relationship:semantic-model-build\0invokes\0design-record":
    source: semantic-model-build
    kind: invokes
    target: design-record
  "relationship:semantic-model-build\0produces\0semantic-model":
    source: semantic-model-build
    kind: produces
    target: semantic-model
  "relationship:snack\0invokes\0deterministic-operations":
    source: snack
    kind: invokes
    target: deterministic-operations
  "relationship:snack\0precedes\0quality":
    source: snack
    kind: precedes
    target: quality
  "relationship:snack-role\0responsible-for\0snack":
    source: snack-role
    kind: responsible-for
    target: snack
  "relationship:user\0constrains\0agent":
    source: user
    kind: constrains
    target: agent
  "relationship:web\0supports-presentation\0visual-presentation":
    source: web
    kind: supports-presentation
    target: visual-presentation
-->

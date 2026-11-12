---
entity: confirmed-design-record
semanticModelFingerprint: 53dfce97829e489bca19dbfd4e743010d56bc3f3eb42c98d32ae99e3b9218ebb
---
schemaVersion: 4
context: change
relatedIdentities:
  - explore
  - propose
  - propose-workflow
  - framework-identity
entries:
  - identity: formation-model-discussion-boundary
    nature: normative
    decision: accepted
    content: |
      用户认可的阶段分工方向：Explore 提前解决会影响目标、范围与方案成立的重要语义问题，不必预先完成每一组目标层级；Propose 承担具体模型组织与审阅，可以继续与用户讨论 Semantic Model。局部模型讨论不自动要求返回 Explore；需要实验求证、重选方向或大幅重做设计时返回 Explore。
      Agent 负责依据设计与建模规则判断结构合理性，用户确认不能替代结构质量判断。所有结构变化应进入用户审阅，说明受影响的结构、调整理由及职责与关系的变化；涉及实质语义选择或修改既有确认的变化应提前确认，已有意图与建模规则足以支持的局部细化可先形成具体草稿，再结合相关 Contract 审阅，不因新增或重组层级一律暂停。
      用户对以上推荐方向原话：这个方向感觉是ok的。
      本条确认职责与确认门槛的方向，不表示已逐项确认具体提示词替换或所有结构操作的判定细则。
  - identity: structure-evolution-throughout-development
    nature: normative
    decision: accepted
    content: |
      结构变化适用于项目持续开发与演进，不仅适用于新功能增加 Element。讨论和处理范围须覆盖内容增长导致原先单个 Element 需要父子 Elements 表达，以及内容移除、精简导致结构收缩等情形，不把结构变化等同于新增功能或新增 Element。
      保留用户原样例与范围说明：随着不断开发，本来一个element就可以讲清楚的内容，现在可能需要父子element了。 也可能重构之后吧，可能某些内容就删除了，内容更为精简。等等情况都可能会出现的。    不仅仅是一个新的功能的时候会有新增element。
      上述例子不是封闭的操作清单，也不预先确认任一具体项目 Element 的拆分、合并、移除或 identity 变化。
  - identity: section-evolution-and-semantic-preservation
    nature: normative
    decision: accepted
    content: |
      本次持续演进的讨论和规则范围包含 Element Contract 内部的 Section 变化，不仅包含 Element 层级和 Relationships。重构后可能出现 Element 消失、Section 消失等情形；这些对象或结构的消失本身不能证明其原有职责、保证或行为已经取消。
      对此须区分语义仍然保留但重新组织、真正移除语义，以及只有实现组织改变而模型承诺仍然成立的情况。已有语义重新组织后应检查其是否仍被完整承载；不能仅依据代码重构或 Element、Section 的删除操作推断业务承诺被移除。真正取消承诺仍按涉及实质语义选择与既有确认的规则处理。
      用户原话：需要注意到， section的变化也是相关的。 然后不能 增加子element不意味着父element承担的职责减少，只是细化到了子element中而已。    重构之后element可能消失、section可能消失等等， 你说的有道理的。
  - identity: child-refinement-preserves-parent-responsibility
    nature: normative
    decision: accepted
    content: |
      增加子 Element 不意味着父 Element 承担的职责减少；子 Element 进一步精化父级职责。父 Element 仍须在自身抽象层级完整表达其职责与规范承诺，不能因子级已经表达细节而把父级自身应有的语义删去或仅依赖子级补足。子级细节不要求逐项复制到父级。
      这一约束适用于持续开发中从单个 Element 演进为父子 Elements 的情况。只有另有获授权的职责或语义变更时才能相应改变父级承诺，新增子级本身不构成该授权。
      用户原话：增加子element不意味着父element承担的职责减少，只是细化到了子element中而已。
  - identity: affected-element-expression-appropriateness
    nature: normative
    decision: accepted
    content: |
      持续演进时的统一判断原则是检查参与变更的 Elements 的内容表达是否合适：结合目标职责边界、抽象层级以及父子关系，判断其 Declaration 与 Contract 中的内容应如何组织和表达。该检查适用于新增子 Element、拆分、合并、精简及重构等情况，不仅适用于新增功能。
      增加子 Element 时，父 Element 中适合由子级表达的细化内容可以移到子 Element，父级与子级的内容表达也可以相应改变。新增子级不自动减少父级职责，但这不要求父级原有 Section、原文、细节粒度或内容位置保持不变。完整性以父级 Contract 整体在自身抽象层级上的规范承诺为判断边界；父级仍须独立表达本层承诺，子级进一步精化，不机械复制全部细节，也不因内容移到子级而丢失父级自身应表达的语义。
      Section 可以随适当的内容重组而调整、拆分、合并或消失；判断语义是否保留以及表达位置和粒度是否适当，不以 Section 或原文是否原样保留代替判断。真正改变已确认承诺仍适用此前确认的决策权限规则。
      用户原话：section在增加子element的时候，我感觉是需要注意的点，这个时候父element中的一些内容就可以移动到子element中，并且可能内容表达上就需要有一些变更了。     不过重构的时候其实也需要注意。本质上就是需要注意参与变更的element的内容表达的合适性。
  - identity: joint-target-expression-review
    nature: normative
    decision: accepted
    content: |
      用户进一步确认参与变更的 Element 内容表达合适性的判断与 Propose 职责：依据已确认意图判断职责与承诺是否被擅自改变，依据目标模型的职责边界和抽象层级判断内容的位置、粒度及表达是否合适。内容可以移动、改写，原有 Section 可以不再保留，但应保留的语义必须在适当的抽象层级得到表达。
      Propose 形成目标模型时联合审视受影响 Elements 的 Declaration、Contract 和关系。新增子级时检查父级是否需要重新表达；合并或移除时检查承接内容的 Element 是否仍然连贯且边界清楚。检查范围不局限于新增或删除的节点，不因此要求改写不受影响的内容。
      用户对上一轮上述解释明确回复：对的，你现在说的是正确的。
      用户同时询问增加子 Element、重构删除 Element、调整表达以外还可能有哪些场景；待列举的场景尚未逐项确认，不把它们视为封闭操作清单或已经采纳的具体模型调整。
  - identity: coherent-complete-appropriate-nonredundant-expression
    nature: normative
    decision: accepted
    content: |
      用户确认统一原则，并补充避免重复表达：当模型发生变化时，检查受影响 Elements 的概念边界、职责承诺、层级关系与内容组织是否仍然相互一致，并在各自抽象层级上表达完整、合适的语义，同时避免重复表达。
      用户原话：当模型发生变化时，检查受影响 Elements 的概念边界、职责承诺、层级关系与内容组织是否仍然相互一致，并在各自抽象层级上表达完整、合适的语义。  正确的，同时再加上一个避免重复表达。           继续。
      此补充与先前确认的父子精化和本层完整性要求联合适用：避免重复表达不撤销父级在自身抽象层级上的完整职责与承诺；子级进一步精化，父级不需要机械复制子级细节。具体提示词措辞仍待逐处讨论。
  - identity: prompt-propose-structure-confirmation-candidate
    nature: informative
    decision: accepted
    content: |
      用户已确认的首处精确提示词修改，尚未修改源码。位置：src/core/templates/workflows/propose.ts，Flow 第5步的结构确认条目。只替换该条目前两句，后面的指导缺失或不足时停止、不得从实现布局推断结构的句子保留。
      oldText:
      Do not redo confirmed structural decisions. A partial record leaves room for unconfirmed structure: when source impact requires a new or reorganized hierarchy, apply the Structural Decomposition Guidance to the unresolved scope and obtain user confirmation before authoring target sibling sets.
      newText:
      Preserve confirmed structural decisions. When forming or reorganizing a hierarchy, apply the configured Structural Decomposition Guidance. Resolve local model organization from confirmed intent and modeling rules; use Decision gap for substantive choices or changes to confirmed decisions. Present structural changes, their rationale and semantic impact during draft review.
      目的：取消按新增或重组层级一律预先确认的要求，复用既有 Decision gap 处理实质选择及已确认决策的修订，并明确结构变化须在草稿审阅中呈现理由与语义影响。本处只处理结构决策和审阅，不代替受影响 Elements 内容表达的统一检查；该统一原则与避免重复表达要求已确认，具体落点与措辞待后续逐处讨论。
      用户对本候选明确回复：看起来是ok的。   比之前好很多。
  - identity: prompt-semantic-authoring-evolution-candidate
    nature: informative
    decision: accepted
    content: |
      用户已确认的第二处精确提示词修改，尚未修改源码。在共享 .xirang/references/xirang-semantic-authoring.md 内容的开头、Element Definition Semantics 之前新增以下两句。该 reference 由 src/core/templates/workflows/common.ts 的 references/semantic-authoring.md 条目拼装；现有 Definition 与 Contract 指导均保留，不在 Explore 和 Propose 各复制一份。
      newText:
      When the model changes, review affected Elements' Declarations and Contracts in the target model context. Revise them as needed to maintain semantic consistency and express complete, appropriate semantics at each abstraction level without redundant repetition.
      依据：用 Declaration 与 Contract 指向完整 Element 内容，以 target model context 包含适用的层级、Relationships 与 Metamodel 约束，避免把不同层次的检查维度列成可能遗漏的封闭清单。Declaration 仍承担概念边界，Contract 包括 Sections 与验收内容。按需修订不要求改写不受影响的文本。
      现有共享 Contract 指导已规定父级独立表达本层完整承诺、子级进一步精化、同层规则集中表达且不为去重遗漏父级语义，本处复用这些细则。
      用户对本版精确措辞明确回复：这样可以的。
  - identity: remaining-confirmation-guidance-alignment
    nature: informative
    decision: accepted
    content: |-
      用户在规则唯一承载、步骤只保留动作的优化方案后要求 go on，已据此完成可整体审阅的内存稿，并保存到 integrated-prompt-draft-propose、integrated-prompt-draft-shared-and-methods、integrated-prompt-draft-explore。旧的逐处替换记录作为确认来源保留，不叠加到最终稿；当前变化及删除/迁移依据均已披露。
      当前剩余是用户对整合稿的整体审阅；此前两类验证已确认，但尚未执行。静态比较和检查见 integrated-prompt-draft-static-review。没有进入 Propose、没有修改源码、生成面或正式模型。接到整体审阅反馈后才完成最终 Design Summary 与交接门禁。
      本轮状态：用户在整合稿整体审阅后回复“可以的。继续吧。”，接受整合方案及其已披露的边界。此前逐处候选以 integrated-prompt-draft-* 中的最终整合稿为准，不叠加；历史观察不因接受而变成行为验证通过。
  - identity: prompt-authoring-use-semantic-objects
    nature: normative
    decision: accepted
    content: |
      用户澄清：第二处候选中的 reorganize their content and Sections 实际上指向 Contracts，应使用已有语义对象表达，避免赘述。用户指出 concept boundaries、responsibilities、hierarchy、Relationships、content organization 的枚举显得冗长，并询问是否仍有遗漏；不能把这组枚举当作穷尽的检查清单。
      用户原话：reorganize their content and sectinos 这里实际上就是contracts。         "together for consistent concept boundaries, responsibilities, hierarchy, Relationships and content organization." 我知道这里是列举清楚，避免后面遗漏， 但是感觉有点可汗大点兵了；另外的话是否有遗漏呢 ？
      本条只确认用户对表达对象与冗长枚举的纠正，替代英文候选尚待用户审阅。
  - identity: prompt-decomposition-confirmation-routing-candidate
    nature: informative
    decision: accepted
    content: |
      用户已确认的第三处精确提示词修改，尚未修改源码。位置：src/core/templates/fragments/xirang-fragments.ts 的 STRUCTURAL_DECOMPOSITION_GUIDANCE 最后一条，对应共享 .xirang/references/xirang-decomposition-use.md。
      oldText:
      - Keep every same sibling set on one dimension, make it MECE for the confirmed scope, and confirm breadth-first. Do not mix responsibility, lifecycle, deployment, or implementation dimensions within one sibling set.
      newText:
      - Keep every same sibling set on one dimension, make it MECE for the confirmed scope, and work breadth-first: form and check each complete sibling set before refining its children. Follow the current workflow's rules for user confirmation. Do not mix responsibility, lifecycle, deployment, or implementation dimensions within one sibling set.
      保留框架单维度、MECE 与 BF 约束，明确 BF 的形成及检查顺序，并将用户确认交给当前工作流规则；不把结构检查写成每层必须等待用户。
      用户明确回复：可以的。 然后顺便把刚才 user decompostion 的说明保存一下，看看这个对应的内容应该在哪里修改。    可能需要有一个reference 表明用户自定义 decompostion的创建指导？
      此前删除整条框架规则的候选已撤回。默认 SEMANTIC_REFINEMENT_REFERENCE 与项目配置方法中的逐层确认文字仍需按已确认分界对齐，各阶段现有审阅与提升授权边界保持。
  - identity: configured-decomposition-project-variation
    nature: normative
    decision: accepted
    content: |
      用户指出 decomposition 是项目可配置的具体分解指导，不同项目会有差异；讨论公共指导时须尊重该配置边界，不能把本项目具体方法直接视作所有项目的方法。
      用户原话：感觉有点怪怪的。  这里实际上设计到了分解方法。 但是在config.yaml中有decomposition: .pi/skills/xirang-project-decomposition/SKILL.md 这个配置。 不同具体的项目会有差异的。
      当前证据：xirang config project --select decomposition --json 返回 .pi/skills/xirang-project-decomposition/SKILL.md；src/core/project-config.ts 的配置解析在 decomposition 未定义时才采用 xirang-semantic-refinement.md 默认值，显式配置使用其声明的值，resolveDecompositionPath 保留包含斜杠的项目相对路径。具体公共入口修订以及方法与工作流确认权限的细则仍待讨论。
  - identity: decomposition-framework-foundation
    nature: normative
    decision: accepted
    content: |
      用户澄清 decomposition 自定义的权限边界：项目选择的分解方法须在框架下完成，不提供完全不受约束的分解自由；MECE 与 BF（本次上下文中的广度优先）是框架基础。项目之间允许具体分解方法存在差异，但不能据此把这些框架基础仅视为默认方法或本项目特例。
      用户原话："明确要求“确认完整 sibling set，再进入下一层”。"     感觉好冲突这里。 其实按照前面的说法， 子element是父element的细化表达， 这里实际上就包含了一些细化规则。  那么，我本来其实是想要给用户足够的自定义权限， 目前来看的话，不需要完全的权限， 用户所自定义的拆解方法，实际上需要在我的框架下完成。 而我的框架的基础就是这里的 MECE  BF。
      本条澄清此前已确认的项目可配置分解方法：自定义在框架基础约束内生效；此前用户并未确认任意替换这些框架基础。子 Element 精化父级、父级保留本层完整承诺的既有确认继续适用。用户本轮未逐项确认其余可配置维度及新的具体英文措辞。
  - identity: decomposition-method-and-confirmation-boundary
    nature: normative
    decision: accepted
    content: |
      用户确认框架基础、项目具体分解方法与工作流确认职责的边界：自定义分解指导在框架规定的父子语义精化、同层 MECE 与广度优先约束下决定具体分解方式；广度优先要求先形成并检查完整同层结构，再向下细化，用户确认遵循当前工作流的决策规则。
      项目可以结合自身情况选择分解维度、识别值得独立建模的概念及细化程度，这些选择须满足框架纪律。BF 不自动要求每层都等待用户；需要用户裁决的实质选择仍须先确认，不能把未决选择写成确定结构并继续依赖它推进。
      用户对上一轮上述分界明确回复：我刚才这个 基于我的框架下微调，你是觉得ok的？       符合我的意思的。
      用户同时要求 Agent 独立评估该定制方向是否合理；本条确认职责边界，不把用户确认当作提示词效果或所有项目适用性的验证证据。具体提示词修订仍按后续精确候选对齐。
  - identity: custom-decomposition-guidance-request
    nature: normative
    decision: accepted
    content: |
      用户要求保存自定义 decomposition 的说明，并检查对应内容应在哪里修改。已确认的边界是：项目方法在框架规定的父子语义精化、同层 MECE 与 BF 下工作，可以结合领域决定分解维度、概念边界与细化程度。MECE 限定于所选维度和已确认范围，不取消父子必要语义覆盖或 Elements 间的协作；BF 规定先形成并检查完整同层结构再细化，不自动要求逐层等待用户，不禁止根据后续发现回修上层。用户确认遵循工作流决策规则。
      用户原话：可以的。 然后顺便把刚才 user decompostion 的说明保存一下，看看这个对应的内容应该在哪里修改。    可能需要有一个reference 表明用户自定义 decompostion的创建指导？
      用户要求检查与记录不代表已授权实现源码或正式模型修改。是否新增独立创建指导 reference 仍是待评估方案。
  - identity: custom-decomposition-authoring-reference-question
    nature: informative
    decision: accepted
    content: |
      自定义方法创建指导的独立按需角色、生成路径及正文已经用户确认，具体全文由 prompt-custom-decomposition-authoring-candidate 承载。新增 .xirang/references/xirang-decomposition-authoring.md，专门指导创建或修订项目自定义 decomposition；文件尚未创建。
      已确认的整体分工：阶段一句话加载配置选中的方法；框架基础由现有 xirang-semantic-authoring.md 承载；默认具体方法与自定义创建指导分别按需读取。独立 decomposition-use reference 将取消，创建指导引用共享语义写作指导。
      创建指导说明自定义方法应遵循框架约束、解释项目分解与细化判断、按需用项目例子澄清方法、使用项目维护的独立文件保存并通过现有 decomposition 配置接入。common 提供创建或修改方法时的按需入口，普通结构形成不额外读取本指导。
      实现建议落点为 src/core/templates/fragments/ 的指导源文本及 src/core/templates/workflows/common.ts 的 referenceFiles 和按需入口；配置解析及 reference 交付路径可复用，无需新增配置字段、方法名单或 CLI 命令。具体源码文件组织由后续实施决定。
      模型候选落点为 skill-generation 的共享指导交付与 workflow-templates 的按需加载职责；不因增加 reference 自动增加 Element，Propose 时按目标语义联合复核。
      默认方法和本项目方法中的逐层确认文字仍需对齐已确认边界。未运行行为测试或修改正式源码/模型。
  - identity: decomposition-reference-responsibility-revision
    nature: normative
    decision: accepted
    content: |
      用户确认取消独立的 xirang-decomposition-use.md：方法加载直接写入各阶段现有共享短入口，框架基础（父子精化、同层 MECE、BF 与工作流确认边界）并入已有 xirang-semantic-authoring.md。默认分解方法继续独立；自定义方法创建指导作为创建或修订方法时按需读取的专门指导，具体内容待后续对齐。
      已确认的加载入口精确文本：
      Before forming or reorganizing a hierarchy, read and follow the complete guidance resolved by `xirang config project --select decomposition --json`; stop if it is unavailable.
      src/core/templates/fragments/guidance-loading.ts 的 DECOMPOSITION_ENTRY 承载短入口，现有各阶段复用同一源。此前已确认的第三处 MECE/BF 条目保留其具体措辞，改由共享语义写作指导承载；并保留模型语义、用户意图及工作流权限边界。
      用户对上述方案明确回复：可以的。
      本条确认承载位置和加载路线调整，不表示已实施源码或生成面修改。后续须同步 common 的按需入口及 referenceFiles，清理由本次调整产生的旧 reference 引用；依据用户后续明确确认，不新增 CLI update 自动删除既有旧 reference 的行为，旧文件由用户与 Agent 按需处理。
  - identity: prompt-custom-decomposition-authoring-candidate
    nature: informative
    decision: accepted
    content: |
      用户已确认的自定义方法创建指导正文，尚未创建正式 reference。生成路径：.xirang/references/xirang-decomposition-authoring.md。
      完整正文：
      # Custom Decomposition Guidance

      Before creating or revising project decomposition guidance, read `.xirang/references/xirang-semantic-authoring.md` and follow its framework constraints.

      Describe how the project selects decomposition dimensions, identifies meaningful Element boundaries, and decides when further refinement is useful. Use project examples where they clarify the method. Inherit the framework's semantic rules and the current workflow's decision and authorization rules.

      Store the guidance in a project-maintained Markdown file and select it through `decomposition`: use a project-root relative path, or a bare name resolved under `.xirang/references/` (`.md` is appended when absent). Use a separate file rather than editing the framework-generated default guidance.

      在 xirang-common 的按需指导表中增加创建或修改项目分解方法的读取入口；日常使用方法时不加载创建指导。正文引用框架基础，说明项目方法需要表达的内容及配置接入方式，不强制固定模板或新增工作流。
      用户对该全文、路径及按需入口明确回复：看样子是ok的。
  - identity: prompt-default-refinement-confirmation-candidate
    nature: informative
    decision: accepted
    content: |
      用户已确认的默认分解方法局部修改，尚未修改源码。位置：src/core/templates/fragments/xirang-fragments.ts 的 SEMANTIC_REFINEMENT_REFERENCE，Layer-by-layer formation 第5步第一句，对应生成 .xirang/references/xirang-semantic-refinement.md。
      oldText:
      Work breadth-first: present all siblings of the current layer with their dimension, boundaries, and coverage, and descend only after the user confirms.
      newText:
      Follow the framework's breadth-first discipline and the current workflow's user-confirmation rules.
      第5步后半部分原样保留：
      C4's fixed technical levels and any fixed number of levels are not required; refine to the point where the model can be understood and decided on.
      依据：复用已确认的共享 BF 形成及检查纪律与工作流确认分界，移除默认方法逐层等待用户的要求，不在默认方法重复框架规则全文。
      用户明确回复：yes。
      方法里的其他决策与停止条款及本项目配置方法仍须检查，不声称本处足以完成全部联动。
  - identity: prompt-project-decomposition-bfs-candidate
    nature: informative
    decision: accepted
    content: |
      用户已确认的本项目自定义分解方法局部修改，尚未修改文件。位置：.pi/skills/xirang-project-decomposition/SKILL.md，分解纪律第4条。
      oldText:
      4. **BFS**：按 BFS 顺序确认完整 sibling set，再进入下一层。
      newText:
      4. **BFS**：遵循框架的广度优先纪律，用户确认遵循当前 workflow 的决策规则。
      依据：与用户已确认的默认方法替换保持一致，复用共享框架对 BF 的形成及检查要求，避免本项目方法另加逐层等待用户的门槛。项目特有的 Perspective 维度保持。
      用户明确回复：可以的。
      第7条以无法唯一确定 identity、parent 或 sibling set 触发用户裁决的要求仍待检查，本次未确认该条替换。
  - identity: prompt-project-decomposition-decision-gate-candidate
    nature: informative
    decision: accepted
    content: |
      用户已确认的本项目自定义分解方法第7条修改，尚未修改文件。位置：.pi/skills/xirang-project-decomposition/SKILL.md，分解纪律第7条。
      oldText:
      7. 当既有 Formal Semantic Model、用户意图与本方法冲突，或证据不足以唯一确定 identity、parent 或 sibling set 时，停止相关结构形成并请求用户裁决。
      newText:
      7. 当本方法与用户意图、Semantic Model 或框架约束冲突，或结构形成涉及未决的实质选择时，按当前 workflow 的决策规则处理。
      依据：取消以无法唯一确定结构直接触发暂停的过强条件，复用已确认的局部组织与实质选择边界。Agent 仍须依据用户意图、现有模型和框架规则判断，不得猜测缺失的实质决策或修改已确认决定；冲突按工作流处理，不由本方法另设无条件用户裁决流程。
      用户明确回复：可以的。
  - identity: prompt-default-refinement-decision-routing-candidate
    nature: informative
    decision: accepted
    content: |
      用户已确认默认分解方法决策规则的合并调整，尚未修改源码。位置：src/core/templates/fragments/xirang-fragments.ts 的 SEMANTIC_REFINEMENT_REFERENCE，对应生成 xirang-semantic-refinement.md。
      在 Stop and hand off 首段，仅将第一句替换为以下 newText，后面的禁止从实现目录推导结构和方法确认不授予写入权限两句保留：
      oldText:
      Stop writing the affected structure and ask the user when guidance is insufficient, concept identities overlap, the dimension is unclear, or authorities conflict.
      newText:
      Handle insufficient guidance, semantic ambiguities, and authority conflicts under the current workflow's decision rules.
      同时将同一方法前面两处重复的用户提问要求移除，统一由上述规则承载：
      1. Inputs and boundaries 中，将 This guidance cannot override formal semantics, confirmed design, Element Contracts, Relationships, or the current workflow's permissions; ask the user to rule when they conflict. 改为 This guidance cannot override formal semantics, confirmed design, Element Contracts, Relationships, or the current workflow's permissions.
      2. Layer-by-layer formation 第1步仅删除末句 Ask one question at a time for each unresolved semantic choice.，保留概念识别与边界表达的全部要求。
      依据：默认方法继续指出指导不足、语义歧义与权威冲突需要处理，具体取证、自主修正、询问和暂停由当前 workflow 既有规则决定；不以方法局部规则要求所有疑点立即交给用户。不得将待用户裁决的实质选择自行写成确定结构，既有工作流和用户确认权限保持。此处与此前已确认的第5步 BF 规则替换共同生效。
      用户明确回复：可以的，类似的修改使用这个方法。
  - identity: analogous-guidance-consolidation-authorization
    nature: normative
    decision: accepted
    content: |
      用户确认当前默认方法的决策规则合并方案，并授权同类条款沿用该处理方法：分解方法中的重复提问、暂停要求统一引用当前工作流的决策规则；保留语义与权限约束，不为每处等价对齐重新请求确认。用户原话：可以的，类似的修改使用这个方法。
      此授权适用于已确认设计范围内的同类规则收敛和具体措辞对齐，不构成新增实质设计决定、改变既有用户承诺、自动进入 Propose 或实施源码的授权。涉及新范围或实质权衡时仍须提出。
  - identity: analogous-guidance-alignment-details
    nature: informative
    decision: accepted
    content: |-
      依据 analogous-guidance-consolidation-authorization，在已确认分工及表达原则内完成的同类措辞收敛。以下为 Agent 在授权范围内拟定的精确实现文字，不冒称用户逐句确认；尚未修改源码。供用户整体审阅，并由后续 Propose/Apply 复用。

      A. src/core/templates/workflows/explore.ts，Load and navigate 的 Declaration/Definition 段：
      oldText:
      Assess Declaration/Definition impact only when concept identity or scope changes, and carry the complete confirmed target Definition into the Summary. Invoke configured decomposition guidance only for new Elements, reparenting or sibling reorganization; Contract-only work does not require hierarchy design. Guidance does not expand Explore's write permissions.
      newText:
      Assess Declaration/Definition impact when concept identity or scope changes. Resolve choices affecting the goal, scope or approach; carry confirmed boundaries and Definitions into the Summary. Propose may complete local model organization and target Definitions from that basis. Apply configured decomposition guidance when forming or reorganizing a hierarchy; Contract-only work does not require hierarchy design. Guidance does not expand Explore's write permissions.
      依据：Explore 提前处理影响方向的概念决策，保留已确认的边界和 Definitions；不为交接预先完成全部局部建模。形成/重组 hierarchy 的触发覆盖增长、精简等演进，避免只列新增 Elements。

      B. 同文件 EXPLORE_SUPPERPOWERS_STYLE_REFERENCE 的 Summary gate 第一条首句：
      oldText:
      Resolve contradictions, vague boundaries, and target-affecting pending choices.
      newText:
      Resolve contradictions and target-affecting choices requiring user judgment. Local model organization that Propose can resolve from confirmed intent and modeling rules is not a decision gap.
      后面的范围延后须用户同意、表达/推导错误由 Agent 修正等要求保持。记录协议对真正 pending 及已确认内容修订的权限不变，不把 pending 自动变成 accepted。

      C. src/core/templates/workflows/propose.ts，Readiness boundary 的前两句：
      oldText:
      Before creating or updating Change artifacts, check whether any unresolved decision affects this target. If one remains, complete the necessary read-only discovery and permitted record maintenance, then present the decision and stop.
      newText:
      Before creating or updating Change artifacts, use Documentation and gap handling to resolve any decision gap affecting this target. If user judgment is required, complete the necessary read-only discovery and permitted record maintenance, then present the decision and stop.
      后面的实际 blocker 下不先写已定部分、override 不授予猜测权限等要求保持。通过已有 Documentation and gap handling 区分自主组织与待裁决选择，不因局部模型组织一律暂停。

      D. 同文件 Flow7 的 Definition/层级未决句：
      oldText:
      If an Element's concept identity, independent modeling reason, scope, or hierarchy boundary remains unresolved, stop and ask one focused question instead of guessing the Definition.
      newText:
      Resolve Definition and structural questions through Documentation and gap handling before settling dependent content.
      复用同一决策规则，保留后面的自主细节范围与实质新增先讨论约束。

      E. 同文件 Flow8 的结构范围回查条目：
      oldText（显示内容；源码中的反引号有模板字符串转义）:
      If a user-confirmed decision recorded in Design changes structural impact across Declarations, refinement, Relationships, Kinds, or Views, update only proposal `Architecture Source` to declare final structural scope, then reconcile the affected Delta and Plan. Writing a choice in Design does not itself confirm it.
      newText:
      If confirmed decisions or permitted local model organization change structural impact, update proposal source scope and reconcile the affected Delta and Plan. Writing a choice in Design does not itself confirm it.
      依据：允许的局部模型组织也可能改变结构与相关 Contract 内容归属，须同步完整受影响范围；不将 Agent 推导误标成用户确认。

      F. src/core/templates/fragments/xirang-fragments.ts，ELEMENT_CONTRACT_SEMANTICS 的沿用措辞条目首句：
      oldText:
      Reuse accurate existing wording and change only affected behavior.
      newText:
      Reuse accurate existing wording where it remains appropriate in the target model; revise only affected content.
      依据：语义保持的迁移、重组与层级粒度调整也属于已授权的内容变更，不能仅在行为改变时才允许调整。后面的不润色无关段落、不为正式化重包装、完整保留条件数值例外时序及具体例子等要求保持。

      G. 同文件 SEMANTIC_REFINEMENT_REFERENCE 的交接首句：
      oldText:
      Hand the confirmed identities, Kinds, complete Definitions, hierarchy, Contract detail, and Relationships back to the current workflow.
      newText:
      Return the resulting model design and any unresolved decisions to the current workflow.
      依据：分解方法交付结构设计与实际决策缺口，确认状态由工作流管理，不要求所有字段在方法层逐项确认为前置。

      H. 新共享语义写作指导的框架分解边界句：
      Project decomposition guidance specializes refinement within these framework constraints; it does not override confirmed intent, model semantics, or the current workflow's decision and authorization rules.
      与已确认的 BF/MECE 条目共同承载 framework 内定制的边界。共享指导保留现有父子精化、本层完整性与去重细则；Contract-only 变更仍不要求加载具体分解方法。

      I. common 的按需表：Form or reorganize a hierarchy 指向 normalized decomposition 选中的指导，不再指向旧 decomposition-use；新增 Create or revise project decomposition guidance 指向 .xirang/references/xirang-decomposition-authoring.md。referenceFiles 去掉 decomposition-use、新增 decomposition-authoring，semantic-authoring 交付统一检查原则、既有语义指导与框架基础。复用共同生成源，不在各阶段复制完整正文。

      本条是同类修改的具体收敛记录；未进行源码修改或行为验证。整体审阅时可继续调整，不因没有逐句确认而重新开启已授权的同类设计问题。

      本轮状态：用户在整合稿整体审阅后回复“可以的。继续吧。”，接受整合方案及其已披露的边界。此前逐处候选以 integrated-prompt-draft-* 中的最终整合稿为准，不叠加；历史观察不因接受而变成行为验证通过。
  - identity: formation-evolution-verification-plan
    nature: informative
    decision: accepted
    content: |
      用户已确认两类验证：生成与回归检查，以及实际 Agent 行为检查。用户原话：稍等， 有另外一个问题，  我说按照同一个方法处理， 你也处理了很多个地方。 那么问题在于，重复的提示词重复出现了很多次，这也太浪费token、同时效率也不高。  我觉得需要优化。           两个验证可以的。
      生成与回归：复用现有模板和 shared reference 安装/同步测试，检查阶段短入口读取配置所选完整方法、创建指导仅在创建/修改方法时按需发现、共享语义指导交付框架基础、旧 decomposition-use 不再被生成或引用且不新增自动删除旧文件的逻辑；项目自定义方法文件和显式 decomposition 值保留。按实际行为和引用可达性调整测试，不新增锁定整段自然语言原文的断言。
      已定位测试：test/core/templates/propose-template.test.ts 的 decomposition 测试、test/core/templates/build.test.ts 的配置指导测试、test/core/templates/semantic-model-consistency.test.ts、test/core/templates/sync-engine.test.ts 的受管引用与用户文件保留、test/core/workflow-installation.test.ts 的共享 reference 交付。实施时按新职责处理绑定旧普通措辞的断言。
      一次性检查包括构建/类型检查、源模板与受管生成面一致性、失效路径和机械逐层确认残留。这些结果只证明生成和代码层面，不证明模型行为改善。
      实际 Agent 行为验证覆盖：1. 已确认意图足以支持局部层级组织时，形成草稿并披露结构变化，不机械逐层暂停；2. 涉及职责取消、已确认边界修改或实质权衡时先询问，不自行定案；3. 增加子 Element 时迁移适当细节、调整父级表达，父级本层承诺完整且避免机械复制；4. 合并/移除 Element 或 Section 时检查语义承接，避免把对象消失误当承诺取消；5. 自定义方法在框架 MECE/BF 内生效，BF 不变成逐层审批，Contract-only 工作不额外加载方法或创建指南。
      按可观察决策、内容结果和实际加载轨迹判断，不以提示词含某句话或 Agent 自称已检查作为通过证据。具体样本、模型和次数在实施时安排；声称相比旧版有行为收益时须使用可比执行并保留失败结果，不能以单次成功宣称稳定改善。尚未执行新测试或 Agent 行为实验。
  - identity: formation-evolution-impact-and-self-review
    nature: informative
    decision: accepted
    content: |-
      当前影响判断及自查结果，供整体审阅；尚未写正式 Change、模型或源码。
      mustChange（已确认内容要求的规范/提示词落点）：Explore 的结构设计与 Summary 边界；Propose 的局部模型组织、Decision gap、就绪和结构审阅条款；authoring-conventions 的目标模型表达合适性及语义保持重组；skill-generation/workflow-templates 的框架分解约束、共享入口/创建指南交付与按需读取。正式 Delta 应联合当前完整模型表达这些目标，不按文件数新增 Elements。
      mustVerify：默认与本项目分解方法无残留机械确认；Build、Snack 共享入口仍遵循各自授权和最终审阅规则；旧 reference 清理及项目方法/配置保留；父子 Contracts 完整性与同层去重；Declaration、Section 及 Relationship identity 规则保持。
      当前 hierarchical-elements Contract 已规定父子精化和联合 Declaration/Contract，读取后未发现必须重定义该概念身份或改变现有层级的依据；MECE/BF 是 Agent 形成模型的纪律，不新增 CLI 自然语言语义判定器。项目配置加载路径和缺省值机制不需改变。
      已检查的边界序列：有依据的局部组织→自主形成→检查目标模型表达→草稿审阅；深入发现上层缺陷→回修受影响表达→重查相关内容，若触及已确认承诺则先裁决；父细节移到子级→父 Contract 仍独立表达本层保证；删除节点/Section→追踪语义承接，真正撤销承诺需授权；指引不可读→停止相关结构形成，不切换方法；创建指导仅在创建/修改方法时读取。
      当前记录相关模型 drift 为 fresh。已有测试与实现证据支持可沿现有 reference 交付路径实现；尚未证明模型实际行为改善。verification-plan 是待整体确认的验证方案。

      本轮状态：用户在整合稿整体审阅后回复“可以的。继续吧。”，接受整合方案及其已披露的边界。此前逐处候选以 integrated-prompt-draft-* 中的最终整合稿为准，不叠加；历史观察不因接受而变成行为验证通过。
  - identity: eliminate-redundant-prompt-rules
    nature: normative
    decision: accepted
    content: |
      用户指出上一轮逐处套用同一方法仍使重复提示词在多处出现，浪费上下文并降低效率，要求优化。需要从规则承载及实际加载整体检查重复，不能仅将每处重复展开改成多处相同引用就认为已完成优化。
      用户原话：稍等， 有另外一个问题，  我说按照同一个方法处理， 你也处理了很多个地方。 那么问题在于，重复的提示词重复出现了很多次，这也太浪费token、同时效率也不高。  我觉得需要优化。
      当前范围为本轮 Explore/Propose、共享语义指导、配置加载及分解方法之间的重复决策、结构与表达规则。此前确认的职责、权限与语义目标继续保持；具体提示词组织和措辞允许按该优化目标重新提出整合方案，不把旧的逐处补丁叠加为最终结果，不自动扩展为重写所有工作流。
  - identity: prompt-rule-ownership-consolidation
    nature: informative
    decision: accepted
    content: |-
      按用户要求优化本次提示词重复的整合方案，供整体审阅。保留此前确认的语义行为，调整其承载位置与重复措辞；不把旧逐处候选逐条叠加。此方案涉及此前已确认具体句子的合并/删除，以下明确披露；原确认记录保留作为来源，新的整合稿尚未标为逐句确认。

      完整规则各有一个负责位置：
      1. 各工作流自身的决策段负责其自主处理、询问、暂停、返回阶段和授权规则。Propose 继续由 Documentation and gap handling 承载；不新建跨工作流统一决策 reference，不把 Build 的最终确认或其他阶段差异抹平。
      2. semantic-authoring 承载目标模型表达检查、父子本层完整性、同层去重、MECE 与 BF。分解方法只保留自身特有的分解选择；不重复通用语义纪律，也不在每条规则后面重复遵循 workflow。
      3. 阶段中的 DECOMPOSITION_ENTRY 负责唯一的实际配置查询/方法加载入口；common 按需表作为发现索引，不再展开同一协议。
      4. 项目方法和默认方法保留各自适用范围及一次简短的框架继承边界；具体规则回到其唯一负责位置。创建指南只提供创建内容与接入指引，不复述框架定义。
      5. 成文与最终审阅、CLI 验证等不同时间点的实际动作继续保留。规则重复不等于动作重复；只有目的、输入、动作均无区别的提醒才删除。面向独立 Agent 或独立入口的必要加载不因文件之间存在重复而删除。

      Propose 的具体整合：
      A. 在 Local detail and faithful writing 的自主处理句中纳入已确认的局部模型组织，集中写为：
      Independently resolve local model organization from confirmed intent and modeling rules, handle minor details within the agreed scope and approach, organize cases, and correct expression or derivation errors; preserve the user's clear wording when it remains appropriate in the target model.
      现有 Decision gap 的实质选择、一次一问、确认前等待，以及需要实验或大幅重做设计时返回 Explore 的规则保留为唯一完整定义。既有来源忠实性检查及补充分支/默认值等对照要求保留，不以精简为由删除。
      B. Readiness boundary 保留实际写入前检查/暂停和 override 权限边界，引用一次 Documentation and gap handling 判断是否存在须用户裁决的缺口；不再分别重述每个判断条件。
      C. Confirmed design inputs 段中 Local decisions and record revisions can stay in Propose; practical feasibility experiments or substantial redesign return to Explore. 与 Decision gap 完全重复，删除；记录加载触发及来源性质说明保留。
      D. Flow3 的 readiness 项保留当前设计依据、缺口判断与入口检查动作；删除其中重复展开的局部确认/返回 Explore 及 override 不授予猜测权限段落，因为定义已经在 Decision gap 与 Readiness boundary。这里的用户明确 override 规则本身不取消。
      E. Flow5 不再新增之前确认的完整结构确认替换段：结构对照和配置方法加载分别已有负责位置，局部组织权限在 A，实质选择在 Decision gap。结构审阅要求移到 Drafting and user review，集中增加：
      Include structural changes, their rationale and semantic impact in draft review.
      缺失方法停止仍由 DECOMPOSITION_ENTRY 定义，不能切换方法或从实现布局推断模型的约束在已有共享语义及证据边界中保留。方法内容不足而非文件不可读的处理依工作流决策规则，不另加一遍无条件暂停。
      F. Flow7 收成完成动作：
      Complete the applicable whole-draft or mechanism-group review once all `applyRequires` artifacts are done.
      删除该步重复的 Definition 决策、细节权限和实质新增先确认说明；这些规则已在统一成文决策段适用于整个阶段，不能重复换成新的引用句。
      G. Closing gate 中保留来源到目标、目标到来源以及机制序列的实际检查，纯重复的错误自主修正/实质选择询问说明可删除。最终报告保留当前就绪结论、依据和证据缺口，不重复完整决策规则。

      分解方法与共享指导的具体整合：
      H. 已确认的 MECE/BF 框架句和项目方法须服从框架的边界句由 semantic-authoring 唯一承载。默认方法中已确认的 BF 引用句不再新增，在其步骤中只保留具体细化停止标准；默认方法的专有分类/视角判断继续保留，通用身份、Contract 定义等已有共享依据的复述按实际加载链移除。
      I. 默认方法之前分散的提问/停止/确认引用统一删除；方法输入边界只保留一次继承框架与 workflow 权限的说明，不再在 BF、第一步、停止段和交接段分别引用。指导不足、语义歧义或权威冲突仍由工作流决策规则覆盖，不删除真正应阻塞的义务。
      J. 本项目方法保留特有的 semantic-objects/realization、两个 Realization Perspectives 及其边界。在已有适用边界处表达一次继承框架纪律与 workflow 决策规则，然后去掉重复的通用分解纪律条目，而非逐条改成遵循 workflow。原第4/7条的已确认语义保留，但其精确替换句被新的合并方案取代；不改变项目特有 Perspective 结构。
      K. 创建指南中删去重复的 Inherit the framework's semantic rules and the current workflow's decision and authorization rules.，因为第一段已经要求读取并遵循包含该边界的 semantic-authoring；其余已确认正文及配置接入方式保留。

      整合的预期机制是减少同一加载链中的重复规则和无新增信息的引用；尚未量化 token 或证明行为收益。源文件复用常量只是维护去重，最终加载文本去重才影响上下文开销。只移动相同全文而不减少实际加载量不算收益。此方案尚未落实到源码、生成文件或正式模型。

      本轮状态：用户在整合稿整体审阅后回复“可以的。继续吧。”，接受整合方案及其已披露的边界。此前逐处候选以 integrated-prompt-draft-* 中的最终整合稿为准，不叠加；历史观察不因接受而变成行为验证通过。
  - identity: prompt-consolidation-efficiency-verification
    nature: informative
    decision: accepted
    content: |-
      对已确认两类验证的效率观察建议，供整体审阅，不新增独立验证流程。生成检查比较原版与整合版在相同入口及配置下实际加载的 skill/reference 集合与文本量，区分源码复用和运行时重复；未使用实际 tokenizer 时只报告字符/字节，不声称节省具体 token。不能把所有未加载文件简单相加，也不能将新增工具读取成本忽略。
      实际 Agent 行为检查沿用已经确认的场景，在同模型/设置/任务与评价标准下比较原版和整合版，既重复同场景也覆盖不同场景。质量继续检查正确性、语义保留、用户确认边界和结果完整性；过程记录实际 prompt/输出 token（可取得时）、工具调用、无必要暂停、回退重做及耗时。减少上下文但漏掉关键确认或父级承诺属于回归，不采用。
      当前没有执行这些验证，不设未经测量的节省目标或宣称稳定改善。已读取 harness-optimization-methodology 用于设计这项对比，未授权另起不相关优化、修改该 skill 或自动委托实验。

      本轮状态：用户在整合稿整体审阅后回复“可以的。继续吧。”，接受整合方案及其已披露的边界。此前逐处候选以 integrated-prompt-draft-* 中的最终整合稿为准，不叠加；历史观察不因接受而变成行为验证通过。
  - identity: integrated-prompt-draft-propose
    nature: informative
    decision: accepted
    content: |-
      当前可整体审阅的 Propose 整合稿，尚未实施或逐句确认。以当前 src/core/templates/workflows/propose.ts instructions 为基线，以下替换按顺序应用于展示文本（源码反引号需按模板字符串转义）；其他内容保留。此前逐处补丁以本稿为当前整合候选，不叠加。

      修改 1
      oldText:
      Before creating or updating Change artifacts, check whether any unresolved decision affects this target. If one remains, complete the necessary read-only discovery and permitted record maintenance, then present the decision and stop.
      newText:
      Before creating or updating Change artifacts, apply Documentation and gap handling to identify decisions requiring user judgment. Complete the necessary read-only discovery and permitted record maintenance, then stop for any unresolved decision affecting this target.

      修改 2
      oldText:
       Local decisions and record revisions can stay in Propose; practical feasibility experiments or substantial redesign return to Explore.
      newText:
      [删除]

      修改 3
      oldText:
      Independently handle minor details within the agreed scope and approach, case organization, and expression or derivation errors; preserve the user's clear wording when it is already accurate.
      newText:
      Independently resolve local model organization from confirmed intent and modeling rules, handle minor details within the agreed scope and approach, organize cases, and correct expression or derivation errors; preserve the user's clear wording when it remains appropriate in the target model.

      修改 4
      oldText:
       Resolve any material decision before authoring content that depends on it.
      newText:
      [删除]

      修改 5
      oldText:
      Preserve artifact dependency order while using these review units.
      newText:
      Include structural changes, their rationale and semantic impact in draft review. Preserve artifact dependency order while using these review units.

      修改 6
      oldText:
         - If readiness is incomplete, list the concrete missing items and use Documentation and gap handling: confirm an isolated decision here or recommend `/xirang:explore` for substantial design work. Apply the Readiness boundary before any Change artifact write; CLI-managed record maintenance follows the shared confirmation rules.
         - If the user explicitly overrides the readiness recommendation, continue within that authorization, but the override does not authorize guessing source decisions. Ask one focused question at a time for every unresolved material behavior or architecture decision before authoring dependent content.
      newText:
         - If readiness is incomplete, report the concrete gaps and apply the Readiness boundary.

      修改 7
      oldText:
         - Do not redo confirmed structural decisions. A partial record leaves room for unconfirmed structure: when source impact requires a new or reorganized hierarchy, apply the Structural Decomposition Guidance to the unresolved scope and obtain user confirmation before authoring target sibling sets. If the configured guidance is unavailable or insufficient, stop Formation and ask one focused question; do not fall back to another method or infer structure from implementation layout.

      newText:
      [删除]

      修改 8
      oldText:
         - When Architecture Source is `None`, do not invoke decomposition guidance or invent hierarchy changes.

      newText:
      [删除]

      修改 9
      oldText:
      7. Continue until all `applyRequires` artifacts are done, applying Documentation and gap handling to newly discovered omissions. If an Element's concept identity, independent modeling reason, scope, or hierarchy boundary remains unresolved, stop and ask one focused question instead of guessing the Definition. Handle only minor details autonomously and discuss substantive additions before settling them. Complete the applicable whole-draft or mechanism-group review before the closing gate.
      newText:
      7. Complete the applicable whole-draft or mechanism-group review once all `applyRequires` artifacts are done.

      修改 10
      oldText:
      If a user-confirmed decision recorded in Design changes structural impact across Declarations, refinement, Relationships, Kinds, or Views, update only proposal `Architecture Source` to declare final structural scope, then reconcile the affected Delta and Plan. Writing a choice in Design does not itself confirm it.
      newText:
      If confirmed decisions or permitted local model organization change structural impact, update proposal source scope and reconcile the affected Delta and Plan. Writing a choice in Design does not itself confirm it.

      修改 11
      oldText:
       Correct source-determined writing errors yourself; when a substantive decision is needed, present all findings and request one user ruling at a time.
      newText:
      [删除]

      修改 12
      oldText:
       Repair expression or derivation errors without changing confirmed decisions; otherwise use Documentation and gap handling.
      newText:
      [删除]

      修改 13
      oldText:
      handle minor details within the agreed scope and approach, organize cases, and correct expression or derivation errors;
      newText:
      handle minor details within the agreed scope and approach, and correct expression or derivation errors;

      修改 14
      oldText:
       Disclose permitted minor additions with their basis and locations at completion.
      newText:
      [删除]

      整合后的决策与审阅完整片段：
      ## Documentation and gap handling

      - **Evidence and judgment**: Reuse confirmed decisions and still-applicable evidence. Before recommending an approach or treating it as ready, independently assess whether it is feasible and can achieve the intended outcome within the constraints. Obtain missing evidence and check its reliability and applicability; state your assessment and key reasons.
      - **Local detail and faithful writing**: organize confirmed mechanisms into prose, diagrams, Acceptance Cases, and task/verification arrangements. Independently resolve local model organization from confirmed intent and modeling rules, handle minor details within the agreed scope and approach, and correct expression or derivation errors; preserve the user's clear wording when it remains appropriate in the target model. Do not use "reasonable elaboration" or delegated discretion over minor details to add substantial design content on your own. Before presenting a draft and after a local revision, compare authored branch outcomes, defaults, error results, and restrictions with the confirmed source: check the triggering condition, action, affected operation or state, time boundary, and result. If the wording requires or forbids an outcome the source leaves open, identify that difference instead of treating it as a paraphrase. Remove unintended strengthening; use Decision gap when completing the target requires a substantive choice. A ruling limited to one local edit does not confirm other draft additions. Do not ask the user to fix an Agent writing error when the confirmed design already determines the answer.
      - **Decision gap**: when completion would change a confirmed commitment, expand scope, or settle a material business or architecture trade-off, explain the gap and alternatives, recommend with reasons, then ask one focused question and wait before writing the choice as settled. Discuss and confirm small content or approach adjustments within Propose and update the shared record under its permission rules; a design discussion or record revision alone does not require changing workflow. Return to Explore when feasibility needs experimental judgment, the direction must be reconsidered, or substantial design must be redone; resume Propose after that work. A direct-Propose request, a request not to ask questions, or a readiness override does not supply a missing decision; report the blocker instead of guessing.
      - **Propagation and disclosure**: after confirmation, record the decision through the shared protocol and reconcile the affected Delta and Plan together. Do not hide new observable behavior solely in design or tasks. Reconcile permitted minor observable details into the Contract and Plan and disclose their basis and locations, without labeling them as user confirmations; if retained for later discussion, they remain pending. Track additions in the conversation for the final report; do not create a supplement ledger or add authorship/confirmation status to normative Contract text. Completion disclosure does not replace prior confirmation for material decisions.

      ## Drafting and user review

      For a simple change, write the complete draft, then present its concrete differences and remaining questions together for user review. For a complex change, organize drafting and review around one mechanism or a group of related Elements; show the actual draft for that group, obtain confirmation, and continue. Do not mechanically ask for approval of each Element or treat the number of Elements as the review plan.

      Include structural changes, their rationale and semantic impact in draft review. Preserve artifact dependency order while using these review units. Discuss new ideas and questions as they arise; do not optimize for completing one invocation without interaction. After a local revision, recheck the affected mechanism and artifacts. Unresolved decisions affecting the target block completion; artifact completeness and CLI success do not establish semantic readiness.


      本轮状态：用户在整合稿整体审阅后回复“可以的。继续吧。”，接受整合方案及其已披露的边界。此前逐处候选以 integrated-prompt-draft-* 中的最终整合稿为准，不叠加；历史观察不因接受而变成行为验证通过。
  - identity: integrated-prompt-draft-shared-and-methods
    nature: informative
    decision: accepted
    content: |-
      当前可整体审阅的共享语义及分解方法整合稿，尚未实施或逐句确认。前面已确认的语义保留，具体文本组织由本稿替代旧的逐处补丁组合。

      1. semantic-authoring.md 完整目标正文：
      When the model changes, review affected Elements' Declarations and Contracts in the target model context. Revise them as needed to maintain semantic consistency and express complete, appropriate semantics at each abstraction level without redundant repetition.

      **Element Definition Semantics**

      - A Definition SHALL state what the Element is, why it is modeled as an independent Element, what it includes, what it excludes, and, where needed, how it differs from its parent, children, and siblings.
      - A Definition MUST NOT be a rewrite of the title or a one-sentence "used for ..." summary; it expresses concept identity and scope boundary, not implementation files, symbols, call relationships, or the current approach.
      - Responsibilities, guarantees, constraints, behavior, Sections, and acceptance cases belong to the Element Contract; approach and rationale belong to `design.md`; change motivation and migration history belong to `proposal.md`.

      **Element Contract Semantics**

      - An Element Contract SHALL express completely the responsibilities, guarantees, constraints, and behavior the host Element carries at its own abstraction level; children may further refine or jointly fulfill those commitments. A parent must independently state its complete commitments at that level without requiring readers to read child Contracts. Preserve necessary coverage across abstraction levels without copying child Contracts item by item.
      - Scope states this Element's responsibilities and necessary exclusions, not every thing it does not do. Whole-Change goals and non-goals belong in `proposal.md`; implementation choices, rejected approaches, and reasons needed to understand the design belong in `design.md` (execution work belongs in `tasks.md`). For `pi-native-markdown-preview`, “自研 HTTP 预览服务” is an implementation approach exclusion: route it to `design.md`, not the Element Contract's Scope and Non-goals.
      - State conditions, behavior, and results directly; remove explanations that add no meaning. For example, “系统 MUST 对提交的来源版本进行严格校验，以确保更新始终基于最新记录，避免过期操作对现有内容造成覆盖。” can be shortened to “来源版本过期时，MUST 拒绝更新，记录保持不变。”
      - State each rule once at the same abstraction level. Scope does not repeat the complete pipeline; Business Logic explains the mechanism; exceptions add distinct conditions and outcomes; acceptance uses concrete inputs and results to verify the commitment. Preserve complete commitments across parent/child levels rather than removing them as duplicates.
      - Reuse accurate existing wording where it remains appropriate in the target model; revise only affected content. Do not polish unrelated passages or repackage clear user-confirmed language merely to make it sound formal. Preserve conditions, numbers, exceptions, timing, and concrete examples. Keep implementation internals and process detail out of Contracts, and name Sections for enduring verifiable commitments, not one-time gap, recovery, or migration actions.
      - A Section SHALL express one independently evolvable normative commitment under a stable identity. Its boundary is whether that commitment can be added, modified, or removed on its own; do not split mechanically by sentence, clause, `SHALL` count, or target Section count. Content that only restates the Declaration definition or the union of sibling Sections without adding a normative commitment does not form a Section; independent invariants, ordering, atomicity, consistency, or completion conditions are preserved. For business-specification Contracts, follow project-root file `.xirang/references/xirang-business-specification-standard.md` for the applicable grouping rules.
      - A Section body is free-form: prose, lists, tables, decision tables, formulas, pseudocode blocks, event triples, or any other carrier that expresses the item completely. Do not force a carrier, require fixed sub-headings, or treat sub-headings as identity. `### Section:` headers are the only structural unit inside `## Specification`.
      - `#### Acceptance Case:` is used only inside the key-acceptance-cases Section. It is not a general structural requirement; do not demand Acceptance Cases from other Sections, and do not let Acceptance Case count determine the number of persistent tests.

      **Hierarchy formation**

      Project decomposition guidance specializes parent-to-child semantic refinement within these framework constraints; it does not override confirmed intent, model semantics, or the current workflow's decision and authorization rules.

      Keep every same sibling set on one dimension, make it MECE for the confirmed scope, and work breadth-first: form and check each complete sibling set before refining its children. Do not mix responsibility, lifecycle, deployment, or implementation dimensions within one sibling set.

      2. xirang-semantic-refinement.md 完整目标正文：
      # Semantic Refinement

      Use this default method when selected by `decomposition`, within the constraints of `.xirang/references/xirang-semantic-authoring.md` and the current workflow's decision and authorization rules.

      1. Identify the current abstraction from domain concepts, capabilities, or user goals, and choose a decomposition dimension for its children.
      2. Express semantic category through `project`, `element`, and `perspective` rather than prescribing levels. A Perspective must have a real semantic boundary that needs child refinement; when grouping merely presents the same set of concepts, use a View instead of duplicating Elements or Contracts.
      3. Express cross-view collaboration, dependency, or constraint as typed Relationships. Extend the Metamodel only when genuinely shared semantics cannot be expressed accurately by an existing Kind.
      4. Refine to the point where the model can be understood and decided on; C4's fixed technical levels and any fixed number of levels are not required.

      Return the resulting model design and any unresolved decisions to the current workflow.

      3. .pi/skills/xirang-project-decomposition/SKILL.md 完整目标正文：
      ---
      name: xirang-project-decomposition
      description: 使用本项目 Perspective 维度与 MECE 精化树纪律形成 Xirang Semantic Model hierarchy。
      ---

      # Xirang Project Decomposition

      本方法在 `.xirang/references/xirang-semantic-authoring.md` 的框架约束和当前 workflow 的决策与授权规则下，通过 Perspective 确定本项目的分解维度。

      ## 顶层边界

      Project Root 的直接 children SHALL 区分两个项目定义维度：

      - `semantic-objects`：项目持久表达和演进的语义对象，包括 Semantic Model 与 Change。
      - `realization`：Agent 与用户如何构建、落实、验证和收束这些语义对象。

      不得把 CLI、代码模块、文件目录或单次 workflow 步骤提升为第三个顶层维度。

      ## Realization Perspectives

      `realization` SHALL 通过两个互补 Perspective 继续分解：

      - `realization-process`：只按推进过程拆分，表达 Semantic Model Build、Change Formation、Change Implementation 与 Change Closure 等阶段及其细化活动。
      - `collaboration-structure`：只按协作结构拆分，表达 Participants、Agents、Internal Agents 与 Interaction Surfaces 等职责和交互边界。

      Perspective 是观察同一 Realization 的分解角度，不是重复 ownership。跨 Perspective 的调用、产出、约束、验证或职责协作 SHALL 使用类型化 Relationships 表达，不得通过复制 Element 或混合 sibling 维度表达。

      Perspective 是 kind 为 `perspective` 的树内 Element，承载规范性语义（Declaration 与 Contract）；它不是 View/呈现投影层，也不以颜色、形状或布局定义语义。


      4. xirang-decomposition-authoring.md 完整目标正文：
      # Custom Decomposition Guidance

      Before creating or revising project decomposition guidance, read `.xirang/references/xirang-semantic-authoring.md` and follow its framework constraints.

      Describe how the project selects decomposition dimensions, identifies meaningful Element boundaries, and decides when further refinement is useful. Use project examples where they clarify the method.

      Store the guidance in a project-maintained Markdown file and select it through `decomposition`: use a project-root relative path, or a bare name resolved under `.xirang/references/` (`.md` is appended when absent). Use a separate file rather than editing the framework-generated default guidance.

      5. DECOMPOSITION_ENTRY 完整目标文本：
      Before forming or reorganizing a hierarchy, read and follow the complete guidance resolved by `xirang config project --select decomposition --json`; stop if it is unavailable.

      独立 decomposition-use reference 取消。common 的按需表由 Form or reorganize a hierarchy → guidance resolved by normalized decomposition，以及 Create or revise project decomposition guidance → .xirang/references/xirang-decomposition-authoring.md 两项提供入口；referenceFiles 交付以上目标指导。Build/Explore/Propose/Snack 现有语义指导加载入口保持，共享框架不经 decomposition 方法重复加载。方法边界保留明确的 semantic-authoring 路径，支持有需要的入口定位基础。运行时应复用已加载且仍有效的指导。
      本轮状态：用户在整合稿整体审阅后回复“可以的。继续吧。”，接受整合方案及其已披露的边界。此前逐处候选以 integrated-prompt-draft-* 中的最终整合稿为准，不叠加；历史观察不因接受而变成行为验证通过。
  - identity: integrated-prompt-draft-explore
    nature: informative
    decision: accepted
    content: |-
      当前 Explore 整合稿，尚未实施。Load and navigate 的概念影响段保留职责分工，方法加载已有 DECOMPOSITION_ENTRY，读写权限已有阶段边界，删去重复提醒。Summary gate 保留待用户裁决问题的阻塞，自主模型组织不作为提前完成全部 Definition 的理由。

      修改 1
      oldText:
      Assess Declaration/Definition impact only when concept identity or scope changes, and carry the complete confirmed target Definition into the Summary. Invoke configured decomposition guidance only for new Elements, reparenting or sibling reorganization; Contract-only work does not require hierarchy design. Guidance does not expand Explore's write permissions.
      newText:
      When concept identity or scope changes, resolve choices affecting the goal, scope or approach and carry confirmed boundaries and Definitions into the Summary. Propose may complete local model organization and target Definitions from that basis.

      修改 2
      oldText:
      Resolve contradictions, vague boundaries, and target-affecting pending choices.
      newText:
      Resolve contradictions and target-affecting choices requiring user judgment.
      本轮状态：用户在整合稿整体审阅后回复“可以的。继续吧。”，接受整合方案及其已披露的边界。此前逐处候选以 integrated-prompt-draft-* 中的最终整合稿为准，不叠加；历史观察不因接受而变成行为验证通过。
  - identity: integrated-prompt-draft-static-review
    nature: informative
    decision: accepted
    content: |-
      本轮在内存中构造整合稿并检查，未写源码或生成面。Propose 的14项顺序替换及 Explore 的2项替换均在当前输入中唯一匹配；共享目标文本复用当前 Definition/Contract 正文，局部调整沿用措辞句并增加已确认目标模型检查与框架基础。

      静态字符统计（JavaScript string.length；包含标题/换行；不是 token、字节或端到端运行成本）：Propose instructions 未展开公共变量占位的正文 26146 → 24161；默认方法 3553 → 1096；本项目方法含 frontmatter 1601 → 1044；共享语义指导 3912 → 4759；新增创建指南 684 字符，只在创建/修订方法时读取。旧 decomposition-use 整份删除，阶段短入口与 common 索引另有变化，未用上述部分统计冒称全链路节省比例。

      文本检查结果：局部模型组织权限存在；实质选择等待确认存在；真实 blocker 下不先写已定部分存在；override 后依赖未决语义不得写入存在；record coverage 与用户接受后 consume 存在；父级本层承诺要求存在；结构差异及理由进入审阅存在；不得 sync 存在；旧的目标 sibling set 一律预先确认句已从内存候选移除。这些仅是文本检查，不是 Agent 行为通过证据。

      人工语义核对：默认/项目方法删去的 MECE、BF、Definition/Contract 分工和统一 identity 等要求由共享语义、common 或模型上下文承载；具体 Perspective 结构及默认方法的分类、关系、Kind 扩展和细化停止标准保留。不同阶段的实际就绪、审阅和 CLI 操作仍保留。未来生成验证须检查共享指导确实可达，独立 Agent 仍按其入口取得所需上下文。

      待执行：已确认的生成回归与实际行为对比，包含减少无效暂停的同时保留实质确认、父子完整性与对象移除后的语义承接。当前不宣称已证明稳定改善。
      本轮状态：用户在整合稿整体审阅后回复“可以的。继续吧。”，接受整合方案及其已披露的边界。此前逐处候选以 integrated-prompt-draft-* 中的最终整合稿为准，不叠加；历史观察不因接受而变成行为验证通过。
  - identity: integrated-design-acceptance
    nature: normative
    decision: accepted
    content: 用户在整合稿、静态字符比较、保留的关键语义与授权门槛以及尚未实施/验证的说明之后，回复“可以的。继续吧。”，接受本次完整整合设计。目标为 Explore/Propose 分工、模型表达与分解纪律、配置指导加载及提示词单一规则承载的已确认整体方案；实现措辞以 integrated-prompt-draft-propose、integrated-prompt-draft-shared-and-methods、integrated-prompt-draft-explore 为准，替代此前逐处候选中重复的引用与说明，业务语义和工作流权限按既有确认保留。两类验证采用 formation-evolution-verification-plan，并按 prompt-consolidation-efficiency-verification 观察实际上下文与执行成本；接受设计不等于实现完成、性能收益已证实或最终 Change 已接受。
  - identity: cli-breaking-change-policy
    nature: normative
    decision: accepted
    content: |
      用户确认后续息壤 CLI 的设计理念：允许直接作 breaking change，不保证对旧版本的向后兼容；不因旧用法而要求 CLI 提供兼容层。遇到升级后的适配问题，由用户与 Agent 协作处理，不要求 CLI 内置对应兼容支持。当前 decomposition-use 入口退役不保留旧入口或转发别名。
      用户原话：直接breakchange， 不用对旧的有兼容。   有问题的时候直接用户配合agent就能处理了。 这个算是以后的设计理念吧。 可能很多breakchange， cli不保证向后兼容性 ,因为配合agent可以做到比较好的向后兼容了，不需要cli有对应的支持。
      用户进一步确认本次只停止生成和引用旧 decomposition-use，不新增由 CLI update 自动删除已有旧受管 reference 的逻辑；旧文件留待用户与 Agent 按需处理。用户原话：可以的。
      本原则不授权删除与旧接口无关的跨平台路径正确性或用户文件所有权保护。
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
        body: Agent SHALL 按角色委托 Internal Agents：独立正确性评估交给 Reviewer，优化执行交给 Opt，实验交给 Experimenter；主 Agent 不以自身判断或 Opt 自测代替必需的独立 Review。
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
      - name: 负责优化范围与最终验证
        body: |-
          主 Agent SHALL 在必需 Review 前确认受托实现已提交、适用测试已运行通过，委派 Reviewer 审查 checkout 的当前 HEAD；可以按非冲突质量维度并行委派，并在取得全部有效结论后合并为一条 Review opinion。主 Agent SHALL 确定 Opt 委托范围、处理越界和契约问题，依据实际代码、证据、收益、成本与风险判断继续投入；优化前实现须通过 `full-change` Review。主 Agent根据累计优化改动、行为保持与测试覆盖决定最终所需测试和可选 `incremental` Review；全量测试不自动要求。已确认的当前 Change 原有正确性缺陷 SHALL 修复并对缺陷及影响执行 `supplemental` Review。必需的验证全部通过、证据适用、交付完整且无未解决的正确性或恢复问题后才可保存最终成功状态并完成；旧 Review 不证明后续改动，后续代码变化重新判断受影响验证。

          主 Agent SHALL 在收尾告知放弃优化的事项、原因及处理结果；中断更换写入者前确认旧 Opt 停止，无法确认归属或恢复可靠时不继续完成。Reviewer 输入或 HEAD 变化导致无法形成意见时修正委派、重新审查，不把该错误当作实现 FAIL。
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
      definition: Apply 是 Change Implementation 中落实 Change 项目改动的活动，独立承载按 Expected Semantic Model、Change Plan 与当前状态实施普通项目工作及处理相应修正。存在 tasks.md 时按执行与验证安排推进，并将结果交给 Verify；优化阶段集成受托 Opt 的实施与主 Agent 的最终验证编排，不承担逐方向选择协议或模型同步归档。
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
          当 `tasks.md` 存在时，Apply SHALL 以其中与用户对齐的目标和验证方向推进，遵守用户明确要求的先后次序；对未指定顺序的目标 SHALL 根据当前代码与测试现状安排实施顺序、文件、测试动作、层级、命令和具体操作。Apply SHALL 不以这些现场判断修改已确认的目标语义或业务时序。

          - **Change 具有目标任务**
            - Apply 开始执行
            - 先读取目标 Contract 与 Plan，再确定实际实施与验证方法

          - **用户指定目标顺序**
            - 任务排列及 Plan 明确目标 A 须先于 B
            - Apply SHALL 在 A 完成后推进 B
        acceptanceCases: []
      - name: 处理 Required Corrections
        body: Verify 返回普通实现的 Required Corrections 时，主 Agent SHALL 判断并完成相应修正，按需更新 `tasks.md`，将修正形成新的 Git commit，并针对该 commit 重新执行 Change 级 Review。Opt 中的问题由 Opt 或主 Agent 依据实际证据修正或撤销；基线漏掉的当前 Change 缺陷由主 Agent 安排修复并追加针对性独立 Review。Reviewer 和 Quality CLI SHALL NOT 自动修改任务文件。
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
      - name: 集成受托优化执行
        body: 普通实现完成并通过独立 Review 后，主 Agent MAY 选择委托 Optimization。Opt 在委托范围内自主分组、修改与局部测试，交付关联 `baseCommit`/`resultCommit` 的 opinion；主 Agent 决定是否继续、是否追加 Review 以及 Seal 的最终声明。优化修改不自动重复普通 Apply 任务循环或每项 Change 级 Review。代码历史与恢复由 Git 承载，Quality SHALL NOT 创建代码 checkpoint。
        acceptanceCases: []
  element:apply-role:
    declaration:
      identity: apply-role
      kind: element
      parent: agent
      title: Apply Role
      definition: Apply 是 Agent 落实 Change 所描述项目改动的工作身份，独立表达写入普通实现、遵循任务安排与处理修正的责任。它以 Expected Semantic Model 为目标，结合 Change Plan 和当前状态推进；在优化集成中由主 Agent 委托 Opt 执行、判断后续投入与最终验证，不替代独立 Reviewer 或执行模型同步归档。
    sections:
      - name: 写入项目实现
        body: |-
          Apply Role SHALL 在 Change Implementation 范围内修改项目文件。

          - **Apply 识别待落实改动**
            - 当前状态不符合 Expected Semantic Model
            - Agent 写入实现所需修改
        acceptanceCases: []
      - name: 接收 Verify 返回事项
        body: Apply Role SHALL 接收普通实现 Required Corrections 并再次执行 Apply。优化中由主 Agent 安排范围和修正，Opt 受托执行优化与局部验证；主 Agent 可委托 Opt 或自行修复当前 Change 基线缺陷，修复后安排针对问题及其影响的独立 Review。
        acceptanceCases: []
      - name: 交付状态与证据
        body: Apply Role SHALL 将普通 Apply 产出的项目状态与可复现证据交付独立 Review。进入优化后 SHALL 委托可写 Opt 并检查实际交付，依据累计改动和风险判断最终验证；所需验证通过且证据对应当前状态后保存最终 successful checkpoint。
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
      definition: Change Closure 是 Change Realization 中将已验证的 Change 收束为项目新稳定状态的阶段。它以有效 Quality Seal 与独立的 Sync、validation、task 门禁为入口，先通过 Sync 将 Semantic Delta 应用于 Semantic Model，使 Expected Semantic Model 成为新的 Semantic Model；再由 Archive 按门禁保存已完成的 Change 并结束活动状态。
    sections:
      - name: 仅接受有效验证结果
        body: Change Closure SHALL 要求 Change 已具有通过的独立基线 Review、Seal 前的明确 Opt 处置，以及绑定 Git commit 的主 Agent Seal 声明。Seal 声明只表示主 Agent 判断该 commit 可运行且预期通过适用测试，不是 CLI 执行测试的证明。Sync 与 Archive 分别执行既有 Semantic Delta、validation 和 task 门禁；Quality 不比较 Seal commit 与 HEAD 或工作区内容，也不要求工作区 clean。Archive 的 Quality 门禁只确认 Seal commit 对象仍存在。质量意见或 Seal 的缺失、格式错误或 commit 对象不存在时，不得通过 Quality 门禁。
        acceptanceCases: []
      - name: 先同步后归档
        body: |-
          Closure SHALL 先通过 CLI Sync 将 Semantic Delta 原子应用于 Semantic Model，使 Expected Semantic Model 成为新正式模型；再由 Archive 保存已完成 Change 并结束活动状态。Sync 与 Archive 的 Semantic Delta、validation 和 task 门禁独立于 Quality Seal。

          - **完成 Change Closure**

            - Quality Seal 有效且所绑定 commit 对象仍存在
            - Sync 与 Archive 各自门禁均成功
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
      definition: Change Implementation 是 Change Realization 中落实 Change 并确认其结果的阶段。Agent 依据 Semantic Model、Semantic Delta 与 Change Plan，将 Change 描述的内容落实到项目，并通过独立评估与可复现项目证据确认实现完整、正确且一致；Quality 以 Review、可选 Opt 和主 Agent 的 Seal 声明完成其门禁，之后 Change 可进入 Change Closure。本阶段不以 Semantic Delta 更新 Semantic Model，也不关闭 Change。
    sections:
      - name: 实现并独立验证目标状态
        body: Change Implementation SHALL 由 Apply 依据 Expected Semantic Model 落实项目，并由 Verify 使用独立判断与可复现项目证据确认完整性、正确性和一致性。普通实现完成后 SHALL 取得绑定已提交代码的独立基线 Review；Opt 只能在该 Review 通过后由主 Agent 选择执行。Seal 前 SHALL 记录 Opt opinion 及其 `baseCommit`、`resultCommit`，或主 Agent 不做 Opt 的简短理由。主 Agent SHALL 通过 CLI 将 Seal 绑定一个 Git commit，并声明该版本可运行且预期通过适用测试。Quality 不保存代码快照、测试输出或当前工作区 fingerprint，不要求 Seal commit 匹配 HEAD 或工作区。只有基线 Review 已通过、Opt 已明确处置且 Seal 有效时，Change 才具备进入 Closure 的 Quality 资格；Sync、Delta validation 与 task gates 仍各自独立。
        acceptanceCases: []
      - name: 不在本阶段更新正式模型
        body: |-
          Change Implementation SHALL NOT 将 Semantic Delta 应用于正式 Semantic Model，也 SHALL NOT 关闭 Change。

          - **Verify 完成**：基线独立 Review 已通过，Opt 已记录意见和 commit 关联或主 Agent 已明确记录不做 Opt，Seal 已记录主 Agent 对绑定 commit 的声明；Change 获得进入 Closure 的资格，尚未同步或归档。
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
  element:cli:
    declaration:
      identity: cli
      kind: element
      parent: interaction-surfaces
      title: CLI
      definition: CLI 是息壤的配置与确定性操作界面。它建立和维护息壤工作区、项目配置与所选 Agent 工具集成，提供模型与 Change 查询、状态管理、程序化校验、验证证据持久化及原子状态转换，并投影供 Agent 按需读取的工作指导、模板与 references。它负责可复现的操作和明确的结果与诊断，不替代用户授权或 Agent 的语义判断。
    sections:
      - name: 提供一致可复现的操作
        body: |-
          CLI SHALL 管理工作区、项目配置与 Agent 工具集成，并为 Realization 提供结构化查询、状态管理、静态工作指导与模板的文件投影、程序化校验、验证证据持久化和原子状态转换。有效配置、Change 制品及推进状态、Quality 详情 SHALL 分别可由 config project、status --change 与 quality status 查询；静态写作与推进指导 SHALL 由按需读取的 skill/reference 承载。

          Agent 需要查询、校验、同步、提升或归档时，CLI SHALL 对相同有效输入产生一致结果，并以明确失败语义拒绝无效操作。
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
      - name: 提供 Neovim Change 审阅投影
        body: |-
          `xirang show <change> --review --json` SHALL 只读编译当前 Semantic Model 与指定活动 Change，返回供 Neovim 审阅的结构化投影。有效 Change 的投影 SHALL 包含该 Change 四分区中实际存在的全部 Delta 源文件；每个源文件 SHALL 恰有一份对应的完整当前模型文件文本与一份完整 Expected Semantic Model 文件文本，并保留该模型文件中未参与变化的内容。源文件条目 SHALL 保留 entity、identity 与 operation 信息。投影 SHALL 包含 Change 中实际存在的 `proposal.md`、`design.md`、`tasks.md` 文本。模型两侧文本 SHALL 使用同一确定性序列化方式；Relationship Delta 文件对应完整关系容器。该模式 SHALL 返回有效性，警告与错误进入 stderr，且 SHALL NOT 写入模型、Change 或临时文件。

          - **读取有效 Change 投影**

            - 用户或插件运行 `xirang show sample --review --json`
            - JSON 按 Delta 源文件返回一组 source，每组包含该文件的 entries、单份完整 `before` 文本与单份完整 `after` 文本，以及存在的 Plan 文件内容、valid 状态；警告和错误进入 stderr
            - 同一 Delta 源文件中有多个 entries 时，仍只返回一份 `before` 与一份 `after`
            - 未变更的 Section 与其它文件内容继续包含在完整模型文件文本中
            - ADDED 对象在当前侧以空内容表示，REMOVED 对象在目标侧以空内容表示
            - 不存在的 Plan 文件不出现在 Plan 文件集合中

          - **Relationship Delta 文件含多条操作**

            - 一个 `relationships/<kind>.yaml` 包含同一关系容器中的多条 Delta 操作
            - 当前侧与目标侧分别返回完整关系容器内容，不只返回 Delta 中的关系条目

          - **Change 无效**

            - Change 编译不能形成有效 Expected Semantic Model
            - 以非零退出码和 stderr 诊断报告无效，且 SHALL NOT 将部分模型内容作为可审阅的有效目标返回

          - **保持普通 Show 输出不变**

            - 用户运行 `xirang show sample --json` 而未指定 `--review`
            - CLI 保留普通 Show 的请求数据与含义，警告和错误遵循统一 stderr 通道

          - **审阅投影不改变持久状态**

            - 用户或插件请求审阅投影
            - Semantic Model、Change 与 Plan 文件保持不变
            - CLI 不创建审阅 artifact 或临时文件
        acceptanceCases: []
      - name: 写回 Neovim 的目标模型微调
        body: |-
          CLI SHALL 提供独立的结构化操作，将 Neovim 提交的完整 Expected Semantic Model 文件文本转换为对应 Change Delta。该操作 SHALL 只应用 Element Declaration 的 `definition` 与其 Contract Sections 的变化；其它 Declaration 字段及其它实体的编辑 SHALL 被忽略，并在结构化结果中列出被忽略字段。CLI SHALL 保留同一 Delta 源文件中未受支持编辑影响的既有 entries，不得将模型投影原文直接覆盖 Delta 文件，也不得修改 Formal Semantic Model。

          写回 SHALL 在内存中生成候选 Delta 并编译、完整校验 Change；只有目标内容通过校验后才可原子替换对应 Delta 源文件。输入、解析、语义校验或写入失败时，原 Delta 文件 SHALL 保持不变，并返回结构化诊断。操作 SHALL 不执行并发版本冲突检查；多个成功写入以最后一次写入的受支持目标内容为准。

          - **写入 Element Definition**

            - Neovim 提交一个 Element 的 Expected 文件，且只改变 `definition`
            - CLI 写入携带完整目标 Declaration 的 `MODIFIED` Entry
            - 用户提交的 `identity`、`title`、`kind`、`parent` 等不支持字段 SHALL NOT 覆盖既有 Expected 值

          - **微调、增加或移除 Section**

            - Section 名称不变而正文或 Acceptance Cases 改变，包括删除其中一部分内容
            - CLI 写入该 Section 的 `MODIFIED` Entry
            - 用户新增一个 Section
            - CLI 写入 `ADDED` Section Entry
            - 用户删除整个 Section
            - CLI 写入 `REMOVED` Section Entry
            - 用户修改 Section 标题
            - CLI 写入旧标题的 `REMOVED` 与新标题的完整 `ADDED` Section Entries

          - **忽略不支持字段并保留受支持编辑**

            - 同一次提交同时修改 `definition` 或 Contract Sections，以及 `identity`、`title`、`kind`、`parent` 或其它不支持内容
            - CLI 只应用受支持的修改，并在 JSON 结果中报告被忽略的字段；不支持字段对应的 Expected 值保持原样
            - 若没有受支持的语义变化，Delta 保持不变且结果仍报告被忽略内容

          - **拒绝无效目标**

            - 候选 Delta 无法形成完整有效的 Expected Semantic Model
            - CLI 返回错误诊断且原 Delta 文件逐字节保持不变

          - **避免部分写入**

            - 候选通过完整 Change 校验后执行 Delta 文件替换
            - 替换失败或过程中发生写入错误
            - 原 Delta 文件保持完整，且不留下可被解析为活动 Delta 的部分内容

          - **跨平台定位与写入源文件**

            - Neovim 回传审阅投影给出的 Delta 源文件标识
            - CLI 通过 Node.js path API 将其解析到指定 Change 目录下的受控源文件；Windows、macOS 与 Linux 均不得因路径分隔符差异改变 containment 或定位结果

          写回成功且没有被忽略内容时，stdout SHALL 为空，退出码为 0；有被忽略内容时 stdout SHALL 返回 {"ignoredChanges":[...]}，不附 ok、changed 或空 diagnostics。失败 SHALL 非零退出并将结构化诊断写入 stderr，原有原子写入及无效输入保护保持。
        acceptanceCases: []
      - name: 统一结果与诊断通道
        body: |-
          整个 CLI SHALL 将 stdout 限于请求的数据或必须交付的结果，将警告与错误写入 stderr；成功以退出码 0 表达，失败以非零退出码及具体诊断表达。无返回数据且无警告的成功操作 SHALL 使 stdout 与 stderr 均为空，默认和 --json 模式均不得输出仅为确认成功的消息、{"ok":true} 或 {}。--json SHALL 决定有数据时的编码，诊断也 SHALL 使用结构化 JSON，不重复输出成功/失败 envelope。

          查询 SHALL 返回所请求的数据，包括有效的空查询结果；已知缺口作为状态查询的结果表达，不冒充命令执行失败。调用方需要继续引用的新身份、Quality revision 与 Candidate reviewDigest SHALL 作为必要结果返回。完整 Contract、snapshot 与 review projection 的请求范围 SHALL 完整保留，不自动摘要或截断。导出位置、completion script、反馈提交 URL 及必要的手工提交材料 SHALL 按其实际交付职责返回。

          CLI SHALL 保留 Semantic Model 的 identity 引用语义、Quality revision 的 CAS 语义及 Candidate reviewDigest 的精确内容绑定，不以输出精简移除这些机制。

          - 一次配置写入成功且无警告：文件完成写入，默认与 --json 的两条输出流均为空，退出码 0。
          - 查询没有活动 Change：返回可识别的空集合，退出码 0，不以空 stdout 代替查询结果。
          - 查询返回有效配置但发现被忽略的非法配置项：stdout 返回配置，stderr 返回对应警告，退出码仍为 0。
          - 写入输入非法：退出码非零，stderr 包含具体原因及适用定位；不在 stdout 再输出错误对象。
          - Quality 写入成功：返回新 revision，不回显刚提交的完整 opinion 或 success envelope。
        acceptanceCases: []
      - name: 保持非交互输出简洁
        body: 非交互调用 SHALL 不输出 spinner、加载进度、颜色装饰或成功装饰文本。真实警告、错误、必要后续凭据及显式请求的完整数据 SHALL 保留。显式请求详细信息时，输出 SHALL 仅展开该命令请求的范围，不因 --json 自动增加额外内容。
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
          Record SHALL 以文件名称作为唯一标识符，条目与结构对象保留各自稳定语义 identity。记录 SHALL 表达最新设计与决策状态，局部更新保留无关内容，不累积相互冲突的对话版本，不要求 revision history 或整体 readiness，不引入记录或条目修订号。

          重命名后使用新文件名，未变条目身份不变。获用户允许修订已采纳条目时保存最新内容，不并列保留冲突版本，也不通过降为 pending 绕过确认。记录内容指纹 SHALL 由 coverage/consume 内部计算并校验，不要求用户或 Agent 抄传。
        acceptanceCases: []
      - name: 保存相关 Semantic Model 基准快照
        body: |-
          记录 SHALL 保存 相关 Semantic Model 上下文基准，以区分捕获时不存在的 formal model、存在且有效的模型及之后上下文变化。相关语义身份包括结构部分的对象及显式关联的 identity，SHALL NOT 以自然语言猜测完整依赖范围；CLI 比较能确定的上下文变化，其结果不是语义覆盖证明。

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
          Agent SHALL 区分用户意图、实现方案与技术事实，允许用户只表达意图、只提出路线或混合表达；在确定方案前主动理解现状、问题、期望结果与约束，区分候选路线和明确要求。影响问题定义、方案选择或结果判断的缺口 SHALL 通过项目取证和针对性提问澄清；提问时说明当前理解和疑点，一次一问，复用已明确内容，不采用固定问卷。

          Design Exploration SHALL 主动发现需要用户选择的决策点，通过一次一问、方案比较与适用 section confirmation，确认行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing、risks 及其他必要设计维度。Agent SHALL 解释适用的异常结果、竞争事件与时间起点或容差，给出推荐及理由并等待用户确认；推荐与未选方案不得当作已确认决定。关键条件、动作与可观察验收结果 SHALL 随设计确认，不能仅确认测试工具或技术方案名称；完整 Sections、Acceptance Cases 与 tasks 留给 Propose 文档化。

          - **多个实现方案符合目标语义**

            - 多个方案具有不同权衡
            - Design Exploration 比较方案并请求用户选择

          需要实践求证的可行性问题 SHALL 交 Experimenter 设计并执行实验，在 Explore 内取得结果再确认相关方案；实验事实与用户决策分开记录。

          Agent SHALL 在推荐或采纳方案前，独立判断方案的可行性及能否在约束下达成预期结果，对用户与自身提出的方案同等评估，并向用户表达自己的判断和关键理由。SHALL 区分事实、推导与关键假设，寻找可能推翻方案的约束或反例。方案采纳不证明技术可行；方案失败本身不证明意图理解错误或目标不可实现。发现问题时先复核方案及假设；证据确实暴露意图歧义或约束冲突时，再澄清对应部分。明确路线要求与目标冲突时，说明冲突及选项，由用户决定调整方向，不擅自改变目标或路线约束。修订后复核依赖结论。

          可行性判断 SHALL 使用相关证据与推理，主动获取缺失证据并检查其可靠性与适用性，不限定证据来源，不要求每次新增测试。已有依据不足以解决影响决策的可行性问题时，SHALL 在确认依赖设计前委托 Experimenter 设计并执行最小判别实验。局部证据 SHALL 用于支持已验证部分，不扩大为整个方案已证实，也不因其覆盖有限而忽略其价值。执行受阻或结果不明确时，说明剩余疑点及其对决策的影响，不把运行过实验当作疑点已解决。
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

          Design Summary SHALL 保留已确认行为、范围、决策及理由，包含适用条件、数值、例外、时序和关键验收结果；推荐、未选方案、未决事项与用户明确排除的范围 SHALL 保持可区分。有记录时引用记录身份，不向用户呈现 sourceVersion；sourceVersion 继续由 CLI 提供并由 Agent 内部用于版本校验，不重复记录全文。Summary 保持会话内，不新增永久决策台账。Propose 仍可在文档化时发现新缺口。
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

          用户确认即授权记录该部分内容。Agent SHALL 立即通过 CLI 局部写入，不再请求持久化确认，不在写入前展示完整拟保存内容。首次出现需保存的设计内容时可建立非空记录，空列表不构成确认内容免记的依据。写入后只报告本次写入的内容要点与决策状态变化；修改已确认内容须单独标出，不重贴未变化内容。无结果的成功更新以退出码确认，必要时显式请求差异；不要求 CLI 回传机械计数，不向用户播报这些计数。冲突先说明影响并由用户裁决，不默认以最新陈述覆盖先前确认。

          - 例如：已有 18 条，新增 1 条、修改 1 条后只报告新增与修改的内容要点，不重贴其余 17 条，也不播报“共 19 条”等机械计数。
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

          目标为 Expected Semantic Model 或 active Candidate；位置精确到 Element Declaration、Section、Acceptance Case、Relationship、Element Kind、Relationship Kind 或 Authored View。现有正式语义已满足的细节可用 no-op 位置，不制造 Delta。摘录 SHALL 取自当前文件，不凭记忆改写。结构部分由 CLI 逐字段比对，不拆原子细节。CLI 内部绑定并校验来源内容及目标模型指纹、位置和摘录，不替代语义判断；覆盖结果记录后目标或记录变化须重查。

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
      - name: 载入记录时同步当前设计依据
        body: |-
          Build、Explore 与 Propose 的 Agent SHALL 经 CLI 操作 Record。首次接手、上下文丢失与交接前 SHALL 完整读取当前记录；已掌握且未发生相关变化的依据可以复用，普通局部补读 SHALL 按条目选择，不固定执行 show/status/validate 三连。需要判断 drift、结构有效性或恢复失效结论时 SHALL 执行对应检查，不以减少调用跳过适用门禁。

          新对话首次完整载入，或缺少已展示且仍有效的基线时，Agent SHALL 以自然语言概述全部已确认内容与待决问题；不播报文件名、hash、成功状态或机械计数。同一对话的普通读取不重复展示全量基线；写入后只报告本次内容要点和决策状态变化，修改已确认内容单独标出。

          发现无效内容或相关 drift 时 SHALL 说明诊断并调和受影响结论，不复用失效依据。来源与目标的新鲜度由 coverage/consume 内部指纹检查，Agent 不抄传 sourceVersion。操作提示词 SHALL 不宣告允许 Agent 直接编辑文件或绕过 CLI。
        acceptanceCases: []
  element:deterministic-operations:
    declaration:
      identity: deterministic-operations
      kind: element
      parent: cli
      title: Deterministic Operations
      definition: Deterministic Operations 是 Realization 中提供可复现操作的 CLI 能力。它包含结构化查询、状态管理、程序化校验、验证证据持久化与原子状态转换，支持显式请求的差异和完整语义读取；静态工作指导由受管文件承载。它不替代用户意图裁决、Agent 语义判断或独立质量评估。
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
        body: "当前 Formal Semantic Model 不存在且调用方请求 Candidate comparison 详情时，Candidate validation SHALL 返回 comparison.baseline: absent、comparison.diff: unavailable 与 reason: formal-model-absent，不构造无效空 diff 或假设空 Formal Model。有效 Candidate 的默认校验 SHALL 仍返回 reviewDigest；比较不可用不使本来有效的初次构建失败。"
        acceptanceCases: []
      - name: Formal 存在时生成 Promotion Diff
        body: "当前 Formal Semantic Model 存在且有效、调用方请求 Candidate comparison 详情时，Candidate validation SHALL 返回 comparison.baseline: formal、comparison.diff: available、Formal fingerprint 与从 Formal 到 Candidate 的真实 semantic diff。diff entries SHALL 完整表达 promotion 的 ADDED、MODIFIED 与 REMOVED 语义；未请求详情时不回传该比较内容。"
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
          xirang validate --change <name> SHALL 完整执行只读 Change 校验，默认只报告问题；成功且无问题时静默，JSON 模式同样适用。--preview SHALL 显式请求当前 Semantic Model 与 Expected Semantic Model 的差异预览，文本或 JSON 提供实体级 summary 与 concise entries，不创建展示文件。

          系统 SHALL 使用同一 Change compiler 取得校验与差异，不注册独立 diff 命令，也不将预览持久化为 Change artifact。显式预览返回空变化也是有效查询结果；不能因成功静默规则吞掉请求的预览。
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
          Record lifecycle SHALL 仅操作 canonical `.xirang/records/` 下按合法文件名称寻址的 managed regular files，使用 Node.js path APIs、containment、lstat、symlink 拒绝。来源快照 `record-source.md` 与覆盖结果 `record-coverage.json` SHALL 仅写入显式 named Change 或 active Candidate 的受控位置。Windows、macOS 与 Linux SHALL 采用同一隔离语义。

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
            - CLI 返回 `id`、`title`、`valid`、实体级 `summary`、以 entity kind 和稳定 identity 表达的 concise `entries` ；compiler 警告与错误进入 stderr

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
            - `show` 非零退出并向 stderr 返回结构化诊断，且消费者不得将返回的 `entries` 视为有效目标状态

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
          record SHALL 通过文件名称管理非空确认记录，Build 与 Change 各用独立实例，保留完整/选择读取、CLI 局部更新和内部模型基准。不使用 explorationId/slug 双身份，不引入记录修订号，不要求调用方提供 sourceVersion。条目显式区分 nature 与 decision，结构只承载已确认目标，缺失状态不得默认确认。

          更新保留未提及内容与结构字段合并语义；默认成功静默，显式 --diff 返回本次差异。show 按请求返回完整内容，不回显内部 hash 或 baseline。实现 SHALL 支持用户直接编辑合法记录；Agent 工作面仍 SHALL 要求通过 CLI 操作，不提示绕过 CLI。CLI 校验格式与确定性关系，不代用户确认设计。
        acceptanceCases: []
      - name: 返回记录校验与上下文变化
        body: |-
          Record validation SHALL 分别报告格式、文件身份、结构部分的 Kind / parent / Relationship 端点解析、显式上下文关联与模型变化的确定性诊断，不推断自然语言冲突或完备性。相关上下文变化 SHALL 阻止复用旧检查结论；意图判断由 Agent 完成并由用户裁决。合法初始 Build 可无 formal model，存在而损坏的模型必须报错。

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
          record coverage SHALL 按性质、决策与适用性记录覆盖检查；需落实的 accepted normative 内容须有原子细节、真实目标位置及适用原文摘录。影响目标的 pending 问题阻塞；不适用或不影响的声明须有理由；excluded/informative 不强制生成目标承诺。CLI 校验结果、位置、摘录及结构，不判断自然语言覆盖或用户授权。

          coverage SHALL 将当前来源内容 hash 与 Expected Semantic Model 或 Candidate 模型指纹内部绑定到 record-coverage.json，保留活动 Record。consume SHALL 显式选定目标并重新计算核对，来源或目标模型变化时拒绝；不要求调用方提供 hash 或修订号。已确认结构须与目标逐字段一致，确认删除的对象须不存在。用户接受最终 Change 后，Propose 才可调用 consume。

          交接 SHALL 先保存精确 record-source.md，再验证，最后删除活动来源；失败保留来源及既有目标，撤销本次未完成快照；同字节快照可重验恢复，冲突快照停止。两份文件仅为形成历史，不进入后续规范语义计算。
        acceptanceCases: []
      - name: 提供稳定 Record JSON Contract
        body: Record JSON SHALL 只编码请求的数据或必要交付结果，不输出通用成功/失败 envelope；无结果成功保持 stdout 为空。警告与错误 SHALL 写入 stderr，--json 时为结构化 JSON，失败退出码非零。必要的创建文件名正常返回，普通回执不暴露内部来源/目标指纹；选择读取与完整读取保留各自请求范围的完整内容。
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

          Agent SHALL 区分用户意图、实现方案与技术事实，允许用户只表达意图、只提出路线或混合表达；在确定方案前主动理解现状、问题、期望结果与约束，区分候选路线和明确要求。影响问题定义、方案选择或结果判断的缺口 SHALL 通过项目取证和针对性提问澄清；提问时说明当前理解和疑点，一次一问，复用已明确内容，不采用固定问卷。

          Agent SHALL 在推荐或采纳方案前，独立判断方案的可行性及能否在约束下达成预期结果，对用户与自身提出的方案同等评估，并向用户表达自己的判断和关键理由。SHALL 区分事实、推导与关键假设，寻找可能推翻方案的约束或反例。方案采纳不证明技术可行；方案失败本身不证明意图理解错误或目标不可实现。发现问题时先复核方案及假设；证据确实暴露意图歧义或约束冲突时，再澄清对应部分。明确路线要求与目标冲突时，说明冲突及选项，由用户决定调整方向，不擅自改变目标或路线约束。修订后复核依赖结论。
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
          Explore SHALL 在适用设计确认并完成边界、竞争与一致性自查后输出 conversation-only Design Summary。Summary SHALL 保留已确认决策的条件、数值、例外、时序和关键验收结果，区分推荐、未决事项与用户确认的排除范围；影响当前目标的未决决策 SHALL 阻塞交接，Agent 不自行延期。输出前 SHALL 对照已确认对话确认所有规范性确认均已记录或明确豁免，已有部分记录不代表后续确认已被覆盖。带记录时，只有完整重载、冲突调和和一致性复核通过后才能输出，并保留该记录身份供 Propose 发现来源；sourceVersion 仅保留在 CLI 输出与 Agent 内部校验中，不向用户呈现。带豁免时 SHALL 交付无记录声明及其理由；本次无 normative 内容时 SHALL 声明该事实。SHALL NOT 创建空记录，也不以省略上述内容代替声明。

          - **带记录完成 Explore**

            - 当前完整记录与拟议设计无未决冲突且适用设计已确认
            - 输出 Design Summary 并保留可供 Propose 发现来源的记录身份，不把 Summary 另存为记录或向用户呈现 sourceVersion。
        acceptanceCases: []
      - name: 按确认即记录使用 Design Record
        body: |-
          发现相关记录、需保存影响设计的 pending 问题/假设、产生未豁免的设计确认、用户要求记录或修订、Summary 前发现记录缺口时，Explore SHALL 加载共享 Design Record reference。按协议主动维护 pending 内容，用户确认后立即通过 `xirang record` 局部更新；不等待用户要求记录，不另行索要持久化授权。修改已确认内容须用户允许，写入后只报告变化与概况。

          Explore SHALL 在每个阶段入口先运行 `xirang list --json` 发现当前记录，并读取必要的完整基础状态；完整 show/status/validate 用于入口、恢复和收尾门禁，不用于普通讨论或每次局部更新前的重复仪式。有效上下文未发生相关变化时，SHALL 复用最近成功操作返回的 `sourceVersion`、summary 与已知 identity；局部设计问题使用 `record show --entry`，update 使用最近有效 `sourceVersion` 并检查返回的 diff 与 summary。

          发生上下文压缩、session 切换、sourceVersion 冲突、相关模型 drift 或无法确认当前状态时，SHALL 重新读取完整记录与状态，并重建受影响的模型或项目证据。记录变化使受影响设计与 Summary 需重查。交接前仍须完成完整覆盖检查，并落定已持久化记录、用户明确豁免或无 normative 内容声明之一；不创建空记录，不默认豁免。
        acceptanceCases: []
      - name: 委托可行性实验
        body: |-
          可行性判断 SHALL 使用相关证据与推理，主动获取缺失证据并检查其可靠性与适用性，不限定证据来源，不要求每次新增测试。已有依据不足以解决影响决策的可行性问题时，SHALL 在确认依赖设计前委托 Experimenter 设计并执行最小判别实验。局部证据 SHALL 用于支持已验证部分，不扩大为整个方案已证实，也不因其覆盖有限而忽略其价值。执行受阻或结果不明确时，说明剩余疑点及其对决策的影响，不把运行过实验当作疑点已解决。

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
          Explore Role SHALL 在适用设计确认及当前记录冲突检查通过后向 Propose 交付 conversation-only Design Summary；存在记录时保留其稳定身份以便 Propose 确认来源，但不向用户呈现 sourceVersion；无记录时不强制创建。

          - **Explore 活动完成**

            - 适用设计已确认，存在时的记录已重载且无未决冲突
            - 交付有效 Summary 与可用来源身份，不以记录取代完整设计，也不向用户播报版本。
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
      - name: 形成有依据的设计判断
        body: |-
          Agent SHALL 区分用户意图、实现方案与技术事实，允许用户只表达意图、只提出路线或混合表达；在确定方案前主动理解现状、问题、期望结果与约束，区分候选路线和明确要求。影响问题定义、方案选择或结果判断的缺口 SHALL 通过项目取证和针对性提问澄清；提问时说明当前理解和疑点，一次一问，复用已明确内容，不采用固定问卷。

          Agent SHALL 根据目标和约束同等审视用户与自身提出的方案，区分事实、推导与关键假设，寻找可能推翻方案的约束或反例。方案采纳不证明技术可行；方案失败本身不证明意图理解错误或目标不可实现。发现问题时先复核方案及假设；证据确实暴露意图歧义或约束冲突时，再澄清对应部分。明确路线要求与目标冲突时，说明冲突及选项，由用户决定调整方向，不擅自改变目标或路线约束。修订后复核依赖结论。

          可行性判断 SHALL 使用已有证据与推理能力，不要求每次新增测试。已有依据不足以解决影响决策的可行性问题时，SHALL 在确认依赖设计前委托 Experimenter 设计并执行最小判别实验。局部证据 SHALL 用于支持已验证部分，不扩大为整个方案已证实，也不因其覆盖有限而忽略其价值。执行受阻或结果不明确时，说明剩余疑点及其对决策的影响，不把运行过实验当作疑点已解决。

          Agent SHALL 以明确的可观察验收结果衔接后续实现与反馈；实验不代替正式项目验收。
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
          CLI、Web 与 Neovim 对 Text Presentation 和 Visual Presentation 的支持 SHALL NOT 表示某种呈现方法被某一界面独占。CLI 与 Neovim 可支持 Text Presentation，Web 支持 Visual Presentation。

          - 用户通过 Neovim 查看 Change 的模型前后文本差异时，界面以人类可读文本传达 Change-derived information。
          - 交互界面之间的呈现方式不改变 Semantic Model 或 Change 的规范性语义。
        acceptanceCases: []
      - name: 由 CLI、Web 与 Neovim 组成
        body: |-
          Interaction Surfaces SHALL 由 CLI、Web 与 Neovim 三类交互界面共同支撑 Realization，各自提供确定性操作或语义呈现能力。

          - 用户或 Agent 需要配置、操作或理解息壤时，可使用 CLI、Web 或 Neovim 中适用的界面。
          - CLI 提供确定性操作与结构化数据；Web 提供浏览器可视化浏览；Neovim 提供 Change 文件级文本审阅。
        acceptanceCases: []
  element:internal-agents:
    declaration:
      identity: internal-agents
      kind: element
      parent: agents
      title: Internal Agents
      definition: Internal Agents 是在与主 Agent 隔离的上下文中接受委托、独立取得依据并交付结果的执行主体，独立区分于端到端编排身份。它们包含只读 Reviewer、可写受托 Optimizer 与 Experimenter，各角色按职责执行审查、优化或实验；不承担用户设计确认、Change 关闭或 Semantic Model 提升。
    sections:
      - name: 在 Clean Context 中判断
        body: Internal Agents SHALL 在与主 Agent 隔离的上下文中接受委托并独立工作。Reviewer 在不受实现过程判断影响的 clean context 中评估；新的 Optimization 探索由 fresh-context Opt 独立读取并执行，中断恢复可在旧执行者停止后由原 Opt 或接手者继续同一委托；Experimenter 独立设计与执行所委托实验。
        acceptanceCases: []
      - name: 独立读取判断依据
        body: Internal Agents SHALL 按角色与委托问题独立读取所需依据。Reviewer、Optimizer 读取 Semantic Model、Change 与当前项目证据；Experimenter 读取问题、约束、决策背景和所需项目证据，不要求尚未形成的完整 Change。
        acceptanceCases: []
      - name: 输出结构化结论
        body: Internal Agents SHALL 向主 Agent 返回足以支持后续编排的证据与结果。Reviewer 返回所评估范围的独立结论与修正事项；Opt 返回实际保留改动、行为保持依据、测试与证据、放弃及遗留问题、后续建议；Experimenter 返回方法、观察结果与限制。Opt 的交付不决定整个 Optimization 完成，其自测不作为独立 Review；主 Agent 决定后续投入与最终验证，不替用户确认设计。
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
        body: Reviewer SHALL 只读判断，不修改项目、Change、Quality、Checkpoint 或 Git history；其工具可用范围与主 Agent 相同，不以工具白名单、编辑否决或硬只读沙箱代替行为约束。Optimizer SHALL 在委托范围内实际修改相关实现与测试、执行局部验证，缺失对应测试时先补后改；Experimenter MAY 编写并执行受托实验。三者均不承担用户确认、正式模型提升或 Change 关闭，最终验证范围由主 Agent 决定。
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
  element:neovim:
    declaration:
      identity: neovim
      kind: element
      parent: interaction-surfaces
      title: Neovim
      definition: Neovim 是面向 Xirang 用户的编辑器内文本交互界面，独立建模以承载在 Neovim 中审阅活动 Change 的交互职责。它包含 Change Delta 文件的模型前后对比、Change Plan 阅读及返回源文件编辑的导航；不负责 Semantic Delta 编译、模型持久化或 Web 的图形化浏览，也不构成规范性语义来源。它与提供确定性操作的 CLI、提供浏览器可视化浏览的 Web 相区别。
    sections:
      - name: 浏览 Change 内容
        body: |-
          Neovim SHALL 为一个活动 Change 提供独立审阅 tab 与不影响全局 quickfix 列表的左侧文件列表。列表 SHALL 按 Delta 分区分组且可展开，列出 Change 中实际存在的全部 Delta 文件，并列出实际存在的 `proposal.md`、`design.md` 与 `tasks.md`。用户 SHALL 可通过 `<Tab>` 与 `<S-Tab>` 在列表条目间切换。

          - Delta 文件按 `elements/`、`metamodel/`、`relationships/` 与 `views/` 分组。
          - Plan 文件作为 Change 专属条目呈现，不混入全局 quickfix 或 Change 之外的内容。
        acceptanceCases: []
      - name: 对比 Semantic Delta 对应的完整模型内容
        body: |-
          Neovim SHALL 将 Delta 源文件对应的模型内容呈现为左右两栏：左侧是当前 Semantic Model 对应的完整内容且只读，右侧是应用整个 Change 后 Expected Semantic Model 对应的完整内容且可编辑，并自动执行文本 diff。两侧 SHALL 使用一致的展示规范化。Delta 文件自身的差量内容 SHALL NOT 被误作完整目标模型内容。Plan 文件 SHALL 单栏只读呈现。

          - Relationship Delta 文件与其它 Delta 文件使用相同对比方式；关系文件包含多条操作时，两侧呈现对应的完整关系容器。
          - ADDED 对象的当前侧为空，REMOVED 对象的目标侧为空。
          - Expected Semantic Model 使用 Neovim 内存缓冲区承载编辑；临时投影不直接覆盖 Delta 源文件，Formal Semantic Model 不接受写入。
        acceptanceCases: []
      - name: 定位源文件并刷新审阅
        body: |-
          用户 SHALL 能从审阅条目跳转至对应的真实 Change 源文件编辑。Change 源文件保存或当前 Semantic Model 变化后，Neovim SHALL 自动重新取得审阅投影并更新文件列表与对比内容。通过右侧 Expected Semantic Model 保存成功后，Neovim SHALL 在现有审阅 tab 内刷新投影，并保留当前 Delta 源文件、焦点窗格、左右光标与视口位置、列表展开状态及宽度；重新呈现后的光标位置 SHALL 限制在有效范围内。首次打开时 Change 无效，Neovim SHALL 不创建审阅 tab，仅在消息区域提示无效；已打开的审阅在重新计算发现无效时 SHALL 撤下旧对比并提示无效，不得继续显示过期结果。

          - 跳转编辑的目标是 Change 中对应的真实 Delta 或 Plan 文件，而非临时展示内容。
          - 当前 Change 或模型发生变化后，较早开始的异步投影结果 SHALL NOT 覆盖更新的结果。
          - 写回失败时，Neovim 保留右侧编辑草稿，不以旧投影覆盖它。

          Change 选择 SHALL 从成功的 list 查询解析完整 changes 数据，审阅 SHALL 从成功的 show --review 查询读取完整模型与 Plan 数据；命令失败时从 stderr 读取诊断，不把缺失或部分结果当作有效查询。通道调整 SHALL 保留现有刷新、异步顺序及视图状态保证。
        acceptanceCases: []
      - name: 保存 Expected Semantic Model 微调
        body: |-
          用户 SHALL 能通过保存右侧完整 Expected Semantic Model 文本请求 CLI 写回当前 Delta 源文件。Neovim SHALL 只允许编辑右侧目标模型，左侧当前模型与 Plan 保持只读。CLI 报告被忽略的不支持字段时，Neovim SHALL 在 status bar 提示用户；受支持的 `definition` 与 Contract Section 修改仍 SHALL 正常保存。写回失败时 SHALL 保留草稿供继续编辑或重试。

          - **修改 Definition**

            - 用户修改可见 Element 的 `definition` 并保存
            - CLI 将完整目标 Definition 写回对应的 Element Declaration `MODIFIED` Entry

          - **微调或删除 Section 内容**

            - 用户修改 Section 正文、Acceptance Cases 或删除 Section 中部分内容并保存
            - CLI 将该 Section 写为 `MODIFIED`

          - **增加、删除或改名 Section**

            - 用户新增完整 Section、删除整个 Section，或修改现有 Section 标题并保存
            - 新 Section 写为 `ADDED`，删除的 Section 写为 `REMOVED`，标题修改写为旧 Section `REMOVED` 与新标题 Section `ADDED`

          - **混合支持与不支持编辑**

            - 用户同时修改 `definition` 或 Contract Sections，以及 `identity`、`title`、`kind`、`parent` 或其它不支持内容
            - CLI 保存支持的修改，忽略其它修改
            - Neovim 在 status bar 提示被忽略的修改，成功刷新后显示 CLI 接受的目标内容

          - **保存无效目标**

            - CLI 拒绝写回并返回错误诊断
            - Neovim 保留用户的右侧草稿，左侧仍不可编辑

          Neovim SHALL 根据 CLI 退出码判断保存结果：退出码 0 且 stdout 为空时仍视为保存成功，并在现有 tab 刷新 accepted projection；stdout 有 ignoredChanges 时继续在 status bar 展示被忽略字段。非零退出码时 SHALL 读取 stderr 中的结构化诊断、呈现具体失败并保留未保存草稿。stdout 为空不得被当作 JSON 解码失败或保存失败。
        acceptanceCases: []
  element:optimization:
    declaration:
      identity: optimization
      kind: element
      parent: quality
      title: Optimization
      definition: Optimization 是 Quality 中在通过的独立基线 Review 后、由主 Agent 可选委托的实现改进活动，独立承载优化机会发现、分组合并、实施、局部验证和结果交付。Opt 在委托范围内执行并保持 Expected Semantic Model 与项目行为；主 Agent 决定是否进行 Opt、后续投入及最终风险判断，Reviewer 提供主 Agent 选择的独立审查。代码历史和恢复由 Git 承载，不由 Quality checkpoint 复制。
    sections:
      - name: 读取完整优化依据
        body: Optimization SHALL 读取 Semantic Model、Change、当前代码、通过的基线 Review 及其 commit、Opt 委托范围、项目证据与既有 Opt opinions。后续委托基于累计改动后的实际状态，不能假定基线 Review 审查过这些改动；代码恢复依据从 Git history 取得，不依赖 Quality checkpoint。
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
          选中的优化 SHALL 有可说明的实际收益、充分代码证据、目标语义与行为保持约束、相称的成本风险和可执行验证。Opt 与主 Agent 根据证据及委托约束判断价值，不要求固定收益等级或 CLI 门槛。用户给出的收益、范围、预算与停止条件 SHALL 遵守；没有新证据或实质进展的重复尝试 SHALL 停止，并在交付 Opt opinion 时记录处理结果。

          - **收益无法证明**：仅重排代码而无效果或收益依赖未知条件时，不声称已证明收益；获得适用证据后再判断是否实施。
        acceptanceCases: []
      - name: 语义变化形成新 Change
        body: |-
          改变 Expected Semantic Model 的建议 SHALL 形成新的 Change。

          - **建议会改变目标行为**

            - 候选方向不是行为保持优化
            - 它不在当前 Optimization 中实施
        acceptanceCases: []
      - name: 无需继续优化时完成
        body: 通过基线 Review 后，是否进行 Opt 由主 Agent 按实际情况决定；Opt 是可选阶段。执行 Opt 时，可交回具体问题修正或委托 fresh-context Opt 探索新机会，不要求主 Agent 先找到新方向。Opt opinion SHALL 汇总实际保留改动、收益和影响、行为保持依据、局部测试结果、失败/放弃事项及后续建议；不要求固定轮数或证明不存在更多机会。Opt 后是否追加 Review、是否扩大测试由主 Agent 按实际风险决定。适用的测试仍 SHALL 在执行过程中运行；Quality JSON 不保存测试输出或判断其客观成功。Seal 仅在基线 Review 通过且主 Agent 已明确记录 Opt opinion 或不做 Opt 的理由后成立。
        acceptanceCases: []
      - name: 在独立审查基线后开始
        body: 实际 Opt 修改 SHALL 只在优化前实现通过独立基线 Review 后开始。若主 Agent 不执行 Opt，Seal 前 SHALL 记录 `not_performed` 处置与简短理由，不伪造 Opt opinion。后续 Opt 可基于累计优化状态，不单因前轮改动要求新的基线 Review。
        acceptanceCases: []
      - name: 委托内执行与局部验证
        body: Opt SHALL 在主 Agent 确定的委托范围内自主发现、分组、合并、修改、补充并运行局部测试，可连续处理多个优化而不逐项交回。缺少对应测试时 SHALL 在修改实现前补充；低风险也必须测试。主 Agent 保留最终验证范围判断，Opt 自测不是独立 Review。建议仍有效时无需重新 fresh 扫描、排序；假设失效、建议不适用或有新机会时按需重评。
        acceptanceCases: []
      - name: 按证据处理问题
        body: Opt SHALL 区分优化引入的问题、优化前已存在且被基线 Review 漏掉的当前 Change 正确性缺陷、无关历史问题及需求契约冲突。优化问题可依据 Git 中实际代码状态局部修正或撤销；基线缺陷的证据 SHALL 交给主 Agent 判断并安排修复，可继续委托 Opt 或由主 Agent 处理，修正必须形成不同 Git commit，并经针对问题及影响的独立 Review 后才能作为已处理。无关历史问题记录在 Opt opinion 并告知，不自动扩大范围；需求契约冲突交给主 Agent 澄清，需要用户决策时询问用户，不擅改目标语义。无法确认恢复可靠时停止并交回主 Agent，不以未解决状态完成。
        acceptanceCases: []
      - name: 按实际影响确定文件范围
        body: |-
          Opt SHALL 以当前 Change 目标和证据化影响为界，按需追踪调用、依赖及其他调用方，允许必要的实现/测试文件新增、删除或移动，不固定为原文件列表或一层依赖。

          - **公共辅助函数**：优化当前 Change 新增的查询逻辑需要调整其调用的公共辅助函数，可以纳入，但必须检查其他调用方；顺便重构另一套无关查询系统超出本次委托。
        acceptanceCases: []
  element:optimizer:
    declaration:
      identity: optimizer
      kind: element
      parent: internal-agents
      title: Optimizer
      definition: Optimizer 是接受主 Agent 委托、在保持目标语义与行为的范围内完成可选优化的 Internal Agent，独立建模以明确受托写入与 commit-bound 意见交付责任。它独立读取当前依据，发现、分组或合并机会，修改相关实现与测试，执行局部验证并在交付时关联 base 与 result Git commits；代码历史和恢复由 Git 承载。最终验证范围、后续委托和 Change 收尾由主 Agent 判断，独立 Review 由 Reviewer 承担。
    sections:
      - name: 独立取得 Optimization 依据
        body: Optimizer SHALL 独立读取 Semantic Model、Change、当前代码、已通过的基线 Review 及其 commit、委托范围、项目证据和既有 Opt opinions。新探索使用 fresh context；恢复时主 Agent 确认旧写入者已停止后，由原 Opt 或接手者检查 Git history 与当前状态。Optimizer 不把主 Agent 的实现判断当作事实，也不依赖 Quality checkpoint。
        acceptanceCases: []
      - name: 交付结构化 Optimization 结论
        body: Optimizer SHALL 交付 `baseCommit`、`resultCommit` 与 Opt opinion。Opinion SHALL 说明实际保留改动、改善及影响范围与行为保持依据，测试覆盖行为、结果与证据位置，放弃事项及原因、是否撤销、遗留问题（无则明确说明），以及后续优化和验证建议与理由。CLI 生成 opinion identity 和 revision；Opt 不手工维护哈希或恢复记录。交付只表示本次意见已保存；主 Agent 决定是否继续、是否追加 Review 与最终验证。
        acceptanceCases: []
      - name: 在委托范围内修改并测试
        body: Optimizer SHALL 自主发现、分组、合并并实现相关优化，可修改、新增、删除、移动必要实现与测试文件；范围按当前 Change 目标与实际影响判断，按需追踪依赖和公共调用方。没有对应测试时 SHALL 先补测试再改实现，修改后运行局部测试并真实记录测试时状态。Opt 可按需保存中间恢复状态，不自行宣布整个 Change 完成或将自测作为独立 Review。发现实际影响超出预期时 SHALL 向主 Agent 交付该情况及依据，由主 Agent 调整验证范围或处理越界。
        acceptanceCases: []
      - name: 保存进展并可靠恢复
        body: Git SHALL 承载 Opt 形成的代码提交与恢复历史；Quality 不保存委托开始、暂停、进度或中间恢复位置。已交付 Opt opinion SHALL 关联起始 `baseCommit` 与交付 `resultCommit`。中断工作没有完成 opinion，主 Agent SHALL 在确认旧写入者停止后依据 Git history、working-tree status 和当前代码决定继续、修正或撤销；不得把未提交或未交付改动认定为已交付 Opt opinion。恢复不可靠时停止并交回主 Agent。
        acceptanceCases: []
      - name: 负责问题分流与取舍
        body: Opt SHALL 区分优化引入的问题、优化前已存在且被基线 Review 漏掉的当前 Change 正确性缺陷、无关历史问题及需求契约冲突。优化问题可修正或撤销并在 Opt opinion 中如实记录；基线缺陷的证据 SHALL 交给主 Agent 判断并安排修复，修正形成不同 Git commit 后须通过针对问题及影响的独立 Review。无关历史问题记录并告知，不自动扩大范围；需求契约冲突交给主 Agent 澄清，需要用户决策时询问用户，不擅改目标语义。恢复失败时按 Git 状态报告不确定性，不以未解决状态完成。
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
          Post-propose Validation SHALL 在确定性校验前将 change-local Contracts、`proposal.md`、`design.md`、Semantic Delta 与 `tasks.md` 联合对照 Explore 及 Propose 内的用户确认；不得仅以制品互相一致代替来源忠实性。已确认来源能确定修正方式时 SHALL 自行修正；需要改变已确认承诺、扩大范围或裁决重大业务及架构权衡时 SHALL 呈现全部发现，一次请求一个决策并等待确认。既定范围内细节 MAY 在完成时披露，但不得借此大量扩写设计。新确认的行为及推导补充的可观察保证 SHALL 贯穿 Delta 与 Plan，不只藏于 design 或 tasks。

          复核 SHALL 检查两段覆盖：已采纳且适用的记录内容到目标语义，以及需实施的目标语义到 `tasks.md` 的实施目标与验证方向。第一段 SHALL 按性质、决策状态与适用性筛选规范内容，逐项定位条件、数值、例子、反例、时序与例外的目标位置及摘录，并经 `xirang record coverage` 记录；影响目标的 pending 决策先解决，excluded 与 informative 不强造 Contract。第二段 SHALL 检查各目标行为与边界是否有相应实施目标和可观察验证方向，而非提前要求文件、命令、测试动作或逐项 executable Check。引用存在不证明行为被覆盖；双方共同遗漏的确认细节仍阻塞完成。缺失行为先补 Contract，再调整 Plan；未决意图交由用户裁决。

          - **检测到矛盾时自行修正**
            - 任务目标或验证方向与 change-local 目标语义冲突
            - 来源能确定修正方式时 SHALL 修正后继续复核，否则询问用户

          - **矛盾反映用户意图不对齐**
            - 已确认来源不足以裁决
            - SHALL 呈现发现并等待用户决定，不自行新增目标行为

          - **复核干净时无声继续**
            - 未发现矛盾或覆盖缺口
            - SHALL 进入确定性校验，不要求用户确认每一个制品

          - **复核由 Propose 完成**
            - Apply 启动实施
            - Apply SHALL NOT 重新执行 Formation 的计划一致性复核

          - **有效引用不代表实际覆盖**
            - tasks 引用的 Section 存在，但没有对应的目标或可观察验证方向
            - SHALL 补足计划，不能以引用存在宣称目标可验证

          - **目标到任务存在遗漏**
            - 目标 Contract 已表达条件分支而任务没有安排实现目标或验证方向
            - SHALL 补足相应目标与结果，不在任务内另造规范语义
        acceptanceCases: []
      - name: 完整机制自查
        body: |-
          Propose SHALL 用适用的边界或竞争事件序列检验机制、不变量、时序及验收结果，具体推演初始状态、事件顺序与预期结果，并检查实现方案能否落实这些结果；只列出场景名称不构成机制检查。发现问题时 SHALL 区分表达或推导错误与缺失决策。前者依据已确认设计修正，后者先向用户询问；结构合法与引用有效不能证明机制正确。

          SHALL 对支撑实施方案达成验收结果的关键假设应用方案评估要求：复用仍适用的证据，主动获取缺失证据并检查其可靠性与适用性，不限定证据来源，独立判断方案是否可行及能否在约束下达成预期结果，并向用户表达判断和关键理由。用户确认不自动成为可行性证据；方案失败本身不证明意图理解错误或目标不可实现。先定位事实判断、方案或意图理解中的问题，不能因自身方案失败就要求用户重述已清楚的意图。

          - **已采纳路线遇到反证**：来源已确认路线，但项目证据否定关键假设时，指出实际问题并按缺口处理规则修订或返回 Explore，不据确认宣称可行。
          - **推演中的方案失败**：先复核方案及假设；只有证据暴露意图歧义或约束冲突时才请求对应裁决，不能把一个方案不成立等同目标不可能实现。
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
          Project and Tooling Configuration SHALL 建立和维护息壤工作区、项目配置与所选 Agent 工具集成，并持续管理息壤托管的 Agent 工作面。工作面 SHALL 提供公共前置 skill 与六个阶段 skills：用户可只加载公共 skill 后用自然语言表达阶段或工作意图，由 Agent 读取相应阶段指导；也可直接加载阶段 skill，由 Agent 补齐公共指导。阶段确认与验证门禁 SHALL 继续适用。

          公共基础、阶段职责与专项指导 SHALL 分别组织，同一完整规则只在一个位置维护。指导 SHALL 按需加载；同一 Agent、同一项目中仍有效且可用的指导跨阶段复用，新 Agent、必要上下文丢失或指导更新时重新取得所需内容。静态指导复用 SHALL NOT 取消当前 Record、模型、配置、Git 或 Quality 状态的适用检查。

          - **建立新项目**：用户选择项目与 Agent 工具后，CLI 建立工作区、项目配置与对应工具集成，公共及阶段指导均可达。
          - **自然语言入口**：用户只加载 common 后说“探索一下这个需求”，Agent 读取 Explore 指导；用户直接加载 Explore 时补齐缺少的 common，保留已选阶段，不循环加载。
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
          Project and Tooling Configuration SHALL 从单一共享生成源向项目级 reference 交付 Element Definition 与 Element Contract 的边界及写作规则。Build、Explore、Propose 与 Snack SHALL 在涉及相应语义编写时通过明确入口读取该指导，并复用仍有效的已加载内容；阶段正文 SHALL NOT 承载同一完整规则。存储记法 SHALL 保持独立并按完整模型或 Delta 的当前编写需要读取。

          - **刷新 Agent 工作面**：四个入口指向可达的一致语义写作指导；普通阶段切换不重新注入完整正文。
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
          缺少有效 Design Summary 时，Propose SHALL 通过项目证据与针对性提问主动建立对问题、期望结果、约束、影响范围、方案及验证方式的理解，不把用户提供的路线当成完整意图。SHALL 解决影响目标的重大缺口，包括 Definition、Contract 与结构范围上的未决 Semantic Delta 决策；已明确内容直接复用，不使用固定问卷。

          - **用户直接进入 Propose**：对话中没有完整 Summary，用户只说“加一个缓存。”时，先理解要解决的问题及路线是否为明确约束，再判断语义就绪，不直接猜定目标。
        acceptanceCases: []
      - name: 查缺补漏与决策确认
        body: |-
          Propose SHALL 思考并与用户交互，组织实际 Change 草稿，提出想法并讨论成文时发现的问题。

          Propose SHALL 复用已确认决定及仍适用的证据，在推荐方案或认定方案就绪前，独立判断方案是否可行、能否在约束下达成预期结果。SHALL 主动获取缺失证据并检查其可靠性与适用性，不限定证据来源，并向用户表达自己的判断和关键理由。MAY 自主处理既定范围和方案内的细枝末节、案例组织与表达或推导修正；不得以合理补充为名自主大量扩写或替用户形成实质设计。补出的分支、默认值、错误结果及限制 SHALL 对照确认来源，不能静默改变承诺。

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
          Propose SHALL 以 Change Plan 分别解释意图与范围、关键方案决策、待完成目标及验证方向，而不以任务重新定义目标语义。`proposal.md` SHALL 表达动机、范围和语义来源影响；`design.md` SHALL 表达关键决策、理由和取舍，可保留用户确认的技术落点；`tasks.md` SHALL 用于与用户对齐实施目标和应验证的行为、边界及可观察结果。Propose SHALL NOT 预先猜测具体待修改的代码或测试文件、执行命令与一般技术实施顺序；用户明确要求的次序 SHALL 保留在 Plan 中。

          - **Change 需要审查与执行**
            - Agent 形成 Plan
            - Plan 提供职责清晰且不重复维护目标语义的三份文档
        acceptanceCases: []
      - name: 完成 Formation 审查与确认
        body: |-
          Propose SHALL 默认连续编写完整 Change 后集中交用户审阅，用户明确要求交互推进时才 SHALL 按一项机制及其目标、验证方向分段展示实际草稿，听取反馈并继续；不按制品、Element 数量或写作依赖机械设置审阅轮次。无论模式，遇到影响当前目标的重大缺口 SHALL 先说明选项与理由、等待用户裁决；批量模式不授予猜测决策的权力。

          Formation 内 SHALL 对照确认来源检查完整机制、制品一致性和适用边界/竞争序列，不以制品互相一致或 CLI 通过代替语义判断。新确认的决策及允许自主处理的可观察细节 SHALL 贯穿 Delta 与 Plan；推导内容不得写回为用户确认。影响当前目标的未决问题阻塞完成。

          - **默认批量**
            - 用户未要求分段交互
            - Propose SHALL 在决策齐备时形成完整 Change 再集中审阅

          - **用户要求交互**
            - 用户明确希望边写边审
            - Propose SHALL 按机制展示包含对应目标与验证方向的实际草稿，反馈后再推进

          Propose SHALL 检查支持实现预期结果的证据及关键假设；用户确认本身不证明可行性，方案失败本身不证明意图理解错误或目标不可实现。SHALL 区分事实判断、方案缺陷与意图理解缺口，按已确认依据修正可确定的错误，重大方案调整或目标与约束冲突按决策确认规则处理。
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
          存在记录时，完整 Change 通过确定性 validation 后，Propose SHALL 按共享规则区分性质、决策状态与适用性，对需落实的已采纳规范条目执行原子细节覆盖，并检查 pending 问题对就绪的影响，并通过 `xirang record coverage` 记录结果；CLI 拒绝时 SHALL 先把缺失细节补进目标 Contract 或 Delta，再重新检查并记录，不得以笼统描述代替逐项结果。Propose SHALL 在请求用户接受最终 Change 前完成 coverage，审阅期间保持记录活动；用户提出修改时 SHALL 调和适用的记录内容、Delta 与 Plan，重新校验并对最新目标记录 coverage。只有用户接受与当前 coverage 对应的最终 Change 后，Propose SHALL 通过 `xirang record consume` 向该 Change 交接。consume 复核来源版本、目标指纹与结构，不重复执行覆盖检查；覆盖过期、结构不一致或其他前置失败时保留来源且不声明 Formation 完成。豁免或无记录时 SHALL 跳过覆盖记录与消费，但仍须在用户接受最终 Change 后完成 Formation，同时保留已声明的记录决策，不建立空记录。来源快照与覆盖结果不参与 Expected Semantic Model。

          - **交接成功才完成 Formation**

            - validation 通过、覆盖结果有效且结构比对一致，用户接受最终 Change
            - consume 保存精确来源快照与覆盖结果并完成 Formation

          - **审阅期间再次修改**

            - 已运行 coverage，用户审阅时确认补充或修订，Record 或 Delta 改变
            - 保持活动 Record，重新校验并对最新来源与目标运行 coverage；接受后才 consume

          - **覆盖检查被拒绝**

            - `xirang record coverage` 报告某条目的例子没有落位，或记录结构与目标不一致
            - 补齐目标并重新检查、记录 coverage 后提交用户审阅，不提前 consume

          - **Consume 失败**

            - `xirang record consume` 返回失败
            - 保留来源且不声明 Formation 完成，按共享恢复协议处理

          - **豁免时跳过消费但保留决策**

            - 来源已声明豁免
            - 跳过覆盖记录与消费，用户接受最终 Change 后完成 Formation
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

          Propose Role SHALL 复用有效的已确认理解；缺少有效 Summary 时，主动取证并通过针对性提问理解问题、目标、约束、方案及验证方式，不将候选路线当成完整意图。成文时检查方案及关键假设的证据；确认不证明可行，方案失败不自动证明意图误解或目标不可达。已有依据能确定的错误自行修正；涉及已确认承诺或重大取舍时说明选项并请求裁决，不重复询问已明确内容。
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
          Propose SHALL 优先复用 conversation 中已确认的 `Design Summary`，忠实文档化已确认设计。它 MAY 在既定范围内自主处理细枝末节、组织案例和目标及修正表达或推导错误，不得自主大量扩写实质设计；新发现的重大决策点 SHALL 先说明选项与推荐，再一次一问等待用户确认。小范围内容与方案调整可在 Propose 内交互确认并维护记录；需要重新设计实验判断可行性或大幅重做设计时返回 Explore；完成披露不能代替决策前确认。没有有效 Summary 时 SHALL 通过项目证据与针对性提问建立对问题、期望结果、约束、影响范围、方案和验证方式的理解，不把用户给出的路线视为完整意图；解决影响目标的缺口及未决 Source decisions 后判断 semantic readiness，不得使用输入长度或技术关键词评分。Readiness 与 override 结果 SHALL 只存在于对话状态，不得写入 artifacts。

          Propose SHALL 复用已确认决定及仍适用的证据，在推荐方案或认定方案就绪前，独立判断方案是否可行、能否在约束下达成预期结果。SHALL 主动获取缺失证据并检查其可靠性与适用性，不限定证据来源，并向用户表达自己的判断和关键理由。

          - **复用 Design Summary**
            - conversation 包含已确认的 Design Summary
            - Propose 说明正在复用，向 proposal、Delta、design 与 tasks 分发适用的确认内容
            - SHALL NOT 重新执行字符数或 detail score 判断

          - **Semantic readiness 不完整**
            - 任一 readiness 项缺失或 Source decision 未决
            - Propose 在对话中列出具体缺口；孤立决策可就地询问，大幅设计工作建议 Explore
            - readiness 通过或被明确 override 前 SHALL NOT 创建 change 或写入制品
            - 新决策确认前 SHALL NOT 将依赖它的内容写成确定方案

          - **用户显式 override**
            - Propose 已报告 readiness 缺口且用户明确要求直接生成
            - Propose 接受 override 但 SHALL NOT 猜测影响 behavior 或 architecture 的关键决策；必要确认无法取得时报告阻碍

          - **无 Summary 的最低就绪条件**
            - 问题、期望结果、约束、影响范围、方案与验证方式均明确且不存在影响 Source 的未决决策
            - Propose 说明就绪并继续，不因涉及多个 subsystem 就强制返回 Explore

          - **测试安排分发**
            - 已确认测试策略含过时测试原因或一次性验证
            - 过时原因写入 design；tasks 只记录对应目标与要验证的结果，包括删除后的缺失结果，不预定测试文件、动作或一次性命令
            - Apply 在实施时判断具体测试更新、删除与一次性验证，不制造多余持久测试

          - **Routing decision 不污染 artifacts**
            - Propose 报告 readiness、缺失项或 override
            - 这些运行过程信息 SHALL 只保留在对话，不写入 Change 制品

          - **已有充分上下文**：复用已明确内容，继续成文，不为完成流程重复提问。
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
          Propose SHALL 默认只在 readiness、blocker 与 final summary 节点输出流程状态；用户要求交互模式时 SHALL 在按机制展示草稿的审阅节点与用户讨论，而不逐制品播报进度。需要用户决定时 SHALL 一次询问一个问题。

          - **Readiness 状态**
            - Propose 完成 semantic readiness 判断
            - SHALL 报告 Design Summary reuse、readiness 或具体 gap

          - **最终总结**
            - Propose 完成 artifacts、validation 与 report generation
            - SHALL 汇总 artifacts、errors/warnings、effective diff review 与 ready-for-apply 状态
            - SHALL 区分沿用的确认、合理推导细节及依据和位置、Propose 内新确认决策与未决事项；无补充或新决策时明确说明
            - SHALL 区分实际 CLI 结果、Agent 语义检查与证据缺口，不以制品数量或引用合法代替实际覆盖，不另建补充台账
            - 影响目标或方案的未决决策 SHALL 阻塞 ready-for-apply

          - **Blocker 状态**
            - identity、source decision、validation 或 effective diff 阻塞流程
            - SHALL 报告必要 blocker，需用户决定时一次问一个问题
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
          Propose 生成 `tasks.md` 时 SHALL 按用户能审阅的目标行为而非代码文件、组件或规范条目数量组织任务；每个目标 SHALL 说明需要验证的行为、边界和预期可观察结果，并指向相应 Contract，而不复制完整规范或提前选择测试边界、动作、文件与命令。相关提示词、受管生成面及实现由 Apply 在同一目标下形成可验证闭环。Propose SHALL 对照已确认来源、目标 Contract 和任务目标/验证方向检查语义覆盖，不能仅核对引用存在；缺少目标行为时先修正 Contract。只有用户指定的实施次序 SHALL 排列为任务先后并在 design 或 proposal 至少一处说明；普通技术依赖由 Apply 在现场判断。

          - **跨组件目标**
            - 多个实现面交付同一行为
            - Propose SHALL 作为同一目标与验证方向呈现，不按文件类型拆分

          - **边界与例外**
            - 目标 Contract 含适用条件、例外或时序
            - Propose SHALL 确认任务的验证方向包含相应可观察结果，不为每个 Acceptance Case 机械建立 Check

          - **用户指定先后次序**
            - 用户要求 A 完成后才能推进 B
            - tasks SHALL 把 A 放在 B 前，design 或 proposal 至少一处说明依据；业务时序或数据状态约束 SHALL 由 Delta Contract 表达

          - **就绪复核**
            - 目标语义已确定，Propose 准备声明可实施
            - SHALL 检查每个待实现目标有可理解的任务与验证方向，未规定普通任务必须预先达成独立 GREEN 或列出全部实际依赖
        acceptanceCases: []
      - name: Propose 使用制品定义先行写作
        body: |-
          每个 artifact 写入前，workflow SHALL 读取 resolved definition，按 content boundaries 路由语义，再执行 artifact instruction 与 template。Delta Contracts SHALL 只包含 target-state 的 Sections 与 Acceptance Cases；Acceptance Case SHALL 描述特定条件下的可观察行为，SHALL NOT 规定实现结构、文档排版、说明性措辞、标题顺序或测试拆分，除非该精确表示本身就是可观察契约；完成 artifacts 后 SHALL 使用统一 change compiler 审阅 effective changes。

          - **Acceptance Case operations 通过 diff 审阅**

            - Agent 已完成 delta Contracts、design、结构目标与 combined validation
            - SHALL 通过 validate --change <name> --preview 显式请求并审阅 concise preview
            - 非预期 operation SHALL 阻塞 ready-for-apply 并要求修正 source

          - **Sections 按 Behavior Source 生成**

            - propose 创建 change-local Contracts
            - SHALL 只消费 proposal Behavior Source 中的 Element identities
            - SHALL 读取 Formal Contract 的 exact Section titles 后 author delta

          - **Specs boundary 不重复定义**

            - workflow 生成 Contracts
            - SHALL 按需读取共享制品 reference 中的 resolved definition 与 Element-owned Contract delta authoring 指导
            - SHALL NOT 在 workflow template 维护竞争的 behavior boundary

          - **Acceptance Case 写行为而非排版**

            - Propose 编写或修改 Acceptance Case
            - Acceptance Case SHALL 描述条件与可观察结果
            - SHALL NOT 把生成文档标题、段落顺序或完整例句当作行为，除非该精确 token 本身是对外协议
        acceptanceCases: []
      - name: 按复杂度组织交互审阅
        body: |-
          Workflow SHALL 默认引导 Propose 在材料决策齐备时连续编写完整 Change 后集中审阅；只有用户明确要求交互推进时 SHALL 按一项机制或一组相关 Elements 的实际草稿及其目标、验证方向分段审阅，反馈后继续。简单变更可只有一组，不按 Element 数量或 artifact 写作顺序机械停顿。两种模式下，新发现的重大缺口都 SHALL 及时提出并等待裁决，批量模式不授予 Agent 猜测未确认决策的权力。

          Workflow SHALL 在最终校验后、请求用户接受 Change 前运行适用的 `record coverage`，并在审阅期间保持活动记录；用户反馈改变记录或目标时重新校验并记录覆盖结果。只有用户接受与当前覆盖结果对应的最终 Change 后，Workflow 才 SHALL 执行 `record consume` 并报告 Formation 完成；无记录时仍须等待用户接受，不将 CLI 通过视为接受。
        acceptanceCases: []
  element:quality:
    declaration:
      identity: quality
      kind: element
      parent: change-implementation
      title: Quality
      definition: Quality 是 Change Implementation 中以 commit 绑定的 Review 意见、可选 Opt 意见与 Seal 声明协调项目实现判断并控制进入 Change Closure 的阶段。它确保每个 Change 具有通过的独立基线 Review、明确的 Opt 处置及主 Agent 对 Seal commit 的声明；Review 负责独立判断，Optimization 负责保持目标语义的改进，CLI 负责意见关联和记录门禁，不负责代码恢复或当前工作区新鲜度判定。
    sections:
      - name: Review 通过后建立 Baseline
        body: Quality SHALL 在 Opt 或 Seal 前要求至少一条通过的 `full-change` Review。Review opinion 绑定已提交且在审查期间 HEAD 不变的 Git commit；完整 Review 失败后的修正形成不同 Git commit 并重新审查。通过的完整 Review 是后续 Opt 的基线，不证明 Opt 以后的改动经过独立审查；Quality 不为 commit 保存代码恢复状态。
        acceptanceCases: []
      - name: 成功优化推进 Checkpoint
        body: 最终状态完成主 Agent 判断所需的全部验证且证据仍适用时，Quality SHALL 保存最终 successful checkpoint。优化中的中间状态按恢复需要保存；局部测试通过不自动构成最终成功，也不要求每个方向 commit 或 Review。
        acceptanceCases: []
      - name: 失败优化恢复 Checkpoint
        body: 优化引入的问题 SHALL 依据实际证据局部修正或撤销并验证，保留其他可靠优化，不因测试或 Review 失败固定整批回滚。合并后无法直接定位时 MAY 拆分、二分或采用更合适方法；各部分单测通过但组合失败时 SHALL 检查组合影响。无法确认局部恢复可靠时 SHALL 恢复到可确认基线；仍无法确认时停止并交回主 Agent，不以未解决状态完成。
        acceptanceCases: []
      - name: 保留失败方向与优化历史
        body: Quality SHALL 在唯一质量 JSON 中保留 Review opinion 历史及 Opt opinions，包含已放弃方向、原因和处理结果，以供主 Agent 后续判断并避免重复尝试。该记录保存意见，不保存代码快照、测试输出或恢复事件；Git 承载代码修改和恢复历史。
        acceptanceCases: []
      - name: 仅以最新成功状态完成
        body: 优化前实现 SHALL 先通过独立 Review。主 Agent SHALL 根据累计优化改动、行为保持依据与测试覆盖确定最终验证范围并简短说明理由；测试必需，全量测试和优化后增量 Review 按实际风险决定，不增加固定风险审批。已确认的当前 Change 基线正确性缺陷 SHALL 修复并通过针对问题及其影响的独立 Review。只有所需验证全部完成且通过、证据对应当前状态、交付完整且无未解决的正确性或恢复问题时，才可保存最终 successful checkpoint 并完成。基线 Review 不证明后续改动经过独立审查；无需追加 Review 的判断不记为 Reviewer PASS。后续代码变化 SHALL 重新判断受影响的验证。
        acceptanceCases: []
      - name: 收口后确认可进入 Change Closure
        body: Quality SHALL 仅在基线 Review 已通过、Seal 前已有明确 Opt 处置、且主 Agent 已记录有效 Seal 声明时允许 Change 进入 Change Closure。已执行 Opt 的处置 SHALL 包含 opinion 及 `baseCommit`、`resultCommit`；未执行 Opt 的处置 SHALL 包含简短理由。Seal 声明 SHALL 绑定一个 Git commit，并由主 Agent 声明该版本可运行且预期通过适用测试。CLI 不执行测试、不保存测试输出、不要求工作区 clean、不要求 Seal commit 等于 HEAD 或工作区内容，也不要求在 Seal 或 Archive 前单独提交 Quality JSON。Archive 的 Quality 门禁只确认 Seal commit 对象仍存在。
        acceptanceCases: []
      - name: 活动 Change 的显式重新验证
        body: |-
          用户明确要求活动 Change 从头重新验证时，Quality SHALL 在原流程已停止、无旧执行者或待处理写入与恢复后，在同一 Change 保留原代码、commits/checkpoints、旧记录和失败原因，并建立新的验证依据。新基线 SHALL 由 fresh-context Reviewer 重新审查，旧 PASS 只作历史参考；不修改历史冒充新结果。普通修正、局部撤销和中断续跑 SHALL 继续原委托，不自动变为从头重验。

          - **同代码重审**：用户因旧证据不可信要求从头 Review/Optimization，即使代码相同也取得新的独立 Review，保留旧历史。
          - **旧执行者未结束**：Reviewer 或 Opt 仍在运行时，不开启并行重验或更换写入者。
          - **旧格式记录**：不支持的旧记录给出诊断并原样保留，如何继续由主 Agent 与用户判断，不自动转换成新完成结论。
        acceptanceCases: []
      - name: 按阶段与证据缺口推进
        body: Quality SHALL 按 `full-change` Review、主 Agent 决定的可选 Opt、Opt 处置与 Seal 顺序推进。Review findings、WARNING 和 Required Corrections 由主 Agent 判断和处理；Quality 不自动修改 `tasks.md`。Opt 后 `incremental` Review 由主 Agent 按风险决定；发现并修复完整 Review 漏掉的原有 Change 缺陷后必须执行 `supplemental` Review。没有有效 Seal 不得进入 Change Closure。
        acceptanceCases: []
      - name: 单一 Quality Record 承载意见与 Seal
        body: Quality SHALL 仅将 Review opinions、Opt opinions 或明确不做 Opt 的处置及当前 Seal 声明持久化在每个 Change 的一个 Git-tracked JSON 文档中。代码状态、执行过程、测试输出与恢复状态不复制进该文档；CLI 对更新执行原子写入与 revision compare-and-swap。
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
      definition: Review 是 Quality 中由 clean-context Reviewer 独立评估实现正确性的活动，独立承载基于证据的结论与修正意见。每条 Review opinion 绑定一个已提交的 Git commit；Review 不修改项目、不管理代码恢复，也不替主 Agent 决定优化价值或最终验证范围。
    sections:
      - name: 在每次 Apply 修改后执行
        body: 普通 Apply 完成所有目标与 Required Corrections 后 SHALL 在 Opt 前执行 `full-change` Review；被审查实现 SHALL 先提交为 Git commit 且本次所需测试已由主 Agent 运行通过。Review 不通过时，主 Agent SHALL 处理修正、形成新的修正 commit 并重新执行完整 Change Review，直到通过。Opt 后的 `incremental` Review 按主 Agent 对累计改动及其影响的风险判断安排；完整 Review 漏掉的既有 Change 缺陷经修复后 SHALL 执行针对缺陷及其影响的 `supplemental` Review。
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
        body: Review SHALL 在受托质量维度内评估完整性、正确性、一致性、项目约束和必要清理。`full-change` 覆盖完整累计 Change；`incremental` 覆盖受托的累计 Opt 改动与受影响行为；`supplemental` 覆盖原有 Change 缺陷的修复与影响。按维度分工时，每位 `full-change` Reviewer 在自己的维度内仍审查完整 Change；委派覆盖不到完整 Change 时交回主 Agent 重新委派，不产生 FAIL opinion。主 Agent收齐维度结论后合并为一条意见，失败或未解决的必需维度不得合并为 PASS。
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
        body: 基线 Review 通过后，项目状态 SHALL 具备 baseline checkpoint 资格。优化中的 Review 通过仅满足其实际范围内的独立验证要求，最终 successful checkpoint 仍以主 Agent 确定的全部验证通过且证据当前为条件。
        acceptanceCases: []
      - name: 结论绑定被评估状态
        body: Review opinion SHALL 关联实际审查 checkout 的 HEAD Git commit、`reviewKind`、`result`、`summary` 与 `findings`。Reviewer 从不可变 `baseCommit` 与 HEAD 的提交树差异定位累计 Change，审查期间只以已提交 HEAD 内容作为实现证据；未提交内容不属于该意见。HEAD 在审查期间变化时停止并报告主 Agent，不返回意见；后续实现改变不得重绑旧意见。只有通过的 `full-change` Review 才允许进入 Opt 或满足 Seal 的完整审查门禁。
        acceptanceCases: []
      - name: 修改后重新 Review
        body: 失败的 `full-change` Review 所需修正 SHALL 形成不同 Git commit，并针对新 commit 重新 Review。Opt 改动不自动触发独立 Review；主 Agent判断是否安排 `incremental`，但已确认的当前 Change 原有缺陷的修复必须安排 `supplemental` Review。已经执行且失败的 Review 不得因不同类别的意见而被掩盖；后续意见准确绑定各自审查的 commit 与类别。
        acceptanceCases: []
  element:reviewer:
    declaration:
      identity: reviewer
      kind: element
      parent: internal-agents
      title: Reviewer
      definition: Reviewer 是从受托 checkout 的 HEAD 独立取得已提交证据、判断项目实现是否符合 Expected Semantic Model 的只读 Internal Agent，独立于实现者与主 Agent 的风险决策。它按 full-change、incremental 或 supplemental 委托评估实际相关工作并交付绑定所审查 commit 的 opinion、Required Corrections 或证据缺口；不修改项目或任务，也不决定优化价值与最终验证范围。
    sections:
      - name: 独立取得 Review 证据
        body: |-
          Reviewer SHALL 从主 Agent 提供的 `changeName`、绝对 `projectRoot`、`reviewKind` 与选定的质量维度独立取证；`projectRoot` 指向实际被审查的 checkout，`changeDir` 从该目录与 `changeName` 得出。Reviewer 从该 checkout 的 HEAD 读取审查 commit，从 Change 的隔离元数据读取 `baseCommit`，以 `git diff <baseCommit> HEAD --name-only` 定位累计 Change，以 HEAD 的已提交内容及必要的 Semantic Model、Change 与项目证据判断，不以未提交工作区内容或实现对话替代证据。Reviewer SHALL 根据累计差异、相关 Semantic Model 关系、仓库搜索和 Section 关键词主动识别并读取相关实现与测试文件，包括未修改文件；每个判定相关的文件均在判断前读取。

          Reviewer SHALL 在返回前核对 HEAD 是否仍为开始时取得的 commit。输入、Git 基线或委派无效，或者审查期间 HEAD 变化时，停止并向主 Agent 报告原因，不生成 opinion；有效审查的结论仅适用于实际审查的 commit 和受托工作。
        acceptanceCases: []
      - name: 交付结构化 Review 结论
        body: Reviewer SHALL 向主 Agent 交付包含 `reviewKind`、所审查 HEAD 的 `commit`、`result`、自然语言 `summary` 与 `findings` 的 Review opinion。`full-change` 在受托质量维度内审查完整累计 Change；`incremental` 审查主 Agent 指定的累计 Opt 改动及受影响行为；`supplemental` 审查完整 Change Review 漏掉的原有 Change 缺陷修复及影响。多个质量维度由主 Agent 汇总为一条意见；Reviewer 不把自身或 Opt 的测试结果当作其他维度已审查的证明。阻塞问题和证据缺口交由主 Agent 处理。
        acceptanceCases: []
      - name: 保持只读且不修改项目与任务
        body: Reviewer SHALL 只读审查，不修改项目、Change 制品、`tasks.md`、Quality JSON、Checkpoint 或 Git history，也不创建或恢复代码状态。可用工具不限制上述职责；发现问题只返回评估结果，后续修正与任务状态由主 Agent 负责。
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
  "relationship:neovim\0consumes\0cli":
    source: neovim
    kind: consumes
    target: cli
  "relationship:neovim\0supports-presentation\0text-presentation":
    source: neovim
    kind: supports-presentation
    target: text-presentation
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

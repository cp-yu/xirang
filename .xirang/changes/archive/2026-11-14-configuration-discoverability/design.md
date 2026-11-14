## Context

沿用 Explore 的完整 Design Summary 与 CLI-managed `configuration-discoverability.md`。现有配置能力集中于 project-config、config-projection、config-prompts 和 config 命令，setup 创建带说明的文件，但成功输出不介绍配置入口；update 只按路径补默认值并清理少量旧字段，甚至会重建缺失配置。当前 common 通过额外 reference 交付简短配置规则。

`optimization.enabled` 的引用仅覆盖解析、默认值、校验与展示，当前 Apply 优化步骤没有消费它；模型仍有旧控制承诺，需与用户确认的主 Agent Opt 决策一致。outline 配置及结果名使用 elementDefinitionDepth，而命令参数已经是 --definition-depth。

使用 TypeScript、Node.js ESM、Commander 和已有 YAML/Zod 能力，不增加依赖。模型复用承担持续职责的现有 identities，局部合并过细或重复节点并调整两处父级；不新增 Elements，不修改 Relationships/Views。模型重构不要求实现代码按树形同构搬迁。

## Goals / Non-Goals

**Goals:**

- 让配置可发现、可理解、可验证，并支持用户直接编辑或 Agent 按授权修改。
- 让公共配置规则直接可用，背景与操作配置的读取范围清晰。
- 建立独立配置版本和最近 10 次迁移操作的升级机制，保护文件与用户内容。
- 移除无效优化配置，统一 Definition 加载深度命名。

**Non-Goals:**

- 本次不适配无版本旧配置，不提供缺失/损坏配置恢复。
- 不新增跨项目个人偏好、通用阶段提示词、自动学习、harness 自动修改或文件监听。
- 不实现组合仓库继承、递归搜索或多项目合并；解析器显式接收项目根，避免将配置逻辑绑定到全局单例，为未来具体仓库优先留出边界。
- 不改历史归档、无关 CLI 输出或既有 Quality 证据机制。

## Decisions

### 1. 共享字段定义与统一解析结果

在现有项目配置层组织显式字段描述，复用 Zod 类型/取值校验和 functional defaults；字段元数据包括路径、说明、作用范围、默认来源、可选示例及文件引用性质。字段名称及枚举不在 CLI 说明、YAML 生成器和检查器中分别维护。`rules` 的动态键取当前 schema 合法 artifact IDs；配置路径与退役节点使用明确名单。

有效读取继续使用现有归一化管线。严格检查读取同一来源值和默认语义，补充原始字段诊断与来源，而不单独发明回退结果。检查原始 YAML 是 CLI 的确定性职责，不要求 Agent 解释 raw YAML。普通运行命令的字段级容错与 check 严格错误分级并存。

未选择把全部规则塞进 context：那会丢失字段类型、作用范围及 CLI 验证能力。也不预建未来偏好字段；真实缺口出现后再扩展。

### 2. 命令与输出职责

config 默认动作展示说明，不依赖已 setup 项目。project 保留紧凑有效值查询及 --select/--artifact；check 默认详细，不加筛选/精简表面。help 与 setup 引导列出三者职责，界面文案采用用户允许的英文。

JSON 检查结果包含活动路径、版本及支持窗口、逐项有效值/来源/作用域和可检查性等请求数据；警告、错误遵循现有 stderr 结构化诊断约定，文本采用相同信息。检查器聚合独立错误，不以首项非法值中断所有检查。有效引用的存在性检查发生在 check，普通 decomposition 解析仍不负责磁盘存在性判断。

setup 配置引导作为必要使用提示放入 stderr，避免污染可能的数据输出；这显式调和原有 setup 无必要输出约束，不恢复泛化成功摘要。update 的实际迁移/清理项也以具体提示交付，不重复“成功”回执。

### 3. 配置文件与受管说明

setup 使用共享字段定义生成完整说明、功能性默认值和可选注释示例，基线 configVersion 1。已有配置不整体重生。未来迁移对版本对应的字段路径和已知受管说明做局部修改，保留仍适用用户内容。

已有 YAML 的格式保护不能仅靠解析后整体 stringify：其可能重新排版。优先使用现有 YAML 文档/CST 的位置与节点信息，将变更限制在被修改的节点和明确受管说明范围；没有依据的注释不自动删改。受管说明的历史版本由对应迁移显式描述，避免字符串前缀或正则推断所有权。必要时添加缺失说明，重复应用应无变化。

现有 migrateProjectConfigDefaults 的“缺失即创建”分支退出 update。缺失、损坏和无版本配置保留原样并诊断；普通工具工作面刷新保持现有可独立执行边界，不将配置恢复混入刷新职责。配置路径选择统一保留 .yaml 优先和 .yml 回退。

### 4. 有界迁移注册与原子写回

configVersion 与软件发布版本独立，仅在需要迁移配置内容时递增。CLI 显式维护迁移操作的起止版本及操作函数，构建/测试守卫仅保留最近 10 次；不存每个项目的冗余迁移日志，项目当前版本是迁移起点。

执行顺序：解析并检查版本 → 解析完整所需链并验证窗口 → 在内存处理全部步骤 → 校验最终目标 → 一次原子提交内容与版本 → 报告实际改动。检查或步骤失败不写磁盘；写入使用同目录独占临时文件和 rename 替换的现有模式，不先删除目标。异常清理临时文件，目标失败时原文件完整。跨平台路径使用 Node.js path API；复用质量记录原子写入的模式，不套用其 Quality revision/锁协议到配置。

当前版本不重复迁移。configVersion 缺失/非整数/小于 1 不推断基线；较新版本不降级且提示使用支持它的新 CLI；超窗口说明当前版本、目标及最低可接受起点，用户使用支持前段链的旧 CLI 中转。不自动下载执行旧 CLI，也不在所需链缺失时先迁移部分内容。

本次基线 1 不添加虚构的 0→1 迁移。未来真实配置变化才增加迁移步骤；窗口引擎的边界可用受控迁移样本验证，不为填满 10 个名额而生产空迁移。

### 5. common 与修改 reference

把配置基本使用规则合入 common，并加入 context 的 CLI 查询入口；阶段入口已经补读 common，独立 Agent 仍按自身上下文取得指导。缺少 context 无额外义务，查询失败说明事实，诊断/编辑指导不以查询先成功为循环前提。

context 可复用；Apply isolation、Archive Git、制品 rules 等仍按适用场景读取。不依靠监听感知外部编辑，Agent 自己修改后用重新读取核对新值。

完整编辑协议通过 `references/configuration-edit.md` 生成到项目根 `xirang-configuration-edit.md`。用户明确修改请求触发加载；协议规定用户授权、临时/长期范围、字段选择、内容保护、验证和简短报告。普通编辑不递增 configVersion，只读角色不因 common 中有入口而获得写权限。

停止生成旧 configuration-use reference，将 `xirang-configuration-use.md` 加入现有显式受管清理清单；同步修改 build/archive、共享 authoring/model-context 片段和所有受管生成面中的入口。不得仅删文件而保留悬空引用，也不保留两份完整规则。该一次性切换由本 Plan 安排；目标 Contract 直接规定 common 的使用规则和 edit reference 的修改协议职责。

### 6. 无效优化配置与 outline 名称

从项目和全局 schema/默认值/加载结果、规范化接口和生成说明退出整个 optimization 节点。已知退役路径在检查/设置时有明确诊断，不借未知字段保留机制复活。普通读取保持只读；未来版本迁移的明确删除可处理磁盘陈旧项。

同步修改配置字段和 outline JSON 名称为 definitionDepth，命令 --definition-depth 不变。删除 Apply 的“配置驱动优化控制”及提示词的“简单变更快速路径识别”Section，不以新段落复述可选 Opt；主 Agent 的决策与验证责任由现有 Quality 和 Apply 的“以委托交付推进优化”等条款承载。Archive 的完成条件直接表达当前所需证据。

### 7. 局部模型职责重构

配置管理按作用域形成完整同级集合：项目配置、全局工具配置。项目配置统一承载文件读取、字段解析、默认值、有效投影及消费范围，单字段默认值是其 Section 内的约束。工作面投影按交付对象形成 skills、内部 Agent 制品、共享 references 三类；共享生成、工具适配、受管同步与长度/一致性约束由整体能力承担。语义写作和质量协作作为有独立内容的指导，归于 references；业务规格标准继续细化语义写作指导。

| 原职责来源 | 目标承载位置 | 处理依据 |
|---|---|---|
| config-projection | project-config-loading 的语言、context、rules、消费范围及归一化 Sections | 投影是项目配置对消费者的契约，不与配置作用域并列 |
| apply-default-isolation | project-config-loading 的功能性默认值 Section | 保留 ask 默认值和 worktree 用户值案例，按版本迁移保护内容 |
| artifact-pipeline | agent-workbench-projection 的共享生成、工具适配、确定性变换及一致性 Sections | 跨交付对象共用的机制由整体能力完整承担 |
| skill-template-length | agent-workbench-projection 的长度约束 Section | 保留 200/500、所有变体、逐文件与分组诊断及具体边界案例 |
| snack-workflow-manifest | agent-workbench-projection 的固定工作流登记；skill-generation 的 Snack 指导 | 六个工作流统一登记，Snack 不形成平行注册机制 |
| workflow-templates | skill-generation 的读取、阶段、复用与委派入口；agent-prompt-guidance 的完整质量协议 | skill 承担阶段流程，独立 reference 承担完整专项协议 |
| snack-skill-generation | skill-generation 的 Snack 工作指导 Section | 保留证据来源、条件更新和不生成 tasks.md 的行为 |
| authoring-conventions、agent-prompt-guidance | references-home 的子 Elements | 独立指导内容按主题细化共享 reference 交付 |

对被合并的每个来源 Section 检查职责去向。现行承诺包括 docLanguage 读取别名、context 50KB 边界、规则原文、Git 枚举与默认值、decomposition 路径校验、内部 Agent 权限和用户 model 保留；不因节点减少而取消。原有过程说明中的源文件必须不存在、过渡 modeMembership 标签、占位 Definition 补齐及指定实现调用方式不作为独立目标能力；实际清理由本 Plan 与实施验证负责。

冲突按当前项目定义及已确认行为调和：配置默认值不含 optimization；update 受 configVersion 与迁移链控制；rules 校验由有效配置层进行；任务制品采用 Goals/Contract/Verify；REMOVED 只声明 identity；质量流程使用 Review、可选 Opt 与 Seal，不以四状态 checkpoint 表替代。Proposal 表达原因、范围、来源与影响，具体版式不作为另一套规范。

重构使用用户授权的本地组织判断。删除节点前 `arch plan-remove` 未发现待处理的关系、View 或子节点引用；Expected Model 仍须通过完整校验。删除的 Element 身份不作为兼容别名。两个保留指导的 parent 调整不改变其业务职责，business-specification-standard 的 parent 保持 authoring-conventions。

### 8. 具体能力的 4+N Contract

引入 capability-specification Kind，显式声明 required 与 business-specification。配置、config 命令、工作面交付、初始化/更新与 outline 共 13 个能力 Element 使用此 Kind。每份完整目标 Contract 都按 Scope and Non-goals、Business Logic、Edge Cases and Exception Handling、Key Acceptance Cases 组织；所有案例位于关键验收 Section 内。当前这些能力的相关机制可由四个基础 Section 完整表达，无需为满足“+N”而添加独立条目。

公共概念、Agent 工作身份、共享写作与质量指导仍用通用格式。父能力保留自身层级的完整承诺，子能力细化字段、分支、交付与失败结果。没有改变职责的 Element 保留 identity；格式改变通过 Declaration Kind 与完整 Section Delta 联合表达，不改变实现文件结构。

重排将同层正常机制、异常结果及具体案例分别归位，保留 10 次迁移、5/3/15 版本案例、50KB 边界、200/500 行限制、context 和 rules 原文、Git 枚举、路径保护、权限及用户 model 设置。任务与记录覆盖改指当前四部分 Section。

完整阅读发现的局部冲突依据当前契约调和：CLI 无必要结果成功时静默，update 不再要求 Already up to date 或工具成功摘要；全局 --scope 规则只适用于全局管理子命令；六个 skill 的精确名字包含 xirang-apply-change 和 xirang-archive-change，不用工作流 ID 机械拼名。所有权清理由明确名单与受管依据限定；非活动 workspace 的用户确认迁移仍保留为当前条件行为。

### 9. Semantic Delta 制品身份统一

semantic-model schema 使用 proposal、semantic-delta、design、tasks 四个制品 ID。semantic-delta 和 design 依赖 proposal，tasks 依赖 semantic-delta 与 design，apply 依赖 tasks 并跟踪 tasks.md。Semantic Delta 的生成匹配仍为四分区输出，模板仍为 delta.md，零差量仍使用 .delta-noop；只有 Relationships 或 Views 时也构成非空差量，不要求虚构 Element Contract 或完成标记。

用户已确认统一更名，不能仅改 rules 键。Apply 同步源 schema 的 ID/依赖/指导、help 的 authoring 映射、Propose/Snack 与共享 guidance-loading 消费入口、项目 rules 以及生成 reference。静态交付使用 xirang-artifact-semantic-delta.md，动态规则读取使用 `xirang config project --artifact semantic-delta --select rules --json`，状态和模板结果也使用同一 ID。目标 Contract 直接表达统一身份及消费结果。

已核对的实现入口包括 schemas/semantic-model/schema.yaml、src/commands/help.ts、src/core/templates/workflows/propose.ts、snack.ts 和 fragments/guidance-loading.ts。生成文件从源模板刷新，旧 xirang-artifact-specs.md 按明确受管清单清理，所有受管加载引用同步切换。检查工作流 manifest 与反馈示例中指向实际制品身份的用法，保留普通 specs 词汇、无关合成 schema 测试和历史归档；不做全仓库盲替换。

## Risks / Trade-offs

- [本次 breaking change 使无版本旧项目不能自动升级] → 明确基线和诊断；用户或 Agent 适配，不能假填版本号绕过必要改动。
- [字段说明与解析规则分歧] → 共享定义、默认值及运行时归一化，以组合行为校验，避免复制字段表。
- [YAML 整体序列化破坏排版/注释] → 局部文本或节点变更，维护非受管内容保留样本；无依据不删除用户说明。
- [迁移半写入] → 完整链预检、内存计算与最终校验后原子替换；明确执行失败时内容和版本均不变。
- [文件引用在检查后变化] → check 只说明检查时可用，消费时仍按现有缺失引用门禁处理，不把报告当永久证明。
- [去掉短 reference 却遗漏调用者] → 同时检查模板、生成面、清理清单和引用完整性，不依靠文件名模式找所有权。
- [有限历史导致很旧项目需多次安装 CLI] → 接受该成本以限制框架维护容量，报告可执行的版本范围，不自动安装。

## Migration Plan

本次一次性删除、重命名及源模板/生成面清理安排由本 Plan 承载。目标 Contract 描述当前配置字段、输入处理和指导分工，不复述“停止生成”“不再加载”或历史替换过程。既有 Contract 中混入的 decomposition-use 历史段落也从本次完整目标 Section 中清除；实施不增加对该文件的删除逻辑，保留自定义方法及项目设置。

本次新基线为 configVersion 1，definitionDepth 采用新名，optimization 不再生成或生效。Apply 同步本项目实际配置到新基线并保留有效设置；不在 Propose 修改项目实现或正式模型。外部旧项目由用户/Agent 完成初次适配，不创建无版本兼容路径。

本项目现有 rules.specs 下的四条规则在 Apply 与运行时 schema 一起移至 rules.semantic-delta，规则原文保持；proposal 规则保持生效。Propose 期间实际 CLI 仍识别 specs，因此本阶段保留实际配置旧键。基线 1 采用新身份，不为此次更名增加无版本自动兼容；旧键按未知制品规则诊断。

后续版本用明确迁移注册辅助 update，保留最近 10 次操作及对应清理说明。软件与配置格式若需回退，通过 Git/安装版本处理，不新增自动配置降级能力。

## Test Maintenance

局部模型重构重点验证规范承诺与读取入口的保持，不新增仅锁定旧 Element 数量或名称的实现测试。工作流登记、工具变换顺序、跨平台安装、200/500 长度限制、内部 Agent 模型设置和角色边界复用现有行为验证。

复用 project-config、config-schema、global-config、setup、update、config/help 与模板同步的现有测试。替换要求 optimization 生效、update 创建缺失配置、旧 outline JSON 字段和旧 use reference 存在的断言；保留字段级容错、规则原文、作用域选择和路径相关有效覆盖。

制品更名复用 artifact-graph、workflow commands、instruction-loader 和 config 的行为测试，验证新 ID 的依赖就绪、状态键、模板映射、authoring help 内容和 rules 原文选择；覆盖仅关系、仅 View、零差量标记以及未完成四种状态，核对受管生成引用可达。

新增行为只补最低必要边界：check 聚合/分级/只读与 JSON；引用可读性；元数据版本；迁移窗口、预检、执行中失败、最终校验失败及写入失败保护；成功内容版本一致；非受管注释保留与重复 update。通过受控迁移样本覆盖 10 次链和窗口外，而不发布空迁移。

模板持久验证保护读取命令、必要协议 token、停止条件、禁止操作及引用完整性，不锁普通散文、标题顺序或例句。Agent 授权与长期/本次区分应以场景和加载轨迹检查，不以普通措辞相等代替行为。

## One-time Verification

构建和类型检查；实际检查 setup/help/config 三个入口的说明可理解性；以临时项目完成 setup → 查看 → 修改 → check → update → 再 update，确认只读命令、用户内容和提示一致。安排 Windows CI 验证跨平台行为；路径预期使用 path.join/path.resolve，兼顾 CRLF、空格与文件系统大小写差异，不改变项目根相对 POSIX 配置记法。

对删除的 `agent-prompt-guidance` / Section “简单变更快速路径识别”与 `apply-quality-integration` / Section “配置驱动优化控制”，一次性核对配置控制引用已清理；对旧 use reference 同步核对源模板、生成文件与加载入口，不以普通历史禁令文字建立长期测试。

上述是实施期验证安排，本阶段未运行实现测试，不据此声称通过。

## Open Questions

无影响本次目标的未决设计问题。实现技术细节按已确认原子性、内容保护和职责边界展开，若发现需要改变承诺的选择，再由用户裁决。

格式重构的验证包括完整 Expected Model 的 Kind/4+N 门禁、非空 Acceptance Cases、目标引用、全部已确认记录细节覆盖及旧 Section 移除；未实施前不以结构通过声称运行行为通过。

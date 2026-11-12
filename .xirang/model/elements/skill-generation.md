---
entity: element-declaration
identity: skill-generation
kind: element
parent: agent-workbench-projection
title: Skill Generation
definition: Skill Generation 是息壤公共与阶段 skill 的生成能力。它独立承载公共基础、专项指导入口和合法 frontmatter 的交付边界，供各工作流在需要时获得同源规则；阶段业务流程与用户决策由对应工作身份承担，工具安装与同步由工作面投影承担。
---

## Specification

### Section: Xirang Philosophy 片段定义

系统 SHALL 在共享片段常量中提供 `XIRANG_PHILOSOPHY` 共享片段。该片段 SHALL 以英文书写，不受 prose language projection 管辖，并 SHALL 只表达项目定义：Xirang 是可被 Agent 编译的 human intent 的结构化表述；Semantic Model 是唯一权威语义，由模型分区与 Element-owned Contract modules 共同构成；Change 将 Semantic Delta reconcile 到 target steady state，proposal/design/tasks 是 compilation scaffolding；模型只有在 Agent 无需猜测影响 hierarchy、contracts 或 relationships 的决策时才完整；Agent 执行类似 compiler 的操作，现有代码是 current implementation evidence。

- **片段定义统一 Semantic Model**

  - `XIRANG_PHILOSOPHY` 被读取
  - 文本 SHALL 声明 Xirang 是可被 Agent 编译的 human intent 的结构化表述
  - SHALL 声明模型分区与 Element-owned Contracts 共同组成一个 Semantic Model
  - MUST NOT 使用双源作为核心定义

- **片段定义 completeness 与 Agent compiler 类比**

  - model 缺少会改变 hierarchy、contracts 或 relationships 的决策
  - 文本 SHALL 说明 Semantic Model 尚不完整
  - SHALL 禁止 Agent 通过猜测补足该决策
  - SHALL 将 compiler 表述为 Agent 操作类比，而非真实 compiler 或持久化 IR

- **片段排除操作规则**

  - `XIRANG_PHILOSOPHY` 被读取
  - 文本 MUST NOT 包含制品定义先行写作、canonical syntax 或 validation gate 指令
  - MUST NOT 包含独立 AST/IR pipeline、static analysis pass 或 decompilation 类比

- **片段定义统一 Xirang Semantic Model**

  - `XIRANG_PHILOSOPHY` 被读取
  - 文本 SHALL 声明 Xirang 是可被 Agent 编译的 human intent 的结构化表述
  - SHALL 声明 模型分区 与 element-owned Contracts 共同组成一个 Semantic Model
  - MUST NOT 使用 `durable semantic source` 或 Behavior/Architecture 双源作为核心定义

- **片段定义 scaffolding 与 reconciliation**

  - `XIRANG_PHILOSOPHY` 被读取
  - 文本 SHALL 声明 change 朝 target steady state reconciliation Semantic Delta
  - SHALL 声明 proposal、design、tasks 是 compilation scaffolding，而非竞争性的 source of truth

### Section: Xirang Philosophy 注入 workflow skill 模板

Skill Generation SHALL 将完整 `XIRANG_PHILOSOPHY` 交付于 `xirang-common`，六个阶段 skills SHALL 声明公共前置依赖，正文不内联该完整片段。common SHALL 承载统一语义依据、identity 等基本约束，以及阶段选择、按需加载和复用规则；专项细则通过单一 reference 提供。

用户可以只加载 common 后通过自然语言选择阶段，也可以直接加载任一阶段 skill；Agent SHALL 在开展该阶段工作前取得缺少的公共指导，已加载且仍有效时复用。单独加载 common SHALL NOT 无条件加载全部阶段或专项指导。

- **common 入口**：只加载 common 后说“进入 Explore”，Agent 读取 Explore 并按其职责工作。
- **阶段入口**：直接加载 Explore 且 common 尚不可用，Agent 补读 common 后继续 Explore；不得要求用户先手动调用 common。

### Section: Xirang Philosophy 注入 internal subagent 模板

Reviewer 与 Optimizer 的生成角色指导 SHALL 引用公共 skill 取得 Philosophy 和适用的公共基础，不内联其完整副本。每个独立 Agent SHALL 从自己的有效上下文判断是否已取得指导，主 Agent 已加载不代表子 Agent 已加载。加载公共 skill SHALL 保留受托角色与范围，不重新选择用户阶段，也不改变独立取证和角色权限。

其他 internal surfaces SHALL 只加载自身职责实际需要的指导，不因公共 skill 存在而预加载全部协议。公共内容生成源 SHALL 显式记录使用方与适用边界。

- **独立 Reviewer**：主 Agent 已读 common，fresh Reviewer 仍取得自身需要的公共指导，再按只读审查角色取证。
- **恢复上下文**：必要指导已不可用时，子 Agent 补读对应内容，角色与委托范围保持不变。

### Section: skill frontmatter 必须生成合法 YAML

系统 SHALL 将 skill template 的 `name`、`description`、`license`、`compatibility` 与 metadata 字段作为可解析的 YAML 字符串写入 `SKILL.md` frontmatter。

- **description 包含 YAML 敏感字符**

  - skill template 的 `description` 包含 `sync:`、双引号或换行
  - 生成的 frontmatter MUST 能被 YAML parser 解析
  - 解析后的字段值 MUST 与原始 template 字符串语义一致

- **init 和 update 生成的 skill 文件**

  - 用户运行 `xirang setup` 或 `xirang update` 生成 skill files
  - 生成的 frontmatter MUST 能被 YAML parser 解析
  - 测试通过解析后的字段校验语义，而不是依赖未加引号的 YAML 表面格式

### Section: 共享生成结构拆分 guidance

Skill Generation SHALL 从单一生成源为 Build、Explore、Propose、Snack 交付短加载入口：仅在形成或重组 hierarchy 时，通过 `xirang config project --select decomposition --json` 取得有效指导路径并完整读取；不可读时停止相关结构形成，不替换方法。阶段直接使用该入口，不通过独立的 decomposition-use reference 再转发。

父子语义精化、同层 MECE、BF 与方法权限边界 SHALL 由共享 semantic-authoring reference 承载。项目方法在这些框架约束内决定分解维度、概念边界和细化程度；项目专属内容不进入通用规则。框架方法要求每个 sibling set 沿同一维度、在已确认范围内相互独立且完整；BF 先形成并检查完整同层结构再向下细化，不自动要求每层等待用户，也不禁止根据后续发现回修上层。用户确认按当前工作流的决策与授权规则进行。

- **项目自定义**：配置指向项目方法时采用该方法的具体分解选择，仍遵守框架基础；不能以自定义为由取消 MECE、父子精化或已确认承诺。
- **BF 与裁决**：同层结构已有依据且符合约束时可以继续细化；涉及未决实质选择时先裁决，不把该选择当作确定结构推进。
- **无结构需求**：Contract-only 工作及不形成 hierarchy 的阶段不因公共依赖加载分解方法。
- **一致投影**：各工具的加载语义一致，并遵守已有 skills/references 长度约束。

### Section: 项目分解方法创建指导

Skill Generation SHALL 交付按需读取的 `.xirang/references/xirang-decomposition-authoring.md`，并在 common 的按需指导表提供创建或修改项目 decomposition 的入口；普通使用方法时不额外加载该指南。

创建指导 SHALL 引用共享 semantic-authoring 取得框架约束，指导作者说明项目如何选择分解维度、识别有意义的 Element 边界及判断何时继续细化，必要时使用项目例子。它不重复定义框架规则、不要求固定方法模板、不新增工作流。

方法 SHALL 保存在项目维护的独立 Markdown 文件中，通过现有 decomposition 配置选择，而非修改框架生成的默认方法。现有项目根相对路径和 references 裸名称解析语义保持；在 macOS、Linux 和 Windows 上均通过同一有效配置与投影机制定位文件。

- **创建或修改方法**：读取创建指南和仍缺少的共享依据，再编写项目特有方法；已有且仍有效的指导复用。
- **日常使用**：阶段加载配置选中的方法，创建指南不因它存在而被预加载。
- **用户内容保留**：刷新框架指导时，项目方法文件与显式 decomposition 值保持；新指南不把用户方法变成受管默认文件。

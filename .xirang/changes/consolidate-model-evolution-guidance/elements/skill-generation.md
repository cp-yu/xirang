---
entity: element-declaration
identity: skill-generation
kind: element
parent: agent-workbench-projection
title: "Skill Generation"
definition: "Skill Generation 是息壤公共与阶段 skill 的生成能力。它独立承载公共基础、专项指导入口和合法 frontmatter 的交付边界，供各工作流在需要时获得同源规则；阶段业务流程与用户决策由对应工作身份承担，工具安装与同步由工作面投影承担。"
---

## MODIFIED Sections

### Section: 共享生成结构拆分 guidance

Skill Generation SHALL 从单一生成源为 Build、Explore、Propose、Snack 交付短加载入口：仅在形成或重组 hierarchy 时，通过 `xirang config project --select decomposition --json` 取得有效指导路径并完整读取；不可读时停止相关结构形成，不替换方法。阶段直接使用该入口，不通过独立的 decomposition-use reference 再转发。

父子语义精化、同层 MECE、BF 与方法权限边界 SHALL 由共享 semantic-authoring reference 承载。项目方法在这些框架约束内决定分解维度、概念边界和细化程度；项目专属内容不进入通用规则。框架方法要求每个 sibling set 沿同一维度、在已确认范围内相互独立且完整；BF 先形成并检查完整同层结构再向下细化，不自动要求每层等待用户，也不禁止根据后续发现回修上层。用户确认按当前工作流的决策与授权规则进行。

- **项目自定义**：配置指向项目方法时采用该方法的具体分解选择，仍遵守框架基础；不能以自定义为由取消 MECE、父子精化或已确认承诺。
- **BF 与裁决**：同层结构已有依据且符合约束时可以继续细化；涉及未决实质选择时先裁决，不把该选择当作确定结构推进。
- **无结构需求**：Contract-only 工作及不形成 hierarchy 的阶段不因公共依赖加载分解方法。
- **一致投影**：各工具的加载语义一致，并遵守已有 skills/references 长度约束。

## ADDED Sections

### Section: 项目分解方法创建指导

Skill Generation SHALL 交付按需读取的 `.xirang/references/xirang-decomposition-authoring.md`，并在 common 的按需指导表提供创建或修改项目 decomposition 的入口；普通使用方法时不额外加载该指南。

创建指导 SHALL 引用共享 semantic-authoring 取得框架约束，指导作者说明项目如何选择分解维度、识别有意义的 Element 边界及判断何时继续细化，必要时使用项目例子。它不重复定义框架规则、不要求固定方法模板、不新增工作流。

方法 SHALL 保存在项目维护的独立 Markdown 文件中，通过现有 decomposition 配置选择，而非修改框架生成的默认方法。现有项目根相对路径和 references 裸名称解析语义保持；在 macOS、Linux 和 Windows 上均通过同一有效配置与投影机制定位文件。

- **创建或修改方法**：读取创建指南和仍缺少的共享依据，再编写项目特有方法；已有且仍有效的指导复用。
- **日常使用**：阶段加载配置选中的方法，创建指南不因它存在而被预加载。
- **用户内容保留**：刷新框架指导时，项目方法文件与显式 decomposition 值保持；新指南不把用户方法变成受管默认文件。

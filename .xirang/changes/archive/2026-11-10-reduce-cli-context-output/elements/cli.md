---
operation: MODIFIED
entity: element-declaration
identity: cli
kind: element
parent: interaction-surfaces
title: "CLI"
definition: "CLI 是息壤的配置与确定性操作界面。它建立和维护息壤工作区、项目配置与所选 Agent 工具集成，提供模型与 Change 查询、状态管理、程序化校验、验证证据持久化及原子状态转换，并投影供 Agent 按需读取的工作指导、模板与 references。它负责可复现的操作和明确的结果与诊断，不替代用户授权或 Agent 的语义判断。"
---

## MODIFIED Sections

### Section: 提供一致可复现的操作

CLI SHALL 管理工作区、项目配置与 Agent 工具集成，并为 Realization 提供结构化查询、状态管理、静态工作指导与模板的文件投影、程序化校验、验证证据持久化和原子状态转换。有效配置、Change 制品及推进状态、Quality 详情 SHALL 分别可由 config project、status --change 与 quality status 查询；静态写作与推进指导 SHALL 由按需读取的 skill/reference 承载。

Agent 需要查询、校验、同步、提升或归档时，CLI SHALL 对相同有效输入产生一致结果，并以明确失败语义拒绝无效操作。

### Section: 提供 Neovim Change 审阅投影

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

### Section: 写回 Neovim 的目标模型微调

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

## ADDED Sections

### Section: 统一结果与诊断通道

整个 CLI SHALL 将 stdout 限于请求的数据或必须交付的结果，将警告与错误写入 stderr；成功以退出码 0 表达，失败以非零退出码及具体诊断表达。无返回数据且无警告的成功操作 SHALL 使 stdout 与 stderr 均为空，默认和 --json 模式均不得输出仅为确认成功的消息、{"ok":true} 或 {}。--json SHALL 决定有数据时的编码，诊断也 SHALL 使用结构化 JSON，不重复输出成功/失败 envelope。

查询 SHALL 返回所请求的数据，包括有效的空查询结果；已知缺口作为状态查询的结果表达，不冒充命令执行失败。调用方需要继续引用的新身份、Quality revision 与 Candidate reviewDigest SHALL 作为必要结果返回。完整 Contract、snapshot 与 review projection 的请求范围 SHALL 完整保留，不自动摘要或截断。导出位置、completion script、反馈提交 URL 及必要的手工提交材料 SHALL 按其实际交付职责返回。

CLI SHALL 保留 Semantic Model 的 identity 引用语义、Quality revision 的 CAS 语义及 Candidate reviewDigest 的精确内容绑定，不以输出精简移除这些机制。

- 一次配置写入成功且无警告：文件完成写入，默认与 --json 的两条输出流均为空，退出码 0。
- 查询没有活动 Change：返回可识别的空集合，退出码 0，不以空 stdout 代替查询结果。
- 查询返回有效配置但发现被忽略的非法配置项：stdout 返回配置，stderr 返回对应警告，退出码仍为 0。
- 写入输入非法：退出码非零，stderr 包含具体原因及适用定位；不在 stdout 再输出错误对象。
- Quality 写入成功：返回新 revision，不回显刚提交的完整 opinion 或 success envelope。

### Section: 保持非交互输出简洁

非交互调用 SHALL 不输出 spinner、加载进度、颜色装饰或成功装饰文本。真实警告、错误、必要后续凭据及显式请求的完整数据 SHALL 保留。显式请求详细信息时，输出 SHALL 仅展开该命令请求的范围，不因 --json 自动增加额外内容。

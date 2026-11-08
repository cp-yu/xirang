---
entity: element-declaration
identity: cli
kind: element
parent: interaction-surfaces
title: CLI
definition: CLI 是息壤的配置与确定性操作界面。它建立和维护息壤工作区、项目配置与所选 Agent 工具集成，管理息壤配置，并在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
---

## MODIFIED Sections

### Section: 提供 Neovim Change 审阅投影

`xirang show <change> --review --json` SHALL 只读编译当前 Semantic Model 与指定活动 Change，返回供 Neovim 审阅的结构化投影。有效 Change 的投影 SHALL 包含该 Change 四分区中实际存在的全部 Delta 源文件；每个源文件 SHALL 恰有一份对应的完整当前模型文件文本与一份完整 Expected Semantic Model 文件文本，并保留该模型文件中未参与变化的内容。源文件条目 SHALL 保留 entity、identity 与 operation 信息。投影 SHALL 包含 Change 中实际存在的 `proposal.md`、`design.md`、`tasks.md` 文本。模型两侧文本 SHALL 使用同一确定性序列化方式；Relationship Delta 文件对应完整关系容器。该模式 SHALL 返回有效性与诊断，且 SHALL NOT 写入模型、Change 或临时文件。

- **读取有效 Change 投影**

  - 用户或插件运行 `xirang show sample --review --json`
  - JSON 按 Delta 源文件返回一组 source，每组包含该文件的 entries、单份完整 `before` 文本与单份完整 `after` 文本，以及存在的 Plan 文件内容、valid 状态与 diagnostics
  - 同一 Delta 源文件中有多个 entries 时，仍只返回一份 `before` 与一份 `after`
  - 未变更的 Section 与其它文件内容继续包含在完整模型文件文本中
  - ADDED 对象在当前侧以空内容表示，REMOVED 对象在目标侧以空内容表示
  - 不存在的 Plan 文件不出现在 Plan 文件集合中

- **Relationship Delta 文件含多条操作**

  - 一个 `relationships/<kind>.yaml` 包含同一关系容器中的多条 Delta 操作
  - 当前侧与目标侧分别返回完整关系容器内容，不只返回 Delta 中的关系条目

- **Change 无效**

  - Change 编译不能形成有效 Expected Semantic Model
  - 输出 `valid: false` 与 diagnostics，且 SHALL NOT 将部分模型内容作为可审阅的有效目标返回

- **保持普通 Show 输出不变**

  - 用户运行 `xirang show sample --json` 而未指定 `--review`
  - CLI 保持原有 JSON 输出结构与含义

- **审阅投影不改变持久状态**

  - 用户或插件请求审阅投影
  - Semantic Model、Change 与 Plan 文件保持不变
  - CLI 不创建审阅 artifact 或临时文件

## ADDED Sections

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

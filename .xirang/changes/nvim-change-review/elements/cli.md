---
entity: element-declaration
identity: cli
kind: element
parent: interaction-surfaces
title: CLI
definition: CLI 是息壤的配置与确定性操作界面。它建立和维护息壤工作区、项目配置与所选 Agent 工具集成，管理息壤配置，并在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
---

## ADDED Sections

### Section: 提供 Neovim Change 审阅投影

`xirang show <change> --review --json` SHALL 只读编译当前 Semantic Model 与指定活动 Change，返回供 Neovim 审阅的结构化投影。有效 Change 的投影 SHALL 包含该 Change 四分区中实际存在的全部 Delta 文件、每个 Delta 文件对应的当前模型与完整 Expected Semantic Model 文件文本，以及 Change 中实际存在的 `proposal.md`、`design.md`、`tasks.md` 文本。模型两侧文本 SHALL 使用同一确定性序列化方式；Relationship Delta 文件对应完整关系容器。该模式 SHALL 返回有效性与诊断，且 SHALL NOT 写入模型、Change 或临时文件。

- **读取有效 Change 投影**

  - 用户或插件运行 `xirang show sample --review --json`
  - JSON 返回 Delta source 文件清单、source 到当前／目标模型内容的映射、存在的 Plan 文件内容、valid 状态与 diagnostics
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

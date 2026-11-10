---
operation: MODIFIED
entity: element-declaration
identity: change-archive
kind: element
parent: change-closure
title: "Change Archive"
definition: "Change Archive 是在 Quality Seal、Sync、任务和最终验证门禁通过后封存活动 Change 的能力。它将活动目录原样移动到带日期的归档位置，保留最终来源及证据；后续 Git 流程由 Agent 按 Archive 工作指导推进。它不创建或重算展示制品，不修改正式模型，也不执行 Git 写操作。"
---

## MODIFIED Sections

### Section: Artifact Completion Check

Archive 流程 SHALL 在归档前检查 artifact 完成状态：任一 artifact 状态非 `done` 时列出未完成 artifacts 并要求用户确认后才可继续；全部完成时无 warning 继续。该检查独立于 task completion 与 quality/sync gates。

- **Incomplete artifacts warning**

  - agent 通过 `xirang status --change "<change-name>" --json` 检查 artifact 状态
  - 一个或多个 artifact 的状态非 `done`
  - 显示列出未完成 artifacts 的 warning
  - 提示用户确认是否继续
  - 用户确认后继续

- **All artifacts complete**

  - agent 检查 artifact 状态
  - 全部 artifacts 的状态为 `done`
  - 无 warning 继续

- **Archive a change with all artifacts complete**

  - agent executes `xirang archive` with a change name
  - all artifacts in the schema are complete
  - all tasks are complete
  - the agent moves the change to `.xirang/changes/archive/YYYY-MM-DD-<name>/`
  - 返回必要的归档位置，不附成功装饰或通用状态摘要

### Section: Archive Process

Archive SHALL 在 quality、sync、task 与 final change validation gates 通过后，将 active change directory 原样移动到 date-prefixed archive path。Archive MUST NOT 再次修改 Formal Semantic Model，也不得创建、重算或覆盖任何 View presentation artifact。effective diff 仅由只读 `xirang validate --change <name> --preview` 以 ephemeral text/JSON 输出提供，不持久化。

- **直接归档**

  - 所有 gates 通过且 change directory 存在
  - SHALL 运行只读完整校验并以退出码确认结果及 fingerprints 当前，不要求解析成功文字
  - SHALL 将 change directory 原样移动到 `YYYY-MM-DD-<change-name>`
  - SHALL 返回必要的归档位置，后续 Git 指导由 Archive workflow 承载
  - SHALL NOT 创建、重算或覆盖任何 presentation artifact
  - SHALL NOT 执行 git 写操作

- **已归档 change 检测**

  - target archive path 已存在且 active change 不存在
  - SHALL 返回已有归档位置后退出，不重复 Git handoff 指导

- **Final validation 失败**

  - final change validation 失败
  - SHALL 终止 archive
  - active change directory SHALL 保持原样

- **归档失败不回写**

  - 任一 archive gate 失败
  - SHALL 不移动 change directory
  - SHALL NOT 修改 Formal Semantic Model

- **封存已同步的 change 与证据**

  - archive gates 确认 graph 与 contract operations 已 sync
  - SHALL 将 active change directory（source delta 与既有证据）原样移动到 archive
  - MUST NOT 重写 Formal content
  - MUST NOT 生成 review report 或 presentation 文件

### Section: Display Output

Archive SHALL 保留实际 gate 诊断与必要归档位置，不在默认成功输出中重复 Quality/Sync/task/validation 摘要或 Git handoff 提醒。Quality、同步或任务门禁失败时 SHALL 给出具体原因；--no-validate 的 unsafe warning SHALL 保留，未验证不得声称 Passed。

CLI SHALL 不声称执行过测试、Seal commit 匹配当前 HEAD/工作区或存在 successful checkpoint，不重新判断意见文本充分性，不创建 Git commit。Archive 完成后 SHALL 由 Agent 按既有工作流继续提交 Change 与 Quality JSON，Seal 或 Archive 前不要求单独提交质量记录。

## REMOVED Sections

### Section: Archive CLI 输出 git handoff 提醒

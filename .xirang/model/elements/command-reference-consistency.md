---
entity: element-declaration
identity: command-reference-consistency
kind: element
parent: cli
title: Command Reference Consistency
definition: Command Reference Consistency 定义活动命令引用与当前 CLI surface 的一致性契约：active user-facing 文档、模板、skills、prompts 与 active Specs 的命令示例必须与 `xirang --help` 一致；stale 引用清理须在生成源头进行，并按类别报告残留。
---

## Specification

### Section: Active command references match the current CLI surface

息壤 SHALL 保持 active user-facing documentation、generated workflow templates、Agent instructions、skills、prompts 和 active Element Contracts 中的命令示例与当前 `xirang --help` 一致。

- **Project setup 与 Build references**

  - active surface 描述项目 setup、Project Build、Candidate validation 或 promotion
  - SHALL 使用 `xirang setup`、`xirang-build` 和 `xirang candidate init|status|validate|promote`
  - SHALL NOT 引用退役命令名或 bootstrap 工作流名称

- **Formal validation references**

  - active surface 描述 Candidate promotion 后的 formal validation
  - SHALL 使用 `xirang validate --all --strict`
  - SHALL NOT 将 change quality gate 描述为 Project Build promotion gate

- **Quality command references**

  - active surface 描述代码质量验证与优化
  - SHALL 使用 `xirang quality review|optimize|status|seal`
  - SHALL NOT 引用 `xirang verify`、`--type` 或相位编号

- **Historical references**

  - retired references 仅位于 `.xirang/changes/archive/**` 或 `.xirang/history/**`
  - SHALL 将其与 active stale references 分开报告
  - SHALL NOT 修改历史证据

### Section: Command-reference cleanup is source-backed

息壤 SHALL 在生成 stale 命令引用的源头清理它们，而不仅在生成的副本中清理，只要生成的 surface 可以重新创建 stale 文本。

- **生成文件有模板源**

  - stale 命令引用出现在生成的 skill、command、prompt 或 Agent instruction 文件中
  - 实现 SHALL 识别是否有源模板或 transform 发出该文本
  - 如果源存在，更新源使重新生成不会重新引入 stale 命令
  - 仅在需要时更新生成的副本以保持仓库一致

- **历史归档 artifacts 不是默认清理目标**

  - 在 `.xirang/changes/archive/**` 下发现 stale 命令引用
  - 它们 SHALL 默认视为历史证据
  - SHALL NOT 修改，除非它们被用作当前 user-facing guidance

### Section: Cleanup verification reports remaining stale references by class

Command cleanup SHALL 通过可重复审计按 active docs、source templates、generated skills、help/completion、active Element Contracts 和 historical evidence 分类报告 stale references。

- **清理后审计**

  - Project Build surface 切换完成
  - active classes SHALL 不包含退役命令或工作流 references
  - audit SHALL 单独报告 archive/history 中允许保留的 occurrences

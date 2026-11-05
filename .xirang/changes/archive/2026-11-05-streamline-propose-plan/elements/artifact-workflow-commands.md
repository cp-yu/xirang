---
entity: element-declaration
identity: artifact-workflow-commands
kind: element
parent: deterministic-operations
title: Artifact Workflow Commands
definition: Artifact Workflow Commands 定义 artifact workflow CLI 行为：`status`、`instructions`、`templates` 与 `new change` 命令面，面向 scaffolded 与 active changes，包括 artifact 完成状态展示、enriched instructions、模板路径解析、schema apply block 与 apply instructions 生成。
---

## MODIFIED Sections

### Section: Instructions Command

系统 SHALL 为 scaffolded 与已有 Changes 输出创建 artifact 的 enriched instructions。semantic-model 的 `tasks` instructions SHALL 只要求目标级任务、对应可观察验证方向及目标级完成 checkbox，不要求 Propose 提供 `Files`、`Sections`、nested executable `Checks`、`Test action`、命令或具体测试路径；需要验证的行为与边界 SHALL 指向相应目标 Contract，不以任务正文独立定义行为。Apply instructions SHALL 指导 Agent 现场选择测试并以实际证据判断目标完成。CLI SHALL 只支持目标级 `tasks.md`；旧式任务文件不迁移且不受支持，需重写后继续使用。

- **展示 enriched instructions**
  - 用户运行 `xirang instructions <artifact> --change <id>`
  - 输出 artifact metadata、template、依赖状态与可解锁 artifacts；JSON 模式输出结构化结果

- **Tasks instructions 是目标级**
  - 用户运行 `xirang instructions tasks --change <id> --json`
  - SHALL 返回粗粒度 `### Task N:` 目标、目标级 checkbox 与验证方向的模板和指令
  - SHALL NOT 强制 Propose 提前选择文件、测试动作、命令、用例数量或技术依赖

- **可观察目标而非空泛工作**
  - 目标涉及错误输入、缺陷修复、行为保持或删除
  - instructions SHALL 提示写出相应可观察结果与边界，并引用目标 Contract 或既有 Contract，不要求预置 executable Check

- **非运行时文本的验证方向**
  - 目标只影响无运行时消费者的文本制品
  - instructions SHALL 不要求人为失败测试；config、schema 与模板有消费者时仍须验证行为

- **Apply instructions 的行为验证**
  - 用户运行 `xirang instructions apply --change <id> --json`
  - SHALL 要求 Apply 依据现有测试选择合适动作，行为与代码目标通过实际 RED/GREEN 证据；目标完成状态不得先于证据

- **未知 artifact 与阻塞依赖**
  - 用户请求未知 artifact 或尚有未满足依赖的 artifact
  - CLI SHALL 给出有效 IDs 或列明缺失依赖及警告

- **Scaffolded change**
  - 用户在只有 change 目录时请求 proposal instructions
  - CLI SHALL 返回模板、定义与元数据，不要求现有制品

- **目标锚点**
  - 任务的验证方向引用目标 Contract
  - instructions SHALL 使用 Element identity 和 Section 名定位语义；不要求 Propose 构造文件路径式 `Verifies:` 或 `Preserves:`，不支持旧式 Check 路径锚点

- **不预列删除文件**
  - 目标涉及删除或替换行为
  - instructions SHALL 写出要消失或被替换的行为，不预列 `Delete:` 文件清单；Apply SHALL 根据当前项目证据定位实际文件

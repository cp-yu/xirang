---
entity: element-declaration
identity: instruction-loader
kind: element
parent: deterministic-operations
title: Instruction Loader
definition: Instruction Loader 是制品定义、模板与 Change 上下文的加载能力。它独立承载模板解析、制品依赖与完成状态加载，将静态指导供工作面文件投影、动态状态供 status 查询；不生成混合当前配置、状态和静态提示词的指令响应，也不承担目标语义创作。
---

## Specification

### Section: Template Loading

系统 SHALL 从 schema 目录加载 templates。

- **Load template from schema directory**
  - `loadTemplate(schemaName, templatePath)` 被调用
  - 系统从 `schemas/<schemaName>/templates/<templatePath>` 加载 template

- **Template file not found**
  - template 文件在 schema 的 templates 目录中不存在
  - 系统抛出带 template path 的错误

### Section: Change Context Loading

系统 SHALL 加载结合 graph 与完成状态的 change context。

- **Load context for existing change**
  - 对既有 change 调用 `loadChangeContext`
  - 系统返回带 graph、completed set、schema name 与 change info 的 context

- **Load context for non-existent change directory**
  - 对不存在的 change 目录调用 `loadChangeContext`
  - 系统返回带空 completed set 的 context

- **Load context with schema binding**
  - `loadChangeContext(projectRoot, changeName, schemaName)` is called
  - the system validates `schemaName` against the sole legal built-in ID `semantic-model`
  - 非内置 ID SHALL 被拒绝（`Schema not found`），不加载任何用户/自定义 schema

### Section: Status Formatting

系统 SHALL 将 change status 格式化为可读输出。

- **Mixed completion status**
  - 部分 artifacts 完成
  - status 显示 completed 为 "done"、ready 为 "ready"、blocked 为 "blocked"

- **Blocked artifact details**
  - artifact 被阻塞
  - status 显示哪些 dependencies 缺失

- **All artifacts completed**
  - all artifacts are completed
  - status shows all artifacts as "done"

- **Include output paths**
  - status is formatted
  - each artifact shows its output path pattern

### Section: Artifact current state projection

制品状态加载 SHALL 将 completion detection、实际 output paths 与可选 completion marker 投影到 status --change 的 artifact 数据，不嵌入文件正文。已有输出只提供 canonical 路径；marker 存在时报告其路径与 present: true，不存在时仍保留预期路径与 present: false。这些状态 SHALL 独立于静态定义、模板和配置数据，模板不负责计算当前磁盘状态。

### Section: 向工作面交付静态制品指导

制品定义、写作指导与模板 SHALL 从受管单一来源投影到 skill/reference，供工作流按当前制品需要读取。semantic-model 的四分区差量制品 ID 为 semantic-delta，其完整静态指导交付到项目根 `.xirang/references/xirang-artifact-semantic-delta.md`；Propose、Snack 及共享 Delta 编写入口读取该文件，并通过 `xirang config project --artifact semantic-delta` 获取适用配置。

静态交付 SHALL 不嵌入某个 Change 的实时完成状态或当前项目配置；这些数据分别由 status --change 与 config project 获取。模板加载失败 SHALL 保留带路径的具体诊断，不静默交付缺失模板。authoring help 的 semantic-delta 主题 SHALL 使用同一 schema 制品定义及模板。

- 生成 Propose/Snack 工作面：差量指导入口指向可读的 xirang-artifact-semantic-delta.md，配置查询使用同名制品 ID。
- `help authoring semantic-delta` 与 reference 的 Definition/Guidance/Template 来自同一规范来源，不另设映射到另一制品的身份。

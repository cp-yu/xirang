---
entity: element-declaration
identity: "instruction-loader"
kind: "element"
parent: "deterministic-operations"
title: "Instruction Loader"
definition: "Instruction Loader 是制品定义、模板与 Change 上下文的加载能力。它独立承载模板解析、制品依赖与完成状态加载，将静态指导供工作面文件投影、动态状态供 status 查询；不生成混合当前配置、状态和静态提示词的指令响应，也不承担目标语义创作。"
---

## MODIFIED Sections

### Section: 向工作面交付静态制品指导

制品定义、写作指导与模板 SHALL 从受管单一来源投影到 skill/reference，供工作流按当前制品需要读取。semantic-model 的四分区差量制品 ID 为 semantic-delta，其完整静态指导交付到项目根 `.xirang/references/xirang-artifact-semantic-delta.md`；Propose、Snack 及共享 Delta 编写入口读取该文件，并通过 `xirang config project --artifact semantic-delta` 获取适用配置。

静态交付 SHALL 不嵌入某个 Change 的实时完成状态或当前项目配置；这些数据分别由 status --change 与 config project 获取。模板加载失败 SHALL 保留带路径的具体诊断，不静默交付缺失模板。authoring help 的 semantic-delta 主题 SHALL 使用同一 schema 制品定义及模板。

- 生成 Propose/Snack 工作面：差量指导入口指向可读的 xirang-artifact-semantic-delta.md，配置查询使用同名制品 ID。
- `help authoring semantic-delta` 与 reference 的 Definition/Guidance/Template 来自同一规范来源，不另设映射到另一制品的身份。

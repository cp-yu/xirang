---
operation: MODIFIED
entity: element-declaration
identity: instruction-loader
kind: element
parent: deterministic-operations
title: "Instruction Loader"
definition: "Instruction Loader 是制品定义、模板与 Change 上下文的加载能力。它独立承载模板解析、制品依赖与完成状态加载，将静态指导供工作面文件投影、动态状态供 status 查询；不生成混合当前配置、状态和静态提示词的指令响应，也不承担目标语义创作。"
---

## MODIFIED Sections

### Section: Artifact current state projection

制品状态加载 SHALL 将 completion detection、实际 output paths 与可选 completion marker 投影到 status --change 的 artifact 数据，不嵌入文件正文。已有输出只提供 canonical 路径；marker 存在时报告其路径与 present: true，不存在时仍保留预期路径与 present: false。这些状态 SHALL 独立于静态定义、模板和配置数据，模板不负责计算当前磁盘状态。

## ADDED Sections

### Section: 向工作面交付静态制品指导

制品定义、写作指导与模板 SHALL 从受管单一来源投影到 skill/reference，供工作流按当前制品需要读取。静态交付 SHALL 不嵌入某个 Change 的实时完成状态或当前项目配置；这些数据分别由 status --change 与 config project 获取。模板加载失败 SHALL 保留带路径的具体诊断，不静默交付缺失模板。

## REMOVED Sections

### Section: Template Enrichment

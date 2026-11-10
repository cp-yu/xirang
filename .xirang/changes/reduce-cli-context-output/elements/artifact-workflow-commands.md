---
operation: MODIFIED
entity: element-declaration
identity: artifact-workflow-commands
kind: element
parent: deterministic-operations
title: "Artifact Workflow Commands"
definition: "Artifact Workflow Commands 是 Change 制品推进的 CLI 命令面。它通过 status 展示制品依赖、完成概况与实现推进状态，通过 templates 查询模板位置，通过 new change 创建活动 Change；适用于 scaffolded 与已有 Change。静态制品写作和推进指导由工作流文件承载，Quality 详情由专门的质量查询提供。"
---

## MODIFIED Sections

### Section: Status Command

系统 SHALL 通过 xirang status --change <id> 只读返回活动 Change 的制品完成状态、依赖缺口、目标完成概况及必要的 Quality 概况，支持仅有目录的 scaffolded Change。每个 artifact SHALL 标明 done、ready 或 blocked；blocked SHALL 列出缺失依赖，状态 SHALL 保留 outputPath 及实际已存在的输出路径，不嵌入文件正文。

JSON SHALL 包含 changeName、schemaName、isComplete、artifacts、applyRequires、state、goals 与 gaps。isComplete 表达制品完整性，SHALL NOT 被解释为 Quality 完成；goals 仅包含 total、completed、remaining 计数，不回传目标正文。gaps SHALL 定位缺失或非法的 prerequisite。具备任务完成后判断条件时，quality SHALL 仅提供当前 Quality 状态概况，不重复完整意见或历史；具体 Review、Opt、Seal 缺口通过 quality status 获取。

- scaffolded Change 的全部 artifacts 尚不存在：根 artifact 为 ready，依赖它的 artifacts 为 blocked，并列出缺失依赖；state 为 blocked。
- 必需制品齐全但 tasks.md 缺失、无目标或为不支持格式：state 为 blocked，gaps 指出实际缺口。
- 存在未完成目标：state 为 ready，返回完成与剩余计数，目标内容由 tasks.md 读取。
- 目标全部完成：联合 Quality 门禁给出 needs_review、needs_optimize 或 all_done；计数完成不得单独产生 all_done。
- 无 apply.tracks 且 required artifacts 完整：state 为 ready。
- 用户未指定 --change 且存在活动 Change，或指定的 Change 不存在：非零退出，stderr 给出具体诊断及可用 Change；无活动 Change 且未指定时按空查询返回。

文本 SHALL 表达同一制品状态、具体缺口和目标完成概况；不依赖 spinner 传递状态。

### Section: Schema Apply Block

系统 SHALL 使用 schema 的 apply.requires 确定 Apply 前必须存在的 artifacts，使用 apply.tracks 确定进度跟踪文件，并将其投影至 Change status。没有 apply block 时 SHALL 要求全部 artifacts 存在。如何落实制品、处理缺失 prerequisite 及继续实现 SHALL 由 workflow 指导表达，不由状态响应重复生成提示词。

### Section: Output Formatting

系统 SHALL 提供文本与 JSON 状态呈现。交互终端支持颜色时，文本状态标识 MAY 使用 green（done）、yellow（ready）、red（blocked）；--no-color、NO_COLOR、JSON 或非交互调用 SHALL 不输出 ANSI 颜色。非交互调用 SHALL 不显示 spinner、加载进度或成功装饰。

## ADDED Sections

### Section: 以文件指导与查询协同推进

静态制品定义、写作指导和模板 SHALL 由按需加载的 skill/reference 提供；config project SHALL 提供当前有效配置，status --change SHALL 提供制品与推进状态，quality status SHALL 提供当前质量详情。CLI SHALL 不注册 instructions 命令或用另一统一 context 命令重新聚合这些提示词与数据。

缺少必需制品或有效目标清单时，Apply workflow SHALL 根据 status 的具体缺口返回 Propose 调和输入，不自行创建缺失的形成制品。制品依赖与校验 SHALL 继续由 CLI 确定，静态指导不替代动态门禁。

## REMOVED Sections

### Section: Instructions Command

### Section: Apply Instructions Command

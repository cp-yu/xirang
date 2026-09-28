---
entity: element-declaration
identity: instruction-loader
kind: element
parent: deterministic-operations
title: Instruction Loader
definition: Instruction Loader 定义从 schema 目录加载并富化 instruction templates 的行为：template loading、change context loading、template enrichment、status formatting 与 artifact current state projection。
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
### Section: Template Enrichment
系统 SHALL 以 change-specific context 富化 templates。

- **Include artifact metadata**
  - 为 artifact 生成 instructions
  - 输出包含 change name、artifact ID、schema name 与 output path

- **Include dependency status**
  - artifact 有 dependencies
  - 输出显示每个 dependency 的完成状态（done/missing）

- **Include unlocked artifacts**
  - instructions are generated
  - the output includes which artifacts become available after this one

- **Root artifact indicator**
  - an artifact has no dependencies
  - the dependency section indicates this is a root artifact
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

Instruction loader SHALL 将 artifact completion state 投影为独立的结构化 `currentState`，与 definition、dependencies、instruction、template 和 config projection 分离。该状态 SHALL 只包含完成状态、当前 output paths 与可选 completion marker 状态，MUST NOT 嵌入文件内容。

- **Existing outputs 被投影为路径**
  - instruction loader 为已有 output 的 artifact 生成 instructions
  - `currentState.completed` SHALL 反映 completion detection 结果
  - `currentState.outputs` SHALL 包含当前匹配的 canonical output paths
  - SHALL NOT 读取并嵌入这些 output 的内容

- **Completion marker 独立于 outputs**
  - artifact 通过 completion marker 完成
  - `currentState.completed` SHALL 为 `true`
  - `currentState.completionMarker` SHALL 分别包含 marker path 与 `present: true`

- **Absent completion marker 仍暴露预期路径**
  - artifact 定义 completion marker 但该 marker 不存在
  - `currentState.completionMarker.path` SHALL 指向预期 marker path
  - `currentState.completionMarker.present` SHALL 为 `false`

- **JSON 输出结构化 current state**
  - user 运行 `xirang instructions <artifact> --change <id> --json`
  - output SHALL 包含 `currentState.completed` 与 `currentState.outputs`
  - artifact 定义 completion marker 时 SHALL 包含 marker path 与 presence
  - outputs 与 marker SHALL 只以路径和状态表示

- **Text 输出 current state**
  - user 运行 `xirang instructions <artifact> --change <id>`
  - output SHALL 在 `<instruction>` 前包含独立 `<current_state>` section
  - SHALL 显示 completion 状态、当前 output paths 与可选 completion marker 状态
  - 无 output 时 SHALL 明确表示当前不存在 artifact outputs

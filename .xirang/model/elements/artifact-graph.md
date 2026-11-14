---
entity: element-declaration
identity: artifact-graph
kind: element
parent: deterministic-operations
title: Artifact Graph
definition: Artifact Graph 定义 schema-driven workflows 使用的 artifact graph model：schema 加载、构建顺序计算、完成状态检测、ready/blocked 查询、完成检查与 schema 目录结构。
---

## Specification

### Section: Schema Loading

系统 SHALL 从 schema 目录内的 YAML schema 文件加载 artifact graph definitions。

- **Valid schema loaded**
  - schema 目录包含合法 `schema.yaml`
  - 系统返回含全部 artifacts 与 dependencies 的 ArtifactGraph

- **Invalid schema rejected**
  - schema YAML 文件缺少 required fields
  - 系统抛出带 descriptive message 的错误

- **Cyclic dependencies detected**
  - schema 包含 cyclic artifact dependencies
  - 系统抛出列出 cycle 中 artifact IDs 的错误

- **Invalid dependency reference**
  - artifact 的 `requires` array 引用不存在的 artifact ID
  - 系统抛出标识非法引用的错误

- **Duplicate artifact IDs rejected**
  - schema 包含多个具有相同 ID 的 artifacts
  - 系统抛出标识重复 ID 的错误

- **Schema directory not found**
  - 解析一个没有对应目录的 schema name
  - 系统抛出列出可用 schemas 的错误

### Section: Build Order Calculation

系统 SHALL 计算 artifacts 的合法拓扑构建顺序。

- **Linear dependency chain**
  - artifacts 形成线性链（A → B → C）
  - getBuildOrder() 返回 [A, B, C]

- **Diamond dependency**
  - artifacts 形成菱形依赖（A → B, A → C, B → D, C → D）
  - getBuildOrder() 在 B 与 C 前返回 A，D 最后

- **Independent artifacts**
  - artifacts have no dependencies
  - getBuildOrder() returns them in a stable order

### Section: State Detection

系统 SHALL 通过扫描 filesystem 检测 artifact 完成状态。

- **Simple file exists**
  - artifact 生成某文件且该文件存在
  - artifact 被标记为 completed

- **Glob pattern with files**
  - artifact 生成 glob pattern 且目录包含匹配文件
  - artifact 被标记为 completed

- **Completion marker exists**
  - glob artifact 声明 `completionMarker` 且该文件存在
  - artifact SHALL 标记为 completed，即使 glob 没有匹配文件

- **Missing change directory**
  - change 目录不存在
  - 全部 artifacts 标记为未完成（空状态）

- **Simple file missing**
  - artifact 生成 "proposal.md" 且该文件不存在
  - artifact 不标记为 completed

- **Glob pattern empty**
  - an artifact generates `{elements,metamodel,relationships,views}/**/*` and all four delta partition directories are empty or missing
  - the artifact is not marked as completed（除非 completionMarker 存在）

### Section: Ready Artifact Query

系统 SHALL 识别哪些 artifacts 已可创建。

- **Root artifacts ready initially**
  - 没有 artifacts 完成
  - getNextArtifacts() 返回无依赖的 artifacts

- **Blocked artifacts excluded**
  - artifact 有未完成的依赖
  - getNextArtifacts() 不包含该 artifact

- **Dependent artifact becomes ready**
  - an artifact's dependencies are all completed
  - getNextArtifacts() includes that artifact

### Section: Completion Check

系统 SHALL 确定 graph 中全部 artifacts 何时完成。

- **All complete**
  - graph 中全部 artifacts 在 completed set
  - isComplete() 返回 true

- **Partially complete**
  - some artifacts in the graph are not completed
  - isComplete() returns false

### Section: Blocked Query

系统 SHALL 识别哪些 artifacts 被阻塞并返回其全部未满足依赖。

- **Artifact blocked by multiple dependencies**
  - artifact C 依赖 A 与 B 且只有 A 完成
  - getBlocked() 返回 `{ C: ['B'] }`

- **Artifact blocked by single dependency**
  - artifact B requires artifact A and A is not complete
  - getBlocked() returns `{ B: ['A'] }`

- **Artifact blocked by all dependencies**
  - artifact C requires A and B, and neither is complete
  - getBlocked() returns `{ C: ['A', 'B'] }`

### Section: Schema Directory Structure

系统 SHALL 支持自带 co-located templates 的 self-contained schema 目录。

- **Schema with templates**
  - schema 目录包含 `schema.yaml` 与 `templates/` 子目录
  - artifacts 可引用相对该 schema templates 目录的 templates

### Section: Semantic Model 制品图

semantic-model schema SHALL 使用 proposal、semantic-delta、design、tasks 四个制品 ID。proposal 无前置依赖；semantic-delta 与 design 依赖 proposal；tasks 依赖 semantic-delta 与 design；Apply 的 requires 为 tasks，tracks 为 tasks.md。

semantic-delta SHALL 表达完整四分区 Semantic Delta，输出匹配 `{elements,metamodel,relationships,views}/**/*`，模板为 delta.md，无语义差量时的完成标记为 .delta-noop。状态、ready/blocked、缺失依赖和模板映射 SHALL 使用同一制品 ID；所有分区均可独立构成差量，不把 semantic-delta 限于 Element Contracts。

- proposal 完成后：semantic-delta 与 design 可推进；只有 design 完成时，tasks 仍等待 semantic-delta。
- Change 只有 relationships 或 views 差量：semantic-delta 按输出存在性判为完成。
- 四分区无输出且有 .delta-noop：semantic-delta 完成；四分区和标记都缺失：未完成。
- template/status JSON 使用 semantic-delta 标识该制品，指向相同四分区及 delta.md。

---
entity: element-declaration
identity: artifact-graph
kind: element
parent: deterministic-operations
title: Artifact Graph
definition: Artifact Graph 定义 schema-driven workflows 使用的 artifact graph model：schema 加载、构建顺序计算、完成状态检测、ready/blocked 查询、完成检查与 schema 目录结构。
---

## Requirements

### Requirement: Schema Loading
系统 SHALL 从 schema 目录内的 YAML schema 文件加载 artifact graph definitions。

#### Scenario: Valid schema loaded
- **WHEN** schema 目录包含合法 `schema.yaml`
- **THEN** 系统返回含全部 artifacts 与 dependencies 的 ArtifactGraph

#### Scenario: Invalid schema rejected
- **WHEN** schema YAML 文件缺少 required fields
- **THEN** 系统抛出带 descriptive message 的错误

#### Scenario: Cyclic dependencies detected
- **WHEN** schema 包含 cyclic artifact dependencies
- **THEN** 系统抛出列出 cycle 中 artifact IDs 的错误

#### Scenario: Invalid dependency reference
- **WHEN** artifact 的 `requires` array 引用不存在的 artifact ID
- **THEN** 系统抛出标识非法引用的错误

#### Scenario: Duplicate artifact IDs rejected
- **WHEN** schema 包含多个具有相同 ID 的 artifacts
- **THEN** 系统抛出标识重复 ID 的错误
#### Scenario: Schema directory not found
- **WHEN** 解析一个没有对应目录的 schema name
- **THEN** 系统抛出列出可用 schemas 的错误
### Requirement: Build Order Calculation
系统 SHALL 计算 artifacts 的合法拓扑构建顺序。

#### Scenario: Linear dependency chain
- **WHEN** artifacts 形成线性链（A → B → C）
- **THEN** getBuildOrder() 返回 [A, B, C]

#### Scenario: Diamond dependency
- **WHEN** artifacts 形成菱形依赖（A → B, A → C, B → D, C → D）
- **THEN** getBuildOrder() 在 B 与 C 前返回 A，D 最后
#### Scenario: Independent artifacts
- **WHEN** artifacts have no dependencies
- **THEN** getBuildOrder() returns them in a stable order
### Requirement: State Detection
系统 SHALL 通过扫描 filesystem 检测 artifact 完成状态。

#### Scenario: Simple file exists
- **WHEN** artifact 生成某文件且该文件存在
- **THEN** artifact 被标记为 completed

#### Scenario: Glob pattern with files
- **WHEN** artifact 生成 glob pattern 且目录包含匹配文件
- **THEN** artifact 被标记为 completed

#### Scenario: Completion marker exists
- **WHEN** glob artifact 声明 `completionMarker` 且该文件存在
- **THEN** artifact SHALL 标记为 completed，即使 glob 没有匹配文件

#### Scenario: Missing change directory
- **WHEN** change 目录不存在
- **THEN** 全部 artifacts 标记为未完成（空状态）
#### Scenario: Simple file missing
- **WHEN** artifact 生成 "proposal.md" 且该文件不存在
- **THEN** artifact 不标记为 completed
#### Scenario: Glob pattern empty
- **WHEN** an artifact generates `{elements,metamodel,relationships,views}/**/*` and all four delta partition directories are empty or missing
- **THEN** the artifact is not marked as completed（除非 completionMarker 存在）
### Requirement: Ready Artifact Query
系统 SHALL 识别哪些 artifacts 已可创建。

#### Scenario: Root artifacts ready initially
- **WHEN** 没有 artifacts 完成
- **THEN** getNextArtifacts() 返回无依赖的 artifacts

#### Scenario: Blocked artifacts excluded
- **WHEN** artifact 有未完成的依赖
- **THEN** getNextArtifacts() 不包含该 artifact
#### Scenario: Dependent artifact becomes ready
- **WHEN** an artifact's dependencies are all completed
- **THEN** getNextArtifacts() includes that artifact
### Requirement: Completion Check
系统 SHALL 确定 graph 中全部 artifacts 何时完成。

#### Scenario: All complete
- **WHEN** graph 中全部 artifacts 在 completed set
- **THEN** isComplete() 返回 true
#### Scenario: Partially complete
- **WHEN** some artifacts in the graph are not completed
- **THEN** isComplete() returns false
### Requirement: Blocked Query
系统 SHALL 识别哪些 artifacts 被阻塞并返回其全部未满足依赖。

#### Scenario: Artifact blocked by multiple dependencies
- **WHEN** artifact C 依赖 A 与 B 且只有 A 完成
- **THEN** getBlocked() 返回 `{ C: ['B'] }`
#### Scenario: Artifact blocked by single dependency
- **WHEN** artifact B requires artifact A and A is not complete
- **THEN** getBlocked() returns `{ B: ['A'] }`
#### Scenario: Artifact blocked by all dependencies
- **WHEN** artifact C requires A and B, and neither is complete
- **THEN** getBlocked() returns `{ C: ['A', 'B'] }`
### Requirement: Schema Directory Structure
系统 SHALL 支持自带 co-located templates 的 self-contained schema 目录。

#### Scenario: Schema with templates
- **WHEN** schema 目录包含 `schema.yaml` 与 `templates/` 子目录
- **THEN** artifacts 可引用相对该 schema templates 目录的 templates

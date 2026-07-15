## ADDED Requirements

### Requirement: Artifact definition projection

`openspec instructions <artifact> --change <id>` SHALL 返回 resolved built-in Schema 中该 artifact 的结构化 file definition，使 Agent 在 authoring 前理解文件的 durable semantics、compilation role、content boundary、write policy 与 validation commands。

#### Scenario: Instructions JSON 包含 definition
- **WHEN** 用户执行 `openspec instructions specs --change <id> --json`
- **THEN** 输出 SHALL 匹配扩展后的 `ArtifactInstructions` interface
- **AND** `definition` SHALL 与当前内置 Schema 的 specs artifact definition 一致

#### Scenario: Definition 不受 config rules 覆盖
- **WHEN** project config 为 artifact 提供 context、rules 或 prose projection
- **THEN** 这些字段 SHALL 与 definition 分开返回
- **AND** MUST NOT 改变 file purpose、compilation role、content boundary 或 write policy

### Requirement: Built-in Schema selection

Workflow commands SHALL 仅接受内置 `spec-driven` 与 `bootstrap` Schema ID。显式 `--schema`、change metadata 与 project config MAY 在两个内置 Schema 间选择；任何其他值 SHALL fail fast，列出合法 ID，且 MUST NOT 静默回退。

#### Scenario: 内置 Schema 可选择
- **WHEN** 用户为适用 workflow 指定 `--schema spec-driven` 或 `--schema bootstrap`
- **THEN** 系统 SHALL 加载对应 package Schema
- **AND** SHALL 使用该 Schema 的 artifact graph、definitions 与 templates

#### Scenario: 未知 Schema 被拒绝
- **WHEN** CLI option、change metadata 或 project config 指定非内置 Schema ID
- **THEN** 系统 SHALL 以非零结果失败
- **AND** 错误 SHALL 列出 `spec-driven` 与 `bootstrap`
- **AND** MUST NOT 回退到另一 Schema

#### Scenario: 跨平台内置路径解析
- **WHEN** workflow 在 macOS、Linux 或 Windows 解析内置 Schema/template path
- **THEN** 系统 SHALL 使用 Node.js path APIs 构造路径
- **AND** MUST NOT 依赖硬编码路径分隔符、路径大小写启发式或正则检测 Schema source

## REMOVED Requirements

### Requirement: Schema Selection

**Reason**: 任意 custom/project/user Schema selection 与固定内置 file definition 合同冲突，且当前产品不再支持自定义 Schema。

**Migration**: 使用内置 `spec-driven` 或 `bootstrap`；未知 ID 按 `Built-in Schema selection` 失败。

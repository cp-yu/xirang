# ai-command-generation Specification

## Purpose
此规约记录变更 add-subagent-skills 引入的行为，请在后续同步或归档前补全正式 Purpose。
## Requirements
### Requirement: WorkflowManifestEntry.getCommandTemplate 改为 optional

`WorkflowManifestEntry` SHALL NOT require `getCommandTemplate`, and active workflow artifact generation SHALL NOT use command template factories to produce workflow delivery artifacts.

#### Scenario: 无 getCommandTemplate 的 entry 跳过命令生成

- **WHEN** manifest registry 中存在 `getCommandTemplate` 为 undefined 的 entry
- **THEN** active artifact generation SHALL continue skill generation
- **AND** SHALL NOT 抛出异常或产生 undefined 命令

#### Scenario: 现有 entry 行为不变

- **WHEN** workflow manifest entries are loaded
- **THEN** skill generation behavior SHALL remain available for all registered workflows
- **AND** active artifact generation SHALL NOT generate slash commands

### Requirement: 命令列表排除内部 subagent

所有消费 workflow surface 列表的组件 SHALL NOT 将 internal subagent（`openspec-reviewer`、`openspec-optimizer`、`openspec-impact-sweeper`）暴露为用户可调用 workflow entries。

命令 slug 列表 SHALL NOT be used as an active artifact generation surface.

#### Scenario: CLI 补全不提示 internal subagent

- **WHEN** 用户触发 shell 补全以查看 OpenSpec CLI 命令
- **THEN** 补全列表 SHALL NOT 包含 `reviewer`、`optimizer` 或 `impact-sweeper`
- **AND** shell completion SHALL remain limited to OpenSpec terminal CLI commands

#### Scenario: 迁移清理不尝试删除 internal subagent 的 command

- **WHEN** 系统刷新 workflow skills 与 internal subagent artifact
- **THEN** managed command slugs SHALL NOT drive deletion of internal subagent command files
- **AND** SHALL NOT 尝试访问不存在的 internal subagent command 文件


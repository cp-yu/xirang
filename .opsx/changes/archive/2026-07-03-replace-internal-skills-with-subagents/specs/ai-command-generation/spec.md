## REMOVED Requirements

### Requirement: 命令列表排除内部 skill

**Reason**: Requirement 标题使用 "内部 skill" 旧术语。internal 角色已从 skill generation 管线迁移到 internal subagent artifact generation framework，标题与 body 统一为 "internal subagent"。

**Migration**: 见 ADDED Requirement "命令列表排除内部 subagent"。

## ADDED Requirements

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

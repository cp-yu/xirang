## MODIFIED Requirements

### Requirement: Init 与 Update 集成 subagent artifact 生成
`opsx setup` 与 `opsx update` SHALL 通过 shared ArtifactSyncEngine 生成 workflow skills 和 internal subagent artifacts；Project Build 的完成 SHALL NOT 依赖 subagent artifact availability。

#### Scenario: Setup 生成 subagent artifacts
- **WHEN** 用户执行 `opsx setup` 并选择支持 internal subagents 的工具
- **THEN** 系统 SHALL 生成 managed internal subagent artifacts
- **AND** SHALL 同时生成 `opsx-build` workflow skill

#### Scenario: Build 不依赖 subagents
- **WHEN** Agent 运行 `opsx-build`，且当前工具不支持 internal subagents
- **THEN** Build SHALL 仍可通过 Candidate authoring、validation 和 promotion 完成
- **AND** SHALL NOT 因缺少 subagent artifact 而改变 Candidate contract

### Requirement: 旧 internal skill 目录迁移 cleanup
Setup/update SHALL 使用显式 managed name list 清理旧 internal skill artifacts，并 SHALL NOT 清理 user-authored agents。

#### Scenario: Cleanup 使用显式列表
- **WHEN** managed old internal skill artifacts 存在
- **THEN** setup/update SHALL 只删除显式列出的 managed names
- **AND** SHALL 保留 user-authored agent files

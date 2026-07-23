---
element: cap.cli.command-reference-consistency
---

# cli-command-reference-consistency Specification

## Purpose
Define the reviewed Command Discovery and Consistency contract for Active command references match the current CLI surface; Command-reference cleanup is source-backed; Cleanup verification reports remaining stale references by class.
## Requirements
### Requirement: Active command references match the current CLI surface
OPSX SHALL 保持 active user-facing documentation、generated workflow templates、Agent instructions、skills、prompts 和 active Specs 中的命令示例与当前 `opsx --help` 一致。

#### Scenario: Project setup 与 Build references
- **WHEN** active surface 描述项目 setup、Project Build、Candidate validation 或 promotion
- **THEN** SHALL 使用 `opsx setup`、`opsx-build` 和 `opsx candidate init|status|validate|promote`
- **AND** SHALL NOT 引用 `opsx init`、`opsx bootstrap`、`opsx migrate` 或 `opsx-bootstrap-arch`

#### Scenario: Formal validation references
- **WHEN** active surface 描述 Candidate promotion 后的 formal validation
- **THEN** SHALL 使用 `opsx validate --all --strict`
- **AND** SHALL NOT 将 change verify gate 描述为 Project Build promotion gate

#### Scenario: Historical references
- **WHEN** retired references 仅位于 `.opsx/changes/archive/**` 或 `.opsx/history/**`
- **THEN** SHALL 将其与 active stale references 分开报告
- **AND** SHALL NOT 修改历史证据

### Requirement: Command-reference cleanup is source-backed

OPSX SHALL 在生成 stale 命令引用的源头清理它们，而不仅在生成的副本中清理，只要生成的 surface 可以重新创建 stale 文本。

#### Scenario: 生成文件有模板源

- **WHEN** stale 命令引用出现在生成的 skill、command、prompt 或 Agent instruction 文件中
- **THEN** 实现 SHALL 识别是否有源模板或 transform 发出该文本
- **AND** 如果源存在，更新源使重新生成不会重新引入 stale 命令
- **AND** 仅在需要时更新生成的副本以保持仓库一致

#### Scenario: 历史归档 artifacts 不是默认清理目标

- **WHEN** 在 `.opsx/changes/archive/**` 下发现 stale 命令引用
- **THEN** 它们 SHALL 默认视为历史证据
- **AND** SHALL NOT 修改，除非它们被用作当前 user-facing guidance 或作为生成当前指令的源

### Requirement: Cleanup verification reports remaining stale references by class
Command cleanup SHALL 通过可重复审计按 active docs、source templates、generated skills、help/completion、active Specs 和 historical evidence 分类报告 stale references。

#### Scenario: 清理后审计
- **WHEN** Project Build surface 切换完成
- **THEN** active classes SHALL 不包含 retired `init`、`bootstrap`、`migrate` 或 `opsx-bootstrap-arch` references
- **AND** audit SHALL 单独报告 archive/history 中允许保留的 occurrences


---
element: cap.cli.archive
---

# CLI Archive Command Specification

## Purpose
The archive command moves completed changes from the active changes directory to the archive folder with date-based naming, following OPSX conventions.

## Command Syntax
```bash
opsx archive [change-name] [--yes|-y]
```

Options:
- `--yes`, `-y`: Skip confirmation prompts (for automation)
## Requirements
### Requirement: Change Selection

The command SHALL support both interactive and direct change selection methods.

#### Scenario: Interactive selection

- **WHEN** no change-name is provided
- **THEN** display interactive list of available changes (excluding archive/)
- **AND** allow user to select one

#### Scenario: Direct selection

- **WHEN** change-name is provided
- **THEN** use that change directly
- **AND** validate it exists

### Requirement: Task Completion Check

The command SHALL verify task completion status before archiving to prevent premature archival.

#### Scenario: Incomplete tasks found

- **WHEN** incomplete tasks are found (marked with `- [ ]`)
- **THEN** display all incomplete tasks to the user
- **AND** prompt for confirmation to continue
- **AND** default to "No" for safety

#### Scenario: All tasks complete

- **WHEN** all tasks are complete OR no tasks.md exists
- **THEN** proceed with archiving without prompting

### Requirement: Archive Process

Archive SHALL 在 verify、sync、task 与 final change validation gates 通过后，重新生成与最终 Formal/change fingerprints 匹配的 `effective-change.md`，再将 active change directory 移动到 date-prefixed archive path。Archive MUST NOT 再次修改 Formal Semantic Model。

#### Scenario: 直接归档
- **WHEN** 所有 gates 通过且 change directory 存在
- **THEN** SHALL 运行等价于 `opsx diff --change <name> --write` 的 final report generation
- **AND** SHALL 确认 report status 为 Passed 且 fingerprints 当前
- **AND** SHALL 将 change directory 移动到 `YYYY-MM-DD-<change-name>`
- **AND** SHALL 输出 git handoff 提醒
- **AND** SHALL NOT 执行 git 写操作

#### Scenario: 已归档 change 检测
- **WHEN** target archive path 已存在且 active change 不存在
- **THEN** SHALL 输出已归档状态与 git handoff 提醒后退出

#### Scenario: Final report generation 失败
- **WHEN** final validation、Diff IR 或 `effective-change.md` atomic write 失败
- **THEN** SHALL 终止 archive
- **AND** active change directory SHALL 保持原样

#### Scenario: 归档失败不回写
- **WHEN**任一 archive gate 失败
- **THEN** SHALL 不移动 change directory
- **AND** SHALL NOT 修改 Formal Semantic Model

### Requirement: Error Conditions

The command SHALL handle various error conditions gracefully.

#### Scenario: Handling errors

- **WHEN** errors occur
- **THEN** handle the following conditions:
  - Missing .opsx/changes/ directory
  - Change not found
  - Archive target already exists
  - File system permissions issues

### Requirement: Display Output

archive 命令 SHALL 提供清晰的 gate 状态反馈。

#### Scenario: 显示 gate 状态

- **WHEN** 执行 archive
- **THEN** 依次显示每个 gate 的通过/跳过/失败状态
- **AND** 显示 task 完成状态
- **AND** 归档完成后显示最终确认消息和 git handoff 提醒

### Requirement: Archive Validation

Archive SHALL 在移动 change 前执行完整 change compiler validation，并要求 final generated review artifact 与当前 inputs 一致。`--no-validate` MAY 跳过一般 validation gate，但 MUST NOT 产生伪造的 Passed review report。

#### Scenario: Pre-archive validation
- **WHEN** 执行 `opsx archive change-name`
- **THEN** SHALL materialize Target Semantic Model 并验证完整 Semantic Delta
- **AND** validation 通过后 SHALL 生成 final `effective-change.md`

#### Scenario: Force archive without validation
- **WHEN** 执行 `opsx archive change-name --no-validate`
- **THEN** SHALL 显示 unsafe warning
- **AND** generated report SHALL 明确反映实际 validation 状态
- **AND** MUST NOT 将未验证结果标记为 Passed

#### Scenario: 跨平台 archive report path
- **WHEN** archive 在 Windows、macOS 或 Linux 生成并移动 report
- **THEN** SHALL 使用 Node.js path API 构造 active 与 archive paths
- **AND** SHALL 保留 report 内容字节不变

### Requirement: Archive CLI 输出 git handoff 提醒

`opsx archive` 在完成 verify、sync 与 move-to-archive 后 SHALL 输出后续 git 工作由 agent 自动继续的责任归属提醒，不再读取或区分任何 handoff 模式配置。

#### Scenario: 归档完成后提醒 agent 接管

- **WHEN** `opsx archive <change>` 完成归档
- **THEN** CLI SHALL 输出归档已完成
- **AND** SHALL 提醒后续 git 提交流程由 agent 自动继续处理
- **AND** SHALL NOT 输出任何推荐 commit message
- **AND** SHALL NOT 读取 `git.autoCommit` 配置

### Requirement: Sync Gate

archive 命令 SHALL 在归档前检查 change 是否存在未合并的 delta（spec + OPSX），并在存在时阻止归档。sync 检查与 verify gate 正交，`--no-sync` flag 可跳过。

#### Scenario: 存在未合并 delta 时阻止归档

- **WHEN** change 包含尚未通过 `opsx sync` 合并到 main spec 的 delta
- **AND** 未使用 `--no-sync`
- **THEN** archive 命令 SHALL 输出错误消息指明 pending delta
- **AND** SHALL 提示用户执行 `opsx sync <change-name>` 后重试
- **AND** SHALL 终止归档操作

#### Scenario: delta 已全部合并时通过检查

- **WHEN** change 的所有 delta（spec + OPSX）已通过 `opsx sync` 合并到 main spec
- **AND** 未使用 `--no-sync`
- **THEN** sync gate SHALL 通过
- **AND** archive 命令 SHALL 继续后续步骤

#### Scenario: --no-sync 跳过 sync gate

- **WHEN** 执行 `opsx archive <change> --no-sync`
- **AND** 非 `--yes` 模式
- **THEN** CLI SHALL 显示警告确认提示，说明跳过 sync 检查的风险
- **AND** 用户确认后 SHALL 跳过 sync 检查
- **AND** 继续归档

#### Scenario: --yes --no-sync 静默跳过

- **WHEN** 执行 `opsx archive <change> --no-sync --yes`
- **THEN** CLI SHALL 静默跳过 sync 检查
- **AND** 直接继续归档

#### Scenario: 仅含 removal delta 且目标 header 已不存在

- **WHEN** change delta 仅包含 REMOVED 操作
- **AND** 对应 main spec 中所有被移除的 header 已不存在
- **THEN** sync gate SHALL 将该项 delta 视为已同步
- **AND** SHALL NOT 阻止归档

## Why These Decisions

**Interactive selection**: Reduces typing and helps users see available changes
**Task checking**: Prevents accidental archiving of incomplete work
**Date prefixing**: Maintains chronological order and prevents naming conflicts
**No overwrite**: Preserves historical archives and prevents data loss
**Spec updates before archiving**: Specs in the main directory represent current reality; when a change is deployed and archived, its future state specs become the new reality and must replace the main specs
**Confirmation for spec updates**: Provides visibility into what will change, prevents accidental overwrites, and ensures users understand the impact before specs are modified
**--yes flag for automation**: Allows CI/CD pipelines to archive without interactive prompts while maintaining safety by default for manual use

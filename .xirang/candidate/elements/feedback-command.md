---
entity: element-declaration
identity: feedback-command
kind: capability
parent: cli
title: Feedback Command
definition: Feedback Command 定义 `xirang feedback` 通过 `gh` CLI 安全创建 GitHub Issue 的行为，包括无 shell 注入的命令执行、gh 缺失/未认证时的 manual fallback、issue metadata 匿名化、错误处理、Agent feedback skill 与 shell completion。
---

## Requirements

### Requirement: Feedback command

系统 SHALL 提供 `xirang feedback` 命令，使用 `gh` CLI 在 xirang repository 中创建 GitHub Issue。系统 SHALL 使用 `execFileSync` 与 argument arrays 防止 shell injection。

#### Scenario: Simple feedback submission

- **WHEN** user executes `xirang feedback "Great tool!"`
- **THEN** the system executes `gh issue create` with title "Feedback: Great tool!"
- **AND** the issue is created in the xirang repository
- **AND** the issue has the `feedback` label
- **AND** the system displays the created issue URL

#### Scenario: Safe command execution

- **WHEN** submitting feedback via `gh` CLI
- **THEN** the system uses `execFileSync` with separate arguments array
- **AND** user input is NOT passed through a shell
#### Scenario: Feedback with body
- **WHEN** 用户执行 `xirang feedback "Title here" --body "Detailed description..."`
- **THEN** 系统以指定 title 创建 GitHub Issue
- **AND** issue body 包含详细描述与 metadata
### Requirement: GitHub CLI dependency

系统 SHALL 在 `gh` 可用时用于自动提交，并在 `gh` 未安装或未认证时提供 manual submission fallback。

#### Scenario: Missing gh CLI with fallback

- **WHEN** `gh` CLI 未安装（PATH 中找不到）
- **THEN** 系统显示 "GitHub CLI not found. Manual submission required."
- **AND** 输出带分隔符的结构化反馈内容与预填的 GitHub Issue URL
- **AND** 以零码退出（成功 fallback）

#### Scenario: Cross-platform gh CLI detection

- **WHEN** 系统检测 `gh` CLI 可用性
- **THEN** macOS/Linux 上执行 `which gh`，Windows 上执行 `where gh`

#### Scenario: Unauthenticated gh CLI with fallback

- **WHEN** `gh` CLI 已安装但未认证
- **THEN** 系统显示认证警告、结构化反馈内容与认证指引
- **AND** 以零码退出
#### Scenario: Cross-platform gh CLI detection on Unix
- **WHEN** system is running on macOS or Linux (platform is 'darwin' or 'linux')
- **AND** checking if `gh` CLI is installed
- **THEN** the system executes `which gh` command
#### Scenario: Cross-platform gh CLI detection on Windows
- **WHEN** system is running on Windows (platform is 'win32')
- **AND** checking if `gh` CLI is installed
- **THEN** the system executes `where gh` command
#### Scenario: Authenticated gh CLI
- **WHEN** user runs `xirang feedback "message"`
- **AND** `gh auth status` returns success (authenticated)
- **THEN** the system proceeds with feedback submission
### Requirement: Issue metadata

系统 SHALL 在 GitHub Issue body 中包含相关元数据，且不包含敏感信息。

#### Scenario: Standard metadata

- **WHEN** 创建 GitHub Issue
- **THEN** issue body 包含 CLI version、platform 与 submission timestamp
- **AND** 不包含文件路径、项目名、环境变量或 IP 地址
#### Scenario: Windows platform metadata
- **WHEN** creating a GitHub Issue for feedback on Windows
- **THEN** the issue body includes "Platform: win32"
- **AND** all platform detection uses Node.js `os.platform()` API
#### Scenario: No sensitive metadata
- **WHEN** creating a GitHub Issue for feedback
- **THEN** the issue body does NOT include:
  - File paths from user's system
  - Project names or directory names
  - Environment variables
  - IP addresses
### Requirement: Feedback always works

系统 SHALL 允许 feedback 提交不受 telemetry 设置影响。

#### Scenario: Feedback with telemetry disabled

- **WHEN** 用户通过环境变量禁用 telemetry 并运行 `xirang feedback "message"`
- **THEN** feedback 仍通过 `gh` CLI 提交且不发送 telemetry events
#### Scenario: Feedback in CI environment
- **WHEN** 环境设置 `CI=true` 且用户运行 `xirang feedback "message"`
- **THEN** feedback 提交正常进行（若 `gh` 可用且已认证）
### Requirement: Error handling

系统 SHALL 优雅处理 feedback 提交错误。

#### Scenario: gh CLI execution failure

- **WHEN** `gh issue create` 命令失败
- **THEN** 系统显示 `gh` CLI 的错误输出
- **AND** 以与 `gh` 相同的 exit code 退出
#### Scenario: Network failure
- **WHEN** `gh` CLI 报告网络连接问题
- **THEN** 系统显示 `gh` 的错误消息
- **AND** 建议检查网络连接
- **AND** 以非零码退出
### Requirement: Feedback skill for agents

系统 SHALL 提供 feedback skill，指导 agent 收集并提交用户反馈，包括上下文富集、匿名化与用户确认。

#### Scenario: Agent-initiated feedback

- **WHEN** 用户在 agent 会话中调用 feedback skill
- **THEN** agent 收集对话上下文并草拟富集反馈 issue
- **AND** 匿名化敏感信息
- **AND** 向用户展示完整草稿并请求明确批准后提交
#### Scenario: Context enrichment
- **WHEN** agent drafts feedback
- **THEN** the agent includes relevant context such as:
  - What task was being performed
  - What worked well or poorly
  - Specific friction points or praise
#### Scenario: Anonymization
- **WHEN** agent drafts feedback
- **THEN** the agent removes or replaces:
  - File paths with `<path>` or generic descriptions
  - API keys, tokens, secrets with `<redacted>`
  - Company/organization names with `<company>`
  - Personal names with `<user>`
  - Specific URLs with `<url>` unless public/relevant
#### Scenario: User confirmation required
- **WHEN** agent has drafted feedback
- **THEN** the agent MUST show the complete draft to the user
- **AND** ask for explicit approval before submitting
- **AND** allow the user to request modifications
- **AND** only submit after user confirms
### Requirement: Shell completions

系统 SHALL 为 feedback 命令提供 shell completions。

#### Scenario: Command completion

- **WHEN** user types `xirang fee<TAB>`
- **THEN** the shell completes to `xirang feedback`

#### Scenario: Flag completion

- **WHEN** user types `xirang feedback "msg" --<TAB>`
- **THEN** the shell suggests available flags (`--body`)

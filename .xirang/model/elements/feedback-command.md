---
entity: element-declaration
identity: feedback-command
kind: element
parent: cli
title: Feedback Command
definition: Feedback Command 定义 `xirang feedback` 通过 `gh` CLI 安全创建 GitHub Issue 的行为，包括无 shell 注入的命令执行、gh 缺失/未认证时的 manual fallback、issue metadata 匿名化、错误处理、Agent feedback skill 与 shell completion。
---

## Specification

### Section: Feedback command

系统 SHALL 提供 `xirang feedback` 命令，使用 `gh` CLI 在 xirang repository 中创建 GitHub Issue。系统 SHALL 使用 `execFileSync` 与 argument arrays 防止 shell injection。

- **Simple feedback submission**

  - user executes `xirang feedback "Great tool!"`
  - the system executes `gh issue create` with title "Feedback: Great tool!"
  - the issue is created in the xirang repository
  - the issue has the `feedback` label
  - the system displays the created issue URL

- **Safe command execution**

  - submitting feedback via `gh` CLI
  - the system uses `execFileSync` with separate arguments array
  - user input is NOT passed through a shell

- **Feedback with body**
  - 用户执行 `xirang feedback "Title here" --body "Detailed description..."`
  - 系统以指定 title 创建 GitHub Issue
  - issue body 包含详细描述与 metadata

### Section: GitHub CLI dependency

系统 SHALL 在 `gh` 可用时用于自动提交，并在 `gh` 未安装或未认证时提供 manual submission fallback。

- **Missing gh CLI with fallback**

  - `gh` CLI 未安装（PATH 中找不到）
  - 系统在 stderr 报告 gh 缺失及需要手工提交的警告
  - stdout 返回完成手工提交所需的完整反馈内容与预填 GitHub Issue URL，不附装饰分隔符
  - 以零码退出（成功 fallback）

- **Cross-platform gh CLI detection**

  - 系统检测 `gh` CLI 可用性
  - macOS/Linux 上执行 `which gh`，Windows 上执行 `where gh`

- **Unauthenticated gh CLI with fallback**

  - `gh` CLI 已安装但未认证
  - stderr 返回认证警告与具体指引，stdout 返回必要的结构化手工反馈材料
  - 以零码退出

- **Cross-platform gh CLI detection on Unix**
  - system is running on macOS or Linux (platform is 'darwin' or 'linux')
  - checking if `gh` CLI is installed
  - the system executes `which gh` command

- **Cross-platform gh CLI detection on Windows**
  - system is running on Windows (platform is 'win32')
  - checking if `gh` CLI is installed
  - the system executes `where gh` command

- **Authenticated gh CLI**
  - user runs `xirang feedback "message"`
  - `gh auth status` returns success (authenticated)
  - the system proceeds with feedback submission

### Section: Issue metadata

系统 SHALL 在 GitHub Issue body 中包含相关元数据，且不包含敏感信息。

- **Standard metadata**

  - 创建 GitHub Issue
  - issue body 包含 CLI version、platform 与 submission timestamp
  - 不包含文件路径、项目名、环境变量或 IP 地址

- **Windows platform metadata**
  - creating a GitHub Issue for feedback on Windows
  - the issue body includes "Platform: win32"
  - all platform detection uses Node.js `os.platform()` API

- **No sensitive metadata**
  - creating a GitHub Issue for feedback
  - the issue body does NOT include:
  - File paths from user's system
  - Project names or directory names
  - Environment variables
  - IP addresses

### Section: Feedback always works

系统 SHALL 允许 feedback 提交不受 telemetry 设置影响。

- **Feedback with telemetry disabled**

  - 用户通过环境变量禁用 telemetry 并运行 `xirang feedback "message"`
  - feedback 仍通过 `gh` CLI 提交且不发送 telemetry events

- **Feedback in CI environment**
  - 环境设置 `CI=true` 且用户运行 `xirang feedback "message"`
  - feedback 提交正常进行（若 `gh` 可用且已认证）

### Section: Error handling

系统 SHALL 优雅处理 feedback 提交错误。

- **gh CLI execution failure**

  - `gh issue create` 命令失败
  - 系统在 stderr 显示 gh 的具体错误；JSON 模式使用结构化诊断
  - 以与 `gh` 相同的 exit code 退出

- **Network failure**
  - `gh` CLI 报告网络连接问题
  - 系统在 stderr 显示 gh 的具体错误
  - 建议检查网络连接
  - 以非零码退出

### Section: Feedback skill for agents

系统 SHALL 提供 feedback skill，指导 agent 收集并提交用户反馈，包括上下文富集、匿名化与用户确认。

- **Agent-initiated feedback**

  - 用户在 agent 会话中调用 feedback skill
  - agent 收集对话上下文并草拟富集反馈 issue
  - 匿名化敏感信息
  - 向用户展示完整草稿并请求明确批准后提交

- **Context enrichment**
  - agent drafts feedback
  - the agent includes relevant context such as:
  - What task was being performed
  - What worked well or poorly
  - Specific friction points or praise

- **Anonymization**
  - agent drafts feedback
  - the agent removes or replaces:
  - File paths with `<path>` or generic descriptions
  - API keys, tokens, secrets with `<redacted>`
  - Company/organization names with `<company>`
  - Personal names with `<user>`
  - Specific URLs with `<url>` unless public/relevant

- **User confirmation required**
  - agent has drafted feedback
  - the agent MUST show the complete draft to the user
  - ask for explicit approval before submitting
  - allow the user to request modifications
  - only submit after user confirms

### Section: Shell completions

系统 SHALL 为 feedback 命令提供 shell completions。

- **Command completion**

  - user types `xirang fee<TAB>`
  - the shell completes to `xirang feedback`

- **Flag completion**

  - user types `xirang feedback "msg" --<TAB>`
  - the shell suggests available flags (`--body`)

### Section: 交付提交结果

反馈成功提交后 SHALL 返回实际 Issue URL；不得将该必要结果作为成功噪声省略，也不重复回显已提交正文或装饰成功消息。手工 fallback 的真实警告与必要材料 SHALL 保留，不能因退出码 0 将未自动提交伪装成已提交。

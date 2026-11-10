---
entity: element-declaration
identity: feedback-command
kind: element
parent: cli
title: "Feedback Command"
definition: "Feedback Command 定义 `xirang feedback` 通过 `gh` CLI 安全创建 GitHub Issue 的行为，包括无 shell 注入的命令执行、gh 缺失/未认证时的 manual fallback、issue metadata 匿名化、错误处理、Agent feedback skill 与 shell completion。"
---

## MODIFIED Sections

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

## ADDED Sections

### Section: 交付提交结果

反馈成功提交后 SHALL 返回实际 Issue URL；不得将该必要结果作为成功噪声省略，也不重复回显已提交正文或装饰成功消息。手工 fallback 的真实警告与必要材料 SHALL 保留，不能因退出码 0 将未自动提交伪装成已提交。

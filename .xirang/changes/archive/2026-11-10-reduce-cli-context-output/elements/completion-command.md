---
entity: element-declaration
identity: completion-command
kind: element
parent: cli
title: "Completion Command"
definition: "Completion Command 定义 `xirang completion` 为 Zsh、Bash、Fish 与 PowerShell 生成/安装/卸载 shell completion 的行为：native shell 行为集成、命令结构、shell 检测、基于运行时命令树的 completion 生成、动态 completion 与错误处理。"
---

## MODIFIED Sections

### Section: Completion 安装

`xirang completion install [shell]` SHALL 为自动检测或显式指定的 shell 安装 completion script，支持 `--yes` 跳过确认、`--verbose` 详细输出与 marker-based 配置修改。

- **安装 Zsh completion**

  - 用户执行 `xirang completion install zsh`
  - 在检测到 Oh My Zsh 时写入 `~/.oh-my-zsh/custom/completions/`，否则写入标准 Zsh completions 目录
  - 以 marker 方式修改 `~/.zshrc` 的 fpath

- **权限错误**

  - 安装因文件权限失败
  - 显示指明权限问题的清晰错误
  - 建议使用合适权限或替代安装方式
  - 以 exit code 1 退出

- **检测 Oh My Zsh 并安装**
  - 用户执行 `xirang completion install zsh`
  - 通过 `$ZSH` 环境变量或 `~/.oh-my-zsh/` 目录检测 Oh My Zsh
  - 检测到时写入 Oh My Zsh completions 目录
  - 未检测到时创建 `~/.zsh/completions/` 并写入标准 Zsh completion

- **安装 Fish completion**
  - 用户执行 `xirang completion install fish`
  - 创建 Fish completions 目录（如不存在）并写入 completion

- **安装 PowerShell completion**
  - 用户执行 `xirang completion install powershell`
  - 通过 `$PROFILE` 或默认路径检测 PowerShell profile 并写入 completion

- **自动检测 shell 安装**
  - 用户执行 `xirang completion install` 而不指定 shell
  - 使用 shell 检测逻辑检测当前 shell
  - 为检测到的 shell 安装 completion

- **已安装时提示重装**
  - 目标 shell 的 completion 已安装
  - 显示已安装提示
  - 提供覆盖重装/更新的选项

- **Installing for Oh My Zsh**
  - user executes `xirang completion install zsh`
  - detect if Oh My Zsh is installed by checking for `$ZSH` environment variable or `~/.oh-my-zsh/` directory
  - create custom completions directory at `~/.oh-my-zsh/custom/completions/` if it doesn't exist
  - write completion script to `~/.oh-my-zsh/custom/completions/_xirang`
  - ensure `~/.oh-my-zsh/custom/completions` is in `$fpath` by updating `~/.zshrc` if needed
  - 仅交付使变更生效所必需的 `exec zsh` 或终端重启提示

- **Installing for standard Zsh**
  - user executes `xirang completion install zsh` and Oh My Zsh is not detected
  - create completions directory at `~/.zsh/completions/` if it doesn't exist
  - write completion script to `~/.zsh/completions/_xirang`
  - add `fpath=(~/.zsh/completions $fpath)` to `~/.zshrc` if not already present
  - add `autoload -Uz compinit && compinit` to `~/.zshrc` if not already present
  - 仅交付使变更生效所必需的 `exec zsh` 或终端重启提示

- **Installing for Bash with bash-completion**
  - user executes `xirang completion install bash`
  - detect if bash-completion is installed by checking `/usr/share/bash-completion`、`/usr/local/share/bash-completion`、`/opt/homebrew/etc/bash_completion.d`、`/usr/local/etc/bash_completion.d` 或 `/etc/bash_completion.d`
  - 写入 completion 到 `~/.local/share/bash-completion/completions/xirang`
  - 以 marker（`# Xirang:START`/`# Xirang:END`）在 `~/.bashrc` 中 source 该文件
  - 未检测到 bash-completion 时显示 warning 并建议 `brew install bash-completion@2`
  - 仅交付使变更生效所必需的 `exec bash` 或终端重启提示

### Section: Completion 卸载

`xirang completion uninstall [shell]` SHALL 移除已安装的 completion script，支持 `--yes` 跳过确认与 marker-based 清理。

- **卸载 Zsh completion**

  - 用户执行 `xirang completion uninstall zsh`
  - 提示确认（除非 `--yes`）
  - 移除对应的 completions 文件与 `~/.zshrc` 中的 marker 修改

- **未安装时报错**

  - 尝试卸载未安装的 completion
  - 显示 completion 未安装的错误
  - 以 exit code 1 退出

- **自动检测 shell 卸载**
  - 用户执行 `xirang completion uninstall` 而不指定 shell
  - 检测当前 shell 并卸载该 shell 的 completion

- **未安装时卸载报错**
  - 尝试卸载未安装的 completion
  - 显示未安装的错误
  - 以 exit code 1 退出

- **Uninstalling Zsh completion**
  - user executes `xirang completion uninstall zsh`
  - prompt for confirmation before proceeding (unless `--yes` flag provided)
  - if user declines, cancel uninstall and display "Uninstall cancelled."
  - if user confirms, remove `~/.oh-my-zsh/custom/completions/_xirang` if Oh My Zsh is detected
  - remove `~/.zsh/completions/_xirang` if standard Zsh setup is detected
  - remove fpath modifications from `~/.zshrc` using marker-based removal
  - 成功无必要结果时静默

- **Uninstalling Bash completion**
  - user executes `xirang completion uninstall bash`
  - prompt for confirmation (unless `--yes` flag provided)
  - if user confirms, remove completion file from bash-completion directory or `~/.bash_completion.d/`
  - remove sourcing lines from `~/.bashrc` using marker-based removal
  - 成功无必要结果时静默

- **Uninstalling Fish completion**
  - user executes `xirang completion uninstall fish`
  - prompt for confirmation (unless `--yes` flag provided)
  - if user confirms, remove `~/.config/fish/completions/xirang.fish`
  - 成功无必要结果时静默（无需修改配置文件）

- **Uninstalling PowerShell completion**
  - user executes `xirang completion uninstall powershell`
  - prompt for confirmation (unless `--yes` flag provided)
  - if user confirms, remove completion import from PowerShell profile using marker-based removal
  - remove completion script file
  - 成功无必要结果时静默

### Section: Error Handling

The completion command SHALL provide clear error messages for common failure scenarios.

- **Unsupported shell**

  - user requests completion for unsupported shell
  - display error message listing supported shells
  - exit with code 1

- **Shell not detected**

  - `xirang completion install` cannot detect current shell
  - display error: "Could not auto-detect shell. Please specify shell explicitly."
  - exit with code 1

- **缺失 shell 配置目录**
  - 期望的 shell 配置目录不存在
  - 自动创建该目录，不附普通创建回执
  - 继续安装

### Section: Output Format

Completion SHALL 按请求交付脚本或必要结果，警告和错误进入 stderr。generate 的 stdout SHALL 只有完整脚本内容，能够直接重定向保存。安装或卸载成功无必要结果时 SHALL 静默；必要的 shell reload 信息保留，不附 checkmark、彩色成功段落或重复文件创建确认。

显式 --verbose SHALL 按需返回 shell 检测、目标路径和配置修改详情；非交互调用即使请求详情，也 SHALL 不输出 spinner 或成功装饰。

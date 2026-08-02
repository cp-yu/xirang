---
entity: element-declaration
identity: completion-command
kind: capability
parent: cli
title: Completion Command
definition: Completion Command 定义 `xirang completion` 为 Zsh、Bash、Fish 与 PowerShell 生成/安装/卸载 shell completion 的行为：native shell 行为集成、命令结构、shell 检测、基于运行时命令树的 completion 生成、动态 completion 与错误处理。
---

## Requirements

### Requirement: Native Shell Behavior Integration

The completion system SHALL respect and integrate with each supported shell's native completion patterns and user interaction model.

#### Scenario: Zsh native completion

- **WHEN** generating Zsh completion scripts
- **THEN** use Zsh completion system with `_arguments`, `_describe`, and `compadd`
- **AND** completions SHALL trigger on single TAB (standard Zsh behavior)
- **AND** display as an interactive menu that users navigate with TAB/arrow keys
- **AND** support Oh My Zsh's enhanced menu styling automatically

#### Scenario: Bash native completion

- **WHEN** generating Bash completion scripts
- **THEN** use Bash completion with `complete` builtin and `COMPREPLY` array
- **AND** completions SHALL trigger on double TAB (standard Bash behavior)
- **AND** display as space-separated list or column format
- **AND** support both bash-completion v1 and v2 patterns

#### Scenario: Fish native completion

- **WHEN** generating Fish completion scripts
- **THEN** use Fish's `complete` command with conditions
- **AND** completions SHALL trigger on single TAB with auto-suggestion preview
- **AND** display with Fish's native coloring and description alignment
- **AND** leverage Fish's built-in caching automatically

#### Scenario: PowerShell native completion

- **WHEN** generating PowerShell completion scripts
- **THEN** use `Register-ArgumentCompleter` with scriptblock
- **AND** completions SHALL trigger on TAB with cycling behavior
- **AND** display with PowerShell's native completion UI
- **AND** support both Windows PowerShell 5.1 and PowerShell Core 7+

#### Scenario: No custom UX patterns

- **WHEN** implementing completion for any shell
- **THEN** do NOT attempt to customize completion trigger behavior
- **AND** do NOT override shell-specific navigation patterns
- **AND** ensure completions feel native to experienced users of that shell

### Requirement: Command Structure

The completion command SHALL follow a subcommand pattern for generating and managing completion scripts.

#### Scenario: Available subcommands

- **WHEN** user executes `xirang completion --help`
- **THEN** display available subcommands:
  - `generate [shell]` - Generate completion script for a shell (outputs to stdout)
  - `install [shell]` - Install completion (auto-detects or requires explicit shell)
  - `uninstall [shell]` - Remove completion (auto-detects or requires explicit shell)

### Requirement: Shell Detection

The completion system SHALL automatically detect the user's current shell environment.

#### Scenario: Detecting Zsh from environment

- **WHEN** no shell is explicitly specified
- **THEN** read the `$SHELL` environment variable and extract the shell name
- **AND** validate the shell is one of: `zsh`, `bash`, `fish`, `powershell`
- **AND** throw an error if the shell is not supported

#### Scenario: Detecting PowerShell from environment

- **WHEN** `$PSModulePath` environment variable is present
- **THEN** detect shell as `powershell`
#### Scenario: Detecting Bash from environment
- **WHEN** `$SHELL` contains `bash` in the path
- **THEN** detect shell as `bash`
- **AND** proceed with bash-specific completion logic
#### Scenario: Unsupported shell detection
- **WHEN** shell path indicates an unsupported shell
- **THEN** throw error: "Shell '<name>' is not supported. Supported shells: zsh, bash, fish, powershell"
#### Scenario: Detecting Fish from environment
- **WHEN** `$SHELL` contains `fish` in the path
- **THEN** detect shell as `fish`
- **AND** proceed with fish-specific completion logic
### Requirement: Completion Generation
Completion command SHALL 为所有 supported shells 生成来自当前 Commander.js command tree 的 completion scripts，并 SHALL 反映 setup、Candidate 与 Project Build 的当前 surface。

#### Scenario: 所有 shell 暴露当前 commands
- **WHEN** 为 Zsh、Bash、Fish 或 PowerShell 生成 completion
- **THEN** output SHALL 包含 `setup`
- **AND** SHALL 包含 `candidate` 及其 `init`、`status`、`validate`、`promote` subcommands
- **AND** SHALL NOT 包含退役命令名
- **AND** SHALL 包含每个 current command 的 flags 与 descriptions

#### Scenario: Generated script 保持 shell-native
- **WHEN** 为任一 supported shell 生成 completion
- **THEN** SHALL 保持该 shell 的 native completion primitives、escaping 和 interaction behavior
- **AND** SHALL 从 runtime command introspection 获取 command definitions
#### Scenario: Candidate subcommand completion
- **WHEN** 用户输入 `xirang candidate <TAB>`
- **THEN** shell SHALL 建议 `init`、`status`、`validate`、`promote`
- **AND** `init` SHALL complete its starting-point options
- **AND** `validate` SHALL complete `--json`
- **AND** `promote` SHALL complete `--digest`
### Requirement: Dynamic Completions
Dynamic completion SHALL 继续为 change IDs 与 Element identity 提供 project-aware suggestions，并 SHALL NOT 从 Candidate 或 history 推断 formal identifiers。

#### Scenario: Formal ID completion
- **WHEN** command 需要 change 或 Element identifier
- **THEN** provider SHALL 从 formal 源读取 suggestions
- **AND** SHALL 排除 archive、Candidate 与 history entries

#### Scenario: Project 外 completion
- **WHEN** 当前目录不是 Xirang project
- **THEN** 动态 provider SHALL 返回空 suggestions（`__complete` 静默失败）
- **AND** shell 仅提供脚本内置的 static command 和 flag suggestions

### Requirement: Architecture Patterns

The completion implementation SHALL follow clean architecture principles，通过 plugin-based pattern 支持多个 shell。

#### Scenario: Shell-specific generators

- **WHEN** implementing completion generators
- **THEN** 为每个 shell 创建 generator class，实现公共 `CompletionGenerator` 接口
- **AND** 所有 generators 消费同一份来自 introspection function 的 `CommandDefinition[]`

#### Scenario: 命令树运行时反射

- **WHEN** 补全系统需要命令定义
- **THEN** 通过运行时反射函数从 Commander.js `Command` 实例反射命令树
- **AND** 通过集中式常量合并 `positionalType` 注解
- **AND** 不存在独立的静态 `COMMAND_REGISTRY` 数组
#### Scenario: Shell-specific installers
- **WHEN** implementing completion installers
- **THEN** create installer classes for each shell: `ZshInstaller`, `BashInstaller`, `FishInstaller`, `PowerShellInstaller`
- **AND** implement a common `CompletionInstaller` interface with methods:
  - `install(script: string): Promise<InstallationResult>` - Installs completion script
  - `uninstall(): Promise<{ success: boolean; message: string }>` - Removes completion
- **AND** each installer handles shell-specific paths, config files, and installation patterns
#### Scenario: Factory pattern for shell selection
- **WHEN** selecting shell-specific implementation
- **THEN** use `CompletionFactory` class with static methods:
  - `createGenerator(shell: SupportedShell): CompletionGenerator`
  - `createInstaller(shell: SupportedShell): CompletionInstaller`
- **AND** factory uses switch statements with TypeScript exhaustiveness checking
- **AND** adding new shell requires updating `SupportedShell` type and factory cases
#### Scenario: Dynamic completion providers
- **WHEN** implementing dynamic completions
- **THEN** create a `CompletionProvider` class that encapsulates project discovery logic
- **AND** implement methods:
  - `getChangeIds(): Promise<string[]>` - Discovers active change IDs
  - `getContractElementIds(): Promise<string[]>` - Discovers Element identities whose Contract is non-empty（经 Element identity 索引）
- **AND** implement caching with 2-second TTL using class properties
#### Scenario: Type-safe shell detection
- **WHEN** implementing shell detection
- **THEN** define a `SupportedShell` type as literal type: `'zsh' | 'bash' | 'fish' | 'powershell'`
- **AND** implement `detectShell()` function in `src/utils/shell-detection.ts`
- **AND** 返回 `{ shell, detected }`；shell 解析或支持性错误由 `CompletionCommand` 层以支持的 shell 列表报出
### Requirement: Completion 安装

`xirang completion install [shell]` SHALL 为自动检测或显式指定的 shell 安装 completion script，支持 `--yes` 跳过确认、`--verbose` 详细输出与 marker-based 配置修改。

#### Scenario: 安装 Zsh completion

- **WHEN** 用户执行 `xirang completion install zsh`
- **THEN** 在检测到 Oh My Zsh 时写入 `~/.oh-my-zsh/custom/completions/`，否则写入标准 Zsh completions 目录
- **AND** 以 marker 方式修改 `~/.zshrc` 的 fpath

#### Scenario: 权限错误

- **WHEN** 安装因文件权限失败
- **THEN** 显示指明权限问题的清晰错误
- **AND** 建议使用合适权限或替代安装方式
- **AND** 以 exit code 1 退出
#### Scenario: 检测 Oh My Zsh 并安装
- **WHEN** 用户执行 `xirang completion install zsh`
- **THEN** 通过 `$ZSH` 环境变量或 `~/.oh-my-zsh/` 目录检测 Oh My Zsh
- **AND** 检测到时写入 Oh My Zsh completions 目录
- **AND** 未检测到时创建 `~/.zsh/completions/` 并写入标准 Zsh completion
#### Scenario: 安装 Fish completion
- **WHEN** 用户执行 `xirang completion install fish`
- **THEN** 创建 Fish completions 目录（如不存在）并写入 completion
#### Scenario: 安装 PowerShell completion
- **WHEN** 用户执行 `xirang completion install powershell`
- **THEN** 通过 `$PROFILE` 或默认路径检测 PowerShell profile 并写入 completion
#### Scenario: 自动检测 shell 安装
- **WHEN** 用户执行 `xirang completion install` 而不指定 shell
- **THEN** 使用 shell 检测逻辑检测当前 shell
- **AND** 为检测到的 shell 安装 completion
#### Scenario: 已安装时提示重装
- **WHEN** 目标 shell 的 completion 已安装
- **THEN** 显示已安装提示
- **AND** 提供覆盖重装/更新的选项
#### Scenario: Installing for Oh My Zsh
- **WHEN** user executes `xirang completion install zsh`
- **THEN** detect if Oh My Zsh is installed by checking for `$ZSH` environment variable or `~/.oh-my-zsh/` directory
- **AND** create custom completions directory at `~/.oh-my-zsh/custom/completions/` if it doesn't exist
- **AND** write completion script to `~/.oh-my-zsh/custom/completions/_xirang`
- **AND** ensure `~/.oh-my-zsh/custom/completions` is in `$fpath` by updating `~/.zshrc` if needed
- **AND** display success message with instruction to run `exec zsh` or restart terminal
#### Scenario: Installing for standard Zsh
- **WHEN** user executes `xirang completion install zsh` and Oh My Zsh is not detected
- **THEN** create completions directory at `~/.zsh/completions/` if it doesn't exist
- **AND** write completion script to `~/.zsh/completions/_xirang`
- **AND** add `fpath=(~/.zsh/completions $fpath)` to `~/.zshrc` if not already present
- **AND** add `autoload -Uz compinit && compinit` to `~/.zshrc` if not already present
- **AND** display success message with instruction to run `exec zsh` or restart terminal
#### Scenario: Installing for Bash with bash-completion
- **WHEN** user executes `xirang completion install bash`
- **THEN** detect if bash-completion is installed by checking `/usr/share/bash-completion`、`/usr/local/share/bash-completion`、`/opt/homebrew/etc/bash_completion.d`、`/usr/local/etc/bash_completion.d` 或 `/etc/bash_completion.d`
- **AND** 写入 completion 到 `~/.local/share/bash-completion/completions/xirang`
- **AND** 以 marker（`# Xirang:START`/`# Xirang:END`）在 `~/.bashrc` 中 source 该文件
- **AND** 未检测到 bash-completion 时显示 warning 并建议 `brew install bash-completion@2`
- **AND** display success message with instruction to run `exec bash` or restart terminal
### Requirement: Completion 卸载

`xirang completion uninstall [shell]` SHALL 移除已安装的 completion script，支持 `--yes` 跳过确认与 marker-based 清理。

#### Scenario: 卸载 Zsh completion

- **WHEN** 用户执行 `xirang completion uninstall zsh`
- **THEN** 提示确认（除非 `--yes`）
- **AND** 移除对应的 completions 文件与 `~/.zshrc` 中的 marker 修改

#### Scenario: 未安装时报错

- **WHEN** 尝试卸载未安装的 completion
- **THEN** 显示 completion 未安装的错误
- **AND** 以 exit code 1 退出
#### Scenario: 自动检测 shell 卸载
- **WHEN** 用户执行 `xirang completion uninstall` 而不指定 shell
- **THEN** 检测当前 shell 并卸载该 shell 的 completion
#### Scenario: 未安装时卸载报错
- **WHEN** 尝试卸载未安装的 completion
- **THEN** 显示未安装的错误
- **AND** 以 exit code 1 退出
#### Scenario: Uninstalling Zsh completion
- **WHEN** user executes `xirang completion uninstall zsh`
- **THEN** prompt for confirmation before proceeding (unless `--yes` flag provided)
- **AND** if user declines, cancel uninstall and display "Uninstall cancelled."
- **AND** if user confirms, remove `~/.oh-my-zsh/custom/completions/_xirang` if Oh My Zsh is detected
- **AND** remove `~/.zsh/completions/_xirang` if standard Zsh setup is detected
- **AND** remove fpath modifications from `~/.zshrc` using marker-based removal
- **AND** display success message
#### Scenario: Uninstalling Bash completion
- **WHEN** user executes `xirang completion uninstall bash`
- **THEN** prompt for confirmation (unless `--yes` flag provided)
- **AND** if user confirms, remove completion file from bash-completion directory or `~/.bash_completion.d/`
- **AND** remove sourcing lines from `~/.bashrc` using marker-based removal
- **AND** display success message
#### Scenario: Uninstalling Fish completion
- **WHEN** user executes `xirang completion uninstall fish`
- **THEN** prompt for confirmation (unless `--yes` flag provided)
- **AND** if user confirms, remove `~/.config/fish/completions/xirang.fish`
- **AND** display success message (no config file modification needed)
#### Scenario: Uninstalling PowerShell completion
- **WHEN** user executes `xirang completion uninstall powershell`
- **THEN** prompt for confirmation (unless `--yes` flag provided)
- **AND** if user confirms, remove completion import from PowerShell profile using marker-based removal
- **AND** remove completion script file
- **AND** display success message
### Requirement: Error Handling

The completion command SHALL provide clear error messages for common failure scenarios.

#### Scenario: Unsupported shell

- **WHEN** user requests completion for unsupported shell
- **THEN** display error message listing supported shells
- **AND** exit with code 1

#### Scenario: Shell not detected

- **WHEN** `xirang completion install` cannot detect current shell
- **THEN** display error: "Could not auto-detect shell. Please specify shell explicitly."
- **AND** exit with code 1
#### Scenario: 缺失 shell 配置目录
- **WHEN** 期望的 shell 配置目录不存在
- **THEN** 自动创建该目录（附带用户通知）
- **AND** 继续安装
### Requirement: Output Format

The completion command SHALL provide machine-parseable and human-readable output.

#### Scenario: Script generation output

- **WHEN** generating completion script to stdout
- **THEN** output only the completion script content (no extra messages)
- **AND** allow redirection to files
#### Scenario: Installation success output
- **WHEN** installation completes successfully
- **THEN** display formatted success message with:
  - Checkmark indicator
  - Installation location
  - Next steps (shell reload instructions)
- **AND** use colors when terminal supports it (unless `--no-color` is set)
#### Scenario: Verbose installation output
- **WHEN** user provides `--verbose` flag during installation
- **THEN** display detailed steps:
  - Shell detection result
  - Target file paths
  - Configuration modifications
  - File creation confirmations
### Requirement: Testing Support

The completion implementation SHALL be testable with unit and integration tests for all supported shells.

#### Scenario: Generator output verification

- **WHEN** testing completion generators
- **THEN** 为每个 shell generator 创建测试套件
- **AND** 验证生成脚本包含该 shell 的预期模式、命令注册与动态 completion 占位符
#### Scenario: Mock shell environment
- **WHEN** writing tests for shell detection
- **THEN** allow overriding `$SHELL` and `$PSModulePath` environment variables
- **AND** use dependency injection for file system operations
- **AND** test detection for all four shells independently
#### Scenario: Installer simulation
- **WHEN** testing installation logic
- **THEN** create test suite for each shell installer
- **AND** use temporary test directories instead of actual home directories
- **AND** verify file creation without modifying real shell configurations
- **AND** test path resolution logic independently
- **AND** mock file system operations to avoid side effects
#### Scenario: Cross-shell consistency
- **WHEN** testing completion behavior
- **THEN** verify all shells support the same commands and flags
- **AND** verify dynamic completions work consistently across shells
- **AND** ensure error messages are consistent across shells
### Requirement: Command Registry

`CompletionCommand` SHALL 通过构造时注入的 Commander.js `program` 实例调用运行时反射获取命令定义，而非依赖静态 `COMMAND_REGISTRY` 常量。

#### Scenario: 运行时反射取代静态注册表

- **WHEN** `CompletionCommand` 被实例化
- **THEN** 构造函数 SHALL 接收 Commander.js `Command` 实例作为参数
- **AND** 在 generate/install 操作中调用运行时反射函数
- **AND** 不 import 或引用静态 command-registry 模块

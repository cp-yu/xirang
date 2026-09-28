---
entity: element-declaration
identity: completion-command
kind: element
parent: cli
title: Completion Command
definition: Completion Command 定义 `xirang completion` 为 Zsh、Bash、Fish 与 PowerShell 生成/安装/卸载 shell completion 的行为：native shell 行为集成、命令结构、shell 检测、基于运行时命令树的 completion 生成、动态 completion 与错误处理。
---

## Specification

### Section: Native Shell Behavior Integration

The completion system SHALL respect and integrate with each supported shell's native completion patterns and user interaction model.

- **Zsh native completion**

  - generating Zsh completion scripts
  - use Zsh completion system with `_arguments`, `_describe`, and `compadd`
  - completions SHALL trigger on single TAB (standard Zsh behavior)
  - display as an interactive menu that users navigate with TAB/arrow keys
  - support Oh My Zsh's enhanced menu styling automatically

- **Bash native completion**

  - generating Bash completion scripts
  - use Bash completion with `complete` builtin and `COMPREPLY` array
  - completions SHALL trigger on double TAB (standard Bash behavior)
  - display as space-separated list or column format
  - support both bash-completion v1 and v2 patterns

- **Fish native completion**

  - generating Fish completion scripts
  - use Fish's `complete` command with conditions
  - completions SHALL trigger on single TAB with auto-suggestion preview
  - display with Fish's native coloring and description alignment
  - leverage Fish's built-in caching automatically

- **PowerShell native completion**

  - generating PowerShell completion scripts
  - use `Register-ArgumentCompleter` with scriptblock
  - completions SHALL trigger on TAB with cycling behavior
  - display with PowerShell's native completion UI
  - support both Windows PowerShell 5.1 and PowerShell Core 7+

- **No custom UX patterns**

  - implementing completion for any shell
  - do NOT attempt to customize completion trigger behavior
  - do NOT override shell-specific navigation patterns
  - ensure completions feel native to experienced users of that shell

### Section: Command Structure

The completion command SHALL follow a subcommand pattern for generating and managing completion scripts.

- **Available subcommands**

  - user executes `xirang completion --help`
  - display available subcommands:
  - `generate [shell]` - Generate completion script for a shell (outputs to stdout)
  - `install [shell]` - Install completion (auto-detects or requires explicit shell)
  - `uninstall [shell]` - Remove completion (auto-detects or requires explicit shell)

### Section: Shell Detection

The completion system SHALL automatically detect the user's current shell environment.

- **Detecting Zsh from environment**

  - no shell is explicitly specified
  - read the `$SHELL` environment variable and extract the shell name
  - validate the shell is one of: `zsh`, `bash`, `fish`, `powershell`
  - throw an error if the shell is not supported

- **Detecting PowerShell from environment**

  - `$PSModulePath` environment variable is present
  - detect shell as `powershell`

- **Detecting Bash from environment**
  - `$SHELL` contains `bash` in the path
  - detect shell as `bash`
  - proceed with bash-specific completion logic

- **Unsupported shell detection**
  - shell path indicates an unsupported shell
  - throw error: "Shell '<name>' is not supported. Supported shells: zsh, bash, fish, powershell"

- **Detecting Fish from environment**
  - `$SHELL` contains `fish` in the path
  - detect shell as `fish`
  - proceed with fish-specific completion logic
### Section: Completion Generation
Completion command SHALL 为所有 supported shells 生成来自当前 Commander.js command tree 的 completion scripts，并 SHALL 反映 setup、Candidate 与 Project Build 的当前 surface。

- **所有 shell 暴露当前 commands**
  - 为 Zsh、Bash、Fish 或 PowerShell 生成 completion
  - output SHALL 包含 `setup`
  - SHALL 包含 `candidate` 及其 `init`、`status`、`validate`、`promote` subcommands
  - SHALL NOT 包含退役命令名
  - SHALL 包含每个 current command 的 flags 与 descriptions

- **Generated script 保持 shell-native**
  - 为任一 supported shell 生成 completion
  - SHALL 保持该 shell 的 native completion primitives、escaping 和 interaction behavior
  - SHALL 从 runtime command introspection 获取 command definitions

- **Candidate subcommand completion**
  - 用户输入 `xirang candidate <TAB>`
  - shell SHALL 建议 `init`、`status`、`validate`、`promote`
  - `init` SHALL complete its starting-point options
  - `validate` SHALL complete `--json`
  - `promote` SHALL complete `--digest`
### Section: Dynamic Completions
Dynamic completion SHALL 继续为 change IDs 与 Element identity 提供 project-aware suggestions，并 SHALL NOT 从 Candidate 或 history 推断 formal identifiers。

- **Formal ID completion**
  - command 需要 change 或 Element identifier
  - provider SHALL 从 formal 源读取 suggestions
  - SHALL 排除 archive、Candidate 与 history entries

- **Project 外 completion**
  - 当前目录不是 Xirang project
  - 动态 provider SHALL 返回空 suggestions（`__complete` 静默失败）
  - shell 仅提供脚本内置的 static command 和 flag suggestions

### Section: Architecture Patterns

The completion implementation SHALL follow clean architecture principles，通过 plugin-based pattern 支持多个 shell。

- **Shell-specific generators**

  - implementing completion generators
  - 为每个 shell 创建 generator class，实现公共 `CompletionGenerator` 接口
  - 所有 generators 消费同一份来自 introspection function 的 `CommandDefinition[]`

- **命令树运行时反射**

  - 补全系统需要命令定义
  - 通过运行时反射函数从 Commander.js `Command` 实例反射命令树
  - 通过集中式常量合并 `positionalType` 注解
  - 不存在独立的静态 `COMMAND_REGISTRY` 数组

- **Shell-specific installers**
  - implementing completion installers
  - create installer classes for each shell: `ZshInstaller`, `BashInstaller`, `FishInstaller`, `PowerShellInstaller`
  - implement a common `CompletionInstaller` interface with methods:
  - `install(script: string): Promise<InstallationResult>` - Installs completion script
  - `uninstall(): Promise<{ success: boolean; message: string }>` - Removes completion
  - each installer handles shell-specific paths, config files, and installation patterns

- **Factory pattern for shell selection**
  - selecting shell-specific implementation
  - use `CompletionFactory` class with static methods:
  - `createGenerator(shell: SupportedShell): CompletionGenerator`
  - `createInstaller(shell: SupportedShell): CompletionInstaller`
  - factory uses switch statements with TypeScript exhaustiveness checking
  - adding new shell requires updating `SupportedShell` type and factory cases

- **Dynamic completion providers**
  - implementing dynamic completions
  - create a `CompletionProvider` class that encapsulates project discovery logic
  - implement methods:
  - `getChangeIds(): Promise<string[]>` - Discovers active change IDs
  - `getContractElementIds(): Promise<string[]>` - Discovers Element identities whose Contract is non-empty（经 Element identity 索引）
  - implement caching with 2-second TTL using class properties

- **Type-safe shell detection**
  - implementing shell detection
  - define a `SupportedShell` type as literal type: `'zsh' | 'bash' | 'fish' | 'powershell'`
  - implement `detectShell()` function in `src/utils/shell-detection.ts`
  - 返回 `{ shell, detected }`；shell 解析或支持性错误由 `CompletionCommand` 层以支持的 shell 列表报出
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
  - display success message with instruction to run `exec zsh` or restart terminal

- **Installing for standard Zsh**
  - user executes `xirang completion install zsh` and Oh My Zsh is not detected
  - create completions directory at `~/.zsh/completions/` if it doesn't exist
  - write completion script to `~/.zsh/completions/_xirang`
  - add `fpath=(~/.zsh/completions $fpath)` to `~/.zshrc` if not already present
  - add `autoload -Uz compinit && compinit` to `~/.zshrc` if not already present
  - display success message with instruction to run `exec zsh` or restart terminal

- **Installing for Bash with bash-completion**
  - user executes `xirang completion install bash`
  - detect if bash-completion is installed by checking `/usr/share/bash-completion`、`/usr/local/share/bash-completion`、`/opt/homebrew/etc/bash_completion.d`、`/usr/local/etc/bash_completion.d` 或 `/etc/bash_completion.d`
  - 写入 completion 到 `~/.local/share/bash-completion/completions/xirang`
  - 以 marker（`# Xirang:START`/`# Xirang:END`）在 `~/.bashrc` 中 source 该文件
  - 未检测到 bash-completion 时显示 warning 并建议 `brew install bash-completion@2`
  - display success message with instruction to run `exec bash` or restart terminal
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
  - display success message

- **Uninstalling Bash completion**
  - user executes `xirang completion uninstall bash`
  - prompt for confirmation (unless `--yes` flag provided)
  - if user confirms, remove completion file from bash-completion directory or `~/.bash_completion.d/`
  - remove sourcing lines from `~/.bashrc` using marker-based removal
  - display success message

- **Uninstalling Fish completion**
  - user executes `xirang completion uninstall fish`
  - prompt for confirmation (unless `--yes` flag provided)
  - if user confirms, remove `~/.config/fish/completions/xirang.fish`
  - display success message (no config file modification needed)

- **Uninstalling PowerShell completion**
  - user executes `xirang completion uninstall powershell`
  - prompt for confirmation (unless `--yes` flag provided)
  - if user confirms, remove completion import from PowerShell profile using marker-based removal
  - remove completion script file
  - display success message
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
  - 自动创建该目录（附带用户通知）
  - 继续安装
### Section: Output Format

The completion command SHALL provide machine-parseable and human-readable output.

- **Script generation output**

  - generating completion script to stdout
  - output only the completion script content (no extra messages)
  - allow redirection to files

- **Installation success output**
  - installation completes successfully
  - display formatted success message with:
  - Checkmark indicator
  - Installation location
  - Next steps (shell reload instructions)
  - use colors when terminal supports it (unless `--no-color` is set)

- **Verbose installation output**
  - user provides `--verbose` flag during installation
  - display detailed steps:
  - Shell detection result
  - Target file paths
  - Configuration modifications
  - File creation confirmations
### Section: Testing Support

The completion implementation SHALL be testable with unit and integration tests for all supported shells.

- **Generator output verification**

  - testing completion generators
  - 为每个 shell generator 创建测试套件
  - 验证生成脚本包含该 shell 的预期模式、命令注册与动态 completion 占位符

- **Mock shell environment**
  - writing tests for shell detection
  - allow overriding `$SHELL` and `$PSModulePath` environment variables
  - use dependency injection for file system operations
  - test detection for all four shells independently

- **Installer simulation**
  - testing installation logic
  - create test suite for each shell installer
  - use temporary test directories instead of actual home directories
  - verify file creation without modifying real shell configurations
  - test path resolution logic independently
  - mock file system operations to avoid side effects

- **Cross-shell consistency**
  - testing completion behavior
  - verify all shells support the same commands and flags
  - verify dynamic completions work consistently across shells
  - ensure error messages are consistent across shells
### Section: Command Registry

`CompletionCommand` SHALL 通过构造时注入的 Commander.js `program` 实例调用运行时反射获取命令定义，而非依赖静态 `COMMAND_REGISTRY` 常量。

- **运行时反射取代静态注册表**

  - `CompletionCommand` 被实例化
  - 构造函数 SHALL 接收 Commander.js `Command` 实例作为参数
  - 在 generate/install 操作中调用运行时反射函数
  - 不 import 或引用静态 command-registry 模块

---
entity: element-declaration
identity: telemetry
kind: element
parent: cli
title: Telemetry
definition: Telemetry 定义息壤匿名使用遥测的行为：CLI 命令执行跟踪、隐私保护的 event 设计、用户 opt-out 机制、首次运行 notice 展示与 `xirang` executable identity 使用。它管理 PostHog 集成并确保遥测最小化、透明且尊重用户隐私。
---

## Specification

### Section: Command execution tracking
系统 SHALL 在任何 CLI 命令执行时向 PostHog 发送 `command_executed` event，仅包含命令名称与版本作为 properties。

- **Standard command execution**
  - 用户运行任何 xirang 命令
  - 系统发送 `command_executed` event，带 `command` 与 `version` properties

- **Subcommand execution**
  - 用户运行嵌套命令
  - 系统发送 `command_executed` event，带完整 command path（如 `candidate:validate`）

### Section: Privacy-preserving event design
Telemetry events SHALL NOT 包含 command arguments、文件路径、项目名称、Contract 内容、Candidate 内容、digest、错误消息或 IP 地址。

- **Setup command 带参数**
  - 用户运行带参数的 setup 命令
  - telemetry event SHALL 只包含 `command` 与 `version`
  - SHALL NOT 包含 project path 或 tool selection

- **Candidate validation**
  - 用户运行 `xirang candidate validate --json`
  - telemetry event SHALL 只包含 command path 与 `version`
  - SHALL NOT 包含 Candidate paths、diagnostics 或 `reviewDigest`

- **IP address exclusion**
  - 系统发送 telemetry event
  - SHALL 显式设置 `$ip: null`

### Section: Opt-out 仅由环境与运行时状态控制

系统 SHALL 通过环境变量与运行时状态禁用遥测：`XIRANG_TELEMETRY=0`、`DO_NOT_TRACK=1`、`XIRANG_INTERACTIVE=0`、CI 环境与非 TTY stdin。不存在配置开关：持久化 telemetry 配置只包含 `anonymousId` 与 `noticeSeen`，不包含 enabled/disabled 设置。

- **环境变量禁用遥测**
  - 用户设置 `XIRANG_TELEMETRY=0`
  - 系统 SHALL 不发送 telemetry events

- **DO_NOT_TRACK 标准**
  - 用户设置 `DO_NOT_TRACK=1`
  - 系统 SHALL 不发送 telemetry events

- **环境变量优先于既有使用状态**
  - 用户此前使用过 CLI（config 存在）且设置 `XIRANG_TELEMETRY=0`
  - telemetry SHALL 被禁用，不受 config 状态影响

- **non-interactive 自动禁用**
  - `XIRANG_INTERACTIVE=0` 或 stdin 不是 TTY
  - 系统 SHALL 不发送 telemetry events

### Section: CI 环境自动禁用
系统 SHALL 在 CI 环境（`CI` 环境变量存在）自动禁用 telemetry。

- **CI 环境检测**
  - 环境中设置 `CI=true`
  - 系统 SHALL 不发送 telemetry events

- **CI 显式启用仍禁用**
  - `CI=true` 已设置
  - `XIRANG_TELEMETRY=1` 被显式设置
  - telemetry 仍 SHALL 保持禁用（CI 为隐私优先）

### Section: 匿名用户标识
系统 SHALL 在首次 telemetry 发送时生成随机 UUID 作为匿名标识，并存储于全局配置。

- **首次 telemetry event**
  - 发送第一个 telemetry event
  - config 中不存在 anonymousId
  - 系统 SHALL 生成随机 UUID v4 并存储到 config

- **持久身份**
  - 用户跨 session 运行多个命令
  - 全部 events SHALL 使用同一 anonymousId

- **opt-out 时惰性生成**
  - 用户在运行任何命令前 opt out
  - SHALL NOT 生成或存储任何 anonymousId

### Section: 即时发送 events
系统 SHALL 不经 batching 地即时发送 telemetry events。

- **事件传输时机**
  - 一个命令执行
  - telemetry event SHALL 立即发送，而非排队批量传输

### Section: 优雅 shutdown
系统 SHALL 在 CLI 退出前调用 shutdown 以确保 pending events 被 flush。

- **正常退出**
  - 命令成功完成
  - 系统 SHALL 在退出前 await shutdown()

- **异常退出**
  - 命令因错误失败
  - 系统 SHALL 仍在退出前 await shutdown()

### Section: 静默失败处理
系统 SHALL 静默忽略 telemetry 失败，不影响 CLI 功能。

- **网络失败**
  - telemetry request 因网络错误失败
  - CLI 命令 SHALL 无错误消息地正常完成

- **服务不可用**
  - telemetry 服务不可用
  - CLI 命令 SHALL 无错误消息地正常完成

- **shutdown 失败**
  - shutdown() 失败或超时
  - CLI SHALL 无错误消息地正常退出

- **PostHog outage**
  - PostHog service is unavailable
  - the CLI command completes normally without error message
### Section: 首次运行 telemetry 披露

系统 SHALL 在首个命令执行时、任何 telemetry 发送之前显示一行遥测披露 notice，并在 `noticeSeen` 后不再展示。

- **首次命令展示披露**
  - 用户运行其首个 xirang 命令
  - telemetry 已启用
  - 系统 SHALL 显示："Note: Xirang collects anonymous usage stats. Opt out: XIRANG_TELEMETRY=0"

- **已见过 notice 后不再展示**
  - 用户此前已见过 notice（config 中 `noticeSeen: true`）
  - 系统 SHALL NOT 展示该 notice

- **披露先于 telemetry 发送**
  - 展示首次运行 notice
  - 披露完成后才允许 `trackCommand` 发送任何 telemetry event

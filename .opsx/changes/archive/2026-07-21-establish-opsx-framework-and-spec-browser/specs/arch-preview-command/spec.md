## REMOVED Requirements

### Requirement: arch preview 命令 SHALL 启动 LikeC4 web 服务器

移除 `arch preview` 命令。

**Reason**: 架构与 Specs 浏览统一由顶层 `opsx view` 命令承担，`arch preview` 不再独立存在。

**Migration**: 用户运行 `opsx view` 启动内置 Web 浏览器，同时展示架构与 Specs。

### Requirement: arch preview SHALL 支持 --port 选项

移除 `arch preview --port` 选项。

**Reason**: `arch preview` 命令已移除。

**Migration**: 用户通过 `opsx view --port <n>` 指定端口。

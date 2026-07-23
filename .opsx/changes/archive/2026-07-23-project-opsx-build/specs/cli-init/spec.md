---
element: project.root/domain.cli/cap.cli.project-setup
---

## REMOVED Requirements

### Requirement: Progress Indicators
**Reason**: 旧 init contract 被新的 setup contract 取代。
**Migration**: 使用 setup output contract。

### Requirement: Directory Creation
**Reason**: Public command name 与 target skeleton contract 已改变。
**Migration**: 运行 `opsx setup`。

### Requirement: AI Tool Configuration
**Reason**: Setup surface 与固定 `opsx-build` workflow 被统一重定义。
**Migration**: 运行 `opsx setup` 并选择工具。

### Requirement: Interactive Mode
**Reason**: 旧 init-specific interaction contract 被 setup interaction 取代。
**Migration**: 使用 `opsx setup`。

### Requirement: Safety Checks
**Reason**: Existing workspace 与 retired workspace handling 由 setup 重定义。
**Migration**: 使用 setup 的显式 setup/cleanup confirmation。

### Requirement: Success Output
**Reason**: Success guidance 必须使用 setup 与 Project Build 名称。
**Migration**: 使用新的 setup output。

### Requirement: Exit Codes
**Reason**: 旧 init command contract 被删除。
**Migration**: 使用 setup exit-code contract。

### Requirement: Additional AI Tool Initialization
**Reason**: Command 重命名为 setup。
**Migration**: 运行 `opsx setup`。

### Requirement: Documentation Language Capture
**Reason**: Setup command 负责 project configuration capture。
**Migration**: 通过 `opsx setup` 配置文档语言。

### Requirement: Success Output Enhancements
**Reason**: Output 属于重命名后的 setup surface。
**Migration**: 使用 setup summary output。

### Requirement: Exit Code Adjustments
**Reason**: 旧 init extend-mode contract 被 setup behavior 取代。
**Migration**: 使用 `opsx setup`。

### Requirement: Non-Interactive Mode
**Reason**: Non-interactive options 现在属于 setup。
**Migration**: 使用 `opsx setup --tools ...`。

### Requirement: Config File Generation
**Reason**: Config generation 由 setup command 负责。
**Migration**: 运行 `opsx setup`。

### Requirement: Experimental Command Alias
**Reason**: `experimental` 与 `init` aliases 被删除。
**Migration**: 直接使用 `opsx setup`。

### Requirement: Tool auto-detection
**Reason**: Tool detection 属于 setup，不再属于 init。
**Migration**: 运行 `opsx setup`。

### Requirement: Init tool confirmation UX
**Reason**: Command 重命名为 setup。
**Migration**: 使用 setup confirmation。

### Requirement: 固定工作流安装
**Reason**: 固定 workflow set 使用 `opsx-build` 取代 `opsx-bootstrap-arch`。
**Migration**: 运行 `opsx setup` 或 `opsx update`。

## ADDED Requirements

### Requirement: OPSX Setup SHALL 创建可用的 formal skeleton
`opsx setup` SHALL 创建或保留 `.opsx` durable core、project configuration、versioned formal LikeC4 skeleton 和 empty Specs directory，且不得声称 Project Build 已完成。

#### Scenario: 新项目 setup
- **WHEN** project 中不存在 `.opsx/` workspace
- **THEN** setup SHALL 创建 `.opsx/config.yaml`、`.opsx/architecture/`、`.opsx/specs/`、`.opsx/changes/` 和 `.opsx/references/`
- **AND** SHALL 创建 `specification.c4`、`model.c4`、`relations.c4` 和 `views.c4`
- **AND** SHALL NOT 从 project evidence 推断 Candidate semantics

#### Scenario: Existing project setup
- **WHEN** `.opsx/` 已存在
- **THEN** setup SHALL 保留 existing formal Architecture、Specs、configuration 和 user content
- **AND** 仅在用户明确选择工具后刷新 managed Agent surfaces

### Requirement: OPSX Setup SHALL 安装固定 Agent workflow 集合
`opsx setup` 与 `opsx update` SHALL 安装 fixed workflow set：`propose`、`explore`、`apply`、`archive`、`build` 和 `snack`。Build workflow SHALL 使用 skill name 与 directory `opsx-build`，并 SHALL NOT 生成 slash-command artifacts。

#### Scenario: 安装 Build workflow
- **WHEN** configured tool 支持 skills
- **THEN** setup SHALL 生成 `opsx-build`
- **AND** SHALL NOT 生成 `opsx-bootstrap-arch`

### Requirement: OPSX Setup SHALL 支持跨平台与 non-interactive 运行
Setup SHALL 对所有 workspace paths 使用 Node.js path APIs，并 SHALL 提供显式 non-interactive tool selection。

#### Scenario: Windows setup
- **WHEN** setup 在 Windows、macOS 或 Linux 上运行
- **THEN** generated workspace paths 与 formal source content SHALL 等价
- **AND** filesystem operations SHALL 使用 path-aware APIs

#### Scenario: Non-interactive setup
- **WHEN** setup 在无 prompts 环境中运行
- **THEN** SHALL 要求显式 supported `--tools` value
- **AND** invalid values SHALL 返回 actionable diagnostics

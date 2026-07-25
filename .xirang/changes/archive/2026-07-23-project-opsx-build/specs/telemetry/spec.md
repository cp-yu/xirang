---
element: project.root/domain.telemetry/cap.telemetry.anonymous-usage
---

## MODIFIED Requirements

### Requirement: Privacy-preserving event design
Telemetry events SHALL NOT 包含 command arguments、file paths、project names、Spec content、Candidate content、digest、error messages 或 IP addresses。

#### Scenario: Setup command 带参数
- **WHEN** 用户运行 `opsx setup my-project --tools all`
- **THEN** telemetry event SHALL 只包含 `command: "setup"` 与 `version`
- **AND** SHALL NOT 包含 project path 或 tool selection

#### Scenario: Candidate validation
- **WHEN** 用户运行 `opsx candidate validate --json`
- **THEN** telemetry event SHALL 只包含 `command: "candidate:validate"` 与 `version`
- **AND** SHALL NOT 包含 Candidate paths、diagnostics 或 `reviewDigest`

#### Scenario: IP address exclusion
- **WHEN** system 发送 telemetry event
- **THEN** SHALL 显式设置 `$ip: null`

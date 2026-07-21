## MODIFIED Requirements

### Requirement: 查询项目配置

系统 SHALL 提供 `openspec config project` CLI 命令，读取并返回归一化后的项目配置。输出 MUST NOT 包含已退役的 Propose routing 配置。

#### Scenario: [MODIFIED] JSON 输出包含完整配置

- **WHEN** 用户执行 `openspec config project --json`
- **THEN** 系统输出归一化后的 `NormalizedProjectConfig` JSON
- **AND** 输出包含适用的 `proseLanguage`、`context`、`optimization`、`apply`、`git` 和 `rules` 字段
- **AND** 输出 SHALL NOT 包含 `propose`
- **AND** 以 exit code 0 退出

#### Scenario: 缺少 config.yaml 时返回空配置

- **WHEN** 项目目录中不存在 `openspec/config.yaml`
- **THEN** 系统输出 `{ "rules": {} }` 作为最小有效配置
- **AND** 以 exit code 0 退出

#### Scenario: [MODIFIED] 人类可读文本输出

- **WHEN** 用户执行 `openspec config project`（不带 `--json`）
- **THEN** 系统以 YAML-like 格式打印各配置项
- **AND** 输出 SHALL NOT 包含 `propose`
- **AND** 以 exit code 0 退出

#### Scenario: [ADDED] 旧 Propose routing 配置不进入查询结果
- **WHEN** `openspec/config.yaml` 包含旧 `propose.smartRouting` 或 `propose.requireExplore`
- **THEN** JSON 与人类可读输出 SHALL NOT 包含 `propose`
- **AND** 其他有效配置字段 SHALL 正常输出

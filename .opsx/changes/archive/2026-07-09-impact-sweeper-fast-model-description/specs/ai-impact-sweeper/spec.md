## ADDED Requirements

### Requirement: Impact sweeper description 提示 fast model

`openspec-impact-sweeper` agent description SHALL 明确提示调用方优先使用 fast model 执行该轻量级 OPSX-grounded impact sweep。该提示 MUST 保持为描述性偏好，不得要求模板设置具体 `model` 字段。

#### Scenario: description 包含 fast model 偏好

- **WHEN** 系统读取 `openspec-impact-sweeper` subagent template
- **THEN** `description` SHALL 包含 `Prefer a fast model for this lightweight OPSX-grounded impact sweep.`
- **AND** 模板 SHALL NOT 因该提示设置具体 `model` 字段

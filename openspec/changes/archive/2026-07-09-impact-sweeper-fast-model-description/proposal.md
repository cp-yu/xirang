## Why

`openspec-impact-sweeper` 是轻量级只读影响面扫描 agent，但当前 description 只说明用途，没有提示调用方选择 fast model。调用方在选择 subagent 时缺少成本/速度导向，会把简单扫描错误地交给更重模型。

## What Changes

- 在 `openspec-impact-sweeper` 的模板 description 中追加 fast model 偏好提示。
- 保持 `template.model` 未设置，由调用方和工具运行时继续决定具体模型。
- 增加模板测试，固定 description 中的 fast model 提示文案。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `ai-impact-sweeper`: impact sweeper agent description 新增 fast model 偏好提示。

## Impact

- **模板源**：`src/core/templates/workflows/impact-sweeper.ts`
- **测试**：`test/core/templates/impact-sweeper-template.test.ts`
- **生成路径**：现有 subagent artifact renderer 会继续把 `description` 写入各工具原生 agent metadata；本变更不新增 renderer、不设置具体 `model` 字段。

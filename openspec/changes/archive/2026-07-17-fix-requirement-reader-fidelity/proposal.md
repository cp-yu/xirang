## Why

当前 `openspec validate` 在 change delta 与 formal spec 路径上读取 requirement 正文时只取首行有效文本，且不完全识别 fenced code 边界，导致跨行 `SHALL/MUST`、fence 内示例 scenario 等合法写法被误判或漏检。

## What Changes

统一 requirement 正文、scenario 计数与 `SHALL/MUST` 检测为单一 fence-aware 读取实现；delta 与 main validation 共用该实现。不改变 `sync`/`archive` 的 formal 写出路径，不改变 scenario operation label 语法，不引入 Store 或其它 CLI 表面。

## Source Impact

### Behavior Source

#### New Specs

- None

#### Modified Specs

- `cli-validate`: 定义 requirement 正文提取、fenced 边界、多行 `SHALL/MUST` 检测，以及 surviving scenario 计数在 fence 下的可观察校验行为

### Architecture Source

#### Added OPSX Nodes

- None

#### Modified OPSX Nodes

- None

#### Removed OPSX Nodes

- None

#### Architecture Relations

- None

## Impact

- `src/core/parsers/`：新增共享 requirement reader；`markdown-parser` 在需要时委托 shared fence/body 逻辑
- `src/core/validation/validator.ts`：delta/main keyword 与 scenario 计数改为共享 reader
- `test/core/validation.test.ts` 与 parser 相关单测：回归 multi-line、metadata、fence、whole-word `SHALL/MUST`、`[REMOVED]` surviving 语义
- 不修改 `specs-apply` formal write、`sync`/`archive` 语义、doctor/context、Store

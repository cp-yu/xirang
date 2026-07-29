## Why

当前实现已以 Semantic Model 中的 Element Contract 为规范来源，但 CLI、校验链与 Semantic Browser 仍保留 legacy Spec 命名、无生产调用的 main-spec 解析栈及重复的 noun-first Change 入口，导致同一语义对象存在冲突契约与无效兼容面。

## What Changes

- **BREAKING** 删除 deprecated `xirang change` command group，将全部有效能力收敛到顶层 verb-first `show`、`list` 与 `validate`。
- **BREAKING** 将公开 CLI 的 `--specs`、`--type spec` 与 JSON `type: "spec"` 迁移为对应 Contract forms，不保留 aliases。
- 删除 legacy main-spec parser、schema 与 validation stack，并将仍有效的内部发现、completion、task reference 和 diagnostic 命名迁移到 Element Contract 术语。
- **BREAKING** 将 Xirang-specific Semantic Browser loader API、tab、HTTP handler、endpoint 与 data attributes 迁移到 Contract 命名，同时保持 Contract 内容、variant、diff、取消与错误行为不变。
- 将当前用户文档与 package metadata 收敛到 Semantic Model 和 Element Contract 术语。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `deterministic-operations`: 规范 verb-first CLI 的唯一入口、Change list/show 编译结果以及公开 Element Contract 校验契约。
- `semantic-browser`: 规范通过 Xirang-specific Contract API 和 endpoint 加载并呈现 Element Contract。

### Architecture Source

#### Added Elements

None

#### Modified Elements

None

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- CLI 注册、Change 展示与列表、Element Contract discovery、completion、validation 和 task reference diagnostics。
- Legacy parser、schema、validator exports 及其专属测试。
- `@likec4/diagram` 的 Xirang public exports、LikeC4 SPA loader、Vite middleware handler、Browser UI 与 E2E selectors。
- 当前 CLI、Semantic Browser 与集成文档及 package metadata。
- 不修改 LikeC4 自身合法的 `Specification` 术语、`.xirang/specs/**/spec.md` 历史数据、archive artifacts、`spec-driven` schema identity 或 artifact schema keys。

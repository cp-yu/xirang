## Why

Semantic Browser 的 LikeC4 缓存未启用 Element-derived Views，导致用户只能看到项目根 Element；同时默认回环监听在 WSL 环境中无法从 Windows 稳定访问。当前生成结果还会把 LikeC4 不支持的祖先链关系写入缓存，使浏览器加载无效模型。

## What Changes

- 让 Semantic Browser 从 Element 层级生成可导航的下钻视图，并在存在 Authored scoped View 时优先使用用户声明的视图。
- 让 LikeC4 投影省略渲染器无法表达的 self 与 ancestor-chain relationships，同时保持正式 Semantic Model 不变。
- 为 `xirang view` 增加显式监听地址配置，使用户可按需开放 WSL 中的浏览服务。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `semantic-browser`: 增加 Authored scoped View 优先规则与 LikeC4 不可表示关系的投影边界。
- `cli`: 增加 `xirang view --listen <address>` 的显式监听地址行为。

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

- LikeC4 缓存生成：`src/core/likec4/generator.ts`
- Semantic Browser 启动链路：`src/core/view.ts`、`src/cli/index.ts`
- 生成器、LikeC4 校验、ViewCommand 与架构导出测试
- Windows/WSL 用户可通过显式监听地址访问浏览服务

## Why

`xirang view` 当前只能浏览 Semantic Model 与 active Changes，无法在 promotion 前可视化审查 active Candidate 的完整目标模型及其相对当前 Semantic Model 的差异。Candidate build 支持 rebuild，因此完整预览与差异审查需要成为两个边界明确的 Derived Views。

## What Changes

- 新增唯一的 Candidate View，完整呈现 active Candidate Semantic Model，不混入 diff 语义。
- 新增唯一的 Candidate Diff View，专门呈现当前 Semantic Model 到 active Candidate 的语义差异。
- Candidate 无效时仍保留两个只读 View source，并显示 diagnostics 与可解析的 architecture，不回退到 stale snapshot。
- **BREAKING** Semantic Browser runtime manifest 升级为 `version: 3`，新增明确的 `candidate` 与 `candidateDiff` source，并以通用 `sourceFingerprint` 替代 Change 专用 fingerprint 命名。
- **BREAKING** `/__xirang/contract` 与 Contract loader 改用统一 `source` reference，不再使用 Change 专用的 `change` 参数选择内容来源。

## Source Impact

### Behavior Source

#### New Specs

- `candidate-derived-view`: 规范 active Candidate 完整目标模型的唯一只读浏览 View。
- `candidate-diff-derived-view`: 规范 active Candidate 相对当前 Semantic Model 的唯一 diff-only 审查 View。

#### Modified Specs

- `derived-views`: 将 Candidate View 与 Candidate Diff View 纳入自动派生、非持久化的 Derived View 集合。
- `semantic-browser`: 增加 Candidate runtime sources、invalid diagnostics、统一 Contract source、固定 View 模式与刷新行为。

### Architecture Source

#### Added Elements

- `candidate-derived-view`: active Candidate Semantic Model 的完整运行时浏览视角。
- `candidate-diff-derived-view`: 当前 Semantic Model 与 active Candidate 的专用差异视角。

#### Modified Elements

- `derived-views`: 派生输入与 children 边界扩展到 active Candidate。
- `model-view`: 明确只浏览当前 Semantic Model，不承担 Candidate 或 Change 差异审查。
- `change-derived-views`: 明确排除 Candidate 完整预览与 Candidate diff。
- `semantic-browser`: 可视化范围扩展到 Candidate 与 Candidate diff，并排除 promotion 与 Closure 职责。

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- Core runtime：Candidate snapshot 解析、View runtime manifest、source refresh 与 fingerprint 协议。
- Embedded browser：source selector、Candidate architecture overlay、diff-only 模式、Element details 与 Contract loading。
- HTTP surface：`/__xirang/changes` manifest schema 与 `/__xirang/contract` source addressing。
- Tests：core runtime、Vite plugin、SPA loader、Diagram UI 及 desktop/mobile Playwright E2E。
- Dependencies：无新增依赖；继续使用现有 TypeScript、Node.js、LikeC4、React、Vitest 与 Playwright。

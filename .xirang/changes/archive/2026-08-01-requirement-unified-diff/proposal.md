# Change: requirement-unified-diff

## Why

Change-derived View 的 Element Details diff 中，一个 Requirement 的 diff 只呈现其正文，Scenario 内容要么完全不显示（整体新增的 Requirement 没有 Scenario 子条目），要么被拆成多个碎片化的独立 diff 块，难以连贯审查。

## What Changes

将 diff 呈现粒度收敛到 Requirement 级别：每个存在差异的 Requirement 呈现为单个 diff，其 before/after 内容合并该 Requirement 的正文与全部 Scenario 文本；不再单独为每个 Scenario 渲染独立 diff。

## Source Impact

### Behavior Source

#### New Specs

- `semantic-browser`: Element Details 中每个 Requirement 呈现为包含其全部 Scenario 的单个合并 diff

#### Modified Specs

- None

### Architecture Source

None

## Impact

- 修改 likec4 diagram 包 Element Details 的 diff 呈现（`DiffTab.tsx`、`ContractsTab.tsx`）及对应测试（`ContractsTab.spec.tsx`）
- 不涉及 API、依赖、配置或数据

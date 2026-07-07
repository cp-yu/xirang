## Context

当前 `openspec list --specs --json` 会扫描 specs 并返回 `requirementCount` 与 `capabilities`，但不会暴露 `### Requirement:` header 名称；作者在编写 delta spec 前仍需打开 formal spec。当前 `ValidateCommand` 已通过 `validateChangeDeltaSpecs()` 与 `validateOpsxDelta()` 组合完成 change validation，但 CLI 没有 artifact scope 参数。

本 change 横跨 CLI 输出、validate routing 与 propose workflow guidance。实现必须保持旧入口可用，并遵守生成 surface 的源头修改原则：更新 `src/core/templates/workflows/propose.ts`，而不是只改已生成的 skill 文件。

## Goals / Non-Goals

**Goals:**
- 让 `openspec list --specs --json` 默认包含 `requirements: string[]`。
- 让 `openspec validate --change <name>` 显式执行完整 change validation。
- 让 `openspec validate --change <name> --artifacts specs|opsx-delta` 分阶段验证对应 artifact。
- 让 propose workflow guidance 引导 agent 使用 staged validation 命令。

**Non-Goals:**
- 不新增 `check-delta` 命令。
- 不新增 `--requirements` flag。
- 不修改全局 Spec schema 来保存 requirement header 名。
- 不重写 validator 核心规则。

## Decisions

1. `requirements` header 抽取保持在 list specs JSON 路径内。
   - 选择：在 `src/core/list.ts` 增加局部 helper，从 formal spec markdown 中抽取 `### Requirement: <name>`。
   - 理由：`MarkdownParser.parseSpec()` 当前返回 requirement 正文 text；把 header name 塞入全局 schema 会扩大影响面。
   - 替代方案：扩展 Spec schema。拒绝，因为该 change 只需要 CLI JSON 输出。

2. `--change` 是 change-only 显式入口。
   - 选择：`openspec validate --change <name>` 直接解析 `openspec/changes/<name>`，跳过 change/spec 自动歧义检测。
   - 理由：`--artifacts` 只对 change artifacts 有意义，显式 change scope 更清楚。
   - 替代方案：复用 positional `<item-name>` 加 `--artifacts`。拒绝，因为 artifact scope 与 spec validation 组合语义不清。

3. `--artifacts` 使用白名单。
   - 选择：仅支持 `specs` 与 `opsx-delta`；未提供时运行完整 change validation。
   - 理由：底层已有两个稳定函数；不需要通用 artifact framework。
   - 替代方案：提前设计通用 artifact registry。拒绝，当前 scope 不需要。

4. propose guidance 从源模板更新。
   - 选择：更新 `src/core/templates/workflows/propose.ts` 及对应 template tests。
   - 理由：生成品会被 `openspec update` 覆盖，只有源模板能保持行为。

## Risks / Trade-offs

- JSON 增字段可能影响严格比较旧结构的消费者 → 仅新增字段，不移除旧字段；同步更新项目内测试。
- Header 抽取若误读 code fence 中的 markdown 片段会污染结果 → helper 应忽略 fenced code block，或复用 parser 已有 fence mask 思路。
- `--change` 与 `openspec validate <name> --type change` 存在功能重叠 → 保留旧入口，`--change` 作为 artifact scope 的明确入口。
- `--artifacts` 名称未来可能扩展 → 当前白名单失败信息列出支持值，后续按需扩展。
- propose workflow validation 仍是 warning-only → staged commands 只改善定位，不把 propose 变成阻塞 gate。

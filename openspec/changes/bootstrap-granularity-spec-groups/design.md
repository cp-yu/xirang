## Context

Bootstrap 是 skill workflow。agent 负责读取项目、询问用户并写 `evidence.yaml` / `domain-map/*.yaml`；CLI 负责 workspace 状态、gate validation、candidate 编译与 promote 落盘。当前代码中 `scope.yaml.granularity` 默认 `coarse`，但 `assembleCandidateSpecs()` 不读取它，实际始终按 capability 生成 spec。

## Goals / Non-Goals

**Goals:**
- 将 `granularity` 定义为 agent-facing execution constraint persisted by CLI。
- 让 agent 询问用户 `coarse` / `fine`，并通过 CLI 显式写入 `scope.yaml`。
- 用 `spec_groups` 表达 coarse 模式的 group-level spec source。
- 保持 CLI deterministic：校验和编译 source artifacts，不做语义聚类。
- promote/backfill 后由 skill agent 运行 `openspec validate --all`。

**Non-Goals:**
- 不让 CLI 询问用户选择 granularity。
- 不实现自动聚类或 evidence-driven semantic grouping。
- 不让 `coarse` 与 `fine` 互相 fallback。
- 不把 `spec_groups` 加入 OPSX graph 节点。
- 不引入新依赖。

## Decisions

### Decision 1: `granularity` 由 agent 接收，CLI 只持久化

`openspec-bootstrap-opsx` skill agent 在 init 前询问用户，并解释：`coarse` 生成更少、更宽的 grouped specs；`fine` 生成更细的 per-capability specs。agent 调用 `openspec bootstrap init --mode <mode> --granularity <choice>`。CLI 只验证参数并写 `scope.yaml`，缺失或非法值 fail fast。

替代方案是 CLI prompt 用户。该方案被拒绝，因为 bootstrap 实际执行者是 agent，语义选择必须在 agent 的对话上下文内完成。

### Decision 2: `spec_groups` 承载 coarse spec source

在 `domain-map/*.yaml` 增加 `spec_groups`：

```yaml
spec_groups:
  - folder: cli
    capabilities:
      - cap.cli.init
      - cap.cli.validate
    purpose: CLI commands expose OpenSpec workflows through deterministic behavior.
    requirements:
      - title: 初始化命令
        text: CLI SHALL ...
        scenarios:
          - title: 成功初始化
            steps:
              - keyword: WHEN
                text: ...
              - keyword: THEN
                text: ...
```

`capabilities[]` 继续表示 OPSX capability nodes；`spec_groups[]` 只影响 candidate/formal specs。这样避免用多个 capability 共享 `spec.folder` 来伪装分组语义。

### Decision 3: coarse/fine 不 fallback

`coarse` 必须提供 `spec_groups`；缺失时 `map_to_review` fail。`fine` 使用现有 `capabilities[].spec`；缺失 capability spec source 时 fail。这样保证用户选择和 review 输出一致。

### Decision 4: CLI 编译 source artifacts，不发明语义

`assembleCandidateSpecs()` 根据 `state.scope.granularity` 分支：`fine` 走现有 per-capability 路径；`coarse` 读取 `spec_groups`，生成 grouped candidate specs，并写 multi-capability frontmatter。`assembleBundle()` 仍只消费 `domain` / `capabilities` / `relations` / `code_refs`。

### Decision 5: generated surface 用显式列表维护

需要更新 `src/core/templates/workflows/bootstrap-opsx.ts` 与 `schemas/bootstrap/*`。生成后的 tool skill 文件通过既有 update/init 管线刷新，不通过目录级删除或模式匹配清理。

## Risks / Trade-offs

- `coarse` spec 过大 → review 显示 group → capabilities 覆盖关系，用户可拆多个 `spec_groups` 或选择 `fine`。
- `spec_groups` 增加 schema 复杂度 → 换取 capability 与 spec group 的语义分离。
- refresh 中 group 成员变化会扩大重生成范围 → 将 spec group 视为最小 spec 生成单位，成员变化使 candidate/review stale。
- 旧一对一文案和 PBT 会失效 → 用 grep 清理旧文案，并将 PBT invariant 改为 capability coverage。
- 跨平台路径风险 → 路径写入和测试继续使用 Node `path` API；artifact 中路径保持 POSIX project-relative 形式。

## Migration Plan

1. 添加 RED tests 覆盖 `--granularity`、no default、`spec_groups` validation、coarse/fine candidate generation。
2. 更新 schema、CLI option、bootstrap compiler、review rendering 和 templates。
3. 更新 docs/specs/tests 中的一对一 wording。
4. 运行 focused tests 与 `openspec validate --all`。

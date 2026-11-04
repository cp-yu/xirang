## Context

Quality 当前以 `.quality-state.json`、`.quality-log.jsonl`、`.quality-evidence/` 和 `.quality-lock` 分别保存状态、事件、执行输出及写入互斥信息。`engine.ts` 同时维护 Review、delegation、verification、checkpoint、manifest 与版本化快照；`completion.ts` 汇总这些记录供 `quality status`、Sync、Archive 和 `xirang list` 使用。CLI payload 定义集中在 `command-schema.ts`，公共 help 与 Apply/Archive references 从 `protocol.ts` 投影，workflow templates 再将这些 references 分发到托管工作面。

本 Change 按已确认的 breaking 目标重组这条路径：每个 Change 以单个 Git-tracked `.quality.json` 保存 Review/Opt 意见、Opt 处置和当前 Seal；Review 与 Opt opinions 绑定其 Git commit；Seal 由主 Agent 声明并只接受一个仍可解析的 Git commit。代码历史和恢复归 Git，CLI 不运行测试、不比较当前 HEAD/工作区，也不写 `tasks.md`。

实现仍须支持 Node.js 22 及 macOS、Linux、Windows。记录路径和临时文件路径使用 Node `path` API；不假设文件系统分隔符。

## Goals / Non-Goals

**Goals:**

- 用同一版本化 JSON 文档取代 Quality snapshot、event log、执行输出存储与 manifest freshness 协议。
- 保持 CLI 对 Review 结果、Opt 处置、Seal 字段、Git commit identity、流程门槛及 revision CAS 的确定性校验，并由只读 status 投影可执行的后续操作。
- 让 Sync 和 Archive 只依赖有效 Seal commit 的存在性，同时保留各自既有 Semantic Delta、validation、task 和显式绕过门禁。
- 从共享的协议定义生成 CLI help、Apply/Archive references 与托管 Reviewer/Optimizer 工作面，避免新旧 schema 并存。
- 移除 Quality checkpoint 与 freshness 语义和旧 CLI 执行状态机。

**Non-Goals:**

- 运行测试、保存测试输出或由 CLI 判断测试是否客观成功。
- 把 Seal 解释为当前 HEAD/工作区的镜像，或要求 Seal/Archive 时工作区 clean。
- 自动恢复代码、创建 Git commit、推断是否应运行 Opt 或 Opt 后 Review，或自动改写 `tasks.md`。
- 读取、迁移、改写、清理旧 Quality 文件，或改变现存 `.gitignore` 规则。

## Decisions

1. **以一个文档作为唯一持久来源。** 在现有 Change 目录下使用 `.quality.json`，结构包含 `schemaVersion: 3`、Change identity、单调递增 `revision`、Review opinion 历史、Opt disposition/opinions 和当前 Seal。Review 与 Opt opinions 追加保存；Seal 是单一当前声明。代码 manifest、测试输出、执行进度、恢复位置及重复 snapshot/event log 不进入文档。选择单一 JSON 而非 snapshot 加 log，是因为用户确认的持久化边界仅包含可供判断和收口使用的意见与声明。

2. **把原子更新与 CAS 集中在存储边界。** 所有写入先解析当前文档并校验 payload、关联与预期 revision，再构造 revision 加一的完整下一状态，写入同目录临时文件并原子替换目标。并发写入在每个 Change 的短事务互斥范围内串行化；锁只用于写入期间的互斥，不承载 Quality 语义，也不复用旧 `.quality-lock`。旧路径及内容一律不探测。写入冲突返回稳定诊断且不覆盖原文档。路径解析统一使用 Node `path` API，以适配 Windows。

3. **分离执行者的意见与 CLI 的机械职责。** Review opinion 记录 `reviewId`、scope、commit、result、summary 与 findings。Opt 处置只记录 delivered opinions（含 `baseCommit`/`resultCommit`）或明确的 `not_performed` reason。Seal 记录 commit、`canRun`、`testsExpectedToPass`、test scope 与 assessment。CLI 验证结构、唯一 identity、commit 对象与流程关联；它不判断 opinion 文本充分性，不执行测试。主 Agent 负责处理 Review findings、必要的 `tasks.md` 状态以及修正提交。

4. **以基线 Review、可选 Opt 处置和 Seal 构成门禁。** 每个 Change 先有绑定已提交 commit 的通过基线 Review；失败修正以新 commit 再 Review。基线通过后，主 Agent 决定是否做 Opt 和是否在 Opt 后追加 Review；Seal 前必须记录 Opt opinion 或不做 Opt 的理由。CLI 不从配置或自然语言推断这两项选择。`status` 从记录推导 `needs_review`、`needs_optimize` 或 `all_done`；`qualityStatus` 仅表示新记录/Seal commit 的结构和可解析性，不表示工作区 freshness。

5. **让下游只消费 Seal commit。** Sync 与 Archive 通过共享 Quality gate 读取新记录并确认 Seal commit object 可解析，不将该 commit 与 HEAD 或工作区比较。Seal 或 Archive 前不要求单独提交 Quality JSON；Archive 完成后，Agent 按既有 Git handoff 提交 Change 与质量记录。Sync 不修改 Quality JSON；Archive 不重评 Review/Opt 文本。Archive 与 Sync 的 Semantic Delta、validation 和 task 检查继续独立执行，`--no-verify` 的既有用户授权绕过不生成质量证据。

6. **拒绝旧格式，不迁移旧状态。** 新实现只读取 `.quality.json`。旧 snapshot/log/evidence/lock 路径不作为 fallback、输入或证据，也不修改旧文件和 `.gitignore`。既有活动 Change 必须按新协议重新提交所需意见与 Seal；不自动继承旧 Review、Opt、测试或 checkpoint。

7. **从协议定义维护生成面。** `command-schema.ts` 保持 CLI 输入结构的单一来源，`protocol.ts` 负责 help/reference 投影；Apply、Archive、Reviewer、Optimizer templates 引用同一协议并由既有生成器投影。删除旧 checkpoint/freshness 文案、命令和生成 reference，保留与 Quality 无关的 Apply isolation 或其他领域 checkpoint 语义。

8. **提供与新流程一致的窄命令面。** 保留 `xirang quality review`、`xirang quality seal` 与 `xirang quality status`，新增 `xirang quality opt` 直接记录 Opt opinion 或 `not_performed` 处置。旧 delegation 进度、CLI verification、completion conclusion 和 checkpoint 操作不再作为新协议入口；不提供旧 payload 别名。该命令面只映射用户确认的 Review/可选 Opt/Seal 流程，不增加执行进度或测试采集状态。

## Risks / Trade-offs

- [Breaking change makes legacy in-progress evidence unusable] → Fail closed with an explicit unsupported-format diagnostic; preserve legacy files and Git history so the main Agent/user can form the new Review, Opt disposition, and Seal without automatic reinterpretation.
- [A valid Seal commit may differ from HEAD or the worktree] → Treat this as intentional: CLI and Archive establish only that the declared commit object exists; the main Agent owns the accuracy of the runnable/test-expectation declaration.
- [CAS and atomic replacement differ across filesystems and operating systems] → Keep replacement in one storage module, serialize writers before comparing revision, use same-directory temporary paths, and cover stale revisions, competing writes, interrupted writes, and Windows path handling in tests.
- [Structured records cannot prove natural-language opinion quality or test execution] → Keep Reviewer independence and main-Agent Seal responsibility explicit in generated guidance; do not imply that CLI validation establishes either judgment.
- [Shared generated guidance can drift from runtime command schemas] → Derive reference payload shapes from the runtime schemas and assert template/reference projections against those renderers.

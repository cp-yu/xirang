## Context

本 Change 承接已确认设计记录与 Explore Summary。目标语义由 `elements/` 中的 Section Entries 定义；此处记录既有格式下的恢复步骤、状态取值策略、验证安排与实现边界。

现有 `checkQualityState` 为支持失败回滚，会从活动日志匹配历史 PASS，但返回整条旧记录，连带取回旧优化台账。`quality review` 在 `clean` 时拒绝重复记录，在 `dirty` 时又延续已有台账；因此仅写“修正后重新 Review”不能正式解除旧终态。另一方面，现有 CLI 在根目录没有质量快照时自然报告 `dirty`，新 Review 不携带旧台账，可以利用该行为完成重启，无须新子命令。

## Goals / Non-Goals

**Goals:**

- 用一个共享恢复 reference 串行编排授权、保存校验、记录轮换和完整重验，保持当前 CLI 输入与记录格式。
- 保留原 Change 的实现、隔离环境、checkpoints、失败证据及历史；新优化额度从零开始。
- 修正普通回滚的台账取值，统一状态查询、后续写入与 Closure 门禁所见的当前进度。
- 以既有测试的真实状态/CLI 回归和一次性恢复实验形成可复现证据。

**Non-Goals:**

- 不增加 `quality reset` 命令、持久运行任务注册、并行旧任务结果路由或任务取消系统。
- 不重建隔离环境、不自动回退实现、不删除 checkpoints、不创建接续 Change。
- 不将轮换历史作为 CLI 的额外 runtime store，不改变既有优化阈值、额度配置或显式归档绕过授权规则。
- 不重组 Element hierarchy、Declarations、Relationships、Metamodel 或 Views。

## Decisions

### 1. Review 证据与最新台账分别取值

保留 `checkQualityState` 当前的指纹匹配、快照/日志配套检查和历史 PASS 复用。返回匹配 Review 的证据与结论时，显式以最新活动快照的 `optimization` 为当前台账；最新快照没有该字段时，不能因匹配旧 Review 而恢复旧台账。可以沿用当前 `QualityState.record` 对调用方提供有效 Review 与最新台账的组合，不需要公共命令字段扩张；具体内部表示应让数据来源清楚。

只读查询不得把组合结果写回旧日志。下一次 `review` 或 `optimize` 正常追加记录时，继续使用最新台账。status、Optimize、seal、Sync、Archive 及 Apply instructions 都要核对同一当前台账，尤其不能因回滚匹配旧 PASS 而绕开 `ABORTED_UNSAFE`。seal 当前直接读快照，需验证它与有效状态组合的门禁仍一致；不为了重启改变 seal 的哈希定义。

选择依据是“恢复代码状态”与“保留当前流程进度”同时成立。只取最新 Review 会破坏失败回滚；继续返回整条旧记录则会丢失最新方向及失败预算。

### 2. 恢复 reference 使用既有记录轮换

在 Apply 模板的显式 `referenceFiles` 清单中注册 `references/quality-recovery.md`，投影到 `.xirang/references/xirang-quality-recovery.md`。Archive 通过现有共享 Apply references 的生成路径复用同一内容；保留 archive-only 工具配置时也能安装依赖 reference 的现有机制。路径以显式清单定位，不用正则推断或扫描模板名称。

将每次旧记录保存于 `changeDir/.quality-history/<timestamp>-<unique-suffix>/`，内部保留原文件名 `.quality-state.json`、`.quality-log.jsonl`，另用 `recovery.json` 记录原因、时间、原记录关联、两份文件的 SHA-256 与轮换完成情况。这是只供恢复编排和人工阅读的历史说明，不由 quality 状态引擎解析，不是并行任务的轮次协议。采用 Node.js `path`、`fs`、`crypto`，跨平台地生成路径与校验字节，不增加依赖或生产执行脚本。

reference 的串行步骤：

1. 识别明确的重启授权，确认 Reviewer、Optimizer、实现任务及结果处理/回写/回滚均已停止；核对原 `.apply-isolation.json` 与当前工作区。普通续跑不进入轮换。
2. 查看历史保存中有无未完成的轮换；有则先按原始字节与元数据复核，不能将中断后的根目录缺失状态直接当作新 Review 入口。
3. 独立创建历史位置，以不覆盖方式保存两份原始文件，记录原因及来源；保存完成后分别校验 SHA-256。未完整保存时不移走任何活动原件。
4. 保存清单与原件一致后，串行移走活动快照、日志。两份均离开根目录并核对历史后，才标记轮换完成。保留原代码、commits、checkpoints、隔离身份和不可变证据基线。
5. 用既有 `quality status` 确认 `dirty`，委派 fresh Reviewer，按原顺序校验 payload、处理 CRITICAL writeback、调用 `quality review`。
6. Review 失败回到正常修正与复审；通过后建立或验证本轮 successful checkpoint，再运行既有 Optimization、seal 与 Closure。新台账为空，不复制任何旧额度、方向状态或终态。

中断重入按以下证据处理，不要求两个文件的文件系统操作具备不存在的跨文件原子性：

| 已保存历史 | 活动原件 | 行动 |
|---|---|---|
| 不完整，原件齐全 | 与来源一致 | 保留原件，补齐同次保存并重新校验，完成前不 Review |
| 完整且哈希正确 | 两份原件仍在，均与保存一致 | 继续该次轮换，不覆盖历史 |
| 完整且哈希正确 | 只剩一份与保存一致的原件 | 完成剩余轮换，再验证根目录无旧活动记录 |
| 完整且轮换完成 | 已建立新活动记录 | 按当前轮次继续，不能再次把新记录轮换为同一旧轮次 |
| 内容冲突或来源不明 | 任意 | 保留所有文件并停止，报告缺口，不猜测删除或覆盖 |

该流程具体化“先完整保存、校验后轮换”和“重入不覆盖历史”。不要求用户手工执行，也不在已有明确授权后再次询问同一重启意图。

### 3. 调用入口与角色历史读取

Apply Preparation、Optimization 的 unsafe 分支及 Archive 入口在自动推进前引用同一恢复 reference。检测到 `ABORTED_UNSAFE` 仍停止自动执行，但向用户说明当前冲突和授权恢复路径；不能把 `allowedNextOperations: []` 解释为必须创建新 Change。其他已终止轮次在正常 seal/archive 之外，也支持用户明确发起的同一重验流程。

共享 `protocol.ts` 生成 CLI help 与错误恢复片段，调整“永远不得处理记录”为“禁止任意改写，允许授权的 reference 轮换”。状态/错误诊断和 Apply instructions 使用同一恢复路径；不伪造新的可调用 CLI 操作。

Reviewer 和 Optimizer 的 self-read 协议增加明确的质量历史路径。Reviewer 保持 fresh context、当前实现证据与原始 `baseCommit` 导航，根目录无活动记录时 `priorQualityRecord` 为 null；历史只作为问题和文件导航参考。Optimizer 必须先读取新活动 PASS，并读取旧失败证据；旧方向 ID、状态和预算不能导入新台账，当前轮次的失败避重规则继续生效。

### 4. 普通失败回滚保护历史

沿用现有 repository-external 保存 → `git reset --hard HEAD` / `git clean -fd` → 恢复校验 → `quality status clean` → 报告失败 attempt 的顺序。保护集合从三份当前状态文件扩展到完整 `.quality-history/`；不存在历史时记录不存在，不能从旧 checkpoint 误恢复已不适用的历史或记录。

保存目录必须在当前 Git repository/worktree 外，包含显式路径清单与内容哈希。恢复时保护已跟踪与未跟踪历史，逐项校验缺失、额外文件和内容差异；失败时停止。该保护不借重启轮换来实现，不清空当前失败计数。普通失败 attempt 仍在恢复为 `clean` 后提交。

### 5. 验证与旧测试维护

以 `test/core/quality/state.test.ts` 和 `test/commands/quality.test.ts` 为状态行为的主套件。扩展既有失败回滚场景，构造历史 PASS 台账较旧、最新台账含失败/rejected/unsafe 的输入，验证回滚后证据可复用但最新台账和后续写入不退回。CLI 检查 status、optimize、seal 和相关门禁，保持旧日志前缀不变；不以私有函数 mock 或原文锁词替代结果断言。

| 类别 | 处理 |
|---|---|
| 状态引擎与 CLI 回滚测试 | modify：覆盖台账独立取值与 unsafe 不因回滚消失，复用已有 fixture |
| 既有 Review、Optimize、seal、Sync、Archive 测试 | reuse：维持命令协议与门禁回归；只有新行为要求时修改所属既有场景 |
| Apply/Archive 模板 reference 清单与可达性检查 | modify：维护新 reference 的唯一注册和依赖可达性，不新增解释性段落断言 |
| 固定“unsafe 没有恢复路径”的旧断言 | modify/delete obsolete assertions：改为未授权仍停止、授权后走共享 reference 的协议检查，移除已不成立的人工恢复措辞锁定；保留禁止自动推进、禁止随意删改记录等真实约束 |
| Reviewer/Optimizer 与共享协议既有测试 | reuse 或按受影响的协议门禁 modify；不为历史说明文字新增快照或原文匹配 |

**One-time Verification**：

- 在 repository 外临时 Git 项目使用构建后的真实 CLI，分别创建 unsafe 与正常已收口状态，按新 reference 完成保存、轮换，验证代码未变时状态仍为 `dirty`，新 Review 前 optimize/seal 不通过，新 PASS 后台账从零建立。使用 fixture Review payload 只证明 CLI 数据流，不替代实际 Reviewer 的独立判断。
- 在保存第二个文件前、首个原件移走后、轮换完成后分别中断，按 reference 重入；比较原件/历史哈希、不覆盖已建立的新活动记录。构造目标历史冲突，确认协议停止且现场保留。
- 建立新轮次后让一个优化方向失败，按更新的回滚步骤执行真实 Git reset/clean，比较三份当前文件、未跟踪与已跟踪历史的清单和字节，验证新轮次失败计数仍连续。
- `pnpm build` 后，在临时项目 `setup --tools pi --project-definition <完整定义>` 和 `update --force`，检查 Apply/Archive 对共享 reference 的引用可达，以及 Reviewer/Optimizer 的历史读取入口；检查 archive-only 模板选择时依赖仍安装。随后对当前项目执行既有 `update --force` 投影，提交所选工具生成面，不人工维护平行文本。
- 使用 `pnpm exec tsc --noEmit`、相关现有模板/命令套件和 Windows CI。将既有 `.github/workflows/windows.yml` 的 root 测试步骤补入 quality 状态及命令套件；保留 `core.autocrlf=false` fixture，覆盖 Windows 反斜杠/带空格路径。实际 Windows 结果须注明证据来源，不以 Linux 运行代替。

实现按两个可独立 GREEN 的闭环推进：先修正状态与台账回归；再将恢复 reference、所有消费入口、历史读取、回滚保护、生成面及一次性证据作为一个端到端闭环交付，不把 prompt 来源与其消费者拆到后续任务。

## Risks / Trade-offs

- [reference 的前置条件依赖 Agent 执行] → 明确只支持串行恢复；未结束的任务不重启，不增加任务注册服务来模拟 CLI 不拥有的进程信息。
- [轮换中断导致根目录只缺一份记录] → 先完整保存校验、记录完成情况；入口先检查未完成恢复，复核后继续同次轮换，冲突时停止并保留现场。
- [Git clean 删除未跟踪历史，或 reset 恢复过期文件] → repository-external 清单与哈希覆盖全部质量历史，恢复后比较完整文件集合，不能只保三份根目录文件。
- [旧失败计数通过历史读取进入新台账] → CLI 只读活动文件，Reviewer/Optimizer 区分历史参考与本轮依据；新 Review 与新计数在临时项目验证。
- [组合 Review 与当前台账时丢失字段或修改原日志] → 既有类型与归一化规则保持，测试原日志前缀、方向状态、计数和终态及后续追加结果。
- [平台换行或路径导致假性指纹变化] → 文件按原始字节保存，使用 Node path API，沿用 fixture 的换行配置，并在 Windows CI 运行现有行为套件。

## Migration Plan

更新模板、共享协议与状态引擎后，通过既有 setup/update 生成入口安装恢复 reference 与各消费方。旧活动快照和日志格式不迁移、不提前轮换；只有用户明确请求重验时才按 reference 保存并轮换。历史目录随 Change 的正常 Archive 原样移动。

实现回退时保留已产生的质量历史与当前记录，不把旧历史覆盖回活动根目录来伪造当前结果；若旧版本不理解恢复指引，停止并保留现场等待处理。

## Open Questions

无阻塞设计决策。具体临时目录、历史后缀与一次性验证脚本由 Apply 使用标准库生成；它们不改变授权、串行、保存校验和新 Review 的已确认行为。

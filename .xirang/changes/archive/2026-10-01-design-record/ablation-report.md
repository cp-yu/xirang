# Propose 覆盖检查消融实验报告

## 设置

- 起点：goFate 提交 `0bb32c5`（`jev-situation-recall` 刚完成 Propose 的制品）。复制为 3 份不含 `.git` 的工作目录，删除 Delta 与 `framing-source.md`，用本 Change 构建的 CLI 重刷生成面。
- 记录：由原 25 条 normative 条目生成 v3 活动记录 `20260930T025828Z-c39e5151`，`conjunctive-label-coverage` 按新写入标准补入用户原话例子（A、C → ABC、ACD 可，AB 不可）。
- 模型：两臂均为 `bigmodel/glm-5.3-flash`，同一份检查说明与 D5 输出格式。
- 当前 Agent 臂：新会话按 `xirang-propose` 写完 Delta 并通过 `xirang validate` 后停下；植入缺陷后在同一会话续接执行覆盖检查。
- 子代理臂：全新会话，只给活动记录、Change 名与项目根，检查同一份植入后的 Delta。
- 方法修正：首轮 3 次中有 2 次 Propose 用 `git show/checkout` 从提交恢复原 Delta 而非自行编写，已作废；改用不含 `.git` 的副本重跑。

## 标准答案（经用户确认）

| 缺陷 | 来源 | 记录条目 |
|---|---|---|
| ABC 例子缺失 | 已知丢失；植入时删除 Delta 中该例子（run1 本就未写） | `conjunctive-label-coverage` |
| K 默认 32 改为 16 | 植入 | `configurable-recall-limit` |
| 删除 `no_event` 合法结果 | 植入 | `autonomous-no-event-option` |
| 首轮画像改为读取完整世界文本 | 植入（替换原“世界切换本轮生效”，后者在记录中无依据） | `world-summary-context` |

## 结果

检出指该缺陷对应细节被报为 uncovered；误判通过指被报为已覆盖。

| run | 臂 | ABC | K | no_event | 首轮摘要 | 检出 | 细节数 | uncovered | 检查耗时 | tokens |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 当前 Agent | ✗ | ✓ | ✓ | ✓ | 3/4 | 220 | 14 | 742s | 1.68M |
| 1 | 子代理 | ✗ | ✓ | ✓ | ✓ | 3/4 | 147 | 16 | 991s | 1.48M |
| 2 | 当前 Agent | ✗ | ✗ | ✗ | ✗ | 0/4 | 132 | 7 | 396s | 0.58M |
| 2 | 子代理 | ✗ | ✓ | ✓ | ✓ | 3/4 | 131 | 14 | 909s | 1.50M |
| 3 | 当前 Agent | ✓ | ✓ | ✓ | ✓ | 4/4 | 128 | 10 | 741s | 1.95M |
| 3 | 子代理 | ✗ | ✓ | ✓ | ✓ | 3/4 | 124 | 9 | 977s | 1.35M |

- 仅检查者判断：当前 Agent 7/12，子代理 9/12。
- run2 当前 Agent 的 `no_event` 与首轮摘要两项引用了植入后已删除或改名的 Acceptance Case，`xirang record coverage` 以 `COVERAGE_LOCATION_UNRESOLVED` 拒绝；计入 CLI 位置门禁后当前 Agent 9/12。ABC 与 K 两项误判指向真实存在的位置，位置门禁拦不住。
- 每份结果都含其他 uncovered 细节，CLI 都会拒绝记录，6 次均不会进入 `consume`。
- 两臂反复报出的非植入缺口：六轴维度名称、LLM 与 Jev 的离线分工、“可使用指定子代理”许可。未逐项回到 Delta 核实；“指定子代理”更像记录把实现许可标成了 normative。
- Propose 写作规则：3 次中 2 次自行把 ABC 例子写进 Delta。

## 结论与决定

- 按 D7 预设判定（子代理稳定检出当前 Agent 漏掉的缺陷则建议引入），结果指向引入子代理：子代理 3 次稳定 3/4，当前 Agent 波动 0–4/4，K 一项仅当前 Agent 漏检。
- 两臂共同漏洞是 ABC：5/6 次把泛化 Acceptance Case 当作例子的落位，CLI 只核对位置存在因而放行。
- 用户决定：保持当前 Agent 自查，不引入子代理；覆盖结果对 Element 位置增加 `quote`（位置原文摘录），CLI 校验摘录确实出现在该位置。理由：`quote` 迫使检查者从当前文件摘录，凭记忆的落位（run2 当前 Agent 的失败方式）无法通过；泛化落位的摘录不含例子的具体输入与结果，使漏检显性化。
- 已做的有限回放：把 run2 当前 Agent 的结果以其 `detail` 文本充当 `quote` 重提，K 默认 32 一项被 `COVERAGE_QUOTE_NOT_FOUND` 拒绝。这只是代理验证；真实检查者会摘录真实文本，`quote` 能否让其改判 ABC 未经实验验证。

## 局限

- 每臂 3 次、单一模型、单一 Change；结论不外推。
- 缺陷由人工植入，当前 Agent 对植入前内容的记忆模拟了“作者自信”，与自然写错不完全相同。
- 子代理臂以全新 `pi -p` 会话实现，未经宿主 subagent 机制。

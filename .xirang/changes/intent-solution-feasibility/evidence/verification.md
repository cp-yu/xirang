# Apply 验证证据

## 实现与生成

以设计基线提交 `89fe0d4e6` 为输入，将 design.md 的 E1–E5、P1–P2 七个 before/after 替换逐一应用，所得两份源码与最终源码完全相同。首次辅助检查误把 E3 保留的原句当作旧内容残留；改为重建完整期望源码后通过。随后修正冻结源码文件名检查脚本，最终确认两份候选源码与对话实验冻结源码逐字相同。这些是验证脚本错误，不是产品失败。

通过现有 `ArtifactSyncEngine.syncOne`、`ALL_WORKFLOWS` 和 pi adapter 重新生成工作面。受管内容仅 Explore reference 与 Propose skill 发生预期变化；Explore 主入口、Summary gate、其他 references、Agent 工具权限及 Experimenter 未变。未直接编辑生成正文。

两个既有测试依赖旧句子的大小写或完整措辞，曾分别失败；分别改为忽略大小写及保留关键语义的子串断言。没有新增逐句字符串测试。

## 自动检查

- `pnpm exec vitest run test/core/templates test/core/workflow-installation.test.ts`：19 个文件、246 项测试全部通过，覆盖模板注册、转换、同步、工作面一致性及安装。最终修正后的套件结果为准。
- `pnpm exec tsc`：通过。
- `pnpm exec eslint src/core/templates/workflows/explore.ts src/core/templates/workflows/propose.ts`：通过。
- 两份源码及两个修改的测试文件：LSP 无 diagnostics。
- `node bin/xirang.js validate --change intent-solution-feasibility --json`：通过，14 个 Section entries（1 ADDED、13 MODIFIED），无 issues。

## 对话对照

`experiment-manifest.json` 保存模型、提示词哈希及调度器成本；`prompts/` 是完整冻结输入；`dialogue-workflow.js` 保留实际执行脚本；`dialogues.json` 保存全部原始用户轮次和模型输出，去除了宿主机 artifact 路由信息。脚本的 root 为原实验临时目录；重放时须将 prompts 放到该目录，或将 root 指向保存的 prompts 目录，并使用支持 `runs.all` 的 subagent workflow 执行。

使用同一模型 `llmgw/gpt-6.1-sol`，每个场景的 baseline/candidate 使用相同完整工作流提示词、固定初始输入和后续用户脚本。只有七处已确认提示词不同；understanding 场景独立重复一次。共 8 段对话、26 个轮次调用。调度器统计输入 126951 tokens、输出 20244 tokens、总计 147195 tokens，估算费用 USD 1.378203，经过约 226 秒；包括完整上下文、推理和工具开销，不能据此归因新版更省成本。

| 场景 | 基线和候选版的实际观察 | 覆盖目标 |
|---|---|---|
| understanding，第 1 轮及重复 | 都先询问具体情境，没有直接猜成日志或缓存方案 | G1 |
| understanding，第 2–3 轮及重复 | 都基于已有错误对象提出直接显示错误位置和操作建议；上下文充分后给出设计与验证，没有重新要求完整问卷或新可行性实验 | G1、G2 |
| evidence，第 1 轮 | 都依据查询限流否定每秒轮询，保留 2 秒目标，提出推送，并询问目标适用边界 | G1、G2 |
| evidence，第 2 轮 | 都修正 Agent 已采纳方案中的内存假设，提出持久化及恢复，不要求重新确认目标 | G2 |
| evidence，第 3 轮 | 都保留单用户 300ms 的局部价值，明确不证明端到端时效、并发和故障恢复；继续指出待验证环节 | G2 |
| evidence，第 4 轮 | 都以信息通路推理指出持续离线与远端新事件通知冲突，提出调整选项并等待用户裁决，没有用性能实验回避逻辑矛盾 | G2 |
| propose，第 1–2 轮 | 都不把“加缓存”作为充分需求；得到问题、目标、范围和项目事实后继续设计，不强制退回 Explore；发现读取失败策略这一实质未决边界 | G3 |
| propose，第 3 轮 | 都因数组被修改的新证据修正方案，包括首次返回也需复制，并保留失败策略未决状态；未重开已确认意图 | G3 |

G4 由完整提示词核对、冻结输入哈希与生成/安装测试支撑。新文本集中在原有位置；复用既有 Summary、记录、权限与交接规则。

## 结论与证据限制

候选版在这些样例中表现符合目标；基线也能处理这些情况，没有得到可信的相对质量提升证据，没有观察到需要改变七处已确认原文的行为失败。没有人为制造行为 RED，也不把字符串测试失败当作模型行为失败。

这是对话行为验证，用户提供的项目事实作为有效投影。共同实验约束要求简洁中文、每轮至多一个关键问题、禁止正式写入和其他工具执行，因此这些约束下的表现不能独立证明新版具有更好的简洁性、问询纪律、权限遵循或实际项目调查能力。未执行真实 CLI 调查、Experimenter 委托或完整 Explore/Propose 生命周期；未新增真实外部服务实验。既有有效 Summary 复用、记录和交接边界主要由未变提示词及集成套件提供证据。两版后续模型上下文会随各自回复分化，不是严格独立逐轮样本。

部分基线输出附带宿主 delegate 的 acceptance-report，完整保留，但其自报通过不作为验收证据，也不将长度差异归因为产品提示词效果。模型推理和随机性仍影响结果；一次重复不足以推断普遍稳定性。后续不同模型或真实项目若暴露偏差，应保存实际证据再决定调整。

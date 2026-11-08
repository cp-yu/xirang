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

这是对话行为验证，用户提供的项目事实作为有效投影。共同实验约束要求简洁中文、每轮至多一个关键问题、禁止正式写入和其他工具执行，因此这些约束下的表现不能独立证明新版具有更好的简洁性、问询纪律、权限遵循或实际项目调查能力。上述对照未执行真实 CLI 调查、Experimenter 委托或完整 Explore/Propose 生命周期；后续工具补证见下节。未新增真实外部服务实验。既有有效 Summary 复用、记录和交接边界主要由未变提示词及集成套件提供证据。两版后续模型上下文会随各自回复分化，不是严格独立逐轮样本。

部分基线输出附带宿主 delegate 的 acceptance-report，完整保留，但其自报通过不作为验收证据，也不将长度差异归因为产品提示词效果。模型推理和随机性仍影响结果；一次重复不足以推断普遍稳定性。后续不同模型或真实项目若暴露偏差，应保存实际证据再决定调整。

## Review 后的工具补证

首次独立 full-change Review 对提交 `edbe65b33` 给出 FAIL（原始意见见 `review-initial.json`）：要求 G1 实际调查可查事实、G2 实际交接 Experimenter 并消费受阻或不明确结果。它确认七处实现与生成一致、246 项测试通过；失败发生在证据覆盖，未观察到提示词行为缺陷。未改动七处已确认原文。

`tool-fixtures.json` 保存隔离工作区文件和实验产物；`tool-workflow.js` 与 `tool-workflow-retry.js` 保存实际编排；`tool-results.json` 保存三次 Explore 输出及运行信息；`tool-transcripts.json` 保存三个 Explore 会话和嵌套 Experimenter 会话的用户输入、可见回答、工具参数与结果，并附原会话路径和 SHA-256。省略内部推理与不影响行为的宿主元数据，不省略工具调用。提示词沿用 `prompts/explore-candidate.md`。重放时依 tool-verification-manifest.json 的 root 恢复夹具文件及提示词，再执行脚本；显式嵌套工具 profile 仅存在于临时夹具，不改变项目 Agent 配置。

### RC1：可查事实调查

工作流 `47f3475c-470a-427f-aa10-c708f0c994fa` 的 investigation 会话只给用户困难、30 秒目标、离线约束和“详细日志搜索”建议，没有提供错误字段或建议表。Agent 自行枚举文件、读取 `src/diagnostics.mjs` 并用 Node 调用现有函数，实际看到 `ENTRY_REQUIRED`、sourcePath、固定 line:3、message 和 advice，以及当前只输出 `Validation failed (1)`。它指出固定行号不等于真实解析位置，没有把未提供的 CLI 调用链当作事实；据此推荐直接展示已有诊断，而不是先让用户回答源码可查事实或默认新增日志系统。调用和观察可从 investigation transcript 逐项核对。该次源码未修改。

### RC2：实际交接与受阻结果消费

首次 feasibility 会话如实报告默认 delegate 未暴露 `subagent`，因此该次虽实际运行本地入口并正确处理 BLOCKED，仍不能证明委托行为。保留这次工具配置缺口，未冒充成功交接。

依据 Pi frontmatter 文档，将临时夹具 profile 显式配置为 `tools: read, grep, find, bash, subagent`、`allowNestedSubagents: true`、`allowedAgents: xirang-experimenter`；同一输入、同一模型、同一冻结产品提示词重跑，工作流 `a8a20ce2-884a-4421-8947-a3ee677e7bfc`。包装说明仅授予按需委托能力，没有要求必须调用 Experimenter 或规定实验步骤。

Explore 读取未定义 ack 持久化先后的契约后，实际调用一位 `xirang-experimenter`，提供问题、目标、约束和可选实验位置。Experimenter 自主选择最小入口检查，实际执行 `node tools/vendor-sandbox.mjs`，保留 stdout、空 stderr、退出码 3 及实验说明。输出为 `BLOCKED / SANDBOX_NOT_PROVISIONED`。随后 Explore 读取原始实验材料，明确没有获得 enqueue、ack、重启恢复或 2 秒时延证据；不把受阻当作供应商失败或目标不可达，不改变用户目标，不替用户采纳替代方案，也不形成已就绪 Summary。它说明持久化确认边界与时延仍待证实，因此依赖设计目前不能确认。嵌套调用和子 Agent 实际执行的原始结果均保留在 transcript 中。

该夹具刻意模拟“供应商沙箱未开通”，只验证提示词驱动的工具行为与不确定性处理，不验证任何真实供应商队列。未调用网络或凭据、未写正式项目源码、模型或 Change；宿主输出文件和临时实验文件属于证据。新增补证仅跑候选版，不构成相对提升证据；模型随机性及包装上下文仍限制可推广性。此前现成依据充分时无需新实验的分支由原对照支持。

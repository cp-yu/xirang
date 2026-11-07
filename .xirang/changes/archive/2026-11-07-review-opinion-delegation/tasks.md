## Goals

- [x] G1: 将 Review opinion 与 Quality 门禁切换到 v4 `reviewKind` 协议
  - Contract: `quality-cli-gate` / Section "Review 记录入口"
  - Verify: `full-change`、`incremental`、`supplemental` 意见可按真实 commit 保存且无需 `reviewId`/`scope`；同类失败与通过、Opt/Seal/status 按类别正确判定；旧 v3 文件明确报不支持并保持原样。

- [x] G2: Reviewer 对已提交 Change 独立取证并按确认的维度判断
  - Contract: `reviewer-protocol` / Section "三个验证维度"
  - Verify: 审查读取 `baseCommit` 到 HEAD 的累计 Change 及相关未修改文件，区分三类受托工作；缺失可信证据、弱断言和未经目标覆盖的行为变更不能通过，已有可信证据但持久测试必要性不明时可提出 WARNING；无效输入或审查期间 HEAD 变化不产生意见。

- [x] G3: 主 Agent 在所需测试通过后委派并汇总独立 Review
  - Contract: `quality-orchestration` / Section "显式 subagent delegation 指令"
  - Verify: 多个非冲突质量维度可并行审查同一完整 Change，汇总后仅记录一条 commit-bound 意见；任一必需维度失败或缺失不会形成 PASS，输入错误和 HEAD 竞争触发重新委派，Opt 后增量与原有 Change 缺陷修复分别得到适用审查。

- [x] G4: Reviewer 的跨平台工具投影与只读责任一致
  - Contract: `internal-subagent-generation` / Section "按角色编码工具原生权限"
  - Verify: Claude、Pi、OpenCode、Codex 生成的 Reviewer 不限制可用工具或硬性禁止编辑，而指令仍禁止修改；Pi Reviewer 可后台使用环境扩展工具，Optimizer 的启动方式和可写权限保持不变，更新生成物时用户自定义 model 保留。

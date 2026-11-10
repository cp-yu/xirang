本机验证：`pnpm run build`、`pnpm exec tsc --noEmit`、`pnpm exec vitest run`（165 files / 2220 tests）、`git diff --check`、`node scripts/audit-active-command-references.mjs`（active stale references: 0）通过。Neovim headless 的 list、compare、refresh、close、windows-paths、save、save-race、context 八种模式通过。`xirang validate --change reduce-cli-context-output --strict --json` 成功且两条输出流为空。受管工作面使用本次构建的 `xirang update --force --json` 重刷；stdout 为空，stderr 保留工具发现及 IDE 重启提示。

`cli-context-bytes.json` 是实际测量结果。复现：分别构建实现前基线 `6f77c5b1a` 与本分支，再执行 `node scripts/measure-cli-context.mjs <baseline-checkout> <current-checkout>`。脚本在同一临时位置重置相同模型、Change、配置及 Record，记录 stdout、stderr 和实际读取的辅助文件；静态文件首读成本包含在内。样本无警告，不能据此推断警告字节变化；计量单位是 UTF-8 字节，不是 token，也不证明真实 Agent 任务质量或普遍降幅。新旧完整 Contract 查询保留相同语义；默认 validation 样本未请求 preview。Propose 的辅助文件读取量增加，已纳入累计总量。

Windows 实际证据：[run 42805740210](https://github.com/cp-yu/xirang/actions/runs/42805740210) 的 `Verify Windows record paths and build gates` 步骤通过，覆盖本次文件名寻址、coverage/consume、CLI 输出与 Candidate 门禁。该 run 整体失败于随后 Neovim refresh 检查，不能视为整组通过。首轮跨平台 lint 失败已改为显式 if/else，`pnpm lint` 通过，runner 的 10 个测试通过。Neovim 的跳转测试按真实路径比较；随后 Windows 暴露保存事件路径分隔符不一致，已在事件匹配两端 normalize。本机八组 headless 模式和真实 CLI roundtrip 再次通过；Windows 重跑结果需独立查看 PR checks，不以本记录推测通过。后续生成 parity 再次检查通过，受管 skills/references 无差异。


独立 full-change Review 对 `2e8e255f0` 返回 FAIL，9 项 Required Corrections 保存在 Quality 历史。修正形成工作流的显式 preview 审阅、共享配置遵循规则与导航恢复策略、非交互 spinner、归档重试位置、schema JSON 详情、format-json 诊断、Candidate 文本真实 diff 和反馈装饰后，全量 2218 tests、lint、类型检查和构建通过。新增共享指导按现有注册机制交付，单独安装 Apply/Archive/Explore/Build/Snack 的新引用可解析；历史缺陷不在这里推断已修复。测量重新计入 Propose 的 preview 及 Propose/Apply 的配置指导首读，累计减少分别为 34.27% 与 5.94%；Record 仍为 15.27%。旧测量遗漏的必要读取不再作为收益。

Windows 专项在修正保存事件路径后整组通过：[run 42806410191](https://github.com/cp-yu/xirang/actions/runs/42806410191)，包含 Record 路径门禁和八组 Neovim 检查。LikeC4 Windows 同版本通过：[run 42806409840](https://github.com/cp-yu/xirang/actions/runs/42806409840)。[跨平台 run 42806409872](https://github.com/cp-yu/xirang/actions/runs/42806409872) 的 Linux、macOS 全套通过；Windows root tests 通过，但浏览器 E2E 的 Candidate 双击导航等待 focus URL 超时（44 passed / 1 failed）。该浏览器实现与测试未被本 Change 修改，仍需区分这次失败与后续重跑实际结果，不能称全部 CI 通过。


第二轮 full-change Review 对 `57d70cb24` 返回 FAIL，发现归档拒绝退出码、Build Formal 比较消费及 schema 失败定位三个缺口，意见保留在 Quality 历史。归档最终校验拒绝现在抛出失败且活动 Change 保留；schema 诊断包含包路径；Build 最终 review/presentation 前读取 --details，并在 digest 变化时刷新比较。对应 CLI 测试复现旧行为后通过；全量 165 files / 2220 tests、lint、类型检查、构建及活跃退役引用审计通过。测量中的 Candidate 组仅为 init + digest 校验的两次调用，不代表完整 Build 或 promotion 审阅流程。

后续 [Windows 专项 run 42809174589](https://github.com/cp-yu/xirang/actions/runs/42809174589) 通过。[LikeC4 Windows run 42809174599](https://github.com/cp-yu/xirang/actions/runs/42809174599) 的 language-server typecheck 子进程以 Windows 状态 -1073741502 / 3221225794 退出，日志未给出 TypeScript 代码诊断；不据此推断该 run 通过或本 Change 导致该进程失败。所有实际失败与重跑均保留，不改动无关浏览器或 vendored LikeC4 实现。

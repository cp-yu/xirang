本机验证：`pnpm run build`、`pnpm exec tsc --noEmit`、`pnpm exec vitest run`（165 files / 2211 tests）、`git diff --check`、`node scripts/audit-active-command-references.mjs`（active stale references: 0）通过。Neovim headless 的 list、compare、refresh、close、windows-paths、save、save-race、context 八种模式通过。`xirang validate --change reduce-cli-context-output --strict --json` 成功且两条输出流为空。受管工作面使用本次构建的 `xirang update --force --json` 重刷；stdout 为空，stderr 保留工具发现及 IDE 重启提示。

`cli-context-bytes.json` 是实际测量结果。复现：分别构建实现前基线 `6f77c5b1a` 与本分支，再执行 `node scripts/measure-cli-context.mjs <baseline-checkout> <current-checkout>`。脚本在同一临时位置重置相同模型、Change、配置及 Record，记录 stdout、stderr 和实际读取的辅助文件；静态文件首读成本包含在内。样本无警告，不能据此推断警告字节变化；计量单位是 UTF-8 字节，不是 token，也不证明真实 Agent 任务质量或普遍降幅。新旧完整 Contract 查询保留相同语义；默认 validation 样本未请求 preview。Propose 的辅助文件读取量增加，已纳入累计总量。

Windows 路径与交接验证由 `.github/workflows/windows.yml` 的真实 Windows runner 提供；实际 run 结果在完成后补入本文件。

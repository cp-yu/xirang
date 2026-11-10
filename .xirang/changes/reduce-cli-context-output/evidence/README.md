本机验证：`pnpm run build`、`pnpm exec tsc --noEmit`、`pnpm exec vitest run`（165 files / 2220 tests）、`git diff --check`、`node scripts/audit-active-command-references.mjs`（active stale references: 0）通过。Neovim headless 的 list、compare、refresh、close、windows-paths、save、save-race、context 八种模式通过。`xirang validate --change reduce-cli-context-output --strict --json` 成功且两条输出流为空。受管工作面使用本次构建的 `xirang update --force --json` 重刷；stdout 为空，stderr 保留工具发现及 IDE 重启提示。

`cli-context-bytes.json` 是实际测量结果。复现：分别构建实现前基线 `6f77c5b1a` 与本分支，再执行 `node scripts/measure-cli-context.mjs <baseline-checkout> <current-checkout>`。脚本在同一临时位置重置相同模型、Change、配置及 Record，记录 stdout、stderr 和实际读取的辅助文件；静态文件首读成本包含在内。样本无警告，不能据此推断警告字节变化；计量单位是 UTF-8 字节，不是 token，也不证明真实 Agent 任务质量或普遍降幅。新旧完整 Contract 查询保留相同语义；默认 validation 样本未请求 preview。Propose 的辅助文件读取量增加，已纳入累计总量。

Windows 实际证据：[run 42805740210](https://github.com/cp-yu/xirang/actions/runs/42805740210) 的 `Verify Windows record paths and build gates` 步骤通过，覆盖本次文件名寻址、coverage/consume、CLI 输出与 Candidate 门禁。该 run 整体失败于随后 Neovim refresh 检查，不能视为整组通过。首轮跨平台 lint 失败已改为显式 if/else，`pnpm lint` 通过，runner 的 10 个测试通过。Neovim 的跳转测试按真实路径比较；随后 Windows 暴露保存事件路径分隔符不一致，已在事件匹配两端 normalize。本机八组 headless 模式和真实 CLI roundtrip 再次通过；Windows 重跑结果需独立查看 PR checks，不以本记录推测通过。后续生成 parity 再次检查通过，受管 skills/references 无差异。


独立 full-change Review 对 `2e8e255f0` 返回 FAIL，9 项 Required Corrections 保存在 Quality 历史。修正形成工作流的显式 preview 审阅、共享配置遵循规则与导航恢复策略、非交互 spinner、归档重试位置、schema JSON 详情、format-json 诊断、Candidate 文本真实 diff 和反馈装饰后，全量 2218 tests、lint、类型检查和构建通过。新增共享指导按现有注册机制交付，单独安装 Apply/Archive/Explore/Build/Snack 的新引用可解析；历史缺陷不在这里推断已修复。测量重新计入 Propose 的 preview 及 Propose/Apply 的配置指导首读，累计减少分别为 34.27% 与 5.94%；Record 仍为 15.27%。旧测量遗漏的必要读取不再作为收益。

Windows 专项在修正保存事件路径后整组通过：[run 42806410191](https://github.com/cp-yu/xirang/actions/runs/42806410191)，包含 Record 路径门禁和八组 Neovim 检查。LikeC4 Windows 同版本通过：[run 42806409840](https://github.com/cp-yu/xirang/actions/runs/42806409840)。[跨平台 run 42806409872](https://github.com/cp-yu/xirang/actions/runs/42806409872) 的 Linux、macOS 全套通过；Windows root tests 通过，但浏览器 E2E 的 Candidate 双击导航等待 focus URL 超时（44 passed / 1 failed）。该浏览器实现与测试未被本 Change 修改，仍需区分这次失败与后续重跑实际结果，不能称全部 CI 通过。


第二轮 full-change Review 对 `57d70cb24` 返回 FAIL，发现归档拒绝退出码、Build Formal 比较消费及 schema 失败定位三个缺口，意见保留在 Quality 历史。归档最终校验拒绝现在抛出失败且活动 Change 保留；schema 诊断包含包路径；Build 最终 review/presentation 前读取 --details，并在 digest 变化时刷新比较。对应 CLI 测试复现旧行为后通过；全量 165 files / 2220 tests、lint、类型检查、构建及活跃退役引用审计通过。测量中的 Candidate 组仅为 init + digest 校验的两次调用，不代表完整 Build 或 promotion 审阅流程。

后续 [Windows 专项 run 42809174589](https://github.com/cp-yu/xirang/actions/runs/42809174589) 通过。[LikeC4 Windows run 42809174599](https://github.com/cp-yu/xirang/actions/runs/42809174599) 的 language-server typecheck 子进程以 Windows 状态 -1073741502 / 3221225794 退出，日志未给出 TypeScript 代码诊断；不据此推断该 run 通过或本 Change 导致该进程失败。所有实际失败与重跑均保留，不改动无关浏览器或 vendored LikeC4 实现。


第三轮 full-change Review 对 `d32ccb263` 返回 FAIL，发现 view 子进程未统一结果与诊断、instructions 退役链孤立两个缺口。View 的内部 validate/start 现在统一关闭 info 日志并捕获诊断，启动通过 IPC 返回 Vite 实际 resolvedUrls；文本输出逐行 URL，JSON 输出 `{ "urls": { "local": [], "network": [] } }` 形状的数据。实际最小模型探针在请求端口 61897 被占用时，两种编码均返回实际端口 61898，HTTP GET 得到 200；无进度或成功装饰，真实 `No likec4 documents found in workspace` 警告仅在 stderr，JSON 模式为结构化诊断。进程边界测试覆盖启动时即时结果与警告、校验静默及失败退出。

删除旧 enriched instructions generator、专有类型/帮助函数/导出和 prompt-only 配置投影；共享模板、Change context/status、配置归一化与 runtime 投影保留。旧 generator/prompt 测试随退役协议删除，notation consistency 改从实际交付的静态 reference 及 schema 检查。全量 165 files / 2184 tests、root lint/typecheck、LikeC4 typecheck、root/LikeC4 build、活跃退役引用审计（0）与 diff 检查通过；测试数量减少反映退役协议断言移除。Change strict validation 成功且两条输出流均为 0 字节。

第三轮修正前的 HEAD 对应 [Candidate Windows 42811144832](https://github.com/cp-yu/xirang/actions/runs/42811144832) 与 [LikeC4 Windows 42811144817](https://github.com/cp-yu/xirang/actions/runs/42811144817) 通过。[跨平台 42811144863](https://github.com/cp-yu/xirang/actions/runs/42811144863) 的 Linux、Windows 全套通过，macOS 的浏览器 `fits the diagram after switching` 谓词等待超时（44 passed / 1 failed）；不把此轮称为全部 CI 通过，也不推断该超时的原因。当前 View 修正仅改 vendored 服务 URL 输出，没有改浏览器交互实现。


第四轮 full-change Review 对 `309125e53` 返回 FAIL，发现文本 status 路径信息缺失、反馈认证恢复指引通道错误，并指出 Archive 指导仍描述已移除的成功回执。前两项在 owning tests 中复现失败后修正：文本 status 保留 outputPath、现有 outputs、completion marker 和依赖；未认证反馈在文本/JSON 两种模式的 stderr 同时返回认证警告与 `gh auth login`，stdout 仅保留手工提交材料。Archive 模板与重刷后的 skill 改为消费实际归档位置。全量 165 files / 2185 tests、lint/typecheck、build、active stale references: 0、diff 检查与 strict validation 通过；strict validation 两条输出流均为空。静态生成更新 stdout 为空，stderr 保留工具发现及重启提示。测量配方的 status 调用使用 JSON，本轮仅修正文本 status，未据此增加或重算收益。

`309125e53` 对应 [Candidate Windows 42813871949](https://github.com/cp-yu/xirang/actions/runs/42813871949) 与 [LikeC4 Windows 42813872116](https://github.com/cp-yu/xirang/actions/runs/42813872116) 已通过；[跨平台 42813871911](https://github.com/cp-yu/xirang/actions/runs/42813871911) 在此记录时 Linux 通过，Windows/macOS 仍运行，尚不能宣称整组通过。


第五轮 full-change Review 对 `28f22539c` 返回 FAIL，指出 Candidate 来源格式/绑定缺口及旧 slug + explorationId 路径构造链孤立。Candidate 现在只读解析 Build record 格式；coverage 校验完整 v1 字段、可移植 filename、精确来源 SHA-256、时间戳及条目形状/来源条目身份。来源未复制前允许格式正确的 coverage，以保留 consume 的先校验、复制、重验顺序；复制后必须匹配 exact source bytes。历史位置、摘录和 targetFingerprint 不对照当前模型重验，模型语义仍只来自四分区。过去只接受任意 canonical provenance bytes、`{ "schemaVersion": 1 }` coverage 的宽松断言已替换；不再将其作为有效性依据。

新增拒绝用例在修正前实际失败（14 failed），修正后覆盖缺失字段、错误版本/文件名/来源 hash/时间戳、非法条目和 malformed source/JSON；无效 Candidate 无可用 digest、CLI 非零且 stdout 为空，成功/失败均保留原始 bytes。测试也确认模型后续变化不会重新施加历史摘录或指纹约束。Build history 使用真实 coverage producer 的完整结果，保留精确字节。旧 managedRecordFilename/managedRecordPath 及专有断言已删除，legacy metadata parser 仍用的 slug/id validators 保留。构建后全量 165 files / 2198 tests、lint、typecheck、active stale references: 0、diff 检查与 strict validation 通过，strict validation 两条输出流为空。

第五轮修正前的 `28f22539c` 对应 [Candidate Windows 42815798143](https://github.com/cp-yu/xirang/actions/runs/42815798143)、[LikeC4 Windows 42815798146](https://github.com/cp-yu/xirang/actions/runs/42815798146) 已通过；[跨平台 42815798148](https://github.com/cp-yu/xirang/actions/runs/42815798148) 在记录时 Linux 通过、Windows/macOS 仍运行。


第六轮 full-change Review 对 `ee4946e6d` 返回 FAIL，发现真实 completion installer 和文件系统 helper 的直接 debug/warn 输出、global config 警告编码、当前 Opt 提交关联、Archive/Sync 指导四个缺口。补全首次安装的普通 ENOENT 不再输出；实际权限、编码、清理问题通过共享诊断编码；instruction arrays 只保留激活操作，Fish 无需激活所以成功静默。真实安装器测试使用临时 home/profile，覆盖 Bash/Zsh/Fish/PowerShell 的首次、重复安装及卸载，并检查用户配置保留；另验证 PowerShell 编码警告为结构化 stderr。built CLI 在隔离 HOME 下 Fish 首次、重复安装和卸载三次均 exit 0、stdout/stderr 为 0 字节。全局配置 retired/obsolete/malformed 三类警告均与 JSON 数据分流、文件不被改写。

Quality 默认状态保留最新 delivered Opt 的 baseCommit/resultCommit，完整 opinions 仍仅 history 展开；测试用两条 Opt opinions 确认最新关联。Archive 模板和实际生成 skill 现在在 archive 前按 Delta operations 调用独立 `xirang sync`，失败即停止，摘要区分 Sync 写入与 Archive 门禁。新增四类缺陷用例在修正前 6 failed；修正后相关 270 tests 通过，构建后全量 166 files / 2206 tests、lint/typecheck、active stale references: 0、diff 检查及 strict validation 通过；strict validation 两条输出流为空。生成更新 stdout 为空，工具发现及重启诊断仍保留。

`ee4946e6d` 对应 [Candidate Windows 42818041685](https://github.com/cp-yu/xirang/actions/runs/42818041685) 与 [LikeC4 Windows 42818041702](https://github.com/cp-yu/xirang/actions/runs/42818041702) 通过。[跨平台 42818041631](https://github.com/cp-yu/xirang/actions/runs/42818041631) 的 Linux、macOS 全套通过，Windows Candidate 双击导航的 focus URL 断言超时（44 passed / 1 failed），不能称整组 CI 通过；该浏览器交互实现与测试未被此轮改动。

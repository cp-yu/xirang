## 一次性验证证据记录（Apply 执行时间：2026-10-30）

本文件汇总 C5–C9 的一次性验证证据与遗留缺口，供后续轮次审计。所有实验均在 repository 外的临时 Git 项目中用构建后的真实 CLI（`bin/xirang.js`）执行；临时目录：`/tmp/c5-recovery-KgyGw4`（流程验证）、`/tmp/c8-surface-eL7I45`（生成面验证）。

### C5 同代码重启与新额度（真实 CLI）

1. `quality review` PASS（src/note.ts v1）→ 代码改为 v2 → PASS → `optimize` 选取方向（`directionsUsed: 1`）→ `optimize` 以 attempt failed + `stopReason: UNSAFE` 收口（terminal `ABORTED_UNSAFE`）。
2. 仅恢复代码 v1：`quality status --json` = `clean`，review 证据 PASS，`optimization.terminal: ABORTED_UNSAFE`，`directionsUsed: 1`，`allowedNextOperations: []`。
3. 按恢复 reference 执行受控轮换：`.quality-history/20261030T070104154Z-c5/` 保存两份原始字节 + `recovery.json`（SHA-256、原因、`rotationComplete`），先校验后移走，轮换后复核。
4. 轮换后同代码：`state: dirty`，next `['review']`，`directionsUsed: 0`——历史 PASS 不满足新轮次。
5. 新 Review 前门禁：`optimize` → `REVIEW_REQUIRED`；`seal` → `SEAL_NOT_READY`（terminal `MISSING`，无 unsafe 泄漏）。
6. fresh Review 周期：FAIL fixture → dirty → 修正 → PASS → clean；随后新方向选取成功，新台账 `directionsUsed: 1`（从零而非 2）、无旧终态、histories rounds `[1]`；历史与 `recovery.json` 可读，新活动日志独立（3 行，首行 FAIL 保留）。

### C6 保存失败与部分轮换重入矩阵

以 c2-interrupt 的 fixture PASS 记录逐场景执行（各场景重置）：

- A 保存失败：仅快照已保存、日志未保存时，两份原件保持原字节；重入补齐同次保存并复核通过，期间未启动新 Review。
- B 轮换中断：两份均已保存校验、快照已移走而日志尚在；重入完成剩余轮换后根目录干净，`status` 为 `dirty` 且 next `['review']`。
- C 备份冲突：历史位置含不同内容时检出冲突，根目录文件集合与字节不变，未轮换未删除。
- D 新活动记录已建立：`rotationComplete: true` 时重入保留新活动记录，历史未被再次轮换或覆盖。

### C7 真实 Git 回滚保护全量历史

- 未跟踪历史：外部清单 5 个文件（含历史目录 3 个）；`git reset --hard HEAD` + `git clean -fd` 后根记录与历史全部消失、代码回到 v1；按清单恢复后 missing/extra/mismatch 均为 none；`status` = clean；failed attempt 记录后方向 `failureCount` 0→1 连续，日志前缀字节保留。
- 过期已跟踪历史：提交后篡改当前日志再回滚，`reset` 恢复出提交时的旧日志，与外部清单比对检出 `.quality-log.jsonl` 不一致——协议停止而非接受过期历史。
- 附带观察：`git clean -fd` 同时清除了未跟踪的临时变更目录 c2-interrupt（其证据已在 C6 先行留存）；真实流程中隔离元数据与提交边界由 Apply reference 约束。

### C8 生成工作面可达与角色历史读取

- `setup --tools pi` 安装 `.xirang/references/xirang-quality-recovery.md`；Apply 与 Archive 生成的 SKILL.md 均引用该路径。
- `xirang-reviewer` 生成 agent 内联 history 协议（`quality-history` 读取、历史 PASS 不作本轮证据、无活动记录时 `priorQualityRecord` 为 null）；`xirang-optimizer` 经由生成的 `xirang-self-read-protocol.md` 与 `xirang-decision-rules.md` 承载同一协议（均含 quality-history 条款，agent 文件引用这两份 reference）。
- archive-only 模板选择：`getSkillTemplates(['archive'])` 合并后的 referenceFiles 含 `references/quality-recovery.md` 与全部 8 个 apply-step references（dist 构建 API 验证）。
- 角色门禁演练：仅存在历史目录时 `optimize` → `REVIEW_REQUIRED` / `dirty`（旧 PASS 未导入），轮换后 fresh review 通过为 clean。
- 当前项目已执行既有 `update --force` 投影：`.pi/skills/`、`.pi/agents/`、`.xirang/references/` 的 diff 与模板来源一致。

### C9 构建类型与平台路径验证

- `pnpm build` 通过（含 LikeC4 子构建）；`pnpm exec tsc --noEmit` 通过。
- `.github/workflows/windows.yml` 的 root 测试步骤已加入 `test/core/quality/state.test.ts` 与 `test/commands/quality.test.ts`。
- **证据缺口（显式记录，不以 Linux 结果代替）**：本机无 Windows 执行条件，Windows CI 运行结果与 Windows 带空格路径下的保存/轮换/恢复抽查尚未取得；待推送后由 CI 补充验证。路径逻辑已由平台 path API 与既有 Windows 路径归一化测试覆盖（本机 POSIX 运行）。

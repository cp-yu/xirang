## Context

`Validator` 的 delta 路径用私有 `extractRequirementText` 只取首条非 metadata 正文行；`countSurvivingScenarios` 不识别 fenced code。`MarkdownParser` 已有 fence mask 用于 heading 解析，但 requirement `text` 仍取 first line。`task-structure.ts` 另有一份 fence mask。上游 v1.6 将 reader 抽到 `requirement-text.ts`，但本 fork 含 scenario operation labels，不能整文件 cherry-pick。

本 change 仅修复校验读取保真度；`specs-apply` 继续使用 raw `RequirementBlock` 写出 formal specs。

## Goals / Non-Goals

**Goals:**

- 单一 fence-aware requirement body 提取与 `SHALL/MUST` 检测，供 delta 与 main validation 共用
- Surviving scenario 计数忽略 fence 内 `#### Scenario:`，并保留本 fork 的 `[REMOVED]` 语义
- 回归覆盖 multi-line、metadata-only body、fence、whole-word keyword、CRLF
- formal write / sync 输出内容不因本 change 改变

**Non-Goals:**

- stale MODIFIED / sync 防护
- archive exit code、nested tasks/specs、doctor/context、Store
- 收紧 bare `###` header 识别策略
- 强制统一 `task-structure` 的 fence mask（仅在 diff 干净时可选委托）

## Decisions

1. **共享模块 `src/core/parsers/requirement-text.ts`**
   - 提供 `buildCodeFenceMask`、`extractRequirementBody`、`containsShallOrMust`、非 fence scenario 计数辅助
   - `Validator` 删除/委托私有重复实现
   - 移植上游思想，手写适配本 fork label 语义；不整文件 cherry-pick

2. **正文提取**
   - 输入为 requirement header 之后的行
   - 跳过 fence 内行；遇非 fence 的 `####`/`###`/`##` 等 header 停止
   - 跳过空行
   - `**X**:` metadata：有其他正文时跳过；仅有 metadata 时保留为 body
   - 捕获行 trim 后用 `\n` 连接为完整 body，再做 keyword 检测
   - 无 body → missing requirement text ERROR

3. **Scenario 计数**
   - 仅统计非 fence 的 `#### Scenario:`（保持 `Scenario:` 前缀，不把任意 `####` 当 scenario）
   - 再应用现有 label：`[REMOVED]` 不计入 surviving；unlabeled / `[ADDED]` / `[MODIFIED]` 计入

4. **Display 与 validation 分离**
   - Validation 使用完整 body
   - `MarkdownParser` display `req.text` 保持 first-line，避免 `show`/JSON 显示形态变宽

5. **Main-spec keyword**
   - 若 main 路径已有 header-only keyword 提示，接线到 shared predicate/body；否则至少保证 delta 与 shared predicate 一致，main 路径用同一 body 提取做 keyword 判定

## Risks / Trade-offs

- **[Risk]** 完整 body 上的 keyword 检测可能让“首行无 keyword、后续示例含 MUST”的松散文档通过 → 接受；真实问题是漏检而非过检
- **[Risk]** `task-structure` 与 shared mask 短期并存 → known debt，不阻塞本 change
- **[Trade-off]** display 不改为 full body → 校验正确与输出稳定优先

## Migration Plan

无需数据迁移。合并后既有 change/spec 在 multi-line 与 fence 场景下校验更准确；若出现新 FAIL，通常是此前被漏检的真实缺失 keyword/scenario。

## Test Maintenance

- **Update**：`test/core/validation.test.ts`、parser 相关单测增加 multi-line / fence / metadata-only / whole-word 回归
- **Preserve**：已有 metadata-before-SHALL、`[REMOVED]` surviving、CRLF section 解析用例
- **Do not change**：sync/archive formal content fixtures 的字节期望

## Open Questions

- None（Design Summary 已确认：仅 Parser fidelity；Architecture Source 为 None）

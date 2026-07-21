## Context

`validateChangeDeltaSpecs()` 已能在 delta spec 落盘后检查 section-type 与 main spec header 是否一致，但 propose/authoring 阶段缺少写入前入口。`openspec list --specs --json` 已暴露 requirement headers，仍需要作者自行筛选和比较。

## Goals / Non-Goals

**Goals:**
- 新增专用 pre-write CLI，按 spec id 输出 main spec 可引用 requirement headers。
- 按 `ADDED`、`MODIFIED`、`REMOVED`、`RENAMED FROM` 语义检查计划引用，聚合全部结果后决定 exit code。
- 在 propose workflow 的 specs 写入前加入精简 guidance。

**Non-Goals:**
- 不解析未落盘的完整 delta spec 正文。
- 不做 OPSX `cap.*` 到 spec id 的 registry 解析。
- 不做 fuzzy matching 或语义重复判断。
- 不替代 `openspec validate --change <name> --artifacts specs`。

## Decisions

1. 新增 `openspec check-delta`，不扩展 `openspec validate`。
   - 理由：`validate` 是 post-write artifact validation；`check-delta` 是 authoring preflight。混用会让 `--artifacts` 与文件系统读取语义变复杂。
   - 替代方案：增加 `openspec validate --pre-write`。拒绝，因为该入口没有待验证文件，语义不清。

2. `--caps` 按 spec directory name 解析。
   - 理由：用户示例使用 `database-handler-resolver` 这类 spec id；直接映射 `openspec/specs/<spec-id>/spec.md` 最短且确定。
   - 替代方案：支持 OPSX `cap.*` 到 spec 的反查。拒绝，因为会扩大到 spec registry 行为。

3. 使用 operation-specific flags，不保留 `--requirement`。
   - 理由：`--added` 需要检查“不存在”，`--modified`/`--removed`/`--renamed-from` 需要检查“存在”；单一 flag 无法表达相反期望。
   - 替代方案：`--requirement` 默认当作 `--modified`。拒绝，因为会形成含糊别名。

4. 复用 `extractRequirementsSection()` 与 `normalizeRequirementName()`。
   - 理由：preflight 匹配必须与 post-write validation 的 requirement header 语义一致。
   - 替代方案：复制 `list.ts` 的 header 抽取。拒绝，因为会产生第二套匹配规则。

5. Propose guidance 保持在 main instructions 中。
   - 理由：当前 propose template 没有 `referenceFiles`；新增一个 reference 只承载短 CLI guidance 是过度设计。
   - 替代方案：为 propose 新增 reference。拒绝，除非后续 guidance 超过主 skill 精简边界。

## Risks / Trade-offs

- [Risk] 用户可能把 `--caps` 理解为 OPSX capability ID。→ Mitigation: 不存在时错误信息明确 `--caps expects spec ids / spec directory names`。
- [Risk] `--added` 只能发现 header 重名，不能发现语义重复。→ Mitigation: 维持 deterministic symbol check，语义重复交给 review。
- [Risk] operation flags 要求 agent 先分类。→ Mitigation: 分类正是避免 `ADDED` 重名和 `MODIFIED` 缺失混淆的必要输入。
- [Risk] pre-write check 是 blocking，但 propose post-write validation 仍 warning-only。→ Mitigation: guidance 只声明 missing/conflict 在写 specs 前阻塞，不改变 post-propose validation gate。
- [Risk] 输出 requirement 列表可能较长。→ Mitigation: 第一版保留完整 `Available requirements`，后续再按需要新增过滤 flag。

## Context

现行 Definition Framing（`xirang framing`，v2 记录）只有自由文本 `entries`，写入是整份替换，协议要求先重读全文、展示完整 payload、单独授权、再核对 diff。goFate `jev-situation-recall` 暴露了三处丢失：写入时例子被抽象掉（“A、C 时 ABC、ACD 可以，AB 不行”只剩“同一或祖先关系”）；Propose 覆盖检查只有一句笼统描述，`consume` 照常通过；结构无法记录，Propose 把既有元素的 `kind`/`parent` 按实现关系写错。

现有可复用机制：`xirang quality review` 以证据指纹绑定 reviewer 结论并在 `seal` 时校验；`sync-engine.ts` 的 `STALE_SHARED_REFERENCE_FILES` 显式删除退役的受管 reference；`src/core/framing/validator.ts` 已能计算 `semanticModelFingerprint`；`diffFramingPayloads` 已按 identity 给出条目三段式差异。

## Goals / Non-Goals

**Goals:**

- 记录能独立支撑 Propose / Build 写出 Contract 与 Acceptance Case，含用户原样例子与组件结构。
- 写入交互只涉及本次变化，确认设计即记录。
- 覆盖检查不可跳过、不可笼统带过：原子细节粒度、位置真实存在、结构逐字段一致，由 CLI 门禁。
- 概念与 CLI 改名，消除“framing / structural”误导。

**Non-Goals:**

- 不为 Propose / Build 覆盖检查引入 subagent；消融实验后由用户决定保持当前 Agent 自查并以 `quote` 加固（见 D7）。
- 不为旧命令、旧目录或 v2 记录提供兼容或迁移。
- CLI 不判断语义是否真的保留。

## Decisions

### D1 改名与 identity

- 模型：`definition-framing` → `design-record`，`change-structural-definition` → `confirmed-design-record`，`definition-framing-operations` → `design-record-operations`，按 REMOVED + ADDED 处理并重建 7 条 Relationship。选择改 identity 而非只改 title：identity 会出现在 `arch outline/query` 与关系中，只改 title 仍会误导。
- 删除 `causal-definition`、`identity-boundary-clarification`、`bfs-confirmation`、`single-dimension-decomposition`：结构形成由可配置的 `decomposition` 指导及 `explore-brainstorming`、`propose-workflow`、`semantic-model-build` 的既有 Section 负责；在模型里写死“单维度 + BFS”会与项目自选的分解方法冲突。原 `definition-framing` 的 Section“按项目拆分指导确认结构目标”同理不迁入 `design-record`。
- 代码：`src/core/framing/` → `src/core/record/`，`src/commands/framing.ts` → `src/commands/record.ts`，`ChangeStructuralDefinition*` → `DesignRecord*`；受管目录 `.xirang/framing/` → `.xirang/records/`；交接文件 `framing-source.md` → `record-source.md`，新增 `record-coverage.json`；reference `references/definition-framing.md` → `references/design-record.md`（投影为 `.xirang/references/xirang-design-record.md`），旧 `xirang-definition-framing.md` 加入 `STALE_SHARED_REFERENCE_FILES`。
- 已归档 Change 中的 `framing-source.md` 原样保留，不改写历史。

### D2 记录格式 v3

```yaml
schemaVersion: 3
context: change            # 或 build
relatedIdentities: [...]
entries:
  - identity: conjunctive-label-coverage
    nature: normative      # 或 informative
    content: |
      多行自由文本，含原样例子
structure:
  elements:               # 字段取自 element-declaration，全部可选（identity 除外）
    - identity: d
      kind: element
      parent: x            # null 表示 Project Root
      removed: true        # 仅删除时出现
  relationships:
    - { source: a, kind: consumes, target: b }
    - { source: a, kind: invokes, target: c, removed: true }
  elementKinds: [...]      # 字段取自 element-kind
  relationshipKinds: [...] # 字段取自 relationship-kind
```

- `schemaVersion: 2` 记录诊断为不受支持。允许只有 `structure` 或只有 `entries`，两者皆空视为空记录。
- 备选“条目上挂 `structure` 字段”被否决：会出现条目 identity 与模型 identity 两套身份。备选“照搬 Delta operation”被否决：操作标签随模型漂移而过时，且与 Delta 职责重复。

### D3 按部分更新

```yaml
entries:
  upsert: [ {identity, nature, content} ]
  remove: [identity]
structure:
  upsert:
    elements: [ {identity, <fields>, clear: [field]} ]
    relationships: [ {source, kind, target, removed?} ]
    elementKinds: [...]
    relationshipKinds: [...]
  withdraw:
    elements: [identity]
    relationships: [ {source, kind, target} ]
    elementKinds: [identity]
    relationshipKinds: [identity]
relatedIdentities: { add: [...], remove: [...] }
```

- `xirang record update <id> --source-version <v> [--from <file>]`，stdin 默认。版本不一致返回 invalid（code `SOURCE_VERSION_STALE`）与当前版本。
- 用 `clear` 列表而非 null 清除字段，因为 `parent: null` 是合法值（Project Root）。
- `withdraw`（回到未确认）与 `removed: true`（目标删除）分开，避免“撤回确认”被编译成 REMOVED Delta。
- 返回：`diff`（条目三段式沿用现有实现；结构按 identity 分 added / modified / withdrawn，modified 下分 `changedFields`（before/after）、`addedFields`、`clearedFields`），`derived`（每个结构对象对当前模型：added / modified / removed / unchanged），`summary`（entries、normative、各类结构对象数），`sourceVersion`；不返回 `document`。`create` 仍接收完整 v3 payload；`show` 仍返回完整记录。

### D4 结构校验

create / update / validate 时：Element 的 `kind` 须在当前 Metamodel 或记录中未删除的 elementKinds；`parent` 须解析到当前模型或记录中未删除的 Element，`null` 须满足 Kind 的 root 规则；Relationship 的 `kind` 与两端同理；字段须属于对应实体。无正式模型的初始 Build 仅按记录自身解析。诊断带对象 identity、字段与原因。

### D5 覆盖结果与门禁

- 输入（JSON，`--from <file>` 或 stdin，与其他 `record` 子命令一致）：

```json
{
  "entries": [
    {
      "identity": "conjunctive-label-coverage",
      "details": [
        { "detail": "A、C 时 ABC、ACD 可入选", "location": { "element": "event.catalog.candidate-selection", "section": "Key Acceptance Cases", "acceptanceCase": "多标签全覆盖" }, "quote": "当前画像为 A、C 时，事件 ABC、ACD 入选" },
        { "detail": "AB 不行（缺少 C）", "uncovered": "Delta 中没有反例" }
      ]
    }
  ]
}
```

- Element 位置（Declaration、Section、Acceptance Case）的细节须带 `quote`：该位置承载此细节的原文摘录。CLI 在忽略空白与 Markdown 强调标记后做子串校验（Declaration 为 title + definition；Section 含其 Acceptance Case 名称与正文；Acceptance Case 为其名称与正文），缺失或不匹配时拒绝（`INVALID_COVERAGE_INPUT` / `COVERAGE_QUOTE_NOT_FOUND`）。Relationship、Kind、View 由 identity 完整确定，不带 `quote`。CLI 不判断摘录是否表达了该细节。
- 位置形态：`{element}`（Declaration）、`{element, section}`、`{element, section, acceptanceCase}`、`{relationship: {source, kind, target}}`、`{elementKind}`、`{relationshipKind}`、`{view}`。位置对 Change 的 Expected Semantic Model（正式模型 + Delta）或 Candidate 四分区解析，允许指向未改动的既有语义作为 no-op 落位；这是对“位置在 Delta 中真实存在”的推导修正，否则 no-op 条目永远无法通过。
- `xirang record coverage <id> (--change <name> | --candidate) --source-version <v>`：全部通过才写 `record-coverage.json`（含结果、`sourceVersion`、`targetFingerprint`、写入时间由 CLI 生成）；否则 invalid + 逐项诊断，不写入。重复执行覆盖旧结果。
- `targetFingerprint`：对目标模型取语义指纹（`semanticModelFingerprint`）并区分 Change / Candidate 后做 SHA-256；Change 的目标模型为 Expected Semantic Model（正式模型 + Delta），Candidate 为其四分区。只改排版不改语义的编辑不使覆盖失效；`proposal.md`、`design.md`、`tasks.md` 不参与。
- `consume`：校验 sourceVersion → 覆盖结果存在且 `sourceVersion`、`targetFingerprint` 与当前一致（否则 `COVERAGE_STALE` / `COVERAGE_MISSING`）→ 结构逐字段比对（`STRUCTURE_MISMATCH`，列出对象、字段、记录值、目标值）→ 写 `record-source.md` → 适用校验 → 删除活动记录。Candidate 校验器允许并纳入 `record-source.md` 与 `record-coverage.json`，promotion 将二者写入 history。
- 与 `xirang quality review` 同构：结论由 Agent 产出、CLI 记录并以指纹绑定、下游门禁复验。

### D6 协议文本

- Explore / Build：确认即记录；写入后只报告 diff 与 summary，修改已确认内容单独标出；冲突先裁决。删除“展示完整 payload / 单独持久化授权 / 先 show 全文再组合 replacement”的规则。硬规则“确认设计不等于授权写入”改为只对记录放开。
- 条目写入标准：“Propose 不看会话能否据此写出 Contract 与 Acceptance Case”，例子原样；组件结构写 `structure`。
- Propose / Build：写作规则（例子 → Acceptance Case，数值/时序/例外不泛化），原子细节覆盖检查 → `record coverage` → `record consume`；Delta 在覆盖后再改须重做。
- Propose 流程顺序：Delta 与 Plan 完成 → 计划一致性复核 → `xirang validate --change` → 覆盖检查与 `record coverage` → `record consume`。覆盖放在 validation 之后，避免 validation 修复使指纹失效。

### D7 消融实验

在其他任务完成且全量测试通过后执行，决定是否在 Propose 覆盖检查中引入 subagent。

- 隔离：goFate 仓库新建 worktree，从 goFate 提交 `0bb32c5`（`jev-situation-recall` 刚完成 Propose 的制品）出发（Change 目录保留 proposal、design、tasks，移除 Delta 与 `framing-source.md`），不改 goFate 主工作树。
- 材料：由 `framing-source.md` 条目生成 v3 活动记录；按新写入标准补入已确认但被丢失的例子（ABC/ACD/AB）。标准答案 = 已知丢失项（经用户确认）+ 人为植入缺陷（如 K=32 改为 16、删除 `no_event` 项、世界切换改为当前轮生效），植入发生在 Delta 写完、覆盖检查之前。
- 两臂，均用 `bigmodel/glm-5.3-flash`、同一份检查说明与 D5 输出格式：
  - 当前 Agent：新会话运行 `xirang-propose` 至覆盖检查前暂停，植入缺陷后由该会话执行检查（负担含长 skill 与 14 个 Delta 编写）。
  - subagent：fresh context，只给 explorationId、changeName、changeDir、projectRoot。
- 每臂 3 次；指标：检出数/缺陷总数、错判通过、误报、耗时与 token。决策：subagent 稳定检出当前 Agent 漏掉的缺陷则建议引入，否则维持当前 Agent。
- 结果写入本 Change 目录 `ablation-report.md` 作为证据。
- 执行结果：子代理 3 次稳定 3/4，当前 Agent 3/4、0/4、4/4；按上述判定指向引入子代理。两臂共同漏洞是把泛化 Acceptance Case 当作例子的落位（ABC 5/6 次漏检）。
- 用户决定：保持当前 Agent 自查，不引入子代理；在 D5 中为 Element 位置增加 `quote`，由 CLI 校验摘录出现在该位置。当前 Agent 一侧完成了真实 Propose 与 `record coverage`（均被拒绝），未到 `consume`；`consume` 由 D8 的集成测试覆盖。

### D8 测试策略

- **Modify**（在现有测试上改名并扩展，不新建平行测试）：
  - `test/commands/framing.test.ts`、`framing-json.test.ts` → record 命令：部分 upsert/remove 不影响未提及内容；`--source-version` 过期拒绝；update 返回 diff/summary 且无 document；coverage 四种拒绝（缺条目、零细节、uncovered、位置不存在）与成功写入；consume 的 `COVERAGE_MISSING`、`COVERAGE_STALE`（写覆盖后改 Delta）、`STRUCTURE_MISMATCH`；旧 `framing` 命令未知。
  - `test/core/framing/*` → `test/core/record/*`：document v3 解析与 v2 拒绝、structure 校验（unknown kind、parent 不可解析、Relationship 端点、非法字段、无模型 Build）、字段级 diff（changed/added/cleared）、derived 推导、`clear` 与 `parent: null` 区分、withdraw 与 removed 区分、Candidate 目标位置解析、指纹计算。
  - `test/integration/framing-workflow.test.ts`、`windows-definition-ci.test.ts`、`test/utils/framing-discovery-isolation.test.ts` → 改用 record 路径与 `.xirang/records/`。
  - `test/commands/candidate-{validate,promote}.test.ts`、`test/core/candidate-history.test.ts`：`record-source.md` 与 `record-coverage.json` 纳入 digest 与 history。
  - `test/core/templates/definition-framing-reference.test.ts` → `design-record-reference.test.ts`，以及 `explore-template`、`propose-template`、`build` 测试：只锁定会失败关闭的语义（覆盖门禁必须执行、确认即记录、写作规则、原子细节粒度）；删除锁定“完整 payload / 单独授权 / 先 show 全文”旧措辞的断言。
- **Delete**：锁定整份替换语义或旧文案、且行为已不存在的断言。
- **One-time**：`xirang update` 重刷生成面后 `pnpm build && pnpm lint && pnpm test`；`rg` 扫描 `framing|Definition Framing|ChangeStructuralDefinition|framing-source|change-structural-definition` 在 `src`、`test`、`.pi`、`.xirang/references`、`.xirang/model`、`AGENTS.md` 中为零（`.xirang/changes/archive/` 与本 Change 的 `framing-source.md` 除外）；`xirang arch validate` 在 sync 前后通过；D7 消融实验。

## Risks / Trade-offs

- [BREAKING 改名使现有活动记录失效] → 本 Change 自己的记录在改名实现前由当前 CLI `framing consume` 消费为 `framing-source.md`；其他项目的活动记录需用户手动处理，CLI 明确诊断。
- [确认即记录时 Agent 误解用户确认] → 每次写入后报告变更并单独标出修改已确认内容，用户事后纠正；Propose 入口仍读取完整记录。
- [CLI 门禁只证明检查执行与位置存在，不证明语义保留] → 原子细节粒度 + 位置必须精确到 Section / Acceptance Case，缩小可糊弄空间；语义准确度交由消融实验评估。
- [结构逐字段比对可能拒绝 Propose 的合理推导修正] → 修正须退回 Explore 修订记录；这是有意保持记录权威。
- [消融样本小（1 个 Change × 3 次）且单模型] → 结论只用于决定是否引入 subagent，不外推到其他模型。

## Migration Plan

1. Propose 结束时用现有 CLI 消费本 Change 的记录（生成 `framing-source.md`）。
2. Apply 实现改名与新行为；`xirang update` 重刷本仓库生成面，旧 reference 被清理。
3. Archive sync 后正式模型只含新 identity；AGENTS.md 由 Apply 同步更新。
4. 回滚：代码与生成面按 git 回退；无数据迁移需要回滚。

## Open Questions

- `quote` 能否让检查者改判泛化落位（ABC 类）未经实验验证；如仍不足，再评估子代理。

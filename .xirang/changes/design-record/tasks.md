### Task 1: `xirang record` 命令面与 v3 记录格式

**Goal**: 以 `xirang record` 替代 `xirang framing`，实现 v3 记录（条目 + 结构）、结构校验、按部分更新与字段级差异；交接暂沿用现有 consume 语义（门禁在 Task 2）。

**Files**:
- Delete: `src/commands/framing.ts`
- Delete: `src/core/framing/`
- Create: `src/commands/record.ts`
- Create: `src/core/record/`
- Modify: `src/cli/index.ts`
- Modify: `src/core/completions/positional-types.ts`
- Modify: `src/core/candidate/validator.ts`
- Modify: `src/core/candidate/history.ts`
- Modify: `src/core/candidate/promotion.ts`
- Modify: `src/core/model/node-presentation.ts`
- Modify: `src/core/model/relationship-presentation.ts`
- Delete: `test/commands/framing.test.ts`
- Delete: `test/commands/framing-json.test.ts`
- Delete: `test/core/framing/`
- Create: `test/commands/record.test.ts`
- Create: `test/commands/record-json.test.ts`
- Create: `test/core/record/`
- Delete: `test/utils/framing-discovery-isolation.test.ts`
- Create: `test/utils/record-discovery-isolation.test.ts`
- Modify: `test/integration/windows-definition-ci.test.ts`
- Modify: `.github/workflows/windows.yml`
- Modify: `.github/workflows/test-windows.yml`
- Delete: `test/integration/framing-workflow.test.ts`
- Create: `test/integration/record-workflow.test.ts`
- Modify: `test/commands/candidate-validate.test.ts`
- Modify: `test/commands/candidate-promote.test.ts`
- Modify: `test/core/candidate-history.test.ts`

**Sections**:
- 按 `elements/design-record-operations.md` 与 design D1 改名：`.xirang/records/`、`record-source.md`、`DesignRecord*` 类型；不注册 `framing` 命令或别名；v2 记录与 `.xirang/framing/` 不被发现为有效记录。
- 按 `elements/confirmed-design-record.md` 与 design D2 实现 v3 文档：`entries` 自由文本、`structure` 四类对象按语义 identity 定位、`removed: true`、部分字段 Declaration。
- 按 design D3 实现 update patch（upsert / remove / withdraw / clear、relatedIdentities add/remove），强制 `--source-version`，返回 diff（条目三段式、结构字段级 changed/added/cleared）、derived 与 summary，不返回 document；create 仍收完整 v3 payload，show 返回完整记录。
- 按 design D4 在 create / update / validate 中校验结构：Kind、parent、Relationship 端点对当前模型与记录解析，字段限于对应实体；无正式模型的 Build 仅按记录自身解析。
- `consume` 仅改名与目标文件名，保持现有来源快照与恢复语义，使本任务独立 GREEN；Candidate 校验器、history、promotion 同步接受 `record-source.md`。

#### Checks

- [x] C1 按部分更新保留未提及内容并拒绝过期版本
  - Verifies: `elements/design-record-operations.md` / Section "按部分更新记录"
  - Test action: add
  - Command: `pnpm vitest run test/core/record test/commands/record.test.ts`
  - Expect: upsert 一条、修改一条后其余条目与结构对象逐字不变；过期 `--source-version` 返回 invalid 与当前版本且文件字节不变；update 输出含 diff、summary、sourceVersion 且无 document；`clear` 移除字段而 `parent: null` 保留为 Project Root

- [x] C2 字段级差异区分修改、补充与清除，并按当前模型推导
  - Verifies: `elements/design-record-operations.md` / Section "返回确认内容的相对变化"
  - Test action: add
  - Command: `pnpm vitest run test/core/record`
  - Expect: parent 从 X 改为 Y 列入 changedFields（X → Y），新增 definition 列入 addedFields；与当前模型一致的对象 derived 为 unchanged，模型中不存在的为 added

- [x] C3 结构引用无法解析时拒绝写入
  - Verifies: `elements/design-record-operations.md` / Section "校验记录结构与上下文"
  - Test action: add
  - Command: `pnpm vitest run test/core/record test/commands/record.test.ts`
  - Expect: unknown kind、parent 不可解析、Relationship 端点不存在、非法字段各返回带 identity 与字段的稳定诊断且不写入；无正式模型的 Build 记录按自身结构解析成功；损坏模型返回错误

- [x] C4 v3 两部分格式与目标状态
  - Verifies: `elements/confirmed-design-record.md` / Section "结构部分表达目标状态"
  - Test action: add
  - Command: `pnpm vitest run test/core/record`
  - Expect: 未出现在 structure 的对象不产生删除推导；`removed: true` 推导为 removed；withdraw 使对象回到未确认而非 removed；记录中不存在 ADDED/MODIFIED/REMOVED 字段

- [x] C5 条目与结构可独立记录，Build 与 Change 实例隔离
  - Verifies: `elements/confirmed-design-record.md` / Section "以条目与结构两部分表达确认内容"
  - Test action: modify
  - Command: `pnpm vitest run test/core/record test/utils/record-discovery-isolation.test.ts`
  - Expect: 只有条目或只有结构的记录均可创建，两者皆空被拒绝；条目含多行 content 原样往返；Build 与 Change 记录互不覆盖

- [x] C6 旧命令、旧目录与 v2 记录不被接受
  - Verifies: `elements/design-record-operations.md` / Section "管理统一确认记录生命周期"
  - Test action: modify
  - Command: `pnpm vitest run test/commands/record.test.ts`
  - Expect: `xirang framing list` 按未知命令失败；`.xirang/framing/` 下文件不出现在 `record list`；`.xirang/records/` 下 `schemaVersion: 2` 报告不受支持且文件不被修改或删除

- [x] C7 路径隔离与 JSON Contract
  - Verifies: `elements/design-record-operations.md` / Section "隔离受控文件路径"
  - Test action: modify
  - Command: `pnpm vitest run test/core/record test/commands/record-json.test.ts test/integration/windows-definition-ci.test.ts`
  - Expect: symlink 与越界路径返回稳定路径错误；JSON 路径为 project-relative POSIX；每个 `record` 子命令在 `--json` 下只输出一个 envelope

- [x] C8 父级确定性操作的记录生命周期与校验
  - Verifies: `elements/deterministic-operations.md` / Section "管理统一确认记录生命周期"
  - Test action: reuse
  - Command: `pnpm vitest run test/commands/record.test.ts test/commands/record-json.test.ts`
  - Expect: 与 C1、C3、C6 相同测试通过

- [x] C9 Record JSON Contract 替代 Framing JSON Contract
  - Verifies: `elements/deterministic-operations.md` / REMOVED Section "提供稳定 Framing JSON Contract"
  - Test action: one-time
  - Command: `rg -n "xirang framing|'framing'" src/commands src/cli src/core/completions && pnpm build && pnpm test`
  - Expect: rg 无匹配；改名后全量测试通过（record-workflow 与 Candidate 测试改用 `xirang record` 与 `record-source.md`，consume 语义尚未加门禁）

- [x] C40 记录身份稳定与最新状态
  - Verifies: `elements/confirmed-design-record.md` / Section "保持稳定身份与最新状态"
  - Test action: modify
  - Command: `pnpm vitest run test/core/record/workspace.test.ts`
  - Expect: rename 后 explorationId 与未变更条目、结构对象的 identity 不变；修订只保留最新内容

- [x] C41 基准快照纳入结构对象
  - Verifies: `elements/confirmed-design-record.md` / Section "保存相关 Semantic Model 基准快照"
  - Test action: modify
  - Command: `pnpm vitest run test/core/record/baseline.test.ts test/core/record/baseline.property.test.ts`
  - Expect: 结构部分对象与显式关联 identity 进入基准；其相关模型变化被报告为 drift，无关变化不报告；缺失模型与损坏模型区分

- [x] C42 父级路径隔离
  - Verifies: `elements/deterministic-operations.md` / Section "隔离受控文件路径"
  - Test action: reuse
  - Command: `pnpm vitest run test/core/record test/integration/windows-definition-ci.test.ts`
  - Expect: 与 C7 相同测试通过

### Task 2: 覆盖结果记录与门禁化交接

**Goal**: 实现 `xirang record coverage` 与带覆盖、指纹、结构比对门禁的 `consume`，并让 Candidate 校验、digest 与 history 纳入覆盖结果。

**Files**:
- Create: `src/core/record/coverage.ts`
- Modify: `src/core/record/consume.ts`
- Modify: `src/core/record/paths.ts`
- Modify: `src/commands/record.ts`
- Modify: `src/core/completions/positional-types.ts`
- Modify: `src/core/candidate/validator.ts`
- Modify: `src/core/candidate/history.ts`
- Modify: `src/core/candidate/promotion.ts`
- Test: `test/core/record/`
- Test: `test/commands/record.test.ts`
- Test: `test/commands/candidate-validate.test.ts`
- Test: `test/commands/candidate-promote.test.ts`
- Test: `test/core/candidate-history.test.ts`
- Test: `test/integration/record-workflow.test.ts`

**Sections**:
- 按 `elements/design-record-operations.md` "记录覆盖检查结果" 与 design D5 实现 coverage 输入校验（每条 normative 有结果、无未知条目、每条至少一个细节、无 uncovered、位置在 Expected Semantic Model 或 Candidate 中存在）；全部通过才写 `record-coverage.json`（结果 + sourceVersion + targetFingerprint）。
- 按 design D5 计算 targetFingerprint：对 Change 的 Expected Semantic Model 或 Candidate 四分区模型取语义指纹；Plan 文件不参与。
- 按 "门禁化交接确认来源" 在 consume 中依次校验 sourceVersion、覆盖结果存在且未过期（`COVERAGE_MISSING` / `COVERAGE_STALE`）、结构逐字段比对（`STRUCTURE_MISMATCH`），再写快照、校验、删除活动记录；保留同字节恢复与冲突停止。
- 按 `elements/candidate-commands.md` 让 Candidate 校验接受并把 `record-source.md`、`record-coverage.json` 纳入 reviewDigest，promotion 将二者写入 history。

#### Checks

- [x] C10 覆盖结果缺项、零细节、未覆盖或位置不存在时被拒绝
  - Verifies: `elements/design-record-operations.md` / Section "记录覆盖检查结果"
  - Test action: add
  - Command: `pnpm vitest run test/core/record test/commands/record.test.ts`
  - Expect: 缺一条 normative、未知条目、某条零细节、某细节 uncovered、某位置指向不存在的 Section 或 Acceptance Case，各自返回 invalid 与逐项诊断且不写 `record-coverage.json`；全部有效时写入并含 sourceVersion 与 targetFingerprint；指向未改动既有 Section 的 no-op 位置被接受；Candidate 目标按四分区解析

- [x] C11 consume 要求有效覆盖与结构一致
  - Verifies: `elements/design-record-operations.md` / Section "门禁化交接确认来源"
  - Test action: add
  - Command: `pnpm vitest run test/core/record test/integration/record-workflow.test.ts`
  - Expect: 无覆盖结果返回 COVERAGE_MISSING；写覆盖后修改 Delta 返回 COVERAGE_STALE，修改 `tasks.md` 不使其过期；记录 parent 为 X 而目标为 Y 返回 STRUCTURE_MISMATCH 并列出字段；`removed: true` 对象仍存在时被拒绝；任一失败保留活动记录与目标；同字节快照可恢复

- [x] C12 父级确定性交接门禁
  - Verifies: `elements/deterministic-operations.md` / Section "确定性交接确认来源"
  - Test action: reuse
  - Command: `pnpm vitest run test/integration/record-workflow.test.ts`
  - Expect: 与 C11 相同测试通过

- [x] C13 父级记录校验报告结构解析
  - Verifies: `elements/deterministic-operations.md` / Section "返回记录校验与上下文变化"
  - Test action: reuse
  - Command: `pnpm vitest run test/core/record`
  - Expect: 与 C3 相同测试通过

- [x] C14 Candidate 校验与 digest 纳入覆盖结果
  - Verifies: `elements/candidate-commands.md` / Section "Candidate validation SHALL 确定性且只读"
  - Test action: modify
  - Command: `pnpm vitest run test/commands/candidate-validate.test.ts`
  - Expect: 含 `record-source.md` 与 `record-coverage.json` 的 Candidate 校验通过；改动任一文件一个字节使 reviewDigest 改变；旧 `framing-source.md` 被报告为意外文件

- [x] C15 promotion 将来源与覆盖结果写入 history
  - Verifies: `elements/candidate-commands.md` / Section "Candidate promotion SHALL 保留 history 并原子替换 formal source"
  - Test action: modify
  - Command: `pnpm vitest run test/commands/candidate-promote.test.ts test/core/candidate-history.test.ts`
  - Expect: history 条目含两文件精确字节；formal 分区不含二者

- [x] C16 来源与覆盖结果只作为形成历史
  - Verifies: `elements/confirmed-design-record.md` / Section "仅作为形成来源与历史记录"
  - Test action: add
  - Command: `pnpm vitest run test/integration/record-workflow.test.ts`
  - Expect: consume 后 Change 目录含 `record-source.md` 与 `record-coverage.json`，`xirang validate --change` 与 Expected Semantic Model 不解析二者

### Task 3: Design Record 协议与受管生成面

**Goal**: 改写共享 reference 与 explore、propose、build 模板为 Design Record 协议，清理旧 reference，重刷生成面。

**Files**:
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/build.ts`
- Modify: `src/core/templates/sync-engine.ts`
- Delete: `test/core/templates/definition-framing-reference.test.ts`
- Create: `test/core/templates/design-record-reference.test.ts`
- Modify: `test/core/templates/explore-template.test.ts`
- Modify: `test/core/templates/propose-template.test.ts`
- Modify: `test/core/templates/build.test.ts`
- Modify: `test/core/templates/sync-engine.test.ts`
- Modify: `.pi/skills/`
- Modify: `.xirang/references/`

**Sections**:
- 按 `elements/design-record.md` 与 design D6 重写 reference（源在 `explore.ts`，路径 `references/design-record.md`）：确认即记录与只报告变更、条目写入标准（例子原样、结构进 structure）、依赖一致、记录决策三态、原子细节覆盖与写作规则、`record coverage` → `record consume` 顺序；删除“完整 payload / 单独持久化授权 / 先 show 全文组合 replacement”规则。
- 按 `elements/explore.md`、`explore-role.md`、`explore-brainstorming.md` 改写 explore 模板：阶段表、Hard Rules、只读例外改为确认即经 `xirang record` 记录。
- 按 `elements/propose.md`、`propose-role.md`、`propose-workflow.md`、`post-propose-validation.md` 改写 propose 模板：阶段表允许 `record coverage` 与 `record consume`，写作规则，原子细节覆盖经 CLI 记录后再 consume，覆盖后改 Delta 须重做。
- 按 `elements/semantic-model-build.md` 改写 build 模板：共用确认即记录与写作规则，`record coverage --candidate` 与 `record consume --candidate`。
- 按 `elements/project-tooling-configuration.md` 将 `xirang-definition-framing.md` 加入 `STALE_SHARED_REFERENCE_FILES`，运行 `node bin/xirang.js update` 重刷生成面，不手改生成文件。

#### Checks

- [x] C17 reference 锁定确认即记录与只报告变更
  - Verifies: `elements/design-record.md` / Section "确认即记录"
  - Test action: add
  - Command: `pnpm vitest run test/core/templates/design-record-reference.test.ts`
  - Expect: reference 要求用户确认后立即记录、不另行请求授权、写入后只报告变更与概况并标出修改已确认内容；不含要求展示完整 payload 或单独持久化确认的规则

- [x] C18 reference 锁定条目写入标准
  - Verifies: `elements/design-record.md` / Section "条目写入标准"
  - Test action: add
  - Command: `pnpm vitest run test/core/templates/design-record-reference.test.ts`
  - Expect: reference 含“脱离会话能否写出 Contract 与 Acceptance Case”检验、例子原样记录、组件结构写入 structure

- [x] C19 reference 与 propose/build 模板锁定原子细节覆盖门禁
  - Verifies: `elements/design-record.md` / Section "按原子细节检查覆盖"
  - Test action: modify
  - Command: `pnpm vitest run test/core/templates/design-record-reference.test.ts test/core/templates/propose-template.test.ts test/core/templates/build.test.ts`
  - Expect: 三处均要求按原子细节给出位置并经 `xirang record coverage` 记录后才 `xirang record consume`，未覆盖或笼统描述阻塞交接

- [x] C20 reference 与 propose 模板锁定写作规则
  - Verifies: `elements/design-record.md` / Section "按写作规则编译细节"
  - Test action: modify
  - Command: `pnpm vitest run test/core/templates/design-record-reference.test.ts test/core/templates/propose-template.test.ts`
  - Expect: 要求确认的例子写成 Acceptance Case 或具体情形、数值时序例外不泛化、结构对象编成 Delta 或 no-op

- [x] C21 reference 保留依赖一致与记录决策三态
  - Verifies: `elements/design-record.md` / Section "在交接前落定记录决策"
  - Test action: modify
  - Command: `pnpm vitest run test/core/templates/design-record-reference.test.ts`
  - Expect: 记录、豁免、无 normative 声明三态与“三者皆缺即阻塞”仍被锁定；依赖记录修订后需重查的规则仍在

- [x] C22 explore 模板按确认即记录使用 Design Record
  - Verifies: `elements/explore.md` / Section "按确认即记录使用 Design Record"
  - Test action: modify
  - Command: `pnpm vitest run test/core/templates/explore-template.test.ts`
  - Expect: explore skill 的阶段表与 Hard Rules 只允许经 `xirang record` 记录用户确认的内容，确认即授权记录，其他写入仍禁止；触发条件加载 Design Record reference

- [x] C23 explore 不再引用 Definition Framing
  - Verifies: `elements/explore.md` / REMOVED Section "支持可选 Definition Framing"
  - Test action: one-time
  - Command: `rg -n -i "definition framing|xirang framing" src/core/templates/workflows/explore.ts .pi/skills/xirang-explore`
  - Expect: 无匹配

- [x] C24 explore 角色与主代理只读例外
  - Verifies: `elements/explore-role.md` / Section "保持只读工作边界"
  - Test action: modify
  - Command: `pnpm vitest run test/core/templates/explore-template.test.ts`
  - Expect: 与 C22 相同测试断言唯一写入例外为确认即经 CLI 记录

- [x] C25 explore 主代理只读边界改用 Design Record
  - Verifies: `elements/explore-brainstorming.md` / Section "Explore 主代理保持只读"
  - Test action: reuse
  - Command: `pnpm vitest run test/core/templates/explore-template.test.ts`
  - Expect: 与 C22 相同测试通过

- [x] C26 propose 模板按记录编译并经门禁交接
  - Verifies: `elements/propose.md` / Section "交接已确认设计来源"
  - Test action: modify
  - Command: `pnpm vitest run test/core/templates/propose-template.test.ts`
  - Expect: 顺序为 validation → 原子细节覆盖 → `record coverage` → `record consume`；coverage 被拒时先补 Contract 再重检；Propose 不创建、更新、重命名或丢弃记录

- [x] C27 propose 处理记录时读取 Design Record reference
  - Verifies: `elements/propose.md` / Section "处理已确认设计记录"
  - Test action: modify
  - Command: `pnpm vitest run test/core/templates/propose-template.test.ts`
  - Expect: 入口读取 Design Record reference 并以 `xirang record list` 发现记录；无记录时仍要求已声明的记录决策

- [x] C28 propose 阶段边界允许 coverage 与 consume
  - Verifies: `elements/propose-workflow.md` / Section "Propose 创建完整 change 制品"
  - Test action: modify
  - Command: `pnpm vitest run test/core/templates/propose-template.test.ts`
  - Expect: 阶段表仅允许 `xirang record coverage` 与门禁后的 `xirang record consume` 作为 change 目录外的 CLI 写入

- [x] C29 propose 角色编排覆盖记录后再消费
  - Verifies: `elements/propose-role.md` / Section "编排确认记录消费"
  - Test action: reuse
  - Command: `pnpm vitest run test/core/templates/propose-template.test.ts`
  - Expect: 与 C26 相同测试通过

- [x] C30 计划一致性复核按原子细节
  - Verifies: `elements/post-propose-validation.md` / Section "计划一致性复核"
  - Test action: reuse
  - Command: `pnpm vitest run test/core/templates/propose-template.test.ts`
  - Expect: 与 C19 相同测试通过

- [x] C31 build 模板共用 Design Record 并以 Candidate 为目标
  - Verifies: `elements/semantic-model-build.md` / Section "复用确认记录形成 Candidate"
  - Test action: modify
  - Command: `pnpm vitest run test/core/templates/build.test.ts`
  - Expect: build skill 要求确认即记录、写作规则与原子细节覆盖，使用 `xirang record coverage --candidate` 与 `xirang record consume --candidate`

- [x] C32 build 交接经覆盖门禁
  - Verifies: `elements/semantic-model-build.md` / Section "交接记录后确认精确 Candidate"
  - Test action: reuse
  - Command: `pnpm vitest run test/core/templates/build.test.ts`
  - Expect: 与 C31 相同测试通过

- [x] C33 旧 reference 被清理，新 reference 可达
  - Verifies: `elements/project-tooling-configuration.md` / Section "投影共享 Design Record 协议"
  - Test action: modify
  - Command: `pnpm vitest run test/core/templates/sync-engine.test.ts && pnpm build && node bin/xirang.js update && test ! -e .xirang/references/xirang-definition-framing.md && test -e .xirang/references/xirang-design-record.md`
  - Expect: sync 测试断言旧受管 reference 被删除且用户文件保留；本仓库重刷后旧文件不存在、新文件存在，三个 skill 引用新 reference

- [x] C34 旧投影 Section 不再存在
  - Verifies: `elements/project-tooling-configuration.md` / REMOVED Section "投影共享 Definition Framing 协议"
  - Test action: one-time
  - Command: `rg -n "xirang-definition-framing" src .pi .xirang/references`
  - Expect: 除 `STALE_SHARED_REFERENCE_FILES` 条目外无匹配

- [x] C35 Element Definition 部分确认即可记录
  - Verifies: `elements/explore.md` / Section "澄清 Element Definition 影响"
  - Test action: reuse
  - Command: `pnpm vitest run test/core/templates/explore-template.test.ts test/core/templates/design-record-reference.test.ts`
  - Expect: 与 C18、C22 相同测试通过

- [x] C36 捕获边界与拆分指导中的记录例外
  - Verifies: `elements/explore-brainstorming.md` / Section "仅在结构设计中应用项目拆分指导"
  - Test action: one-time
  - Command: `rg -n -i "definition framing" src/core/templates .pi/skills`
  - Expect: 无匹配

- [x] C43 reference 保留依赖设计一致规则
  - Verifies: `elements/design-record.md` / Section "保持依赖设计一致"
  - Test action: modify
  - Command: `pnpm vitest run test/core/templates/design-record-reference.test.ts`
  - Expect: 记录变化后要求重载并重查受影响的设计、Summary 与覆盖结论

- [x] C44 捕获边界中的记录只是中间依据
  - Verifies: `elements/explore-brainstorming.md` / Section "Explore 捕获边界保持 Contract 为可观察行为"
  - Test action: modify
  - Command: `pnpm vitest run test/core/templates/explore-template.test.ts`
  - Expect: explore skill 声明确认内容经 CLI 进入记录只是中间依据，最终 capture target 仍为 Contract、Delta 或 scaffolding，不授权直接写入

### Task 4: 项目定义同步与残留清理

**Goal**: 同步 AGENTS.md 项目定义，确认除历史外无旧名残留，全量构建与测试通过。

**Files**:
- Modify: `AGENTS.md`

**Sections**:
- 按 `elements/design-record.md` 与 `elements/confirmed-design-record.md` 更新 AGENTS.md 层级与正文：Definition Framing → Design Record，Change Structural Definition → 已确认设计记录（两部分格式），Definition Framing Operations → Design Record Operations；移除“因果定义、identity 与边界澄清、单维度分解和按 BFS 顺序确认同层结构”及确认需单独持久化授权的描述。
- 残留扫描范围为 `src`、`test`、`.pi/skills`、`.xirang/references`、`AGENTS.md`；`.xirang/changes/archive/` 与本 Change 的 `framing-source.md` 为历史，不改写。

#### Checks

- [x] C37 AGENTS.md 使用 Design Record 描述记录
  - Verifies: `elements/design-record.md` / Section "条目写入标准"
  - Test action: one-time
  - Command: `rg -n "Definition Framing|Change Structural Definition|因果定义|BFS 顺序" AGENTS.md`
  - Expect: 无匹配；`rg -n "Design Record" AGENTS.md` 有匹配

- [x] C38 旧名残留为零且全量通过
  - Verifies: `elements/confirmed-design-record.md` / Section "以条目与结构两部分表达确认内容"
  - Test action: one-time
  - Command: `rg -n -i "framing|ChangeStructuralDefinition|change-structural-definition|framing-source" src test .pi/skills .xirang/references AGENTS.md | rg -v "STALE_SHARED_REFERENCE_FILES|xirang-definition-framing\.md"; pnpm build && pnpm lint && pnpm test && xirang arch validate --change design-record --json`
  - Expect: rg 仅剩 `STALE_SHARED_REFERENCE_FILES` 中的旧文件名；build、lint、test 通过；arch validate success 为 true

### Task 5: Propose 覆盖检查消融实验

**Goal**: 在其他任务全部完成后，按 design D7 比较当前 Agent 与 subagent 执行覆盖检查的效果，产出决定是否引入 subagent 的证据。

**Files**:
- Create: `.xirang/changes/design-record/ablation-report.md`

**Sections**:
- 在 goFate 仓库新建 worktree，自 goFate 提交 `0bb32c5`（`jev-situation-recall` 刚完成 Propose 的制品）出发，移除 Delta 与 `framing-source.md`；在该 worktree 内用本仓库构建的 `bin/xirang.js update` 重刷生成面，使 propose skill 与 CLI 为新版本；由原条目生成 v3 活动记录并按新写入标准补入已确认的 ABC/ACD/AB 例子；不改 goFate 主工作树。
- 标准答案 = 已知丢失项（先经用户确认）+ 植入缺陷（K=32 改 16、删除 `no_event` 项、世界切换改为当前轮生效），植入发生在 Delta 写完、覆盖检查前。
- 两臂均用 `bigmodel/glm-5.3-flash`、同一份检查说明与 design D5 输出格式：当前 Agent 在新会话运行 `xirang-propose` 至覆盖检查；subagent 为 fresh context，只给 explorationId、changeName、changeDir、projectRoot；每臂 3 次。
- 报告记录每次运行的检出数/缺陷总数、错判通过、误报、耗时与 token，以及按“subagent 稳定检出当前 Agent 漏掉的缺陷则建议引入”得出的建议；不在本 Change 内实现 subagent 变体。

#### Checks

- [x] C39 消融报告包含两臂各 3 次的指标与建议
  - Verifies: `elements/design-record.md` / Section "按原子细节检查覆盖"
  - Test action: one-time
  - Evidence: `.xirang/changes/design-record/ablation-report.md`
  - Expect: 报告列出标准答案（已知丢失项经用户确认）、两臂共 6 次运行的检出、错判通过、误报、耗时与 token，以及引入与否的建议与用户决定；当前 Agent 臂完成真实 Propose 与 `record coverage`（被门禁拒绝，未到 `consume`）

### Task 6: 覆盖结果位置摘录（quote）

**Goal**: 按消融实验后的用户决定，为 Element 位置的覆盖细节增加 `quote`，由 CLI 校验摘录确实出现在该位置。

**Files**:
- Modify: `src/core/record/coverage.ts`
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/build.ts`
- Test: `test/core/record/coverage.test.ts`
- Test: `test/core/record/consume.test.ts`
- Test: `test/integration/record-workflow.test.ts`
- Test: `test/core/templates/design-record-reference.test.ts`
- Test: `test/core/templates/propose-template.test.ts`
- Test: `test/core/templates/build.test.ts`
- Modify: `.pi/skills/`
- Modify: `.xirang/references/`

**Sections**:
- 按 `elements/design-record-operations.md` "记录覆盖检查结果" 与 design D5：Element 位置细节必须带非空 `quote`，忽略空白与 Markdown 强调后在位置文本中做子串校验；其他位置不带 `quote`。
- 按 `elements/design-record.md` "按原子细节检查覆盖" 更新 reference 与 Propose / Build 模板：摘录取自当前目标文件，泛化摘录不含例子具体输入与结果时例子计为未覆盖；重刷生成面。

#### Checks

- [x] C45 缺少或错位的摘录被拒绝
  - Verifies: `elements/design-record-operations.md` / Section "记录覆盖检查结果"
  - Test action: modify
  - Command: `pnpm vitest run test/core/record/coverage.test.ts test/core/record/consume.test.ts test/integration/record-workflow.test.ts`
  - Expect: Element 位置缺 `quote` 返回 INVALID_COVERAGE_INPUT；摘录不在该位置或取自其他位置返回 COVERAGE_QUOTE_NOT_FOUND；仅空白不同的摘录被接受；非 Element 位置带 `quote` 被拒绝

- [x] C46 协议要求摘录取自当前文件并暴露泛化落位
  - Verifies: `elements/design-record.md` / Section "按原子细节检查覆盖"
  - Test action: modify
  - Command: `pnpm vitest run test/core/templates/design-record-reference.test.ts test/core/templates/propose-template.test.ts test/core/templates/build.test.ts`
  - Expect: reference 要求摘录取自当前目标文件、不凭记忆，泛化摘录使例子计为未覆盖，列出缺失或错位摘录的拒绝；Propose 与 Build 模板要求附带摘录

### Task 1: Relation Registry 与语义验证

**Goal**: 建立六种 relation 的单一权威，并以全图 validator 执行 endpoint、ownership、note 与 cycle 合同。

**Files**:
- Create: `src/core/relations/`
- Modify: `src/utils/opsx-utils.ts`
- Test: `test/core/relations/`
- Test: `test/utils/opsx-utils.test.ts`

**Requirements**:
- Registry 完整定义六种 canonical relation 及其 authoring metadata
- Zod relation token 与 endpoint validator 从 Registry 派生
- 每个 capability 恰有一条 `belongs_to`
- `precedes` cycle、dangling relation 与重复边可诊断
- `note` policy 与长度限制生效

#### Checks

- [x] C1 验证 Registry 投影合同
  - Verifies: `specs/opsx-semantic-relations/spec.md` / Requirement "RelationDefinitionRegistry 单一权威" / Scenario "Registry 投影保持一致"
  - Command: `pnpm vitest run test/core/relations`
  - Expect: 六种定义、派生 token 与 renderer metadata 的参数化测试通过

- [x] C2 验证 endpoint、ownership 与 note
  - Verifies: `specs/opsx-semantic-relations/spec.md` / Requirement "Relation endpoint 与 note 合同" / Scenario "Ownership 缺失或重复" / Scenario "Note policy 生效"
  - Command: `pnpm vitest run test/core/relations test/utils/opsx-utils.test.ts`
  - Expect: 非法 endpoint、缺失/重复 ownership 与非法 note 均被拒绝

- [x] C3 验证 relation graph 约束
  - Verifies: `specs/opsx-semantic-relations/spec.md` / Requirement "Relation 全图语义验证" / Scenario "Precedes cycle 被拒绝" / Scenario "不同机制可连接同一 endpoint pair"
  - Command: `pnpm vitest run test/core/relations test/utils/opsx-utils.test.ts`
  - Expect: `precedes` cycle 与完全重复边失败，不同 relation type 的同 endpoint pair 通过

### Task 2: OPSX v2 两文件 runtime

**Goal**: 将 OPSX read/write/init/sync 数据模型切换为 v2 两文件，并彻底删除 code-map runtime surface。

**Files**:
- Modify: `src/utils/opsx-utils.ts`
- Modify: `src/core/init.ts`
- Modify: `src/core/change-sync.ts`
- Modify: `src/core/validation/validator.ts`
- Delete: `openspec/project.opsx.code-map.yaml`
- Test: `test/utils/opsx-utils*.test.ts`
- Test: `test/core/init.test.ts`
- Test: `test/core/change-sync*.test.ts`

**Requirements**:
- v2 reader/writer 仅处理 project 与 relations
- v1 输入明确失败并提供重建帮助
- init 只生成两个 v2 skeleton
- sync 和 validation 不再处理 code-map
- 删除全部 code-map schema、bundle 字段与 integrity API

#### Checks

- [x] C1 验证 v2 两文件模型与 v1 错误
  - Verifies: `specs/opsx-semantic-relations/spec.md` / Requirement "OPSX v2 文件模型" / Scenario "读取合法 v2 模型" / Scenario "v1 模型明确失败"
  - Command: `pnpm vitest run test/utils/opsx-utils*.test.ts`
  - Expect: v2 两文件读取通过，v1 返回 authoring help 与重建指引

- [x] C2 验证 init 两文件骨架
  - Verifies: `specs/init-opsx-skeleton/spec.md` / Requirement "OPSX Skeleton Generation on Init" / Scenario "First-time init generates two OPSX v2 skeletons" / Scenario "Extend mode preserves existing OPSX files" / Scenario "Skeleton files use safe cross-platform paths"
  - Command: `pnpm vitest run test/core/init.test.ts`
  - Expect: macOS/Linux/Windows 安全路径下仅创建两个 v2 文件且 extend 不覆盖

- [x] C3 验证 code-map 能力已删除
  - Verifies: `specs/cli-opsx-query/spec.md` / REMOVED Requirement "Code-map 数据结构"
  - Command: `! rg 'project\.opsx\.code-map|code_map|codeMap|CodeMapEntry|validateCodeMapIntegrity' src --glob '*.ts'`
  - Expect: active runtime source 中无 code-map 能力残留

### Task 3: Registry 生成模板与 reference

**Goal**: 从 Registry 确定性生成 bootstrap/delta 就地说明、canonical reference 与 workflow summary，并检测 tracked output 漂移。

**Files**:
- Modify: `src/core/relations/renderers.ts`
- Modify: `schemas/bootstrap/templates/domain-map.md`
- Modify: `schemas/spec-driven/schema.yaml`
- Modify: `schemas/spec-driven/templates/opsx-delta.yaml`
- Create: `openspec/references/openspec-relation-authoring.md`
- Modify: `src/core/templates/fragments/opsx-fragments.ts`
- Test: `test/core/relations/`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`

**Requirements**:
- Tracked templates/reference 由显式 renderer 与文件名列表生成
- domain-map 与 opsx-delta 提供紧凑 relation 编辑帮助
- canonical reference 提供完整定义、选择树与示例
- workflow summary 不重复独立 taxonomy
- consistency test 阻止手工漂移

#### Checks

- [x] C1 验证 opsx-delta template 投影
  - Verifies: `specs/opsx-delta-artifact/spec.md` / Requirement "opsx-delta 模板文件提供 YAML 骨架" / Scenario "模板引导精确 relation" / Scenario "Tracked template 与 Registry 一致"
  - Command: `pnpm vitest run test/core/relations test/core/artifact-graph/instruction-loader.test.ts`
  - Expect: template 可解析、仅含六种 relation，且 tracked content 与 renderer 字节一致

- [x] C2 验证所有生成 surface 无旧 vocabulary
  - Verifies: `specs/opsx-semantic-relations/spec.md` / Requirement "RelationDefinitionRegistry 单一权威" / Scenario "生成制品漂移被拒绝"
  - Command: `! rg '\bcontains\b|\bdepends_on\b|\brelates_to\b|\bimplemented_by\b|\bverified_by\b' schemas openspec/references src/core/templates --glob '!**/archive/**'`
  - Expect: active authoring surfaces 不再暴露旧 relation token

### Task 4: Authoring help 与跨平台 CLI

**Goal**: 新增文件级 authoring help 的文本/JSON projection，同时保持 Commander command help 与 completion 行为。

**Files**:
- Create: `src/commands/help.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/commands/completion.ts`
- Test: `test/commands/help.test.ts`
- Test: `test/cli-e2e/basic.test.ts`
- Test: `test/cli-e2e/completion*.test.ts`

**Requirements**:
- 注册三个显式 OPSX file topics
- relation help 复用 Registry 完整 projection
- JSON 输出稳定可解析
- 非 authoring help 委托现有 Commander lookup
- topic lookup 在 Windows 与 POSIX 一致

#### Checks

- [x] C1 验证 authoring topic 与 relation help
  - Verifies: `specs/cli-authoring-help/spec.md` / Requirement "文件级 authoring help" / Scenario "列出 authoring topics" / Requirement "Relation authoring help" / Scenario "Relation help 完整"
  - Command: `pnpm vitest run test/commands/help.test.ts test/cli-e2e/basic.test.ts`
  - Expect: 三个 topic、六种 relation、选择规则与 validation commands 均可见

- [x] C2 验证 JSON 与未知 topic
  - Verifies: `specs/cli-authoring-help/spec.md` / Requirement "Authoring help JSON 输出" / Scenario "JSON 可供 agent 消费" / Requirement "文件级 authoring help" / Scenario "未知文件返回可操作错误"
  - Command: `pnpm vitest run test/commands/help.test.ts`
  - Expect: JSON 合同完整，未知文件非零退出并列出合法 topics

- [x] C3 验证 Commander 与 Windows 兼容
  - Verifies: `specs/cli-authoring-help/spec.md` / Requirement "Commander help 兼容" / Scenario "既有 command help 保持可用" / Scenario "Windows 文件 topic 解析一致"
  - Command: `pnpm vitest run test/commands/help.test.ts test/cli-e2e/basic.test.ts test/cli-e2e/completion*.test.ts`
  - Expect: 既有 help 与 completion 不回退，Windows topic 使用显式 lookup

### Task 5: OPSX query、delta 与 validate

**Goal**: 让 query、delta merge 与 dry-run validation 完整消费 v2 relation 语义并移除 code-map surface。

**Files**:
- Modify: `src/commands/opsx.ts`
- Modify: `src/utils/opsx-utils.ts`
- Modify: `src/core/validation/validator.ts`
- Test: `test/commands/opsx.test.ts`
- Test: `test/cli-e2e/opsx-query.test.ts`
- Test: `test/commands/validate.test.ts`

**Requirements**:
- query 输出 node/relations 或 v2 subgraph，不含 codeMap
- `--code-map` 被 Commander 拒绝
- depth output 保留 relation 方向与 type
- delta merge 后执行 semantic validator
- dry-run 不再执行 code-map validation

#### Checks

- [x] C1 验证 query v2 output
  - Verifies: `specs/cli-opsx-query/spec.md` / Requirement "OPSX query 命令基本结构" / Scenario "查询存在节点" / Requirement "批量节点子图输出" / Scenario "批量查询" / Requirement "depth 深度展开" / Scenario "Depth output 保留方向"
  - Command: `pnpm vitest run test/commands/opsx.test.ts test/cli-e2e/opsx-query.test.ts`
  - Expect: 单点和子图 output 保留有向 relation 且无 codeMap

- [x] C2 验证 code-map option 删除
  - Verifies: `specs/cli-opsx-query/spec.md` / Requirement "过滤参数支持" / Scenario "Code-map option 被拒绝"
  - Command: `pnpm vitest run test/cli-e2e/opsx-query.test.ts`
  - Expect: `--code-map` 返回未知 option 非零退出

- [x] C3 验证 delta semantic dry-run
  - Verifies: `specs/opsx-delta-merge/spec.md` / Requirement "MODIFIED section 执行 shallow merge" / Scenario "Delta relation 违反 endpoint contract" / Scenario "Removed node 留下 relation" / Scenario "Merge 不处理 code-map"
  - Command: `pnpm vitest run test/commands/validate.test.ts test/utils/opsx-utils*.test.ts`
  - Expect: 非法 relation 与 dangling edge 失败，合法 merge 不产生 code-map

- [x] C4 验证 dry-run code-map 独立
  - Verifies: `specs/validate-opsx-dry-run/spec.md` / Requirement "Validator 支持 OPSX dry-run merge 校验" / Scenario "Code-map 缺失不影响校验" / Scenario "旧 relation token 被拒绝"
  - Command: `pnpm vitest run test/commands/validate.test.ts`
  - Expect: v2 两文件通过，旧 token 失败且无 Code-map integrity issue

### Task 6: Bootstrap v2 与完整 refresh

**Goal**: 删除 bootstrap code-map 与增量继承路径，从当前证据完整生成、review 并 promote v2 两文件 model。

**Files**:
- Modify: `src/utils/bootstrap-utils.ts`
- Modify: `src/commands/bootstrap.ts`
- Modify: `src/core/templates/workflows/bootstrap-opsx.ts`
- Modify: `.pi/skills/openspec-bootstrap-opsx/SKILL.md`
- Modify: `schemas/bootstrap/`
- Test: `test/utils/bootstrap-utils*.test.ts`
- Test: `test/utils/bootstrap-refresh-utils.test.ts`
- Test: `test/cli-e2e/bootstrap-*.test.ts`

**Requirements**:
- raw bootstrap candidate 只含 project/relations
- map phase 使用 Registry relation contract 与 review gaps
- refresh 从当前 evidence 完整重建
-旧 formal OPSX 仅用于 diff，promote 整体替换
-工作区 history、跨平台路径与幂等性保持

#### Checks

- [x] C1 验证 bootstrap relation authoring 与 review
  - Verifies: `specs/bootstrap/spec.md` / Requirement "Bootstrap relation authoring contract" / Scenario "代码依赖只形成候选" / Scenario "Review 检查 relation 质量"
  - Command: `pnpm vitest run test/utils/bootstrap-utils*.test.ts test/cli-e2e/bootstrap-phase1.test.ts`
  - Expect: import/call 不被机械升级，不确定 relation 进入 review gap

- [x] C2 验证 v2 contract surfaces
  - Verifies: `specs/bootstrap/spec.md` / Requirement "Bootstrap contract surfaces SHALL stay consistent" / Scenario "Contract surfaces agree on v2 output" / Scenario "Contract surfaces agree on relation vocabulary" / Scenario "Contract surfaces agree on refresh semantics"
  - Command: `pnpm vitest run test/core/templates/bootstrap-opsx.test.ts test/commands/bootstrap*.test.ts`
  - Expect: schema、CLI、skill 与 docs 仅描述 v2 两文件和完整 refresh

- [x] C3 验证 refresh 当前证据与 fallback
  - Verifies: `specs/bootstrap-refresh-mode/spec.md` / Requirement "Refresh scan SHALL use a git anchor when available" / Scenario "Refresh 完整重建 candidate" / Scenario "CodeGraph 不可用时正常降级" / Scenario "Windows 全量扫描路径安全"
  - Command: `pnpm vitest run test/utils/bootstrap-refresh-utils.test.ts test/cli-e2e/bootstrap-refresh.test.ts`
  - Expect: 无 code-map/git-anchor 推导，实时证据工具 fallback 正常且 Windows 路径安全

- [x] C4 验证 review diff、整体替换与幂等
  - Verifies: `specs/bootstrap-refresh-mode/spec.md` / Requirement "Refresh review and promote SHALL be delta-first" / Scenario "Review 仅将旧 OPSX 用作 diff" / Scenario "Promote 整体替换两文件" / Scenario "重复 refresh 幂等"
  - Command: `pnpm vitest run test/utils/bootstrap-refresh-utils.test.ts test/cli-e2e/bootstrap-refresh.test.ts`
  - Expect: candidate 不继承旧边，promote 替换两文件，重复输出一致

### Task 7: Sweeper 语义影响报告

**Goal**: 将 impact sweeper 改为 relation-path、spec-contract 与代码证据驱动的语义影响分析器。

**Files**:
- Modify: `src/core/templates/workflows/impact-sweeper.ts`
- Modify: `src/types/sweeper.ts`
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/ai/terminology-decision.ts`
- Test: `test/core/templates/impact-sweeper-template.test.ts`
- Test: `test/core/templates/explore-template.test.ts`
- Test: `test/core/ai/terminology-decision.test.ts`

**Requirements**:
- findings 使用六类 semantic impact fields
-每条 finding 包含 relation path、reason 与 evidence
-CodeGraph 是可选加速器，失败后回退 ACE/`rg`/`read`
- OPSX/code conflict 输出 architectureDrift
-Explore 压缩消费报告并保持一次一问

#### Checks

- [x] C1 验证 sweeper evidence protocol
  - Verifies: `specs/ai-impact-sweeper/spec.md` / Requirement "Evidence Protocol 使用 CLI 查询接口" / Scenario "OPSX relation path 优先" / Scenario "CodeGraph 可选加速" / Scenario "CodeGraph 不可用时降级"
  - Command: `pnpm vitest run test/core/templates/impact-sweeper-template.test.ts`
  - Expect: prompt 先用 OPSX/spec，CodeGraph optional，fallback 明确且不读取 SQLite/code-map

- [x] C2 验证 semantic report contract
  - Verifies: `specs/ai-workflow-templates/spec.md` / Requirement "Impact sweeper report contract" / Scenario "Sweeper writes semantic impact report" / Scenario "不确定性显式输出"
  - Command: `pnpm vitest run test/core/templates/impact-sweeper-template.test.ts test/core/templates/explore-template.test.ts`
  - Expect: report 使用新分类，finding 有 relation path，unknown 不被静默升级

- [x] C3 验证 drift 与 Explore 消费
  - Verifies: `specs/ai-workflow-templates/spec.md` / Requirement "Impact sweeper evidence collection" / Scenario "OPSX 与代码冲突"
  - Command: `pnpm vitest run test/core/templates/explore-template.test.ts test/core/ai/terminology-decision.test.ts`
  - Expect: architectureDrift 保留双侧 evidence，Explore 不泄露原始 JSON 且保持一次一问

### Task 8: Workflow、snack 与 active surface 迁移

**Goal**: 将所有 active workflow、docs、specs 与本项目 formal OPSX 迁移到 v2，清理 code-map 与旧 relation vocabulary。

**Files**:
- Modify: `src/core/templates/workflows/`
- Modify: `src/core/templates/fragments/opsx-fragments.ts`
- Modify: `.pi/skills/openspec-explore/SKILL.md`
- Modify: `.pi/skills/openspec-propose/SKILL.md`
- Modify: `.pi/skills/openspec-snack/SKILL.md`
- Modify: `docs/`
- Modify: `openspec/references/openspec-apply-step-1-preparation.md`
- Modify: `openspec/references/openspec-evidence-protocol.md`
- Modify: `openspec/references/openspec-report-schema.md`
- Modify: `openspec/references/openspec-self-read-protocol.md`
- Modify: `openspec/specs/`
- Modify: `openspec/project.opsx.yaml`
- Modify: `openspec/project.opsx.relations.yaml`
- Test: `test/core/templates/`
- Test: `test/cli-e2e/`

**Requirements**:
- shared context 分离 OPSX 语义图与实时代码证据
-snack 使用 CodeGraph optional 与 ACE/`rg` fallback
-active runtime/docs/templates 不再声明 code-map 或旧 relation；main specs 由 change-local delta 在 archive 时链接
-本项目 formal OPSX 逐边人工分类为六种 relation
-archive history 保持不变

#### Checks

- [x] C1 验证 shared context v2
  - Verifies: `specs/opsx-shared-context/spec.md` / Requirement "统一加载协议" / Scenario "Shared context 使用两文件语义模型" / Scenario "Code evidence 与 OPSX 分层" / Requirement "CLI 点查询互补定位" / Scenario "Query fragment 与 v2 output 一致"
  - Command: `pnpm vitest run test/core/templates`
  - Expect: workflow 只用 v2 OPSX semantic model，并通过实时工具定位代码

- [x] C2 验证 snack mapping fallback
  - Verifies: `specs/snack-skill/spec.md` / Requirement "Code-map 反查" / Scenario "CodeGraph 映射 changed symbols" / Scenario "无 CodeGraph 时回退" / Requirement "Proposal 模板合规生成" / Scenario "先确定 capability 列表再生成 specs"
  - Command: `pnpm vitest run test/core/templates/snack-template.test.ts`
  - Expect: snack 无 code-map，使用 OPSX/spec 与可选 CodeGraph/fallback

- [x] C3 验证 active surface 清洁度
  - Verifies: `specs/opsx-semantic-relations/spec.md` / Requirement "精确 relation vocabulary" / Scenario "旧 relation token 被拒绝"
  - Command: `! rg 'project\.opsx\.code-map|code_map|codeMap|CodeMapEntry|validateCodeMapIntegrity|\bdepends_on\b|\brelates_to\b|\bimplemented_by\b|\bverified_by\b|type:\s*contains\b' src schemas docs openspec/references openspec/project.opsx.yaml openspec/project.opsx.relations.yaml --glob '!openspec/changes/archive/**' && openspec validate opsx-v2-semantic-relations --type change`
  - Expect: active runtime/authoring/docs 无被删除能力，change-local specs 保持 archive-time sync source，archive history 未被改写

### Task 9: 全平台门禁与最终验证

**Goal**: 在 Linux/macOS 与 Windows 合同下验证 OPSX v2、生成一致性和完整 OpenSpec pipeline。

**Files**:
- Modify: `.github/workflows/`
- Modify: `.gitignore`
- Test: `test/`

**Requirements**:
-完整 test、lint、build 通过
-Windows CI 覆盖 init、authoring help、bootstrap/refresh 路径
-Registry generated outputs 一致
-OpenSpec 全量 validation 通过
-不增加 CodeGraph 或其他生产依赖

#### Checks

- [x] C1 运行项目质量门禁
  - Verifies: `specs/opsx-semantic-relations/spec.md` / Requirement "OPSX v2 文件模型" / Scenario "读取合法 v2 模型"
  - Command: `pnpm test && pnpm lint && pnpm build`
  - Expect: 全部测试、lint 与 build 通过

- [x] C2 运行 Windows CI 合同
  - Verifies: `specs/cli-authoring-help/spec.md` / Requirement "Commander help 兼容" / Scenario "Windows 文件 topic 解析一致"
  - Command: `pnpm vitest run test/core/init.test.ts test/commands/help.test.ts test/utils/bootstrap-refresh-utils.test.ts`
  - Evidence: Windows CI 使用同一命令并通过
  - Expect: 路径、topic lookup 与 refresh scan 无平台差异

- [x] C3 运行 OpenSpec 与 CLI smoke validation
  - Verifies: `specs/cli-authoring-help/spec.md` / Requirement "文件级 authoring help" / Scenario "列出 authoring topics"
  - Command: `node bin/openspec.js validate --all && node bin/openspec.js --help && node bin/openspec.js help authoring && node bin/openspec.js help authoring project.opsx.relations.yaml && node bin/openspec.js help authoring opsx-delta.yaml --json`
  - Expect: 全量 validation 与四个 CLI smoke commands 通过

- [x] C4 验证依赖边界
  - Verifies: `specs/ai-impact-sweeper/spec.md` / Requirement "Evidence Protocol 使用 CLI 查询接口" / Scenario "CodeGraph 不可用时降级"
  - Command: `node -e "const p=require('./package.json'); if (p.dependencies?.['@colbymchenry/codegraph'] || p.devDependencies?.['@colbymchenry/codegraph']) process.exit(1)"`
  - Expect: `package.json` 未引入 CodeGraph dependency

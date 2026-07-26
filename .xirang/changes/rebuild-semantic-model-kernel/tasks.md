### Task 1: 定义 IR 类型与 frontmatter 原语

**Goal**: 以 TDD 建立新 IR 类型与 frontmatter 分离/渲染原语，为后续所有任务提供类型基准。

**Files**:
- Create: `src/core/model/types.ts`
- Create: `src/core/model/frontmatter.ts`
- Test: `test/core/model/frontmatter.test.ts`

**Requirements**:
- `EntityType` 覆盖 `element-declaration`、`element-kind`、`relationship-kind`、`authored-view`；`Partition` 覆盖四分区并导出 `PARTITIONS` 常量
- `ModelElement` 合并 Declaration 与 Requirements；`Relationship` 只含 `source`/`kind`/`target`，不含 `description`
- `ElementKind` 使用 `contract` 而非 `contractPolicy`
- frontmatter 分离容忍 CRLF，缺失闭合分隔符时报 `MALFORMED_FRONTMATTER`
- frontmatter 渲染按固定键顺序输出，键顺序由 entity type 决定而非对象属性顺序
- 不含 `fqn`、`children`、`metadata`、`specId`、`elementId` 字段

#### Checks

- [ ] C1 验证 frontmatter 分离与固定键序
  - Verifies: `xirang-contract.md` / 「entity 自声明」/ `entity` 字段自声明
  - Command: `pnpm exec vitest run test/core/model/frontmatter.test.ts`
  - Expect: CRLF 归一、缺失分隔符诊断、键顺序与对象属性插入顺序无关
  - Remediation: 键顺序表须按 entity type 静态声明，不得依赖 `Object.keys` 顺序

---

### Task 2: 实现四分区 parser 与 identity 索引

**Goal**: 以 TDD 实现 `.xirang/model/` 四分区读取，产出 IR 与 `identity → source module` 索引。

**Files**:
- Create: `src/core/model/parser.ts`
- Create: `src/core/model/index-map.ts`
- Test: `test/core/model/parser.test.ts`
- Test: `test/core/model/index-map.test.ts`

**Requirements**:
- `elements/`、`metamodel/`、`views/` 按单实体 Markdown 单元解析；`relationships/` 按列表容器解析
- entity type 由 frontmatter `entity` 字段判定，**分区不参与判定**
- 条目出现在不匹配分区时仍按自身声明解析，并产出 `OrganizationWarning`
- 文件名不参与 identity 解析；重命名文件不改变解析结果
- Element 正文以 `## Requirements` 组织，复用 `requirement-blocks.ts:32 extractRequirementsSection`
- Requirement 顺序与 Scenario 顺序保留（契约「语义差异判定」列为语义）
- `parent` 缺省或 null 表示 Project Root

#### Checks

- [ ] C1 验证四分区解析与 entity 自声明
  - Verifies: `xirang-contract.md` / 「单元形态」/ 单元划分与字段表
  - Command: `pnpm exec vitest run test/core/model/parser.test.ts`
  - Expect: 四分区各自解析正确；`relationships/` 单容器多条目；Requirement/Scenario 顺序保留
  - Remediation: `relationships/` 是唯一多实体容器，不得按单实体单元处理

- [ ] C2 验证分区不参与类型判定
  - Verifies: `xirang-contract.md` / 「entity 自声明」/ 分区不参与 entity type 判定
  - Command: `pnpm exec vitest run test/core/model/parser.test.ts`
  - Expect: 放错分区的条目仍按 `entity` 解析，并产出 organization warning 而非错误
  - Remediation: 错位是组织约定不符，不是解析失败，不得抛出

- [ ] C3 验证 identity 索引与文件名无关性
  - Verifies: `xirang-contract.md` / 「存储结构」/ 目录与文件名仅为组织约定
  - Command: `pnpm exec vitest run test/core/model/index-map.test.ts`
  - Expect: 任意文件名下 `moduleOf(identity)` 均正确；重命名文件后 IR 逐字段不变
  - Remediation: 索引以 identity 为键，`path` 仅供写回定位，不得反向推导 identity

---

### Task 3: 实现确定性 serializer 与 round-trip 属性

**Goal**: 以 TDD 实现 IR → 四分区序列化，保证相同 IR 逐字节相同输出，并以属性测试固定往返正确性。

**Files**:
- Create: `src/core/model/serializer.ts`
- Test: `test/core/model/serializer.test.ts`
- Test: `test/core/model/serializer.pbt.test.ts`

**Requirements**:
- `serializeSemanticModel` 返回 `Map<relativePath, Buffer>`，路径遵循默认命名约定 `elements/<identity>.md` 等
- `relationships/` 按 Relationship Kind 分组，每个 Kind 一个容器；容器内条目按 `source`、`kind`、`target` 依次排序
- frontmatter 按固定键顺序输出
- 序列化是纯函数：同一 IR 连续两次调用产出相同字节
- 属性测试使用 `fast-check` 生成随机 IR，验证 `parse(serialize(ir)) ≡ ir`
- 属性测试覆盖：引号与转义字符、多行 summary 与 Requirement 正文、空集合（零 Requirement / 零 Relationship / 零 View）、缺省可选字段（`root`/`parents`/`children`/`sourceKinds`/`targetKinds`/`of`/`title`/`autoLayout`）
- 序列化不得写入 `.xirang/.cache-likec4/`

#### Checks

- [ ] C1 验证确定性与排序
  - Verifies: `xirang-contract.md` / 「Sync 保证」/ 确定性序列化
  - Command: `pnpm exec vitest run test/core/model/serializer.test.ts`
  - Expect: 连续两次序列化字节相同；条目乱序输入产出相同排序结果；跨 locale 一致
  - Remediation: 排序使用字节序比较，不得依赖 `localeCompare` 默认 locale

- [ ] C2 验证 round-trip 属性
  - Verifies: `xirang-contract.md` / 「Sync 保证」/ `parse(serialize(ir))` 与 `ir` 相等
  - Command: `pnpm exec vitest run test/core/model/serializer.pbt.test.ts`
  - Expect: 随机 IR 往返等价；转义、多行、空集合、缺省字段四类边界全覆盖
  - Remediation: 往返正确性是测试层属性，不得在运行期加断言

---

### Task 4: 实现 IR 语义校验与规则收敛

**Goal**: 以 TDD 在新 IR 上实现语义校验，落实已裁定的规则收敛。

**Files**:
- Create: `src/core/model/validator.ts`
- Test: `test/core/model/validator.test.ts`

**Requirements**:
- identity 字符集 `[A-Za-z0-9._-]+`，违反报 `INVALID_IDENTITY`
- Element Kind 与 Relationship Kind 的 identity 在 Metamodel 内全局唯一，冲突报 `DUPLICATE_KIND_IDENTITY`
- 恰好一个 Project Root（`root` kind 且 `parent === null`），缺失/重复分别报错
- 非 root Element 必须有存在的 parent；containment 无环
- Metamodel 声明的 `parents`/`children` 约束生效；`sourceKinds`/`targetKinds` 端点约束生效
- Relationship 去重 key 为 `source\0kind\0target`（复用 `relation-validator.ts:59-65`）
- `contract: required` 的 Element Kind，其实例必须含至少一条 Requirement
- Element Kind 缺 `contract` 报 `MISSING_CONTRACT`（取代 `MISSING_CONTRACT_POLICY`）
- validator 只消费 IR，不接触文件系统
- 不含任何 spec↔element 绑定校验、`capabilityId`、`metadata.specs` 相关规则

#### Checks

- [ ] C1 验证 identity 约束与 Kind 唯一性
  - Verifies: `xirang-contract.md` / 「identity 约束」/ 字符集与 Kind 全局唯一
  - Command: `pnpm exec vitest run test/core/model/validator.test.ts`
  - Expect: 含 `/`、空格、中文的 identity 被拒；Element Kind 与 Relationship Kind 同名被拒
  - Remediation: 唯一性须跨两类 Kind 检测，不得各自独立判重

- [ ] C2 验证层级与端点约束
  - Verifies: `xirang-definition.md` / §2 Hierarchical Elements / 单 parent 与任意深度
  - Command: `pnpm exec vitest run test/core/model/validator.test.ts`
  - Expect: 任意深度合法；缺失 parent、containment 环、非法 kind 组合、非法端点均被拒
  - Remediation: 未声明约束时默认开放，不得隐式套用固定层级

- [ ] C3 验证 Contract 基数与必需性
  - Verifies: `xirang-definition.md` / §3 Element Contract / 至多一个 Contract
  - Command: `pnpm exec vitest run test/core/model/validator.test.ts`
  - Expect: `contract: required` 且无 Requirement 被拒；`contract: optional` 且无 Requirement 通过
  - Remediation: 一 Element 至多一 Contract 由结构保证，不得引入绑定表

---

### Task 5: 实现 Semantic Delta 解析与应用

**Goal**: 以 TDD 实现 Delta 单元解析与应用，产出 Expected Semantic Model 及受影响 identity 集合。

**Files**:
- Create: `src/core/model/delta.ts`
- Test: `test/core/model/delta.test.ts`

**Requirements**:
- Delta 单元字段结构与 Model 单元相同，额外携带 `operation`
- `elements/` 单元同时承载 frontmatter 的 Declaration Entry 与正文的 Requirement Entry
- 正文 Requirement Entry 以 `## ADDED/MODIFIED/REMOVED Requirements` 分节表达，复用 `requirement-blocks.ts:132 parseDeltaSpec`
- frontmatter 无 `operation` 时仅用于定位宿主，不产生 Declaration Entry
- Requirement Entry 的 identity 为 `<element identity>#<name>`，单元内只书写 `<name>`
- `ADDED`/`MODIFIED` 携带完整目标内容；`REMOVED` 只声明 identity
- `relationships/` 出现 `MODIFIED` 时解析期拒绝，报 `RELATIONSHIP_MODIFIED_UNSUPPORTED`
- 同一 identity 出现冲突操作时拒绝
- `ADDED` 已存在 identity、`MODIFIED`/`REMOVED` 不存在 identity 均报错
- **允许** `MODIFIED` 改变 Element 的 `kind`（不得复现 `ELEMENT_KIND_CHANGE`）
- `DeltaApplication.touched` 精确记录受影响 identity，供最小重写定位

#### Checks

- [ ] C1 验证 Entry 解析与双 entity type 共存
  - Verifies: `xirang-contract.md` / 「Semantic Delta 记法」/ per-entry 完整目标内容
  - Command: `pnpm exec vitest run test/core/model/delta.test.ts`
  - Expect: 单个 elements 单元同时产出 Declaration Entry 与多条 Requirement Entry；仅改 Contract 时 frontmatter 不产生 Entry
  - Remediation: 「完整目标内容」是 per-entry 规则，不得要求整份 Contract 完整

- [ ] C2 验证修改语支持面矩阵
  - Verifies: `xirang-contract.md` / 「Semantic Delta 记法」/ 修改语支持面表格
  - Command: `pnpm exec vitest run test/core/model/delta.test.ts`
  - Expect: relationships 的 MODIFIED 被拒；其余四类三种修改语均可用
  - Remediation: Relationship 的 identity 即全部内容，MODIFIED 无处施加

- [ ] C3 验证 Kind 可变与应用结果
  - Verifies: `xirang-definition.md` / §3 Semantic Delta Entry / Kind 可在 identity 不变时改变
  - Command: `pnpm exec vitest run test/core/model/delta.test.ts`
  - Expect: identity 不变而 kind 改变的 MODIFIED 成功；冲突操作与前置条件失败被拒；`touched` 集合精确
  - Remediation: 删除 `change-compiler.ts:165` 后不得在新解析器中复现该禁止

---

### Task 6: 实现最小重写与事务写回

**Goal**: 以 TDD 实现最小重写写回，并将现有事务骨架的分区元组推广为四分区。

**Files**:
- Create: `src/core/model/sync-writer.ts`
- Modify: `src/core/change-sync.ts`
- Modify: `src/core/semantic-diff.ts`
- Test: `test/core/model/sync-writer.test.ts`
- Test: `test/core/change-sync.partitions.test.ts`

**Requirements**:
- 只重写受影响单元；未受影响单元保持 byte-for-byte 不变，包括路径、注释与顺序
- `relationships/` 重写粒度为条目所在容器文件
- 复用 `change-sync.ts` 的 `readSemanticDirectoryTree:899`、`semanticTreeFingerprint:926`、`buildManifest:937`、`assertManifestPreimages:967`、`applyManifestEntry:980`、`rollbackManifest:1009`、`applySemanticDirectoryTransaction:348`、`recoverSemanticDirectoryTransaction:300`，不得重写这些函数
- 将 `:276`、`:285`、`:314`、`:369` 的 `['architecture','specs']` 与 `readSemanticDirectoryTree:917-918` 的固定遍历参数化为 `PARTITIONS`
- `resolveManifestPath:1031` 白名单推广为四分区，保持路径逃逸防护
- 删除 `semantic-diff.ts:14 DiffScope` 与 `:27 scope` 字段；`DiffKind:15` 取值对齐 `EntityType` 并补 `authored-view`
- 任一环节失败完整回滚到应用前状态

#### Checks

- [ ] C1 验证最小重写
  - Verifies: `xirang-contract.md` / 「Sync 保证」/ 最小重写
  - Command: `pnpm exec vitest run test/core/model/sync-writer.test.ts`
  - Expect: 改一个 Element 后，其余单元 mtime 与字节均未变；改一条 Relationship 只重写其容器
  - Remediation: 未受影响单元不得因重新序列化而产生字节差异

- [ ] C2 验证分区推广不破坏事务不变量
  - Verifies: `xirang-contract.md` / 「Sync 保证」/ 全或无
  - Command: `pnpm exec vitest run test/core/change-sync.partitions.test.ts`
  - Expect: 四分区均纳入指纹与 manifest；`../`、绝对路径、非四分区前缀被拒；写入中途失败完整回滚；journal 存在时崩溃恢复正确
  - Remediation: `resolveManifestPath` 是路径逃逸防线，推广白名单时不得削弱 normalize 校验

- [ ] C3 验证差异输出不携带分区
  - Verifies: `xirang-contract.md` / 「语义差异判定」/ 差异输出以 entity type 与 identity 为键
  - Command: `pnpm exec vitest run test/core/model/sync-writer.test.ts`
  - Expect: `ChangeDiffEntry` 无 `scope` 字段；改变 relationships 分组方式不影响差异输出
  - Remediation: 分区是组织约定，不得泄漏进语义输出

---

### Task 7: 推广 Candidate 四分区与 promotion

**Goal**: 以 TDD 将 Candidate 工作区与 promotion 推广至四分区，核实并保持整体替换语义。

**Files**:
- Modify: `src/core/candidate/promotion.ts`
- Modify: `src/core/candidate/validator.ts`
- Test: `test/core/model/candidate-partitions.test.ts`

**Requirements**:
- `.xirang/candidate/` 采用与 `.xirang/model/` 相同的四分区、单元形态与字段
- `snapshotTargetTree:47` 与 `stageCandidateTarget:62` 的 `architecture/|specs/` 前缀过滤推广为 `PARTITIONS`
- promotion 保持整体替换：`promotion.ts:232 buildManifest(previousTree, targetTree)` 使 Candidate 中不存在的单元产生 delete 条目
- promotion 前后校验改用 `src/core/model/validator.ts`
- `history` 记录的 `previous` 结构随分区推广同步更新
- 不改变 review digest 与崩溃恢复语义

#### Checks

- [ ] C1 验证四分区 Candidate 完整提升
  - Verifies: `xirang-contract.md` / 「存储结构」/ Candidate 与 Semantic Model 使用相同分区
  - Command: `pnpm exec vitest run test/core/model/candidate-partitions.test.ts`
  - Expect: 含四分区文件的 Candidate 提升后 `.xirang/model/` 四分区齐全，无文件被静默丢弃
  - Remediation: 两处前缀过滤须同时推广，遗漏会使新分区文件丢失而 promotion 仍报成功

- [ ] C2 验证整体替换语义
  - Verifies: `xirang-contract.md` / 「存储结构」/ Candidate 中不存在的单元不再保留
  - Command: `pnpm exec vitest run test/core/model/candidate-partitions.test.ts`
  - Expect: 旧模型独有的单元在提升后被删除；digest 不匹配时拒绝提升；提升失败后 Candidate 与模型均回到原状
  - Remediation: 整体替换由 `buildManifest` 的 delete 条目保证，不得改为增量合并

---

### Task 8: 收敛旧校验器与冗余绑定

**Goal**: 删除已被新 validator 覆盖的旧校验器与双向绑定，消除与目标语义冲突的规则。

**Files**:
- Delete: `src/core/spec-registry.ts`
- Delete: `src/core/parsers/spec-frontmatter.ts`
- Delete: `src/utils/semantic-checks/ownership-validator.ts`
- Delete: `src/utils/semantic-checks/metadata-validator.ts`
- Modify: `src/core/change-compiler.ts`
- Test: `test/core/model/regression-removed-rules.test.ts`

**Requirements**:
- 删除 `change-compiler.ts:165 ELEMENT_KIND_CHANGE`
- 删除 `spec-registry.ts:24 elementToSpecs: Map<string, string[]>` 所代表的一 Element 多 Contract 能力
- 删除 spec frontmatter `element:` 记法与 `metadata.specs` 正向绑定的校验端
- `ownership-validator.ts` 的 `MISSING_OWNERSHIP`/`MULTIPLE_OWNERSHIP` 由新 validator 的 `MISSING_PARENT`/`INVALID_CONTAINMENT` 覆盖
- 保留 `src/core/relations/registry.ts`（`help.ts:2-3` 仍在使用）
- 删除后不得残留对已删除模块的 import
- 本 Change 不删除 `likec4-reader.ts`、`likec4-parser.ts`、`architecture-delta-parser.ts`、`architecture-delta-merger.ts`——旧栈删除属 C3

#### Checks

- [ ] C1 验证收敛后的规则不可复现
  - Verifies: `xirang-definition.md` / §3 Semantic Delta Entry / Kind 可变
  - Command: `pnpm exec vitest run test/core/model/regression-removed-rules.test.ts`
  - Expect: identity 不变改 kind 通过；一 Element 绑定两份 Contract 在新结构中无法表达；relationship `description` 无处声明
  - Remediation: 这些规则的消失应由结构保证，不得仅靠删除校验实现

- [ ] C2 验证删除未留孤儿引用
  - Verifies: `xirang-contract.md` / 「引用规则」/ 单元之间不存在位置引用
  - Command: `pnpm exec tsc --noEmit`
  - Expect: 类型检查通过，无对已删除模块的 import
  - Remediation: `relations/registry.ts` 仍服务 `help.ts`，不得整包删除

---

### Task 9: 验收——内核管线端到端

**Goal**: 以完整管线验证契约的三条 Sync 保证与语义差异判定规则。

**Files**:
- Test: `test/core/model/kernel-e2e.test.ts`

**Requirements**:
- 端到端路径：解析 `.xirang/model/` → 解析 Delta → 应用得 Expected Model → 校验 → 最小重写 → 重新解析
- 语义差异判定：跨单元集合（Elements、Relationships、Kinds、Views）顺序规范化后不构成差异
- 单元内 Requirement 顺序与 Scenario 顺序构成差异
- 散文逐字比较，仅规范化行尾与文件末尾空白
- 全部测试使用临时目录夹具，不读取仓库现有 `.xirang/architecture/`
- 全量测试套件不得新增失败

#### Checks

- [ ] C1 验证端到端管线
  - Verifies: `xirang-contract.md` / 「Sync 保证」/ 三条保证
  - Command: `pnpm exec vitest run test/core/model/`
  - Expect: 管线各阶段结果一致；最小重写、确定性、全或无同时成立
  - Remediation: 夹具须自建临时目录，不得依赖仓库现有模型数据

- [ ] C2 验证语义差异判定的顺序规则
  - Verifies: `xirang-contract.md` / 「语义差异判定」/ 规范化维度清单
  - Command: `pnpm exec vitest run test/core/model/kernel-e2e.test.ts`
  - Expect: 打乱跨单元集合顺序无差异；调换 Requirement 或 Scenario 顺序产生差异
  - Remediation: 划分依据是是否存在权威顺序，不得对单元内顺序做规范化

- [ ] C3 验证旧测试未新增失败
  - Verifies: `design.md` / 风险与回滚条件 / R1 半迁移期
  - Command: `pnpm exec vitest run`
  - Expect: 相对本 Change 起点，失败集合无新增项
  - Remediation: 新旧读写层在本 Change 内并存，CLI 切换与旧栈删除属 C3

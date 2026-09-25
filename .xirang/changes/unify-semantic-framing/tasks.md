### Task 1: 交付可直接使用的通用语义精化默认方法

**Goal**: 新项目和缺省配置可沿随框架交付的语义精化指导建模，显式方法及项目 skill 不变；setup 与 clean Candidate 使用一致的默认 Kind 起点。

**Files**:
- Modify: `src/core/project-config.ts`
- Modify: `src/core/setup.ts`
- Modify: `src/core/update.ts`
- Modify: `src/core/templates/model-skeleton.ts`
- Modify: `src/core/candidate/workspace.ts`
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Modify: `src/core/templates/workflows/build.ts`
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/snack.ts`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/templates/sync-engine.ts`
- Modify: `.xirang/references/`（仅显式登记的默认指导及受影响共享 reference）
- Modify: `.pi/skills/`（仅 manifest 管理且受影响的 workflow 生成面，不覆盖项目专用 skill）
- Test: `test/core/project-config.test.ts`（modify）
- Test: `test/core/config-schema.test.ts`（modify）
- Test: `test/commands/config.test.ts`（modify）
- Test: `test/core/setup.test.ts`（modify）
- Test: `test/core/update.test.ts`（modify）
- Test: `test/commands/candidate-init.test.ts`（modify）
- Test: `test/core/templates/fragments/xirang-fragments.test.ts`（modify）
- Test: `test/core/templates/build.test.ts`（modify，仅默认指导路由）
- Test: `test/core/templates/explore-template.test.ts`（modify，仅默认指导路由）
- Test: `test/core/templates/propose-template.test.ts`（modify，仅默认指导路由）
- Test: `test/core/templates/manifest/registry.test.ts`（reuse）
- Test: `test/core/templates/sync-engine.test.ts`（modify）

**Requirements**:
- 按 `elements/project-config-loading.md`、`elements/workspace-init.md` 与 `elements/workspace-update.md` 实现 missing-only 默认值；保留 opaque union、非法显式值的既有诊断、显式 C4、用户 skill 及 YAML/YML 路径行为。
- 按 `elements/workspace-init.md` 与 `elements/candidate-commands.md` 扩展共享 seed manifest，仅新增默认 Kind 起点，不从代码推断业务结构，也不改现有正式模型。
- 按 `elements/single-dimension-decomposition.md` 与 `elements/workflow-templates.md` 交付完整默认 reference；在现有共享片段中路由默认方法、显式方法和 skill，保留六工作流及 Contract-only 不拆结构的边界。
- 同步源模板、显式 reference 登记和受管生成面；默认指导必须可读取，不能仅改一个配置字符串。Prompt 清楚呈现方法选择、适用结构范围和指导不可用时的停止条件。
- 独立达到 GREEN；后续记录改造不应成为本任务配置、seed 或指导验证的前提。替换失效的默认值与空 seed 断言，保留显式选择、安全路径及禁止额外工作流检查。

#### Checks

- [x] C1 缺省方法变更且不覆盖用户选择
  - Verifies: `elements/project-config-loading.md` / Requirement "加载结构拆分配置" / Scenarios "加载方法名", "加载 skill 名", "字段缺失时使用默认方法", "非法 tagged union 不回退默认方法", "yaml 与 yml 使用相同结构拆分语义"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/project-config.test.ts test/core/config-schema.test.ts test/commands/config.test.ts test/core/setup.test.ts test/core/update.test.ts`
  - Expect: 缺省配置得到新方法；setup/update 只补缺失值，显式 C4 和 skill、未知字段与其他功能性默认值保留；非法 union 不静默回退。

- [x] C2 默认种类在 setup 与 clean Candidate 中一致
  - Verifies: `elements/candidate-commands.md` / Requirement "Candidate initialization SHALL 创建一个隔离 workspace" / Scenarios "初始化 clean Candidate", "初始化 current Candidate", "Active Candidate 已存在", "Windows Candidate path"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/setup.test.ts test/commands/candidate-init.test.ts`
  - Expect: 新起点包含 project、element、perspective 与 Project Root 骨架，没有推断业务 Elements；current 起点、现有 workspace 保护及路径表示不回归。

- [x] C3 默认指导实际可达且保留显式路由
  - Verifies: `elements/workflow-templates.md` / Requirement "交付并路由通用语义精化指导" / Scenarios "默认指导可达", "显式指导优先"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/templates/fragments/xirang-fragments.test.ts test/core/templates/build.test.ts test/core/templates/explore-template.test.ts test/core/templates/propose-template.test.ts test/core/templates/manifest/registry.test.ts test/core/templates/sync-engine.test.ts`
  - Expect: reference 从框架源登记并被生成入口正确引用，显式选择不被替换，registry 保持六项；不添加解释性段落逐字镜像断言。

- [x] C4 用非 C4 场景演练语义精化指导
  - Verifies: `elements/single-dimension-decomposition.md` / Requirement "区分语义精化与呈现组织" / Scenarios "语义视角与纯呈现分离", "叶节点仍保留行为细节"
  - Test action: one-time
  - Evidence: 在隔离临时项目中，从本次构建的 CLI 生成入口和默认 reference；用非软件架构领域的概念/能力请求演练同层单维度、MECE、BFS、任意深度、Perspective 与 View 选择，追加跨视角同一概念和不再拆节点的行为例外。另用显式 C4 与项目 skill 确认其仍被选择。记录实际读取路径和关键响应，不改仓库项目配置。
  - Expect: 无强制 C4 层级、重复概念或遗漏叶节点细节；未确认的下一层不被擅自展开；证据为一次性演练记录，不新增持久测试文件。
  - Evidence: 本次主 Agent 演练见 `/tmp/unify-task1-walkthrough.md`，实际 CLI 生成输出见 `/tmp/unify-task1-generation.log`，C1–C3 定向测试见 `/tmp/unify-task1-green3.log`（390 passed）；不冒充独立子代理或 Windows 验证。

### Task 2: 打通确认记录到 Explore 和完整 Change 的闭环

**Goal**: 用统一精简记录替代结构全量草稿，使保存授权、冲突裁决、Summary、Propose、任务覆盖与 Change 来源交接形成一个可独立验证的行为闭环。

**Files**:
- Modify: `src/commands/framing.ts`
- Modify: `src/core/framing/types.ts`
- Modify: `src/core/framing/document.ts`
- Modify: `src/core/framing/paths.ts`
- Modify: `src/core/framing/workspace.ts`
- Modify: `src/core/framing/baseline.ts`
- Delete: `src/core/framing/target-normalize.ts`
- Modify: `src/core/framing/validator.ts`
- Modify: `src/core/framing/consume.ts`
- Modify: `src/core/templates/workflows/build.ts`（共享记录 reference 路由；Candidate 消费在 Task 3）
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/templates/sync-engine.ts`
- Modify: `schemas/semantic-model/schema.yaml`
- Modify: `schemas/semantic-model/templates/tasks.md`
- Modify: `.xirang/references/`（显式登记的 Framing 与 Explore reference）
- Modify: `.pi/skills/`（受影响的受管 Explore、Propose 入口与共享片段投影）
- Test: `test/core/framing/document.test.ts`（modify）
- Test: `test/core/framing/document.property.test.ts`（modify）
- Test: `test/core/framing/baseline.test.ts`（modify）
- Test: `test/core/framing/baseline.property.test.ts`（modify）
- Test: `test/core/framing/diff.test.ts`（modify）
- Test: `test/core/framing/paths.test.ts`（modify）
- Test: `test/core/framing/workspace.test.ts`（modify）
- Test: `test/core/framing/validator.test.ts`（modify）
- Test: `test/core/framing/consume.test.ts`（modify）
- Test: `test/commands/framing.test.ts`（modify）
- Test: `test/commands/framing-json.test.ts`（modify）
- Test: `test/integration/framing-workflow.test.ts`（modify）
- Test: `test/core/templates/definition-framing-reference.test.ts`（modify）
- Test: `test/core/templates/build.test.ts`（modify，仅共享记录 reference 路由）
- Test: `test/core/templates/explore-template.test.ts`（modify）
- Test: `test/core/templates/propose-template.test.ts`（modify）
- Test: `test/core/templates/sync-engine.test.ts`（modify）
- Test: `test/core/templates/semantic-model-consistency.test.ts`（modify）
- Test: `test/core/parsers/task-structure.test.ts`（reuse）

**Requirements**:
- 依赖 Task 1 GREEN。按 `elements/change-structural-definition.md`、`elements/definition-framing-operations.md` 和 `elements/deterministic-operations.md` 落实 versioned 非空条目模型、稳定身份、受管路径、当前态更新/diff、上下文基准、CLI JSON 及 Change 消费；记录核心支持独立 Build 上下文，Candidate 消费在 Task 3 闭环交付，不以其作为本任务 Change 路径的前提。
- 按 `elements/definition-framing.md`、`elements/explore.md`、`elements/design-exploration.md`、`elements/explore-role.md` 与 `elements/explore-brainstorming.md` 将逐次授权、完整重载、用户指定材料优先、冲突裁决、diff 复查和 Summary 失效条件落实到共享协议及入口；CLI 不伪造自然语言裁决或覆盖判断。
- 按 `elements/propose.md`、`elements/propose-role.md`、`elements/propose-workflow.md`、`elements/post-propose-validation.md` 和 `elements/tasks-document.md` 编译记录到完整目标语义，再编排具体实施与 Checks；保留有效 Summary、无记录路径与 no-op，分离规范内容和说明材料，补足上游 Contract 而非在 Tasks 发明语义。
- 精确来源版本经覆盖复核和目标校验后 copy-then-delete；调整旧四分区匹配假设而保留冲突快照、失败保留、重验恢复和路径安全。旧格式明确诊断，不迁移、不删除、不建兼容通道，不把 provenance 加入规范解析。
- 按 `elements/workflow-templates.md` 和 `elements/project-tooling-configuration.md` 优化提示词的信息结构、必读路由和停止条件；同步源、明确登记及受管生成面。测试只锁协议、授权门禁、禁止操作和 fail-closed 行为；清除受改动影响的旧结构限定和普通措辞断言，不改无关质量角色。

#### Checks

- [x] C5 记录保存和更新保持精简当前态及稳定身份
  - Verifies: `elements/definition-framing-operations.md` / Requirement "管理统一确认记录生命周期" / Scenarios "创建并恢复记录", "空记录和旧格式不隐式转换"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/framing/document.test.ts test/core/framing/document.property.test.ts test/core/framing/diff.test.ts test/core/framing/workspace.test.ts test/commands/framing.test.ts`
  - Expect: 非空局部条目可 create/list/show/update/rename/discard；无关条目保持不变，记录与条目身份稳定，added/modified/removed 返回完整可审查内容；旧格式和空记录拒绝且原文件保留。

- [x] C6 明确区分缺失模型、损坏模型及路径越界
  - Verifies: `elements/definition-framing-operations.md` / Requirement "返回记录校验与上下文变化" / Scenarios "合法缺失与损坏分离", "格式合法不等于意图完整"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/framing/baseline.test.ts test/core/framing/baseline.property.test.ts test/core/framing/validator.test.ts test/core/framing/paths.test.ts`
  - Expect: 初始 Build 缺失 formal model 可记录，损坏 formal source 不被吞成缺失；关联变化使旧结论不可复用；越界、symlink 和身份/文件名不一致 fail closed，CLI 不返回虚假的自然语言覆盖成功。

- [x] C7 Change 来源交接可恢复且失败不丢数据
  - Verifies: `elements/definition-framing-operations.md` / Requirement "确定性交接确认来源" / Scenarios "相同快照恢复交接", "冲突或失败保留来源", "显式选择消费目标"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/framing/consume.test.ts test/commands/framing.test.ts test/integration/framing-workflow.test.ts`
  - Expect: 明确 named Change 获得精确来源，校验成功前不删除；同字节快照重验后可恢复，版本变化、不同快照和无效目标保持源与既有目标；不得把结构或字符串匹配等同 Agent 覆盖审查。

- [x] C8 CLI 保持稳定的单一 JSON 输出协议
  - Verifies: `elements/definition-framing-operations.md` / Requirement "提供稳定 Framing JSON Contract" / Scenario "Validation 发现相关 Drift"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/framing-json.test.ts`
  - Expect: 新记录命令输出唯一 versioned envelope，ok/invalid/error 与退出码一致；相关 drift 为 invalid，不掺入 spinner、颜色、stack trace 或普通说明文本。

- [x] C9 演练独立授权、用户指定内容和 Summary 冲突门禁
  - Verifies: `elements/design-exploration.md` / Requirement "形成不持久化的 Design Summary" / Scenarios "冲突阻止 Summary", "裁决后重新检查", "后续记录变化使 Summary 过期"
  - Test action: one-time
  - Evidence: 在隔离项目使用本次实际生成的 Explore 入口：让用户明确要求记录一个次要例外和一段说明，先只说设计可以，再单独授权具体保存；随后提出与旧条目冲突的新条件。观察 Agent 完整读取、列出影响、等待裁决和单独更新授权、审查 diff、重载后才输出 Summary。再改动相关条目，确认旧 Summary 被重新检查。另演练无记录路径，不写空文件。
  - Expect: 不擅自记录普通讨论，不省略用户指定材料，不将最新表述自动当覆盖；未决冲突阻塞 Summary，保存保留无关条目；不增加持久测试文件。

- [x] C10 演练记录到规范再到实施和检查的真实覆盖
  - Verifies: `elements/propose.md` / Requirement "验证确认内容到目标语义的覆盖" / Scenarios "记录细节不能被共同遗漏", "说明材料保持非规范性质", "已经满足的语义可无操作"
  - Test action: one-time
  - Evidence: 用隔离项目和实际生成 Propose 入口，提供含条件、数值、例外、时序、部分结构片段及说明材料的记录。追踪每项到适当 Delta/Plan，再追踪需实施的语义到任务事项和可观察 Checks；故意让制品共同漏掉例外，并另构造存在引用但检查不能验证行为的任务，确认均被发现。验证部分记录不禁止继续确认未决结构，已有确认不被重做；最后完成 named Change 的版本绑定交接。
  - Expect: 缺失规范先回补 Contract，未决意图请求用户；说明材料不变成新承诺，既有满足内容可 no-op；Tasks 不复制规范，也不依靠后续未 GREEN 任务才能通过。

- [x] C11 生成入口共享同一可达协议并保留安全边界
  - Verifies: `elements/project-tooling-configuration.md` / Requirement "投影共享 Definition Framing 协议" / Scenarios "共享协议在三入口可用", "受管同步不覆盖用户内容"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/templates/definition-framing-reference.test.ts test/core/templates/build.test.ts test/core/templates/explore-template.test.ts test/core/templates/propose-template.test.ts test/core/templates/sync-engine.test.ts test/core/templates/semantic-model-consistency.test.ts`
  - Expect: 单一共享 reference 按显式名字投影，入口明确读取/重读条件和只读/受控消费例外；这里只验证 Build 的共享 reference 路由，其 Candidate 消费行为由 Task 3 验证。未登记用户内容不被覆盖，普通措辞和标题顺序不成为新增锁词测试。

- [x] C12 任务仍使用规范引用而非新增一套语义
  - Verifies: `elements/tasks-document.md` / Requirement "Tasks 安排执行与验证" / Scenario "具体安排引用规范"
  - Test action: reuse
  - Command: `pnpm exec vitest run test/core/parsers/task-structure.test.ts`
  - Evidence: 用修改后的 resolved tasks instructions 生成一个跨 CLI、模板、生成面与测试的行为任务，核对具体事项、依赖、最多五个高层 Requirements 和精确 Contract 引用。保留已有合法/悬空引用、Verifies/Preserves 路径与 Actions/Checks 兼容测试，不新增冗余解析器或以结构校验代替 C10 的语义检查。
  - Expect: 现有任务协议不回归；prompt 改动与所属行为同闭环交付，不形成独立的最后润色任务。

- Evidence: Task 2 的 RED/GREEN、实际生成入口、主 Agent 脚本化输入演练与语义反例见 `/tmp/unify-task2-walkthrough.md`、`/tmp/unify-task2-green.log`（163 passed）、`/tmp/unify-task2-walkthrough.log` 和 `/tmp/unify-task2-semantic-check.log`；不声称独立审查、真实用户多轮会话或 Windows 验证。

### Task 3: 将统一确认来源接入完整 Build 生命周期

**Goal**: Build 能从同一种确认记录形成完整 Candidate，并以包含来源的精确版本完成独立审查、用户确认和带 history 的原子提升，不建立第二套记录或 Summary 阶段。

**Files**:
- Modify: `src/commands/framing.ts`
- Modify: `src/core/framing/consume.ts`
- Modify: `src/commands/candidate.ts`
- Modify: `src/core/candidate/workspace.ts`
- Modify: `src/core/candidate/validator.ts`
- Modify: `src/core/candidate/digest.ts`
- Modify: `src/core/candidate/history.ts`
- Modify: `src/core/candidate/promotion.ts`
- Modify: `src/core/templates/workflows/build.ts`
- Modify: `src/core/templates/workflows/explore.ts`（共享 Framing reference 生成源中的 Build 交接说明）
- Modify: `.xirang/references/`（受管共享协议）
- Modify: `.pi/skills/`（受管 Build 入口及共享协议路由）
- Test: `test/core/framing/consume.test.ts`（modify）
- Test: `test/commands/framing.test.ts`（modify）
- Test: `test/commands/framing-json.test.ts`（modify）
- Test: `test/integration/framing-workflow.test.ts`（modify）
- Test: `test/commands/candidate-validate.test.ts`（modify）
- Test: `test/commands/candidate-status.test.ts`（reuse）
- Test: `test/commands/candidate-promote.test.ts`（modify）
- Test: `test/core/candidate-digest.test.ts`（modify）
- Test: `test/core/candidate-history.test.ts`（modify）
- Test: `test/core/model/candidate-partitions.test.ts`（modify）
- Test: `test/core/templates/build.test.ts`（modify）
- Test: `test/core/templates/definition-framing-reference.test.ts`（modify）

**Requirements**:
- 依赖 Task 1、Task 2 GREEN。复用统一记录模型、基准、版本与受控路径；新增显式 active Candidate 消费目标，不从 cwd 猜测，也不复制一套 Build 专用记录管理。
- 按 `elements/semantic-model-build.md` 完成记录重载、冲突调和、规范内容到 Candidate 的语义覆盖及说明材料路由；保持无记录路径、首次构建、授权范围、先 init 再写 build.md 和独立语义审查。
- 按 `elements/candidate-commands.md` 与 `elements/change-structural-definition.md` 将精确来源快照纳入最终 reviewDigest 和 history；交接后重新验证、审查和确认最终版本，不把 provenance 提升入 formal partitions。
- 按 `elements/definition-framing-operations.md` 保持交接失败保留、同字节恢复、冲突停止及 Candidate 原子提升/回滚；来源改变必须使旧 digest 失效，不削弱现有 Candidate 校验。
- 同闭环优化并生成 Build prompt：明确记录可在 init 前存在、Candidate 写入边界、最终版本交接、审查/确认/提升顺序；仅复用共享协议，不引入 Design Summary 门禁或重写 Reviewer/Optimizer。

#### Checks

- [x] C13 演练带记录和无记录的 Build 形成流程
  - Verifies: `elements/semantic-model-build.md` / Requirement "复用确认记录形成 Candidate" / Scenarios "记录驱动完整 Candidate", "无记录沿用 Build 门禁", "规范细节遗漏阻止确认"
  - Test action: one-time
  - Evidence: 在隔离项目使用本次生成的 Build 入口，先在不存在 formal model 时保存获授权的局部记录，再选择 baseline、init 并生成完整 Candidate；故意遗漏一个确认例外，观察覆盖复核要求补足 Contract。另以无记录路径运行到 Candidate 验证，比较原有独立审查与用户 digest 确认门禁。
  - Expect: 两条路径均无需 Design Summary；规范细节不只停留在 build.md，损坏 formal model 不被当成缺失；不擅自提升或修改项目实现，不新增持久测试文件。

- [x] C14 来源字节绑定 digest 并只进入 Build history
  - Verifies: `elements/candidate-commands.md` / Requirement "Candidate validation SHALL 确定性且只读" / Scenario "来源绑定 review digest"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/candidate-validate.test.ts test/core/candidate-digest.test.ts test/core/candidate-history.test.ts test/core/model/candidate-partitions.test.ts test/commands/candidate-promote.test.ts`
  - Expect: 相同内容重复验证 digest 相同，来源变化导致旧 digest 被拒；validation 不写文件；成功提升 history 保留精确来源，formal model 仅含规范四分区。

- [x] C15 Candidate 消费和提升失败保持可恢复状态
  - Verifies: `elements/semantic-model-build.md` / Requirement "交接记录后确认精确 Candidate" / Scenarios "确认最终带来源版本", "来源交接失败"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/framing/consume.test.ts test/commands/framing.test.ts test/commands/framing-json.test.ts test/integration/framing-workflow.test.ts test/commands/candidate-promote.test.ts test/commands/candidate-status.test.ts`
  - Expect: 显式 Candidate 目标可接收来源；缺失 Candidate、来源变化、不同快照、校验失败不丢来源或覆盖旧目标；复制后中断可重验恢复；history/替换失败仍按现有事务恢复 formal model 并保留 Candidate。

- [x] C16 Build 提示词保持正确权限和版本顺序
  - Verifies: `elements/semantic-model-build.md` / Requirement "交接记录后确认精确 Candidate" / Scenario "确认最终带来源版本"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/templates/build.test.ts test/core/templates/definition-framing-reference.test.ts`
  - Evidence: 检查实际生成入口，确认按输入/权威、动作、停止/确认、输出组织，完整协议只由共享 reference 定义；记录变化后的重载与重新确认条件可定位。模板测试保护命令/权限/门禁，不锁说明段落措辞。
  - Expect: 入口指向可达共享协议，禁止复用交接前 digest 或跳过独立审查，不新增第七工作流及竞争的记录说明。

- Evidence: Task 3 实际生成入口与主 Agent 演练见 `/tmp/unify-task3-walkthrough.md`、`/tmp/unify-task3-walkthrough.log`；最终定向测试 `/tmp/unify-task3-final-green.log`（12 files、87 passed），未冒充独立 review 或真实用户 digest 授权。

### Task 4: 在 Windows CI 验证跨平台记录与交接闭环

**Goal**: 将已 GREEN 的默认配置、记录、Change 和 Candidate 行为接入现有 Windows 验证面，并完成受影响生成面的集成检查。

**Files**:
- Modify: `.github/workflows/test-windows.yml`
- Modify: `.github/workflows/windows.yml`
- Modify: `.gitignore`（显式允许计划中的 windows.yml 被跟踪）
- Test: `test/commands/candidate-init.test.ts`（modify，仅 Windows 无 symlink 权限的显式跳过及目录 junction 夹具）
- Test: `test/integration/windows-definition-ci.test.ts`（modify）
- Test: `test/core/templates/skill-templates-parity.test.ts`（modify，源与受管生成面一致性替代受影响模板的固定 hash）
- Test: `test/skills/semantic-model-consistency.test.ts`（modify，默认指导路由）
- Test: `test/core/templates/transforms.test.ts`（reuse）
- Test: `test/core/shared/skill-generation.test.ts`（reuse）

**Requirements**:
- 依赖 Tasks 1–3 GREEN。本任务只交付跨平台集成证据和现有 CI 测试入口，不延后前面任务的核心路径或 prompt 行为实现。
- 在现有 Windows jobs 的显式测试名单中纳入受影响 framing paths/workspace/consume、config/defaults 与 Candidate digest/history/promotion 验证；不建立重复平台矩阵，不改无关 browser 测试。
- 所有受影响路径实现与预期使用 Node.js path API；验证 Windows 上隔离、regular file/symlink 判断、canonical 相对路径与失败恢复，不以 Linux 通过声称 Windows 已通过。
- 使用本次构建的 CLI 和既有显式 manifest 刷新受影响工作面，检查用户 skill 与显式配置不变、源与生成面一致；不直接 patch 生成文件掩盖模板缺陷。
- 无法实际运行 Windows runner 时保留 Check 未完成并报告阻塞；集成验证不新增锁解释性措辞的持久测试，也不改正式模型或归档 Change。

#### Checks

- [x] C17 Windows CI 的显式测试入口包含完整交接路径
  - Verifies: `elements/definition-framing-operations.md` / Requirement "隔离受控文件路径" / Scenario "Windows 路径隔离"
  - Test action: modify
  - Command: `pnpm exec vitest run test/integration/windows-definition-ci.test.ts`
  - Expect: 现有 Windows workflows 明确执行受影响记录和 Candidate 路径测试；命令使用现有配置，无重复矩阵、硬编码 Unix 分隔符或遗漏消费失败测试。

- [x] C18 获取 Windows 上真实执行的行为证据
  - Verifies: `elements/definition-framing-operations.md` / Requirement "隔离受控文件路径" / Scenarios "Windows 路径隔离", "Managed path 是 symlink"
  - Test action: one-time
  - Command: `pnpm exec vitest run test/core/project-config.test.ts test/core/setup.test.ts test/core/update.test.ts test/core/framing/paths.test.ts test/core/framing/workspace.test.ts test/core/framing/consume.test.ts test/integration/framing-workflow.test.ts test/commands/candidate-init.test.ts test/core/candidate-digest.test.ts test/core/candidate-history.test.ts test/commands/candidate-promote.test.ts`
  - Evidence: 在实际 Windows runner 或获授权的 Windows 环境执行上述命令，保留平台、被验证 revision、run 标识和通过/失败输出；Linux/macOS 结果不能代替此证据。
  - Expect: 配置默认值、记录操作、两类来源交接及 Candidate 恢复在 Windows 正常；symlink 无创建权限的环境须显式报告适用限制，不伪称该分支已验证。

- [x] C19 最终构建和受管 prompt 生成面一致
  - Verifies: `elements/project-tooling-configuration.md` / Requirement "投影共享 Definition Framing 协议" / Scenario "受管同步不覆盖用户内容"
  - Test action: one-time
  - Command: `pnpm build && pnpm lint && pnpm test`
  - Evidence: 先使用本次构建的 CLI 在隔离 workspace 执行 setup/update 并核对显式 manifest 的受影响输出、全部 reference 引用及第二次同步无意外变化；再按同一名单刷新仓库受管生成面并审阅 diff。确认项目自有 xirang-project-decomposition 与显式 config 不变，未改无关质量角色或历史 Change。
  - Expect: 全套现有测试、模板 parity/transforms 与构建检查通过；最终模板和生成面无旧的强制结构前置、结构完整草稿或仅 Change 消费指令，无缺失默认指导和相互竞争的共享协议。

- Evidence: Windows 实机 `/tmp/unify-windows-test-green.log`（12 files、232 passed、5 skipped；Windows 10、Node 22.22.3，源码版本见 `/tmp/unify-windows-state.json`）。文件 symlink 因 EPERM 未执行；既有四个平台跳过用例亦未声称覆盖，目录 junction 拒绝已执行。完整证据和限制见 `/tmp/unify-task4-evidence.md`。Linux 原生 `/tmp` 全套 `/tmp/unify-final-test2.log`（160 files、2265 passed），build/lint 及生成面 `/tmp/unify-final-generation.log` 均通过。

- Review corrections evidence: 首轮 FAIL_NEEDS_CORRECTIONS 已经 CLI 记录；最终快照消失时保留源且可重试，Change/Candidate 的新交接与恢复均先 RED 后 GREEN（`/tmp/unify-corrections-red.log`、`/tmp/unify-corrections-green.log`）。Summary 强制 identity/version 及 Propose consume-only 门禁已按源重新投影；带/不带记录及冲突返回演练见 `/tmp/unify-corrections-handoff-walkthrough.log`，属于主 Agent 脚本化输入演练而非独立审查。最新 Linux 全套 2269 passed（`/tmp/unify-corrections-full-test.log`），Windows 236 passed / 5 skipped（`/tmp/unify-windows-corrections-green.log`，版本见 `/tmp/unify-windows-state-corrections.json`），build/lint 及生成一致性检查通过；等待新一轮 clean-context Review。

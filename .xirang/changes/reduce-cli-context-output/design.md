## Context

当前 CLI 已有可复用的模型查询、配置归一化、artifact graph、Quality 状态计算及 Record 交接实现。主要开销来自固定调用组合、返回内容重复及默认展开，不需要建立新的上下文聚合服务。完整目标由 proposal 声明的 Semantic Delta 确定。

已有测量使用实际 stdout/stderr 字节：`arch outline` 的 JSON、text、Markdown 分别为 33084、12528、8720 字节；`arch impact cli --depth 2` 的 JSON/text 为 6322/2481 字节。一个既有 Record 的 show/status/validate 合计为 17142 字节。对 `test-change-derived-view`，proposal/specs instructions 分别输出 7600/11959 字节 stdout，另各有 155 字节退役配置警告。它们是特定样本的现状证据，不代表修改后的收益，也不是 token 计数。

历史设计保留了值得继续使用的机制：artifact workflow 的推进依赖、统一制品定义、配置归一化及共享 Change compiler。早期 instructions 帮助按步推进，后续将 file definition 与配置集中投影以避免漂移；Change diff 与 validate 共用 compiler 保证一致。移除独立 diff 命令避免了重复入口和归档后的持久展示错位，但不要求每次 validation 都打印差异。因此保留动态判断和共享编译，将静态指导交付与差异展示改为按需。

历史依据可追溯到归档设计：`2025-12-28-add-artifact-workflow-cli/design.md` 的推进式制品接口，`2026-07-15-define-artifact-file-semantics/design.md` 的统一文件定义及防漂移考虑，`2026-07-23-add-semantic-change-diff/design.md` 的共享 compiler 与简洁 validate preview，以及 `2026-07-28-refine-realization-and-views/design.md` 对独立 diff 和持久展示制品的收束；这些路径均位于 `.xirang/changes/archive/`。

## Goals / Non-Goals

**Goals:**

- 优先减少不必要调用和重复读取，再减少回执及重复内容、缩小查询范围，最后降低表示开销。
- 在整个 CLI 及工作流中采用一致的结果/诊断通道，保留必要完整语义与凭据。
- 用现有三个入口承接动态配置、Change 状态与 Quality 详情，静态写作规则及模板只维护一份。
- 同步 CLI、受管工作面、Neovim 及仓库内程序消费者，保持 Record 安全交接与 Quality/Candidate 门禁。

**Non-Goals:**

- 不新增统一 context 命令、用户 reference override 机制、Record revision 或并发协调服务。
- 不改变 Semantic Model identity、Quality CAS revision、Candidate reviewDigest，也不调整 Review/Opt/Seal 的实质门禁。
- 不将明确请求的完整 Contract、snapshot 或 review projection 摘要化。
- 不承诺未经比较验证的固定字节降幅或 token 节省数。

## Decisions

### 结果与诊断由命令职责决定

输出层统一处理结果、警告和失败，避免各命令自行拼接 ok/envelope、spinner 和重复 success 消息。无结果成功不序列化；查询的空集合或空对象仍序列化。JSON 模式的诊断进入 stderr，消费者以退出码判定执行是否成功，再按需解析 stdout 的结果及 stderr 的诊断。

状态查询中缺少 Review、未完成目标等是所请求的数据；输入非法、解析失败和实际操作失败才是执行诊断。Quality 保留现有失败退出码区分和字段修复信息；通道变更不改变 CAS 或门禁。

整个命令树逐项核对输出职责：Record、config 写入、new、setup/update、sync、archive、各类 validate，以及 completion/feedback/arch 导出等辅助入口。completion generate 的脚本、反馈 URL/手工材料、导出位置和服务地址属于真实交付；不能简单删除所有 console 输出。无需后续动作的成功装饰移除，真实警告与必要生效信息保留。交互选择及已有授权门禁独立处理，非交互调用不出现加载进度。

选择共享输出规则而不保留两套 success envelope，是因为调用方已经有退出码；新 revision、digest、生成身份则承担独立后续用途，不能一起删除。

### 配置选择与即时读取

`config project --select <key>` 可重复，并使用已有有效配置字段的点路径；`--artifact <id>` 只限定 rules 到匹配制品，两者组合先限定规则再选择字段。输出保持原嵌套形状，避免引入另一种 key/value 协议。无选择时继续提供完整归一化配置。

合法但未配置的可选字段省略，选择结果为空时返回 `{}`；非法字段路径或未知制品明确报错。这区分“未配置”与拼写错误。字段/制品的合法集合复用 schema 与 artifact graph，不以路径正则猜测业务字段。配置每次由当前磁盘重新加载，继续复用现有字段级弹性解析、默认值与退役字段策略。

语言字段适用范围、canonical tokens、context 原样保留、rules additive 及 surface 适用规则归于共享指导。数据查询不再展开多段 CRITICAL 语言提示词。运行时配置编译仍供实际运行时消费者使用，工作流不重新解析 raw YAML。

### Change status 承接推进判断

复用 artifact graph completion detection、目标清单解析及 Quality completion 计算，不维护另一套状态判定。

`status --change` 的 JSON 以 `changeName`、`schemaName`、`isComplete`、`artifacts`、`applyRequires`、`state`、`goals`、`gaps` 为基本数据。每个 artifact 保留状态及必要路径；`goals` 是 total/completed/remaining，不含正文。`isComplete` 仍是制品完整性；`state` 承担 blocked、ready、needs_review、needs_optimize、all_done 的推进语义。适用时的 `quality` 只给概况；需要具体门禁原因或准备 Quality 写入时才读取 quality status。

缺失制品、缺失/无目标/不支持格式的 tracking file 阻塞 Apply；未完成目标进入 ready；全部完成后才联合 Quality 判断。无 tracks 的现有 ready 例外保留。取消重复的 status + instructions apply + quality status 固定组合，不取消必要的目标全文或质量详情读取。

### Quality 当前状态与历史分离

`quality status` 默认返回 revision、当前 Review/Opt/Seal 结论、关联 commit 及具体缺口；`--history` 才附完整 record。写入成功只回传新 revision。当前门禁计算仍基于完整已保存意见，默认省略历史不删除历史，也不改变同类 FAIL 需要不同修正 commit PASS 的规则。

复用现有 Quality 协议定义生成 help 与 Apply/Archive references，避免新旧字段示例分叉。保持 v4 格式拒绝和退出码语义，不以状态精简推断 HEAD/工作区与 Seal 相同。

### 静态指导的单一来源

由现有 workflow manifest 与 reference 注册清单交付制品定义、写作指导、模板及配置遵循规则。按职责拆分可按需加载的内容，已掌握且未变的内容不重复读取；不把原 instructions 全量搬进每个 skill 或每次必读的文件。

现有 `templates` 的路径查询、模型驱动 authoring help 和制品依赖状态继续各司其职。静态交付与三个动态入口均可用后删除 instructions 注册、help/completion 与活跃调用引用。生成文件修改或删除按显式清单定位，沿用受管前缀所有权和 update 覆盖规则，不引入自定义覆盖机制。

### Record 文件名与内部指纹

Record 使用文件名寻址，不再要求调用方维护 explorationId/slug/sourceVersion 的组合。保留结构化 CLI 编辑、条目选择读取和现有字段合并语义；取消外部 sourceVersion 参数及成功回执中的 hash。实现允许用户直接编辑合法文件，但 Agent skill/reference 继续明确要求通过 CLI 操作，不增设绕过 CLI 的提示。

更新默认静默，显式 `--diff` 请求本次完整差异；选择读取返回请求条目的完整内容。首次接手、上下文丢失及交接前完整读取，日常局部操作不固定调用 show/status/validate 三连。

coverage 复用现有目标编译和原子写入，内部保存记录内容与目标模型指纹。目标是 Expected Semantic Model 或 Candidate 的模型内容，不是 Plan 文件、递增版本或输出格式。consume 重新计算匹配关系，先写精确来源快照、完成适用校验，再删除活动记录。coverage 本身不移动来源；已有同字节快照可重验恢复，冲突快照或失败保留来源。文件寻址继续通过 Node.js path API、containment 和普通文件检查覆盖 Windows/macOS/Linux。

不新增锁服务或 Record 修订号：本次目标是去掉调用方版本负担，内部来源/目标绑定仍承担交接新鲜度检查。

### 校验与按需详细结果

`validate --change <name> --preview` 显式请求现有 compiler 的差异投影；普通校验仅报告问题。Candidate validate 保留 reviewDigest，`--details` 请求比较与统计；Candidate status 的统计也按需展开。Quality 历史和 Record 差异分别使用 `--history` 与 `--diff`，避免建立语义含糊的全局 full/summary 开关。

差异的计算来源、只读边界、Formal 缺失时比较不可用及 digest 绑定规则保持。工作流在实际审阅差异时显式请求 preview，重复修复校验不重复输出。通用 Next steps 页脚和通过计数由具体问题诊断及按需请求替代，不削弱错误定位与可执行修复信息。

### Neovim 同步适配

保存以 CLI 退出码判断成功，退出码 0 且 stdout 为空仍刷新 accepted projection。存在 ignoredChanges 时保留提示；失败从 stderr 解析结构化诊断并保留右侧草稿。list 与 show --review 保留完整查询数据，加载失败不呈现旧的有效目标。复用现有异步刷新及视图状态保持，不另起保存协议。

### 验证与测试维护

优先修改现有行为拥有者：CLI 默认/JSON 输出、config 即时生效、artifact/apply 状态、Quality CAS、Record coverage/consume 和 Neovim writeback。旧 envelope、成功装饰、默认 preview 及固定提示词全文断言不再代表目标行为，按已确认的新结果调整；不把文本快照替换成另一组全文快照。

关键序列：无输出写入后读取真实状态；有效空查询与写入成功区分；有效数据伴随警告分流；配置修改后的下一次选择查询；目标全部完成但 Review/Opt/Seal 各有缺口；coverage 后改来源或目标导致 consume 拒绝且来源保留；只改 Plan 不改变模型指纹；保存空成功、混合 ignoredChanges 和失败草稿恢复。边界由对应 Contract 定义，测试不通过篡改 fixture 制造假失败。

一次性测量使用相同样本和任务目的记录两条输出流及实际读取的 skill/reference 字节，比较单命令与 Explore/Propose/Apply 等累计调用序列。注明样本和引用文件读取次数，避免只减少 CLI 字节却增加同量必读文件。build、typecheck、生成面 parity 和 Windows 路径核对作为实际验证证据，只有确实运行后才报告结果。

## Risks / Trade-offs

- [旧程序消费者把 stdout 错误或 JSON envelope 当作协议] → 与命令同时更新消费者及行为测试，特别覆盖 Neovim；允许 breaking change，不保留平行兼容协议。
- [仅改全局规则仍留下子 Contract 要求成功消息] → 对具体命令的冲突条款逐项同步，保留必要结果及真正警告。
- [静态内容迁到文件却仍反复全读] → 明确按需入口和重读触发条件，比较实际累计读取字节。
- [Record 外部版本参数移除后误删内部校验] → 保留覆盖绑定、目标变化拒绝、来源保存失败及恢复行为的现有验证。
- [状态概况被误当成最终质量证明] → goals/isComplete 与 state 分开；保持 commit 绑定、Quality 门禁与实际验证责任。
- [跨平台文件名定位或诊断路径变化] → 复用 path/containment 实现，验证 Windows 分隔符、合法文件及拒绝路径逃逸结果。

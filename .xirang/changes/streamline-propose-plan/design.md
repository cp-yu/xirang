## Context

当前 Propose、任务模板和 `xirang validate` 以 `Goal/Files/Sections/Checks` 组织执行闭环；Apply、任务进度、Reviewer、隔离迁移和归档也消费 `Files` 或嵌套 checkbox。直接删除模板字段会使现有消费端和历史 Change 失效。本 Change 明确接受 breaking change：升级后仅支持目标级任务格式，不迁移或兼容旧格式；历史 Change 若需继续校验或 Apply，需显式重写其 `tasks.md`。

## Goals / Non-Goals

**Goals:**
- 让 Plan 的三份文档各自只保留动机与范围、关键决策、目标与验证约定的必要信息。
- 统一采用目标级任务格式，让 Propose 和 Apply 的任务读取、进度及审查不依赖 `Files/Checks`。

**Non-Goals:**
- 不迁移历史 Change；旧格式文件需要继续使用时由用户或后续 Change 显式重写。不改变 Snack 不生成 `tasks.md` 的行为。
- 不新增持久化逐项测试日志，不将 Quality Seal 摘要解释为测试输出。

## Decisions

- **任务采用目标级唯一格式**：模板、instructions、结构校验、进度读取和 Apply 均只接受目标级任务，包含目标、验证方向和目标完成 checkbox；目标引用 Element identity 与适用 Section，而非文件路径式 `Verifies:`。不保留 coarse Tasks 或 Actions/Checks 旧布局的 parser、校验或执行分支。接受 Breaking change 是为了移除长期双格式分支及其 `Files/Checks` 假精度；历史任务不会自动迁移，继续使用前必须显式重写。
- **实施选择归 Apply**：Apply 在实施每个目标时读取目标 Contract 和项目证据，选择测试、文件和必要执行顺序，按实际结果勾选目标；需要跨实现面时由 Apply 建立完整闭环。默认不把技术顺序当成用户约束。若用户规定 A 先于 B，则目标排列 A 在前、B 在后，`proposal.md` 或 `design.md` 至少一处解释该要求；涉及目标状态或业务行为时也写入 Delta Contract。此约束与一般任务顺序不同，Apply 不能改写。
- **依赖 `Files/Checks` 的消费者改为基于目标和实际证据**：隔离迁移从已确认目标范围、Change 制品、Git 差异及工作区状态确定相关文件；有混杂或归属不明的脏文件仍须请用户裁决，不能因取消文件清单扩大自动迁移范围。Reviewer 按 Delta、实际变更及测试证据独立判定目标实现与删除，不以文件未出现在 tasks 中当作越界或未完成。归档摘要从实际 diff、目标和 Delta 形成，不依赖预列的文件列表。旧式任务不再受支持。
- **审阅模式默认不阻塞**：Propose 默认完成整套 Change 再集中审阅，可提示用户存在按机制交互的选项而不要求先选模式；收到明确交互请求后再按机制展示实际草稿。两种模式都在重大缺口出现时提问并停下依赖该决定的写作，不以批量模式代替授权。
- **去重只针对职责重叠**：`proposal.md` 的 Source Impact 仍保留 Element identities 以索引 Delta；Impact 描述系统和交互影响，不用猜测代码清单。`design.md` 保留用户确认的方案路径及其理由；`tasks.md` 引用目标 Contract 与可观察验证方向，不复制规范全文。当前已形成的 Change 使用旧版模板过渡，实施后才生成新格式。

## Risks / Trade-offs

- [新格式不再列文件，隔离或 Reviewer 可能错判工作区范围] → 使用 Git 实际变更和明确的 Change 目标交叉核对；无法分离混杂脏文件时暂停询问，不自动携带不相关状态。
- [任务 checkbox 被误当作测试证据] → Apply 仅在实际验证后勾选；Reviewer 独立取证，Quality 仍只存 commit-bound 意见与 Seal 摘要。
- [目标级任务改变现有 Change 的 Formation/Apply 门槛] → 明确标记 Breaking；不静默迁移或尝试双格式猜测。需要继续的旧 Change 由用户显式重写后再校验。

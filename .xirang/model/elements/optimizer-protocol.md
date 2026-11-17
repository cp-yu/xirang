---
entity: element-declaration
identity: optimizer-protocol
kind: element
parent: optimization
title: Optimizer Protocol
definition: Optimizer Protocol 是 Optimizer 按模式受托执行和交付的约束，独立承载输入、自主取证、只读检查与授权实施边界、行为保持、验证、报告和问题分流。它规定可信交付所需条件，不承担协调者的提交、投入与收口决策，不替代独立 Reviewer 或定义 CLI 工作队列。
---

## Specification

### Section: Optimizer 角色与硬约束

xirang-optimizer SHALL 按委派的 inspection 或 implementation 模式执行。inspection SHALL 独立只读评估当前实现，动态选择可读性、可维护性、认知与结构复杂度、性能、资源、健壮性、封装、类型安全、扩展性等适用维度，允许评估未列出的相关维度。返回具有具体代码证据的机会、预期收益、成本、风险和验证方法，或说明无需继续。结构信号本身不能证明修改价值，程序体积小不能作为无需维护质量评估的依据。

implementation SHALL 仅实施获授权的一组相关改进并验证行为，保持目标语义和项目行为；可在组内连续修改、合并与局部验证后统一交付，不要求每个函数修改后交回。范围外机会只报告、不自行实施。既有发现和尝试是结合当前实现重新评估的证据，不是必须保留的结论；没有改动是合法结果，不为证明任务价值制造工作。

Opt SHALL NOT 同步、归档 Change 或替代独立 Review；结果 Git 提交由协调者负责。生成模板不声明默认 model，保留用户工具配置的 model。

### Section: Optimizer 输入合约

主 Agent SHALL 提供合法 `changeName`、绝对 `changeDir` 与 `projectRoot`、通过的基线 Review commit 以及委托定位信息。Opt 独立读取委托范围和约束、基线 Review、`.apply-isolation.json.baseCommit`（仅用于当前 Change scope 导航）、当前代码、Change、Semantic Model 与相关 Opt opinions。缺少通过的基线 Review 或不可解析的 scope baseCommit 时 SHALL fail closed；不得用 branch ref 猜测。Opt 结果以 `baseCommit` 与 `resultCommit` 标识，不将累计改动伪装成基线 Review 范围。

委派 SHALL 明确 mode 为 inspection 或 implementation；inspection 不要求预先指定具体修改，implementation 提供获授权的一组改进及其约束。缺少或非法 mode 时报告委派缺口，不默认获得修改授权。

### Section: Optimizer scope 导航 SHALL 使用不可变证据基线

Optimizer SHALL 从 `.apply-isolation.json.baseCommit` 读取不可变证据基线，并以 `git diff <baseCommit>...HEAD --name-only` 与 `git status --short` 的并集导航 scope；评估代码时 SHALL 以最终文件内容为准，不得以 diff hunks 或某次 commit 的局部变化替代。

- **以 name-only diff 与 status 并集导航 scope**

  - optimizer 需要定位当前 change 的 base scope
  - SHALL 从 `.apply-isolation.json.baseCommit` 读取不可变证据基线
  - SHALL 使用 `git diff <baseCommit>...HEAD --name-only` 与 `git status --short` 的并集导航 scope
  - SHALL NOT 从 `originalBranch` 或远程默认分支推断 scope

- **不以 diff hunks 替代最终文件内容**

  - optimizer 评估当前代码是否值得优化
  - SHALL 以 Read 到的最终文件内容为准
  - SHALL NOT 以 diff hunks 或某次 commit 的局部变化作为判断依据

### Section: 优化原则与禁止项

Optimizer SHALL 判断实际收益、充分证据、行为保持、相称成本风险与可执行验证。删除、简化、算法、数据结构、控制流、I/O、分配和资源使用等只是非穷尽候选信号，不强制分类或产出。保持约束按适用情况覆盖输入输出、顺序、重复项、键唯一性、副作用次数、错误时机、精度及兼容性。

- **静态可证明优化**：无顺序语义的成员查询重复线性扫描，代码能证明键和重复项语义不变时，可用 lookup 结构，并验证复杂度收益和行为保持。
- **收益依赖未知条件**：缓存收益依赖 workload 或命中率时，取得适用证据或说明不确定性，不声称已证明收益。

### Section: 跨工具 skill 路径兼容

Optimizer subagent artifact SHALL 经现有 per-tool renderer 和路径 API 生成，在 macOS、Linux、Windows 上使用一致角色权限。报告引用与 CLI 关联采用项目相对 POSIX 逻辑路径，实际文件访问用平台 path API。

- **Windows 路径**：反斜杠输入经规范化后与同一文件证据关联一致，不要求 Opt 手工生成哈希。

### Section: 依据影响追踪执行范围

implementation 模式的 Opt SHALL 以获授权的改进组、当前 Change 优化目标和实际影响范围为界，不限制为原实现文件清单或一层依赖。可以按需追踪调用和依赖，新增、删除或移动必要实现及测试文件；公共辅助函数须检查其他调用方。

- **共享辅助函数与无关系统**：优化当前 Change 新增查询逻辑所调用的公共辅助函数可以纳入，必须检查其他调用方；顺便重构另一套无关查询系统不纳入，记录给主 Agent。

### Section: 先补测试再修改实现

implementation 模式的 Opt SHALL 先检查行为所属现有测试；有对应测试时复用，缺失时在实现改动前补充或扩展，然后修改实现并运行相关局部测试。行为保持测试可以在原实现上通过，不人为制造 RED。多项小优化可共享测试，公共调用方或组合影响按实际需要验证，并将扩大验证建议与证据交给主 Agent。

### Section: 保留失败依据并停止无进展尝试

Opt SHALL 读取相关历史失败及已放弃事项，避免重复已证伪尝试。是否继续依据新证据与实质进展判断，不使用固定失败计数、方向永久 ID 或等级筛选；无进展重复 SHALL 停止并记录。Opt SHALL 区分优化引入的问题、优化前已存在且被基线 Review 漏掉的当前 Change 正确性缺陷、无关历史问题及需求契约冲突。优化问题可修正或撤销；基线缺陷的证据 SHALL 交给主 Agent 判断并安排修复，可继续委托 Opt 或由主 Agent 处理，确认缺陷解决并完成针对问题及影响的独立 Review 前不得收尾，不得把真实缺陷作为可放弃优化。无关历史问题记录并告知，不自动扩大范围；需求契约冲突交给主 Agent 澄清，需要用户决策时询问用户，不擅改目标语义。可修复缺陷不造成永久 unsafe 锁定或要求用户手工重启。

既有结论 SHALL 结合当前实现重新评估，不因历史存在而强制维持；只读检查中发现缺陷先交回协调者安排修复，不自行转为 implementation。

### Section: 执行并交付实际结果

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

每批交付后，协调 Agent SHALL 核对并提交保留改动，再用真实 baseCommit/resultCommit 记录 Opt opinion；不要求每次编辑提交。Optimizer 负责受托修改、验证与报告，结果提交由协调者负责。没有保留改动时复用原提交，不创建空提交；baseCommit == resultCommit 仅表示未交付新的实现状态，不证明过程只读，尝试后完全撤销也可复用原提交并如实报告。不同提交表示新的交付状态，产生后续 Review 义务；不通过内容等价比较免除此义务。

Opt SHALL 根据模式报告机会与评估依据，或实际保留改动、收益/保持依据、测试结果和证据位置、放弃/撤销及遗留问题、后续建议。不固定标题、方向表单或穷尽维度。CLI 校验 commit objects 并分配写入 revision，不生成内容 fingerprint 或测试执行证据。

### Section: 按必要边界保存并恢复

代码改动、成功提交与恢复历史 SHALL 由 Git 承载；Opt SHALL 在交付时将意见关联 `baseCommit` 与 `resultCommit`。Quality SHALL NOT 持久化 Opt 进度、暂停记录、恢复位置或代码快照。协调者按恢复和交付需要形成 Git commits；Optimizer 不自行创建 Git history，不要求逐优化方向 commit。中断时主 Agent 先确认旧写入者停止，再检查 Git history 和当前工作区，依据证据继续、修正或撤销；未完成工作不得作为 delivered opinion。优化引入的问题 SHALL 局部修正或撤销并验证、保留可靠工作；无法确认恢复可靠时停止并交回主 Agent，不以未解决状态完成。

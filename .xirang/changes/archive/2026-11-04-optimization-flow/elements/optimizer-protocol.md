---
operation: "MODIFIED"
entity: "element-declaration"
identity: "optimizer-protocol"
kind: "element"
parent: "optimization"
title: "Optimizer Protocol"
definition: "Optimizer Protocol 是 Optimizer 的受托执行与交付约束，独立承载输入、自主取证、实际影响范围、行为保持与测试纪律、必要记录及问题分流。它规定可写角色如何形成可信交付，不定义主 Agent 最终风险决策、CLI 方向队列或独立 Reviewer 的结论。"
---

## MODIFIED Sections

### Section: Optimizer 角色与硬约束

xirang-optimizer SHALL 是受托优化执行者，在 fresh context 独立读取证据并在委托内修改相关实现和测试，保持 Expected Semantic Model、公开契约及领域语义。Opt SHALL 不同步或归档 Change；测试和判断不作为独立 Review。生成模板不声明默认 model，用户工具配置的 model 由既有生成机制保留。

### Section: Optimizer 输入合约

主 Agent SHALL 提供合法 changeName、绝对 changeDir 与 projectRoot 以及委托定位信息。Opt 独立读取委托范围和约束、起始状态、关联基线 Review、恢复位置、当前代码、Change、Semantic Model、最近进度及相关历史。缺少有效基线 Review 或 `.apply-isolation.json.baseCommit` 无法解析时 SHALL fail closed，不用可移动 branch ref 猜测。后续委托与中断恢复不要求将累计改动重新伪装为基线 Review 覆盖范围。

### Section: 优化原则与禁止项

Optimizer SHALL 判断实际收益、充分证据、行为保持、相称成本风险与可执行验证。删除、简化、算法、数据结构、控制流、I/O、分配和资源使用等只是非穷尽候选信号，不强制分类或产出。保持约束按适用情况覆盖输入输出、顺序、重复项、键唯一性、副作用次数、错误时机、精度及兼容性。

- **静态可证明优化**：无顺序语义的成员查询重复线性扫描，代码能证明键和重复项语义不变时，可用 lookup 结构，并验证复杂度收益和行为保持。
- **收益依赖未知条件**：缓存收益依赖 workload 或命中率时，取得适用证据或说明不确定性，不声称已证明收益。

### Section: 跨工具 skill 路径兼容

Optimizer subagent artifact SHALL 经现有 per-tool renderer 和路径 API 生成，在 macOS、Linux、Windows 上使用一致角色权限。报告引用与 CLI 关联采用项目相对 POSIX 逻辑路径，实际文件访问用平台 path API。

- **Windows 路径**：反斜杠输入经规范化后与同一文件证据关联一致，不要求 Opt 手工生成哈希。

## ADDED Sections

### Section: 依据影响追踪执行范围

Opt SHALL 以当前 Change 优化目标和实际影响范围为界，不限制为原实现文件清单或一层依赖。可以按需追踪调用和依赖，新增、删除或移动必要实现及测试文件；公共辅助函数须检查其他调用方。

- **共享辅助函数与无关系统**：优化当前 Change 新增查询逻辑所调用的公共辅助函数可以纳入，必须检查其他调用方；顺便重构另一套无关查询系统不纳入，记录给主 Agent。

### Section: 先补测试再修改实现

Opt SHALL 先检查行为所属现有测试；有对应测试时复用，缺失时在实现改动前补充或扩展，然后修改实现并运行相关局部测试。行为保持测试可以在原实现上通过，不人为制造 RED。多项小优化可共享测试，公共调用方或组合影响按实际需要验证，并将扩大验证建议与证据交给主 Agent。

### Section: 保留失败依据并停止无进展尝试

Opt SHALL 读取相关历史失败及已放弃事项，避免重复已证伪尝试。是否继续依据新证据与实质进展判断，不使用固定失败计数、方向永久 ID 或等级筛选；无进展重复 SHALL 停止并记录。Opt SHALL 区分优化引入的问题、优化前已存在且被基线 Review 漏掉的当前 Change 正确性缺陷、无关历史问题及需求契约冲突。优化问题可修正或撤销；基线缺陷的证据 SHALL 交给主 Agent 判断并安排修复，可继续委托 Opt 或由主 Agent 处理，确认缺陷解决并完成针对问题及影响的独立 Review 前不得收尾，不得把真实缺陷作为可放弃优化。无关历史问题记录并告知，不自动扩大范围；需求契约冲突交给主 Agent 澄清，需要用户决策时询问用户，不擅改目标语义。可修复缺陷不造成永久 unsafe 锁定或要求用户手工重启。

### Section: 执行并交付实际结果

Opt SHALL 自主发现、分组、合并、实施及局部验证，报告实际保留改动与收益/保持依据、测试行为和实际结果及证据、放弃/撤销及遗留问题（无则明确说明）、后续建议及理由。表达形式与详略按复杂度决定，不固定标题或方向表单。CLI 生成身份、版本、时间及代码状态关联，测试证据绑定执行时状态，不能以后来报告状态替代。

### Section: 按必要边界保存并恢复

Opt SHALL 在修改前确认委托起点和可恢复基线已保存，放弃时保存事项/原因/处理，交付或主动暂停时保存进展/测试/问题，其余按需。中断后须在主 Agent 确认旧写入者停止后核对现场并继续原委托：A 已记录完成而 B 在磁盘改到一半时，检查 B 再处理，不认定完成或自动丢弃 A/B。优化引入的问题 SHALL 依据实际证据局部修正或撤销并验证，保留其他可靠优化，不因测试或 Review 失败固定整批回滚。合并后无法直接定位时 MAY 拆分、二分或采用更合适方法；各部分单测通过但组合失败时 SHALL 检查组合影响。无法确认局部恢复可靠时 SHALL 恢复到可确认基线；仍无法确认时停止并交回主 Agent，不以未解决状态完成。

## REMOVED Sections

### Section: Failed Directions 避重协议

### Section: 一层依赖展开扩大优化候选

### Section: Optimizer finding JSON 输出合约

## Context

沿用已确认 Design Summary 与 `shared-xirang-skill.md` 记录。公共片段当前在源码复用、生成后完整内联，Pi 的 skill 调用会装入完整正文；仅增加“读过则复用”的句子无法减少内联文本。既有生成管线可交付 skills 和项目级 references，但安装计划与引用工具目前主要围绕六个 workflow 建模。

记录中的 `current-generation-and-task-evidence` 是调查背景，不含待裁决的目标决策，不编译为目标义务。静态代码调查支持本方案可实现；实际 Agent 路由和上下文复用尚需行为证据。

## Goals / Non-Goals

**Goals:**

- 单一规则维护位置、按需加载、有效上下文内跨阶段复用。
- 支持 common 自然语言入口与阶段直接入口，保持阶段及授权门禁。
- 安装、更新和跨工具定位可达；独立 Agent 能取得自己的必要公共指导。
- tasks 目标与验证方向和 Apply 动态测试安排保持一致。

**Non-Goals:**

- 不增加新的开发阶段或重组 Semantic Model hierarchy。
- 不实现宿主级缓存、持久加载账本、自动阶段状态机或跨 Agent 共享上下文。
- 不修复与本次规则交付无关的历史模型或 Quality 协议问题。

## Decisions

### 公共辅助 skill 与阶段入口

采用 `xirang-common` 作为具体交付名称，复用现有 skills 生成、安装及更新管线。六个 workflow IDs 保持不变；辅助 skill 通过显式登记加入受管制品计划，不能仅向 workflow registry 添加第七阶段，也不能依赖全量安装恰好带来依赖文件。每个所交付的阶段入口都能取得 common。

common 给出六个阶段的用途和显式 skill 名称，Agent 根据用户意图读取对应指导。阶段 skill 开头只保留职责及 common 前置依赖。直接进入阶段后的补读保持当前阶段，common 检测已有阶段上下文后继续它，不再次派发或要求用户手动调用。用户只加载 common 后没有明确可执行意图时，沿用普通意图澄清，不自动选择实现或归档。

### 内容归属

| 内容 | 完整规则归属 | 加载时机 |
|---|---|---|
| Philosophy、语义依据、identity 基础、阶段定位及复用 | common | 任一 Xirang 阶段工作前，当前上下文缺少时 |
| 模型导航与证据查询 | 单一模型上下文 reference | 需要理解模型或查影响时 |
| Definition/Contract 写作及完整模型/Delta 记法 | 单一语义写作指导与各自 notation/specs reference | 需要探索或编写相应语义时；保留完整模型与 Delta 的不同记法 |
| 4+N | 业务规格标准 reference | Kind/Contract 适用该格式时 |
| 结构分解 | 配置消费规则及 normalized decomposition 指向的指导 | 新建或重组 hierarchy 时 |
| 测试质量 | 单一测试质量 reference | 探索验证、实施或评估测试时 |
| 配置、Design Record、Quality | 各自单一专项 reference | 适用动作或门禁触发时 |
| 阶段动作、职责、门禁 | 对应阶段 skill 或该阶段唯一 reference | 进入阶段及其适用步骤时 |

按同一完整规则识别重复，不机械删除必要的阶段提醒或不同层级的模型承诺。先审计规则归属和消费者，再调整源模板、reference 注册与生成输出；保持必需信息可达，不将全部内容简单搬进 common。Reviewer/Optimizer 在独立上下文加载所需公共基础，继续执行受托角色，不使用 common 重新选择用户工作流。Experimenter 仅消费其职责实际需要的指导。

### 复用与状态检查

复用依据是同一 Agent、同一项目且内容仍可用并有效。阶段切换本身不触发公共指导重读；指导更新、必要上下文丢失或新 Agent 则补读所需内容。这里是 Agent 的消费协议，不新建加载状态文件或依赖不存在的跨会话缓存。内容失效时不得靠“已读过”的摘要猜规则。

静态指导与当前模型、Record、配置、Git、Quality 数据分别判断。协议复用不取消规定的完整记录读取、revision 检查和其他阶段门禁。指导版本变化后继续执行新取得的指导，必要状态重新查询。

### 工具与路径

使用现有 tool profile 的 skillsDir 等元数据和显式 skill 名称登记，公共与阶段 skill 在同一工具安装空间可达。优先采用发现的 skill 路径或生成时解析的明确路径，不从标题、命令后缀或名称模式推断路径。用户调用语法继续遵循各工具规则；Agent 读取依赖可以使用含明确 skill 名称的中性指令。

内置 references 保留 `.xirang/references/` 唯一物理位置。新增、更新和删除由显式清单定位，不扩大前缀删除范围。Node.js path API 处理真实文件路径，提示词明确 reference 相对 project root，Windows 与 Unix 的行为一致。

### 验证方向与 Test Maintenance

优先复用 skill-generation、workflow-installation、sync-engine 和 command-references 的现有覆盖，验证辅助 skill 交付、依赖可达、用户文件保护、跨工具引用与跨平台路径。更新依赖“每个 skill 包含完整 Philosophy”的断言，以及 Propose 中要求把具体测试更新写入 tasks 的陈旧断言。普通说明措辞、标题顺序和例句不作为持久测试的固定文本；协议 token、门禁、禁止操作仍需要验证。

Agent 行为证据覆盖 common 首入、阶段首入、连续切换、指导失效、独立 Agent 及门禁未满足场景。检查实际读取路径与阶段行为，不能用存在某句提示词代替执行证据。具体测试安排与运行方式由 Apply 根据当时项目状态决定，不写入 tasks。

### One-time Verification

生成面检查、typecheck、相关模型/Change 校验和相同样本的实际加载次数及内容量对比提供一次性证据。统计包括读取 skill/reference 以及相关 CLI 输出，不能将同量文本搬家宣称为收益；未运行 tokenizer 不报告 token 节省。Windows CI 验证作为交付目标的跨平台证据，实际执行结果由 Apply 报告。

## Risks / Trade-offs

- Agent 可能漏读依赖或将自然语言意图误路由 → 明确入口、阶段映射及已选阶段保持规则，以真实读取轨迹验证；不承诺仅凭静态生成校验保证行为。
- 去重可能删掉必要规则或让依赖不可达 → 对照全部消费者核对规则归属，验证从直接阶段入口与公共入口均可取得指导。
- 无效缓存假设可能让指导或数据过期 → 上下文可用性与来源变化决定补读，动态门禁独立执行。
- 模型含与本 Change 无关的历史残留 → 仅协调本次依赖交付、入口及测试安排，其他语义保持原样。
- 不同工具发现机制不同 → 在已支持工具的现有投影方式内交付明确名称与路径，实际行为证据注明工具、模型和适用限制。

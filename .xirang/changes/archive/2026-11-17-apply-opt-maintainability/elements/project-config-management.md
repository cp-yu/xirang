---
entity: element-declaration
identity: project-config-management
kind: capability-specification
parent: project-tooling-configuration
title: 配置管理
definition: 配置管理是息壤对项目配置和全局工具配置的统一管理能力。它按作用域区分两类配置，提供发现、读取、校验、有效值与默认值，并管理项目配置的有界版本演进；项目内的开发要求由项目配置表达，全局配置保存工具级设置，Agent 承担用户授权判断与语义执行。
---

## MODIFIED Sections

### Section: Business Logic

配置管理 SHALL 联合提供作用域隔离、共享有效值与可靠版本演进，使配置入口、说明和实际行为一致。

#### 配置作用域与统一定义

系统 SHALL 以当前项目 `.xirang/config.yaml` 或 `.yml` 保存项目配置，以平台用户配置目录保存全局工具设置，不把全局工具设置自动迁移为项目偏好。项目偏好使用受支持的对应字段。字段说明、合法取值、默认值、CLI 文档和 YAML 注释示例 SHALL 来自一致的配置定义；可选项以注释示例介绍，不为展示而启用。

用户 SHALL 能从 setup 完成提示、顶层 help、config 说明及 YAML 文件发现配置能力。config 展示可配置内容，config project 返回当前有效值，config check 解释可用性、来源、忽略/回退项、作用阶段/制品/操作及修正建议；说明可使用英文。用户可直接编辑或委托 Agent 修改配置。

#### 有效读取与检查

普通读取 SHALL 选择 `.yaml`，仅在其不存在时回退 `.yml`；同时存在时不合并。合法字段经共享归一化供 CLI、运行时与工作流消费，非法字段给出诊断并采用相应回退，不丢弃其他合法字段。每次 CLI 查询反映当前磁盘内容。全局读取按默认值合并有效设置，保留普通未知字段。

只读 check SHALL 支持详细文本及 JSON，聚合所有可继续检查的独立问题，返回真实有效值、显式/默认来源和对应作用域；它不证明 Agent 已执行自然语言规则。`rules.tasks` 仅约束 tasks.md 编写。检查说明采用的文件位置，同时存在的 `.yml` 须标明未采用。Windows、macOS、Linux 的定位和判断语义一致。

#### 配置生命周期与版本演进

只有 setup SHALL 创建项目配置。项目配置使用与软件发布号及工作流 schema 独立的整数 configVersion，基线为 1，由 setup/update 管理。update 只演进已有、可解析且版本合法的配置。CLI SHALL 保留最近 10 次迁移操作，容量按操作数计，不按发布次数或含当前版本的配置版本数计。

update SHALL 在执行前验证完整所需迁移链。全部步骤和最终校验成功后，一次原子写回内容与新版本；按明确字段和受管说明清单补必要结构/说明及清理陈旧内容，报告实际修改，保留仍适用用户值、注释与排版，不按模式猜测所有权。已是目标版本时不重复迁移，重复 update 不重复插入、清理或报告。

超窗口须给出项目当前版本、目标版本及 CLI 最低支持起始版本，用户先安装合适旧 CLI 完成前段迁移，再用最新版继续；跨多个窗口可重复分段迁移。CLI 不自动安装或运行旧 CLI，不跳过缺失步骤。

项目 SHALL 以 context 表达共同背景、rules 表达制品附加要求、stageRules 表达仅 explore/propose/apply/archive/build/snack 对应阶段的附加指导。阶段仅加载自身规则，离开后不继续作为后续阶段规则；未配置或为空无附加要求，内部受托角色不自动继承。说明、有效查询与检查保持同一字段和作用域定义，用户确认的设计决定可正常交接。

### Section: Key Acceptance Cases

以下 Acceptance Cases SHALL 验证本 Contract 的机制、边界及可观察结果。

#### Acceptance Case: 发现并使用项目配置

setup 后，提示含配置路径及 config、config project、config check 三个入口；YAML 有字段说明与可选注释示例，rules.tasks 的作用限于 tasks.md。

#### Acceptance Case: 完整的十次迁移

目标 15，CLI 保留 5→6 至 14→15 共 10 次迁移。项目版本 5 的全部步骤及校验成功后，内容与版本一次提交为 15。

#### Acceptance Case: 超窗口不部分迁移

同一目标和窗口下，项目版本 3 保持原样；诊断含当前 3、目标 15、最低起始 5，并提示旧 CLI 中转。版本 15 不重复迁移。

#### Acceptance Case: 迁移失败保持原文件

合法配置迁移第二步失败或最终校验失败：内容及 configVersion 与迁移前一致，不出现半迁移状态。

#### Acceptance Case: 严格检查与普通读取

未知嵌套字段与合法语言配置同时存在：普通读取仍返回合法语言；check 报具体未知字段并退出 1，文件不变。仅有 optimization 输入问题时退出 0 并警告。

#### Acceptance Case: 缺失与双扩展名

配置缺失时 check 说明位置并退出 1，update 不重建；两种扩展名同时存在时只使用 .yaml 并列出 .yml 未采用。

#### Acceptance Case: 阶段与制品要求分离

只为 stageRules.explore 配置讨论方法时，Explore 使用它，Propose/Apply 不作为自己的阶段规则执行；rules.design 继续仅约束 design 制品，check 说明两种作用域。

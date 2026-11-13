---
operation: MODIFIED
entity: element-declaration
identity: "workspace-init-update"
kind: "capability-specification"
parent: "project-tooling-configuration"
title: "工作区初始化与更新"
definition: "工作区初始化与更新是 CLI 中初始化和更新息壤工作区的能力。它通过 `xirang setup` 与 `xirang update` 创建或保留 `.xirang` durable workspace、安装固定 Agent workflow 集合、刷新受管 Agent surfaces，并维护配置默认值与退役 workspace 的迁移。"
---

## ADDED Sections

### Section: Scope and Non-goals

工作区初始化与更新 SHALL 建立并维护 durable workspace、项目配置及所选工具的受管工作面，区分首次创建和已有工作区维护。它不从项目证据推断 Candidate 语义，也不将初始化声明为 Project Build 完成。

### Section: Business Logic

setup SHALL 创建或保留 .xirang durable core、模型四分区骨架、changes、references 和项目配置；新配置含 configVersion 基线及字段说明。已有模型、配置和用户内容保持，用户明确选择工具后刷新对应工作面。

setup/update SHALL 交付固定六阶段 skills：propose、explore、apply、archive、build、snack，连同 common、适用内部角色及 references。工具检测和适配以显式元数据与受管 skills 为依据。非交互 setup 使用明确 supported --tools；跨平台操作使用路径 API。

只有 setup SHALL 创建项目配置。update 只处理已有、可解析且版本合法的 .yaml 或 .yml，优先 .yaml；完整迁移链预检后执行最近 10 次操作支持范围内的迁移，全部成功后原子写回内容和版本。按明确清单补必要结构/说明及清理内容，保护用户值、注释、排版，报告实际修改，重复 update 不重复修改或报告。

受管工作面按当前模板同步，必要数据写 stdout，具体警告/错误和必要生效引导写 stderr，无必要结果的成功操作保持静默。受管清理按明确名单与所有权依据保留用户内容。对明确支持迁移的非活动 workspace，用户确认后完整移动到 .xirang/history/legacy-<timestamp>/ 并以 manifest 记录原始相对路径，运行时使用当前活动路径。

### Section: Edge Cases and Exception Handling

无工作区的 update SHALL 失败并指引 setup，不创建部分 workspace。非交互 setup 缺少合法 tools 选择时报告可操作错误。项目配置缺失、损坏或版本不可用时诊断并保留，不恢复或猜测版本；链不全、超窗口或执行失败不保留部分迁移。

超窗口 SHALL 报告当前、目标及最低起始版本，由用户先用旧 CLI 分段中转。用户拒绝非活动 workspace 迁移时 setup/update 失败，不删除或部分移动该目录。文件权限/写入错误须定位路径；用户文件不因名字相同而成为清理对象。

### Section: Key Acceptance Cases

以下 Acceptance Cases SHALL 验证本 Contract 的机制、边界及可观察结果。

#### Acceptance Case: 首次与已有项目

新项目 setup 创建四分区、配置、changes/references 和所选工作面；已有项目再次 setup 保留模型及用户配置，不推断项目 Elements 或 Contracts。

#### Acceptance Case: 非交互与跨平台

无 prompts 环境显式传 supported --tools 可完成初始化；无效工具值失败。Windows/POSIX 的逻辑目录与生成内容一致。

#### Acceptance Case: 十步迁移边界

目标 15、保留 5→6 至 14→15 时，版本 5 可成功升至 15；版本 3 保持原样并提示旧 CLI 中转；版本 15 不重复迁移。

#### Acceptance Case: 缺失配置与重复更新

删除配置后 update 不创建文件；已有配置成功更新后再次 update 无重复清理或无意义成功回执。

#### Acceptance Case: 非活动工作区确认

支持迁移的 workspace 在用户确认后完整进入 history 且 manifest 记录原路径；用户拒绝时命令失败、原目录完整不变。

## REMOVED Sections

### Section: 初始化完整工作区

### Section: 安装固定 Agent Workflow 集合

### Section: 支持跨平台与 non-interactive 运行

### Section: 更新受管工作面

### Section: 迁移配置默认值

### Section: 清理退役工作区

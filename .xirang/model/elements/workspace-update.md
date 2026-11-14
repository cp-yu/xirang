---
entity: element-declaration
identity: workspace-update
kind: capability-specification
parent: workspace-init-update
title: Workspace Update
definition: Workspace Update 是 xirang update 对现有息壤工作区的维护能力。它刷新已配置工具的受管工作面、按版本演进已有项目配置并报告陈旧内容清理，处理固定工作流集合和受管历史；它不创建或修理缺失、损坏的项目配置，也不承担用户语义判断。
---

## Specification

### Section: Scope and Non-goals

Workspace Update SHALL 维护已有工作区的受管工具工作面和有版本项目配置，保护用户内容并报告实际变化。它不创建缺失工作区或项目配置，不修复损坏配置，不改写根级 AGENTS stub。

### Section: Business Logic

update SHALL 在已有工作区内维护受管工作面、演进合法版本配置，并按确认和所有权边界处理非活动内容。

#### 工具工作面维护

update SHALL 要求 .xirang workspace，根据全局工具设置、显式元数据和已生成 skills 识别配置工具，为其刷新 common、固定六阶段及适用角色/references。精确 skill 集合为 xirang-propose、xirang-explore、xirang-apply-change、xirang-archive-change、xirang-build、xirang-snack，不使用全局 workflow-selection 设置选择子集。

工作面 SHALL 由共享生成流程按当前模板同步；不属于固定集合的受管技能仅按明确清理名单及所有权依据处理，保留用户 skills。全局 profile、workflows、delivery 输入按明确名单清理保存，stderr 报告实际字段。项目配置的正常迁移与全局字段清理不承担缺失/损坏项目文件恢复。

工具已有 command 文件但无 skills 时，不据此认定已配置，不刷新或删除那些 command 文件。发现支持的工具目录但无受管 skills 时，报告并引导 setup，不静默安装。

无精确 invocation 元数据的工具使用中性 skill 文案并标明 skillDirName；Codex 引导使用精确的 $xirang-propose、$xirang-explore、$xirang-apply-change、$xirang-archive-change、$xirang-build、$xirang-snack。必要重启提示说明 skills/workflow files 的生效，不使用 slash-command 语义。成功无必要结果时静默，实际修改、警告和必要生效提示遵循 stderr 通道。

#### 项目配置迁移

update SHALL 选择原有 .yaml 优先、.yml 回退的活动文件，只对可解析、具有合法 configVersion 的配置迁移，不新建第二份文件。配置版本独立软件发布，CLI 只保留最近 10 次迁移操作；先完整验证版本、所需链和窗口，再执行所有步骤及最终结果校验。已是目标版本不重复迁移。

迁移 SHALL 按明确字段与受管说明清单补必要结构/说明、删除陈旧内容，不按模式猜用户内容；保留仍适用值、context、rules、decomposition、自定义文件、注释和排版。全部成功后内容与版本一次原子写回；报告实际修改，重复执行不重复插入或报告。Windows、macOS、Linux 的定位与迁移语义一致。

所需早期操作不在窗口时，诊断 SHALL 给出当前版本、目标版本、最低支持起始版本，提示用户先安装合适旧 CLI 中转再用最新版；跨多个窗口可分段继续，不自动安装旧 CLI，不跳过缺失步骤。

#### 非活动工作区

对明确支持迁移的非活动 workspace，setup/update SHALL 在用户确认后完整移动到 .xirang/history/legacy-<timestamp>/，manifest 记录原始相对路径；运行时使用当前活动目录。物理定位使用平台路径 API，不按目录名模式猜测清理对象。

### Section: Edge Cases and Exception Handling

update SHALL 按以下情况保护原状态并给出具体诊断。

| 条件 | 结果 |
|---|---|
| .xirang 不存在 | 非零退出并指引 setup，不创建部分 workspace |
| 项目配置缺失、不可读或 YAML 损坏 | 报告并跳过配置修改，不创建或修复；可独立刷新受管工具工作面 |
| configVersion 缺失、非整数或小于 1 | 不猜测或补 1，原文件不变 |
| configVersion 高于当前 CLI 目标 | 不降级或删除较新字段，原文件不变，提示支持该版本的新 CLI |
| 链不完整或超窗口 | 原文件不变，不先执行部分步骤，报告所需版本范围 |
| 任一步、最终校验或写入失败 | 原内容及原版本保持完整，无半迁移文件 |
| 文件权限/写入失败 | 错误携带可定位路径 |
| AI 工具的用户配置文件不存在 | 不创建该用户配置文件，跳过对应更新 |
| 用户拒绝非活动 workspace 迁移 | setup/update 失败，不删除或部分移动原目录 |
| 同名但非受管的用户文件 | 不覆盖或清理 |

工作区使用已定义的默认目录布局，不由 update 推测自定义目录名。必要诊断不以工具列表、版本或无变化成功摘要替代。

### Section: Key Acceptance Cases

以下 Acceptance Cases SHALL 验证本 Contract 的机制、边界及可观察结果。

#### Acceptance Case: 缺失工作区或配置

项目外运行 update 失败并提示 setup，不留下部分目录；工作区存在但项目配置被删除时不重建，可独立刷新受管 skills。

#### Acceptance Case: 工具发现边界

仅有 command 文件的工具不视为已配置；支持目录存在但无 managed skills 时，提示 setup，未静默安装或删 command 文件。

#### Acceptance Case: 固定工作流与引导

已配置 Codex 刷新六个精确 skill 名称，必要引导使用 $xirang-apply-change 等名称；未登记用户 skill 原样保留。

#### Acceptance Case: 十次链与超窗口

目标 15、保留 5→6 至 14→15：版本 5 全部成功后升 15；版本 3 原样并报告当前 3、目标 15、最低 5 及旧 CLI 中转；版本 15 不重复迁移。

#### Acceptance Case: 异常版本与执行失败

缺少版本、字符串版本、0 或较新版本均不改写；第二步失败、最终校验失败或写入失败时，原内容和原 configVersion 完整不变。

#### Acceptance Case: Yml 内容保护与幂等

只有 .yml 且有用户 context、rules、项目方法及注释：在原文件迁移，保留适用内容，不新增 .yaml；再次 update 不重复修改或报告清理。

#### Acceptance Case: 非活动 workspace 确认

确认后原目录完整迁入 history 并可由 manifest 找到原路径；拒绝时命令失败，原目录未部分移动。

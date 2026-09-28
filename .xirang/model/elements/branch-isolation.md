---
entity: element-declaration
identity: branch-isolation
kind: element
parent: apply
title: Branch Isolation
definition: Branch Isolation 定义 Apply 在正常连续执行路径中选择 Git 隔离方式、保护初始工作区状态、迁移 worktree 改动文件集并持久化证据基线的行为。它支持 branch、worktree 与 current-branch 三种方法，并将后续导航、merge 与 cleanup 交给 Archive。
---

## Specification

### Section: Apply SHALL 路由到唯一隔离方法

Apply SHALL 在实现前读取当前分支、`HEAD` 和 `git status --short`，并依据用户显式选择或 `apply.defaultIsolation` 选择 `branch`、`worktree` 或 `none`。`ask` SHALL 在方法未确定时要求用户选择。

- **配置直接选择隔离方法**

  - `apply.defaultIsolation` 为 `branch`、`worktree` 或 `none`
  - 用户未显式覆盖
  - Apply SHALL 选择对应方法
  - SHALL 不要求额外选择

- **ask 配置要求选择**

  - `apply.defaultIsolation` 为 `ask` 或未配置
  - 用户未显式选择隔离方法
  - Apply SHALL 要求用户在 branch、worktree 和 current branch 中选择

- **隔离文档互斥读取**

  - 用户或配置选择 worktree
  - pre-flight scan 已完成
  - Agent SHALL 只读取对应方法的 reference
  - MUST NOT 读取另外两个互斥方法 reference

### Section: 非 worktree 初始 dirty state SHALL 经过 router 门禁

Isolation router 在 provisional method 为 branch 或 current branch 且初始 `git status --short` 非空时，SHALL 等待用户选择：改用 worktree、明确把已有 dirty state 纳入本次 baseline，或停止 Apply。Apply MUST NOT 自动 stash、commit、reset、clean 或丢弃已有修改。

- **Branch provisional method 遇到已有修改**

  - router 暂定 branch 且工作区非空
  - Apply SHALL 展示改用 worktree、纳入 baseline 或停止三个选择
  - 未获得明确选择前 SHALL NOT 读取 branch reference 或创建分支

- **门禁改选 worktree**

  - 用户在 dirty-state 门禁选择改用 worktree
  - router SHALL 最终选择 worktree
  - Agent SHALL 只读取 worktree reference

- **Current branch provisional method 遇到已有修改**
  - router 暂定 current branch 且工作区非空
  - Apply SHALL 展示改用 worktree、纳入 baseline 或停止三个选择
  - 门禁解决前 SHALL NOT 读取 current-branch reference
### Section: Branch isolation SHALL 使用原生 Git

Branch 方法 SHALL 在任何 branch 检测、创建或切换操作前记录进入隔离时的分支为 `originalBranch`，并把当时的 `HEAD` SHA 记录为 `baseCommit`。随后 SHALL 使用原生 Git 检测目标 branch；目标不存在时以 `git switch -c <change-name>` 创建，已存在时经用户明确确认后切换。该方法 SHALL NOT 创建 worktree。

- **创建 change branch**

  - branch 方法已通过 dirty-state 门禁
  - Apply SHALL 先记录 `originalBranch` 与 `baseCommit`
  - SHALL 使用原生 Git 创建 change branch
  - SHALL 验证当前分支为记录的 `branchName`
  - 不匹配时 SHALL 停止

- **分支已存在**

  - 目标 change branch 已存在
  - Apply SHALL 在切换前已记录 `originalBranch` 与 `baseCommit`
  - SHALL 要求用户确认是否切换到已有分支
  - SHALL NOT 静默覆盖或重建该分支

### Section: Worktree isolation SHALL 迁移改动文件集

Worktree 方法 SHALL 从当前 `HEAD` 创建干净 worktree，不隐式携带源工作区 dirty files。Apply SHALL 从以下显式来源构建"改动文件集"：change 目录、task Files 路径、Check 引用路径、未完成 Required Corrections 路径与用户明确确认的路径。Apply SHALL 在目标 worktree 重现改动文件集的最终文件状态；集合外 dirty files SHALL 留在源工作区。

- **从 HEAD 创建干净 worktree**

  - 用户选择 worktree
  - Apply SHALL 使用原生 `git worktree add` 从当前 `HEAD` 创建 change worktree
  - SHALL NOT 调用或检测外部 worktree skill

- **迁移最终文件状态**

  - 改动文件集包含修改、新增和删除路径
  - Apply SHALL 在 worktree 中重现每个路径的最终状态
  - SHALL 不要求保留源工作区的暂存状态分类

- **集合外修改保持原状**

  - 源工作区包含不在改动文件集中的 dirty path
  - Apply SHALL NOT 复制、清理或更改该路径

### Section: Worktree 迁移 SHALL 验证后清理源状态

迁移后 Apply SHALL 比较每个路径的文件状态；对存在的文件 SHALL 比较 SHA-256，对删除的最终状态 SHALL 记录 `sourceState: "deleted"` 与 `sourceHash: null`，不得为不存在的字节伪造 hash。只有全部验证通过后，Apply 才能清理源工作区中已迁移且状态未变化的修改。

- **Hash 或 validation 不匹配**

  - 任一目标状态、SHA-256 或 targeted validation 不匹配
  - Apply SHALL 停止迁移
  - SHALL NOT 清理源工作区对应状态

- **验证后清理已迁移状态**

  - 全部迁移检查通过
  - 源路径状态与迁移时一致
  - Apply SHALL 只清理已迁移路径的源工作区修改状态
  - SHALL 不触碰改动文件集之外的路径

- **迁移期间源文件变化**

  - 清理前发现源文件状态或 hash 已变化
  - Apply SHALL 停止清理该状态并报告冲突

### Section: 源工作区清理 SHALL 区分 tracked 与 untracked 状态

迁移验证通过后，Apply 清理源工作区中已迁移且状态未变化的修改时 SHALL 区分文件类型：tracked 修改与删除 SHALL 恢复到源工作区 `HEAD` 状态；untracked 文件 SHALL 仅在其 hash 仍与迁移时一致时删除。

- **Tracked 修改与删除恢复到 HEAD**

  - 迁移验证通过且源路径为 tracked 修改或删除
  - Apply SHALL 将该路径恢复到源工作区 `HEAD` 状态
  - SHALL NOT 保留未提交的中间状态

- **Untracked 文件仅在 hash 匹配时删除**

  - 源工作区存在已迁移的 untracked 文件
  - Apply SHALL 仅在该文件 hash 仍与迁移时一致时删除
  - hash 已变化时 SHALL 停止清理该状态并报告冲突

### Section: 迁移成功后 Apply 在 worktree 内执行全部阶段

迁移验证通过后，Phase 0–3 SHALL 只在 worktree 中执行。Apply SHALL 在 worktree 中重新运行 status、apply instructions 及受影响 Check 声明的 targeted validation，确认迁移后的工作区状态可用于继续实现。

- **Phase 0–3 只在 worktree 中执行**

  - worktree 迁移与验证成功
  - Phase 0–3 SHALL 只在 worktree 中执行
  - SHALL NOT 在源工作区继续执行 Apply 阶段

- **迁移后重跑 status 与 targeted validation**

  - 迁移验证通过且 Apply 准备继续实现
  - Apply SHALL 在 worktree 中重新运行 status、apply instructions 及受影响 Check 声明的 targeted validation
  - 任一检查失败 SHALL 停止并报告冲突

### Section: 混合修改文件 SHALL 由用户决定

当同一文件疑似同时包含当前 change 与无关修改时，Apply SHALL NOT 自动推测或拆分 hunks。Agent SHALL 要求用户选择整文件纳入、先手动拆分再重试，或放弃 worktree 方法。二进制文件 SHALL 始终按整文件处理。

- **文本文件包含混合修改**

  - Apply 无法确认一个文件的全部修改都属于当前 change
  - SHALL 等待用户选择整文件纳入、手动拆分或放弃 worktree
  - SHALL NOT 自动执行 hunk 级迁移

- **二进制文件迁移**

  - 改动文件集包含二进制文件
  - Apply SHALL 将其作为不可拆分的整文件单位

### Section: 隔离元数据 SHALL 分离导航与证据基线

成功选择方法后，Apply SHALL 在 change 目录写入 `.apply-isolation.json`。元数据至少包含 `method`、`branchName`、`originalBranch` 和 `baseCommit`；worktree 方法还 SHALL 包含绝对 `worktreePath`、绝对 `sourceRoot` 与带相对路径和源 hash 的 `transferredFiles`。`originalBranch` SHALL 只用于导航、返回与 archive cleanup；`baseCommit` SHALL 为不可变 Git SHA。

- **持久化 branch 隔离状态**

  - branch 方法完成
  - `.apply-isolation.json` SHALL 包含 `method: "branch"`、`branchName`、`originalBranch` 和 `baseCommit`

- **持久化 worktree 迁移清单**

  - worktree 迁移验证完成
  - `.apply-isolation.json` SHALL 包含 `worktreePath`、`sourceRoot` 和 `transferredFiles`
  - 每个 transferred entry SHALL 包含项目相对路径、源状态与源 hash
  - deleted entry 的源 hash SHALL 为 `null`

### Section: 未提交路径 SHALL 补充到证据 scope

`baseCommit` 用于 reviewer、optimizer 与 diff scope 时，Apply SHALL 将 `git status --short` 报告的未提交路径补充到该 scope，使证据基线同时覆盖未提交实现。

- **git status --short 补充未提交路径**

  - reviewer、optimizer 或 diff scope 从 `baseCommit` 构建
  - 未提交路径 SHALL 通过 `git status --short` 补充到 scope
  - scope SHALL 同时覆盖已提交与未提交的当前 change 路径

### Section: Apply SHALL 将 cleanup 交给 Archive

Apply 完成 seal 后 SHALL 从同一 workspace 交接 Archive。Apply MUST NOT 切换回原分支，也 MUST NOT 删除 worktree；Archive workflow SHALL 在 CLI 移动 active change 前保留 `.apply-isolation.json`，并据此处理后续返回、merge 与 cleanup。

- **Worktree Apply 完成**

  - Phase 3 seal 在 worktree 中通过
  - Apply SHALL 从该 worktree 输出 archive-ready handoff
  - SHALL NOT 返回源工作区或删除 worktree
  - Archive SHALL 在 worktree 内完成归档 commits，从 `sourceRoot` 的 `originalBranch` 合并 `branchName`
  - Archive SHALL 在成功合并且 worktree clean 后删除 worktree

### Section: 路径处理 SHALL 跨平台

Worktree 路径和元数据路径 SHALL 使用 Node.js path API 构建，持久化的项目内文件路径 SHALL 使用相对 POSIX 形式。

- **构建 worktree 路径**

  - Apply 构建 `.worktrees/<change-name>` 路径
  - SHALL 使用 Node.js path API
  - SHALL NOT 硬编码平台特定分隔符

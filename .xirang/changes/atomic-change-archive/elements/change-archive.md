---
operation: MODIFIED
entity: element-declaration
identity: change-archive
kind: capability-specification
parent: change-closure
title: Change Archive
definition: Change Archive 是 CLI 结束活动 Change 的统一能力。它按用户选择在一次调用中交付模型更新并留档，或只封存放弃的方案；它保留原始制品，不判断实现质量、不执行 Git 写操作。
---

## ADDED Sections

### Section: Scope and Non-goals

`xirang archive <change>` SHALL 将活动 Change 原样封存并结束其活动状态；默认或 `--quick` 同时应用 Semantic Delta，`--abandon` 只封存。CLI 不提交、合并或清理 Git，不生成展示制品或测试证据。

### Section: Business Logic

可直接指定 Change，也可交互选择活动目录（排除归档）。CLI SHALL 区分三种模式：

- 默认检查有效的 Quality Seal；`--quick` 仅豁免 Seal，明确报告跳过，绝不声称 Quality 已通过。两者均校验 Delta、完整目标模型和写入前基线，在同一次调用内应用待写模型单元并将 Change 原样移至 `.xirang/changes/archive/YYYY-MM-DD-<change>/`。没有模型写入时仅封存。正常交付工作流对未完成制品列出警告并要求确认；任务有未勾选目标时提示继续，默认不继续，`--yes` 可显式继续。没有任务文件或全部完成时不触发未完成任务询问。
- `--abandon` 不检查 Seal、制品完成度或 Delta 合法性，不应用 Delta，不回退或合并实现。对任意实现进度均可封存，包括有提交、任务已勾选或制品不完整。有目标已勾选时先提示 `tasks.md` 的 `## Goals` 中可核实的已勾选目标数/目标总数，不据此推断 Apply 阶段或代码完成度；没有可用进度仍须确认。放弃默认询问一次，拒绝或回车不作改动；`--yes` 跳过询问，不隐藏进度。将活动目录原样移至 `.xirang/changes/archive/abandoned/YYYY-MM-DD-<change>/`；不补写状态文件，不进入交付后的 Git 流程。
- 返回实际归档位置和必要诊断，不输出虚构的验证结果。活动目录不存在且已有归档可定位时只返回该路径，不再次应用、不再次触发 Git 交接。Windows、macOS、Linux 上按路径组件构造两个目的目录，保留文件字节。

### Section: Edge Cases and Exception Handling

CLI SHALL 在任何写入前拒绝同时指定 `--quick` 和 `--abandon`。独立 `xirang sync` 为未知命令；`--no-sync`、`--no-validate`、`--no-verify` 为未知选项，不提供兼容别名。缺少工作区、找不到 Change、目标目录冲突或权限错误时给出具体诊断，不覆盖其他归档。

同一工作区的 Xirang 归档调用（含默认、quick 和 abandon）SHALL 互斥进入写入与补偿阶段；发现其他调用正在提交时拒绝写入并提示重试。归档期间，调用方不得用外部程序移动或替换活动目录、目标归档目录或其父目录；CLI 不保证在这种非协作的目录替换下原子识别目录身份并写入。该限制不豁免已有目标冲突检查，也不允许将可识别的半成品认作成功归档。

同一进程内，模型已写入而目录移动失败时撤回本次写入，恢复到调用前状态，原 Change 仍活动，可重试。出现 I/O 回滚错误时报告实际失败，不声称恢复成功。进程被强杀或断电后不维护恢复日志，不承诺下次调用自动恢复、续跑或回滚；需要时由用户或 Agent 对照 Git diff、模型及 Change 目录处理，不整体覆盖无关未提交修改。

### Section: Key Acceptance Cases

以下用例 SHALL 区分交付、放弃以及可捕获失败的结果。

#### Acceptance Case: 免 Seal 不是免校验

缺少 Seal、Delta 合法且有未完成目标时，quick 提示是否继续；拒绝不写模型、不移动目录。即使指定 --yes，Delta 非法也不交付。

#### Acceptance Case: 放弃 change-a

tasks.md 中已有 2/5 个目标勾选完成时，先提示 2/5，再询问一次「放弃 change-a 并将其归档？[y/N]」。选择 N 或直接回车，Change 继续活动；--abandon --yes 仍提示 2/5，然后直接封存，不再询问。

#### Acceptance Case: 没有任务文件也可放弃

无 tasks.md、无 Seal 且 Delta 无法解析，仍可在确认后放弃。不声称实现尚未开始，不修改模型、分支或工作树。

#### Acceptance Case: 移动失败与中断不同

默认或 quick 在模型写入后移动失败：本次调用撤回模型写入，活动目录保持原样。若写入后进程被杀，下次 --abandon 仅封存 Change，不撤回上次遗留的模型改动。

#### Acceptance Case: 成功回执丢失

上次已完成归档、只是未输出结果，且活动目录不存在、归档可定位：直接返回已有位置，不再次应用 Delta。若目的目录仍被标记为未完成，不返回成功回执，提示核对工作区。

#### Acceptance Case: 同一工作区竞争交付

一个交付调用正在写入正式模型时，另一个归档调用（即使针对另一 Change，或对同一 Change 执行放弃）不得进入写入阶段；后者失败并可在前者完成后重试，不撤销前者的写入，也不创建第二个归档结果。

#### Acceptance Case: Windows 上按结果留档

从 Windows 项目路径归档同一份制品时，默认和 quick 使用 archive 下的日期目录，abandon 使用 archive 下的 abandoned 子目录；两者均保留文件的原始字节。

## MODIFIED Sections

### Section: Agent 在归档后继续 git 流程

本节仅适用于本次成功交付的默认或 quick 归档。

Archive CLI 完成交付并返回新归档位置后，Agent SHALL 无条件继续归档后的 git 流程：先提交残余实现 diff（如有），再无条件创建 semantic boundary commit，然后提交归档制品。

- **无条件创建 semantic boundary commit**

  - archive CLI 完成 sync 与 mv
  - 残余实现 diff 已提交或不存在
  - agent SHALL 创建 `--allow-empty` 的 semantic boundary commit
  - boundary commit SHALL 发生在归档制品提交之前
  - boundary commit 的 subject SHALL 使用真实语义类型而非 `meta`

- **boundary commit message 承载完整 change 总结**

  - agent 生成 semantic boundary commit message
  - message body SHALL 包含 `## Why` 章节（来自 proposal 与 design）
  - SHALL 包含 `## Changes` 章节（按文件清单逐文件描述改动原因）
  - SHALL 以 `Implementation: <base>..<head> (carried by <commits>)` footer 记录 effective diff 范围

### Section: Archive 消费 Apply isolation metadata

本节仅适用于本次成功交付的默认或 quick 归档。

Archive skill SHALL 在调用 archive CLI 前读取并保留 active change 的 `.apply-isolation.json`；归档 commits 完成后，Archive SHALL 按 `method` 执行后续导航、merge 与 cleanup；CLI 本身 SHALL NOT 执行这些 Git 操作。

- **Branch isolation 返回原分支合并**

  - retained metadata 的 `method` 为 `branch`
  - Archive SHALL 在归档 commits 完成后切换到 `originalBranch`
  - SHALL 按投影的 merge strategy 合并 `branchName`

- **Worktree isolation 从 sourceRoot 合并并清理**

  - retained metadata 的 `method` 为 `worktree`
  - Archive SHALL 在 `worktreePath` 中完成归档 commits
  - SHALL 验证 `sourceRoot` 当前分支为 `originalBranch`
  - SHALL 使用 `git -C <sourceRoot>` 按投影策略合并 `branchName`
  - 成功合并且 Apply worktree clean 后 SHALL 执行 `git worktree remove <worktreePath>`
  - 配置要求删除 branch 时 SHALL 在 worktree 删除后确认 merged 再删除 `branchName`

- **Source workspace 的无关修改受保护**

  - worktree archive 访问 `sourceRoot`
  - Archive MUST NOT reset、clean、stash 或 commit 无关 source-workspace 修改
  - metadata 与当前状态不匹配时 SHALL 停止并报告，不得猜测

- **Current branch 不执行隔离 cleanup**

  - retained metadata 的 `method` 为 `none`
  - Archive SHALL NOT 切换或合并当前 branch
  - SHALL NOT 删除 worktree 或当前 branch

### Section: Archive 通过 projection 消费 git 配置

本节仅适用于本次成功交付的默认或 quick 归档。

archive 流程 SHALL 通过统一 prompt/runtime projection 消费 `git` 配置节点，而非直接读取 raw YAML 键。

- **配置经投影后被 archive 消费**

  - archive 需要决定归档后 git 流程的 commit message 模板与 merge 策略
  - archive SHALL 从 projection 读取 `git.commitMessage.*`、`git.merge.strategy` 与 `git.branch.deleteAfterArchive`
  - SHALL NOT 在模板正文里直接解析 config.yaml
  - projection 缺失字段时 SHALL 使用默认行为

- **陈旧 projection 字段不再出现**

  - archive surface 请求 prompt/runtime projection
  - projection SHALL NOT 输出 `git.autoCommit` 等退役字段

- **Archive guidance inherits projected authoring constraints**

  - the skill explains model application during delivery or Required Corrections handling
  - it SHALL use the shared prompt projection contract for prose guidance
  - SHALL preserve canonical structure and normative tokens unchanged

## REMOVED Sections

### Section: Change Selection

### Section: Artifact Completion Check

### Section: Task Completion Check

### Section: Archive Process

### Section: Error Conditions

### Section: Display Output

### Section: Archive Validation

### Section: Sync Gate

### Section: Archive 在用户显式要求时允许绕过 quality gate

### Section: Archive quality freshness routing

### Section: Archive Quality Seal routing

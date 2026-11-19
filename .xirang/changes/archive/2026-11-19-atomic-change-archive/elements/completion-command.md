---
entity: element-declaration
identity: completion-command
kind: element
parent: cli
title: Completion Command
definition: Completion Command 定义 `xirang completion` 为 Zsh、Bash、Fish 与 PowerShell 生成/安装/卸载 shell completion 的行为：native shell 行为集成、命令结构、shell 检测、基于运行时命令树的 completion 生成、动态 completion 与错误处理。
---

## MODIFIED Sections

### Section: Dynamic Completions

动态补全 SHALL 根据参数类型区分普通 Change ID、Formal Element identity 与归档名称。

- **普通 Change ID 与 Formal Element identity**
  - 普通 Change ID SHALL 仅建议具有 `proposal.md` 的活动 Change，不包含归档目录或历史项
  - Element identity SHALL 来自 Formal Semantic Model，不从 Candidate 或历史推断

- **归档参数补全**
  - `archive` 的位置参数 SHALL 建议合法的活动 Change（包括未编写 `proposal.md` 的活动目录）及交付与放弃历史中的稳定完成项，不建议保留名称 `archive`
  - 建议 SHALL 使用无日期的原 Change 名，去重；同名活动 Change 优先于已完成历史
  - 任一历史位置存在同名未完成标记时，归档参数补全 SHALL 不建议该名称，带日期的历史补全 SHALL 不建议其回执；其他名称不受影响。读取期间发现归档已撤回时，两个补全入口均不回退到同名旧回执

- **Project 外 completion**
  - 当前目录不是 Xirang project
  - 动态 provider SHALL 返回空 suggestions（`__complete` 静默失败）
  - shell 仅提供脚本内置的 static command 和 flag suggestions

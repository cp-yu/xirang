---
entity: element-declaration
identity: quality-orchestration
kind: element
parent: quality
title: Quality Orchestration
definition: Quality Orchestration 定义 quality 工作流提示词的编排契约：Coordinator 角色声明、阶段模式标签、显式 subagent delegation 指令、subagent 超时与等待规则、checkpoint 有序执行步骤与语言一致性。它保证顶层 agent 只做编排与持久化，不替代 reviewer 与 optimizer 的判断，也不定义这两个角色自身的判断标准。
---

## MODIFIED Sections

### Section: Checkpoint 协议使用有序执行步骤

quality 工作流提示词 SHALL 以有序步骤描述 checkpoint 与回滚边界：先创建非空 baseline commit；每个成功方向创建含方向 ID 的 commit；失败记录写入后把 quality 记录与 `.apply-isolation.json` 快照到 repository 外并记录 SHA-256；最后回滚该轮实现、原子恢复三份当前状态文件并校验 hash。协议 SHALL 明确禁止空 baseline、stash 与 tag，并要求状态恢复异常时停止。

- **Agent 执行失败回滚**

  - coordinator 处理某轮复核失败
  - prompt SHALL 先指示持久化三份当前状态文件的 snapshot
  - SHALL 再指示回滚该轮实现并原子恢复三份当前状态文件

回滚保护 SHALL 覆盖当前 `.quality-state.json`、`.quality-log.jsonl`、`.apply-isolation.json` 及当前 Change 内的全部质量历史目录。执行 `git reset --hard HEAD` 和 `git clean -fd` 前，SHALL 将这些数据完整保存到 repository 外并记录文件清单与 SHA-256；之后恢复并逐项校验，包括历史中未被 Git 跟踪的文件，不因 HEAD 中没有这些文件而删除它们。历史目录原先不存在时 SHALL 保留该事实，不伪造旧轮次。

恢复失败、校验不一致或历史文件缺失时 SHALL 停止，不提交新的优化结果。普通失败回滚 SHALL 保留当前台账的失败记录与预算，不调用重新验证的记录轮换流程。

- **重启后的优化失败**：旧轮次历史已保存在 Change 内，新方向未通过 Review；回滚只丢弃本次 speculative code，三份当前状态文件和所有旧轮次历史均保持保存时的字节，状态匹配成功 checkpoint 后可按当前台账报告失败尝试。
- **未跟踪的历史目录**：历史文件尚未被 Git 跟踪，`git clean -fd` 会清理它们；repository 外保存及恢复 SHALL 确保回滚后这些历史文件仍完整可读。

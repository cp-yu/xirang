## Goals

- [x] G1: 按对话基线状态呈现记录设计依据，并统一 Explore、Build、Propose 的异常反馈
  - Contract: `design-record` / Section "载入记录时同步当前设计依据"
  - Verify: 新对话首次载入时用户能看到全部已确认内容概要与待决问题；同对话写入只反馈本次 delta，确认内容修订单独标明；invalid、relevant drift 与版本冲突给出诊断和调和动作；成功状态、sourceVersion 与机械计数不进入用户播报，CLI 版本输出仍保持可用。Design Summary 不向用户呈现 sourceVersion。

## Required Corrections

- [ ] [code_fix] <!-- concrete implementation correction -->
- [ ] [artifact_fix] <!-- concrete Change artifact correction -->

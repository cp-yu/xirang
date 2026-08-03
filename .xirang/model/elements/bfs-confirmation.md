---
entity: element-declaration
identity: bfs-confirmation
kind: element
parent: definition-framing
title: BFS Confirmation
definition: BFS Confirmation 是 Definition Framing 中按 BFS 顺序确认同层结构的方法步骤。它确保同一层级的结构内容在进入下一层之前全部确认。
---

## Requirements

### Requirement: BFS 顺序确认同层结构

Definition Framing SHALL 按 BFS 顺序确认同层结构。

#### Scenario: 按 BFS 顺序确认

- **WHEN** Definition Framing 确认结构层级
- **THEN** 按 BFS 顺序确认同层结构
- **AND** 同层结构全部确认后再进入下一层

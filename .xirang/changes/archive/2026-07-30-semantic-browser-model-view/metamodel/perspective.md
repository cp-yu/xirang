---
operation: ADDED
entity: element-kind
identity: perspective
contract: optional
parents:
  - project
  - perspective
children:
  - perspective
  - domain
  - capability
---

`perspective` 标识从一个独立分解角度组织 descendants 的 Element。Perspective 本身表达该分解角度的概念边界，children 构成该角度下的抽象或进一步 Perspectives；它不是 View，也不以颜色、形状或布局定义语义。

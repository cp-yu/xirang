---
entity: element-kind
identity: perspective
contract: optional
---

`perspective` 标识从一个独立分解角度组织 descendants 的 Element。Perspective 本身表达该分解角度的概念边界，children 构成该角度下的抽象或进一步 Perspectives；它不是 View，也不以颜色、形状或布局定义语义。Perspective 的层级位置与其 children 的 Element Kind 不受 Metamodel 白名单限制，由抽象与细化关系决定。

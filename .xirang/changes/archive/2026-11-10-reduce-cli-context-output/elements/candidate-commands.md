---
entity: element-declaration
identity: candidate-commands
kind: element
parent: deterministic-operations
title: "Candidate Commands"
definition: "Candidate Commands 定义 `xirang candidate` 命令面的生命周期行为：`init` 创建隔离 workspace、`status` 只读报告状态、`validate` 确定性只读校验并生成 reviewDigest、`promote` 在 digest 门禁与历史保留下原子替换 formal source。"
---

## MODIFIED Sections

### Section: Candidate status SHALL 只读报告状态

candidate status SHALL 只读报告 active workspace 是否存在及存在时的 starting point。--details SHALL 请求分区 inventory、history count 与 disk usage；默认不展开统计或重复创建指导。不存在 Candidate 时 SHALL 成功返回不存在状态，不以空 stdout 代替查询结果。查询不修改 Candidate、formal source 或 history。

### Section: Candidate validation SHALL 确定性且只读

`xirang candidate validate` SHALL 在不写入任何 workspace file 的情况下，对 `build.md`、存在时的已确认设计来源快照 `record-source.md` 与覆盖结果 `record-coverage.json` 以及四个 Candidate 分区执行 canonical representation 与 Semantic Closure validation。valid result SHALL 包含绑定精确 reviewed bytes 的 SHA-256 `reviewDigest`。

- **Valid Candidate 生成 review digest**

  - Candidate 具有一个 Project Root、合法 identity 与 containment、合法 kind policies、完整 required contracts、合法 Sections 与合法 semantic relations
  - 每个 Candidate file 满足 canonical encoding、newline、Unicode、ordering、path、frontmatter 与 no-symlink rules
  - validation 默认 SHALL 只返回必要的 `reviewDigest`；--details SHALL 额外返回 deterministic inventory 与 formal comparison/diff。警告与错误 SHALL 写入 stderr，--json 时为结构化 JSON；无效 Candidate 非零退出且不得交付可用于提升的 digest
  - 对未变化 bytes 重复 validation SHALL 返回相同 digest

- **Non-canonical Candidate 被拒绝**

  - Candidate file 违反 canonical representation rule
  - validation SHALL 返回包含 file、location、violated rule 与 expected representation 的 failure diagnostic
  - SHALL NOT 自动 format、reorder、normalize 或 rewrite Candidate

- **Validate 不修改文件**

  - validation 成功或失败
  - Candidate、formal model 与 history 下的 bytes SHALL 保持不变

- **来源绑定 review digest**

  - Candidate 包含已交接的确认记录快照与覆盖结果
  - 校验其格式与来源身份并将二者精确字节纳入 reviewDigest；任一字节改变使 digest 改变，校验不写文件。

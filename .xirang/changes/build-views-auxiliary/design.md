## Context

`xirang-build` 与 `semantic-model-build` 把 Authored Views 写成 BFS 最后一层和 Decision Gate 依赖项。`--from current` 会复制正式 `views/`，但完成门禁仍要求「编写」views。Edera 一类重建会整层换 identity，或反过来被旧 view 绑住。浏览器已按 Candidate 自己的 views 下拉；本 Change 只改 Build 完成语义。

CLI `validateSemanticModel` / `candidate validate` 已对 Candidate 自身 view 单元做 `UNRESOLVED_VIEW_REFERENCE`。空 `views/` 通过。不验 selection 是否为空，不验 Graphviz。

## Goals / Non-Goals

**Goals:**

- 规范性模型（Metamodel + Elements/Contracts + Relationships）完成即可 validate / review / promote
- 不要求编写、保留、非空或「看过」Authored Views
- 审查不得因无 authored view 或正式 view 未保留而 FAIL
- skill 投影与 Contract 对齐

**Non-Goals:**

- 不改 Browser / `sourceAuthoredViews`
- 不改 `candidate init` 复制策略
- 不加「view 是否可用」CLI，不把 view 引用降为 WARNING
- 不改 Graphviz 可渲染性

## Decisions

1. **完成门禁不含 Authored Views，保留四分区目录**  
   `views/` 仍由 init 创建，promote 仍整体替换。空目录合法。备选：从四分区语义里拿掉 views——破坏 Candidate 作为完整模型的存储形状。

2. **Decision Gate 不再因未决 View 选择阻塞编写**  
   View 可在模型完成后按情况处理。备选：仍把 View 放进依赖顺序但标为可选——Agent 仍会停下来问。

3. **不新增 CLI 门禁**  
   已有引用完整性足够。断裂引用的残留 view 仍挡 validate，这是模型自洽底线，不是「必须维护 view」。备选：引用失败降 WARNING——正式模型会脏。

4. **复制件不是起步建议**  
   `--from current` 磁盘上有 views 只是初始态。不建议先改复制件。`--from clean` 仍不继承正式 views。

5. **只改 `semantic-model-build` Contract + build skill**  
   `project-build-role` 的「完整 Candidate」跟随前者定义，不另写平行条款。

## Risks / Trade-offs

- [Risk] `--from current` 后换元素 identity、不删旧 view → validate 失败 → Mitigation：保持现有 ERROR；skill 写明非法引用必须删或改到自洽，不是要求写出新 view
- [Risk] promote 后正式模型没有 authored view，浏览器只剩 Full Model → Mitigation：接受；用户可事后补 `candidate/views/` 或另开 Build
- [Risk] Reviewer 仍按旧习惯把缺 views 打成 HIGH → Mitigation：Contract 与 skill 审查清单同时改，并加明确反例场景

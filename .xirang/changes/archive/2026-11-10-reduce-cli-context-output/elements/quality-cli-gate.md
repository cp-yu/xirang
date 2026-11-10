---
entity: element-declaration
identity: quality-cli-gate
kind: element
parent: quality
title: "Quality CLI Gate"
definition: "Quality CLI Gate 是 Quality 的确定性接口与门禁，负责在单一 JSON record 中记录 Review opinions、可选 Opt opinions 或明确不做 Opt 的处置及 Seal 声明，并校验 commit identity 和流程关联。它提供只读状态诊断与 Archive Seal commit 检查；不执行测试、不比较工作区新鲜度、不自动修改 tasks.md，也不判断是否值得 Opt 或是否需要 Opt 后 Review。"
---

## MODIFIED Sections

### Section: Status 输出语义

quality status SHALL 只读解析 v4 Quality JSON，按 reviewKind 报告当前 Review 结论及 commit 关联、同类失败是否已由不同 commit 上的通过意见解决、Opt 处置与 Seal。缺少通过的 full-change 或存在未解决失败时为 needs_review；通过完整 Review 但缺少 Opt 处置或 Seal 时为 needs_optimize；所有门禁通过且 Seal commit 有效时为 all_done。Status SHALL 不比较 HEAD/工作区；缺少记录时报告缺失及 revision 0，v3 或更旧格式不当作新意见。

默认结果 SHALL 包含当前 revision、当前门禁结论及具体缺口，不展开历史或完整 opinion 正文。quality status <change> --history SHALL 额外返回完整 Quality record；历史意见及已记录的处置 SHALL 不因默认输出精简而被删除。

- 两条历史意见最终形成有效 PASS：默认展示当前结论及关联 commit，--history 保留两条完整意见。
- 完整 Review 通过而 Opt 或 Seal 缺失：默认结果指出具体缺项，不回显既有 Review 的全部 findings。
- 记录无法解析或格式不受支持：非零退出并在 stderr 给出诊断，原记录保持不变。

### Section: 统一输出与诊断结构

所有 xirang quality 子命令 SHALL 将请求的结果写入 stdout，将警告和错误写入 stderr。写入成功 SHALL 只返回供后续 CAS 使用的新 revision，不回显提交的完整 opinion、Opt 或 Seal，也不附 ok 或通用 allowedNextOperations。

门槛或关联不满足 SHALL 以 exit 1 退出；输入形状非法 SHALL 以 exit 2 退出并使用 INVALID_INPUT。失败诊断 SHALL 保留稳定 code；适用的字段诊断 SHALL 包含 path、expected、actual 与 fix。--json 时 stderr SHALL 使用结构化 JSON。成功状态查询的待办缺口 SHALL 作为所请求的状态数据返回；命令执行失败不得伪装成空成功。

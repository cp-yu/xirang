## Context

OpenSpec 的生成管线通过 `src/core/templates/` 将模板编译为 `.claude/skills/*/SKILL.md` 和 `.claude/agents/*.md`。现有管线有 8 个共享片段常量定义在 `opsx-fragments.ts`，通过字符串插值注入 workflow 模板。所有片段都是操作性指令（怎么做），没有任何片段表达设计理念（为什么）。[INFERRED FROM CODE]

## Goals / Non-Goals

**Goals:**
- 定义一个表达 OPSX 编译哲学的共享片段（~15 行英文）
- 将片段注入 6 个 workflow skill 模板和 2 个 internal subagent 模板
- 编码排除名单和溢出裁决

**Non-Goals:**
- 不修改生成出的制品结构或 CLI 行为
- 不注入 feedback / verify-execution-model（非制品写作者也非执法者）
- 不影响用户自定义的 reference 文件

## Decisions

**片段落点：opsx-fragments.ts 新增常量**
- 与其他 8 个共享片段一致，通过 import + 字符串插值注入
- 片段语言为英文，不受 proseLanguage 投影管辖（片段是 agent 指令，非 artifact 正文）[INFERRED FROM CODE]

**注入 8 个目标面，排除 impact-sweeper**
- 6 个用户可调用 workflow skills + reviewer + optimizer
- impact-sweeper 只做只读报告，不写制品不判质量——注入是纯负载，违反理念自身的「无死代码」规则
- feedback 不写制品，verify-execution-model 是 12 行 helper 非模板

**放置位置：模板开头**
- 理念是世界观框架，应先于「怎么做」被读到；放尾部会沦为可忽略的附录 [INFERRED FROM CODE]

## Risks / Trade-offs

**行数溢出**：[Risk] 理念片段 ~15 行，最坏情况 apply-change 模板 159/200 行。未来若溢出 → 裁决写入上方注释：理念片段不可删减，压缩其他操作性内容。

**瀑布误读**：[Risk] 编译隐喻可能被误解为瀑布式僵化 → 片段内置迭代性澄清句（单次编译忠实确定，源码可自由迭代重编）。

**样板化**：[Risk] agent 可能当废话跳过 → 规则用 MUST 式可执行指令措辞，每条一行，不写散文。

**新 workflow 忘记注入**：[Risk] 未来新增模板可能忘记注入 → 依赖 per-template 测试惯例和 code review 把关；不建 manifest 遍历测试（YAGNI）。

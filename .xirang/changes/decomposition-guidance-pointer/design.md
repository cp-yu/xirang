## Context

当前 `decomposition` 是 `{method}|{skill}` tagged union（`src/core/project-config.ts` 的 `decompositionField`），共享片段 `STRUCTURAL_DECOMPOSITION_GUIDANCE`（`src/core/templates/fragments/xirang-fragments.ts`）以三分支文本表达读取规则。本会话实际观察到 Agent 在非默认分支下仍读取了未选择的 `.xirang/references/xirang-semantic-refinement.md`。项目 `proseLanguage` 为中文，但该 fragment 中英文混杂。含 union 的 v0.1.x 未推送 npm（npm 仅有 0.0.1/0.0.2），无流通中的旧格式配置。

## Goals / Non-Goals

**Goals:**
- Agent 侧指导读取收敛为单条无分支规则，消除形态判断与误读空间。
- `decomposition` 支持四种用户形态：单一名词、skill 名称（作为裸名称）、指向任意文件的路径、默认指导文件。
- 共享片段统一为英文单一语言，降低 LLM 上下文负担。
- 保持 CLI 配置加载与文件系统解耦（不查存在性），读取失败由消费端 fail-closed。

**Non-Goals:**
- 不提供旧 union 格式的迁移逻辑（无流通实例）。
- 不按项目配置定制受管生成面内容（生成面保持全项目共享）。
- 不新增工作流，不改变固定六工作流集合。
- 不改变 `SEMANTIC_REFINEMENT_REFERENCE` 的投递机制，仅更新其自述头。

## Decisions

1. **Schema 收敛为单字符串 + CLI 机械解析**：含 `/` 的值作为项目根相对路径原样保留；裸名称解析为 `.xirang/references/<值>`（不以 `.md` 结尾时补 `.md`）。解析在 loader/normalization 层完成，`config project --json` 直接输出解析后的路径字符串——形态判断是确定性函数而非 Agent 语义分支，Agent 指令保持单条规则。
2. **路径校验复用既有模式**：拒绝 posix/win32 绝对路径、反斜杠、`..` 穿越（同 `gitCommitMessagePathField`，`src/core/project-config.ts`）；裸名称限 `[A-Za-z0-9._-]+`。非法值 warning 后省略该字段，不回退默认，与现行非法 union 处理一致。
3. **默认值 `xirang-semantic-refinement.md`**：裸名称形态，解析后正中框架随附的 `.xirang/references/xirang-semantic-refinement.md`，无需新增交付物。
4. **排除裸名称触发 skill 调用**：按名称调用已安装 skill 会重新引入工具耦合（pi/claude 目录不同）与 fallback 分支；指向 skill 内容一律用路径形态（本仓库配置即为 `.pi/skills/xirang-project-decomposition/SKILL.md`）。
5. **片段文本英文单一语言**：四条 bullet——读 config 取 `decomposition` 值；按解析路径完整读取指导文件、缺失即停止不回退；指导只选分解维度不覆盖正式语义；单维度 MECE + BFS。一致性测试（`test/skills/semantic-model-consistency.test.ts`）改为钉「config 读取指令 + `decomposition` 值读取指令」的存在与顺序，不再钉 reference 路径字样。

## Risks / Trade-offs

- 任意路径形态允许 config 指向工具专属目录；这是用户显式选择而非框架推断，不违反「框架不推断工具专属路径」原则。
- 裸名称的 `.md` 补全是一处小约定：值已以 `.md` 结尾则不重复补；行为由持久测试锁定。
- 受影响 Element Contract 数量偏多（8 个），但语义均为「三分支路由收敛为单指针」，无新行为面。
- `xirang update` 遇到旧 union 残留值时按非法值 warning 并保留原样，不阻塞工具刷新。

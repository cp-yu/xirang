## Context

当前 `generateSubagentContent()` 的四个 renderer 无条件在 frontmatter 输出 `model` 行。`SubagentTemplate.model` 默认为 `'inherit'`，模板源代码中也硬编码了该值。这导致三个问题：

1. 生成的前置元数据中固定包含 `model: "inherit"`，工具侧（如 pi-subagents）检测到 `model` 已存在后跳过 settings 覆写
2. `openspec update` / `update --force` 全量覆盖 agent 文件，任何用户自定义 `model` 在下次 sync 时丢失
3. 模板中 `model: 'inherit'` 是无效默认值——它等同于"未设置"，不应出现在制品中

## Goals / Non-Goals

**Goals:**
- 模板不再携带 `model: 'inherit'` 默认值
- `generateSubagentContent()` 仅在 `model` 被显式设为非 `inherit` 值时输出该字段
- `update` / `update --force` 保留用户手设的 model 值

**Non-Goals:**
- 不改变 `SubagentTemplate` 接口定义——`model` 仍为可选字段
- 不在 `update` 时保留 `model` 以外的其他 frontmatter 字段
- 不提供 `config.yaml` 级别的 model 配置

## Decisions

### Decision 1: 在 writeSubagents 层做注入，不污染 generateSubagentContent 签名

**选择**：model 保留逻辑放在 `sync-engine.ts` 的 `writeSubagents()` 中，生成 content 后做字符串注入。

**备选方案**：在 `generateSubagentContent` 加 `modelOverride` 参数，贯穿到各 renderer。

**理由**：
- `generateSubagentContent` 是纯函数，职责是 "template → artifact content"
- 用户自定义 model 是持久化状态概念，属于 sync 逻辑而非生成逻辑
- 避免 API 膨胀：renderer 不需要感知 "已有文件中有个不同值" 这种状态

### Decision 2: 用 JSON.stringify 转义 model 值，不依赖 subagent-generation 的内部 helper

**选择**：在 `injectModelMarkdown` / `injectModelToml` 中使用 `JSON.stringify(model)`。

**理由**：
- model 值为 `provider/model-id` 格式，不含换行符等需要 YAML 特定转义的字符
- `escapeYamlString` / `escapeTomlString` 是 `subagent-generation.ts` 的内部函数，导出它们会增大模块表面积
- `JSON.stringify` 对双引号等字符的转义与 YAML/TOML 双引号字符串兼容

### Decision 3: `"inherit"` 作为 sentinel 值不保留

**选择**：当旧 agent 文件的 model 值为 `"inherit"` 时，视为 "未设置" 而非 "用户选择了 inherit"。

**理由**：
- `"inherit"` 是之前模板生成的默认值，不是用户主动选择的结果
- 保留 `"inherit"` 会导致与不写 model 行等价的行为变成不等价（写 `model: "inherit"` 仍会阻塞 settings override）
- 用户如果确实想设为 inherit，可以不写 model 字段（工具自身的默认行为就是 inherit）

## Risks / Trade-offs

- **风险**：字符串注入依赖 frontmatter 格式不变化。若未来 renderer 修改了描述行格式，`injectModelToml` 的 regex `/description\s*=\s*"[^"]*"\n/` 可能失效。
  - **缓解**：已通过 sync-engine 测试覆盖；格式变化时测试会先失败。

---
entity: element-declaration
identity: agent-workbench-projection
kind: element
parent: project-tooling-configuration
title: "Agent 工作面投影与同步"
definition: "Agent 工作面投影与同步是 CLI 中维护息壤托管的 Agent 工作面及其 instructions、templates 与 references 的能力。它通过共享 artifact sync engine 与 canonical workflow manifest 生成公共前置 skill、六个固定阶段 workflow skills 与 internal subagent artifacts，将共享片段与 references 物化到项目本地，并保证生成产物的行为等价与长度约束。"
---

## MODIFIED Sections

### Section: 物化共享片段与 references

Agent 工作面 SHALL 将 Philosophy、统一语义依据、identity 基本约束及阶段选择、加载复用规则交付于公共 skill；各阶段 skill 保留自身职责、执行顺序、关键门禁与按需入口。模型查询、语义写作与框架分解基础、具体分解方法及其创建、测试质量、配置、Design Record 与 Quality 的完整专项指导 SHALL 各有唯一维护位置，按需取得。配置选中方法的加载直接由阶段短入口完成；入口仅保留必要触发和定位信息，纯重复提醒不另设文件或反复引用。

用户只加载 common 后表达阶段意图时，Agent SHALL 读取相应阶段 skill；直接加载阶段 skill 时 SHALL 补齐缺少的 common，保留已选阶段，不循环加载。同一 Agent、同一项目中仍有效且可用的指导 SHALL 跨阶段复用；新 Agent、必要上下文丢失或指导更新时重新取得所需内容。公共 skill SHALL NOT 无条件预加载全部专项指导。

内置 references SHALL 物化于 `.xirang/references/` 这一唯一物理位置，各工具 skill 目录不含 references 子目录。跨工具 skill 文件由同一生成源投影，不独立维护规则副本。静态制品定义、写作指导、模板与配置消费规则 SHALL 使用单一受管来源，不同时交付 instructions 命令与 reference 两套提示词。动态配置、制品状态与质量详情 SHALL 分别通过 config project、status --change 与 quality status 获取；指导复用不替代 Record、模型、配置、Git 或 Quality 的适用状态检查。

- **共享引用**：update 按显式清单写入内置 references；阶段 skills 可达所需指导且不内联完整公共内容。
- **用户内容保留**：只逐文件更新清单内的受管文件，不进行目录级删除，不触碰用户文件。
- **按需复用**：Explore 后进入 Propose，仅补读新增需求；公共指导仍有效时不重读，指导失效时重新取得所需内容。

受管 reference 交付 SHALL 包含 semantic-authoring 中的框架基础、默认 semantic-refinement 和按需的 decomposition-authoring；更新 SHALL 停止生成和引用 xirang-decomposition-use.md，不新增自动删除既有旧文件的逻辑，也不保留旧入口或转发别名。项目方法、用户文件和显式 decomposition 值 SHALL 保留。Node.js path API SHALL 构建物理路径，macOS、Linux 与 Windows 的新指导定位结果一致。

- **更新既有工作区**：旧受管 decomposition-use 文件存在，项目另有自定义方法；刷新后旧文件未被本次更新删除、受管入口不再引用它，新指南可达，自定义方法和配置值不变。
- **Windows 工作区**：使用 Windows 物理路径进行同一更新，按显式名称定位新受管 reference，不依赖斜杠字符串拼接或文件名前缀推断所有权，旧文件未被本次更新删除。

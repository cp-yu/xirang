---
entity: element-declaration
identity: agent-workbench-projection
kind: element
parent: project-tooling-configuration
title: Agent 工作面投影与同步
definition: Agent 工作面投影与同步是 CLI 中维护息壤托管的 Agent 工作面及其 instructions、templates 与 references 的能力。它通过共享 artifact sync engine 与 canonical workflow manifest 生成公共前置 skill、六个固定阶段 workflow skills 与 internal subagent artifacts，将共享片段与 references 物化到项目本地，并保证生成产物的行为等价与长度约束。
---

## Specification

### Section: 使用共享生成引擎

Setup 和 update SHALL 使用 shared artifact sync engine 与 canonical workflow manifest 生成受管阶段 skills 与 internal subagent artifacts，并通过显式辅助 skill 登记交付 `xirang-common`。阶段工作流集合 SHALL 恰好包含 propose、explore、apply、archive、build 和 snack；common 是这些阶段的公共基础与用户入口，不增加阶段工作流。

公共 skill SHALL 随所交付的阶段 skills 可达，安装与更新使用同一受管清单。新增、覆盖、替换和删除 SHALL 按显式登记名称定位，保留用户文件，不按前缀或名称模式推断新文件的所有权。各工具路径 SHALL 来自现有工具元数据并由 Node.js path API 构建。

- **Setup/update parity**：同一工具配置下，两条路径均交付 common、六个阶段 skills 及适用的 internal agents，入口引用可解析。
- **Windows 路径**：Windows、macOS、Linux 上均能在所配置工具目录加载 common 及阶段 skills，平台分隔符不改变选择和补读行为。

### Section: 物化共享片段与 references

Agent 工作面 SHALL 将 Philosophy、统一语义依据、identity 基本约束及阶段选择、加载复用规则交付于公共 skill；各阶段 skill 保留自身职责、执行顺序、关键门禁与按需入口。模型查询、Definition/Contract 写作、结构分解、测试质量、配置、Design Record 与 Quality 的完整专项指导 SHALL 各有唯一维护位置，通过 references 按需读取。入口可保留触发条件和简短提醒，不重复承载完整规则。

用户只加载 common 后表达阶段意图时，Agent SHALL 读取相应阶段 skill；直接加载阶段 skill 时 SHALL 补齐缺少的 common，保留已选阶段，不循环加载。同一 Agent、同一项目中仍有效且可用的指导 SHALL 跨阶段复用；新 Agent、必要上下文丢失或指导更新时重新取得所需内容。公共 skill SHALL NOT 无条件预加载全部专项指导。

内置 references SHALL 物化于 `.xirang/references/` 这一唯一物理位置，各工具 skill 目录不含 references 子目录。跨工具 skill 文件由同一生成源投影，不独立维护规则副本。静态制品定义、写作指导、模板与配置消费规则 SHALL 使用单一受管来源，不同时交付 instructions 命令与 reference 两套提示词。动态配置、制品状态与质量详情 SHALL 分别通过 config project、status --change 与 quality status 获取；指导复用不替代 Record、模型、配置、Git 或 Quality 的适用状态检查。

- **共享引用**：update 按显式清单写入内置 references；阶段 skills 可达所需指导且不内联完整公共内容。
- **用户内容保留**：只逐文件更新清单内的受管文件，不进行目录级删除，不触碰用户文件。
- **按需复用**：Explore 后进入 Propose，仅补读新增需求；公共指导仍有效时不重读，指导失效时重新取得所需内容。

### Section: 保持生成产物行为等价

生成测试 SHALL 验证 manifest-derived projections 保持一致，且代表性 workflow/tool 组合的生成 skill artifacts 与已批准基线行为等价。

- **投影 parity 检查**

  - CI 运行模板生成测试
  - 检测缺失 exports 或缺失 workflow registration

### Section: 维护 internal subagent 制品

系统 SHALL 显式注册 `xirang-reviewer`、`xirang-optimizer` 与 `xirang-experimenter` 三个 internal subagents，并按工具原生格式渲染与写入 subagent artifacts。

- **显式注册三个 internal subagents**

  - 读取 internal subagent 模板常量
  - 只包含 `xirang-reviewer`、`xirang-optimizer` 与 `xirang-experimenter` 三个显式条目

- **写入路径遵循工具原生规范**

  - 为支持的工具生成 internal subagent artifact
  - 写入 `<projectRoot>/<agentsDir>/agents/<name>.<ext>`，不指向任何全局 agent 目录

### Section: 遵守生成行数约束

生成的 workflow `SKILL.md` 与 reference 文件 SHALL 分别不超过 200 行与 500 行。

- **超标报告**

  - 存在超标的 `SKILL.md` 或 reference 文件
  - 测试按文件分组报告变体、最大行数与超限行数，不汇总同一 skill 目录的总行数

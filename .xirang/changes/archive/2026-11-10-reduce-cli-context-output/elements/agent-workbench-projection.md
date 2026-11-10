---
entity: element-declaration
identity: agent-workbench-projection
kind: element
parent: project-tooling-configuration
title: "Agent 工作面投影与同步"
definition: "Agent 工作面投影与同步是 CLI 中维护息壤托管的 Agent 工作面及其 instructions、templates 与 references 的能力。它通过共享 artifact sync engine 与 canonical workflow manifest 生成六个固定 workflow skills 与 internal subagent artifacts，将共享片段与 references 物化到项目本地，并保证生成产物的行为等价与长度约束。"
---

## MODIFIED Sections

### Section: 物化共享片段与 references

Workflow skill 模板 SHALL 复用共享片段常量，并将长协议物化到 `.xirang/references/` 目录作为唯一物理位置；各工具 skill 目录 SHALL NOT 再包含 references 子目录。

- **update 物化全部内置 reference**

  - 用户在已配置工具的项目中运行 `xirang update`
  - `.xirang/references/` 包含全部模板声明的 reference 文件
  - 各工具 skill 目录不包含 references 子目录

- **前缀所有权边界**

  - update 写入 `.xirang/references/`
  - 只逐文件覆盖生成清单内的受管前缀文件，不执行目录级删除，不触碰用户文件

静态制品定义、写作指导、模板与配置遵循规则 SHALL 使用单一受管来源，按当前任务需要加载；不得同时维护 instructions 命令与 reference 两套提示词交付。动态配置、制品状态及质量详情 SHALL 分别通过 config project、status --change 与 quality status 获取。生成文件的新增、替换、删除 SHALL 由显式注册清单定位，不通过文件名模式猜测所有权；沿用既有受管前缀边界，用户文件不被覆盖。

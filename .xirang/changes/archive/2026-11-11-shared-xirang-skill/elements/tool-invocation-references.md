---
entity: element-declaration
identity: tool-invocation-references
kind: "element"
parent: "agent-tool-integration"
title: "Tool Invocation References"
definition: "Tool Invocation References 定义 workflow 引用在不同工具表面上的渲染规则：通过显式工具表面元数据渲染用户可调用 workflow 引用，缺少精确语法时使用中性 skill invocation 文案，不通过字符串猜测生成引用。"
---

## ADDED Sections

### Section: 公共 skill 与阶段 skill 的定位

系统 SHALL 通过显式登记的 skill 名称与工具路径元数据交付 common 与阶段 skills 的加载入口。Agent SHALL 使用所在工具已发现的 skill 位置，或生成面明确给出的路径读取指导，不猜测名称、目录或调用语法。common 路由使用显式阶段到 skill 的对应关系；阶段入口以显式 common 标识补齐依赖，已选阶段保持不变。

精确用户调用语法存在时 SHALL 按工具元数据呈现；缺少时使用含明确 skill 名称的中性加载文案。自然语言表达阶段意图不要求用户再输入工具调用语法。生成路径 SHALL 使用 Node.js path API；内置 reference 引用仍明确以 project root 为基准。

- **跨工具入口**：同一用户意图在各工具中定位对应 skill，补 common 后继续既定阶段。
- **Windows 路径**：Windows、macOS、Linux 上按工具目录元数据解析文件，路径分隔符不改变依赖加载结果。

---
entity: element-declaration
identity: project-tooling-configuration
kind: element
parent: cli
title: Project and Tooling Configuration
definition: Project and Tooling Configuration 是 CLI 中建立和维护息壤项目及其工具环境的能力。它通过相应 CLI commands 初始化和更新息壤工作区，读取和管理项目配置，选择、安装、刷新与同步 Agent 工具集成，并维护息壤托管的 Agent 工作面及其 instructions、templates 与 references。
---

## ADDED Sections

### Section: 投影共享 Design Record 协议

Project and Tooling Configuration SHALL 从 Xirang-owned 单一生成源向 Build、Explore、Propose 及共享 references 投影同版本 Design Record 协议与默认 semantic-refinement 指导，不运行时依赖用户级 problem-framing skill。受管生成面的新增、更新和删除 SHALL 按显式 manifest 名单定位，不按名称模式扫描替换；更名后不再投影的旧 Definition Framing reference SHALL 作为受管生成面被删除，用户专用拆分 skill 不受覆盖。

- **共享协议在三入口可用**

  - CLI 同步所选 Agent 工具集成
  - Build、Explore、Propose 指向同版本可达的 Design Record reference，入口包含适用的读取与重读条件。

- **旧受管 reference 被清理**

  - 工作区中存在由框架投影的旧 Definition Framing reference
  - 同步后该文件被删除，新 Design Record reference 可达，用户自有文件不受影响。

- **受管同步不覆盖用户内容**

  - 刷新受本 Change 影响的模板、reference 与生成面
  - 只按登记名单更新相关工作面，保留用户 skill 与未登记内容，不直接修改生成文件代替源模板。

## REMOVED Sections

### Section: 投影共享 Definition Framing 协议

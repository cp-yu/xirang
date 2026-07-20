## ADDED Requirements

### Requirement: arch preview 命令 SHALL 启动 LikeC4 web 服务器

`openspec arch preview` SHALL 启动 likec4 预览服务器，在浏览器中可视化架构。

#### Scenario: 启动预览服务器

- **WHEN** 运行 `openspec arch preview`
- **THEN** SHALL 调用 `npx likec4 start openspec/architecture/`
- **AND** SHALL 输出服务器地址（如 http://localhost:3000）
- **AND** 用户 SHALL 能在浏览器中查看交互式架构图

### Requirement: arch preview SHALL 支持 --port 选项

`--port` 选项 SHALL 指定预览服务器端口。

#### Scenario: 自定义端口

- **WHEN** 运行 `openspec arch preview --port 8080`
- **THEN** SHALL 在端口 8080 启动服务器
- **AND** SHALL 输出 http://localhost:8080

## MODIFIED Requirements

### Requirement: 6 个工作流架构
系统 SHALL 支持六个核心 workflows：`propose`、`explore`、`apply`、`archive`、`build`、`snack`，并 SHALL 使用 `opsx-build` 作为 Project Build skill surface。

#### Scenario: setup 安装六个 workflows
- **WHEN** 运行 `opsx setup`
- **THEN** SHALL 安装 `opsx-propose`、`opsx-explore`、`opsx-apply-change`、`opsx-archive-change`、`opsx-build`、`opsx-snack`
- **AND** SHALL NOT 安装 `opsx-bootstrap-arch`

#### Scenario: update 刷新六个 workflows
- **WHEN** 运行 `opsx update`
- **THEN** SHALL 刷新相同的六个 workflow skills
- **AND** SHALL 删除 managed `opsx-bootstrap-arch`

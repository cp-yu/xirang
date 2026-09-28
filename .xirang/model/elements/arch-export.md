---
entity: element-declaration
identity: arch-export
kind: element
parent: deterministic-operations
title: Arch Export
definition: Arch Export 定义 `xirang arch export` 的架构图导出行为：将模型可视化导出为 PNG/SVG/PDF 图片，并在输出目录不存在时自动创建。
---

## Specification

### Section: arch export 命令 SHALL 导出架构图

`xirang arch export` SHALL 将架构图导出为图片文件。

- **导出 PNG 格式**

  - 运行 `xirang arch export --format png --output docs/architecture/`
  - SHALL 调用导出命令并在 `docs/architecture/` 目录生成 PNG 文件
  - 输出路径 SHALL 使用 `path.join()` 构建

- **支持多种格式**

  - 运行 `xirang arch export --format svg --output docs/`
  - SHALL 支持 `--format` 选项值：png, svg, pdf

### Section: arch export SHALL 创建输出目录

如果输出目录不存在，SHALL 自动创建。

- **创建不存在的目录**

  - 输出目录不存在
  - 运行 `xirang arch export --output docs/architecture/`
  - SHALL 创建目录
  - SHALL 导出图片到该目录

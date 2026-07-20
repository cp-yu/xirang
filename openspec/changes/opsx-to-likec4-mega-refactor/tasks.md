# Implementation Tasks

## Task 1: 安装 LikeC4 依赖并创建基础架构

**Goal**: 建立 LikeC4 工具链和初始目录结构

**Files**:
- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `README.md`
- `docs/installation.md`
- `.devcontainer/README.md`
- `.github/workflows/opsx-v2-cross-platform.yml`
- `openspec/config.yaml`
- `openspec/architecture/specification.c4` (new)
- `openspec/architecture/views.c4` (new)
- `openspec/architecture/domains/` (new directory)

**Requirements**:
- 安装 likec4@1.59.0
- 将 package、文档、project context 与跨平台 CI 的最低 Node.js runtime 统一为 `>=22.22.3`
- 创建 architecture 目录结构
- 生成 specification.c4 和 views.c4 模板

**Checks**:

- [x] **依赖安装**
  - Command: `pnpm list likec4`
  - Expect: `likec4 1.59.0`

- [x] **Node.js runtime 合同一致**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "LikeC4 工具链 SHALL 使用兼容的 Node.js runtime"
  - Command: `node -e "const p=require('./package.json'); if (p.engines.node !== '>=22.22.3') process.exit(1)" && grep -q "22.22.3" README.md docs/installation.md .devcontainer/README.md .github/workflows/opsx-v2-cross-platform.yml openspec/config.yaml && echo "OK"`
  - Expect: `OK`

- [x] **目录结构创建**
  - Command: `test -d openspec/architecture && test -d openspec/architecture/domains && echo "OK"`
  - Expect: `OK`

- [x] **specification.c4 存在**
  - Command: `test -f openspec/architecture/specification.c4 && echo "OK"`
  - Expect: `OK`

- [x] **specification.c4 定义 element kinds**
  - Command: `grep -q "element domain" openspec/architecture/specification.c4 && grep -q "element capability" openspec/architecture/specification.c4 && echo "OK"`
  - Expect: `OK`

- [x] **specification.c4 定义 relationship kinds**
  - Command: `grep -q "relationship invokes" openspec/architecture/specification.c4 && grep -q "relationship consumes" openspec/architecture/specification.c4 && grep -q "relationship precedes" openspec/architecture/specification.c4 && echo "OK"`
  - Expect: `OK`

- [x] **views.c4 存在**
  - Command: `test -f openspec/architecture/views.c4 && echo "OK"`
  - Expect: `OK`

- [x] **LikeC4 验证通过**
  - Command: `npx likec4 validate openspec/architecture/`
  - Expect: 退出码 0

---

## Task 2: 实现 OPSX → LikeC4 转换器核心

**Goal**: 实现将 OPSX YAML 转换为 LikeC4 DSL 的核心逻辑

**Files**:
- `src/migration/converters/opsx-to-likec4.ts` (new)
- `src/migration/converters/types.ts` (new)
- `src/migration/converters/element-mapper.ts` (new)
- `src/migration/converters/relation-mapper.ts` (new)
- `tests/unit/migration/opsx-to-likec4.test.ts` (new)

**Requirements**:
- 读取 OPSX 两文件模型
- 转换 domains 为 LikeC4 domain elements
- 转换 capabilities 为嵌套 capability elements
- 转换 relations（belongs_to 除外）
- 保留所有 metadata

**Checks**:

- [x] **转换器读取 OPSX 模型**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "迁移命令 SHALL 读取 OPSX 两文件模型"
  - Command: `pnpm test -- opsx-to-likec4.test.ts -t "should read complete OPSX model"`
  - Expect: 测试通过

- [x] **Domain 转换保留 metadata**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "转换 SHALL 保留所有 metadata"
  - Command: `pnpm test -- opsx-to-likec4.test.ts -t "should convert domain with intent and boundary"`
  - Expect: 测试通过

- [x] **Capability 嵌套在 domain 内**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "Domain 文件 SHALL 包含嵌套的 capabilities"
  - Command: `pnpm test -- opsx-to-likec4.test.ts -t "should nest capabilities in domain"`
  - Expect: 测试通过

- [x] **belongs_to 通过嵌套表达**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "Domain 文件 SHALL 包含嵌套的 capabilities"
  - Command: `pnpm test -- opsx-to-likec4.test.ts -t "should skip belongs_to relation"`
  - Expect: 测试通过

- [x] **其他 relations 正确转换**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "转换 SHALL 映射 semantic relations"
  - Command: `pnpm test -- opsx-to-likec4.test.ts -t "should convert invokes relation"`
  - Expect: 测试通过

- [x] **Cross-domain relations 使用全限定名**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "转换 SHALL 映射 semantic relations"
  - Command: `pnpm test -- opsx-to-likec4.test.ts -t "should use qualified names for cross-domain relations"`
  - Expect: 测试通过

---

## Task 3: 实现 LikeC4 多文件生成器

**Goal**: 生成 specification.c4、domains/*.c4、views.c4 文件

**Files**:
- `src/migration/generators/likec4-file-generator.ts` (new)
- `src/migration/generators/specification-generator.ts` (new)
- `src/migration/generators/domain-file-generator.ts` (new)
- `src/migration/generators/project-file-generator.ts` (new)
- `src/migration/generators/relation-file-generator.ts` (new)
- `src/migration/generators/views-generator.ts` (new)
- `src/migration/generators/formatting-utils.ts` (new)
- `tests/unit/migration/likec4-generator.test.ts` (new)

**Requirements**:
- 生成 specification.c4 内容
- 为每个 domain 生成独立的 .c4 文件
- 生成 views.c4 内容
- 使用 path.join() 构建所有路径

**Checks**:

- [x] **生成有效的 specification.c4**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "Specification 文件 SHALL 定义 element 和 relationship kinds"
  - Command: `pnpm test -- likec4-generator.test.ts -t "should generate valid specification"`
  - Expect: 测试通过

- [x] **每个 domain 生成独立文件**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "迁移 SHALL 生成 LikeC4 多文件结构"
  - Command: `pnpm test -- likec4-generator.test.ts -t "should generate domain file with proper nesting"`
  - Expect: 测试通过

- [x] **生成 views.c4**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "迁移 SHALL 生成基础 views"
  - Command: `pnpm test -- likec4-generator.test.ts -t "should generate views with index view"`
  - Expect: 测试通过

- [x] **跨平台路径处理**
  - Covers: migrate-opsx-to-likec4.md
  - Command: `pnpm test -- likec4-generator.test.ts -t "should use path.join for all paths"`
  - Expect: 测试通过

---

## Task 4: 实现 specs 路径推断

**Goal**: 自动推断 capability 关联的 spec 文件路径

**Files**:
- `src/migration/utils/spec-path-inference.ts` (new)
- `tests/unit/migration/spec-path-inference.test.ts` (new)

**Requirements**:
- 推断旧格式 spec.md
- 推断新格式多个 .md 文件
- 处理不存在的 spec 目录
- 使用 path.join() 构建路径

**Checks**:

- [x] **推断旧格式 spec.md**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "转换 SHALL 推断 specs 路径"
  - Command: `pnpm test -- spec-path-inference.test.ts -t "should find old format spec.md"`
  - Expect: 测试通过

- [x] **推断新格式多文件**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "转换 SHALL 推断 specs 路径"
  - Command: `pnpm test -- spec-path-inference.test.ts -t "should find new format multiple md files"`
  - Expect: 测试通过

- [x] **不存在时返回空数组**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "转换 SHALL 推断 specs 路径"
  - Command: `pnpm test -- spec-path-inference.test.ts -t "should return empty array if spec dir does not exist"`
  - Expect: 测试通过

---

## Task 5: 实现迁移 CLI 命令

**Goal**: 实现 `openspec migrate opsx-to-likec4` 命令

**Files**:
- `src/commands/migrate/index.ts` (new)
- `src/commands/migrate/opsx-to-likec4.ts` (new)
- `src/migration/migration-verifier.ts` (new)
- `src/cli/index.ts` (modify, command registration)
- `test/integration/migrate-command.test.ts` (new)
- `test/unit/migration/migration-verifier.test.ts` (new)

**Requirements**:
- 读取 OPSX 模型
- 调用转换器和生成器
- 支持 --dry-run 模式
- 支持 --agent-verify 模式
- 验证生成的 LikeC4 模型
- 保留原始文件为 .backup

**Checks**:

- [x] **迁移完整项目结构**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "迁移 SHALL 生成 LikeC4 多文件结构"
  - Command: `pnpm test -- migrate-command.test.ts -t "should migrate complete project structure"`
  - Expect: 测试通过

- [x] **生成的模型通过 likec4 验证**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "迁移 SHALL 验证生成的 LikeC4 模型"
  - Command: `pnpm test -- migrate-command.test.ts -t "should generate valid LikeC4 model"`
  - Expect: 测试通过

- [x] **dry-run 不写入文件**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "迁移命令 SHALL 支持 dry-run 模式"
  - Command: `pnpm test -- migrate-command.test.ts -t "should handle dry-run without writing files"`
  - Expect: 测试通过

- [x] **保留原始文件为 backup**
  - Covers: migrate-opsx-to-likec4.md
  - Verifies: "迁移 SHALL 保留原始 OPSX 文件为 backup"
  - Command: `pnpm test -- migrate-command.test.ts -t "should preserve original OPSX as backup"`
  - Expect: 测试通过


---

## Task 6: 实现 LikeC4 读取器

**Goal**: 实现读取和解析 LikeC4 多文件模型的工具

**Files**:
- `src/utils/likec4-reader.ts` (new)
- `src/utils/likec4-parser.ts` (new)
- `src/utils/architecture-reader.ts` (new)
- `test/unit/utils/likec4-reader.test.ts` (new)

**Requirements**:
- 读取 specification.c4
- 读取所有 domains/*.c4 文件
- 读取 views.c4
- 解析 elements 和 relationships
- 提供统一的 Architecture 接口
- 支持回退到 OPSX YAML（过渡期）

**Checks**:

- [x] **读取多文件 LikeC4 模型**
  - Command: `pnpm test -- likec4-reader.test.ts -t "should read multi-file LikeC4 model"`
  - Expect: 测试通过

- [x] **解析 element 定义**
  - Command: `pnpm test -- likec4-reader.test.ts -t "should parse element definitions"`
  - Expect: 测试通过

- [x] **解析 relationship 定义**
  - Command: `pnpm test -- likec4-reader.test.ts -t "should parse relationships"`
  - Expect: 测试通过

- [x] **回退到 OPSX YAML**
  - Command: `pnpm test -- architecture-reader.test.ts -t "should fallback to OPSX when LikeC4 not present"`
  - Expect: 测试通过

---

## Task 7: 实现 OpenSpec 语义验证器

**Goal**: 实现 LikeC4 模型的 OpenSpec 特有语义检查

**Files**:
- `src/utils/architecture-validator.ts` (new)
- `src/utils/semantic-checks/ownership-validator.ts` (new)
- `src/utils/semantic-checks/cycle-detector.ts` (new)
- `src/utils/semantic-checks/metadata-validator.ts` (new)
- `tests/unit/utils/architecture-validator.test.ts` (new)

**Requirements**:
- 检查 ownership cardinality（每个 capability 恰好一个 domain）
- 检测 precedes cycle
- 验证 metadata 完整性
- 检查 specs 路径存在性
- 提供结构化错误输出

**Checks**:

- [x] **检测缺失 ownership**
  - Covers: likec4-semantic-validator.md
  - Verifies: "语义验证器 SHALL 检查 ownership cardinality"
  - Command: `pnpm test -- architecture-validator.test.ts -t "should detect missing ownership"`
  - Expect: 测试通过

- [x] **检测 precedes cycle**
  - Covers: likec4-semantic-validator.md
  - Verifies: "验证器 SHALL 检测 precedes cycle"
  - Command: `pnpm test -- architecture-validator.test.ts -t "should detect precedes cycle"`
  - Expect: 测试通过

- [x] **检查 specs 路径存在性**
  - Covers: likec4-semantic-validator.md
  - Verifies: "验证器 SHALL 检查 metadata 完整性"
  - Command: `pnpm test -- architecture-validator.test.ts -t "should check spec file existence"`
  - Expect: 测试通过

- [x] **返回结构化验证结果**
  - Covers: likec4-semantic-validator.md
  - Verifies: "验证器 SHALL 提供结构化错误输出"
  - Command: `pnpm test -- architecture-validator.test.ts -t "should return structured validation result"`
  - Expect: 测试通过

---

## Task 8: 实现 arch 命令组

**Goal**: 实现 `openspec arch` 命令组（query, validate, preview, export）

**Files**:
- `src/commands/arch/index.ts` (new)
- `src/commands/arch/query.ts` (new)
- `src/commands/arch/validate.ts` (new)
- `src/commands/arch/preview.ts` (new)
- `src/commands/arch/export.ts` (new)
- `src/commands/arch/runner.ts` (new)
- `src/cli/index.ts` (modify, command registration)
- `tests/integration/arch-command.test.ts` (new)

**Requirements**:
- arch query: 查询 elements 和 relations
- arch validate: LikeC4 + OpenSpec 语义验证
- arch preview: 启动 likec4 预览服务器
- arch export: 导出架构图
- arch query 与 arch validate 支持 --json 输出（preview/export Specs 未声明 JSON contract）

**Checks**:

- [x] **arch query 查询 element**
  - Covers: arch-query-command.md
  - Verifies: "arch query 命令 SHALL 查询 LikeC4 element 详情"
  - Command: `pnpm test -- arch-command.test.ts -t "should query element by ID"`
  - Expect: 测试通过

- [x] **arch query --relations**
  - Covers: arch-query-command.md
  - Verifies: "arch query SHALL 支持 --relations 选项"
  - Command: `pnpm test -- arch-command.test.ts -t "should query element with relations"`
  - Expect: 测试通过

- [x] **arch validate 验证模型**
  - Covers: arch-validate-command.md
  - Verifies: "arch validate 命令 SHALL 验证 LikeC4 语法"
  - Command: `pnpm test -- arch-command.test.ts -t "should validate architecture"`
  - Expect: 测试通过

- [x] **arch validate 补充语义检查**
  - Covers: arch-validate-command.md
  - Verifies: "arch validate SHALL 补充 OpenSpec 语义验证"
  - Command: `pnpm test -- arch-command.test.ts -t "should perform semantic validation"`
  - Expect: 测试通过

- [x] **arch preview 启动服务器**
  - Covers: arch-preview-command.md
  - Verifies: "arch preview 命令 SHALL 启动 LikeC4 web 服务器"
  - Command: `pnpm test -- arch-command.test.ts -t "should start preview server"`
  - Expect: 测试通过

- [x] **arch export 导出图片**
  - Covers: arch-export-command.md
  - Verifies: "arch export 命令 SHALL 导出架构图"
  - Command: `pnpm test -- arch-command.test.ts -t "should export diagrams"`
  - Expect: 测试通过

---

## Task 9: 更新 init 命令生成 LikeC4 结构

**Goal**: 修改 `openspec init` 生成 LikeC4 架构目录而非 OPSX YAML

**Files**:
- `src/commands/init.ts` (modify)
- `tests/integration/init-command.test.ts` (modify)

**Requirements**:
- 创建 openspec/architecture/ 目录
- 生成 specification.c4 模板
- 生成 views.c4 模板
- 不再生成 project.opsx.yaml

**Checks**:

- [x] **init 生成 LikeC4 目录**
  - Covers: init-project-structure.md
  - Verifies: "init SHALL 生成 LikeC4 架构目录"
  - Command: `pnpm test -- init-command.test.ts -t "should generate LikeC4 architecture structure"`
  - Expect: 测试通过

- [x] **init 不生成 OPSX YAML**
  - Covers: init-project-structure.md
  - Verifies: "init SHALL 生成 LikeC4 架构目录"
  - Command: `pnpm test -- init-command.test.ts -t "should not generate OPSX YAML files"`
  - Expect: 测试通过

---

## Task 10: 更新 validate 命令支持 LikeC4

**Goal**: 修改 `openspec validate` 支持验证 LikeC4 模型和 architecture-delta.c4

**Files**:
- `src/commands/validate.ts` (modify)
- `src/core/validation/validator.ts` (modify LikeC4-first frontmatter validation; remove orphan legacy validator)
- `src/commands/help.ts` (modify active authoring topic)
- `src/cli/index.ts` (modify validation help)
- `src/validation/architecture-delta-validator.ts` (new)
- `schemas/spec-driven/schema.yaml` (modify active artifact graph)
- `schemas/spec-driven/templates/architecture-delta.c4` (new)
- `schemas/spec-driven/templates/opsx-delta.yaml` (delete)
- `schemas/spec-driven/templates/proposal.md` (modify LikeC4 headings)
- `src/core/relations/renderers.ts` (modify generated file registry)
- `test/integration/validate-command.test.ts` (modify)
- `test/commands/validate.test.ts` (modify)
- `test/core/validation.cross-check.test.ts` (modify LikeC4-only frontmatter coverage)
- `test/core/validation.test.ts` (modify orphan validator coverage removal)
- `test/commands/help.test.ts` (modify)
- `test/commands/artifact-workflow.test.ts` (modify)
- `test/core/artifact-graph/` (modify active artifact graph coverage)
- `test/core/relations/renderers.test.ts` (verify generated registry)

**Requirements**:
- 检测 LikeC4 架构存在时验证
- 验证 change 中的 architecture-delta.c4
- 调用 arch validate 逻辑
- 检查 extend 目标存在

**Checks**:

- [x] **validate 验证 LikeC4 模型**
  - Covers: validate-change.md
  - Verifies: "validate change SHALL 支持 architecture-delta.c4"
  - Command: `pnpm test -- validate-command.test.ts -t "should validate LikeC4 architecture"`
  - Expect: 测试通过

- [x] **validate 验证 delta 文件**
  - Covers: validate-change.md
  - Verifies: "validate change SHALL 支持 architecture-delta.c4"
  - Command: `pnpm test -- validate-command.test.ts -t "should validate architecture-delta.c4"`
  - Expect: 测试通过

- [x] **validate 检查 extend 目标**
  - Covers: validate-change.md
  - Verifies: "Delta 验证 SHALL 检查 extend 目标存在"
  - Command: `pnpm test -- validate-command.test.ts -t "should check extend target exists"`
  - Expect: 测试通过

---

## Task 11: 实现 architecture-delta.c4 合并器

**Goal**: 实现将 architecture-delta.c4 合并到 formal LikeC4 模型的逻辑

**Files**:
- `src/utils/architecture-delta-merger.ts` (new)
- `src/utils/likec4-writer.ts` (new)
- `test/unit/utils/architecture-delta-merger.test.ts` (new)

**Requirements**:
- 解析 architecture-delta.c4
- 合并新 capabilities 到对应 domain 文件
- 合并新 relations 到 canonical `openspec/architecture/relations.c4`
- 更新 specs 路径（change-local → formal）
- 原子性事务（成功或回滚）

**Checks**:

- [x] **合并新 capability**
  - Covers: architecture-delta-artifact.md
  - Verifies: "Delta 合并 SHALL 原子性更新 formal 模型"
  - Command: `pnpm test -- architecture-delta-merger.test.ts -t "should merge new capability to domain file"`
  - Expect: 测试通过

- [x] **合并新 relations**
  - Covers: architecture-delta-artifact.md
  - Verifies: "Delta 合并 SHALL 原子性更新 formal 模型"
  - Command: `pnpm test -- architecture-delta-merger.test.ts -t "should merge new relations"`
  - Expect: 测试通过

- [x] **更新 specs 路径**
  - Covers: archive-sync-workflow.md
  - Verifies: "sync SHALL 合并 architecture-delta.c4"
  - Command: `pnpm test -- architecture-delta-merger.test.ts -t "should update specs paths to formal"`
  - Expect: 测试通过

- [x] **失败时回滚**
  - Covers: architecture-delta-artifact.md
  - Verifies: "Delta 合并 SHALL 原子性更新 formal 模型"
  - Command: `pnpm test -- architecture-delta-merger.test.ts -t "should rollback on failure"`
  - Expect: 测试通过


---

## Task 12: 更新 sync 和 archive 流程

**Goal**: 修改 sync 和 archive 使用 architecture-delta.c4

**Files**:
- `src/commands/sync.ts` (modify)
- `src/core/change-sync.ts` (modify)
- `src/core/archive.ts` (modify)
- `test/commands/sync.test.ts` (modify)
- `test/core/archive.test.ts` (modify)
- `test/integration/sync-workflow.test.ts` (modify)
- `test/integration/archive-workflow.test.ts` (modify)

**Requirements**:
- sync 调用 delta merger 合并 architecture-delta.c4
- archive 删除 architecture-delta.c4
- 不再处理 opsx-delta.yaml

**Checks**:

- [x] **sync 合并 architecture-delta**
  - Covers: archive-sync-workflow.md
  - Verifies: "sync SHALL 合并 architecture-delta.c4"
  - Command: `pnpm test -- sync-workflow.test.ts -t "should merge architecture-delta.c4"`
  - Expect: 测试通过

- [x] **sync 移动 change-local specs**
  - Covers: archive-sync-workflow.md
  - Verifies: "sync SHALL 合并 architecture-delta.c4"
  - Command: `pnpm test -- sync-workflow.test.ts -t "should move change-local specs to formal"`
  - Expect: 测试通过

- [x] **archive 删除 delta 文件**
  - Covers: archive-sync-workflow.md
  - Verifies: "archive SHALL 删除 architecture-delta.c4"
  - Command: `pnpm test -- archive-workflow.test.ts -t "should delete architecture-delta.c4"`
  - Expect: 测试通过

---

## Task 13: 更新 propose skill

**Goal**: 更新 openspec-propose skill 指导生成 architecture-delta.c4

**Files**:
- `src/core/templates/workflows/propose.ts` (modify, authoritative template)
- `.pi/skills/openspec-propose/` (regenerate)
- `openspec/references/likec4-authoring.md` (new)
- `test/core/templates/propose-template.test.ts` (modify)
- `test/core/templates/skill-templates-parity.test.ts` (modify)

**Requirements**:
- 指导生成 architecture-delta.c4 而非 opsx-delta.yaml
- 提供 LikeC4 DSL 语法参考
- 提供 extend 语法示例
- 提供 relationship kinds 选择指导
- 创建完整的 likec4-authoring.md 参考文档

**Checks**:

- [x] **Skill 指导生成 LikeC4 delta**
  - Covers: openspec-propose-skill.md
  - Verifies: "propose skill SHALL 生成 architecture-delta.c4"
  - Evidence: `.pi/skills/openspec-propose/SKILL.md` 包含 "architecture-delta.c4" 指令
  - Command: `grep -q "architecture-delta.c4" .pi/skills/openspec-propose/SKILL.md && echo "OK"`
  - Expect: `OK`

- [x] **Skill 提供 extend 语法示例**
  - Covers: openspec-propose-skill.md
  - Verifies: "propose skill SHALL 生成 architecture-delta.c4"
  - Evidence: Skill 包含 extend 语法示例
  - Command: `grep -q "extend" .pi/skills/openspec-propose/SKILL.md && echo "OK"`
  - Expect: `OK`

- [x] **参考文档存在**
  - Covers: openspec-propose-skill.md
  - Evidence: 创建了 likec4-authoring.md
  - Command: `test -f openspec/references/likec4-authoring.md && echo "OK"`
  - Expect: `OK`

- [x] **参考文档包含 relationship kinds**
  - Covers: openspec-propose-skill.md
  - Verifies: "propose skill SHALL 指导 relationship 类型选择"
  - Command: `grep -q "relationship invokes" openspec/references/likec4-authoring.md && grep -q "relationship precedes" openspec/references/likec4-authoring.md && echo "OK"`
  - Expect: `OK`

---

## Task 14: 更新 apply skill

**Goal**: 更新 openspec-apply skill 指导读取 LikeC4 上下文

**Files**:
- `src/core/templates/workflows/apply-change.ts` (modify, authoritative template)
- `src/core/templates/fragments/opsx-fragments.ts` (modify shared LikeC4 context)
- `.pi/skills/openspec-apply-change/` (regenerate)
- `openspec/references/openspec-apply-step-1-preparation.md` (regenerate)
- `test/core/templates/apply-change.test.ts` (modify final-file parity)
- `test/core/templates/skill-templates-parity.test.ts` (modify)

**Requirements**:
- 指导使用 openspec arch query 读取架构
- 指导理解伪代码中的 LikeC4 element IDs
- 要求架构优先的实现流程

**Checks**:

- [x] **Skill 指导使用 arch query**
  - Covers: openspec-apply-skill.md
  - Verifies: "apply skill SHALL 读取 LikeC4 架构上下文"
  - Evidence: Skill 包含 "openspec arch query" 指令
  - Command: `grep -q "openspec arch query" .pi/skills/openspec-apply-change/SKILL.md && echo "OK"`
  - Expect: `OK`

- [x] **Skill 说明 element IDs**
  - Covers: openspec-apply-skill.md
  - Verifies: "apply skill SHALL 指导理解伪代码"
  - Evidence: Skill 解释 LikeC4 element ID 格式
  - Command: `grep -q "element ID" .pi/skills/openspec-apply-change/SKILL.md && echo "OK"`
  - Expect: `OK`

---

## Task 15: 更新 bootstrap skill

**Goal**: 重命名和更新 openspec-bootstrap-opsx 为 openspec-bootstrap-arch

**Files**:
- `src/core/templates/workflows/bootstrap-arch.ts` (rename from `bootstrap-opsx.ts`, authoritative template)
- `src/core/templates/workflows/bootstrap-opsx.ts` (delete legacy template)
- `src/core/command-generation/types.ts` (modify workflow metadata)
- `src/core/templates/manifest/registry.ts` (modify)
- `src/core/templates/skill-templates.ts` (modify)
- `src/core/workflow-surface.ts` (modify as required by manifest types)
- `src/core/init.ts` (modify workflow guidance)
- `src/core/workflow-installation.ts` (modify workflow resolution)
- `src/core/templates/sync-engine.ts` (modify bootstrap workspace detection)
- `src/core/shared/skill-generation.ts` (modify stale skill cleanup)
- `.pi/skills/openspec-bootstrap-arch/` (regenerate)
- `.pi/skills/openspec-bootstrap-opsx/` (delete generated legacy skill)
- `test/core/templates/manifest/registry.test.ts` (modify)
- `test/core/templates/manifest.test.ts` (modify)
- `test/core/templates/bootstrap-arch.test.ts` (new)
- `test/core/templates/bootstrap-opsx.test.ts` (delete)
- `test/core/shared/skill-generation.test.ts` (modify)
- `test/core/shared/tool-detection.test.ts` (modify)
- `test/core/templates/skill-templates-parity.test.ts` (modify)
- `test/core/update.test.ts` (modify)
- `test/core/workflow-installation.test.ts` (modify)
- `test/core/workflow-surface.test.ts` (modify)
- `test/core/init.test.ts` (modify)
- 相关文档中的引用

**Requirements**:
- 重命名 skill 文件
- 更新指导输出 LikeC4 候选模型
- 更新所有文档引用

**Checks**:

- [x] **Skill 文件已重命名**
  - Covers: openspec-bootstrap-opsx.md
  - Verifies: "Bootstrap skill 名称 SHALL 改为 bootstrap-arch"
  - Command: `test -f .pi/skills/openspec-bootstrap-arch/SKILL.md && echo "OK"`
  - Expect: `OK`

- [x] **旧 skill 已删除**
  - Covers: openspec-bootstrap-opsx.md
  - Command: `test ! -f .pi/skills/openspec-bootstrap-opsx/SKILL.md && echo "OK"`
  - Expect: `OK`

- [x] **Skill 指导生成 LikeC4**
  - Covers: openspec-bootstrap-opsx.md
  - Verifies: "Bootstrap SHALL 输出 LikeC4 候选模型"
  - Command: `grep -q ".c4" .pi/skills/openspec-bootstrap-arch/SKILL.md && echo "OK"`
  - Expect: `OK`

---

## Task 16: 更新 impact-sweeper 使用 arch query

**Goal**: 修改 impact-sweeper 使用 arch query 导航架构

**Files**:
- `src/core/templates/workflows/impact-sweeper.ts` (modify, authoritative template)
- `src/core/templates/workflows/archive-change.ts` (modify active LikeC4 archive guidance)
- `src/core/templates/workflows/explore.ts` (modify active LikeC4 guidance)
- `src/core/templates/workflows/optimizer.ts` (modify active LikeC4 guidance)
- `src/core/templates/workflows/reviewer.ts` (modify active LikeC4 guidance)
- `src/core/templates/workflows/snack.ts` (modify active LikeC4 guidance)
- `.pi/agents/` (regenerate managed agents)
- `.pi/skills/` (regenerate managed skills)
- `.codex/agents/openspec-reviewer.toml` (regenerate reviewer fixture)
- `.claude/agents/openspec-reviewer.md` (regenerate reviewer fixture)
- `openspec/references/` (regenerate managed shared references)
- `test/core/templates/impact-sweeper-template.test.ts` (modify final-file parity)
- `test/core/templates/reviewer-template.test.ts` (modify reviewer contract)
- `test/core/templates/explore-template.test.ts` (modify LikeC4 guidance)
- `test/core/templates/snack-template.test.ts` (modify LikeC4 guidance)
- `test/core/templates/fragments/opsx-fragments.test.ts` (modify architecture fragments)
- `test/core/shared/subagent-generation.test.ts` (modify)
- `test/skills/` (modify generated reviewer/optimizer assertions)

**Requirements**:
- 指导使用 openspec arch query
- 报告中使用 LikeC4 element IDs

**Checks**:

- [x] **Sweeper 使用 arch query**
  - Covers: openspec-impact-sweeper.md
  - Verifies: "Impact sweeper SHALL 使用 LikeC4 导航架构"
  - Command: `grep -q "openspec arch query" .pi/agents/openspec-impact-sweeper.md && echo "OK"`
  - Expect: `OK`

---

## Task 17: 迁移 OpenSpec 自身架构

**Goal**: 使用迁移工具将 OpenSpec 项目自身迁移到 LikeC4

**Files**:
- `openspec/architecture/` (new, 替代 project.opsx.yaml；包含 self-host target-state reconciliation)
- `openspec/changes/opsx-to-likec4-mega-refactor/architecture-delta.c4` (new)
- `openspec/project.opsx.yaml` (delete after migration)
- `openspec/project.opsx.relations.yaml` (delete after migration)
- `openspec/project.opsx.yaml.backup` (renamed)
- `openspec/project.opsx.relations.yaml.backup` (renamed)

**Requirements**:
- 运行 openspec migrate opsx-to-likec4
- Agent 验证迁移结果
- 验证 LikeC4 模型
- 保留 OPSX 为 backup

**Checks**:

- [x] **运行迁移命令**
  - Command: `openspec migrate opsx-to-likec4`
  - Expect: 退出码 0，输出中的 domains、capabilities、relations 数量与迁移前 OPSX 源模型一致

- [x] **LikeC4 目录存在**
  - Command: `test -d openspec/architecture && test -d openspec/architecture/domains && echo "OK"`
  - Expect: `OK`

- [x] **生成的模型验证通过**
  - Command: `npx likec4 validate openspec/architecture/`
  - Expect: 退出码 0

- [x] **OpenSpec 语义验证通过**
  - Command: `openspec arch validate`
  - Expect: 退出码 0

- [x] **所有 domains 已迁移**
  - Command: `node -e "const fs=require('node:fs');const path=require('node:path');const yaml=require('yaml');const source=yaml.parse(fs.readFileSync(path.join('openspec','project.opsx.yaml.backup'),'utf8'));const actual=fs.readdirSync(path.join('openspec','architecture','domains')).filter(name=>name.endsWith('.c4')).length;if(actual!==source.domains.length){throw new Error('domain count mismatch: '+actual+' != '+source.domains.length)}console.log(actual)"`
  - Expect: 输出迁移后的 domain 文件数，且与 backup OPSX 的 domain 数量相等

- [x] **OPSX 文件保留为 backup**
  - Command: `test -f openspec/project.opsx.yaml.backup && test -f openspec/project.opsx.relations.yaml.backup && echo "OK"`
  - Expect: `OK`

---

## Task 18: 自举测试 - OpenSpec 继续开发自己

**Goal**: 验证迁移后 OpenSpec 能使用 LikeC4 模型继续开发自己

**Files**:
- 无新文件，验证现有功能

**Requirements**:
- 构建成功
- 测试通过
- validate 通过
- 能创建测试 change

**Checks**:

- [x] **构建成功**
  - Command: `pnpm run build`
  - Expect: 退出码 0

- [x] **测试通过**
  - Command: `pnpm test`
  - Expect: 退出码 0

- [x] **validate 全部通过**
  - Command: `openspec validate --all`
  - Expect: 退出码 0

- [x] **能创建测试 change**
  - Command: `openspec new change "test-likec4-bootstrap" && test -d openspec/changes/test-likec4-bootstrap && echo "OK"`
  - Expect: `OK`

- [x] **arch query 可用**
  - Command: `openspec arch query cap.ai.skill-generation`
  - Expect: 退出码 0，输出包含 "Element: cap.ai.skill-generation"

- [x] **arch preview 可启动**
  - Command: `timeout 5 openspec arch preview || echo "OK"`
  - Expect: 输出包含 "localhost" 或超时（正常，说明服务器启动）

- [x] **清理测试 change**
  - Command: `rm -rf openspec/changes/test-likec4-bootstrap && echo "OK"`
  - Expect: `OK`

---

## Task 19: 更新文档

**Goal**: 更新所有相关文档反映 LikeC4 架构

**Files**:
- `AGENTS.md` (modify)
- `README.md` (modify)
- `docs/` (modify LikeC4-first guidance; legacy OPSX docs explicitly deprecated)
- `openspec/references/likec4-authoring.md` (new)

**Requirements**:
- 更新 AGENTS.md: Specs + LikeC4 为语义源码
- 创建 architecture-integration.md
- 创建 migration-guide.md
- 更新命令文档
- 更新 README

**Checks**:

- [x] **AGENTS.md 更新**
  - Evidence: AGENTS.md 提及 LikeC4
  - Command: `grep -q "LikeC4" AGENTS.md && echo "OK"`
  - Expect: `OK`

- [x] **架构集成文档存在**
  - Command: `test -f docs/architecture-integration.md && echo "OK"`
  - Expect: `OK`

- [x] **迁移指南存在**
  - Command: `test -f docs/migration-guide.md && echo "OK"`
  - Expect: `OK`

- [x] **commands.md 包含 arch 命令**
  - Command: `grep -q "openspec arch" docs/commands.md && echo "OK"`
  - Expect: `OK`

---

## Task 20: 标记遗留代码为 deprecated

**Goal**: 标记 OPSX YAML 相关代码为 deprecated，但暂不删除

**Files**:
- `src/utils/opsx-utils.ts` (modify)
- `src/commands/opsx.ts` (retain deprecated compatibility command)
- `src/commands/arch/` (new LikeC4 command group)
- `src/commands/migrate/` (new migration command group)
- `src/migration/` (new migration implementation)
- `src/utils/semantic-checks/` (new LikeC4 semantic checks)
- `src/validation/` (new architecture delta validation)
- `test/unit/` (new migration, parser, validator, merger tests)
- `test/integration/` (new architecture, migration, sync, archive, validation tests)
- `test/performance/` (new migration performance test)
- `tests/` (new E2E scripts)
- `src/commands/bootstrap.ts` (retain deprecated compatibility command)
- `src/utils/bootstrap-utils.ts` (retain deprecated compatibility implementation)
- `.github/workflows/opsx-v2-cross-platform.yml` (legacy compatibility CI)
- `test/utils/bootstrap-utils.pbt.contract.test.ts` (deprecated compatibility contract)
- `test/utils/opsx-utils.integration-bootstrap.test.ts` (deprecated compatibility contract)
- 其他 OPSX 相关文件

**Requirements**:
- 添加 @deprecated 注释
- 更新调用处显示 deprecation 警告
- 不删除代码（保留 1 个月）

**Checks**:

- [x] **opsx-utils 标记 deprecated**
  - Evidence: 函数包含 @deprecated JSDoc
  - Command: `grep -q "@deprecated" src/utils/opsx-utils.ts && echo "OK"`
  - Expect: `OK`

- [x] **architecture-reader 优先使用 LikeC4**
  - Evidence: readArchitecture 先检查 LikeC4
  - Command: `grep -A 5 "readArchitecture" src/utils/architecture-reader.ts | grep -q "likec4" && echo "OK"`
  - Expect: `OK`

---

## Task 21: Windows CI 验证

**Goal**: 在 Windows 环境验证所有路径处理正确

**Files**:
- `.github/workflows/test-windows.yml` (new or modify)

**Requirements**:
- 在 Windows runner 运行测试
- 验证迁移命令
- 验证 arch 命令
- 验证路径使用 path.join()

**Checks**:

- [x] **Windows CI 配置存在**
  - Command: `test -f .github/workflows/test-windows.yml && echo "OK"`
  - Expect: `OK`

- [x] **Windows 测试通过**
  - Evidence: GitHub Actions run `29740790823`, job `88346829738`, head `d6d12012`, conclusion `success`
  - Command: `gh run view 29740790823 --repo cp-yu/opsx --json conclusion,headSha,jobs,url`
  - Expect: `conclusion` 为 `success`，`likec4` job 在 `windows-latest` 完成

---

## Task 22: 集成测试和性能测试

**Goal**: 端到端集成测试和性能基准测试

**Files**:
- `tests/e2e/bootstrap-test.sh` (new)
- `test/performance/large-project.test.ts` (new; Vitest includes `test/**/*.test.ts`)

**Requirements**:
- 完整自举流程测试
- 大规模项目性能测试（1000+ capabilities）

**Checks**:

- [x] **自举测试脚本存在**
  - Command: `test -f tests/e2e/bootstrap-test.sh && echo "OK"`
  - Expect: `OK`

- [x] **自举测试通过**
  - Command: `bash tests/e2e/bootstrap-test.sh`
  - Expect: 退出码 0，输出 "Bootstrap Test PASSED"

- [x] **性能测试通过**
  - Command: `pnpm test -- large-project.test.ts`
  - Expect: 测试通过，迁移 1000 capabilities < 60秒

---

## Remediation

- [x] [code_fix] Windows CI verification：GitHub-hosted Windows run `29740790823` / job `88346829738` 在 implementation head `d6d12012` 通过。
- [x] [code_fix] Relation visibility：reader 读取 standalone `relations.c4`，migrated-model query E2E 通过。
- [x] [code_fix] Arch query contract：已实现 bounded traversal、depth annotation、text/JSON fields 与 missing-element coverage。
- [x] [code_fix] Agent verification：`--agent-verify` 已比较 domains、capabilities、relations、metadata 并持久化 structured report。
- [x] [artifact_fix] Migration report freshness：`migration-report.json` 已声明 immutable pre-formal-reconciliation baseline，只证明 OPSX source 与即时生成 LikeC4 等价。
- [x] [code_fix] Ownership cardinality：已检测 canonical capabilityId 多 domain 重复与 precedes self-loop。
- [x] [code_fix] Change validation：已复用 native LikeC4 delta validation，并移除 active OPSX delta fallback。
- [x] [code_fix] Delta transaction：已实现 post-merge native validation、multi-file rollback、deterministic relation ordering 与 injected failure test。
- [x] [artifact_fix] Bootstrap boundary：change-local Spec 仅修改 managed `bootstrap-arch` skill；legacy `openspec bootstrap` CLI 按 Task 20 保留一个月并明确 deprecated，不属于 active workflow。
- [x] [artifact_fix] Change architecture source：已用 `architecture-delta.c4` 替换 `opsx-delta.yaml`，native/change validation 通过。
- [x] [code_fix] Migration layout：domain filename 使用 kebab-case，`project.c4` 持久化 project intent/metadata。
- [x] [artifact_fix] Arch JSON scope：已按 Specs 将 JSON contract 收敛到 query/validate。
- [x] [artifact_fix] Sweeper evidence：已修正为 `.pi/agents/openspec-impact-sweeper.md` 并重跑生成证据。
- [x] [code_fix] Active legacy guidance：managed workflows/sync 已 LikeC4-only；legacy reader/bootstrap CLI 仅保留 deprecated migration compatibility。
- [x] [artifact_fix] Files attribution：已补充 CLI registration、init、workflow resolution、stale cleanup、runner 与 generators。
- [x] [artifact_fix] Relation ownership：统一 delta Specs 与 Design 2 的 canonical standalone `relations.c4` contract，并复验 migration/sync。
- [x] [code_fix] Agent verification completeness：将 CLI/Pi orchestration 边界写入 source，并覆盖 domain/capability/relation 全量 metadata 比较。
- [x] [code_fix] Spec-driven architecture artifact：将 active schema、templates、instructions、validation scope 从 `opsx-delta` 迁移到 `architecture-delta`。
- [x] [code_fix] Active authoring help：仅暴露 `architecture-delta.c4` 为 active architecture artifact topic，并增加 legacy OPSX topic absence assertion。
- [x] [code_fix] Generated workflow references：重生成 apply preparation 与 impact evidence protocol，并增加 final project-root parity coverage。
- [x] [artifact_fix] Formal architecture reconciliation：formal LikeC4 source 已声明 modified LikeC4-first capabilities 与 deprecated retained OPSX capabilities；LikeC4 property-level extend 限制已记录于 design.md。
- [x] [artifact_fix] Complete Files attribution：已为 intended templates、generated references、docs、tests、migration、CLI、validation remediation 与 compatibility paths 补齐 task ownership。
- [x] [code_fix] Cross-stage sync rollback：完整快照 architecture files，并在后续 Specs 写失败时恢复旧文件、删除新文件，增加 injected failure integration test。
- [x] [artifact_fix] Active documentation reconciliation：校准 `docs/cli.md` 与 `docs/migration-guide.md` 的 architecture delta、sync/archive flags 和 bootstrap-arch LikeC4 语义。
- [x] [code_fix] Legacy validator residue：已删除无 production caller 的 `validateOpsxDelta`、独占 imports 与仅维护孤儿 API 的测试。
- [x] [artifact_fix] Formal active relation cleanup：formal graph 已无 active-source → deprecated-target relation；deprecated compatibility 子图保留，formal/delta validation 通过。
- [x] [code_fix] LikeC4-first frontmatter validation：active capability existence 校验通过 formal LikeC4 metadata 读取，不再调用 legacy `readProjectOpsx`。
- [x] [code_fix] Synced architecture pending detection：完整比较 domain/capability metadata、正规化 specs 路径与 relation description；碰撞 delta 保持 pending，成功 merge 后 E2E 可正常 archive。


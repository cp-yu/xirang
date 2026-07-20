## Context

当前 OpenSpec 使用两个 YAML 文件表达架构：`openspec/project.opsx.yaml` 定义 project、domains、capabilities；`openspec/project.opsx.relations.yaml` 定义 semantic relations。这种格式缺少直观的可视化和时间维度呈现。

现有约束：
- OpenSpec 自举：项目用 OpenSpec 开发自己，迁移过程必须保持可用
- 通用性：迁移工具需要适用于所有 OpenSpec 项目
- 跨平台：所有路径操作必须使用 `path.join()` 而非硬编码斜杠

技术栈：TypeScript + Node.js (≥20.19.0) + ESM + pnpm + Commander.js

## Goals / Non-Goals

**Goals:**
- 用 LikeC4 DSL 完全替代 OPSX YAML 作为架构源码
- 提供可视化架构图和数据流视图
- 在 specs 中支持伪代码引用 LikeC4 element IDs
- 保持 OpenSpec 自举能力（迁移后继续开发自己）
- 提供通用迁移工具给所有 OpenSpec 项目
- Agent 能生成和理解 LikeC4 模型

**Non-Goals:**
- 强制重组现有 specs 为 requirement-level 文件（可选，新 change 采用新格式）
- 支持 OPSX YAML 和 LikeC4 长期并存（仅迁移期间短暂共存）
- 向后兼容旧的 `opsx-delta.yaml` 格式
- 提供 GUI 架构编辑器

## Decisions

### Decision 1: LikeC4 完全替代 OPSX YAML（而非投影层）

**选择**：方案 A - LikeC4 作为架构源码，废弃 OPSX YAML

**替代方案**：
- 方案 B：保留 OPSX YAML 为源，LikeC4 作为只读视图
- 方案 C：混合模型（LikeC4 结构 + YAML 语义）

**理由**：
- 避免维护双向映射的复杂度
- LikeC4 DSL 表达力足够承载 OPSX 语义
- 可视化优先的理念：架构即图
- 通过自定义 validator 补偿 LikeC4 原生验证的不足

**权衡**：
- 失去 OPSX validator 的部分严格语义保证 → 缓解：自定义 `openspec arch validate` 补充检查
- 依赖相对较新的 LikeC4 工具 → 缓解：锁定版本 1.59.0，提供回退工具

### Decision 2: 多文件结构按 domain 组织

**选择**：
```
openspec/architecture/
├── specification.c4       # Element/relationship kinds
├── domains/
│   ├── ai-integration.c4
│   ├── apply.c4
│   └── ...
└── views.c4
```

**替代方案**：
- 单文件：所有架构在一个 `architecture.c4`
- 按层级：context.c4, containers.c4, components.c4

**理由**：
- Git diff 更清晰：改动一个 domain 不影响其他文件
- 并行编辑：多个 domain 可同时修改
- 符合 domain 边界的架构原则

**实现细节**：
- 每个 domain 文件包含该 domain 内部的 capabilities 和 internal relations
- Cross-domain relations 写在源 domain 文件中（from 所在的 domain）
- 使用 `path.join('openspec', 'architecture', 'domains', `${kebabCase(domainId)}.c4`)` 生成路径

### Decision 3: belongs_to 通过嵌套隐式表达

**选择**：Capability 嵌套在 domain 内部，而非显式 `belongs_to` relationship

```likec4
model {
  my_domain = domain 'My Domain' {
    my_capability = capability 'My Capability' {
      // Implicitly: my_capability belongs_to my_domain
    }
  }
}
```

**理由**：
- LikeC4 原生支持嵌套表达 containment
- 视觉上更直观：层次结构一目了然
- 避免冗余：每个 capability 必须且只能属于一个 domain

**验证**：自定义 validator 检查每个 capability 恰好在一个 domain 内嵌套

### Decision 4: Semantic relations 映射

| OPSX Relation | LikeC4 Representation | 说明 |
|---------------|----------------------|------|
| `belongs_to` | 嵌套结构 | 隐式 |
| `invokes` | `A -> B 'invokes'` | 主动调用 |
| `consumes` | `A -> B 'consumes'` | 消费输出或合同 |
| `precedes` | `A -> B 'precedes'` | 时序依赖，用于数据流视图 |
| `constrains` | `A -> B 'constrains'` | 约束限制 |
| `validates` | `A -> B 'validates'` | 有效性判定 |

**Note 字段处理**：OPSX relation 的 `note` 映射为 LikeC4 relationship 的 `description`

### Decision 5: Specs 路径自动推断

**选择**：迁移工具自动推断 specs 路径，写入 LikeC4 metadata

**推断逻辑**：
1. 尝试 `openspec/specs/${kebabCase(capabilityId)}/spec.md`（旧格式）
2. 尝试 `openspec/specs/${kebabCase(capabilityId)}/*.md`（新格式，多文件）
3. 不存在则返回空数组

**权衡**：
- 推断可能不准确（spec 文件夹名与 capability ID 不匹配） → 缓解：validate 时检查引用完整性
- 显式声明更可靠 → 但增加迁移负担，采用自动推断 + 人工验证的策略

### Decision 6: Agent 验证流程

**选择**：迁移后 Agent 逐一验证每个 domain 和 capability

**验证清单**（由 `openspec-verify-migration` skill 执行）：
1. 结构完整性：所有 domains/capabilities 已迁移
2. Relations 正确性：数量、类型、方向一致
3. Metadata 完整性：intent、boundary、specs 路径保留
4. 语义一致性：ownership 正确、无 precedes cycle

**生成对比报告**：
```typescript
interface MigrationReport {
  summary: {
    domains: { original: number; migrated: number };
    capabilities: { original: number; migrated: number };
    relations: { original: number; migrated: number };
  };
  issues: Array<{
    severity: 'error' | 'warning';
    category: 'missing' | 'incorrect' | 'incomplete';
    description: string;
  }>;
}
```

### Decision 7: CLI 并行支持策略

**选择**：迁移完成前，同时支持 OPSX YAML 和 LikeC4

**实现**：
```typescript
export async function readArchitecture(projectRoot: string): Promise<Architecture> {
  const likec4Path = path.join(projectRoot, 'openspec', 'architecture');
  if (existsSync(likec4Path)) {
    return await readLikeC4Architecture(likec4Path);
  }
  
  const opsxPath = path.join(projectRoot, 'openspec', 'project.opsx.yaml');
  if (existsSync(opsxPath)) {
    console.warn('Using legacy OPSX YAML. Run: openspec migrate opsx-to-likec4');
    return await readOpsxArchitecture(projectRoot);
  }
  
  throw new Error('No architecture model found');
}
```

**时机**：Phase 4 CLI 适配期间实现，Phase 6 清理时移除 OPSX YAML 分支

### Decision 8: Precedes relations 用于数据流

**选择**：使用 `precedes` relationship 标注执行顺序，在专门的 flow view 中可视化

**示例**：
```likec4
model {
  // 空间关系
  task_executor -> reviewer 'invokes'
  
  // 时间关系
  task_executor -> reviewer 'precedes' {
    description 'Phase 0 完成后才能进入 Phase 1'
    metadata {
      phase_transition 'phase0_to_phase1'
      gate_condition 'all tasks completed'
    }
  }
}

views {
  view execution_flow {
    title 'Apply Execution Flow'
    include task_executor, reviewer, optimizer
    include * .precedes *
    exclude * .invokes *
    autoLayout TopBottom
  }
}
```

**验证**：自定义 validator 检测 precedes cycle 并报错（precedes 必须是 DAG）

### Decision 9: Specs 伪代码支持

**选择**：Specs 可包含伪代码引用 LikeC4 element IDs，但不强制

**格式**：
```markdown
#### Scenario: 完整执行流程

**调用序列**（伪代码）：
```pseudocode
apply.master_agent.start() {
  apply.task_executor.execute_all_tasks()
  
  if all_completed:
    verify.reviewer.review()  // task_executor precedes reviewer
}
```
```

**约定**：
- Element ID 使用 `domain_name.capability_name` 形式
- 伪代码块必须标注语言为 `pseudocode`
- Agent 不验证伪代码语法，仅作为可读文档

## Risks / Trade-offs

### Risk 1: LikeC4 生态成熟度

**风险**：LikeC4 是相对较新的工具，可能遇到未知限制或 breaking changes

**缓解措施**：
- 锁定版本：`likec4@1.59.0`
- 本地工具链：通过 `openspec arch` 封装，不依赖全局安装
- 撤退路径：保留 `openspec migrate likec4-to-opsx` 逆向转换能力（Phase 6 实现）
- 监控上游：订阅 likec4 GitHub releases

### Risk 2: 语义映射不完全

**风险**：LikeC4 的 relationship 语义比 OPSX 的 6 种 relations 更弱

**缓解措施**：
- 自定义 validator：在 `openspec arch validate` 中实现额外检查
  - Ownership cardinality：每个 capability 恰有一个 domain
  - Precedes cycle 检测
  - Note 长度限制（保持与 OPSX 一致）
- Metadata 约定：在 LikeC4 metadata 中保留关键语义信息

### Risk 3: 自举失败

**风险**：OpenSpec 迁移后无法继续开发自己

**缓解措施**：
- 阶段性验证：每个 Phase 完成后立即运行 `npm run build && npm test`
- 回滚点：每个 Phase 创建 git tag
- 并行支持：Phase 4-5 期间同时支持 OPSX 和 LikeC4
- 快速原型：在正式迁移前用小项目验证完整流程

### Risk 4: Agent 学习曲线

**风险**：Agent 需要学习 LikeC4 DSL，可能生成错误的 .c4 文件

**缓解措施**：
- 丰富参考文档：`openspec/references/likec4-authoring.md` 提供详细示例
- 模板和示例：在 propose skill 中内嵌常见模式
- 自动验证：propose 生成后立即运行 `npx likec4 validate`
- 错误翻译：将 likec4 验证错误转换为 Agent 友好的提示

### Risk 5: 迁移工具 bug

**风险**：自动转换可能有 bug，导致数据丢失或错误映射

**缓解措施**：
- Agent 逐一验证：`--agent-verify` 选项
- Diff 报告：生成详细的迁移对比报告
- Dry-run 模式：强制先 `--dry-run`，人工检查后再正式迁移
- 保留原始文件：默认不删除 OPSX YAML，创建 `.backup`

### Trade-off 1: 可视化 vs. 语义严格性

**得**：
- 直观的图形化架构视图
- Web 预览和 PNG 导出
- 更人性化的 DSL

**失**：
- 失去 OPSX validator 的部分语义保证
- 需要自行实现额外验证逻辑

**决策**：可接受，通过自定义 validator 补偿

### Trade-off 2: 单一源 vs. 多文件结构

**得**：
- Git diff 更清晰
- 并行编辑不冲突

**失**：
- 需要多个文件才能理解完整架构
- Cross-domain relations 分散

**决策**：可接受，Git diff 优势更重要

### Trade-off 3: 自动推断 vs. 显式声明

**得**：
- 减少迁移手工配置

**失**：
- 推断可能不准确

**决策**：可接受，validate 时检查引用完整性

## Migration Plan

### Phase 1: 基础设施准备

1. 安装 likec4 依赖
2. 创建 `openspec/architecture/` 目录结构
3. 编写初始 `specification.c4` 模板
4. 配置 likec4 验证

**验证**：`npx likec4 validate openspec/architecture/`

### Phase 2: 通用迁移工具开发

1. 实现 OPSX → LikeC4 转换器
2. 实现多文件生成器
3. 实现 specs 路径推断
4. 实现 CLI 命令：`openspec migrate opsx-to-likec4`

**验证**：迁移后模型通过 `npx likec4 validate`

### Phase 3: Agent 验证工作流

1. 创建 `openspec-verify-migration` skill
2. 实现验证清单和对比报告
3. 测试 Agent 逐一验证流程

**验证**：Agent 能发现迁移问题并生成报告

### Phase 4: CLI 和工作流适配

**P0 关键命令**：
1. `openspec validate` 支持 LikeC4 验证
2. `openspec init` 生成 LikeC4 结构
3. `openspec arch query/validate/preview/export`

**并行支持**：`readArchitecture()` 同时支持 OPSX 和 LikeC4

**验证**：所有 CLI 命令在 LikeC4 项目中正常工作

### Phase 5: Agent Skills 更新

**P0 关键 Skills**：
1. `openspec-propose`：生成 `architecture-delta.c4`
2. `openspec-apply`：读取 LikeC4 上下文

**Reference 文档**：
- `openspec/references/likec4-authoring.md`

**验证**：Agent 能正确生成和理解 LikeC4

### Phase 6: 文档与清理

1. 更新 `AGENTS.md`
2. 创建 `docs/architecture-integration.md`
3. 更新所有相关文档
4. 清理遗留代码（标记 deprecated）
5. 配置 CI 集成

**验证**：文档完整，CI 通过

### Rollback Strategy

- 每个 Phase 完成后创建 git tag：`git tag migration-phaseN-complete`
- 出现问题时回滚：`git reset --hard migration-phase{N-1}-complete`
- 保留 OPSX YAML 作为 `.backup` 至少 1 个月

### Success Criteria

迁移成功当且仅当：
- OpenSpec 自身能用新模型继续开发（自举测试通过）
- 所有 domains、capabilities、relations 完整迁移
- `openspec validate --all` 通过
- `openspec arch validate` 通过
- `npx likec4 validate` 通过
- `npx likec4 start` 能预览完整架构
- 数据流视图正确显示 precedes relations

## Open Questions

无。所有关键设计决策已在 Design Summary 阶段确认。

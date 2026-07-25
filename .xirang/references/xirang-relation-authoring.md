# Xirang Relation Authoring

## 选择规则

1. 所有 relation endpoint 都引用持久化 element；无法解析 endpoint 时不创建 relation。
2. 主动触发执行使用 `invokes`；创建或发布目标 element 使用 `produces`。
3. 只读取数据、配置、制品或合同使用 `consumes`。
4. 正确性要求先后顺序使用 `precedes`；规则限制目标行为使用 `constrains`；判定目标有效性使用 `validates`。
5. 无法精确分类时不创建 relation，记录 review gap。

## Note policy

所有 relation 的 `note` 可选且最多 200 字符，不得承载路径、symbol 清单或替代 relation type。

## invokes

- Direction: caller → callee
- Endpoints: generic → element
- Meaning: 调用方主动触发被调用方执行。
- Use when: 一个 element 在运行时主动调用另一个 element。
- Do not use when: 仅消费数据、配置、制品或合同而不主动触发执行。
- Propagation: 调用方变化需验证被调用方合同；被调用方变化需验证调用方。
- Note: 可选，最多 200 字符，只解释非显而易见的交互条件。

```yaml
  from: element.cli.sync
  type: invokes
  to: element.xirang.merge
```

## produces

- Direction: producer → output
- Endpoints: generic → element
- Meaning: 生产方创建或发布目标 element 表示的数据、事件、制品或合同。
- Use when: 交互核心是创建或发布目标 element。
- Do not use when: 目标只是被读取、调用或按时序排列。
- Propagation: 输出合同变化需验证生产方和消费者。
- Note: 可选，最多 200 字符，只解释非显而易见的交互条件。

```yaml
  from: element.change.apply
  type: produces
  to: element.architecture.delta
```

## consumes

- Direction: consumer → provider
- Endpoints: generic → element
- Meaning: 消费方读取提供方的数据、配置、制品或合同。
- Use when: 交互核心是读取或依赖提供内容。
- Do not use when: 消费方主动触发提供方执行。
- Propagation: 提供方合同变化需验证消费方。
- Note: 可选，最多 200 字符，只解释非显而易见的交互条件。

```yaml
  from: element.cli.help
  type: consumes
  to: element.architecture.model
```

## precedes

- Direction: earlier → later
- Endpoints: generic → element
- Meaning: 前置 element 必须先于后续 element 完成。
- Use when: 执行顺序是正确性合同。
- Do not use when: 顺序只是实现偶然或性能偏好。
- Propagation: 任一阶段变化需验证相邻时序合同。
- Note: 可选，最多 200 字符，只解释非显而易见的交互条件。

```yaml
  from: element.change.verify
  type: precedes
  to: element.change.archive
```

## constrains

- Direction: constraint owner → constrained element
- Endpoints: generic → element
- Meaning: 约束拥有方限制目标 element 的合法行为。
- Use when: 存在独立且稳定的行为约束。
- Do not use when: 仅表示调用、数据消费或执行顺序。
- Propagation: 约束变化需验证受约束方，受约束方变化需复核约束。
- Note: 可选，最多 200 字符，只解释非显而易见的交互条件。

```yaml
  from: element.config.schema
  type: constrains
  to: element.config.load
```

## validates

- Direction: validator → subject
- Endpoints: generic → element
- Meaning: 验证方判定目标 element 或其输出是否有效。
- Use when: 交互结果是明确的有效性判定。
- Do not use when: 仅运行测试、调用目标或消费其输出。
- Propagation: 目标合同变化需验证验证方覆盖，验证规则变化需复核目标。
- Note: 可选，最多 200 字符，只解释非显而易见的交互条件。

```yaml
  from: element.validation.xirang
  type: validates
  to: element.xirang.merge
```

## 非法用法

- 不使用 compatibility alias 或模糊通用边。
- 不存储反向重复边。
- 不把 import/call 自动提升为架构 relation。
- containment 表达 refinement，不复制为 semantic relation。

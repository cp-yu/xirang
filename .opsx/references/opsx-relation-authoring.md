# OPSX Relation Authoring

## 选择规则

1. capability 的架构归属使用 `belongs_to`。
2. 主动触发执行使用 `invokes`；只读取数据、配置、制品或合同使用 `consumes`。
3. 正确性要求先后顺序使用 `precedes`；规则限制目标行为使用 `constrains`；判定目标有效性使用 `validates`。
4. 无法精确分类时不创建 relation，记录 review gap。

## Note policy

`belongs_to` 禁止 `note`。其他 relation 的 `note` 可选且最多 200 字符，不得承载路径、symbol 清单或替代 relation type。

## belongs_to

- Direction: capability → domain
- Endpoints: capability → domain
- Meaning: 声明 capability 的唯一 domain 归属。
- Use when: 记录 capability 的架构所有权。
- Do not use when: 表达调用、消费、时序、约束或验证。
- Propagation: 仅提供 domain context，不传播变更影响。
- Note: 禁止。

```yaml
  from: cap.cli.help
  type: belongs_to
  to: dom.cli
```

## invokes

- Direction: caller → callee
- Endpoints: capability → capability
- Meaning: 调用方主动触发被调用方执行。
- Use when: 一个 capability 在运行时主动调用另一个 capability。
- Do not use when: 仅消费数据、配置或合同而不主动触发执行。
- Propagation: 调用方变化需验证被调用方合同；被调用方变化需验证调用方。
- Note: 可选，最多 200 字符，只解释非显而易见的交互条件。

```yaml
  from: cap.cli.sync
  type: invokes
  to: cap.opsx.merge
```

## consumes

- Direction: consumer → provider
- Endpoints: capability → capability
- Meaning: 消费方读取提供方的数据、配置、制品或合同。
- Use when: 交互核心是读取或依赖提供内容。
- Do not use when: 消费方主动触发提供方执行。
- Propagation: 提供方合同变化需验证消费方。
- Note: 可选，最多 200 字符，只解释非显而易见的交互条件。

```yaml
  from: cap.cli.help
  type: consumes
  to: cap.opsx.relations
```

## precedes

- Direction: earlier → later
- Endpoints: capability → capability
- Meaning: 前置 capability 必须先于后续 capability 完成。
- Use when: 执行顺序是正确性合同。
- Do not use when: 顺序只是实现偶然或性能偏好。
- Propagation: 任一阶段变化需验证相邻时序合同。
- Note: 可选，最多 200 字符，只解释非显而易见的交互条件。

```yaml
  from: cap.change.verify
  type: precedes
  to: cap.change.archive
```

## constrains

- Direction: constraint owner → constrained capability
- Endpoints: capability → capability
- Meaning: 约束拥有方限制目标 capability 的合法行为。
- Use when: 存在独立且稳定的行为约束。
- Do not use when: 仅表示调用、数据消费或执行顺序。
- Propagation: 约束变化需验证受约束方，受约束方变化需复核约束。
- Note: 可选，最多 200 字符，只解释非显而易见的交互条件。

```yaml
  from: cap.config.schema
  type: constrains
  to: cap.config.load
```

## validates

- Direction: validator → subject
- Endpoints: capability → capability
- Meaning: 验证方判定目标 capability 或其输出是否有效。
- Use when: 交互结果是明确的有效性判定。
- Do not use when: 仅运行测试、调用目标或消费其输出。
- Propagation: 目标合同变化需验证验证方覆盖，验证规则变化需复核目标。
- Note: 可选，最多 200 字符，只解释非显而易见的交互条件。

```yaml
  from: cap.validation.opsx
  type: validates
  to: cap.opsx.merge
```

## 非法用法

- 不使用 compatibility alias 或模糊通用边。
- 不存储反向重复边。
- 不把 import/call 自动提升为架构 relation。

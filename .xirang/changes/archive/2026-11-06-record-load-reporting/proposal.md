## Why

Design Record 的现行协议规定了完整读取、状态检查和局部更新，但没有要求新对话载入后向用户同步已确认内容与待决问题；同时，成功状态和机制性字段容易被误报，而漂移或无效状态需要明确呈现。

## What Changes

- 为 Explore、Build、Propose 统一定义记录载入、同对话更新及异常状态的用户呈现规则。
- 移除用户摘要中的记录版本与机械计数，但保留 CLI 版本输出和 Agent 内部校验用途。
- 修正现有 Explore Summary 关于向用户交付核对版本的要求。

## Source Impact

### Behavior Source

#### New Specs

- None

#### Modified Specs

- `design-record`：新增记录载入与重载的用户对齐行为，并调整写入后的报告内容。
- `explore`：修改记录型 Design Summary 的用户呈现内容。
- `design-exploration`：移除 Design Summary 必须向用户交付 sourceVersion 的要求。
- `explore-role`：修改向 Propose 交付 Summary 与记录溯源信息的要求。

### Architecture Source

#### Added Elements

- None

#### Modified Elements

- None

#### Removed Elements

- None

#### Architecture Relations

- None

## Impact

- 更新共享 Design Record reference 生成源及其 Build、Explore、Propose 工作流入口说明。
- 更新四个受影响 Element Contract 的 Semantic Delta。
- 调整现有 Design Record reference 投影测试，只验证必要的协议行为与门禁，不锁定解释性措辞。
- CLI JSON 输出与 `xirang record` 命令行为不变。

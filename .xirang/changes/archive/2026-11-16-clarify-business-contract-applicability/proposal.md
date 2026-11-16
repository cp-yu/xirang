## Why

默认 Kind 未声明业务规格格式时，Agent 可能直接编写自由形式的 Contract，跳过 4+N 标准；CLI 按显式 Kind 声明校验，无法替代前置语义判断。需要让 Agent 先识别 business-specification Contract，再处理 Kind 与格式，覆盖由 Project Root 直接承载业务承诺的简单项目。

## What Changes

- 在探索或编写 Contract 前判断业务规格适用性，既有业务格式声明仍触发标准加载。
- 明确可更新既有 Kind 或声明合适的 Kind；Root 可以直接承载 business-specification Contract，通用概念与组织性 Element 保留格式豁免。
- 落实已逐处确认的四处提示词修改，统一相关自然语言术语，并刷新对应受管工作面。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `business-specification-standard`：前置适用性判断、Kind 处理、Root 边界与标准加载入口。
- `authoring-conventions`：在共享写作指导层表达适用性判断及不同类型 Contract 的格式边界。
- `element-contract`：明确 4+N 内容容器要求仅适用于 business-specification Contract，不对通用概念与组织性 Contract 作统一要求。

### Architecture Source

None

## Impact

- 三个提示词源文件：共享业务规格入口、业务规格 reference、common 的按需加载表；四处精确文本由 design.md 承载。
- Explore、Propose、Build、Snack 复用共享入口；对应 skill 和项目级 reference 随已有工作面生成机制交付。
- 不修改 CLI 结构校验、默认初始化 Metamodel、机器格式标识或路径解析机制。
- AirwayManagementDevice 仅作为问题证据与边界案例，本次不修改其模型、Change 或实现。

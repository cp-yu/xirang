---
entity: element-declaration
identity: business-specification-standard
kind: element
parent: authoring-conventions
title: Business Specification Standard
definition: Business Specification Standard 定义 Element Contract 撰写业务规格时的内容标准：常驻基底三项（业务目标、范围与边界排除、核心业务逻辑实现）与按工程特征显式挂载的 +N 大点，使每类规范细节都有一个必须填写的容器，从而避免 0→1 阶段细节在捕获与撰写中丢失。标准以 `.xirang/references/xirang-business-specification-standard.md` 承载完整条目，并在 Build、Explore、Propose、Apply 工作面作为根指导引用。
---

## Specification

### Section: 常驻基底三项

Element Contract SHALL 以 Section 承载三项常驻基底内容：业务目标、范围与边界排除、核心业务逻辑实现。

- **业务目标**由 Element Declaration 的 `definition` 表达：本 Element 解决的核心业务问题与服务的使用方，不重复为 Section。
- **范围与边界排除**SHALL 以独立 Section 显式列出至少一条本 Element 不负责的事情，用于防止需求蔓延与职责推诿。
- **核心业务逻辑实现**SHALL 以独立 Section 表达逻辑推导过程。

### Section: 按工程特征显式挂载 +N 大点

业务具备相应工程特征时，Element Contract SHALL 显式挂载对应 +N 大点，SHALL NOT 将其隐含在自然语言中。

- 常见 +N 包括：实体与状态生命周期、并发竞争与互斥契约、触发源与时序维度、外部契约与降级假设、关键验收用例。
- +N 不限于上述清单；项目 MAY 因地制宜新增符合自身工程特征的大点。
- 大点是否存在由撰写者依业务特征判断；CLI SHALL NOT 推断语义特征，因而 +N 覆盖是撰写与审查清单，而非验证门禁。

### Section: 边界值与异常防御独立成表

Contract SHALL 以表格或等价的结构化形式穷举业务系统常见边界，SHALL NOT 将脏数据与极值保护搅和在主流程描述中。

- 至少覆盖：极值与空值（0 值、负数、超长字符串、Null、全空格输入）、资源枯竭（字典缺失、缓存击穿）、安全防御（恶意遍历、敏感字符注入）。

### Section: 每类细节有必须填写的容器

标准 SHALL 为每类规范细节提供明确容器，使细节在撰写阶段即被要求落位，而不是留待后续对齐才暴露。

- 条件、数值、例外、时序 SHALL 进入相应大点，而不是仅作概括性叙述。
- Element Contract 未表达某类容器时，读取者 SHALL 能从缺失的大点直接识别未撰写内容。

### Section: 内容标准是撰写与审查清单

Business Specification Standard SHALL 以 `.xirang/references/xirang-business-specification-standard.md` 承载完整条目，并 SHALL 在 Build、Explore、Propose 与 Apply 工作面中作为根指导被引用。

- Build 与 Explore SHALL 依标准形成内容完备性清单，用于判断哪些大点必须挂载。
- Reviewer 与 Optimizer SHALL 依标准检查 Contract 是否遗漏适用大点。
- 标准 SHALL NOT 作为 CLI 硬门禁推断语义；CLI 只校验结构存在性。

### Section: 验收用例只在专属大点内展开

关键验收用例 SHALL 由「关键验收案例」大点承载，其内部以 `#### Acceptance Case:` 表达，SHALL NOT 要求其它 Sections 提供验收案例。

- 标准 SHALL NOT 要求为每个细节配一个验收案例，以避免案例数量爆炸。

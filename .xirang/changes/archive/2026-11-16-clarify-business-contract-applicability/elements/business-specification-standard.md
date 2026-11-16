---
entity: element-declaration
identity: business-specification-standard
kind: element
parent: authoring-conventions
title: Business Specification Standard
definition: Business Specification Standard 定义业务规格类 Element Contract 的 4+N 内容结构，以四个必需 Section 承载范围、完整业务机制、异常防御与关键验收案例，并允许增加值得独立维护的规范大点。适用范围由 Element Kind 显式声明，CLI 校验必要结构，撰写者与审查者判断语义覆盖与正确性；框架概念及组织性 Element 不因具有 Contract 而自动适用。
---

## MODIFIED Sections

### Section: 适用范围显式声明

business-specification Contract SHALL 表达目标项目的功能行为、约束及可观察验收结果。Agent 在探索或编写 Element Contract 前 SHALL 根据其目标承诺判断是否属于此类 Contract，不以既有 Kind 缺少格式声明作为豁免，也不以 Element 的层级位置决定适用性。

承载 business-specification Contract 的 Element SHALL 使用同时声明 `contract: required` 与 `contractFormat: business-specification` 的 Kind；撰写者按目标语义更新既有 Kind 或声明合适的 Kind。此 Kind 的全部实例 SHALL 满足 4+N 结构。通用概念及组织性 Element 无需采用该格式；与承载 business-specification Contracts 的 Elements 并存时 SHALL 使用不同 Kinds。

Project Root MAY 直接承载 business-specification Contract，同时保留 Kind 的 `root: true` 和 Element 的 `parent: null`；Element identity SHALL 保持，不要求将 Kind 重命名为 business，也不为采用该格式强制增加子 Element。Root 在具有 children 后仍承载本层业务承诺时同样适用；通用 Root 不因位于根层级而自动成为业务规格，框架初始化不要求统一生成业务规格 Root。

CLI SHALL 根据 Kind 声明确定适用范围，SHALL NOT 从 identity、标题、路径或正文推测业务语义。未声明 contractFormat 的 Kind 保持通用 Contract 结构；声明未知格式或对业务规格声明 optional Contract SHALL 报错。

#### Acceptance Case: 简单固件项目由 Root 承载

AirwayManagementDevice 仅有 `project.root`，使用未声明 contractFormat 的 project Kind，新增 Contract 规定输入消抖、脉冲波形及启停行为。Agent 判断其属于 business-specification Contract，读取完整标准，并在有写权限的编译阶段为项目内 project Kind 声明 `contract: required` 与 `contractFormat: business-specification`；保留 `project.root`、`parent: null` 与 Kind 的 `root: true`，目标 Contract 使用四个固定基础 Section，不要求额外创建子 Element 或改名 Kind。以后新增 children 时，Root 自身层级的业务承诺继续保留。

#### Acceptance Case: 通用概念与业务承诺并存

同一项目同时有 Section 概念定义与承载可验收功能行为的 Element。两者使用不同 Kinds；概念 Contract 不强制 4+N，承载业务承诺的 Kind 显式声明必需 Contract 与业务格式。框架默认通用 Root 不因根层级位置被强制改为业务规格。

### Section: 结构门禁与语义审查

CLI SHALL 对完整 Semantic Model 执行结构校验；验证 Change 时 SHALL 检查 Expected Semantic Model，不要求每份 Delta 重复携带未变动的基础 Sections。缺失、重复或正文为空的必需 Section、缺少或正文为空的 Acceptance Case、Acceptance Case 放在非专属 Section 中，均 SHALL 报错。

语义覆盖、规范正确性及 +N 是否值得独立维护 SHALL 由撰写者与审查者判断，结构通过不代表语义正确。完整标准由 `.xirang/references/xirang-business-specification-standard.md` 承载。Build、Explore、Propose 与 Snack 工作面 SHALL 在探索或编写 Element Contract 前提供 business-specification Contract 的定义并要求判断；目标承诺属于该类 Contract，或宿主 Kind 已声明 `contractFormat: business-specification` 时，SHALL 读取完整标准。common 的按需加载索引 SHALL 以探索或编写 business-specification Contract 为入口，完整触发条件由共享阶段入口表达。自然语言 SHALL 使用 business-specification Contract 指代该类 Element Contract，不作为与 Contract 并列的语义对象；机器字段、文件路径及 `## Specification` 记法保持。Apply 消费 Contract 的目标语义，不加载 4+N 撰写规则。

## Context

业务规格标准与结构校验均已存在。当前共享入口以既有 `contractFormat: business-specification` 声明为加载条件，而默认 project、element、perspective Kind 未声明该格式。AirwayManagementDevice 的 manual-stepper-control 在未调整 project Kind 的情况下给 Root 添加六个自由 Section，combined validation 仍通过，说明 Agent 的语义判断与 Kind 声明之间存在缺口。

设计来源为 `business-contract-applicability.md`，复用用户逐处确认的四处英文文本与后续术语统一决定。此文档保存 Apply 应复用的精确替换，不重新展开提示词设计。

## Goals / Non-Goals

**Goals:**

- 让共享入口先提供定义并触发适用性判断，避免仅因缺少既有格式标记而跳过标准。
- 明确宿主 Kind 的处理及 Root 边界，使用 business-specification Contract 作为自然语言称谓。
- 在现有生成与同步机制中一致交付已确认文本。

**Non-Goals:**

- 不调整默认初始化 Kind，不由 CLI 猜测正文的业务含义，不迁移机器字段或 `## Specification` 记法。
- 不重构层级，不为通用概念与组织性 Contract 强制 4+N，不修改 AirwayManagementDevice。
- 不新增四处之外的提示词修改；发现必要新修改时先向用户提出并确认。

## Decisions

### 共享入口承载定义与判断

沿用 `BUSINESS_SPECIFICATION_STANDARD_ROOT`，一次修改供 Explore、Propose、Build、Snack 复用。common 表格只保留导航，完整格式规则仍由单份 reference 承载。相比各阶段重复规则，这种安排保持已有内容分工。

文件：`src/core/templates/fragments/business-specification-standard-root.ts`。

修改前：

```text
For a Kind or Contract with `contractFormat: business-specification`, read project-root file `.xirang/references/xirang-business-specification-standard.md` before exploring or authoring it, unless already available and current. Generic framework or organizational Elements do not trigger this format.
```

修改后：

```text
A business-specification Contract defines the target project's functional behavior, constraints and observable acceptance outcomes. Before exploring or authoring an Element Contract, assess whether it serves this purpose. If so, or if its Kind already declares `contractFormat: business-specification`, read project-root file `.xirang/references/xirang-business-specification-standard.md`.
```

加载与复用由 common 的既有统一规则承担；入口不重复豁免清单。Explore 仅判断、讨论和记录，Kind 的正式变更由有相应写权限的阶段编译到目标模型或 Delta。

### 标准首段明确 Kind 处理

文件：`src/core/templates/fragments/business-specification-standard.ts`，`Applicability and notation` 首段。

修改前：

```text
The Metamodel declares applicability on an Element Kind, not on a filename, title or inferred business vocabulary. Business-specification Elements MUST use a Kind declaring both `contract: required` and `contractFormat: business-specification`; declare an appropriate Kind when needed, never omit the format to bypass validation. For example:
```

修改后：

```text
Elements with business-specification Contracts MUST use a Kind declaring both `contract: required` and `contractFormat: business-specification`; update an existing Kind or declare an appropriate one when needed. For example:
```

不把读取时的已有声明作为唯一分类依据。CLI 继续只根据显式 Kind 声明执行确定性校验，Agent 负责把目标语义落实到适当声明。

### 类型与 Root 边界精简表达

同一文件，示例后的现有段落。

修改前：

```text
Every instance of this Kind requires the 4+N Contract. Generic concepts (such as Section, Metamodel or View definitions) and organizational Elements need not use this format. If a Kind mixes business specifications and generic concepts, separate their Kinds instead of forcing business structure onto all instances.
```

修改后：

```text
Generic concepts and organizational Elements need not use this format; use separate Kinds when they coexist with Elements carrying business-specification Contracts.

A Project Root may carry a business-specification Contract while retaining `root: true` on its Kind and `parent: null` on the Element.
```

Root 的层级位置与 Contract 格式是独立维度。项目内既有 project Kind 可调整，identity 与 parent 保持；有子 Elements 的 Root 若仍承载自身层级业务承诺，同样适用。一个 Kind 的格式适用于其全部实例，因此不能通过修改混用 Kind 将通用概念一并纳入业务格式。已确认不在提示词增加“不得为格式增加子节点”等解释句。

### common 索引同步

文件：`src/core/templates/workflows/common.ts`，按需加载表左列。

修改前：

```text
Business-specification Kind or Contract with contractFormat: business-specification
```

修改后：

```text
Explore or author a business-specification Contract
```

右侧路径 `.xirang/references/xirang-business-specification-standard.md` 保持。common 的表格不枚举全部触发依据，阶段共享入口保留语义判断与既有 Kind 声明两条路径。

### 术语、语义归属与交付

自然语言使用 business-specification Contract；描述宿主时使用 Elements with/carrying business-specification Contracts。既有机器字段、reference 路径、示例 Kind identity、`## Specification` 及标准文档名称保持。本次检索发现其余相关提示词已使用 business-specification Contracts，不扩大精确替换范围。

目标语义由 `business-specification-standard` 现有两项 Sections 精化；其上级 `authoring-conventions` 在自身层级补齐前置分类与格式边界。`element-contract` 当前“完整表达自身抽象层级语义”不加区分地要求业务内容容器，本次按已确认的通用类型豁免限定适用性，保留父级完整性与 children 精化承诺。这些是已确认设计在模型中的表达，不增加新的提示词修改。

Apply 使用现有显式受管清单与工作面刷新流程，不通过名称模式删除文件。物理路径处理继续沿用现有平台解析；本次只修改提示词内容，不增加路径行为或平台专用逻辑。

### Test Maintenance

复用 `test/core/templates/semantic-model-consistency.test.ts` 已有业务标准路由检查，以及既有工作面投影相关验证。协议字段、reference 路径及阶段加载边界检查仍有效；不为说明文字、自然语言全文、标题顺序或例子措辞新增永久断言。CLI 模型校验未改变，无需重写现有结构校验测试。

### One-time Verification

- 构建、运行相关既有模板检查，并比较实际生成的 shared entry、common 表格和项目级 reference 与已确认替换；确保没有遗漏旧入口和没有产生多份标准。
- 以最初项目为只读场景依据，核查无格式标记且由 Root 承载行为时的分类路径；同时核查既有业务格式声明、通用概念/组织语义以及混合 Kind 情形。验证应区分生成文本符合设计与 Agent 实际采取判断、加载、正确编译 Kind 和完整 Contract 的行为证据。
- 未执行实际 Agent 行为验证前，不声称此次措辞已稳定解决生成偏差。必要验证以一次性证据保留，不通过持久化提示词字节断言替代。

## Risks / Trade-offs

- [Agent 对业务与技术语义的分类仍可能偏差] → 使用已确认定义和原固件 Root 案例核查；提示词符合不等于运行行为已改善。
- [修改 Kind 影响同 Kind 的其他实例] → 保留类型分离规则，在目标模型上下文判断，不统一修改框架默认 Kind。
- [已安装项目仍持有旧工作面] → Apply 按现有构建和刷新流程交付受管内容，不把源码修改视为工作面已经刷新。
- [common 索引较简短] → 精确加载条件由阶段共享入口表达，不在表格复制规则。

## 用户验收与验证豁免

用户在获知实现已提交、既有检查通过、独立 full-change Review 因缺少真实 Agent 行为证据而 FAIL，以及补充实验连接失败后，明确决定：“不需要验证了，现在这样就可以”。据此按当前四处提示词实现交付，停止进一步 fresh-Agent 实验及重复审查。

该决定接受当前行为证据缺口，不表示实际 Agent 分类与形成行为已经验证，也不撤销目标语义。已有 full-change Review 的 FAIL 与失败实验保持原样；未取得通过的 Review，不生成 Quality Seal，也不声明 Archive ready。后续若需按标准 Quality 门禁归档，仍须另行解决该入口条件。

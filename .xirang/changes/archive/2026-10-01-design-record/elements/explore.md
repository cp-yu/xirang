---
operation: MODIFIED
entity: element-declaration
identity: explore
kind: element
parent: intent-first-path
title: Explore
definition: Explore 是 Intent-first Path 的起始阶段。它通过 Design Exploration，基于 Semantic Model 与项目证据澄清用户意图、范围、影响和设计；在探索过程中通过 Design Record 随用户确认记录关键设计，用户的设计确认即授权记录该部分内容。它在适用设计已确认且记录冲突已解决后形成不持久化的 Design Summary，交由 Propose 收成完整 Change；它不写入完整 Change，也不实现项目。
---

## MODIFIED Sections

### Section: 澄清 Element Definition 影响

Explore SHALL 在新增 Element 或改变概念身份、范围、parent、children 或 siblings 边界时澄清完整目标 Definition。用户确认的 Declaration 字段 SHALL 通过 Design Record 记录到记录的结构部分，允许只含已确认字段；没有记录时保留在对话设计中。仅改变规范行为时 SHALL NOT 制造 Declaration 变化。

- **Change 改变 Element 概念边界**

  - 不同 Definition 边界会产生不同 Semantic Delta
  - Explore 一次请求一个用户决策，直到目标 Definition 足以交由 Propose 编译

- **部分确认的 Declaration**

  - 用户已确认新 Element 的 parent 与 kind，definition 仍在讨论
  - 立即记录已确认的两个字段，definition 确认后补充

## ADDED Sections

### Section: 按确认即记录使用 Design Record

Explore SHALL 按触发条件加载共享 Design Record reference：发现或接收相关记录（含恢复已有探索）时，在读取或依赖记录前加载；设计段落产生未被明确豁免的规范性确认，或用户要求记录或修订材料时，在写入前加载；Summary 前发现规范性确认既未记录也未明确豁免时，加载并解决交接缺口。未触发时不为普通讨论预加载协议。Explore SHALL 在用户确认设计内容后立即通过 `xirang record` 记录，只报告本次变更与记录概况，不等待用户要求记录、不另行请求写入授权、不重新呈现未改动内容，也不默认提供豁免；明确豁免覆盖的内容不重复记录。存在 normative 确认时，Explore SHALL 在交接前落定恰好一个记录决策——已持久化记录、用户明确授予的豁免、或本次无 normative 内容的声明——三者皆缺即阻塞交接。记录更新后 SHALL 重查受影响设计与 Summary，不得将记录设为所有设计的先行阶段。

- **确认后立即记录**

  - 用户确认一个设计段落中的两项规范性内容
  - Explore 立即写入这两项并报告变更，不先展示完整拟保存内容等待授权

- **有规范确认时落定决策**

  - 采用的设计含 normative 确认
  - 在交接前取得记录、豁免或无 normative 内容声明之一
  - 不将无记录继续作为默认路径

- **已确认内容修订**

  - 记录中的行为或结构确认被修订
  - 重载记录并重新检查依赖旧条目的设计结论

## REMOVED Sections

### Section: 支持可选 Definition Framing

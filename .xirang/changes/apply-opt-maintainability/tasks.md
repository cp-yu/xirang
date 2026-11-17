## Goals

- [ ] G1: 让 Apply 的实现取舍以职责、控制流清晰及修改局部性为依据
  - Contract: `apply` / Section "实现取舍与维护质量"
  - Verify: 有具体收益的抽取与合并均可采用；仅凭函数、文件、层数、体积或假想扩展不能决定结构，生成指导与该取舍一致。

- [ ] G2: 形成独立机会检查、授权组实施、真实提交交付与累计独立 Review 的完整优化循环
  - Contract: `apply` / Section "集成受托优化执行"
  - Verify: 基线通过后默认干净上下文只读发现，不要求实现者预先指出改法；实施不越授权组，协调者可继续、另启检查或停止，并提交保留结果。无改动检查如实 delivered，发现但未采纳有理由；累计保留改动必须在 Seal 前独立审查，后续改动重新审查，已确认缺陷不作为可选优化遗留。各角色与共享生成指导一致，实际行为证据与单纯文本符合性分开报告。

- [ ] G3: 用共享意见写入序号与提交关联保证优化结果的审查和 Seal 门禁
  - Contract: `quality-cli-gate` / Section "Seal 校验"
  - Verify: 变更 Opt 后缺少 Review、晚写旧提交 Review、仅 supplemental 或未解决 FAIL 均不能放行；无变更交付不新增或清除旧义务。修正提交保留 Opt 结果祖先关系、通过适用审查且 Seal 绑定一致时可完成并继续后续 Opt；新变更使旧 PASS 不再覆盖。共享序号由原子 CAS 写入，失败不留下部分记录，状态查询与写入门禁一致；旧 Quality 明确拒绝且原样保留，Windows 与 POSIX 提交关联和持久化结果一致。

- [ ] G4: 贯通六阶段 stageRules 的配置、查询、诊断和隔离消费
  - Contract: `project-config-loading` / Section "Business Logic"
  - Verify: explore/propose/apply/archive/build/snack 各自只加载本阶段附加规则，与 context 和制品 rules 分离；直接入口和跨阶段切换等价，内部角色不自动继承。缺失或空规则沿用内置指导，未知键或非法成员有准确诊断且其他有效内容保留；确认设计正常交接，规则不自动进入模型。Windows、macOS、Linux 的生成入口与平台路径定位保持同一消费语义，受管更新不覆盖未登记用户文件。

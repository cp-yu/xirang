## REMOVED Requirements

### Requirement: 空 specs 目录仍应视为 raw baseline
**Reason**: raw、specs-based、formal-opsx baseline 分类被显式 Candidate 起点选择取代。

**Migration**: `opsx-build` 询问用户基于当前 OPSX、重新构建 OPSX 或使用指定内容作为起点。

### Requirement: Raw + full SHALL generate formal OPSX and complete valid specs
**Reason**: full mode 与 CLI-generated Spec lowering 被删除。

**Migration**: Agent 直接编写完整 Candidate，并在 promotion 前获得 valid digest。

### Requirement: Raw + opsx-first SHALL generate OPSX plus README-only starter
**Reason**: opsx-first 被删除；setup 已创建 minimal formal skeleton，Project Build 在用户需要时创建完整 Candidate。

**Migration**: 使用 `opsx setup` 创建 skeleton，或使用 `opsx-build` 构建完整项目模型。

### Requirement: Specs-based + full SHALL preserve existing specs
**Reason**: preserve-only mode 被删除；当前 Specs 只是用户可选择的起点，并且只能通过 confirmed promotion 被替换。

**Migration**: 选择“基于当前 OPSX 构建”，并 review Candidate diff。

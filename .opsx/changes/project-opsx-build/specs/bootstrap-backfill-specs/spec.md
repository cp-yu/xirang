## REMOVED Requirements

### Requirement: 命名匹配算法
**Reason**: Spec ownership 是必须在 Candidate validation 和 user confirmation 前完成的 semantic decision。

**Migration**: 直接编写 singular `element` binding；ownership 有歧义时询问用户。

### Requirement: Frontmatter 写入
**Reason**: Post-hoc frontmatter mutation 会在 digest confirmation 后改变 reviewed source。

**Migration**: Agent 在 validation 前编写 Candidate frontmatter。

### Requirement: Backfill Engine 完整流程
**Reason**: Backfill engine 在 unified Candidate 之外猜测或延迟 ownership。

**Migration**: Candidate validation 拒绝 missing、multiple 或 unknown owners。

### Requirement: CLI 子命令
**Reason**: `opsx bootstrap backfill-specs` 随 bootstrap command family 删除。

**Migration**: 直接修复 Candidate Specs，然后重新运行 `opsx candidate validate`。

### Requirement: Semantic mapping SHALL require explicit reviewed writeback
**Reason**: Separate mapping files 与 writeback 被 direct Candidate authoring 和 digest-bound review 取代。

**Migration**: 在 `build.md` 记录 user ownership decision，并在 Candidate Spec 中写入最终 binding。

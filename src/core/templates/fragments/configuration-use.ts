export const CONFIGURATION_USE_GUIDANCE = `# Configuration Use

Query effective configuration through \`xirang config project\`, selecting the fields needed now. Do not reinterpret raw YAML. Reuse loaded configuration and this guidance while current; query again after relevant configuration changes.

- \`proseLanguage\` and \`context\` apply to all applicable artifacts. Follow context as supplied, preserving its meaning, Markdown, special characters and multiline content. Missing context creates no obligation.
- \`rules[artifactId]\` applies only to the matching artifact. Rules are additive: follow them alongside the built-in Definition, Guidance and Template, never as replacements. For example, a proposal rule requiring a rollback plan adds that requirement to the built-in proposal contract; it does not change design rules. Missing, empty or unmatched rules create no obligation. Preserve each rule's original meaning and multiline content.
- Apply \`proseLanguage\` to newly authored or rewritten natural-language prose, including titles, descriptions, rationale, goals, risks and summaries. Examples do not override it. Preserve canonical tokens: SHALL/MUST, template and structural headings, IDs, schema keys, relation types, paths, commands and code identifiers. Keep the four business-specification Section headings in English; a MODIFIED Section must use its exact existing title. With no language override, retain default writing behavior.
- Read only surface-relevant operational fields: Apply uses \`apply.defaultIsolation\`; Archive uses \`git.merge.strategy\`, \`git.branch.deleteAfterArchive\` and \`git.commitMessage.*\`. Non-structural work does not load decomposition guidance. Data selection does not change any configuration scope or obligation.

Keep configuration and guidance out of authored artifacts unless they independently describe the target's intended semantics. Query \`--artifact <id>\` to limit rules before selecting fields; reuse known global context rather than rereading it for each artifact.
`;

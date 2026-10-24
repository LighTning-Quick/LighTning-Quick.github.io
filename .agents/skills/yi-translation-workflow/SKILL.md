---
name: yi-translation-workflow
description: Use when translating or revising Zhouyi hexagram texts, especially when the work should follow a staged workflow from original text to Chinese draft to polished English. Best for requests such as forming an initial translation from the original, revising English after the user rewrites the Chinese, or running a full draft-revise-polish pass on guaci, tuan, xiang, and yaoci.
---

# Yi Translation Workflow

Use this skill for `卦辞` / `彖` / `象` / `爻辞` translation work when the user wants a repeatable process instead of one-off editing.

## Core Rule

- `原文` is the source constraint.
- `用户改过的中文` is the immediate authority for English revision.
- `完善` means smoothing and unifying terminology without drifting away from either of the above.

## Commands

### `draft-from-original`

Use when the text is still at the initial stage.

Input:
- original passage
- existing notes or keyword table if present
- target file

Output:
- a first-pass Chinese translation based on the original
- a first-pass English translation
- brief keyword labels if the file already uses them

Rules:
- do not over-polish
- stay close to the original
- if the file already has a house style, imitate it
- in English translation draft files, end every physical line with `<br>`
- represent a blank separator as a line containing only `<br>`
- do not append another `<br>` when the line already ends with one

### `revise-from-chinese`

Use when the user has already rewritten the Chinese and wants English brought into line.

Input:
- current original passage
- user-revised Chinese
- current English
- target file

Output:
- English rewritten to match the user-revised Chinese line by line

Rules:
- follow the revised Chinese first
- do not silently revert to older wording just because it is closer to the original
- preserve structure and labels already used in the file unless the user asks to change them

### `polish-final`

Use after both the original-based meaning and the revised Chinese are stable.

Input:
- original passage
- revised Chinese
- current bilingual draft
- target file

Output:
- final bilingual cleanup

Polish goals:
- unify terminology across lines
- improve rhythm and readability
- remove avoidable literal awkwardness
- keep doctrinal or semantic distinctions intact

Rules:
- no new interpretation unless it is already implied by the original or the revised Chinese
- prefer small, local improvements over wholesale rewriting

### `full-pass`

Use when the user wants the whole workflow done in one request.

Sequence:
1. run `draft-from-original`
2. incorporate the user-edited Chinese if provided; otherwise infer a conservative Chinese draft
3. run `revise-from-chinese`
4. run `polish-final`

## Working Procedure

When this skill is used, work in this order:

1. Read the target file and the corresponding hexagram source file.
2. Identify which stage the text is in: `draft`, `revise`, or `polish`.
3. Preserve the file's existing layout.
4. Update Chinese or English only as required by the requested stage.
5. Re-read the edited result and check for line-by-line consistency.

## File Pattern

Typical targets in this workspace:

- `卦爻翻译/*.md`
- corresponding source files such as `59-涣.md`, `60-节.md`

If both a translation draft and a main source note exist, read both before editing.

## Output Discipline

- Keep Chinese and English aligned in the same order.
- For new drafts under `卦爻翻译/英语翻译/`, every line must end with `<br>`, including the title, image or construction line, original text, Chinese translation, English translation, notes, and footnotes.
- Use a standalone `<br>` for each visual blank line; never leave a physically empty line in these draft files.
- Treat this line-break normalization as idempotent: an existing terminal `<br>` must be preserved rather than duplicated.
- Translate `卦辞`, `象辞`, and each `爻辞` separately.
- If the user has changed only Chinese, edit only English unless asked otherwise.
- If a keyword label such as `节度` or `涣散` already exists, treat it as part of the house structure.
- In this workspace, translation file names should use the hexagram index prefix in the form `23-剥卦翻译.md`, following the source-file numbering style such as `1-乾.md`.

## File Format Template

Follow this established house style (参考：涣、节、剥、复等卦翻译格式)：

```
《卦名》
下卦关键词 (Lower Keyword) - 上卦关键词 (Upper Keyword)

[卦辞原文]
[中文释义]
[英文翻译]
参考义项：[注释]

《象》曰：[象辞原文]
[中文图式/释义]
[英文翻译]

初九：[爻辞原文]
[中文图式]：[中文释义]
[英文图式/翻译]

九二：[爻辞原文]
[中文图式]：[中文释义]
[英文图式/翻译]
...
```

**Format Rules:**
1. 第一行：仅《卦名》，无#号前缀
2. 第二行：关键词格式，如 "姇悅 (Feminine Radiance) - 莩甲 (Germinance)"
3. 卦辞：原文 + 中文释义 + 英文翻译 + 参考义项
4. 象辞：《象》曰：... + 中文释义 + 英文翻译
5. 爻辞：
   - 爻位：原文（如"初九：虞吉，有它不燕"）
   - 中文图式：中文释义
   - 英文图式/翻译
   - 无需"###"markdown标题
   - 每爻之间空一行

## Source Mapping Rules

- For new translation drafts, the second line (keywords) should be copied from the source file frontmatter in the form Self-construction - Situational-manifestation.
- When the source file contains a numbered schema list such as - **1**:: ... through - **6**:: ..., use that list as the authority for the Chinese schema labels in the translation draft.
- When the source file contains a schema table, use the table as the authority for non-Chinese schema lines in the translation draft.
- If the source file contains more than one non-Chinese schema system in the table, keep all of them rather than collapsing to only one.
- If the source schema table provides only the 图式翻译 and no 词根翻译, write only one English translation line and do not invent a root-series translation.
- If one line is already established as the preferred local pattern, keep later lines consistent with it.

## Quick Mapping

- `形成` -> `draft-from-original`
- `修改` -> `revise-from-chinese`
- `完善` -> `polish-final`
- `形成-修改-完善` -> `full-pass`

For reusable prompt shapes, read [references/commands.md](references/commands.md).

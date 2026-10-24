# Command Templates

Use these prompt shapes when invoking the workflow manually.

## `draft-from-original`

```text
用 yi-translation-workflow 的 draft-from-original。
目标文件：<path>
对应原文：<path>
要求：根据原文先形成初步中英翻译，保留现有体例。
```

## `revise-from-chinese`

```text
用 yi-translation-workflow 的 revise-from-chinese。
目标文件：<path>
对应原文：<path>
要求：按照我改过的中文修改英文，逐条对齐，不要回退成旧译法。
```

## `polish-final`

```text
用 yi-translation-workflow 的 polish-final。
目标文件：<path>
对应原文：<path>
要求：在不偏离原文和我改过的中文的前提下，统一术语并完善英文表达。
```

## `full-pass`

```text
用 yi-translation-workflow 的 full-pass。
目标文件：<path>
对应原文：<path>
要求：按 形成 -> 修改 -> 完善 的流程完成这篇翻译。
如果我已经改过中文，以我的中文为准继续修英文。
```

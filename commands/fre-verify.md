---
description: Verify implementation matches change artifacts before archiving
---

Invoke the `fre-verify` skill with the Skill tool and follow it exactly; do not improvise steps.

**Input**: Optionally specify a change name after `/fre-verify` (e.g., `/fre-verify add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

Work Item grounding (when the request references a Work Item) is owned by `@context-resolver`.

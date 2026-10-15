---
name: fre-router
description: Classify a reverse-engineering target and compose the RE profiles needed (target × objective), reporting coverage and GAPs
license: MIT
compatibility: No external binaries required; uses the native inspect core via the ancleto-fre CLI.
metadata:
  author: ancleto-fre
  version: '0.1'
---

# FRE Router

**Artifacts language**: write artifact content in the user's conversation language (or the
project's configured `language` in `.ancleto-fre.rc`). Keywords (`Requirement`, `Scenario`,
`SHALL`, `WHEN`/`THEN`/`AND`) and file/directory names are literal and MUST NOT be translated.

Plan reverse-engineering work: given a **target** and a **question**, identify which RE profiles
and capabilities are needed, report coverage, and surface GAPs. You never install anything.

**Input**: the argument after `/fre-router` is the target (path to an artifact) and, optionally,
the question/objective.

## Steps

### 1. Classify the target (deterministic)

Run the native pre-classifier — do not guess by extension:

```
ancleto-fre route <target> --json
```

Read `kind` and `description`. If `kind` is `unknown` and the target is a file you can read, fall
back to `ancleto-fre inspect <target> --json`.

### 2. Classify the objective

Map the user's question to one or more objectives (see `OBJECTIVE_CAPABILITIES` in
`src/fre/router.js`): `understand-behavior`, `reconstruct-algorithm`, `extract-protocol`,
`identify-crypto`, `deobfuscate`, `recover-format`, `recover-manifest`, `audit-permissions`.

### 3. Compose the plan

```
ancleto-fre route <target> --objective <objective> --json
```

Read `matchedProfiles`, `coverage`, `gaps` and `degraded`.

### 4. Report coverage

Present a short table: capability → `native` (available) | `bridge` (degraded without the
provider) | `missing`. State which providers would be needed for degraded capabilities.

### 5. GAP → propose, never install

For each `missing` capability, propose (offer) a change named
`add-re-capability-<ids>` with a minimal rationale. Do not create or install it; hand it to the
orchestrator/user.

### 6. Hand off

Return the plan so the orchestrator routes the agents within each selected profile.

## Guardrails

- The router reports and proposes; it never installs or enables a bridge.
- Never claim availability that the coverage does not show.
- Prefer the deterministic `route`/`inspect` output over manual inference.

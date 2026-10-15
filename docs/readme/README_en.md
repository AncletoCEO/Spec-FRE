# ANCLETO-FRE (Spec-FRE)

[Español](../../README.md) · **English**

**Spec For Reverse Engineering** — an SDD (Spec-Driven Development) orchestrator for reverse
engineering, a fork of [ANCLETO/aspec](https://github.com/damianarganaras/spec).

> It is a fork of ANCLETO with its own identity (CLI `ancleto-fre`, commands `/fre-*`) and without
> the cost tiers or Azure DevOps. Its focus is orchestrating reverse engineering: figuring out how
> an artifact works, recording findings with evidence, and specifying the reconstruction.

---

## Table of contents

- [What is Spec-FRE?](#what-is-spec-fre)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [SDD cycle commands](#sdd-cycle-commands)
- [Supported hosts](#supported-hosts)
- [Persistent memory engine](#persistent-memory-engine)
- [Technical discovery](#technical-discovery)
- [Reverse-engineering focus (roadmap)](#reverse-engineering-focus-roadmap)
- [CLI reference](#cli-reference)
- [License](#license)

---

## What is Spec-FRE?

A lightweight orchestrator for AI-assisted work under **Spec-Driven Development**, aimed at
**reverse-engineering** tasks. It runs inside your IDE (OpenCode, Claude, Cursor, VS Code, Roo,
etc.) and automates three things:

- **Specify** — guided writing of specs and implementation plans.
- **Discover** — topological survey of the repository and context packaging.
- **Remember** — retention of project decisions and rules across sessions.

Unlike ANCLETO, Spec-FRE **does not optimize tokens**: there are no cost tiers (`normal` /
`minimo` / `gratis`), no `gratisModel`/Muse Spark, and no Azure DevOps. The model is fixed per
agent and can be overridden in `.ancleto-fre.rc`.

## Requirements

| Requirement | Detail |
|---|---|
| **Node.js ≥ 24.0.0** | Required: the memory engine uses the native `node:sqlite` module. |
| **Repomix** | Optional: discovery resolves it through `npx` when not installed. |

## Installation

```bash
npm install -g @ancleto/spec-fre   # global
ancleto-fre install                # or from the CLI itself
ancleto-fre install --project /path/to/repo
ancleto-fre install --no-mcp
```

Installation is interactive (banner + menu) only when something needs deciding. At most it asks
for the **agent/IDE**, the **artifacts language** and, optionally, discovery exclusions. It never
asks about tiers or Azure.

## Quick start

```bash
ancleto-fre init                 # create .ancleto-fre.rc, aspec/, AGENTS.md, PRODUCT.md
ancleto-fre discovery --check    # technical seed status
ancleto-fre discovery            # package context
# then, from the IDE:
/fre-new · /fre-propose · /fre-apply · /fre-verify · /fre-archive
```

## SDD cycle commands

`/fre-new`, `/fre-propose`, `/fre-ff`, `/fre-apply`, `/fre-verify`, `/fre-review`,
`/fre-security`, `/fre-sync`, `/fre-archive`, `/fre-continue`, `/fre-explore`, `/fre-onboard`,
`/fre-bulk-archive`, `/fre-recall`, `/fre-transplant`.

## Supported hosts

`--agent <name>` picks the native layout to materialize: `opencode` (default), `claude`, `vscode`,
`antigravity`, `cursor`, `roo`, `copilot`, `commandcode`.

## Persistent memory engine

No vector databases: native **SQLite** with full-text search (FTS5) and BM25 ranking, in
`.ancleto-fre/memory.db`. Exposes three tools to the IDE via the `ancleto-fre-memory` MCP:
`searchMemory`, `recordRule`, `recordDecision`.

The **repository** memory (this one) stores project rules and decisions and is shared with the
team. If your runtime also exposes an **agent** memory (e.g. engram), that one keeps session notes,
not repository ones: **an entry lives in exactly one memory**.

## Technical discovery

`ancleto-fre discovery` generates `.discovery-map.json`, packages the repository with Repomix and
stores the seed state. The seed (under `docs/technical-discovery/`) is produced by the
`fre-technical-discovery` skill from the pack. `ancleto-fre discovery --check` reports
`READY` / `STALE` / `PARTIAL` / `MISSING` and, when applicable, the change `impact`.

## Reverse-engineering focus (roadmap)

The goal of the fork is an orchestrator that **identifies which RE profiles are needed** for a task
(target × objective) and composes them. Status:

- **Native core (planned)** — dependency-free inspectors (ELF/PE/Mach-O, Go/Rust, WASM, EVM,
  DEX/AXML, .NET, pcap/HAR, SQLite) to inventory artifacts.
- **RE profiles (planned)** — bundles per target class (`native`, `mobile`, `web`, …).
- **FRE Router (planned)** — native pre-classifier + planner that proposes profiles or a change
  when a capability is missing.
- **Evidence memory (planned)** — a third node type (`finding`) with mandatory provenance,
  `confidence` and unknowns, bound to the artifact hash.

None of this is implemented yet: today Spec-FRE is an SDD orchestrator with its own identity.

## CLI reference

```
ancleto-fre init [--agent <name>] [--lang <code>] [--exclude <globs>] [--no-mcp] [--profile <profile>]
ancleto-fre install [--project <dir>] [--agent <name>] [--lang <code>] [--no-mcp]
ancleto-fre update [--global] · ancleto-fre upgrade [--agent <name>]
ancleto-fre export [--tar <file>] · ancleto-fre import <bundle> [--repair]
ancleto-fre check · ancleto-fre specs check [--change <name>]
ancleto-fre discovery [--check] [--compress] [--include G] [--ignore G] [--token-budget N]
ancleto-fre memory context|list|doctor · ancleto-fre projects [list|scan|prune|info|update]
ancleto-fre stats · ancleto-fre doctor
```

## License

MIT. Fork of [ANCLETO/aspec](https://github.com/damianarganaras/spec).

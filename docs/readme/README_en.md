# ANCLETO-FRE (Spec-FRE)

[![npm version](https://img.shields.io/npm/v/@ancleto/spec-fre.svg)](https://www.npmjs.com/package/@ancleto/spec-fre)
[![Node.js](https://img.shields.io/node/v/@ancleto/spec-fre.svg)](https://nodejs.org)
[![dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](../../package.json)
[![license: MIT](https://img.shields.io/npm/l/@ancleto/spec-fre.svg)](../../LICENSE)
[![focus: reverse engineering](https://img.shields.io/badge/focus-reverse%20engineering-blueviolet.svg)](#reverse-engineering-focus)

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
- [Reverse-engineering focus](#reverse-engineering-focus)
- [Example: reverse engineering in action](#example-reverse-engineering-in-action)
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

## Reverse-engineering focus

- **Native core (available)** — dependency-free inspectors to inventory artifacts: ELF/PE/Mach-O,
  ZIP/APK/JAR, Go/Rust, WASM, EVM, DEX, AXML, .NET, pcap, core dumps and SQLite. Used via CLI
  (`ancleto-fre inspect <target> [--json]`) and via MCP (`ancleto-fre-re` → `inspect_target`).
- **RE profiles (available)** — bundles per target class (`native`, `mobile`, `web`) with a
  `profile.json` (capabilities `impl: native | bridge`) under `profiles/fre/`.
- **FRE Router (available)** — native pre-classifier + planner: `ancleto-fre route <target>
  [--objective <o>]` composes the profile plan, reports coverage (native/bridge/missing) and
  proposes a change on a GAP (agent `re-router`, skill/command `fre-router`).
- **Evidence memory (available)** — a `finding` node with mandatory provenance (`source` + `tool`),
  `confidence` and `unknowns`, bound to the artifact hash (`target_ref`) with `stale` invalidation;
  recorded and searched via the `ancleto-fre-re` MCP (`record_finding` / `search_findings`).

## Example: reverse engineering in action

Say you want to understand how a binary builds and signs its HTTP requests.

### 1. Inventory the artifact (no external dependencies)

```bash
$ ancleto-fre inspect ./target.bin
ancleto-fre inspect: /path/target.bin
  tipo      ELF 64-bit x86-64 shared (elf)
  tamaño    56610216 bytes   entropía 6.4924
  sha256    6653fedf35f885fbf9ea870a5bcb78b88644cac410532efb13b0e21d8ea8e5b9
  header    {"bits":64,"endian":"little","type":"shared","machine":"x86-64","entry":2009264}
  libs      libz.so.1, libuv.so.1, libcares.so.2, libnghttp2.so.14
  strings   100 (use --json for the full inventory)
```

### 2. Classify the target and plan the profiles (FRE Router)

```bash
$ ancleto-fre route ./target.bin --objective extract-protocol
ancleto-fre route: /path/target.bin
  target    ELF 64-bit x86-64 shared (elf)
  objetivo  extract-protocol
  perfiles  native
  cap native  file-magic
  cap native  strings
  cap native  pe-imports
```

Each capability is reported as `native` (core), `bridge` (needs an optional external engine) or
`missing`. On a `GAP`, the router **proposes a change** — it never installs engines on its own.

### 3. Record findings with evidence

In the IDE, the agent uses the `ancleto-fre-re` MCP:

```
record_finding({
  memory_key: "http/signing",
  claim: "requests sign the body with HMAC-SHA256",
  claim_type: "inference",
  source: "libhttp.so:0x1a2b",
  tool: "elf-inspector",
  confidence: 0.7,
  unknowns: ["embedded or derived key"],
  target_ref: "6653fedf…"
})
```

Provenance (`source` + `tool`) is **mandatory**, and the finding is bound to the artifact hash: if
the binary changes, it is marked `stale`. Search with `search_findings` (by text or `target_ref`).

### 4. Specify the reconstruction

From the IDE, `/fre-new` opens an aspec change to reconstruct the observed behavior; `/fre-propose`
designs the plan, `/fre-apply` implements it and `/fre-verify` validates against the findings.

> All of this can also be orchestrated by the agent with `/fre-router` (agent `re-router`): it runs
> steps 1–3 for you and returns the profile plan with its coverage.

## CLI reference

```
ancleto-fre init [--agent <name>] [--lang <code>] [--exclude <globs>] [--no-mcp] [--profile <profile>]
ancleto-fre install [--project <dir>] [--agent <name>] [--lang <code>] [--no-mcp]
ancleto-fre update [--global] · ancleto-fre upgrade [--agent <name>]
ancleto-fre export [--tar <file>] · ancleto-fre import <bundle> [--repair]
ancleto-fre check · ancleto-fre specs check [--change <name>]
ancleto-fre discovery [--check] [--compress] [--include G] [--ignore G] [--token-budget N]

# Reverse engineering
ancleto-fre inspect <target> [--type <kind>] [--json]   # artifact inventory
ancleto-fre route <target> [--objective <o>] [--json]   # profile plan + coverage

# Memory and services
ancleto-fre memory context|list|doctor|export|import|gc
ancleto-fre projects [list|scan|prune|info|update]
ancleto-fre mcp · ancleto-fre mcp-re
ancleto-fre stats [--all] [--session <id>] · ancleto-fre doctor
```

## License

MIT. Fork of [ANCLETO/aspec](https://github.com/damianarganaras/spec).

---
node: units/re-core
kind: dossier
read_when: "núcleo nativo de ingeniería inversa: inspectores, router, perfiles, puentes, MCP de RE"
generatedAt: 2026-10-15T00:00:00Z
pluginVersion: 0.1.0
skillVersion: '2.3'
---

# Dossier — Núcleo nativo de RE (`src/fre/**`)

## Responsabilidades

Inspeccionar artefactos sin dependencias externas, clasificarlos, componer el plan de perfiles RE y
almacenar hallazgos con evidencia. Es la diferencia sustantiva del fork respecto del upstream.

## Componentes y flujo

- `re-inventory.js` → `inspectTarget(path, { type })`: lee el archivo, calcula `sha256`, detecta el
  tipo con `magic.js` y despacha al inspector. Devuelve `{ path, size, sha256, magic, detectedKind,
  entropy, strings, inventory }`.
- `inspect/**` (17 módulos): `magic` (firmas), `strings` (ASCII+UTF-16LE), `entropy` (Shannon),
  `elf`, `pe`, `macho`, `zip` (central directory; detecta APK), `go` (buildinfo), `rust`
  (cargo-auditable vía `node:zlib`), `wasm` (secciones + WAT), `evm` (opcodes + selectores `PUSH4…EQ`),
  `dex`, `axml`, `dotnet` (metadata + `#Strings`), `pcap`, `core` (notas ELF), `sqlite` (`node:sqlite`).
- `router.js` → `classifyTarget` (determinista, sin LLM) + `route(target, objective)` compone
  `capabilityCoverage` contra `profiles.js`; reporta `native | bridge | missing` y GAPs;
  `gapProposal(plan)` genera el `proposal.md` mínimo (no instala).
- `profiles.js` + `profiles/fre/**`: `profile.json` (schema), `discovery.json`, `memory-schema.json`;
  perfiles `native`, `mobile`, `web`. Validador `validateProfile`.
- `bridge/contract.js` + `bridge/reference.js`: `detect`/`available`/`invoke`; **degradado** sin
  provider; puente de referencia no-op documentado.
- `mcp-re-server.js`: MCP stdio `ancleto-fre-re` con `inspect_target`, `record_finding`, `search_findings`
  (estos últimos sobre el engine de memoria del proyecto).

## Reglas

- Zero-dependency: solo `node:*`.
- Sin clasificación por extensión: siempre por magic bytes.
- GAP → propuesta, nunca instalación.
- Findings: `source`+`tool` obligatorios (provenance) y atados a `target_ref` (hash) con invalidación.

## Paths clave

`src/fre/re-inventory.js`, `src/fre/router.js`, `src/fre/profiles.js`, `src/fre/inspect/*.js`,
`src/fre/bridge/contract.js`, `src/fre/mcp-re-server.js`, `profiles/fre/**`.

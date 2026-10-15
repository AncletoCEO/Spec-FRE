---
node: units/memory-engine
kind: dossier
read_when: "motor de memoria (SQLite+FTS5), nodo finding, working-context, ops export/import/gc"
generatedAt: 2026-10-15T00:00:00Z
pluginVersion: 0.1.0
skillVersion: '2.3'
---

# Dossier — Motor de memoria (`src/core/memory/**`)

## Responsabilidades

Persistir reglas, decisiones y hallazgos del proyecto en SQLite nativo con búsqueda FTS5, y exponerlos
al IDE como tools MCP.

## Componentes

- `database.js`: abre `.ancleto-fre/memory.db`, PRAGMAs (WAL, foreign_keys), y **migraciones**
  (`memory_nodes` + `memory_fts`; `findings` + `findings_fts` con `content_rowid='id'` y triggers).
- `engine.js`: `buildWorkingContext`, `searchMemory` (BM25 con fallback OR-prefijo), supersesión
  atómica por `memory_key`, `exportActive`/`importNodes`/`gcSuperseded`; y el bloque de **findings**
  (`recordFinding`, `searchFindings`, `markStaleFindings`, `promoteFinding`).
- `tools.js` + `mcp-server.js`: MCP `ancleto-fre-memory` con `searchMemory`, `recordRule`, `recordDecision`.
- `working-context.js`: render/persistencia de `.ancleto-fre/working-context.md`; refresco en
  escrituras que lo alteran.
- `doctor.js`: integridad, reconstrucción FTS5 y merge del WAL.

## Reglas y distinciones

- **Memoria del repo vs del agente**: `.ancleto-fre/memory.db` es del repo (compartible); engram es del
  agente (sesión). Una entrada vive en una sola.
- **`memory_nodes.source`** = procedencia de escritura **runtime-owned** (auditoría); **no** se expone
  en los `inputSchema` del MCP de memoria.
- **`findings.source`/`findings.tool`** = provenance del **caller** (obligatoria); se exponen por el
  MCP de RE.
- `findings` es **aditivo**: no modifica `memory_nodes` ni sus tools.

## Paths clave

`src/core/memory/database.js`, `engine.js`, `tools.js`, `mcp-server.js`, `working-context.js`, `doctor.js`.

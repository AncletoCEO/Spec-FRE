---
node: units/_map
kind: inventory
read_when: "qué unidades componen el repo, con propósito y entry point"
generatedAt: 2026-10-15T00:00:00Z
pluginVersion: 0.1.0
skillVersion: '2.3'
---

# Mapa de unidades

| Unidad | Propósito | Entry point | Dossier |
|---|---|---|---|
| CLI / orquestación | Parsing de comandos; `init`/`install`/`update`/`upgrade`, `export`/`import`, profiles, projects, stats, doctor, MCP y RE (`inspect`/`route`). | `src/cli/index.js` | `units/cli-install.md` |
| UI de terminal | Banner animado (taza + `ANCLETO-FRE`) y menús TTY sin dependencias. | `src/cli/ui.js` | — |
| Núcleo nativo de RE | `inspectTarget` (clasifica y despacha), 17 inspectores zero-dep. | `src/fre/re-inventory.js` | `units/re-core.md` |
| FRE Router | `classifyTarget`, `route` (target × objetivo → cobertura/GAP), `gapProposal`. | `src/fre/router.js` | `units/re-core.md` |
| Perfiles RE | Schema + loader/validador y `capabilityCoverage`. | `src/fre/profiles.js`, `profiles/fre/**` | `units/re-core.md` |
| Puentes opcionales | Contrato `detect`/`available`/`invoke` + puente de referencia no-op. | `src/fre/bridge/contract.js` | `units/re-core.md` |
| MCP de RE | Servidor stdio: `inspect_target`, `record_finding`, `search_findings`. | `src/fre/mcp-re-server.js` | `units/re-core.md` |
| Adaptación de frontmatter | Dueño único: `adaptFrontmatter(content, host, assetKind, name)` + mapas de tools. | `src/core/adapters/frontmatter.js` | `units/cli-install.md` |
| Instalación por host | Materializa skills/agents/commands en el layout nativo del host. | `src/cli/index.js` | `units/cli-install.md` |
| Perfil test (overlay) | `installProfileOverlay` + `testspec/`; tester ampliado y `fre-test-*`. | `profiles/test/**` | `units/cli-install.md` |
| Portabilidad | `export` (bundle sin rutas), `import` (regenera MCP + doctor), `--repair`. | `src/cli/index.js` | `units/cli-install.md` |
| Discovery / topología | `.discovery-map.json` (árbol, totales, root files) + empaquetado Repomix. | `src/core/discovery.js` | — |
| Base de memoria | Abre `.ancleto-fre/memory.db`, PRAGMAs, migraciones (rules/decisions + findings) y FTS5. | `src/core/memory/database.js` | `units/memory-engine.md` |
| Motor de memoria | `buildWorkingContext`, `searchMemory`, `recordFinding`, `searchFindings`, `markStaleFindings`, `promoteFinding`, export/import/gc. | `src/core/memory/engine.js` | `units/memory-engine.md` |
| Tools de memoria | Handlers y JSON Schema de las 3 tools del LLM. | `src/core/memory/tools.js` | `units/memory-engine.md` |
| MCP de memoria | Transporte MCP stdio del IDE. | `src/core/memory/mcp-server.js` | `units/memory-engine.md` |
| Memory doctor / working-context | Integridad + merge WAL; render de `.ancleto-fre/working-context.md`. | `src/core/memory/doctor.js`, `working-context.js` | `units/memory-engine.md` |
| Agents (11) | orchestrator, coder, tester, spec-writer, reviewer, documenter, technical-discovery, technical-seed-writer, memory-keeper, context-resolver, re-router. | `agents/*.md` | — |
| Commands (17) | Ciclo SDD `/fre-*` + review/security/recall/pr/transplant/update + `fre-router`. | `commands/*.md` | — |
| Skills (22) | Ciclo de vida, discovery, commit/pr, review/security, upgrade, `triage-clarifier` y `fre-router`. | `skills/*/SKILL.md` | — |
| Templates (2) | `AGENTS.md`, `PRODUCT.md` base (bloques LOCKED/EXTENSIBLE). | `templates/` | — |
| Specs del repo | `config.yaml` + 16 specs fuente + changes (activos + `archive/`). | `aspec/**` | — |
| Tests | Suite `node --test` (13 archivos). | `test/*.test.js` | — |

Cada dossier describe responsabilidades, flujo, reglas y paths clave; no repite inventario.

---
node: decisions
kind: rules
read_when: "reglas, contratos, riesgos, deuda, acoplamiento e impacto de cambios"
generatedAt: 2026-10-15T00:00:00Z
pluginVersion: 0.1.0
skillVersion: '2.3'
---

# Decisiones, contratos y riesgos

## Contratos y reglas (vivos)

- **Cero dependencias de runtime**: solo `node:*` (`node:sqlite`, `node:zlib`, `node:crypto`). ESLint
  es devDependency. Estado: `declarado` (`package.json`, `PRODUCT.md`).
- **Identidad total del fork**: renombrar identificadores `ancleto`→`ancleto-fre`, `/fre-*` etc.
  implicó aceptar **divergencia máxima con upstream**; los cherry-picks no aplican limpio. `observado`.
- **Sin tiers ni Azure**: el modelo es fijo por agente (`AGENT_MODELS`); `--tier`/`--with-azure`
  quedan como no-ops inertes. `observado` (`src/cli/index.js`).
- **Provenance de memoria**: en `memory_nodes`, `source` es **runtime-owned** (auditoría) y jamás se
  expone en los `inputSchema` del MCP de memoria (guard en `test/mcp.test.js`). `observado`.
- **Findings con provenance del caller**: en `findings`, `source` y `tool` son **obligatorios** y los
  provee quien registra la evidencia. Se exponen por el **MCP de RE** (`ancleto-fre-re`), no por el de
  memoria. `observado` (`src/core/memory/engine.js`, `src/fre/mcp-re-server.js`).
- **Puentes opcionales, nunca dependencias duras**: sin provider, el perfil opera **degradado**.
  `observado` (`src/fre/bridge/contract.js`).
- **GAP → propuesta, nunca instalación**: el router propone un change; no instala perfiles ni puentes.
  `observado` (`src/fre/router.js`).
- **Seed: nunca borrar sin regenerar**. `declarado` (`aspec/changes/fre-foundation`, skill archive).

## Riesgos / acoplamiento

- **`src/cli/index.js`** es un punto único grande (instalación, MCP, discovery, memoria, RE):
  cambiarlo altera lo que reciben todos los proyectos usuarios.
- **Acoplamiento de identidad**: el renombre tocó ~230 archivos; reintroducir el nombre viejo rompe
  convenciones (los guards de contenido lo detectan).
- **`node:sqlite`**: el engine acopla la app a Node ≥ 24 (FTS5, supersesión atómica, `content_rowid`).
- **Deuda documental**: el seed se regeneró para el fork; `aspec/specs/**` conserva specs del upstream
  con menciones depuradas sólo vía deltas `MODIFIED` del change activo.

## Impacto de cambios

- Tocar `src/core/adapters/frontmatter.js` afecta la instalación de **todos** los hosts.
- Tocar `src/fre/inspect/**` no afecta la instalación; solo el núcleo de RE y su MCP.
- Tocar `src/core/memory/database.js` (migraciones) afecta el schema local de cada proyecto.

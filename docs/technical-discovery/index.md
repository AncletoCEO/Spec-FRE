---
node: index
kind: router
read_when: "punto de entrada del seed: elegir qué documento leer según la pregunta"
generatedAt: 2026-10-15T00:00:00Z
pluginVersion: 0.1.0
skillVersion: '2.3'
---

# Seed técnico — `@ancleto/spec-fre` (Spec-FRE)

Mapa de navegación del repositorio `@ancleto/spec-fre` (CLI `ancleto-fre`). No es un inventario
exhaustivo: enruta a la respuesta más corta. Evidencia: pack Repomix (`--compress`, 264 archivos,
~277k tokens), `package.json` (`0.1.0`), `CHANGELOG.md` y lectura puntual de los archivos citados.

## Ruteo por pregunta

| Si la pregunta es sobre… | Leer |
|---|---|
| Qué es el proyecto, propósito, arquitectura, componentes y flujos principales | `overview.md` |
| Instalar, ejecutar, comandos, entorno, tests, convenciones operativas | `setup.md` |
| Reglas de negocio, contratos, riesgos, deuda, acoplamiento e impacto de cambios | `decisions.md` |
| Sistemas externos y dependencias privadas observables (npm, GitHub, Repomix, MCP, puentes) | `integrations.md` |
| Catálogo de unidades (módulos, agents, skills) con propósito y entry point | `units/_map.md` |
| Núcleo nativo de RE: inspectores, `re-inventory`, MCP `ancleto-fre-re` | `units/re-core.md` |
| Motor de memoria (SQLite + FTS5), nodo `finding` y working-context | `units/memory-engine.md` |
| CLI: `init`/`install`/`update`, hosts, perfiles, portabilidad | `units/cli-install.md` |
| Límites de evidencia: qué no se pudo verificar | `unknowns.md` |
| Cobertura por directorios/globs | `inventory.md` |

## Hechos de orientación

- **Tipo**: librería/CLI de Node.js, ESM, **cero dependencias de runtime**, `engines.node: ">=24.0.0"`.
- **Naturaleza**: fork de `damianarganaras/spec` (ANCLETO/aspec), base `8290eb7` (~v0.13.x),
  reorientado a **ingeniería inversa**: *Spec For Reverse Engineering*. Versiona en `0.1.0`.
- **Identidad del fork**: CLI `ancleto-fre`, comandos `/fre-*`, skills `fre-*`, storage
  `.ancleto-fre/`, config `.ancleto-fre.rc`, MCP `ancleto-fre-memory`, env `ANCLETO_FRE_*`.
- **Sin tiers ni Azure DevOps**: no existen `--tier`, `.ancleto-fre-tier`, `gratisModel`/Muse Spark
  ni `--with-azure`. El modelo es fijo por agente (`AGENT_MODELS` en `src/cli/index.js`).
- **Entry point**: `src/cli/index.js` (bin `ancleto-fre` en `package.json`).
- **Núcleo nativo de RE**: `src/fre/**` (inspectores zero-dep, perfiles, router, memoria de
  evidencia, puentes). CLI `ancleto-fre inspect` / `ancleto-fre route`; MCP `ancleto-fre-re`.
- **Producto**: orquestador SDD para IDEs (opencode, claude, vscode, antigravity, cursor, roo,
  copilot, commandcode) con descubrimiento técnico y memoria persistente local.
- **Conteos**: 11 agents, 17 commands, 22 skills, 2 perfiles (`test`, `fre`), 13 archivos de test.
- **Memoria**: `.ancleto-fre/memory.db` (SQLite + FTS5) con nodos `rule`/`decision` y `finding`.

Antes de afirmar un detalle fino o reciente, abrir el archivo citado en cada documento.

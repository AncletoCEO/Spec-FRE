---
node: setup
kind: ops
read_when: "instalar, ejecutar, comandos, entorno, tests, convenciones"
generatedAt: 2026-10-15T00:00:00Z
pluginVersion: 0.1.0
skillVersion: '2.3'
---

# Setup y operación

## Requisitos

- **Node.js ≥ 24.0.0** (obligatorio: el motor de memoria usa `node:sqlite`).
- **Repomix** opcional (el discovery lo resuelve vía `npx`).

## Comandos (repo local)

```bash
node src/cli/index.js <comando>     # CLI sin instalar
npm run lint                        # eslint src/ test/
npm test                            # node --test "test/*.test.js"
```

Comandos CLI principales: `init`, `install`/`update`, `upgrade`, `discovery`, `inspect`, `route`,
`memory context|list|doctor|export|import|gc`, `projects`, `specs check`, `stats`, `check`,
`export`/`import` (portabilidad), `mcp`, `mcp-re`, `doctor`.

## Instalación

```bash
ancleto-fre install [--project <dir>] [--agent <nombre>] [--lang <codigo>] [--no-mcp] [--profile <perfil>]
```

Preguntas interactivas (solo si falta algo por decidir): agente/IDE, idioma de los artifacts,
exclusiones del discovery. **No** pregunta por tier ni Azure.

## Hosts soportados (8)

`opencode` (default), `claude`, `vscode`, `antigravity`, `cursor`, `roo`, `copilot`, `commandcode`.
`--agent` elige el layout nativo + el pipeline de adaptación de frontmatter.

## Entorno y convenciones

- **Config de proyecto**: `.ancleto-fre.rc` (`agent`, `language`, `profile`, `discovery`, `installedPaths`).
- **Variables**: `ANCLETO_FRE_PROJECTS_FILE` (registro de proyectos), `ANCLETO_FRE_SKILLS`,
  `ANCLETO_FRE_OPENCODE_DB`, `XDG_CONFIG_HOME`. **Valores omitidos** (no se versionan).
- **Storage local (gitignored)**: `.ancleto-fre/` (memory.db, working-context.md), `.opencode/`.
- **Memoria** en `.ancleto-fre/memory.db`; config global en `~/.config/ancleto-fre/projects.json`.
- **Discovery**: `ancleto-fre discovery --check` (estado) / `ancleto-fre discovery` (pack Repomix).
- **RE**: `ancleto-fre inspect <target> [--type] [--json]`, `ancleto-fre route <target> [--objective] [--json]`.

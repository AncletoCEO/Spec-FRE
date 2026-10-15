---
node: units/cli-install
kind: dossier
read_when: "CLI: init/install/update/upgrade, hosts, perfiles, MCP por host, portabilidad"
generatedAt: 2026-10-15T00:00:00Z
pluginVersion: 0.1.0
skillVersion: '2.3'
---

# Dossier — CLI e instalación (`src/cli/index.js`)

## Responsabilidades

Punto único de instalación/actualización: copia de assets por host, merge de bloques `LOCKED` en
templates, configuración MCP, descubrimiento, memoria y comandos RE.

## Flujo

- `init` / `install --project`: `copyTemplates` + `installAgentAssets` + `writeManifest` (.ancleto-fre.rc)
  + `setupHostMcp`; aplica `applyModels` (modelo fijo por agente, sin tiers).
- `install` (global) sin `--project`: instala en el dir de config del host.
- `upgrade`: re-aplica templates y skills respetando personalizaciones.
- `export`/`import`: bundle portable sin rutas; `--repair` regenera MCP.
- RE: `inspect`, `route`; servidores `mcp` (memoria) y `mcp-re` (RE).

## Hosts y adaptación

`AGENT_TARGETS` da las rutas nativas por host; `adaptFrontmatter` (dueño único) adapta el frontmatter
de agents (mapas `ANTIGRAVITY_TOOL_MAP`, `COMMANDCODE_TOOL_MAP`, `COMMANDCODE_MCP_TOOL_MAP`).
`.agents/skills` es punto de lectura compartido. MCP por host: `.agents/mcp_config.json` (antigravity),
`.mcp.json` (commandcode), `copilot-mcp.json` u `opencode.json`.

## Reglas

- Instalación **aditiva y no destructiva**; manifiesto `installedPaths` acumulativo.
- Interacción TTY: `agent → lang (→ exclude)`; sin tier ni Azure.
- `--no-mcp` omite config MCP.

## Paths clave

`src/cli/index.js`, `src/cli/ui.js`, `src/core/adapters/frontmatter.js`, `templates/**`, `profiles/test/**`.

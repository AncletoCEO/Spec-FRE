---
node: overview
kind: architecture
read_when: "qué es el proyecto, arquitectura, componentes y flujos principales"
generatedAt: 2026-10-15T00:00:00Z
pluginVersion: 0.1.0
skillVersion: '2.3'
---

# Overview — `@ancleto/spec-fre` (Spec-FRE)

## Propósito

`ancleto-fre` es un **orquestador SDD (Spec-Driven Development)** asistido por IA que vive dentro
del IDE del usuario, orientado a **ingeniería inversa**. Es un fork de ANCLETO/aspec con identidad
propia y, a diferencia del upstream, **no optimiza tokens** (sin tiers) y no integra Azure DevOps.

Tres funciones centrales: **especificar** (ciclo de changes `/fre-*`), **descubrir** (mapa
topológico + empaquetado de contexto) y **recordar** (memoria persistente de reglas, decisiones y
hallazgos).

## Arquitectura (capas)

1. **CLI** (`src/cli/index.js`, `src/cli/ui.js`): parsing de comandos, instalación por host,
   discovery, memoria, projects, doctor, y los comandos RE `inspect`/`route`. Banner y menús TTY
   propios, sin dependencias.
2. **Núcleo nativo de RE** (`src/fre/**`): inspectores de artefactos zero-dep, `re-inventory`,
   perfiles, router y puentes opcionales. Se consume por CLI y por el MCP `ancleto-fre-re`.
3. **Motor de memoria** (`src/core/memory/**`): SQLite nativo (`node:sqlite`) + FTS5, con reglas,
   decisiones y **findings** (evidencia). Expuesto al IDE como MCP `ancleto-fre-memory`.
4. **Discovery** (`src/core/discovery.js`): topología `.discovery-map.json` + empaquetado Repomix;
   el seed lo genera la skill `fre-technical-discovery`.
5. **Adaptadores de host** (`src/core/adapters/frontmatter.js`): dueño único de la transformación de
   frontmatter por host.

## Componentes principales

- **Agentes (11)**: orchestrator, coder, tester, spec-writer, reviewer, documenter,
  technical-discovery, technical-seed-writer, memory-keeper, context-resolver, **re-router**.
- **Skills (22)** y **commands (17)** del ciclo SDD (`/fre-*`), más las auxiliares.
- **Perfiles (2)**: `profiles/test` (overlay de test automation) y `profiles/fre` (perfiles RE:
  `native`, `mobile`, `web`).

## Flujos principales

- **Ciclo SDD**: `/fre-new` → `/fre-propose` → `/fre-apply` → `/fre-verify` → `/fre-archive`.
- **Instalación**: `ancleto-fre init` / `install --project` materializan skills/agents/commands en
  el layout del host, escriben `.ancleto-fre.rc` y configuran los MCP.
- **RE**: `ancleto-fre inspect <target>` inventaría un artefacto con el núcleo nativo;
  `ancleto-fre route <target> --objective <o>` compone el plan de perfiles y reporta cobertura
  (native/bridge/missing) y GAPs. Los hallazgos se registran como `finding` (con provenance) vía el
  MCP `ancleto-fre-re`.

Paths clave: `src/cli/index.js`, `src/fre/re-inventory.js`, `src/fre/router.js`,
`src/fre/profiles.js`, `src/core/memory/engine.js`, `src/core/discovery.js`.

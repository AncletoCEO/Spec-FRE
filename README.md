# ANCLETO-FRE (Spec-FRE)

[![npm version](https://img.shields.io/npm/v/@ancleto/spec-fre.svg)](https://www.npmjs.com/package/@ancleto/spec-fre)
[![Node.js](https://img.shields.io/node/v/@ancleto/spec-fre.svg)](https://nodejs.org)
[![dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)
[![license: MIT](https://img.shields.io/npm/l/@ancleto/spec-fre.svg)](LICENSE)
[![focus: reverse engineering](https://img.shields.io/badge/focus-reverse%20engineering-blueviolet.svg)](#enfoque-en-ingeniería-inversa)

**Español** · [English](docs/readme/README_en.md)

**Spec For Reverse Engineering** — orquestador SDD (Spec-Driven Development) para ingeniería
inversa, fork de [ANCLETO/aspec](https://github.com/damianarganaras/spec).

> Nace como un fork de ANCLETO con identidad propia (CLI `ancleto-fre`, comandos `/fre-*`) y sin
> el sistema de tiers ni Azure DevOps. Su foco es orquestar ingeniería inversa: descubrir cómo
> funciona un artefacto, registrar hallazgos con evidencia y especificar la reconstrucción.

---

## Tabla de contenidos

- [¿Qué es Spec-FRE?](#qué-es-spec-fre)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso rápido](#uso-rápido)
- [Comandos del ciclo SDD](#comandos-del-ciclo-sdd)
- [Hosts soportados](#hosts-soportados)
- [Motor de memoria persistente](#motor-de-memoria-persistente)
- [Descubrimiento técnico](#descubrimiento-técnico)
- [Enfoque en ingeniería inversa](#enfoque-en-ingeniería-inversa)
- [Ejemplo: ingeniería inversa en acción](#ejemplo-ingeniería-inversa-en-acción)
- [Referencia de comandos CLI](#referencia-de-comandos-cli)
- [Licencia](#licencia)

---

## ¿Qué es Spec-FRE?

Un orquestador ligero para trabajo asistido por IA bajo **Spec-Driven Development**, pensado para
tareas de **ingeniería inversa**. Vive dentro de tu IDE (OpenCode, Claude, Cursor, VS Code, Roo,
etc.) y automatiza tres cosas:

- **Especificar** — escritura guiada de especificaciones y planes de implementación.
- **Descubrir** — relevamiento topológico del repositorio y empaquetado de contexto.
- **Recordar** — retención de decisiones y reglas del proyecto entre sesiones.

A diferencia de ANCLETO, Spec-FRE **no optimiza tokens**: no hay tiers de costo (`normal` /
`minimo` / `gratis`), ni `gratisModel`/Muse Spark, ni Azure DevOps. El modelo es fijo por agente
y se puede sobrescribir en `.ancleto-fre.rc`.

## Requisitos

| Requisito | Detalle |
|---|---|
| **Node.js ≥ 24.0.0** | Obligatorio: el motor de memoria usa el módulo nativo `node:sqlite`. |
| **Repomix** | Opcional: el discovery lo resuelve vía `npx` cuando no está instalado. |

## Instalación

```bash
# Global (disponible en todos tus proyectos)
npm install -g @ancleto/spec-fre

# O desde la propia CLI
ancleto-fre install

# Acotada a un proyecto (inyecta templates y .opencode/)
ancleto-fre install --project /ruta/repo

# Sin modificar la configuración MCP de tu IDE
ancleto-fre install --no-mcp
```

La instalación es interactiva (banner + menú) solo si falta algo por decidir. Pide, como máximo,
**agente/IDE**, **idioma de los artifacts** y, opcionalmente, exclusiones del discovery. No
pregunta por tier ni por Azure.

## Uso rápido

```bash
# 1. Inicializar el repositorio (.ancleto-fre.rc, aspec/, AGENTS.md, PRODUCT.md)
ancleto-fre init

# 2. Estado del seed técnico y empaquetado de contexto
ancleto-fre discovery --check
ancleto-fre discovery

# 3. Trabajar con el ciclo SDD desde el IDE
/fre-new      # iniciar la especificación de un cambio
/fre-propose  # proponer el diseño técnico
/fre-apply    # aplicar el código
/fre-verify   # verificar reglas, tests y memoria
/fre-archive  # archivar y registrar aprendizajes
```

## Comandos del ciclo SDD

| Comando | Para qué sirve |
|---|---|
| `/fre-new` | Iniciar la especificación de un feature/fix. |
| `/fre-propose` | Proponer el diseño técnico. |
| `/fre-ff` | Avanzar rápido con el contexto ya recuperado. |
| `/fre-apply` | Aplicar el código del change. |
| `/fre-verify` | Verificar reglas, tests y memoria antes de cerrar. |
| `/fre-review` | Revisar el código del scope (duplicación, redundancia, código sin uso). |
| `/fre-security` | Auditoría de seguridad integral. |
| `/fre-sync` | Sincronizar las specs con el estado del repositorio. |
| `/fre-archive` | Archivar el change y registrar aprendizajes. |
| `/fre-continue` | Retomar un change con artefactos pendientes. |
| `/fre-explore` | Explorar un problema sin comprometerse a implementar. |
| `/fre-onboard` | Recorrer el ciclo completo en modo tutorial. |
| `/fre-bulk-archive` | Archivar varios changes juntos. |
| `/fre-recall` | Recuperar memoria del proyecto antes de empezar. |
| `/fre-transplant` | Mudar el proyecto entre máquinas (export/import). |

## Hosts soportados

`--agent <nombre>` elige el layout nativo a materializar:

| Host | skills | agents | commands |
|---|---|---|---|
| `opencode` (default) | `.opencode/skills/<n>/SKILL.md` | `.opencode/agents/<n>.md` | `.opencode/commands/<n>.md` |
| `claude` | `.claude/skills/<n>/SKILL.md` | `.claude/agents/<n>.md` | `.claude/commands/<n>.md` |
| `vscode` (Copilot) | `.github/skills/<n>/SKILL.md` | `.github/agents/<n>.agent.md` | `.github/prompts/<n>.prompt.md` |
| `antigravity` | `.agents/skills/<n>/SKILL.md` | `.agents/agents/<n>.md` | materializados como skills |
| `cursor` | `.cursor/skills/<n>/SKILL.md` | — | — |
| `roo` | `.roo/skills/<n>/SKILL.md` | — | — |
| `copilot` | — | `.github/prompts/<n>.prompt.md` | `.github/prompts/<n>.prompt.md` |
| `commandcode` | `.commandcode/skills/<n>/SKILL.md` | `.commandcode/agents/<n>.md` | `.commandcode/commands/<n>.md` |

`--agent <nombre>` elige el **layout nativo a materializar** (directorio y convención de nombre) y
el **pipeline de adaptación de frontmatter** del host. `.agents/skills` es un **punto de lectura
compartido** (lo leen opencode, Cursor, VS Code y Antigravity), no un destino universal.

## Motor de memoria persistente

Sin bases vectoriales: **SQLite nativo** con búsqueda full-text (FTS5) y ranking BM25, en
`.ancleto-fre/memory.db`. Expone tres herramientas al IDE vía el MCP `ancleto-fre-memory`:

| Herramienta | Función |
|---|---|
| `searchMemory` | Recupera decisiones y reglas previas. |
| `recordRule` | Guarda una regla o restricción permanente. |
| `recordDecision` | Registra el *por qué* de una decisión. |

El fork agrega además el MCP `ancleto-fre-re` (núcleo nativo de RE) con la herramienta
`inspect_target`.

La memoria **del repositorio** (esta) guarda reglas y decisiones del proyecto y se comparte con el
equipo. Si tu runtime expone además una memoria **del agente** (p. ej. engram), esa guarda notas
de sesión, no del repo: **una entrada vive en una sola memoria**.

## Descubrimiento técnico

`ancleto-fre discovery` genera `.discovery-map.json`, empaqueta el repositorio con Repomix y
guarda el estado del seed. El seed (bajo `docs/technical-discovery/`) lo genera la skill
`fre-technical-discovery` a partir del pack. `ancleto-fre discovery --check` informa
`READY` / `STALE` / `PARTIAL` / `MISSING` y, cuando corresponde, el `impact` del cambio.

```bash
ancleto-fre discovery --check # Estado del technical seed (READY / STALE / PARTIAL / MISSING) + config
ancleto-fre discovery         # genera .discovery-map.json y empaqueta el repo
```

## Proyectos con ancleto-fre

Cuando instalás Spec-FRE en un proyecto, el CLI lo anota en un registro global
(`~/.config/ancleto-fre/projects.json`):

```bash
ancleto-fre projects                # lista (o `ancleto-fre list --projects`)
ancleto-fre projects scan <raíz>    # descubre y registra los que ya existen
ancleto-fre projects prune          # quita del registro los borrados/movidos
ancleto-fre projects info           # estado del proyecto actual
ancleto-fre projects update         # actualiza los desactualizados
```

## Tokens de sesión (stats)

`ancleto-fre stats` lee la base de sesiones de opencode y reporta tokens de entrada/salida/razonamiento/cache, costo y subagentes por sesión. **Solo funciona con opencode**; con `--session <id>` desglosa por agente.

## Guía de .gitignore

El framework **no gestiona tu `.gitignore`**: es una decisión del proyecto. Referencia:

| Ruta | Recomendación | Por qué |
|---|---|---|
| `aspec/` | **Versionar** | Fuente-de-verdad: specs y el historial de changes archivados. |
| `.ancleto-fre/` | **Ignorar** | Base SQLite local (memoria del repo); cada integrante la regenera. |
| `.ancleto-fre.rc` | Decisión del equipo | Versionarlo alinea la configuración del proyecto. |

## Enfoque en ingeniería inversa

- **Núcleo nativo (disponible)** — inspectores sin dependencias para inventariar artefactos:
  ELF/PE/Mach-O, ZIP/APK/JAR, Go/Rust, WASM, EVM, DEX, AXML, .NET, pcap, core dumps y SQLite.
  Se usan por CLI (`ancleto-fre inspect <target> [--json]`) y por MCP (`ancleto-fre-re` →
  `inspect_target`).
- **Perfiles RE (disponible)** — bundles por clase de target (`native`, `mobile`, `web`) con
  `profile.json` (capacidades `impl: native | bridge`) en `profiles/fre/`.
- **FRE Router (disponible)** — preclasificador nativo + planificador: `ancleto-fre route <target>
  [--objective <o>]` compone el plan de perfiles, reporta cobertura (native/bridge/missing) y
  propone un change ante un GAP (agente `re-router`, skill/comando `fre-router`).
- **Memoria de evidencia (disponible)** — nodo `finding` con provenance obligatoria (`source` +
  `tool`), `confidence` y `unknowns`, atado al hash del artefacto (`target_ref`) con invalidación a
  `stale`; se registra y busca vía el MCP `ancleto-fre-re` (`record_finding` / `search_findings`).

## Ejemplo: ingeniería inversa en acción

Supongamos que querés entender cómo un binario arma y firma sus requests HTTP.

### 1. Inventariar el artefacto (sin dependencias externas)

```bash
$ ancleto-fre inspect ./target.bin
ancleto-fre inspect: /ruta/target.bin
  tipo      ELF 64-bit x86-64 shared (elf)
  tamaño    56610216 bytes   entropía 6.4924
  sha256    6653fedf35f885fbf9ea870a5bcb78b88644cac410532efb13b0e21d8ea8e5b9
  header    {"bits":64,"endian":"little","type":"shared","machine":"x86-64","entry":2009264}
  libs      libz.so.1, libuv.so.1, libcares.so.2, libnghttp2.so.14
  strings   100 (usá --json para el inventario completo)
```

### 2. Clasificar el target y planificar los perfiles (FRE Router)

```bash
$ ancleto-fre route ./target.bin --objective extract-protocol
ancleto-fre route: /ruta/target.bin
  target    ELF 64-bit x86-64 shared (elf)
  objetivo  extract-protocol
  perfiles  native
  cap native  file-magic
  cap native  strings
  cap native  pe-imports
```

Cada capacidad se reporta como `native` (núcleo), `bridge` (requiere un engine externo opcional) o
`missing`. Ante un `GAP`, el router **propone un change** — nunca instala engines por su cuenta.

### 3. Registrar hallazgos con evidencia

En el IDE, el agente usa el MCP `ancleto-fre-re`:

```
record_finding({
  memory_key: "http/signing",
  claim: "los requests firman el body con HMAC-SHA256",
  claim_type: "inference",
  source: "libhttp.so:0x1a2b",
  tool: "elf-inspector",
  confidence: 0.7,
  unknowns: ["clave embebida o derivada"],
  target_ref: "6653fedf…"
})
```

La provenance (`source` + `tool`) es **obligatoria** y el hallazgo queda atado al hash del artefacto:
si el binario cambia, se marca `stale`. Se busca con `search_findings` (por texto o por `target_ref`).

### 4. Especificar la reconstrucción

Desde el IDE, `/fre-new` abre un change aspec para reconstruir el comportamiento observado;
`/fre-propose` diseña el plan, `/fre-apply` implementa y `/fre-verify` valida contra los hallazgos.

> Todo esto también lo orquesta el agente con `/fre-router` (agente `re-router`): hace los pasos 1–3
> por vos y devuelve el plan de perfiles con su cobertura.

## Referencia de comandos CLI

```
ancleto-fre init [--agent <nombre>] [--lang <codigo>] [--exclude <globs>] [--no-mcp] [--profile <perfil>]
ancleto-fre install [--project <dir>] [--agent <nombre>] [--lang <codigo>] [--exclude <globs>] [--no-mcp] [--profile <perfil>]
ancleto-fre update [--global]        # re-instala sobre lo existente
ancleto-fre upgrade [--agent <nombre>]
ancleto-fre export [--tar <archivo>] · ancleto-fre import <bundle> [--repair]
ancleto-fre check                    # integridad de la instalación
ancleto-fre specs check [--change <name>] [--json]
ancleto-fre discovery [--check] [--compress] [--include G] [--ignore G] [--token-budget N]

# Ingeniería inversa
ancleto-fre inspect <target> [--type <kind>] [--json]   # inventario del artefacto
ancleto-fre route <target> [--objective <o>] [--json]   # plan de perfiles + cobertura

# Memoria y servicios
ancleto-fre memory context|list|doctor|export|import|gc
ancleto-fre projects [list|scan|prune|info|update]
ancleto-fre mcp                      # servidor MCP de memoria (stdio)
ancleto-fre mcp-re                   # servidor MCP de RE (stdio)
ancleto-fre stats [--all] [--session <id>]
ancleto-fre doctor
```

## Licencia

MIT. Fork de [ANCLETO/aspec](https://github.com/damianarganaras/spec).

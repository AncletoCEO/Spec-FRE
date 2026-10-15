# ANCLETO-FRE (Spec-FRE)

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
- [Enfoque en ingeniería inversa (roadmap)](#enfoque-en-ingeniería-inversa-roadmap)
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

## Enfoque en ingeniería inversa (roadmap)

El objetivo del fork es un orquestador que **identifique qué perfiles de RE hacen falta** para
una tarea (target × objetivo) y los componga. Estado:

- **Núcleo nativo (planeado)** — inspectores sin dependencias (ELP/PE/Mach-O, Go/Rust, WASM, EVM,
  DEX/AXML, .NET, pcap/HAR, SQLite) para inventariar artefactos.
- **Perfiles RE (planeado)** — bundles por clase de target (`native`, `mobile`, `web`, …).
- **FRE Router (planeado)** — preclasificador nativo + planificador que propone perfiles o un
  change cuando falta una capacidad.
- **Memoria de evidencia (planeado)** — un tercer tipo de nodo (`finding`) con provenance
  obligatoria, `confidence` y unknowns, atado al hash del artefacto.

Nada de esto está implementado todavía: hoy Spec-FRE es un orquestador SDD con identidad propia.

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
ancleto-fre memory context|list|doctor
ancleto-fre projects [list|scan|prune|info|update]
ancleto-fre doctor
```

## Licencia

MIT. Fork de [ANCLETO/aspec](https://github.com/damianarganaras/spec).

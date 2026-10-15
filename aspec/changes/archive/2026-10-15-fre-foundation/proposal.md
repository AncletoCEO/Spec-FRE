# Proposal: Spec-FRE — Fundación del orquestador de ingeniería inversa y limpieza del fork

## Problem

El repositorio `Spec-FRE` es hoy un fork **sin divergencia**: contiene el upstream
`damianarganaras/spec` completo (223 commits, base `8290eb7`, ~v0.13.x) con su identidad, su
enfoque de **optimización de tokens vía tiers** y su integración **Azure DevOps**, más un
`README.md`, `BACKLOG.md` y `CHANGELOG.md` que describen al upstream. Nada en el repo expresa
el propósito real del fork: un **orquestador de ingeniería inversa (RE)**.

Concretamente faltan o sobran cosas:

1. **Identidad equivocada.** El binario es `ancleto`/`aspec` y el paquete `@ancleto/spec`; el
   `repository`/`homepage`/`bugs` apuntan al upstream. Se pretende `ancleto-fre` y remoto
   `AncletoCEO/Spec-FRE`.
2. **Ejes que el fork no usa.** El upstream está diseñado alrededor del costo en tokens:
   tiers (`normal`/`minimo`/`gratis`), wizard de tier, `gratisModel`/Muse Spark
   (`ANCLETO_MUSE_SPARK`), archivo `.ancleto-tier` y budget de tokens en el discovery. El fork
   **no** optimiza tokens, así que ese sistema solo agrega fricción a la instalación
   (6 preguntas) y código a mantener (`src/core/tier-models.js`, `src/core/repomix-tier.js`,
   111 referencias en `src/`). Lo mismo con Azure (`--with-azure`, sección en
   `templates/PRODUCT.md`).
3. **Cero capacidad de RE.** No hay perfiles de ingeniería inversa, ni un router que
   *identifique qué perfiles cleto se necesitan* para una tarea dada, ni un tipo de memoria
   para **hallazgos con evidencia**, ni inspectores nativos de artefactos (ELF/PE/Mach-O,
   APK/DEX, .NET, WASM, EVM, pcap, SQLite…).
4. **Archivos basura del upstream.** El fork arrastra un seed técnico, documentación y CI que
   describen al upstream (y ejes que eliminamos), por lo que mienten sobre este repo. El README
   además no es multi-idioma.

## Proposed change

Establecer la **fundación** del fork en siete áreas. Es una fundación: la implementación puede
ejecutarse en fases, pero el diseño de las siete queda fijado aquí.

**Naming**: `FRE` = *For Reverse Engineering* (Spec-FRE = Spec For Reverse Engineering).

### 1. Identidad del fork

- **Renombre de CLI/paquete**: `bin` → `ancleto-fre`; `name` → `@ancleto/spec-fre`;
  `repository`/`homepage`/`bugs` → `AncletoCEO/Spec-FRE`; `keywords` orientados a RE.
- **Publicación npm**: crear el paquete `@ancleto/spec-fre` desde cero y publicar con versionado
  SemVer + tags `vX.Y.Z` (misma mecánica que el upstream).
- **Eliminar el sistema de tiers**: quitar `--tier` (init/install/update), `src/core/tier-models.js`,
  `src/core/repomix-tier.js`, el archivo `.ancleto-tier`, el wizard de tier y de `gratisModel`
  (Muse Spark) y `ANCLETO_MUSE_SPARK`. **Se mantiene la paridad de LLMs**: mismos `model` ids
  por agente y mismos 8 hosts/IDE; el modelo deja de elegirse por tier y pasa a un default fijo
  por agente (configurable en `.ancleto-fre.rc` sin preguntar).
- **Eliminar Azure DevOps**: `--with-azure`, `azure.enabled` y la sección Azure de
  `templates/PRODUCT.md`.
- **Simplificar la instalación** a `agent → lang (→ exclude)`; sin preguntas de tier ni Azure.
- **Identidad total del fork** (es una herramienta aparte de ancleto, sin alias): renombrar los
  identificadores según el mapa de §1.1. Se acepta la máxima divergencia con upstream.

#### 1.1 Mapa de renombre

| Identificador | Antes | Después |
|---|---|---|
| Binario CLI | `ancleto`, `aspec` | `ancleto-fre` |
| Paquete npm | `@ancleto/spec` | `@ancleto/spec-fre` |
| Comandos (slash) | `commands/cleto-*.md` → `/cleto-*` | `commands/fre-*.md` → `/fre-*` |
| Skills | `skills/ancleto-*/` | `skills/fre-*/` (`triage-clarifier` sin cambio) |
| Storage de memoria | `.ancleto/` | `.ancleto-fre/` |
| Config de proyecto | `.ancletorc` | `.ancleto-fre.rc` |
| Servidor MCP | `ancleto-memory` | `ancleto-fre-memory` |
| Variables de entorno | `ANCLETO_*` | `ANCLETO_FRE_*` |
| Config global | `~/.config/ancleto/` | `~/.config/ancleto-fre/` |
| Tools MCP | `searchMemory` / `recordRule` / `recordDecision` | sin cambio (genéricos) |
| Agentes | `agents/*.md` | sin cambio (sin marca) |

### 2. Limpieza de archivos basura (específicos del fork)

Auditoría del árbol actual (232 archivos versionados, sin `node_modules` ni basura de
SO/editor; `.ancleto-fre/` quedará gitignoreado). Inventario y tratamiento:

| # | Archivo(s) | Por qué es basura acá | Tratamiento |
|---|---|---|---|
| A | `.discovery-map.json`, `docs/technical-discovery/**` (11 archivos) | Seed técnico del upstream: `index.md` dice "Seed técnico — `@ancleto/spec`", `pluginVersion 0.12.0`, lista `.opencode`/`optimizacion-de-tokens.md` que no existen en el fork | **Regenerar** para el fork con el discovery engine; si no se regenera ya, **borrar** para no mentir |
| B | `optimizacion-de-tokens.md` | Documenta el eje tokens, que el fork descarta | **Borrar** |
| C | `BACKLOG.md` | Backlog del upstream, ajeno al proyecto | **Borrar** |
| D | `docs/ancleto-cli-framework.md`, `docs/guia-configuracion.md`, `docs/instalacion-manual.md`, `docs/relevamiento-memoria-y-roles.md`, `docs/skill-ancleto-update.md`, `docs/skill-ancleto-upgrade.md` | Docs del upstream con identidad `ancleto` y configuración por tiers | **Reescribir o borrar**; conservar solo lo que siga siendo cierto |
| E | `DESIGN-memory-engine-v0.2.0.md` | Documenta el motor de memoria que extendemos (útil), pero con nombre/versión del upstream | **Conservar** y mover a `docs/` con nombre del fork |
| F | `test/tier-models.test.js`, `test/discovery-tier.test.js` | Tests del código de tiers que se elimina en §1 | **Borrar** junto con `src/core/tier-models.js` y `src/core/repomix-tier.js` |
| G | `.github/workflows/publish.yml` | Publica y verifica `@ancleto/spec` (URLs del canary apuntan al paquete upstream) | **Reescribir** para `@ancleto/spec-fre` o **deshabilitar** la publicación hasta decidirlo |
| H | `package-lock.json` | Queda desincronizado con el `name` nuevo | **Regenerar** tras renombrar |
| I | `CHANGELOG.md` | Historial del upstream | **Reiniciar** con una entrada `0.1.0` que referencie la base del fork (`8290eb7`) |
| J | `aspec/specs/{antigravity-support, commandcode-support, project-portability, copilot-support, linter-standard}/spec.md` | **No son basura**: specs válidas, pero mencionan `tier`, eje que se elimina | **Depurar** esas menciones (o declararlas `MODIFIED` en el change de implementación) |

Notas: `aspec/changes/fre-foundation/` es el change en curso (no basura). `profiles/test/` se
**conserva** como ejemplo del mecanismo de perfiles y base para los perfiles RE (§5).

### 3. README nuevo, multi-idioma

- **Reescribir** `README.md` desde cero (no traducir el del upstream): identidad de Spec-FRE,
  qué es un orquestador de RE, ciclo de uso, perfiles, núcleo nativo y puentes opcionales.
- **Estructura multi-idioma** (convención tipo `morluto/rea`): `README.md` como idioma primario
  y traducciones en `docs/readme/README_<lang>.md` (`en`, `pt`, …), con una **línea selectora de
  idioma** al tope de cada archivo. Español como primario (idioma del equipo), inglés incluido,
  extensible a N idiomas.
- Las convenciones de keywords de artifacts (`Requirement`, `Scenario`, `SHALL`…) y los nombres
  de archivos/directorios **no se traducen** en ninguna versión.

### 4. Núcleo nativo zero-dep (alcance Medium)

Inspectores implementados en Node puro (`node:sqlite`, `node:zlib`), sin dependencias externas:

- tipo/magic-bytes/entropía/strings/hashes; contenedores ZIP/APK/JAR;
- ELF/PE/Mach-O (headers, secciones, segmentos, símbolos, imports/exports, relocations);
- Go buildinfo; Rust cargo-auditable; WASM (secciones + decode WAT); EVM (opcodes + selectores);
- DEX (desensamblado smali-ish) + AXML; .NET (metadata + decode CIL); pcap/HAR; core dumps
  (notas ELF); SQLite.

### 5. Familia de perfiles RE

Perfiles como bundles (patrón `profiles/test`): `profile.json` (capacidades con
`impl: native | bridge`), `agents/`, `skills/`, `commands/`, `discovery.json`,
`memory-schema.json`. Organizados por dos ejes: **clase de target** (native, mobile, web,
dotnet, firmware, network, signals, data, runtime) × **capacidad/objetivo** (understand-behavior,
reconstruct-algorithm, extract-protocol, identify-crypto, deobfuscate/unpack, recover-format,
find-vuln). MVP inicial: `native`, `mobile`, `web`.

### 6. FRE Router (el diferencial)

Un agente/skill/comando (`re-router` + `fre-router` + `/fre-router`) que, dado **target +
pregunta**:

1. clasifica el target con el preclasificador nativo (determinista, sin LLM);
2. clasifica el objetivo con el planificador (LLM);
3. compone el vector target × objetivo → capacidades;
4. matchea contra perfiles instalados (nativa | puente | ausente);
5. si falta una capacidad/perfil, **propone un change** (nunca auto-instala);
6. entrega el plan de perfiles al orquestador SDD existente.

### 7. Memoria de evidencia y puentes opcionales

- **Tercer tipo de nodo `finding`** en el motor (`{claim, claim_type, source, tool,
  confidence, unknowns[], target_ref}`), con provenance **obligatoria** (sin `source`+`tool` no
  se guarda), recuperación reactiva (no se inyecta proactivamente) e **invalidación por hash**
  de `target_ref`. Un `finding` estable puede promover a `rule`/`decision`.
- **Puentes opcionales** detrás de un contrato de adaptador, **nunca dependencia dura**:
  decompilación nativa (Ghidra/IDA/Hopper), instrumentación dinámica (Frida), dispositivo (adb),
  navegador headless, extracción de firmware (binwalk/unblob), PTY (node-pty), decompile Java
  (jadx). Sin puente, el perfil opera **degradado** y el router lo reporta.

## Scope

In scope:
- Renombre de identidad total (binario, comandos `/fre-*`, skills `fre-*`, storage `.ancleto-fre/`,
  `.ancleto-fre.rc`, MCP `ancleto-fre-memory`, env `ANCLETO_FRE_*`) y actualización de `package.json`.
- Eliminación de tiers (código, tests, flags, wizard, docs) y de Azure, **manteniendo** model
  ids y hosts.
- Limpieza de los archivos basura del inventario §2 (borrar/regenerar/reescribir según la tabla).
- Nuevo `README.md` multi-idioma + `docs/readme/README_<lang>.md` con selector de idioma.
- Definición de perfiles RE (familia + `profile.json`) y MVP `native`/`mobile`/`web`.
- Núcleo nativo Medium (inspectores listados en §4).
- Router FRE (agente + skill + comando) y el tipo de memoria `finding`.
- Contrato de adaptador para puentes opcionales (declarado, con al menos un puente de referencia).
- Creación del paquete npm `@ancleto/spec-fre` desde cero y publicación de la primera versión
  (`0.1.0`) con versionado SemVer + tags; workflow de publicación del fork.

Out of scope:
- Implementar decompilación nativa, Frida, adb, browser o binwalk (solo contrato + referencia).
- Desensamblador CPU de propósito general (x86/ARM) y firmscan de extracción.
- Migración de los specs upstream en `aspec/specs/**` (se conservan como historia; solo se
  depuran las menciones a tiers listadas en §2-J).
- Cualquier dependencia externa dura.

## Risks

- **Conflictos de merge con upstream**: tocar `src/cli/index.js` y el core maximiza conflictos
  futuros. Mitigación: confinar adiciones en rutas propias (`profiles/fre/**`, `src/fre/**`) y
  documentar la "frontera de divergencia"; mantener `upstream` como remoto.
- **Divergencia total con upstream**: renombrar toda la identidad (CLI, comandos, skills, storage,
  MCP, env) hace que los cherry-picks de `upstream` no apliquen limpio. Mitigación: aceptado como
  decisión del fork (es una herramienta aparte); hacer el rename como un commit mecánico único y
  conservar `upstream` solo como referencia.
- **Borrar información útil del upstream**: resetear `CHANGELOG`/`BACKLOG` o borrar docs puede
  eliminar contexto. Mitigación: la historia queda en git y en el remoto `upstream`; el reset es
  de la *cara* del repo, no del contenido versionado. La tabla §2 marca qué se conserva (E).
- **Seed regenerado a medias**: borrar el seed sin regenerar deja al orquestador sin contexto.
  Mitigación: regenerar como parte de la misma fase; nunca borrar sin regenerar.
- **README desincronizado entre idiomas**: traducir se pudre. Mitigación: un idioma primario
  canónico, traducciones derivadas y marcadas como tales; convención de selector de idioma.
- **Evidencia silenciosamente errónea**: un `finding` con provenance débil contamina la memoria.
  Mitigación: `source`+`tool` obligatorios, `confidence`/`unknowns` de primera clase e
  invalidación por `target_ref`.
- **Ambigüedad de routing**: el router podría inventar capacidades que no existen. Mitigación:
  preclasificador determinista + GAP siempre como *change propuesto*, nunca auto-instalado.

## Non-goals

- No reimplementar Ghidra/Capstone (alcance Medium lo excluye explícitamente).
- No integrar `morluto/rea` ni heredar su stack de engines (fue solo referencia de diseño).
- No optimizar tokens ni reemplazar el sistema de tiers por otro equivalente (se elimina, no se
  sustituye): el fork no compite por costo de contexto.
- No cambiar la API de memoria existente (`searchMemory`/`recordRule`/`recordDecision`); el tipo
  `finding` es aditivo.
- No migrar el proyecto a otro lenguaje ni abandonar Node ≥ 24 + `node:sqlite`.

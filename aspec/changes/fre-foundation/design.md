# Design: Spec-FRE — Fundación del orquestador de ingeniería inversa y limpieza del fork

## Decisiones de diseño

### 1. Frontera de divergencia e identidad

El fork ES una herramienta aparte (no un alias de ancleto): se asume **divergencia total** con
upstream. Los identificadores se renombran según el mapa del proposal §1.1 (binario `ancleto-fre`,
comandos `/fre-*`, skills `fre-*`, storage `.ancleto-fre/`, config `.ancleto-fre.rc`, MCP
`ancleto-fre-memory`, env `ANCLETO_FRE_*`). Los cherry-picks de `upstream` dejan de aplicar
limpio: `upstream` queda como referencia, no como fuente de merges rutinarios.

Lo nuevo vive en rutas propias:

```
src/fre/**               # router, inspectores nativos, contrato de puente
profiles/fre/**          # familia de perfiles RE
agents/re-router.md      # agente del router
skills/fre-router/       # skill del router
commands/fre-router.md   # comando del router (/fre-router)
```

Las modificaciones al core se confinan a `src/cli/index.js`, `package.json`, `templates/*` y
`src/core/memory/engine.js` (aditivo: tabla `findings`).

**Razón**: el fork es un producto distinto; la identidad consistente pesa más que la comodidad de
merge con el upstream, que se acepta como costo.

### 2. Eliminación de tiers (mecánica)

```
BORRAR    src/core/tier-models.js · src/core/repomix-tier.js
          test/tier-models.test.js · test/discovery-tier.test.js
QUITAR    en src/cli/index.js: flags --tier y --with-azure, wizard de tier y de gratisModel,
          lectura/escritura de .ancleto-tier y ANCLETO_MUSE_SPARK
          en src/core/discovery.js: budget de tokens por tier
MANTENER  el mapa de modelos del tier `normal` pasa a ser el DEFAULT FIJO por agente
```

`resolveModel(agent)` deja de recibir `tier` y devuelve el default del agente (o el valor de
`.ancleto-fre.rc → models[<agent>]` si existe). Paridad de LLMs: mismos `model` ids y mismos 8 hosts.

### 3. Núcleo nativo (Medium) — layout

```
src/fre/inspect/        # un módulo por formato, sin dependencias externas
  magic.js strings.js entropy.js
  zip.js elf.js pe.js macho.js go.js rust.js
  wasm.js evm.js dex.js axml.js dotnet.js pcap.js core.js sqlite.js
src/fre/re-inventory.js # entrypoint: clasifica el target y despacha
```

`re-inventory.js` lee los primeros bytes, determina el tipo (magic bytes) y devuelve un
inventario estructurado `{kind, arch, sections[], symbols[], imports[], strings[], hashes[]}`.
Se expone por CLI (`ancleto-fre inspect <target> [--json]`) y por MCP (`ancleto-fre-re`, tool
`inspect_target`). Cada inspector es puro y testeable en aislamiento.

### 4. Perfiles RE — schema

```
profiles/fre/<clase>/
  profile.json       # { id, targetClasses[], capabilities[{id, impl:"native"|"bridge", provider?, required:false}], entryCommands[] }
  agents/            # agentes del perfil
  skills/<n>/SKILL.md
  commands/<n>.md
  discovery.json     # cómo inventariar esta clase de target
  memory-schema.json # tipos de finding propios
```

Se reusa el patrón `profiles/test`. MVP: `native`, `mobile`, `web`. La composición es por dos
ejes: **clase de target** × **capacidad/objetivo** (una capacidad transversal como `identify-crypto`
o `deobfuscate` se combina con cualquier clase).

### 5. FRE Router

```
intake(target, pregunta)
  → preclasificador NATIVO (determinista, sin LLM): re-inventory → targetClasses
  → planner (LLM): objetivo → capacidades requeridas
  → match vs. profile.json instalados → { native | bridge | ausente }
  → GAP → emite un CHANGE propuesto (nunca instala)
  → plan de perfiles → hand-off al orquestador SDD (rutea agentes dentro de cada perfil)
```

El GAP se materializa como un `aspec/changes/<name>/proposal.md` mínimo (plantilla) que el
usuario aprueba. El router nunca auto-instala ni auto-habilita puentes.

### 6. Memoria de evidencia (`finding`)

Tabla nueva, aditiva, sobre `node:sqlite`; no se toca el schema de `memory_nodes`:

```sql
CREATE TABLE findings (
  id INTEGER PRIMARY KEY,
  memory_key TEXT NOT NULL,
  claim TEXT NOT NULL,
  claim_type TEXT NOT NULL,          -- observation | inference | hypothesis
  source TEXT NOT NULL,              -- file:offset | símbolo | tool-call
  tool TEXT NOT NULL,                -- elf-inspector | dex-disasm | ...
  confidence REAL NOT NULL,          -- 0..1
  unknowns TEXT,                     -- JSON array
  target_ref TEXT NOT NULL,          -- hash del artefacto
  scope TEXT NOT NULL DEFAULT 'project',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);
CREATE VIRTUAL TABLE findings_fts USING fts5(claim, memory_key, content='findings', content_rowid='id');
```

- `recordFinding()` **rechaza** entradas sin `source` o `tool` (provenance obligatoria).
- `searchFindings()` filtra por `target_ref` y por símbolo/dirección además de BM25.
- **Invalidación por hash**: si el `target_ref` (hash del artefacto) no coincide con el target
  actual, el finding se marca `stale` y no se surface como vigente.
- Los `finding` **no** entran a `<ProjectMemoryRules>` (recuperación reactiva, como las
  `decision`). Un finding estable puede **promover** a `rule`/`decision` vía las tools
  existentes.

### 7. Puentes opcionales — contrato

```
src/fre/bridge/contract.js
  detect(provider)      -> boolean          # ¿está disponible el engine?
  available()           -> [{id, provider, capabilities[]}]
  invoke(capability, …) -> { result, evidence } | DEGRADED
```

Sin puente, el perfil opera **degradado**: el router reporta `degraded: capability X requiere
provider Y` y continúa con lo que el núcleo nativo cubre. Se incluye **un** puente de
referencia (p.ej. `objdump`/`ghidra headless` detectado, con `invoke` no-op documentado) para
fijar el contrato y los tests.

### 8. Limpieza de basura — mecánica

Se ejecuta según la tabla §2 del proposal. Orden obligatorio por el riesgo "seed sin
regenerar": **regenerar el seed** (`.discovery-map.json` + `docs/technical-discovery/`) como
parte de la misma fase en que se borra; nunca borrar sin regenerar. Los borrados/reescrituras
van en commits chicos y separables por categoría (A–J).

### 9. README multi-idioma — mecánica

```
README.md                      # idioma primario (es)
docs/readme/README_en.md       # traducción
docs/readme/README_<lang>.md   # extensible
```

Cada archivo abre con una **línea selectora** de idiomas (links relativos). El README se
**reescribe** (no se traduce el del upstream). Convención: keywords de artifacts y nombres de
archivos/directorios no se traducen.

### 10. Release y versionado (paridad con ancleto/spec)

Se replica la mecánica del upstream (no se introducen herramientas de release):

- **SemVer manual**: `package.json.version` es la fuente de verdad; cada release se marca con un
  tag `vX.Y.Z`; `CHANGELOG.md` se actualiza en el mismo commit. Sin release-please ni
  semantic-release.
- **Paquete creado de cero**: `@ancleto/spec-fre` es un paquete **nuevo** (no continúa la
  numeración `0.13.x` del upstream). Arranca en `0.1.0` con `publishConfig.access: public`.
- **Publicación por tag**: `.github/workflows/publish.yml` dispara en `v*` (y
  `workflow_dispatch`), corre `npm ci` + `lint` + `test`, publica si la versión no existe, crea
  el GitHub Release y verifica el tarball con un canary apuntando al paquete nuevo.
- **Acceso**: scope `@ancleto` en npm y secreto `NPM_TOKEN` en `AncletoCEO/Spec-FRE`.

**Razón**: el equipo ya conoce esta mecánica; heredarla reduce fricción y evita sumar
dependencias de tooling, en línea con el principio auto-contenido del fork.

### 11. Banner de instalación (identidad visual)

El banner de `ancleto-fre install` (hoy en `src/cli/ui.js`: constantes `CUP` + `LOGO`) SHALL
cambiar **solo el texto en bloque**: de `ANCLETO` a `ANCLETO-FRE`. La **taza (`CUP`) se conserva
tal cual**. Se mantienen `CUP_PALETTE`/`TEXT_PALETTE` y el efecto de onda, y `CUP.length` no
cambia, por lo que `TEXT_START` se preserva.

**Razón**: identidad del fork sin alterar el isotipo de la taza.

## Trade-offs

| Decisión | Alternativa | Por qué esta |
|---|---|---|
| Adiciones en `src/fre/**` y `profiles/fre/**` | Modificar el core existente | Minimiza conflictos de merge con upstream |
| Identidad total (CLI + comandos + skills + storage + MCP + env) | Renombrar solo binario + `package.json` | El fork es una herramienta aparte; identidad consistente > comodidad de merge |
| Banner: conservar la taza + texto `ANCLETO-FRE` | Rediseñar la taza (llave inglesa) | Se mantiene el isotipo; solo cambia el wordmark |
| Medios nativos en Node puro | Delegar todo a engines externos | Auto-contenido; externo solo cuando es 100% necesario |
| Excluir decompilador/disassembler CPU | Incluirlo (Ambicioso) | No compra independencia (igual se necesita Ghidra) y el costo no cierra |
| `finding` en tabla propia aditiva | Agregar campos a `memory_nodes` | Evita migrar el schema existente y no arriesga la memoria de reglas |
| Invalidación por hash de `target_ref` | Sin invalidación | Un binario que cambia invalida sus hallazgos; sin esto la memoria miente |
| GAP como change propuesto | Routing que auto-instala perfiles | Evita perfiles fantasma y scope creep |
| Seed regenerado en la misma fase | Borrar y regenerar después | El orquestador no debe quedar sin contexto técnico |
| Versionado manual por tags (SemVer + CHANGELOG) | release-please / semantic-release | Paridad con el upstream; mecánica conocida y sin dependencias de tooling |
| Paquete nuevo arranca en `0.1.0` | Continuar `0.13.x` del upstream | Es un paquete npm distinto; continuar la numeración confundiría versiones |

## No-decisiones

- **No cambiar `memory_nodes`**: el tipo `finding` es aditivo en tabla aparte.
- **No tocar `searchMemory`/`recordRule`/`recordDecision`**: firmas intactas.
- **No agregar dependencias externas duras**: solo `node:sqlite`, `node:zlib`, `node:*`.
- **No reimplementar Ghidra/Capstone**: fuera de alcance Medium.
- **No migrar los specs upstream**: se conservan; solo se depuran las menciones a tiers (§2-J).

## Validación

- **Unitarios**: cada inspector nativo con fixtures mínimos por formato (magic, ELF/PE/Mach-O,
  ZIP/APK, DEX, AXML, WASM, EVM, .NET, pcap, SQLite); `recordFinding` rechaza entradas sin
  provenance; `searchFindings` filtra por `target_ref`; invalidación por hash.
- **Router**: dado un target de prueba y una pregunta, el plan resultante lista los perfiles
  esperados; ante un target sin perfil, emite un GAP como change (no instala).
- **Instalación**: `ancleto-fre install` no pregunta tier ni Azure; genera `.ancleto-fre.rc` sin
  `tier`/`azure`/`gratisModel`; los model ids por agente coinciden con los del tier `normal`.
- **Banner**: `ancleto-fre install` muestra la taza original y el texto `ANCLETO-FRE`; `TEXT_START`
  se mantiene (el alto de `CUP` no cambia).
- **Limpieza**: `ancleto-fre discovery --check` reporta `READY` con el seed regenerado; no
  quedan referencias a `@ancleto/spec` en `package.json`, `publish.yml` ni el canary.
- **Regresión**: `npm run lint` y `npm test` verdes; los tests de tiers eliminados no dejan
  referencias colgantes.
- **Release**: `npm view @ancleto/spec-fre version` responde `0.1.0`; el tag `v0.1.0`, la versión
  en `package.json` y la entrada del `CHANGELOG` coinciden; el workflow de `publish.yml` dispara
  con el tag.

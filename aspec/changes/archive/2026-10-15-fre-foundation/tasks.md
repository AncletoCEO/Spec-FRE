# Tasks: Spec-FRE — Fundación del orquestador de ingeniería inversa y limpieza del fork

## Fase 1 — Identidad y eliminación de ejes no usados

- [x] **T1**: Renombrar la identidad total del fork (mapa §1.1 del proposal)
  - `package.json`: `bin` → `ancleto-fre`; `name` → `@ancleto/spec-fre`;
    `repository`/`homepage`/`bugs` → `AncletoCEO/Spec-FRE`; `keywords` orientados a RE
  - Comandos `commands/cleto-*.md` → `commands/fre-*.md` (slash `/fre-*`)
  - Skills `skills/ancleto-*/` → `skills/fre-*/` (excepto `triage-clarifier`)
  - Storage `.ancleto/` → `.ancleto-fre/`; config `.ancletorc` → `.ancleto-fre.rc`; actualizar `.gitignore`
  - MCP server `ancleto-memory` → `ancleto-fre-memory`; env `ANCLETO_*` → `ANCLETO_FRE_*`;
    config global `~/.config/ancleto/` → `~/.config/ancleto-fre/`
  - Banner (`src/cli/ui.js`): conservar la taza original; cambiar el texto en bloque a `ANCLETO-FRE`
  - Verificar que `ancleto-fre --help` y `ancleto-fre install` funcionan

- [x] **T2**: Eliminar el sistema de tiers
  - Borrar `src/core/tier-models.js` y `src/core/repomix-tier.js`
  - Quitar en `src/cli/index.js`: flags `--tier`, wizard de tier y de `gratisModel`,
    `ANCLETO_MUSE_SPARK`, lectura/escritura de `.ancleto-tier`
  - `resolveModel(agent)` → default fijo por agente (el mapa del tier `normal`)

- [x] **T3**: Quitar el budget de tokens por tier en `src/core/discovery.js`

- [x] **T4**: Eliminar Azure DevOps
  - Quitar `--with-azure`, `azure.enabled` y la sección Azure de `templates/PRODUCT.md`

- [x] **T5**: Simplificar el flujo de instalación a `agent → lang (→ exclude)`
  - Sin preguntas de tier ni Azure; `.ancleto-fre.rc` sin `tier`/`azure`/`gratisModel`, con `models` opcional
  - Verificar paridad de model ids y de los 8 hosts

- [x] **T6**: Sweep completo de referencias de identidad en `skills/`, `agents/`, `commands/` y `docs/`
  - `ancleto <cmd>` → `ancleto-fre <cmd>`; `/cleto-*` → `/fre-*`; `.ancleto/` → `.ancleto-fre/`;
    `.ancletorc` → `.ancleto-fre.rc`
  - Sin alias back-compat (el fork es una herramienta aparte)
  - Verificar que ninguna skill/command invoque un binario o path inexistente

## Fase 2 — Limpieza de archivos basura (tabla §2 del proposal)

- [x] **T7**: Borrar la basura de identidad del upstream
  - §2-B `optimizacion-de-tokens.md`; §2-C `BACKLOG.md`

- [x] **T8**: Depurar/reescribir los docs del upstream (§2-D) y conservar el diseño del motor
  - §2-E: mover `DESIGN-memory-engine-v0.2.0.md` a `docs/` con nombre del fork
  - §2-D: reescribir o borrar `docs/ancleto-*.md`, `docs/guia-configuracion.md`,
    `docs/instalacion-manual.md`, `docs/relevamiento-memoria-y-roles.md`

- [x] **T9**: Borrar los tests del código eliminado (§2-F)
  - `test/tier-models.test.js`, `test/discovery-tier.test.js`

- [x] **T10**: Reescribir la CI para el fork (§2-G)
  - `.github/workflows/publish.yml`: `@ancleto/spec` → `@ancleto/spec-fre` (URL del canary incluida)

- [x] **T11**: Regenerar metadatos y seed del fork
  - §2-H: regenerar `package-lock.json` tras el renombre
  - §2-A: regenerar `.discovery-map.json` y `docs/technical-discovery/**`
  - Verificar con `ancleto-fre discovery --check` → `READY` (nunca borrar sin regenerar)

- [x] **T12**: Reiniciar `CHANGELOG.md` con la entrada `0.1.0` (base `8290eb7`)

- [x] **T13**: Depurar las menciones a `tier` en los specs existentes (§2-J) — formalizado en los
  deltas `MODIFIED` de este change

## Fase 3 — README multi-idioma

- [x] **T14**: Reescribir `README.md` (es) con la identidad de Spec-FRE (no traducir el del upstream)

- [x] **T15**: Crear `docs/readme/README_en.md` y la línea selectora de idioma en ambos archivos

## Fase 4 — Núcleo nativo (Medium)

- [x] **T16**: `src/fre/inspect/magic.js` + `strings.js` + `entropy.js` (detección de tipo, sin deps)

- [x] **T17**: Inspectores de contenedor y ejecutables: `zip.js`, `elf.js`, `pe.js`, `macho.js`

- [x] **T18**: Metadatos de build: `go.js` (buildinfo), `rust.js` (cargo-auditable)

- [x] **T19**: ISAs cerradas: `wasm.js` (secciones + WAT), `evm.js` (opcodes + selectores)

- [x] **T20**: Móvil y managed: `dex.js` (disasm smali-ish), `axml.js`, `dotnet.js` (metadata + CIL)

- [x] **T21**: `pcap.js`, `core.js` (notas ELF), `sqlite.js`

- [x] **T22**: `src/fre/re-inventory.js` (entrypoint) y exposición por CLI (`ancleto-fre inspect`)
  y MCP (`ancleto-fre-re` → `inspect_target`)

## Fase 5 — Familia de perfiles RE

- [x] **T23**: Definir el schema `profile.json` (capabilities con `impl: native | bridge`)

- [x] **T24**: Implementar los perfiles MVP `native`, `mobile`, `web` (`profiles/fre/**`)

## Fase 6 — FRE Router

- [x] **T25**: `agents/re-router.md` (preclasificador + planner + GAP→change)

- [x] **T26**: `skills/fre-router/SKILL.md` y `commands/fre-router.md` (`/fre-router`)

- [x] **T27**: Pipeline de composición target × objetivo → plan de perfiles; GAP emite un
  `aspec/changes/<name>/proposal.md` mínimo (no instala)

## Fase 7 — Memoria de evidencia

- [x] **T28**: Tabla `findings` + `findings_fts` (migración aditiva, sin tocar `memory_nodes`)

- [x] **T29**: `recordFinding()` con provenance obligatoria (`source`+`tool`) y `searchFindings()`
  con filtro por `target_ref`

- [x] **T30**: Invalidación por hash de `target_ref` (marca `stale`); promoción finding → rule/decision

## Fase 8 — Puentes opcionales

- [x] **T31**: `src/fre/bridge/contract.js` (`detect`/`available`/`invoke`) + modo degradado

- [x] **T32**: Un puente de referencia con `invoke` no-op documentado y su test

## Fase 9 — Testing y validación

- [x] **T33**: Tests unitarios por inspector nativo (fixtures mínimos por formato)

- [x] **T34**: Tests del router (plan esperado; GAP como change, no instalación)

- [x] **T35**: Tests de memoria de evidencia (provenance obligatoria, filtro por `target_ref`,
  invalidación por hash)

- [x] **T36**: Tests de instalación simplificada (sin preguntas de tier/Azure; model ids = `normal`)

- [x] **T37**: Correr `npm run lint` y `npm test` y verificar que todo pasa sin referencias colgantes

## Fase 10 — Deploy a NPM (crear de cero + versionado)

- [x] **T38**: Preparar la identidad de publicación en `package.json`
  - `name: @ancleto/spec-fre`, `publishConfig.access: public`, `files` acotado, `engines.node >= 24`,
    `license: MIT`, `repository`/`homepage`/`bugs` a `AncletoCEO/Spec-FRE`

- [x] **T39**: Definir el versionado con paridad al upstream (SemVer manual, sin release tooling)
  - `package.json.version` es la fuente; un tag `vX.Y.Z` por release; `CHANGELOG.md` actualizado por
    release. Inicio en `0.1.0` (paquete nuevo; NO continúa la numeración `0.13.x` del upstream)

- [x] **T40**: Reescribir `.github/workflows/publish.yml` para el paquete nuevo
  - Trigger en `v*` (y `workflow_dispatch`): `npm ci`, `npm run lint`, `node --test`,
    `npm publish` si la versión no existe, GitHub Release del tag, y canary apuntando al tarball
    de `@ancleto/spec-fre`

- [x] **T41**: Configurar el despliegue
  - Verificar acceso al scope `@ancleto` en npm (read-write ✓)
  - Configurar **Trusted Publishing** del paquete en npmjs.com (Provider GitHub Actions · Repository
    `AncletoCEO/Spec-FRE` · Workflow `publish.yml`). **Sin** `NPM_TOKEN` de larga vida
  - Validado: el publish de `0.1.1` por OIDC desde GitHub Actions completó (con provenance/attestation)

- [x] **T42**: Publicar la primera versión `0.1.0`
  - Crear el paquete `@ancleto/spec-fre` desde cero (`npm publish --access public`) y crear el
    Release `v0.1.0`

- [x] **T43**: Verificar el artefacto publicado
  - `npm view @ancleto/spec-fre version` responde `0.1.0`; `npm i -g @ancleto/spec-fre` y
    `ancleto-fre --version` devuelven `0.1.0`
  - El tag `v0.1.0`, la versión en `package.json` y el `CHANGELOG` coinciden

# Changelog

Todas las versiones notables de `@ancleto/spec-fre`.

## [0.1.2] - 2026-10-15

### Changed

- README: badges (npm/Node/licencia/dependencias/foco), ejemplo de ingeniería inversa y
  referencia CLI completa; mirrors en `docs/readme/README_en.md`.

## [0.1.1] - 2026-10-15

### Changed

- Publicación a npm vía **Trusted Publishing** (OIDC) en lugar de `NPM_TOKEN`.
- Seed técnico regenerado para el fork; specs sincronizadas (`fre-orchestrator`,
  `fre-core-inspectors`, `evidence-memory`, `fork-identity`, `npm-release`) y change
  `fre-foundation` archivado.

## [0.1.0] - 2026-10-15

### Added

- Fork inicial de `@ancleto/spec` (ANCLETO/aspec), base `8290eb7` (~v0.13.x), enfocado en
  ingeniería inversa: **Spec For Reverse Engineering**.

### Changed

- **Identidad total del fork**: CLI `ancleto-fre`, comandos `/fre-*`, skills `fre-*`, storage
  `.ancleto-fre/`, config `.ancleto-fre.rc`, servidor MCP `ancleto-fre-memory`, variables
  `ANCLETO_FRE_*`.
- **Instalación simplificada**: sin tiers ni Azure DevOps; el modelo es fijo por agente.
- **Banner**: se conserva la taza original; el wordmark pasa a `ANCLETO-FRE`.

### Removed

- Sistema de tiers (`normal` / `minimo` / `gratis`), `gratisModel` / Muse Spark y Azure DevOps.
- Documentación del upstream relativa a tiers/Azure (`optimizacion-de-tokens.md`, `BACKLOG.md`
  y los docs de `docs/` con identidad del upstream).

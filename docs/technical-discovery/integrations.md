---
node: integrations
kind: integrations
read_when: "sistemas externos y dependencias privadas observables"
generatedAt: 2026-10-15T00:00:00Z
pluginVersion: 0.1.0
skillVersion: '2.3'
---

# Integraciones y dependencias externas

- **npm**: paquete `@ancleto/spec-fre` (scope `@ancleto`). Publicación por tag `v*` vía
  `.github/workflows/publish.yml` usando **Trusted Publishing** (OIDC, `id-token: write`) con
  `--provenance`; **sin** `NPM_TOKEN`. `declarado`.
- **GitHub**: repo `AncletoCEO/Spec-FRE` (`repository`/`homepage`/`bugs` en `package.json`).
- **Repomix** (`npx repomix@1.18.0`): empaquetado del repo para el seed. Opcional. `observado`
  (`src/cli/index.js`).
- **MCP (IDE)**: dos servidores propios —
  - `ancleto-fre-memory` (stdio, `ancleto-fre mcp`): tools `searchMemory`, `recordRule`, `recordDecision`.
  - `ancleto-fre-re` (stdio, `ancleto-fre mcp-re`): tools `inspect_target`, `record_finding`, `search_findings`.
  - Opcionales de terceros: `engram` (`--with-engram`) y `caveman` (compresión). `observado`.
- **Puentes de RE** (opcionales, no dependencias duras): ghidra/ida/hopper (decompilación nativa),
  objdump/rizin (disassemble), frida (instrumentación), adb (dispositivos), jadx (Java), chrome
  (navegador), binwalk (firmware). Se detectan por presencia en `PATH`. `observado`
  (`src/fre/bridge/contract.js`).
- **Azure DevOps**: **removido** (no hay integración). `observado`.

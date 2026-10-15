---
node: inventory
kind: inventory
read_when: "cobertura por directorios/globs"
generatedAt: 2026-10-15T00:00:00Z
pluginVersion: 0.1.0
skillVersion: '2.3'
---

# Inventario (orientación)

| Área | Contenido |
|---|---|
| `src/cli/**` | Entry point (`index.js`) y UI TTY (`ui.js`). |
| `src/core/**` | `discovery.js`, `adapters/frontmatter.js`. |
| `src/core/memory/**` | `database.js`, `engine.js`, `tools.js`, `mcp-server.js`, `doctor.js`, `working-context.js`. |
| `src/fre/**` | `re-inventory.js`, `router.js`, `profiles.js`, `mcp-re-server.js`. |
| `src/fre/inspect/**` | 17 inspectores: `magic`, `strings`, `entropy`, `zip`, `elf`, `pe`, `macho`, `go`, `rust`, `wasm`, `evm`, `dex`, `axml`, `dotnet`, `pcap`, `core`, `sqlite`. |
| `src/fre/bridge/**` | `contract.js`, `reference.js`. |
| `agents/**` | 11 subagentes `.md`. |
| `commands/**` | 17 comandos `/fre-*`. |
| `skills/**` | 22 skills (`SKILL.md` + `references/`). |
| `profiles/test/**` | Overlay de test automation. |
| `profiles/fre/**` | Perfiles RE (`schema`, `native`, `mobile`, `web`). |
| `templates/**` | `AGENTS.md`, `PRODUCT.md`. |
| `aspec/**` | `config.yaml`, `specs/**` (16), `changes/**` (activos + `archive/`). |
| `docs/**` | `technical-discovery/**` (este seed), `readme/`, `memory-engine-design.md`. |
| `test/**` | 13 archivos `node --test`. |
| `.github/workflows/**` | `publish.yml`. |
| Raíz | `package.json`, `CHANGELOG.md`, `README.md`, `PRODUCT.md`, `AGENTS.md`, `eslint.config.js`. |

El seed cubre decisiones y paths, no cada archivo.

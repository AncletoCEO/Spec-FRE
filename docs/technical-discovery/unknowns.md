---
node: unknowns
kind: limits
read_when: "límites de evidencia: qué no se pudo verificar"
generatedAt: 2026-10-15T00:00:00Z
pluginVersion: 0.1.0
skillVersion: '2.3'
---

# Límites de evidencia

- **`aspec/specs/**`**: los specs conservan texto del upstream con menciones a tiers; su depuración
  está formalizada en los deltas `MODIFIED` del change `fre-foundation`, **aún no sincronizados** a
  los main specs. Hasta el archive/sync, pueden contradecir el código.
- **Seed previo**: el seed listaba `pluginVersion 0.12.0` y ejes del upstream; este documento lo
  reemplaza. `generatedAt` fija la fecha de esta regeneración.
- **Puentes**: no se implementó ningún engine externo real; `invoke` es un **no-op documentado**.
  El disassembly/decompilación/dinámica real requieren providers instalados. No verificado en runtime.
- **Inspectors no ejercitados con fixtures reales**: PE/Mach-O/DEX/AXML/.NET/EVM no se probaron sobre
  muestras reales en este entorno (solo fixtures mínimos). No verificado end-to-end.
- **Publicación npm**: no se ejecutó (`npm whoami` → `ENEEDAUTH`); el workflow no se disparó.
- **`docs/readme/README_en.md`**: traducción mantenida a mano; puede desincronizarse del `README.md`.
- **Conteos**: cambian con frecuencia; verificar con `ls` antes de citarlos.

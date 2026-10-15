---
description: Move a project between machines via ancleto-fre export/import
---

Mudá un proyecto ancleto-fre entre máquinas sin romper el MCP local.

**En la máquina origen** (antes de copiar el proyecto), parado en su raíz:

```bash
ancleto-fre export --tar traslado.tgz
```

Llevá el proyecto + `traslado.tgz` a la máquina destino (cualquier medio: USB, red, nube).

**En la máquina destino** (tras copiar el proyecto), parado en su raíz:

```bash
ancleto-fre import traslado.tgz
```

Esto aplica los portables (`.ancleto-fre.rc`, templates, `aspec/`, agents, commands, skills),
regenera las entradas MCP con las rutas locales y corre `ancleto-fre doctor` al final.

Si no tenés bundle y el `opencode.json` apunta a rutas inexistentes:

```bash
ancleto-fre import --repair
```

Nunca se exportan credenciales, tokens, `service.json`, la config global ni `memory.db`.

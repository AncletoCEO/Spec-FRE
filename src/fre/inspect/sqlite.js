// Inspector de bases SQLite usando el módulo nativo node:sqlite (sin dependencias).
// Recibe la RUTA del archivo (no un buffer).

import { DatabaseSync } from 'node:sqlite'

export function inspectSqlite(path) {
  const db = new DatabaseSync(path, { readOnly: true })
  try {
    const objects = db
      .prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table','view','index','trigger') ORDER BY type, name")
      .all()
    const tables = objects.filter((o) => o.type === 'table').map((o) => o.name)
    const views = objects.filter((o) => o.type === 'view').map((o) => o.name)
    const indexes = objects.filter((o) => o.type === 'index').map((o) => o.name)
    const triggers = objects.filter((o) => o.type === 'trigger').map((o) => o.name)

    const columns = {}
    for (const t of tables) {
      try {
        columns[t] = db
          .prepare(`PRAGMA table_info(${JSON.stringify(t)})`)
          .all()
          .map((c) => ({ name: c.name, type: c.type, notnull: Boolean(c.notnull), pk: Boolean(c.pk) }))
      } catch {
        columns[t] = []
      }
    }

    return { kind: 'sqlite', tables, views, indexes, triggers, columns }
  } finally {
    db.close()
  }
}

// Inspector de módulos WebAssembly: secciones, imports y exports. Node puro.

const SECTION_NAMES = {
  0: 'custom', 1: 'type', 2: 'import', 3: 'function', 4: 'table', 5: 'memory',
  6: 'global', 7: 'export', 8: 'start', 9: 'element', 10: 'code', 11: 'data', 12: 'datacount'
}

const EXTERNAL_KINDS = { 0: 'func', 1: 'table', 2: 'mem', 3: 'global' }

function lebU32(buf, state) {
  let result = 0
  let shift = 0
  while (state.pos < buf.length) {
    const b = buf[state.pos++]
    result |= (b & 0x7f) << shift
    if ((b & 0x80) === 0) break
    shift += 7
    if (shift > 35) break
  }
  return result >>> 0
}

function readName(buf, state) {
  const len = lebU32(buf, state)
  const s = buf.toString('utf8', state.pos, state.pos + len)
  state.pos += len
  return s
}

export function inspectWasm(buf) {
  if (buf.length < 8 || buf.readUInt32LE(0) !== 0x6d736100) throw new Error('not a WASM module')
  const version = buf.readUInt32LE(4)
  const state = { pos: 8 }
  const sections = []
  const imports = []
  const exportsList = []

  while (state.pos < buf.length) {
    const id = buf[state.pos++]
    const size = lebU32(buf, state)
    const bodyStart = state.pos
    const bodyEnd = Math.min(buf.length, bodyStart + size)
    sections.push({ id, name: SECTION_NAMES[id] || `section-${id}`, size })

    if (id === 2) {
      const count = lebU32(buf, state)
      for (let i = 0; i < count; i++) {
        const module = readName(buf, state)
        const field = readName(buf, state)
        const kind = buf[state.pos++]
        if (kind === 0) lebU32(buf, state)
        else if (kind === 1) { buf[state.pos++]; lebU32(buf, state); const fl = buf[state.pos++]; if (fl) lebU32(buf, state) }
        else if (kind === 2) { const fl = buf[state.pos++]; if (fl) lebU32(buf, state) }
        else if (kind === 3) { buf[state.pos++]; buf[state.pos++] }
        imports.push({ module, field, kind: EXTERNAL_KINDS[kind] || kind })
      }
    } else if (id === 7) {
      const count = lebU32(buf, state)
      for (let i = 0; i < count; i++) {
        const name = readName(buf, state)
        const kind = buf[state.pos++]
        const index = lebU32(buf, state)
        exportsList.push({ name, kind: EXTERNAL_KINDS[kind] || kind, index })
      }
    }

    state.pos = bodyEnd
  }

  return {
    kind: 'wasm',
    version,
    sectionNames: sections.map((s) => s.name),
    importCount: imports.length,
    exportCount: exportsList.length,
    imports: imports.slice(0, 300),
    exports: exportsList.slice(0, 300),
    wat: renderWat(imports, exportsList)
  }
}

function renderWat(imports, exportsList) {
  const lines = []
  for (const i of imports) lines.push(`(import "${i.module}" "${i.field}" (${i.kind}))`)
  for (const e of exportsList) lines.push(`(export "${e.name}" (${e.kind} ${e.index}))`)
  return lines.slice(0, 300).join('\n')
}

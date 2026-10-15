// Inspector de DEX (Android). Header, strings, tipos, clases y métodos.
// Node puro, sin dependencias. (No desensambla bytecode: lista clases/métodos.)

function uleb128(buf, state) {
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

export function inspectDex(buf) {
  const magic = buf.toString('latin1', 0, 3)
  if (magic !== 'dex' || buf[7] !== 0x00) throw new Error('not a DEX file')
  const version = buf.toString('latin1', 4, 7)
  const u32 = (o) => buf.readUInt32LE(o)

  const fileSize = u32(0x20)
  const stringIdsSize = u32(0x38)
  const stringIdsOff = u32(0x3c)
  const typeIdsSize = u32(0x40)
  const typeIdsOff = u32(0x44)
  const methodIdsSize = u32(0x58)
  const methodIdsOff = u32(0x5c)
  const classDefsSize = u32(0x60)
  const classDefsOff = u32(0x64)

  const strings = readStrings(buf, stringIdsSize, stringIdsOff, uleb128)
  const types = []
  for (let i = 0; i < Math.min(typeIdsSize, 20000); i++) {
    const strIdx = u32(typeIdsOff + i * 4)
    types.push(strings[strIdx] || null)
  }

  const classes = []
  for (let i = 0; i < Math.min(classDefsSize, 20000); i++) {
    const classIdx = u32(classDefsOff + i * 32)
    classes.push(shortenDescriptor(types[classIdx]))
  }

  const methods = []
  for (let i = 0; i < Math.min(methodIdsSize, 20000); i++) {
    const b = methodIdsOff + i * 8
    const classIdx = buf.readUInt16LE(b)
    const nameIdx = u32(b + 4)
    methods.push({ class: shortenDescriptor(types[classIdx]), name: strings[nameIdx] || null })
  }

  return {
    kind: 'dex',
    version,
    fileSize,
    stringCount: stringIdsSize,
    typeCount: typeIdsSize,
    methodCount: methodIdsSize,
    classCount: classDefsSize,
    classes: classes.slice(0, 500),
    methods: methods.slice(0, 1000)
  }
}

function readStrings(buf, count, off, uleb128) {
  const out = []
  for (let i = 0; i < Math.min(count, 200000); i++) {
    const strOff = buf.readUInt32LE(off + i * 4)
    if (strOff <= 0 || strOff >= buf.length) { out.push(null); continue }
    const state = { pos: strOff }
    uleb128(buf, state)
    let end = state.pos
    while (end < buf.length && buf[end] !== 0) end++
    out.push(buf.toString('utf8', state.pos, end))
  }
  return out
}

function shortenDescriptor(d) {
  if (!d) return null
  let s = d
  if (s.startsWith('L') && s.endsWith(';')) s = s.slice(1, -1).replace(/\//g, '.')
  return s
}

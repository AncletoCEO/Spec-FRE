// Inspector de Android binary XML (AXML). Extrae el string pool y los elementos
// con sus atributos (p. ej. package, activities, permisos del AndroidManifest).
// Node puro, sin dependencias. Recibe el XML YA descomprimido.

function readStringPool(buf, pos) {
  const type = buf.readUInt16LE(pos)
  if (type !== 0x0001) throw new Error('expected string pool')
  const size = buf.readUInt32LE(pos + 4)
  const stringCount = buf.readUInt32LE(pos + 8)
  const flags = buf.readUInt32LE(pos + 16)
  const stringsStart = buf.readUInt32LE(pos + 20)
  const isUtf8 = (flags & 0x100) !== 0
  const strings = []
  for (let i = 0; i < stringCount; i++) {
    const strOff = pos + stringsStart + buf.readUInt32LE(pos + 28 + i * 4)
    strings.push(readPoolString(buf, strOff, isUtf8))
  }
  return { strings, end: pos + size }
}

function readPoolString(buf, off, isUtf8) {
  if (off >= buf.length) return ''
  if (isUtf8) {
    let p = off
    const len0 = buf[p++]
    const len = len0 & 0x80 ? ((len0 & 0x7f) << 8) | buf[p++] : len0
    return buf.toString('utf8', p, p + len)
  }
  const len0 = buf.readUInt16LE(off)
  const len = len0 & 0x8000 ? ((len0 & 0x7fff) << 16) | buf.readUInt16LE(off + 2) : len0
  const start = off + (len0 & 0x8000 ? 4 : 2)
  return buf.toString('utf16le', start, start + len * 2)
}

export function inspectAxml(buf) {
  if (buf.length < 8 || buf.readUInt16LE(0) !== 0x0003) throw new Error('not an AXML document')
  let pos = buf.readUInt16LE(2)
  const pool = readStringPool(buf, pos)
  pos = pool.end

  const elements = []
  while (pos + 8 <= buf.length) {
    const type = buf.readUInt16LE(pos)
    const size = buf.readUInt32LE(pos + 4)
    if (size <= 0) break

    if (type === 0x0102) {
      const nameIdx = buf.readUInt32LE(pos + 8 + 8)
      const attributeStart = buf.readUInt16LE(pos + 16)
      const attributeCount = buf.readUInt16LE(pos + 20)
      const attrs = {}
      for (let i = 0; i < attributeCount; i++) {
        const a = pos + 16 + attributeStart + i * 20
        if (a + 20 > buf.length) break
        const attrName = pool.strings[buf.readUInt32LE(a + 4)]
        const rawValue = buf.readUInt32LE(a + 8)
        const dataType = buf.readUInt8(a + 15)
        const data = buf.readUInt32LE(a + 16)
        attrs[attrName] = attrValue(pool.strings, rawValue, dataType, data)
      }
      elements.push({ name: pool.strings[nameIdx], attributes: attrs })
    }
    pos += size
  }

  const root = elements[0] || null
  return {
    kind: 'axml',
    elementCount: elements.length,
    stringPoolSize: pool.strings.length,
    root: root ? { name: root.name, attributes: root.attributes } : null,
    elements: elements.slice(0, 500)
  }
}

function attrValue(strings, rawValue, dataType, data) {
  if (rawValue !== 0xffffffff) return strings[rawValue]
  switch (dataType) {
    case 0x03: return strings[data] ?? `@string/0x${data.toString(16)}`
    case 0x10: return String(data)
    case 0x11: return `0x${data.toString(16)}`
    case 0x12: return data !== 0
    case 0x01: return `@ref/0x${data.toString(16)}`
    default: return `0x${data.toString(16)}`
  }
}

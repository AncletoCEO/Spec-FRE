// Inspector de contenedores ZIP (zip/apk/jar). Lista entradas desde el directorio central.
// Node puro; no descomprime (solo enumera metadatos). Sin dependencias.

const EOCD_SIG = 0x06054b50
const CD_SIG = 0x02014b50

const METHODS = { 0: 'stored', 8: 'deflate', 12: 'bzip2', 14: 'lzma', 93: 'zstd' }

export function inspectZip(buf) {
  const eocd = findEocd(buf)
  if (eocd < 0) throw new Error('no End Of Central Directory record (not a ZIP)')
  const totalEntries = buf.readUInt16LE(eocd + 10)
  const cdSize = buf.readUInt32LE(eocd + 12)
  const cdOffset = buf.readUInt32LE(eocd + 16)

  const entries = []
  let off = cdOffset
  const max = Math.min(totalEntries, 100000)
  let apkManifest = false
  let dexCount = 0
  for (let i = 0; i < max; i++) {
    if (off + 46 > buf.length || buf.readUInt32LE(off) !== CD_SIG) break
    const method = buf.readUInt16LE(off + 10)
    const compSize = buf.readUInt32LE(off + 20)
    const uncompSize = buf.readUInt32LE(off + 24)
    const nameLen = buf.readUInt16LE(off + 28)
    const extraLen = buf.readUInt16LE(off + 30)
    const commentLen = buf.readUInt16LE(off + 32)
    const name = buf.toString('latin1', off + 46, off + 46 + nameLen)
    entries.push({ name, method: METHODS[method] || `method-${method}`, compressedSize: compSize, uncompressedSize: uncompSize })
    if (name === 'AndroidManifest.xml') apkManifest = true
    if (/^classes\d*\.dex$/.test(name)) dexCount++
    off += 46 + nameLen + extraLen + commentLen
  }

  const kind = apkManifest || dexCount > 0 ? 'apk' : classifyZip(entries)
  return {
    kind: 'zip',
    container: kind,
    entryCount: entries.length,
    centralDirectoryOffset: cdOffset,
    centralDirectorySize: cdSize,
    entries: entries.slice(0, 2000),
    dexCount,
    hasAndroidManifest: apkManifest
  }
}

function classifyZip(entries) {
  if (entries.some((e) => e.name === 'META-INF/MANIFEST.MF') && entries.some((e) => /\.class$/.test(e.name))) return 'jar'
  return 'zip'
}

function findEocd(buf) {
  const min = Math.max(0, buf.length - 65557)
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) return i
  }
  return -1
}

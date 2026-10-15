// Extracción de strings imprimibles (ASCII y UTF-16LE). Node puro, sin dependencias.

export function extractStrings(buf, { minLength = 4, utf16 = true, limit = 0 } = {}) {
  const out = []
  scanAscii(buf, minLength, out)
  if (utf16) scanUtf16le(buf, minLength, out)
  out.sort((a, b) => a.offset - b.offset)
  if (limit > 0 && out.length > limit) return out.slice(0, limit)
  return out
}

function scanAscii(buf, minLength, out) {
  let start = -1
  for (let i = 0; i <= buf.length; i++) {
    const c = i < buf.length ? buf[i] : -1
    const printable = c >= 0x20 && c <= 0x7e
    if (printable) {
      if (start < 0) start = i
    } else {
      const len = i - start
      if (start >= 0 && len >= minLength) {
        out.push({ offset: start, encoding: 'ascii', value: buf.toString('latin1', start, i) })
      }
      start = -1
    }
  }
}

function scanUtf16le(buf, minLength, out) {
  let start = -1
  let count = 0
  for (let i = 0; i + 1 <= buf.length; i += 2) {
    const lo = buf[i]
    const hi = buf[i + 1]
    const printable = hi === 0 && lo >= 0x20 && lo <= 0x7e
    if (printable) {
      if (start < 0) start = i
      count++
    } else {
      if (start >= 0 && count >= minLength) {
        out.push({ offset: start, encoding: 'utf-16le', value: buf.toString('utf16le', start, start + count * 2) })
      }
      start = -1
      count = 0
    }
  }
  if (start >= 0 && count >= minLength) {
    out.push({ offset: start, encoding: 'utf-16le', value: buf.toString('utf16le', start, start + count * 2) })
  }
}

export function countPrintable(buf) {
  let n = 0
  for (const b of buf) if (b >= 0x20 && b <= 0x7e) n++
  return n
}

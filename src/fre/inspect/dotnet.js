// Inspector de assemblies .NET (metadata CLI / ECMA-335). Localiza el metadata root
// "BSJB", lee streams y nombres del heap #Strings. Node puro, sin dependencias.

const BSJB = Buffer.from([0x42, 0x53, 0x4a, 0x42]) // 'BSJB'

function alignRel(base, p) {
  const rel = p - base
  const pad = (4 - (rel % 4)) % 4
  return p + pad
}

export function inspectDotnet(buf) {
  const bsjb = buf.indexOf(BSJB)
  if (bsjb < 0) return null

  const versionLength = buf.readUInt32LE(bsjb + 12)
  const version = buf.toString('latin1', bsjb + 16, bsjb + 16 + versionLength).replace(/\0.*$/, '')

  let p = bsjb + 16 + versionLength
  p = alignRel(bsjb, p)
  const flags = buf.readUInt16LE(p)
  const streamCount = buf.readUInt16LE(p + 2)
  p += 4

  const streams = []
  for (let i = 0; i < streamCount && p + 8 <= buf.length; i++) {
    const offset = buf.readUInt32LE(p)
    const size = buf.readUInt32LE(p + 4)
    p += 8
    let nameEnd = p
    while (nameEnd < buf.length && buf[nameEnd] !== 0) nameEnd++
    const name = buf.toString('latin1', p, nameEnd)
    p = alignRel(bsjb, nameEnd + 1)
    streams.push({ name, offset, size })
  }

  const stringsStream = streams.find((s) => s.name === '#Strings')
  const names = stringsStream
    ? extractHeapStrings(buf, bsjb + stringsStream.offset, stringsStream.size)
    : []
  const identifiers = names.filter((n) => /^[A-Za-z_][A-Za-z0-9_`<>./]*$/.test(n))

  return {
    kind: 'dotnet',
    cliVersion: version,
    flags,
    streamNames: streams.map((s) => s.name),
    stringCount: names.length,
    identifiers: identifiers.slice(0, 1000)
  }
}

function extractHeapStrings(buf, start, size) {
  const end = Math.min(buf.length, start + size)
  const out = []
  let cur = start
  while (cur < end) {
    let e = cur
    while (e < end && buf[e] !== 0) e++
    if (e > cur) {
      const s = buf.toString('utf8', cur, e)
      if (s.length >= 2) out.push(s)
    }
    cur = e + 1
  }
  return out
}

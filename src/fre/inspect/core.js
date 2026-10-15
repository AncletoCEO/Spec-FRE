// Inspector de core dumps ELF: recorre segmentos PT_NOTE y lista las notas del core.
// Node puro, sin dependencias.

const NOTE_TYPES = {
  1: 'NT_PRSTATUS', 2: 'NT_FPREGSET', 3: 'NT_PRPSINFO', 4: 'NT_TASKSTRUCT', 5: 'NT_PLATFORM',
  6: 'NT_AUXV', 7: 'NT_GWINDOWS', 0x46494c45: 'NT_FILE', 0x53494749: 'NT_SIGINFO'
}

function cstrPad(buf, off, len) {
  const s = buf.toString('latin1', off, off + len)
  return s.replace(/\0.*$/, '')
}

export function inspectCore(buf) {
  if (buf.length < 16 || buf[0] !== 0x7f || cstrPad(buf, 1, 3) !== 'ELF') throw new Error('not an ELF file')
  const bits = buf[4] === 1 ? 32 : 64
  const le = buf[5] === 1
  const rd16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o))
  const rd32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o))
  const rd64 = (o) => Number(le ? buf.readBigUInt64LE(o) : buf.readBigUInt64BE(o))

  const e_type = rd16(16)
  if (e_type !== 4) throw new Error('ELF is not a core file')

  const e_phoff = bits === 64 ? rd64(32) : rd32(28)
  const e_phentsize = rd16(bits === 64 ? 54 : 42)
  const e_phnum = rd16(bits === 64 ? 56 : 44)

  const notes = []
  const readable = []
  for (let i = 0; i < e_phnum; i++) {
    const base = e_phoff + i * e_phentsize
    if (base + e_phentsize > buf.length) break
    const type = rd32(base)
    if (type !== 4) continue // PT_NOTE
    const offset = bits === 64 ? rd64(base + 8) : rd32(base + 4)
    const filesz = bits === 64 ? rd64(base + 32) : rd32(base + 16)
    parseNotes(buf, offset, filesz, notes, readable)
  }

  return {
    kind: 'core',
    bits,
    endian: le ? 'little' : 'big',
    noteCount: notes.length,
    notes,
    processName: readable.find((s) => /^[\w.\-/]{1,32}$/.test(s)) || null,
    strings: readable.slice(0, 100)
  }
}

function parseNotes(buf, start, size, notes, readable) {
  let p = start
  const end = Math.min(buf.length, start + size)
  while (p + 12 <= end) {
    const namesz = buf.readUInt32LE(p)
    const descsz = buf.readUInt32LE(p + 4)
    const type = buf.readUInt32LE(p + 8)
    const nameOff = p + 12
    const name = namesz > 0 ? cstrPad(buf, nameOff, namesz) : ''
    const descOff = nameOff + align4(namesz)
    const descEnd = descOff + descsz
    if (descEnd > end) break
    notes.push({ name, type: NOTE_TYPES[type] || `0x${type.toString(16)}`, descSize: descsz })
    extractReadable(buf, descOff, descsz, readable)
    p = descOff + align4(descsz)
  }
}

function align4(n) {
  return (n + 3) & ~3
}

function extractReadable(buf, off, len, out) {
  const end = Math.min(buf.length, off + len)
  let cur = off
  while (cur < end) {
    if (buf[cur] >= 0x20 && buf[cur] <= 0x7e) {
      let e = cur
      while (e < end && buf[e] >= 0x20 && buf[e] <= 0x7e) e++
      if (e - cur >= 3) out.push(buf.toString('latin1', cur, e))
      cur = e
    } else {
      cur++
    }
  }
}

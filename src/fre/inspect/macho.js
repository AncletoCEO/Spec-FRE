// Inspector de Mach-O (macOS). Node puro, sin dependencias.

const CPUTYPES = {
  7: 'i386', 0x01000007: 'x86-64', 12: 'ARM', 0x0100000c: 'ARM64', 18: 'PowerPC', 0x01000012: 'PowerPC64'
}

const FILETYPES = { 1: 'object', 2: 'executable', 3: 'fixed-vm-library', 4: 'core', 5: 'preload', 6: 'dylib', 8: 'bundle', 9: 'dylib-stub', 10: 'dSYM', 11: 'kext-bundle' }

function cstr(buf, off, max = 256) {
  let end = off
  while (end < buf.length && end - off < max && buf[end] !== 0) end++
  return buf.toString('latin1', off, end)
}

export function inspectMachO(buf) {
  if (buf.length < 8) throw new Error('too short for Mach-O')
  const magicBE = buf.readUInt32BE(0)
  if (magicBE === 0xcafebabe || magicBE === 0xbebafeca) return inspectFat(buf, magicBE === 0xcafebabe)
  const is64 = buf.readUInt32LE(0) === 0xfeedfacf
  const is32 = buf.readUInt32LE(0) === 0xfeedface
  if (!is64 && !is32) throw new Error('not a Mach-O file')
  return inspectThin(buf, is64)
}

function inspectThin(buf, is64) {
  const cputype = buf.readUInt32LE(4)
  const filetype = buf.readUInt32LE(12)
  const ncmds = buf.readUInt32LE(16)
  const sizeofcmds = buf.readUInt32LE(20)
  let off = is64 ? 32 : 28

  const segments = []
  const dylibs = []
  let symtab = null
  const end = Math.min(off + sizeofcmds, buf.length)

  for (let i = 0; i < ncmds && off + 8 <= end; i++) {
    const cmd = buf.readUInt32LE(off)
    const cmdsize = buf.readUInt32LE(off + 4)
    if (cmdsize < 8) break
    if (cmd === 0x1 || cmd === 0x19) {
      const segname = cstr(buf, off + 8, 16)
      const nsects = buf.readUInt32LE(off + (cmd === 0x19 ? 64 : 48))
      segments.push({ name: segname, sections: nsects })
    } else if (cmd === 0xc) {
      const nameOff = buf.readUInt32LE(off + 8)
      dylibs.push(cstr(buf, off + nameOff, 256))
    } else if (cmd === 0x2) {
      symtab = {
        symoff: buf.readUInt32LE(off + 8),
        nsyms: buf.readUInt32LE(off + 12),
        stroff: buf.readUInt32LE(off + 16),
        strsize: buf.readUInt32LE(off + 20)
      }
    }
    off += cmdsize
  }

  const symbols = []
  if (symtab && is64) {
    const max = Math.min(symtab.nsyms, 5000)
    for (let i = 0; i < max; i++) {
      const b = symtab.symoff + i * 16
      if (b + 16 > buf.length) break
      const strx = buf.readUInt32LE(b)
      const name = cstr(buf, symtab.stroff + strx, 256)
      if (name) symbols.push(name)
    }
  }

  return {
    kind: 'macho',
    header: {
      arch: CPUTYPES[cputype] || `cpu-0x${cputype.toString(16)}`,
      bits: is64 ? 64 : 32,
      filetype: FILETYPES[filetype] || `type-${filetype}`,
      ncmds
    },
    segments,
    dylibs,
    symbols: symbols.slice(0, 200)
  }
}

function inspectFat(buf, beMagic) {
  const rd = (o) => (beMagic ? buf.readUInt32BE(o) : buf.readUInt32LE(o))
  const nfat = rd(4)
  const arches = []
  for (let i = 0; i < Math.min(nfat, 32); i++) {
    const b = 8 + i * 20
    if (b + 20 > buf.length) break
    const cputype = rd(b)
    const offset = rd(b + 8)
    const size = rd(b + 12)
    arches.push({ arch: CPUTYPES[cputype] || `cpu-0x${cputype.toString(16)}`, offset, size })
  }
  return { kind: 'macho-fat', header: { nfat }, arches }
}

// Inspector de ELF (executables, objetos, shared, core). Node puro, sin dependencias.

const ELF_TYPES = { 1: 'relocatable', 2: 'executable', 3: 'shared', 4: 'core' }

const MACHINES = {
  0x03: 'i386', 0x3e: 'x86-64', 0x28: 'ARM', 0xb7: 'AArch64',
  0x08: 'MIPS', 0xf3: 'RISC-V', 0x14: 'PowerPC', 0x16: 'S390', 0x102: 'LoongArch'
}

const SECTION_TYPES = {
  1: 'PROGBITS', 2: 'SYMTAB', 3: 'STRTAB', 4: 'RELA', 5: 'HASH',
  6: 'DYNAMIC', 7: 'NOTE', 8: 'NOBITS', 9: 'REL', 11: 'DYNSYM',
  14: 'INIT_ARRAY', 15: 'FINI_ARRAY', 0x6ffffff6: 'GNU_HASH', 0x6ffffffe: 'VERNEED', 0x6fffffff: 'VERDEF'
}

function sn(buf, off, len) {
  if (off + len > buf.length) return buf.toString('latin1', off, buf.length).replace(/\0.*$/, '')
  return buf.toString('latin1', off, off + len).replace(/\0.*$/, '')
}

export function inspectElf(buf) {
  if (buf.length < 16 || buf[0] !== 0x7f || sn(buf, 1, 3) !== 'ELF') {
    throw new Error('not an ELF file')
  }
  const bits = buf[4] === 1 ? 32 : 64
  const le = buf[5] === 1
  const rd16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o))
  const rd32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o))
  const rd64 = (o) => (le ? buf.readBigUInt64LE(o) : buf.readBigUInt64BE(o))

  const e_type = rd16(16)
  const e_machine = rd16(18)
  const e_entry = bits === 64 ? Number(rd64(24)) : rd32(24)
  const e_phoff = bits === 64 ? Number(rd64(32)) : rd32(28)
  const e_shoff = bits === 64 ? Number(rd64(40)) : rd32(32)
  const e_phentsize = rd16(bits === 64 ? 54 : 42)
  const e_phnum = rd16(bits === 64 ? 56 : 44)
  const e_shentsize = rd16(bits === 64 ? 58 : 46)
  const e_shnum = rd16(bits === 64 ? 60 : 48)
  const e_shstrndx = rd16(bits === 64 ? 62 : 50)

  const header = {
    bits,
    endian: le ? 'little' : 'big',
    type: ELF_TYPES[e_type] || `type-${e_type}`,
    machine: MACHINES[e_machine] || `machine-0x${e_machine.toString(16)}`,
    entry: e_entry
  }

  const sections = readSections(buf, { bits, le, e_shoff, e_shentsize, e_shnum, e_shstrndx })
  const segments = readSegments(buf, { bits, le, e_phoff, e_phentsize, e_phnum })

  const shstrtab = sections.find((s) => s.name === '.shstrtab')
  const dynstr = sections.find((s) => s.name === '.dynstr')
  const strtab = sections.find((s) => s.name === '.strtab')

  const dynamicSymbols = readSymbols(buf, { bits, le, symSection: sections.find((s) => s.name === '.dynsym'), strtab: dynstr })
  const symbols = readSymbols(buf, { bits, le, symSection: sections.find((s) => s.name === '.symtab'), strtab: strtab || dynstr })

  const needed = readNeeded(buf, { bits, le, dynamic: sections.find((s) => s.name === '.dynamic'), dynstr })

  return {
    kind: 'elf',
    header,
    sections: sections.map((s) => ({ name: s.name, type: s.typeName, addr: s.addr, offset: s.offset, size: s.size })),
    segments: segments.map((s) => ({ type: s.typeName, offset: s.offset, vaddr: s.vaddr, filesz: s.filesz, memsz: s.memsz, flags: s.flags })),
    symbols: symbols.slice(0, 200),
    importedFunctions: dynamicSymbols.filter((s) => s.undef).map((s) => s.name).slice(0, 200),
    neededLibraries: needed,
    shstrtabPresent: Boolean(shstrtab)
  }
}

function readSections(buf, { bits, le, e_shoff, e_shentsize, e_shnum, e_shstrndx }) {
  const rd32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o))
  const rd64 = (o) => (le ? buf.readBigUInt64LE(o) : buf.readBigUInt64BE(o))
  const raw = []
  for (let i = 0; i < e_shnum; i++) {
    const base = e_shoff + i * e_shentsize
    if (base + e_shentsize > buf.length) break
    if (bits === 64) {
      raw.push({
        nameOff: rd32(base),
        type: rd32(base + 4),
        addr: Number(rd64(base + 16)),
        offset: Number(rd64(base + 24)),
        size: Number(rd64(base + 32))
      })
    } else {
      raw.push({
        nameOff: rd32(base),
        type: rd32(base + 4),
        addr: rd32(base + 12),
        offset: rd32(base + 16),
        size: rd32(base + 20)
      })
    }
  }
  const strSec = raw[e_shstrndx]
  const strBase = strSec ? strSec.offset : 0
  for (const s of raw) {
    s.name = sn(buf, strBase + s.nameOff, 64)
    s.typeName = SECTION_TYPES[s.type] || `type-0x${s.type.toString(16)}`
  }
  return raw
}

function readSegments(buf, { bits, le, e_phoff, e_phentsize, e_phnum }) {
  const rd32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o))
  const rd64 = (o) => (le ? buf.readBigUInt64LE(o) : buf.readBigUInt64BE(o))
  const PT = { 1: 'LOAD', 2: 'DYNAMIC', 3: 'INTERP', 4: 'NOTE', 6: 'PHDR', 7: 'TLS', 0x6474e550: 'GNU_EH_FRAME', 0x6474e551: 'GNU_STACK', 0x6474e552: 'GNU_RELRO' }
  const segs = []
  for (let i = 0; i < e_phnum; i++) {
    const base = e_phoff + i * e_phentsize
    if (base + e_phentsize > buf.length) break
    const type = rd32(base)
    if (bits === 64) {
      segs.push({
        typeName: PT[type] || `PT-0x${type.toString(16)}`,
        flags: rd32(base + 4),
        offset: Number(rd64(base + 8)),
        vaddr: Number(rd64(base + 16)),
        filesz: Number(rd64(base + 32)),
        memsz: Number(rd64(base + 40))
      })
    } else {
      segs.push({
        typeName: PT[type] || `PT-0x${type.toString(16)}`,
        offset: rd32(base + 4),
        vaddr: rd32(base + 8),
        filesz: rd32(base + 16),
        memsz: rd32(base + 20),
        flags: rd32(base + 24)
      })
    }
  }
  return segs
}

function readSymbols(buf, { bits, le, symSection, strtab }) {
  if (!symSection || !strtab) return []
  const rd16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o))
  const rd32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o))
  const rd64 = (o) => (le ? buf.readBigUInt64LE(o) : buf.readBigUInt64BE(o))
  const entSize = bits === 64 ? 24 : 16
  const count = Math.floor(symSection.size / entSize)
  const out = []
  for (let i = 0; i < count; i++) {
    const base = symSection.offset + i * entSize
    if (base + entSize > buf.length) break
    const nameOff = rd32(base)
    const info = buf[base + (bits === 64 ? 4 : 12)]
    const shndx = rd16(base + (bits === 64 ? 6 : 14))
    const value = bits === 64 ? Number(rd64(base + 8)) : rd32(base + 4)
    const name = sn(buf, strtab.offset + nameOff, 128)
    if (!name) continue
    out.push({ name, value, type: info & 0xf, bind: info >> 4, undef: shndx === 0 })
  }
  return out
}

function readNeeded(buf, { bits, le, dynamic, dynstr }) {
  if (!dynamic || !dynstr) return []
  const rd64 = (o) => (le ? buf.readBigUInt64LE(o) : buf.readBigUInt64BE(o))
  const entSize = bits === 64 ? 16 : 8
  const count = Math.floor(dynamic.size / entSize)
  const needed = []
  for (let i = 0; i < count; i++) {
    const base = dynamic.offset + i * entSize
    if (base + entSize > buf.length) break
    const tag = bits === 64 ? Number(rd64(base)) : le ? buf.readUInt32LE(base) : buf.readUInt32BE(base)
    const val = bits === 64 ? Number(rd64(base + 8)) : le ? buf.readUInt32LE(base + 4) : buf.readUInt32BE(base + 4)
    if (tag === 1) needed.push(sn(buf, dynstr.offset + val, 128))
    if (tag === 0) break
  }
  return needed
}

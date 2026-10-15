// Detección de tipo de artefacto por magic bytes. Node puro, sin dependencias.

function ascii(buf, off, len) {
  return buf.toString('latin1', off, off + len)
}

function u16(buf, off, le = true) {
  return le ? buf.readUInt16LE(off) : buf.readUInt16BE(off)
}

function u32(buf, off, le = true) {
  return le ? buf.readUInt32LE(off) : buf.readUInt32BE(off)
}

const ELF_MACHINES = {
  0x03: 'i386', 0x3e: 'x86-64', 0x28: 'ARM', 0xb7: 'AArch64',
  0x08: 'MIPS', 0xf3: 'RISC-V', 0x14: 'PowerPC', 0x16: 'S390', 0x102: 'LoongArch'
}

const ELF_TYPES = { 1: 'relocatable', 2: 'executable', 3: 'shared', 4: 'core' }

const PE_MACHINES = {
  0x14c: 'i386', 0x8664: 'x86-64', 0x1c0: 'ARM', 0x1c4: 'ARMv7',
  0xaa64: 'ARM64', 0x200: 'IA64', 0x5032: 'RISC-V32', 0x5064: 'RISC-V64'
}

const MACHO_CPUTYPES = {
  7: 'i386', 0x01000007: 'x86-64', 12: 'ARM', 0x0100000c: 'ARM64', 18: 'PowerPC'
}

export function detectMagic(buf) {
  if (!buf || buf.length < 4) return { kind: 'unknown', description: 'empty or too short' }

  const b0 = buf[0], b1 = buf[1], b2 = buf[2], b3 = buf[3]

  if (b0 === 0x7f && b1 === 0x45 && b2 === 0x4c && b3 === 0x46) {
    const bits = buf[4] === 1 ? 32 : 64
    const le = buf[5] === 1
    const elfType = ELF_TYPES[u16(buf, 16, le)] || `type-${u16(buf, 16, le)}`
    const machine = u16(buf, 18, le)
    const arch = ELF_MACHINES[machine] || `machine-0x${machine.toString(16)}`
    return { kind: 'elf', description: `ELF ${bits}-bit ${arch} ${elfType}`, arch, bits, endian: le ? 'little' : 'big', elfType }
  }

  if (b0 === 0x4d && b1 === 0x5a) {
    const peOff = u32(buf, 0x3c, true)
    if (peOff > 0 && peOff + 6 <= buf.length && ascii(buf, peOff, 4) === 'PE\u0000\u0000') {
      const machine = u16(buf, peOff + 4, true)
      const arch = PE_MACHINES[machine] || `machine-0x${machine.toString(16)}`
      return { kind: 'pe', description: `PE ${arch}`, arch, bits: arch.includes('64') ? 64 : 32 }
    }
    return { kind: 'mz', description: 'DOS MZ executable' }
  }

  if (buf.length >= 8) {
    const cpu = u32(buf, 4, false)
    const be = u32(buf, 0, false)
    if (be === 0xfeedface || be === 0xfeedfacf) {
      const arch = MACHO_CPUTYPES[cpu] || `cpu-0x${cpu.toString(16)}`
      return { kind: 'macho', description: `Mach-O ${arch}`, arch, bits: be === 0xfeedfacf ? 64 : 32 }
    }
    if (be === 0xcafebabe) return { kind: 'macho-fat', description: 'Mach-O universal (fat)' }
  }

  if (b0 === 0x50 && b1 === 0x4b) {
    if (b2 === 0x03 && b3 === 0x04) return { kind: 'zip', description: 'ZIP container (zip/apk/jar)' }
    if (b2 === 0x05 && b3 === 0x06) return { kind: 'zip', description: 'ZIP container (empty)' }
  }

  if (b0 === 0x00 && ascii(buf, 1, 3) === 'asm') return { kind: 'wasm', description: 'WebAssembly module' }
  if (b0 === 0x03 && b1 === 0x00 && b2 === 0x08 && b3 === 0x00) return { kind: 'axml', description: 'Android binary XML' }
  if (ascii(buf, 0, 4) === 'dex\n') return { kind: 'dex', description: `Android DEX (v${ascii(buf, 4, 3)})` }
  if (ascii(buf, 0, 15) === 'SQLite format 3') return { kind: 'sqlite', description: 'SQLite database' }

  if (buf.length >= 4) {
    const beMagic = u32(buf, 0, false)
    if (beMagic === 0xa1b2c3d4 || beMagic === 0xd4c3b2a1) return { kind: 'pcap', description: 'pcap capture (microsecond)' }
    if (beMagic === 0xa1b23c4d || beMagic === 0x4d3cb2a1) return { kind: 'pcap', description: 'pcap capture (nanosecond)' }
  }

  if (ascii(buf, 0, 8) === '!<arch>\n') return { kind: 'ar', description: 'Unix ar archive (.a/.deb)' }
  if (buf.length >= 262 && ascii(buf, 257, 5) === 'ustar') return { kind: 'tar', description: 'tar archive' }
  if (b0 === 0x1f && b1 === 0x8b) return { kind: 'gzip', description: 'gzip stream' }
  if (b0 === 0x89 && ascii(buf, 1, 3) === 'PNG') return { kind: 'png', description: 'PNG image' }
  if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) return { kind: 'jpeg', description: 'JPEG image' }
  if (ascii(buf, 0, 4) === 'RIFF') return { kind: 'riff', description: 'RIFF container' }
  if (ascii(buf, 0, 4) === '%PDF') return { kind: 'pdf', description: 'PDF document' }
  if (b0 === 0xca && b1 === 0xfe && b2 === 0xba && b3 === 0xbe) return { kind: 'java-class', description: 'Java class file' }

  return { kind: 'unknown', description: 'unrecognized format' }
}

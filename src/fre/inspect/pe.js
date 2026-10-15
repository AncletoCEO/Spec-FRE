// Inspector de PE (Windows). Node puro, sin dependencias.

const PE_MACHINES = {
  0x14c: 'i386', 0x8664: 'x86-64', 0x1c0: 'ARM', 0x1c4: 'ARMv7',
  0xaa64: 'ARM64', 0x200: 'IA64', 0x5032: 'RISC-V32', 0x5064: 'RISC-V64'
}

const SUBSYSTEMS = { 1: 'native', 2: 'windows-gui', 3: 'windows-cui', 9: 'windows-ce', 10: 'efi-application' }

function cstr(buf, off, max = 256) {
  let end = off
  while (end < buf.length && end - off < max && buf[end] !== 0) end++
  return buf.toString('latin1', off, end)
}

export function inspectPe(buf) {
  if (buf.length < 0x40 || buf[0] !== 0x4d || buf[1] !== 0x5a) throw new Error('not a PE file')
  const peOff = buf.readUInt32LE(0x3c)
  if (peOff + 24 > buf.length || buf.toString('latin1', peOff, peOff + 4) !== 'PE\u0000\u0000') {
    throw new Error('missing PE signature')
  }
  const coff = peOff + 4
  const machine = buf.readUInt16LE(coff)
  const numberOfSections = buf.readUInt16LE(coff + 2)
  const timeDateStamp = buf.readUInt32LE(coff + 4)
  const sizeOfOptionalHeader = buf.readUInt16LE(coff + 16)
  const characteristics = buf.readUInt16LE(coff + 18)

  const opt = coff + 20
  const optMagic = buf.readUInt16LE(opt)
  const is64 = optMagic === 0x20b
  const entryPoint = buf.readUInt32LE(opt + 16)
  const imageBase = is64 ? Number(buf.readBigUInt64LE(opt + 24)) : buf.readUInt32LE(opt + 28)
  const subsystem = buf.readUInt16LE(opt + (is64 ? 68 : 68))
  const numberOfRvaAndSizes = buf.readUInt32LE(opt + (is64 ? 108 : 92))
  const dataDirOff = opt + (is64 ? 112 : 96)

  const sections = []
  const secBase = opt + sizeOfOptionalHeader
  for (let i = 0; i < numberOfSections; i++) {
    const b = secBase + i * 40
    if (b + 40 > buf.length) break
    sections.push({
      name: cstr(buf, b, 8),
      virtualSize: buf.readUInt32LE(b + 8),
      virtualAddress: buf.readUInt32LE(b + 12),
      sizeOfRawData: buf.readUInt32LE(b + 16),
      pointerToRawData: buf.readUInt32LE(b + 20)
    })
  }

  const rvaToOff = (rva) => {
    for (const s of sections) {
      if (rva >= s.virtualAddress && rva < s.virtualAddress + Math.max(s.virtualSize, s.sizeOfRawData)) {
        return s.pointerToRawData + (rva - s.virtualAddress)
      }
    }
    return rva < buf.length ? rva : -1
  }

  const imports = readImports(buf, sections, dataDirOff, numberOfRvaAndSizes, rvaToOff, is64)
  const exportsList = readExports(buf, dataDirOff, rvaToOff, cstr)

  return {
    kind: 'pe',
    header: {
      machine: PE_MACHINES[machine] || `machine-0x${machine.toString(16)}`,
      arch: PE_MACHINES[machine] || null,
      bits: is64 ? 64 : 32,
      subsystem: SUBSYSTEMS[subsystem] || `subsystem-${subsystem}`,
      entryPoint,
      imageBase,
      timestamp: timeDateStamp,
      characteristics: `0x${characteristics.toString(16)}`
    },
    sections: sections.map((s) => ({ name: s.name, virtualAddress: s.virtualAddress, virtualSize: s.virtualSize, rawSize: s.sizeOfRawData })),
    importedDlls: imports.dlls,
    importedFunctions: imports.functions,
    exportedFunctions: exportsList
  }
}

function readImports(buf, sections, dataDirOff, numberOfRvaAndSizes, rvaToOff, is64) {
  const dlls = []
  const functions = []
  if (numberOfRvaAndSizes < 2) return { dlls, functions }
  const importRva = buf.readUInt32LE(dataDirOff + 8)
  const importSize = buf.readUInt32LE(dataDirOff + 12)
  if (!importRva) return { dlls, functions }
  const base = rvaToOff(importRva)
  if (base < 0) return { dlls, functions }
  const max = Math.min(Math.floor(importSize / 20) || 4096, 4096)
  for (let i = 0; i < max; i++) {
    const d = base + i * 20
    if (d + 20 > buf.length) break
    const nameRva = buf.readUInt32LE(d + 12)
    const firstThunk = buf.readUInt32LE(d + 16)
    const origThunk = buf.readUInt32LE(d)
    if (nameRva === 0 && firstThunk === 0 && origThunk === 0) break
    const nameOff = rvaToOff(nameRva)
    const dll = nameOff >= 0 ? cstr(buf, nameOff, 128) : ''
    if (dll) dlls.push(dll)
    const thunkRva = origThunk || firstThunk
    let tOff = rvaToOff(thunkRva)
    if (tOff < 0) continue
    const step = is64 ? 8 : 4
    for (let j = 0; j < 4096; j++) {
      const e = tOff + j * step
      if (e + step > buf.length) break
      const val = is64 ? Number(buf.readBigUInt64LE(e)) : buf.readUInt32LE(e)
      if (val === 0) break
      const ordinalMask = is64 ? 0x8000000000000000n : 0x80000000
      if (is64 ? (BigInt(val) & ordinalMask) !== 0n : (val & ordinalMask) !== 0) {
        functions.push({ dll, name: `#${val & 0xffff}`, ordinal: true })
        continue
      }
      const hintNameOff = rvaToOff(val)
      if (hintNameOff < 0) continue
      const fn = cstr(buf, hintNameOff + 2, 128)
      if (fn) functions.push({ dll, name: fn, ordinal: false })
    }
  }
  return { dlls, functions }
}

function readExports(buf, dataDirOff, rvaToOff, cstr) {
  const exportRva = buf.readUInt32LE(dataDirOff)
  if (!exportRva) return []
  const base = rvaToOff(exportRva)
  if (base < 0 || base + 40 > buf.length) return []
  const numberOfNames = buf.readUInt32LE(base + 24)
  const addressOfNames = buf.readUInt32LE(base + 32)
  const namesOff = rvaToOff(addressOfNames)
  if (namesOff < 0) return []
  const out = []
  const max = Math.min(numberOfNames, 4096)
  for (let i = 0; i < max; i++) {
    const nOff = namesOff + i * 4
    if (nOff + 4 > buf.length) break
    const nameRva = buf.readUInt32LE(nOff)
    const nameStrOff = rvaToOff(nameRva)
    if (nameStrOff < 0) continue
    const name = cstr(buf, nameStrOff, 256)
    if (name) out.push(name)
  }
  return out
}

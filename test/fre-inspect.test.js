import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { deflateSync } from 'node:zlib'
import { DatabaseSync } from 'node:sqlite'

import { detectMagic } from '../src/fre/inspect/magic.js'
import { extractStrings } from '../src/fre/inspect/strings.js'
import { shannonEntropy } from '../src/fre/inspect/entropy.js'
import { inspectElf } from '../src/fre/inspect/elf.js'
import { inspectZip } from '../src/fre/inspect/zip.js'
import { inspectWasm } from '../src/fre/inspect/wasm.js'
import { inspectDex } from '../src/fre/inspect/dex.js'
import { inspectAxml } from '../src/fre/inspect/axml.js'
import { inspectPcap } from '../src/fre/inspect/pcap.js'
import { inspectGo } from '../src/fre/inspect/go.js'
import { inspectRust } from '../src/fre/inspect/rust.js'
import { inspectEvm } from '../src/fre/inspect/evm.js'
import { inspectSqlite } from '../src/fre/inspect/sqlite.js'
import { inspectTarget } from '../src/fre/re-inventory.js'

function elf64() {
  const b = Buffer.alloc(64)
  b.write('\x7fELF', 0, 'latin1')
  b[4] = 2 // 64-bit
  b[5] = 1 // little
  b[6] = 1 // version
  b.writeUInt16LE(2, 16) // executable
  b.writeUInt16LE(0x3e, 18) // x86-64
  b.writeUInt32LE(1, 20)
  b.writeBigUInt64LE(0x400000n, 24) // entry
  b.writeUInt16LE(64, 52)
  b.writeUInt16LE(56, 54)
  b.writeUInt16LE(64, 58)
  return b
}

function storedZip(name, content) {
  const data = Buffer.from(content)
  const nameBuf = Buffer.from(name)
  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(0, 8) // stored
  local.writeUInt32LE(data.length, 18)
  local.writeUInt32LE(data.length, 22)
  local.writeUInt16LE(nameBuf.length, 26)
  const localRec = Buffer.concat([local, nameBuf, data])

  const cd = Buffer.alloc(46)
  cd.writeUInt32LE(0x02014b50, 0)
  cd.writeUInt16LE(0, 10) // stored
  cd.writeUInt32LE(data.length, 20)
  cd.writeUInt32LE(data.length, 24)
  cd.writeUInt16LE(nameBuf.length, 28)
  const cdRec = Buffer.concat([cd, nameBuf])

  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(1, 8)
  eocd.writeUInt16LE(1, 10)
  eocd.writeUInt32LE(cdRec.length, 12)
  eocd.writeUInt32LE(localRec.length, 16)

  return Buffer.concat([localRec, cdRec, eocd])
}

test('magic: ELF, ZIP, WASM, pcap, unknown', () => {
  assert.equal(detectMagic(elf64()).kind, 'elf')
  assert.equal(detectMagic(Buffer.from('PK\u0003\u0004', 'latin1')).kind, 'zip')
  assert.equal(detectMagic(Buffer.from([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0])).kind, 'wasm')
  const pcap = Buffer.alloc(24)
  pcap.writeUInt32LE(0xa1b2c3d4, 0)
  assert.equal(detectMagic(pcap).kind, 'pcap')
  assert.equal(detectMagic(Buffer.from('hello world')).kind, 'unknown')
})

test('strings y entropía', () => {
  const s = Buffer.from('abcd\x00\x00etiqueta legible aca\x00', 'latin1')
  const found = extractStrings(s, { minLength: 4, utf16: false })
  assert.ok(found.some((x) => x.value === 'etiqueta legible aca'))
  assert.equal(shannonEntropy(Buffer.alloc(64).fill(0)), 0)
})

test('ELF: header mínimo', () => {
  const r = inspectElf(elf64())
  assert.equal(r.header.bits, 64)
  assert.equal(r.header.machine, 'x86-64')
  assert.equal(r.header.type, 'executable')
  assert.deepEqual(r.sections, [])
})

test('ZIP: una entrada almacenada', () => {
  const z = inspectZip(storedZip('hello.txt', 'hola mundo'))
  assert.equal(z.entryCount, 1)
  assert.equal(z.entries[0].name, 'hello.txt')
  assert.equal(z.entries[0].method, 'stored')
})

test('WASM: módulo vacío', () => {
  const r = inspectWasm(Buffer.from([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0]))
  assert.equal(r.version, 1)
  assert.deepEqual(r.sectionNames, [])
})

test('DEX: header con conteos en cero', () => {
  const b = Buffer.alloc(0x70)
  b.write('dex\n035\x00', 0, 'latin1')
  b.writeUInt32LE(0x70, 0x20) // file_size
  const r = inspectDex(b)
  assert.equal(r.version, '035')
  assert.equal(r.classCount, 0)
})

test('AXML: string pool vacío', () => {
  const pool = Buffer.alloc(28)
  pool.writeUInt16LE(0x0001, 0)
  pool.writeUInt16LE(28, 2)
  pool.writeUInt32LE(28, 4)
  pool.writeUInt32LE(28, 20) // stringsStart
  const header = Buffer.alloc(8)
  header.writeUInt16LE(0x0003, 0)
  header.writeUInt16LE(8, 2)
  header.writeUInt32LE(36, 4)
  const r = inspectAxml(Buffer.concat([header, pool]))
  assert.equal(r.elementCount, 0)
  assert.equal(r.stringPoolSize, 0)
})

test('pcap: header sin paquetes', () => {
  const b = Buffer.alloc(24)
  b.writeUInt32LE(0xa1b2c3d4, 0)
  b.writeUInt32LE(1, 20) // linktype ethernet
  const r = inspectPcap(b)
  assert.equal(r.packetCount, 0)
  assert.equal(r.linktype, 'ethernet')
})

test('Go: buildinfo embebido', () => {
  const b = Buffer.from('\xff Go buildinf:go1.22.1\npath\texample.com/x\t(devel)\ndep\tgithub.com/y/z\tv1.2.3\th1:abc=\n\n', 'latin1')
  const r = inspectGo(b)
  assert.equal(r.compilerVersion, 'go1.22.1')
  assert.equal(r.modules.length, 2)
})

test('Rust: cargo-auditable comprimido', () => {
  const json = JSON.stringify({ packages: [{ name: 'serde', version: '1.0.0', kind: 'normal' }] })
  const b = Buffer.concat([Buffer.from('.dep-v0', 'latin1'), deflateSync(Buffer.from(json, 'utf8'))])
  const r = inspectRust(b)
  assert.equal(r.packageCount, 1)
  assert.equal(r.packages[0].name, 'serde')
})

test('EVM: selectores de dispatch', () => {
  const sel = Buffer.from([0x63, 0x70, 0xa0, 0x82, 0xe4, 0x14, 0x00]) // PUSH4 70a08231 EQ STOP
  const r = inspectEvm(sel)
  assert.deepEqual(r.selectors, ['0x70a082e4'])
  assert.ok(r.disassembly[0].includes('PUSH4'))
})

test('SQLite: tablas y columnas', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fre-sqlite-'))
  const p = join(dir, 't.db')
  const db = new DatabaseSync(p)
  db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)')
  db.close()
  try {
    const r = inspectSqlite(p)
    assert.ok(r.tables.includes('users'))
    assert.equal(r.columns.users.find((c) => c.name === 'name').notnull, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('inspectTarget: despacha ELF y expone hash y strings', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fre-re-'))
  const p = join(dir, 'a.bin')
  writeFileSync(p, elf64())
  try {
    const r = inspectTarget(p)
    assert.equal(r.detectedKind, 'elf')
    assert.match(r.sha256, /^[0-9a-f]{64}$/)
    assert.equal(r.inventory.header.machine, 'x86-64')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

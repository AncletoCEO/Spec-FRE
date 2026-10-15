import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { classifyTarget, route, gapProposal, capabilitiesForObjective, OBJECTIVE_CAPABILITIES } from '../src/fre/router.js'

function elf64() {
  const b = Buffer.alloc(64)
  b.write('\x7fELF', 0, 'latin1')
  b[4] = 2
  b[5] = 1
  b.writeUInt16LE(2, 16)
  b.writeUInt16LE(0x3e, 18)
  return b
}

function withFile(bytes, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'fre-router-'))
  const p = join(dir, 'target.bin')
  writeFileSync(p, bytes)
  try {
    return fn(p)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('classifyTarget detecta ELF sin LLM', () => {
  withFile(elf64(), (p) => {
    const m = classifyTarget(p)
    assert.equal(m.kind, 'elf')
    assert.equal(m.arch, 'x86-64')
  })
})

test('route ELF + understand-behavior: perfil native, sin gaps', () => {
  withFile(elf64(), (p) => {
    const plan = route(p, 'understand-behavior')
    assert.equal(plan.kind, 'elf')
    assert.ok(plan.matchedProfiles.includes('native'))
    assert.equal(plan.gaps.length, 0)
    assert.equal(plan.needsGapChange, false)
  })
})

test('route ZIP + recover-manifest: perfiles mobile/web', () => {
  withFile(Buffer.from('PK\u0003\u0004', 'latin1'), (p) => {
    const plan = route(p, 'recover-manifest')
    assert.equal(plan.kind, 'zip')
    assert.ok(plan.matchedProfiles.includes('mobile'))
    assert.ok(plan.matchedProfiles.includes('web'))
    assert.equal(plan.gaps.length, 0)
  })
})

test('route con capacidad inexistente reporta GAP y propone (sin instalar)', () => {
  withFile(elf64(), (p) => {
    const plan = route(p, null, { capabilities: ['file-magic', 'quantum-oracle'] })
    assert.deepEqual(plan.gaps, ['quantum-oracle'])
    assert.equal(plan.needsGapChange, true)
    const prop = gapProposal(plan)
    assert.ok(prop.name.startsWith('add-re-capability-'))
    assert.match(prop.content, /quantum-oracle/)
  })
})

test('gapProposal devuelve null sin gaps', () => {
  withFile(elf64(), (p) => {
    const plan = route(p, 'understand-behavior')
    assert.equal(gapProposal(plan), null)
  })
})

test('capabilitiesForObjective conoce los objetivos', () => {
  assert.ok(Object.keys(OBJECTIVE_CAPABILITIES).length > 0)
  assert.deepEqual(capabilitiesForObjective('nope'), [])
  assert.ok(capabilitiesForObjective('identify-crypto').includes('entropy'))
})

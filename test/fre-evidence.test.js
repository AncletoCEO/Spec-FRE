import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createMemoryEngine } from '../src/core/memory/engine.js'

function withEngine(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'fre-evidence-'))
  const engine = createMemoryEngine(join(dir, 'memory.db'))
  try {
    return fn(engine)
  } finally {
    engine.close()
    rmSync(dir, { recursive: true, force: true })
  }
}

test('recordFinding exige provenance (source + tool)', () => {
  withEngine((e) => {
    assert.throws(() => e.recordFinding({ memory_key: 'k', claim: 'c', tool: 't', target_ref: 'H1' }), /source/)
    assert.throws(() => e.recordFinding({ memory_key: 'k', claim: 'c', source: 's', target_ref: 'H1' }), /tool/)
    assert.throws(() => e.recordFinding({ memory_key: 'k', claim: 'c', source: 's', tool: 't' }), /target_ref/)
  })
})

test('searchFindings por texto y por target_ref', () => {
  withEngine((e) => {
    e.recordFinding({ memory_key: 'apk/signing', claim: 'los requests firman HMAC-SHA256', source: 'classes.dex:0x1a2b', tool: 'dex-inspector', target_ref: 'H1' })
    e.recordFinding({ memory_key: 'bin/crypto', claim: 'usa AES-256-CBC con IV fijo', source: 'sym:0x40', tool: 'elf-inspector', target_ref: 'H2' })
    assert.equal(e.searchFindings({ query: 'HMAC-SHA256' }).length, 1)
    assert.equal(e.searchFindings({ targetRef: 'H1' }).length, 1)
    assert.equal(e.searchFindings({ targetRef: 'H2' }).length, 1)
    assert.equal(e.searchFindings({ targetRef: 'H3' }).length, 0)
  })
})

test('markStaleFindings invalida por hash de target_ref', () => {
  withEngine((e) => {
    e.recordFinding({ memory_key: 'apk/signing', claim: 'firma HMAC', source: 's', tool: 't', target_ref: 'H1' })
    assert.equal(e.searchFindings({ targetRef: 'H1' }).length, 1)
    const res = e.markStaleFindings('apk/signing', 'H2')
    assert.equal(res.stale, 1)
    assert.equal(e.searchFindings({ targetRef: 'H1' }).length, 0)
    assert.equal(e.searchFindings({ targetRef: 'H1', status: 'stale' }).length, 1)
  })
})

test('promoteFinding convierte un finding en rule recuperable', () => {
  withEngine((e) => {
    const { id } = e.recordFinding({ memory_key: 'api/firma', claim: 'la API firma todos los requests', source: 's', tool: 't', target_ref: 'H1' })
    const r = e.promoteFinding(id, { type: 'rule' })
    assert.equal(r.node.memory_key, 'api/firma')
    assert.equal(e.searchMemory({ query: 'requests firma' }).length, 1)
  })
})

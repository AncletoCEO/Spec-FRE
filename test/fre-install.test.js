import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'cli', 'index.js')

function run(args, cwd) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' })
}

function withDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'fre-install-'))
  try {
    return fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 })
  }
}

describe('install simplificada (sin tiers ni Azure)', () => {
  it('init NO escribe tier/azure/gratisModel en .ancleto-fre.rc', () => {
    withDir((dir) => {
      const r = run(['init', '--agent', 'opencode'], dir)
      assert.equal(r.status, 0)
      const rc = JSON.parse(readFileSync(join(dir, '.ancleto-fre.rc'), 'utf8'))
      assert.equal('tier' in rc, false)
      assert.equal('azure' in rc, false)
      assert.equal('gratisModel' in rc, false)
      assert.equal(existsSync(join(dir, '.opencode', '.ancleto-fre-tier')), false)
    })
  })

  it('el agente orchestrator usa el modelo por defecto', () => {
    withDir((dir) => {
      run(['install', '--project', dir, '--no-mcp'], dir)
      const orchestrator = readFileSync(join(dir, '.opencode', 'agents', 'orchestrator.md'), 'utf8')
      assert.match(orchestrator, /^model: opencode-go\/qwen3\.7-plus$/m)
    })
  })

  it('--tier es un no-op: no falla y no persiste tier alguno', () => {
    withDir((dir) => {
      const r = run(['install', '--project', dir, '--no-mcp', '--tier', 'gratis'], dir)
      assert.equal(r.status, 0)
      assert.equal(existsSync(join(dir, '.opencode', '.ancleto-fre-tier')), false)
      const rc = JSON.parse(readFileSync(join(dir, '.ancleto-fre.rc'), 'utf8'))
      assert.equal('tier' in rc, false)
    })
  })

  it('--with-azure es un no-op (ya no existe la integración)', () => {
    withDir((dir) => {
      const r = run(['init', '--agent', 'opencode', '--with-azure'], dir)
      assert.equal(r.status, 0)
      const rc = JSON.parse(readFileSync(join(dir, '.ancleto-fre.rc'), 'utf8'))
      assert.equal('azure' in rc, false)
    })
  })
})

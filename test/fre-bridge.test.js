import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  detect,
  available,
  capabilityProvider,
  invoke,
  registerBridge,
  BRIDGE_PROVIDERS
} from '../src/fre/bridge/contract.js'
import { registerReferenceBridge } from '../src/fre/bridge/reference.js'

test('detect: provider inexistente devuelve false', () => {
  assert.equal(detect('no-such-provider-xyz'), false)
})

test('detect: boolean para providers conocidos', () => {
  assert.equal(typeof detect('ghidra'), 'boolean')
})

test('capabilityProvider mapea capacidad -> provider', () => {
  assert.equal(capabilityProvider('native-decompile'), 'ghidra')
  assert.equal(capabilityProvider('device-access'), 'adb')
  assert.equal(capabilityProvider('capacidad-inexistente'), null)
})

test('invoke sin provider disponible -> DEGRADED', () => {
  const r = invoke('native-decompile', {}, { provider: 'no-such-provider-xyz' })
  assert.equal(r.degraded, true)
  assert.equal(r.capability, 'native-decompile')
})

test('puente de referencia: no-op documentado cuando el provider está disponible', () => {
  BRIDGE_PROVIDERS.__testprov = { binary: 'sh', capabilities: ['__test-cap'] }
  registerBridge('__test-cap', () => ({ noop: true }))
  try {
    const r = invoke('__test-cap', {}, { provider: '__testprov' })
    assert.equal(r.degraded, false)
    assert.equal(r.noop, true)
    assert.equal(r.provider, '__testprov')
  } finally {
    delete BRIDGE_PROVIDERS.__testprov
  }
})

test('el puente de referencia de disassembly queda registrado', () => {
  registerReferenceBridge()
  const r = invoke('native-disassemble')
  // Con objdump/rizin ausente => degradado; presente => no-op. La forma es estable.
  assert.equal(typeof r.degraded, 'boolean')
  assert.equal(r.capability, 'native-disassemble')
})

test('available() devuelve un array', () => {
  assert.ok(Array.isArray(available()))
})

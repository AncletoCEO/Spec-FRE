// Entropía de Shannon y entropía por bloques. Node puro, sin dependencias.

export function shannonEntropy(buf) {
  if (!buf || buf.length === 0) return 0
  const freq = new Array(256).fill(0)
  for (const b of buf) freq[b]++
  let e = 0
  for (const f of freq) {
    if (f === 0) continue
    const p = f / buf.length
    e -= p * Math.log2(p)
  }
  return e
}

export function entropyBlocks(buf, { blockSize = 256, maxBlocks = 0 } = {}) {
  const out = []
  for (let i = 0; i < buf.length; i += blockSize) {
    out.push({ offset: i, size: Math.min(blockSize, buf.length - i), entropy: shannonEntropy(buf.subarray(i, i + blockSize)) })
    if (maxBlocks > 0 && out.length >= maxBlocks) break
  }
  return out
}

export function isHighEntropy(buf, threshold = 7.2) {
  return shannonEntropy(buf) >= threshold
}

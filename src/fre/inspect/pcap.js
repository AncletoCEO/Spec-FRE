// Inspector de capturas pcap (libpcap). Header global + resumen de paquetes.
// Node puro, sin dependencias.

const LINKTYPES = { 1: 'ethernet', 101: 'raw-ip', 113: 'linux-sll', 276: 'linux-sll2', 105: 'ieee802.11' }

const ETHERTYPES = { 0x0800: 'IPv4', 0x86dd: 'IPv6', 0x0806: 'ARP', 0x8100: 'VLAN' }

export function inspectPcap(buf) {
  if (buf.length < 24) throw new Error('too short for pcap')
  const magic = buf.readUInt32LE(0)
  let le = true
  if (magic === 0xa1b2c3d4 || magic === 0xa1b23c4d) le = true
  else if (magic === 0xd4c3b2a1 || magic === 0x4d3cb2a1) le = false
  else throw new Error('not a pcap file')

  const rd32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o))
  const linktype = rd32(20)
  const snaplen = rd32(16)

  const endpoints = new Set()
  const protocols = {}
  let count = 0
  let pos = 24
  while (pos + 16 <= buf.length && count < 200000) {
    const inclLen = rd32(pos + 8)
    const dataStart = pos + 16
    if (inclLen <= 0 || dataStart + inclLen > buf.length) break
    const proto = summarizePacket(buf, dataStart, inclLen, endpoints)
    if (proto) protocols[proto] = (protocols[proto] || 0) + 1
    count++
    pos = dataStart + inclLen
  }

  return {
    kind: 'pcap',
    version: `${rd32(4)}.${rd32(8)}`,
    linktype: LINKTYPES[linktype] || `linktype-${linktype}`,
    snaplen,
    packetCount: count,
    protocols,
    endpoints: [...endpoints].slice(0, 200)
  }
}

function summarizePacket(buf, off, len, endpoints) {
  if (len < 14) return null
  const ethertype = buf.readUInt16BE(off + 12)
  const ethName = ETHERTYPES[ethertype] || `0x${ethertype.toString(16)}`
  if (ethertype !== 0x0800) return ethName
  const ip = off + 14
  if (len < 14 + 20 || buf[ip] >> 4 !== 4) return ethName
  const proto = buf[ip + 9]
  const src = `${buf[ip + 12]}.${buf[ip + 13]}.${buf[ip + 14]}.${buf[ip + 15]}`
  const dst = `${buf[ip + 16]}.${buf[ip + 17]}.${buf[ip + 18]}.${buf[ip + 19]}`
  endpoints.add(src)
  endpoints.add(dst)
  const names = { 6: 'TCP', 17: 'UDP', 1: 'ICMP' }
  return names[proto] || `IP-proto-${proto}`
}

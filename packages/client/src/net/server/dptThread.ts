import { Common } from '@ethereumjs/common'
import { DPT as Devp2pDPT } from '@ethereumjs/devp2p'
import { parentPort, workerData } from 'worker_threads'

import { ignoredErrors } from './rlpxserver'

import type { Peer } from '../peer'
const dptThread = (workerData: {
  key: Uint8Array
  refreshInterval: number
  dnsNetworks: string[]
  port: number
  chain: string
  dnsAddr: string
}) => {
  const common = new Common({ chain: workerData.chain })
  const dpt = new Devp2pDPT(workerData.key, {
    refreshInterval: workerData.refreshInterval,
    endpoint: {
      address: '0.0.0.0',
      udpPort: null,
      tcpPort: null,
    },
    onlyConfirmed: common.chainName() === 'mainnet' ? false : true,
    shouldFindNeighbours: true,
    shouldGetDnsPeers: workerData.dnsNetworks.length > 0,
    dnsRefreshQuantity: 50,
    dnsNetworks: workerData.dnsNetworks,
    dnsAddr: workerData.dnsAddr,
    common,
  })

  dpt.events.on('error', (e: Error) => {
    if (ignoredErrors.test(e.message)) {
      return
    }
    parentPort?.postMessage({ event: 'server:error', error: e })
    // If DPT can't bind to port, resolve anyway so client startup doesn't hang
  })

  dpt.events.on('listening', () => {
    parentPort?.postMessage('listening')
  })

  dpt.events.on('peer:new', (msg) => {
    console.log(msg)
  })
  parentPort?.on('message', (msg: { event: string; peer: Peer }) => {
    console.log(msg)
    if (msg.event === 'peer:connected') dpt.confirmPeer(msg.peer.id)
  })

  if (typeof workerData.port === 'number') {
    dpt.bind(workerData.port, '0.0.0.0')
  }
}

dptThread(workerData)

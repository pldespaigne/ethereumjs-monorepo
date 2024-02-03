import { genPrivateKey } from '@ethereumjs/devp2p'
import { Worker } from 'worker_threads'

const dptThread = async () => {
  return new Promise((resolve) => {
    const dpt = new Worker('./src/net/server/dptThread.ts', {
      workerData: {
        refreshInterval: 30,
        dnsNetworks: [],
        key: genPrivateKey(),
        port: 8550,
        chain: 'mainnet',
      },
    })
    dpt.on('message', (msg) => console.log(msg))
    dpt.on('error', (msg) => console.log(msg))
    dpt.on('exit', (code) => {
      console.log('dpt exit code', code)
      resolve(undefined)
    })
  })
}

const main = async () => {
  const res = await dptThread()
  console.log('we got a result', res)
}

void main()

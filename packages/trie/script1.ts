import { Level } from 'level'
import { Trie } from '@ethereumjs/trie'
import { KeyEncoding, ValueEncoding } from '@ethereumjs/util'
import type { DB, BatchDBOp, EncodingOpts } from '@ethereumjs/util'

const getEncodings = (opts: EncodingOpts = {}) => {
  const encodings = { keyEncoding: '', valueEncoding: '' }
  switch (opts.valueEncoding) {
    case ValueEncoding.String:
      encodings.valueEncoding = 'utf8'
      break
    case ValueEncoding.Bytes:
      encodings.valueEncoding = 'view'
      break
    case ValueEncoding.JSON:
      encodings.valueEncoding = 'json'
      break
    default:
      encodings.valueEncoding = 'view'
  }
  switch (opts.keyEncoding) {
    case KeyEncoding.Bytes:
      encodings.keyEncoding = 'view'
      break
    case KeyEncoding.Number:
    case KeyEncoding.String:
      encodings.keyEncoding = 'utf8'
      break
    default:
      encodings.keyEncoding = 'utf8'
  }

  return encodings
}

export default class LevelWrapper implements DB<string, string | Uint8Array> {
  db: Level<string, string | Uint8Array>

  constructor(db?: Level<string, string | Uint8Array>) {
    if (db) {
      this.db = db
    } else {
      this.db = new Level<string, string | Uint8Array>('./db')
    }
  }

  async get(key: string): Promise<string | Uint8Array | undefined> {
    let value
    try {
      value = await this.db.get(key, { keyEncoding: 'view', valueEncoding: 'view' })
    } catch (error) {
      // This should be `true` if the error came from LevelDB
      // so we can check for `NOT true` to identify any non-404 errors
      if (error.notFound !== true) {
        throw error
      }
    }
    return value
  }

  async put(key: string, value: string | Uint8Array): Promise<void> {
    const encodings = getEncodings({
      keyEncoding: KeyEncoding.Bytes,
      valueEncoding: ValueEncoding.Bytes,
    })
    await this.db.put(key, value)
  }

  async del(key: string): Promise<void> {
    await this.db.del(key)
  }

  async batch(opStack: BatchDBOp<string, string | Uint8Array>[]): Promise<void> {
    const levelOps = []

    for (const op of opStack) {
      const encodings = getEncodings(op.opts)
      levelOps.push({ ...op, ...encodings })
    }

    await this.db.batch(levelOps as any)
    this.db.batch()
  }

  async open(): Promise<void> {}

  shallowCopy(): DB<string, string | Uint8Array> {
    return new LevelWrapper(this.db)
  }
}

async function main() {
  const level = new Level<string, string | Uint8Array>('./db')
  const wrapper = new LevelWrapper(level)
  const trie = await Trie.create({
    db: wrapper,
    useRootPersistence: true,
    useKeyHashing: false,
  })
  const key = new Uint8Array([1, 2])
  const value = new Uint8Array([3, 4])
  await trie.put(key, value)
  const val = await trie.get(key)
  console.log(val)
}

main()

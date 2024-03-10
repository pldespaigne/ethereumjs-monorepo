import {
  type BatchDBOp,
  KeyEncoding,
  bytesToUtf8,
  concatBytes,
  equalsBytes,
} from '@ethereumjs/util'

import { ROOT_DB_KEY, type TrieNode } from '../types.js'
import { bytesToNibbles, nibblesCompare } from '../util/nibbles.js'

import { BranchNode } from './branch.js'

import type { Trie } from '../trie.js'

export function orderBatch(ops: BatchDBOp[]): BatchDBOp[] {
  const keyNibbles: [number, number[]][] = ops.map((o, i) => {
    const nibbles: number[] = bytesToNibbles(o.key)
    return [i, nibbles]
  })
  keyNibbles.sort(([_, a], [__, b]) => {
    return nibblesCompare(a, b)
  })
  return keyNibbles.map(([i, _]) => ops[i])
}

export async function _put(
  trie: Trie,
  key: Uint8Array,
  value: Uint8Array,
  skipKeyTransform: boolean = false,
  path?: { stack: TrieNode[]; remaining: number[] }
) {
  const appliedKey = skipKeyTransform ? key : trie['appliedKey'](key)
  const { remaining, stack } = path ?? (await trie.findPath(appliedKey))
  let ops: BatchDBOp[] = []
  if (trie['_opts'].useNodePruning) {
    const val = await trie.get(appliedKey)
    if (val === null || equalsBytes(val, value) === false) {
      const deleteHashes = stack.map((e) => trie['hash'](e.serialize()))
      ops = deleteHashes.map((e) => {
        const key = trie['_opts'].keyPrefix ? concatBytes(trie['_opts'].keyPrefix, e) : e
        return {
          type: 'del',
          key,
          opts: {
            keyEncoding: KeyEncoding.Bytes,
          },
        }
      })
    }
  }
  const returnStack = await trie['_updateNode'](appliedKey, value, remaining, stack)
  if (trie['_opts'].useNodePruning) {
    await trie['_db'].batch(ops)
  }
  return returnStack
}

export async function _del(
  trie: Trie,
  key: Uint8Array,
  skipKeyTransform: boolean = false
): Promise<TrieNode[]> {
  await trie['_lock'].acquire()
  const appliedKey = skipKeyTransform ? key : trie['appliedKey'](key)
  const { node, stack } = await trie.findPath(appliedKey)
  let ops: BatchDBOp[] = []
  if (trie['_opts'].useNodePruning && node !== null) {
    const deleteHashes = stack.map((e) => trie['hash'](e.serialize()))
    ops = deleteHashes.map((e) => {
      const key = trie['_opts'].keyPrefix ? concatBytes(trie['_opts'].keyPrefix, e) : e
      return {
        type: 'del',
        key,
        opts: {
          keyEncoding: KeyEncoding.Bytes,
        },
      }
    })
  }
  if (node) {
    await trie['_deleteNode'](appliedKey, stack)
  }
  if (trie['_opts'].useNodePruning) {
    await trie['_db'].batch(ops)
  }
  await trie.persistRoot()
  trie['_lock'].release()
  return stack
}

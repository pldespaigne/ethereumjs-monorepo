/* eslint @typescript-eslint/no-unused-vars: 0 */

import { Account, arrToBufArr, bufferToHex, setLengthRight, toBuffer } from '@ethereumjs/util'

import { Cache } from './cache'

import { BaseStateManager } from '.'

import type { StateManager } from '.'
import type { getCb, putCb } from './cache'
import type { StorageDump } from './interface'
import type { Address, PrefixedHexString } from '@ethereumjs/util'

const wasm = require('../../rust-verkle-wasm/rust_verkle_wasm')

export interface VerkleState {
  [key: PrefixedHexString]: PrefixedHexString
}

/**
 * Options dictionary.
 */
export interface StatelessVerkleStateManagerOpts {}

/**
 * Tree key constants.
 */
const VERSION_LEAF_KEY = 0
const BALANCE_LEAF_KEY = 1
const NONCE_LEAF_KEY = 2
const CODE_KECCAK_LEAF_KEY = 3
const CODE_SIZE_LEAF_KEY = 4

export class StatelessVerkleStateManager extends BaseStateManager implements StateManager {
  private _proof: PrefixedHexString = '0x'

  // State along execution (should update)
  private _state: VerkleState = {}

  // Checkpointing
  private _checkpoints: VerkleState[] = []

  /**
   * Instantiate the StateManager interface.
   */
  constructor(opts: StatelessVerkleStateManagerOpts = {}) {
    super(opts)

    /*
     * For a custom StateManager implementation adopt these
     * callbacks passed to the `Cache` instantiated to perform
     * the `get`, `put` and `delete` operations with the
     * desired backend.
     */
    const getCb: getCb = async (address) => {
      return undefined
    }
    const putCb: putCb = async (keyBuf, accountRlp) => {}
    const deleteCb = async (keyBuf: Buffer) => {}
    this._cache = new Cache({ getCb, putCb, deleteCb })
  }

  public initPreState(proof: PrefixedHexString, preState: VerkleState) {
    this._proof = proof
    // Initialize the state with the pre-state
    this._state = preState
  }

  private pedersenHash(input: Buffer) {
    // max length 255 * 16
    if (input.length > 4080) {
      throw new Error('Input buffer for pedersenHash calculation in verkle state manager too long.')
    }
    const extInput = setLengthRight(input, 4080)

    const ints: Array<number | ArrayBufferLike> = [2 + 256 * input.length]

    for (let i = 0; i <= 254; i++) {
      const from = 16 * i
      const to = 16 * (i + 1)
      const newInt = extInput.slice(from, to)
      ints.push(newInt)
    }

    const pedersenHash = wasm.pedersen_hash(ints)

    return arrToBufArr(pedersenHash)
  }

  private getTreeKey(address: Address, treeIndex: number, subIndex: number) {
    const address32 = setLengthRight(address.toBuffer(), 32)

    const treeIndexB = Buffer.alloc(32)
    treeIndexB.writeInt32LE(treeIndex)

    const input = Buffer.concat([address32, treeIndexB])

    const treeKey = Buffer.concat([this.pedersenHash(input).slice(0, 31), toBuffer(subIndex)])

    return treeKey
  }

  private getTreeKeyForVersion(address: Address) {
    return this.getTreeKey(address, 0, VERSION_LEAF_KEY)
  }

  private getTreeKeyForBalance(address: Address) {
    return this.getTreeKey(address, 0, BALANCE_LEAF_KEY)
  }

  private getTreeKeyForNonce(address: Address) {
    return this.getTreeKey(address, 0, NONCE_LEAF_KEY)
  }

  private getTreeKeyForCodeHash(address: Address) {
    return this.getTreeKey(address, 0, CODE_KECCAK_LEAF_KEY)
  }

  private getTreeKeyForCodeSize(address: Address) {
    return this.getTreeKey(address, 0, CODE_SIZE_LEAF_KEY)
  }

  /**
   * Copies the current instance of the `StateManager`
   * at the last fully committed point, i.e. as if all current
   * checkpoints were reverted.
   */
  copy(): StateManager {
    const stateManager = new StatelessVerkleStateManager()
    stateManager.initPreState(this._proof, this._state)
    return stateManager
  }

  /**
   * Adds `value` to the state trie as code, and sets `codeHash` on the account
   * corresponding to `address` to reference this.
   * @param address - Address of the `account` to add the `code` for
   * @param value - The value of the `code`
   */
  async putContractCode(address: Address, value: Buffer): Promise<void> {}

  /**
   * Gets the code corresponding to the provided `address`.
   * @param address - Address to get the `code` for
   * @returns {Promise<Buffer>} -  Resolves with the code corresponding to the provided address.
   * Returns an empty `Buffer` if the account has no associated code.
   */
  async getContractCode(address: Address): Promise<Buffer> {
    return Buffer.alloc(0)
  }

  /**
   * Gets the storage value associated with the provided `address` and `key`. This method returns
   * the shortest representation of the stored value.
   * @param address -  Address of the account to get the storage for
   * @param key - Key in the account's storage to get the value for. Must be 32 bytes long.
   * @returns {Promise<Buffer>} - The storage value for the account
   * corresponding to the provided address at the provided key.
   * If this does not exist an empty `Buffer` is returned.
   */
  async getContractStorage(address: Address, key: Buffer): Promise<Buffer> {
    return Buffer.alloc(0)
  }

  /**
   * Adds value to the state for the `account`
   * corresponding to `address` at the provided `key`.
   * @param address -  Address to set a storage value for
   * @param key - Key to set the value at. Must be 32 bytes long.
   * @param value - Value to set at `key` for account corresponding to `address`. Cannot be more than 32 bytes. Leading zeros are stripped. If it is a empty or filled with zeros, deletes the value.
   */
  async putContractStorage(address: Address, key: Buffer, value: Buffer): Promise<void> {}

  /**
   * Clears all storage entries for the account corresponding to `address`.
   * @param address -  Address to clear the storage of
   */
  async clearContractStorage(address: Address): Promise<void> {}

  async getAccount(address: Address): Promise<Account> {
    // Retrieve treeKeys from account address
    const balanceKey = this.getTreeKeyForBalance(address)
    const nonceKey = this.getTreeKeyForNonce(address)
    const codeHashKey = this.getTreeKeyForCodeHash(address)

    const balanceLE = toBuffer(this._state[bufferToHex(balanceKey)])
    const nonceLE = toBuffer(this._state[bufferToHex(nonceKey)])
    const codeHash = this._state[bufferToHex(codeHashKey)]

    return Account.fromAccountData({
      balance: balanceLE.length > 0 ? balanceLE.readBigInt64LE() : 0n,
      codeHash,
      nonce: nonceLE.length > 0 ? nonceLE.readBigInt64LE() : 0n,
    })
  }

  async putAccount(address: Address, account: Account): Promise<void> {
    // Retrieve treeKeys from account address
    const balanceKey = this.getTreeKeyForBalance(address)
    const nonceKey = this.getTreeKeyForNonce(address)
    const codeHashKey = this.getTreeKeyForCodeHash(address)

    const balanceBuf = Buffer.alloc(32, 0)
    balanceBuf.writeBigInt64LE(account.balance)
    const nonceBuf = Buffer.alloc(32)
    nonceBuf.writeBigInt64LE(account.nonce)

    this._state[bufferToHex(balanceKey)] = bufferToHex(balanceBuf)
    this._state[bufferToHex(nonceKey)] = bufferToHex(nonceBuf)
    this._state[bufferToHex(codeHashKey)] = bufferToHex(codeHashKey)
  }

  /**
   * Checkpoints the current state of the StateManager instance.
   * State changes that follow can then be committed by calling
   * `commit` or `reverted` by calling rollback.
   */
  async checkpoint(): Promise<void> {
    this._checkpoints.push(this._state)
    await super.checkpoint()
  }

  /**
   * Commits the current change-set to the instance since the
   * last call to checkpoint.
   */
  async commit(): Promise<void> {
    this._checkpoints.pop()
    await super.commit()
  }

  // TODO
  async hasStateRoot(root: Buffer): Promise<boolean> {
    return true
  }

  /**
   * Reverts the current change-set to the instance since the
   * last call to checkpoint.
   */
  async revert(): Promise<void> {
    if (this._checkpoints.length === 0) {
      throw new Error('StatelessVerkleStateManager state cannot be reverted, no checkpoints set')
    }
    this._state = this._checkpoints.pop()!
    await super.revert()
  }

  /**
   * Gets the verkle root.
   * NOTE: this needs some examination in the code where this is needed
   * and if we have the verkle root present
   * @returns {Promise<Buffer>} - Returns the verkle root of the `StateManager`
   */
  async getStateRoot(): Promise<Buffer> {
    return Buffer.alloc(0)
  }

  /**
   * TODO: needed?
   * Maybe in this context: reset to original pre state suffice
   * @param stateRoot - The verkle root to reset the instance to
   */
  async setStateRoot(stateRoot: Buffer): Promise<void> {}

  /**
   * Dumps the RLP-encoded storage values for an `account` specified by `address`.
   * @param address - The address of the `account` to return storage for
   * @returns {Promise<StorageDump>} - The state of the account as an `Object` map.
   * Keys are are the storage keys, values are the storage values as strings.
   * Both are represented as hex strings without the `0x` prefix.
   */
  async dumpStorage(address: Address): Promise<StorageDump> {
    return { test: 'test' }
  }

  /**
   * Checks whether the current instance has the canonical genesis state
   * for the configured chain parameters.
   * @returns {Promise<boolean>} - Whether the storage trie contains the
   * canonical genesis state for the configured chain parameters.
   */
  async hasGenesisState(): Promise<boolean> {
    return false
  }

  /**
   * Checks if the `account` corresponding to `address`
   * exists
   * @param address - Address of the `account` to check
   */
  async accountExists(address: Address): Promise<boolean> {
    return false
  }
}

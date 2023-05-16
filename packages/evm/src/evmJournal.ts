import { Hardfork } from '@ethereumjs/common'
import { Address, RIPEMD160_ADDRESS_STRING, stripHexPrefix, bytesToHex } from '@ethereumjs/util'
import { debug as createDebugLogger } from 'debug'
import { hexToBytes } from 'ethereum-cryptography/utils'

import { Journaling } from './journaling'

import type { AccessList, Common, EVMStateManagerInterface } from '@ethereumjs/common'
import type { Account } from '@ethereumjs/util'
import type { Debugger } from 'debug'

export class EvmJournal {
  private touchedJournal: Journaling<string, Set<string>>
  private stateManager: EVMStateManagerInterface
  private common: Common
  private DEBUG: boolean
  private _debug: Debugger

  private preWarmed: Map<string, Set<string>>

  constructor(stateManager: EVMStateManagerInterface, common: Common) {
    // Skip DEBUG calls unless 'ethjs' included in environmental DEBUG variables
    this.DEBUG = process?.env?.DEBUG?.includes('ethjs') ?? false
    this._debug = createDebugLogger('statemanager:statemanager')

    this.touchedJournal = new Journaling()
    this.preWarmed = new Map()
    this.stateManager = stateManager
    this.common = common
  }

  async putAccount(address: Address, account: Account | undefined) {
    this.touchAccount(address)
    return this.stateManager.putAccount(address, account)
  }

  async deleteAccount(address: Address) {
    this.touchAccount(address)
    await this.stateManager.deleteAccount(address)
  }

  private touchAccount(address: Address): void {
    this.touchedJournal.addJournalItem(address.toString().slice(2), new Set())
  }

  async commit() {
    this.touchedJournal.commit()
    await this.stateManager.commit()
  }

  async checkpoint() {
    this.touchedJournal.checkpoint()
    await this.stateManager.checkpoint()
  }

  async revert() {
    this.touchedJournal.revert(RIPEMD160_ADDRESS_STRING)
    await this.stateManager.revert()
  }

  /**
   * Removes accounts form the state trie that have been touched,
   * as defined in EIP-161 (https://eips.ethereum.org/EIPS/eip-161).
   * Also cleanups any other internal fields
   */
  async cleanup(): Promise<void> {
    if (this.common.gteHardfork(Hardfork.SpuriousDragon) === true) {
      const touchedArray = Array.from(this.touchedJournal.journal)
      for (const [addressHex] of touchedArray) {
        const address = new Address(hexToBytes(addressHex))
        const empty = await this.stateManager.accountIsEmptyOrNonExistent(address)
        if (empty) {
          await this.deleteAccount(address)
          if (this.DEBUG) {
            this._debug(`Cleanup touched account address=${address} (>= SpuriousDragon)`)
          }
        }
      }
    }
    this.touchedJournal.clear()
    this.preWarmed = new Map()
  }

  /**
   * Adds pre-warmed addresses and slots to the warm addresses list
   * @param accessList The access list provided by the tx
   * @param extras Any extra addressess which should be warmed as well (precompiles, sender, receipient, coinbase (EIP 3651))
   */
  addPreWarmed(accessList: AccessList, extras: string[]) {
    for (const entry of accessList) {
      const address = stripHexPrefix(entry.address)
      let set: Set<string>
      if (!this.preWarmed.has(address)) {
        set = new Set<string>()
      } else {
        set = this.preWarmed.get(address)!
      }
      for (const slots of entry.storageKeys) {
        set.add(stripHexPrefix(slots))
      }
      this.preWarmed.set(address, set)
    }
    for (const addressMaybePrefixed of extras) {
      const address = stripHexPrefix(addressMaybePrefixed)
      if (!this.preWarmed.has(address)) {
        this.preWarmed.set(address, new Set())
      }
    }
  }

  /**
   * Returns true if the address is warm in the current context
   * @param address - The address (as a Uint8Array) to check
   */
  isWarmedAddress(address: Uint8Array): boolean {
    let addressHex = bytesToHex(address)
    if (!this.touchedJournal.journal.has(addressHex)) {
      return this.preWarmed.has(addressHex)
    }
    return true
  }

  /**
   * Add a warm address in the current context
   * @param address - The address (as a Uint8Array) to check
   */
  addWarmedAddress(address: Uint8Array): void {
    throw new Error('REMOVE ME')
    const key = bytesToHex(address)
    const storageSet = this._accessedStorage[this._accessedStorage.length - 1].get(key)
    if (!storageSet) {
      const emptyStorage = new Set<string>()
      this._accessedStorage[this._accessedStorage.length - 1].set(key, emptyStorage)
    }
  }

  /**
   * Returns true if the slot of the address is warm
   * @param address - The address (as a Uint8Array) to check
   * @param slot - The slot (as a Uint8Array) to check
   */
  isWarmedStorage(address: Uint8Array, slot: Uint8Array): boolean {
    let addressHex = bytesToHex(address)
    let set = this.touchedJournal.journal.get(addressHex)
    if (set !== undefined) {
      let slotHex = bytesToHex(slot)
      if (set.has(slotHex)) {
        return true
      }
    }
    // At this point the address is not touched, or the slot is not yet touched
    // Check if it is pre-allocated to be warm
    let preWarmedSet = this.preWarmed.get(addressHex)
    if (preWarmedSet !== undefined) {
      return preWarmedSet.has(bytesToHex(slot))
    }
    return false
  }

  /**
   * Mark the storage slot in the address as warm in the current context
   * @param address - The address (as a Uint8Array) to check
   * @param slot - The slot (as a Uint8Array) to check
   */
  addWarmedStorage(address: Uint8Array, slot: Uint8Array): void {
    let addressHex = bytesToHex(address)
    let set = this.touchedJournal.journal.get(addressHex)! // TODO check if this is always not-undefined
    set.add(bytesToHex(slot))
  }
}

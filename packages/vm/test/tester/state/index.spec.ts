import { suite } from 'vitest'

import { GeneralStateTests } from '../runners/GeneralStateTestsRunner'
import { defaultStateTestArgs } from '../runners/runnerUtils'

const parseInput = (input: string | undefined, bool: boolean = false) => {
  if (input === undefined) {
    return undefined
  }
  if (input === 'true' && bool === false) {
    return undefined
  }
  return input
}

const input = {
  ['verify-test-amount-alltests']: 0,
  count: parseInput(process.env.COUNT) !== undefined ? parseInt(process.env.COUNT!) : undefined,
  fork: parseInput(process.env.FORK) ?? 'Paris',
  test: parseInput(process.env.TEST) ?? defaultStateTestArgs.test,
  skip: parseInput(process.env.SKIP) ?? defaultStateTestArgs.skip,
  customStateTest: parseInput(process.env.CUSTOMSTATETEST) ?? defaultStateTestArgs.customStateTest,
  jsontrace: parseInput(process.env.JSONTRACE, true) !== undefined,
  data: parseInput(process.env.DATA) !== undefined ? parseInt(process.env.DATA!) : undefined,
  gas: parseInput(process.env.GAS) !== undefined ? parseInt(process.env.GAS!) : undefined,
  value: parseInput(process.env.VALUE) !== undefined ? parseInt(process.env.VALUE!) : undefined,
}

const testArgs = { ...defaultStateTestArgs, ...input }
if (testArgs.test !== undefined || testArgs.customStateTest !== undefined) {
  testArgs['verify-test-amount-alltests'] = 0
}
const test = new GeneralStateTests(testArgs)

suite(`${testArgs.fork} (${test.expectedTests})`, async () => {
  await test.runTests()
})

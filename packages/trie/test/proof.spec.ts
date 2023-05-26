import {
  bytesToPrefixedHexString,
  bytesToUtf8,
  hexStringToBytes,
  utf8ToBytes,
} from '@ethereumjs/util'
import * as tape from 'tape'

import { Trie } from '../src'
import debug from 'debug'

tape('simple merkle proofs generation and verification', function (tester) {
  const it = tester.test

  it('debugs statemanager verifyproof', async (t) => {
    const contract = {
      accountProof: [
        '0xf90211a08b35ef8aaf1001ffe7dff4f6221f26b66e34dd968abcee85a8ac32091d06251ba05cafd14da795cdf8a394b35defa13a536fdfac14b6030af3c37f6493c74f900fa084d432a820fa6ac48249fe05cf14cb1c2d147b632e88c55b08b0453b855e78dda0728563ec9378f52f06b03c4e95844719936356b4f2a8499ba9125823d1acd8aba0f9c8c6d587de5a4beb8beab7c268f1843004378dba0d282e7bcd8c85e792d7eaa0e85343ecaeea1eaff936300ccde67f35c496fa94ef598155b710f7a623a57936a08ee22057f1ecf34963bc50ae61316946a624647c22175727fc9391a20e9fd228a065baa728267c680520b7fc43e1f9139f907122d5573d66470d89fcd053ea3140a0bbf921d19e38c35e214ebaaf6a870d0a0150ca82dbc6856c78a30c484f19e7a0a0dee8ba0a60377b394b888faf60952d79662d5a3d858e2ed0a905064ec894dbdfa009d51219b8b2485c903ac06a42493e3541e406ccf34f57850f1096222165aadaa05c708ed7f6a0d0d3aa13d6f973bcdfc7cf0f6d26f1d4485d820de2d2311b3ee1a042f84164e5d78135eb89917b395a3c635c2421a864aaeeb6c20492b7109cf57da090dbe8366a32a6e13ac284ee7755c607833198aa7b7d0c6e2cb5c879aac8d187a026ca02d08826865db5d5ccb312e0daad3d49a2b7bff32dbc817119fe36f1b3bba061c0982c847660740a3a240d8ee893db660a50afe88f1d0aa404c75954d9c50780',
        '0xf90211a03ff1d5e821569f717e0c3455ac9756d6c94b150f74d158d272a8926656ee0a46a0b1834b5a5f289c70d4c518eaaef5626d0d4cd5a01fa898fba722306421d1bc2ea0913e93d8301aa9b7476e11fa0297ea2df84adf473d02aedb01682d0adf1f5a41a0d8d513bf3184b6e5bd01474ce11c7f14ec1054e6575a6adcbca3f5ee2629ded7a0a4cada2c7aa231409735ab131028efffe645969aeb0b5aabae38e5ff51bb04d1a09530aae594b70d16b49a04637b5688ec43cef24f9e1ed18081f5ab7759f13764a02af4b25e0f798fef6b2620dbeee9b47f16a6c8bf18d88078dba943d7922ccf50a0a23108fda2e48990f923b8438591c938c5eddd854f1b4ea4cf32eaf32fe0d0bfa0b487eff2f14bed1074ea4c7be8b13f83bfc516edd64bcc6efaf73f3b63aa8033a0adc54060504b9e25c51de1089eac90f4e74a972f50be77e43c69faefdbe0fa65a0385875af4011d7180b6ba1c7fbe1dd40bb141df13f85988900e5e96059b7da4fa0b6239b2d94701e20575be16ad8bdca89c67d4bf04b76345ab5c14e03547e79ffa0675aa416d2e234cd0426001ef9bae81e3ab1d8f3c3decf8f913ee8af6b97a2f2a034f71a3625128a542ebea41a78fe2d5a5f7e2a2ca3a9d90c6c787594b3c4c43ea0d85a723a13ebd258614effceacf53d82848f44a754683695dbdfebc1440ea1c4a0c7d3904cb429d7a385f95b357c75170901b216bed48baab71ff7882ab69274c380',
        '0xf90211a060ce1890c5589c7bb10ca032dad76f7d6cf2d17c875c5ff6d32d71b789653cf3a029006414deeeb9cfbf6fb15ccf7ebef05553b239b2bc2c3170ea225a236b2af5a02dfb57a167d346253bab122802a33a2eae3ef920a430e4e96e9a340e7f63a756a09107f83a0ee442b2c62948d35b4b0f544f69091438350aaa823995568a1c89f3a0bd9220f16641eec193aa8c3dd714a4dcc3274638265ba9cb215d1c17a944b0d7a0d691133c311a4c0f482cfe2925a3dec20a1dc9ffec6dd72711ff98991a588e54a0cc46c09cd026e878171da35022a4dca33acd704b041c7ac01bfb3d9c6b70d5c5a04cf327b313d05318bfccb4d35f5c99e468e9143bf1462c00fa4ae10c4cb8aeeda01658bd73b4011f1004db958885e91e96fa2a7ed22f8e7e9da2a6bf9ffb26775ea085189531bbc167cf0430ced9571a1641a27b0cd1248719974ee39b52705c7d9ba041f39a4d53f6ed4fb001ae3406cd5b2545bced53f153c557d8b0bbdfc08cb9eaa07220cec7308847b5278480eb211345f9fffa4e50227125e17edf82752fc9c13aa02fa99f9b53f6e5b3df6eb742eb50b76fe5335f712524f0cce6d2a3b868248195a0f44daf830bf4ba817cc76e5ca91105372e47aa2c7be4d4bbf5cd03bcad9b73e2a08d3419223c6d1d0a5cd12a29899cf42994f95ac14b493e41489830e18a4ccd27a0291f2e2f4d52b52780b5d1fb1f13f84bb616ea56039891c603541642d9c589f580',
        '0xf90211a05e9af3fa4daf76aa45191487c149dd97913de59bd5d32df39cb7e1f7b0ee161aa052081ab5443ce8a3a3c54c0c86ae898d743defdf2ae6cb448277cec7f1462914a029a11cd4bce736aee0139f9f09a4b0f3bfdd060adfe826e1c39416ada16fec7ca011e9fd511222c8f8bf6c371216156412b3a5925d85631f8da1ffdbf2234afb81a0bf1684b9c2d0a0fe04ff8aa02ce17786e0378b71a0a6c7f6c9d1a71975c5ec7ca0b0b52576ebec5d551e44b76968dbeaa68e526e6082418530b691135a51a70938a0ad70d7049b91aed29efab50b7181ac4112eaf6ede8197681fbab34a96f8a64bda02f52322c446625c55c3506889f9cca979d81a9219672f8d2641b721a934c168aa0874f0b164a8610b0c9e79270979ba27b2dfe8edf6529f831294430a1d1332aa9a0eae8e4e2263a5b7fa1c56164d39ef0a866323251d0beeb2bf9ab1cfadfe2c44ea005cd2f6463c7b651a4319cc00de1f89485d024a700af86cd083890bd8c165bb7a06505967a1421e287ea8000f2015a4c7706f0d85aac13fec0b9c08036da5a1b61a0509bb34713a64fa1e88e6f42da0890854ac634debc96242e1116c7de25f16d28a0683430342d3e9e30e5b4e6b80c549e6e1ccc5c8e5d8ab5fae969277ab4322f5fa02c658b343760ccd98ec13652d56eee1f41da0cbd1861b6b8c4cd9ca59ad47d2fa09492090e6d155f387377414d1e3adb7ffa86b9ff6956c596de25d3561172828580',
        '0xf90211a0a3c4c8e8a28fa9f79095584255ea592ac92d0f46ca41f9037ef3faf30c589d53a0a55da8ccff92a8b040d79fcb5aeaee00eb34298e50e727b19e3abb7bbad02fcda0edd2f888089504c285a4bc5cb26d27a4c3fa6c5029a25b170827b159057268e2a0e30546d5967e02c959e2f16e7a325a01eb7387283d31c5c1c227854b7be869c9a04d798ef146385867e5e73994a149d1128c5e9a5ea836bdb4a126e316b1d78697a0b4bcfc4eed3073d619068d9c11212d341af70b285d0effdd46ae3974b5469563a0b83d23a9398df49849a3e3a1875f5fc0170e89445cb631ecb3d2bbf6598f4058a064d91ab2ec8647ebc2962c608e97de4eb42a9dd5287e73060954f41c3c21eef4a0f2684b60c29b99f770969b79629ecf7bb9bbcfe6334d8b434003722c3fa3f1d9a06dd143bd7b3bb0e4a2ec97aea816164438d2adf6e2ddf369066e9e982f381856a0f2c4432bb29dd8b5bcb62ad1e015ad6a1fead0dddd34130e37caf041958959b4a0a88c99c58d8e1ca250461ed6acea756a560a8042471d6765d22a6e222ea373d8a085b070510e6d6b6bd566daa2667a8268fa2dbb33a7a65b2ca266e81b92a09cb5a0c38646039b637592291964855752032876415bcd441470cfad85f0c11ce762a6a0ee1397c1b1ea58b7822457e9ab3d8f5afbab0a4e1152ff5db2556db31dec3f43a00a3ff6b68ed4efc37c072af997a66e0a40a7ddb5613e963e16ab01603e0bad3780',
        '0xf90211a062e36560e7f46c890df78c109f2f7cfbcb4509b9178a3eba9e88915c00feace4a0e6adf7074dd244bce4dcb4f0975d03cb3a4b646d72c2791a22e41647ea768a75a02fdc4d277404171bfa9e03fd6c5fc3f02a032b75ac6d770c282009fe46b77b66a09ac4073845465687ecbccb1b9f9dd4c38569800fbea4b0b122ef95ebefd1a4f7a0fcc4219679cb3b994cb0a4128ff76a6e7d51fb683f960dca78faa76bbc267b30a0f535320889ffd8507aefe1d9b5befa33f68a9cf3dee7a98313bf0374052c7dcaa07dd5b4a9dd8bdacfba7712b05f0323d3c5cccfbb9387685a9311470ac15ae967a0313d18c661be30ea11a0bc6e0eb8433d63b08c0bd442d152ee6421a56b8631b7a04486626f943450848b0094dbe249a6aaac5947f1844fd8dc9618b8470fd61d89a0597a745df0d22f4594e307fc8980660ba682638800048855ebc19c607341aa2ba01e40240fb0a16209c8e7ff8733b57b88604df3192acd8c3afe2ef4b7c5ecc5e7a0808269b6888321b83d1d3b5884113cd8d171d4f77996126b606a9e8f1ae7b8d9a0183c0868aab0dec1a99bff0ac32667dc7981c952bd0f11f4788afaa9d37e1fd1a0413e4619bfacaf5064e4dac7945c14866ab95159aa975e52c778f7e759e55402a07a9cd4bf77948010d847d9fd9c31cd685a564a7bab08a691e94b4069a41be8b9a0cf38b79459ccae5d7f08cd1e21dff889433788703c3e54c371365b8433150bad80',
        '0xf8679e2034ecdb3552abd80419ba029c694dbeabec0218b671cb58f51f86ed8689b846f8440180a0e46839eb7240b70373cf860be4b3d1b96068d0b39421b17f3269daa8eef9a8b3a0f5cdc275a53e3e2d213e2da6d88401a9bb792bfc0168b59b7a3a512fcd781d5e',
      ],
      address: '0x2d80502854fc7304c3e3457084de549f5016b73f',
      root: Uint8Array.from([
        212, 135, 255, 175, 47, 40, 56, 214, 148, 23, 248, 28, 157, 43, 252, 165, 210, 224, 208, 36,
        221, 218, 67, 59, 186, 155, 143, 32, 153, 235, 150, 229,
      ]),
    }
    const trie = new Trie({ useKeyHashing: true })

    const valid = await trie.verifyProof(
      contract.root,
      hexStringToBytes(contract.address),
      contract.accountProof.map((p) => hexStringToBytes(p))
    )

    t.ok(valid, 'verify proof returned a value')

    t.end()
  })

  it('create a merkle proof and verify it', async (t) => {
    const trie = new Trie()
    console.log({
      0: bytesToPrefixedHexString(utf8ToBytes('0123456789012345678901234567890123456789xx')),
      1: bytesToPrefixedHexString(utf8ToBytes('aval2')),
      2: bytesToPrefixedHexString(utf8ToBytes('aval3')),
    })
    await trie.put(utf8ToBytes('key1aa'), utf8ToBytes('0123456789012345678901234567890123456789xx'))
    await trie.put(utf8ToBytes('key2bb'), utf8ToBytes('aval2'))
    await trie.put(utf8ToBytes('key3cc'), utf8ToBytes('aval3'))

    let proof = await trie._createProof(utf8ToBytes('key2bb'))
    let val = await trie.verifyProof(trie.root(), utf8ToBytes('key2bb'), proof)
    if (val) {
      t.equal(bytesToUtf8(val), 'aval2')
    } else {
      t.fail(`${val}`)
    }

    proof = await trie._createProof(utf8ToBytes('key1aa'))
    val = await trie.verifyProof(trie.root(), utf8ToBytes('key1aa'), proof)
    t.ok(val, 'val returned a value')
    if (val) {
      t.equal(bytesToUtf8(val!), '0123456789012345678901234567890123456789xx')
    }

    proof = await trie._createProof(utf8ToBytes('key2bb'))
    val = await Trie.verifyProof(trie.root(), utf8ToBytes('key2'), proof)
    // In this case, the proof _happens_ to contain enough nodes to prove `key2` because
    // traversing into `key22` would touch all the same nodes as traversing into `key2`
    t.equal(val, null, 'Expected value at a random key to be null')

    let myKey = utf8ToBytes('anyrandomkey')
    proof = await trie._createProof(myKey)
    val = await Trie.verifyProof(trie.root(), myKey, proof)
    t.equal(val, null, 'Expected value to be null')

    myKey = utf8ToBytes('anothergarbagekey') // should generate a valid proof of null
    proof = await trie._createProof(myKey)
    proof.push(utf8ToBytes('123456')) // extra nodes are just ignored
    val = await Trie.verifyProof(trie.root(), myKey, proof)
    t.equal(val, null, 'Expected value to be null')

    await trie.put(utf8ToBytes('another'), utf8ToBytes('3498h4riuhgwe'))

    // to fail our proof we can request a proof for one key
    proof = await trie._createProof(utf8ToBytes('another'))
    // and try to use that proof on another key
    let valid = await trie.verifyProof(trie.root(), utf8ToBytes('key1aa'), proof)
    t.equal(valid, null, 'Expected value to be null')

    // we can also corrupt a valid proof
    proof = await trie._createProof(utf8ToBytes('key2bb'))
    proof[0].reverse()
    valid = await trie.verifyProof(trie.root(), utf8ToBytes('key2bb'), proof)
    t.equal(valid, null, 'verify proof should return null for a corrupt proof')

    // test an invalid exclusion proof by creating
    // a valid exclusion proof then making it non-null
    myKey = utf8ToBytes('anyrandomkey')
    proof = await trie._createProof(myKey)
    val = await Trie.verifyProof(trie.root(), myKey, proof)
    t.equal(val, null, 'Expected value to be null')
    // now make the key non-null so the exclusion proof becomes invalid
    await trie.put(myKey, utf8ToBytes('thisisavalue'))
    valid = await trie.verifyProof(trie.root(), myKey, proof)
    t.equal(valid, null, 'verify proof should return false for an invalid exclusion proof')
    t.end()
  })

  it('create a merkle proof and verify it with a single long key', async (t) => {
    const trie = new Trie()

    await trie.put(utf8ToBytes('key1aa'), utf8ToBytes('0123456789012345678901234567890123456789xx'))

    const proof = await trie._createProof(utf8ToBytes('key1aa'))
    const val = await trie.verifyProof(trie.root(), utf8ToBytes('key1aa'), proof)
    t.ok(val, 'val returned a value')
    if (val) {
      t.equal(bytesToUtf8(val!), '0123456789012345678901234567890123456789xx')
    } else {
      console.log({ val })
    }

    t.end()
  })

  it('create a merkle proof and verify it with a single short key', async (t) => {
    const trie = new Trie()

    await trie.put(utf8ToBytes('key1aa'), utf8ToBytes('01234'))

    const proof = await trie._createProof(utf8ToBytes('key1aa'))
    const val = await trie.verifyProof(trie.root(), utf8ToBytes('key1aa'), proof)
    t.ok(val, 'val returned a value')
    if (val) {
      t.equal(bytesToUtf8(val!), '01234')
    } else {
      console.log({ val })
    }
    t.end()
  })

  it('create a merkle proof and verify it whit keys in the middle', async (t) => {
    const trie = new Trie()

    await trie.put(
      utf8ToBytes('key1aa'),
      utf8ToBytes('0123456789012345678901234567890123456789xxx')
    )
    await trie.put(
      utf8ToBytes('key1'),
      utf8ToBytes('0123456789012345678901234567890123456789Very_Long')
    )
    await trie.put(utf8ToBytes('key2bb'), utf8ToBytes('aval3'))
    await trie.put(utf8ToBytes('key2'), utf8ToBytes('short'))
    await trie.put(utf8ToBytes('key3cc'), utf8ToBytes('aval3'))
    await trie.put(utf8ToBytes('key3'), utf8ToBytes('1234567890123456789012345678901'))

    let proof = await trie._createProof(utf8ToBytes('key1'))
    let val = await trie.verifyProof(trie.root(), utf8ToBytes('key1'), proof)
    t.deepEqual(val, utf8ToBytes('0123456789012345678901234567890123456789Very_Long'))

    proof = await trie._createProof(utf8ToBytes('key2'))
    val = await trie.verifyProof(trie.root(), utf8ToBytes('key2'), proof)
    t.deepEqual(val, utf8ToBytes('short'))

    proof = await trie._createProof(utf8ToBytes('key3'))
    val = await trie.verifyProof(trie.root(), utf8ToBytes('key3'), proof)
    t.deepEqual(val, utf8ToBytes('1234567890123456789012345678901'))

    t.end()
  })

  it('should succeed with a simple embedded extension-branch', async (t) => {
    const dbug = debug('simple_embedded')
    const trie = new Trie({ debug: dbug })

    await trie.put(utf8ToBytes('a'), utf8ToBytes('a'))
    await trie.put(utf8ToBytes('b'), utf8ToBytes('b'))
    await trie.put(utf8ToBytes('c'), utf8ToBytes('c'))

    let proof = await trie._createProof(utf8ToBytes('a'))
    let val = await trie.verifyProof(trie.root(), utf8ToBytes('a'), proof)
    if (val) {
      t.equal(bytesToUtf8(val!), 'a')
    } else {
      t.fail(`val: ${val}`)
    }

    proof = await trie._createProof(utf8ToBytes('b'))
    val = await trie.verifyProof(trie.root(), utf8ToBytes('b'), proof)
    t.deepEqual(val, utf8ToBytes('b'))

    proof = await trie._createProof(utf8ToBytes('c'))
    const proofTrie = new Trie({ rootNodeRLP: proof[0] })
    val = await proofTrie.verifyProof(trie.root(), utf8ToBytes('c'), proof)
    if (val) {
      t.equal(bytesToUtf8(val!), 'c')
    } else {
      t.fail(`expected ${utf8ToBytes('c')} got val: ${val}`)
    }

    console.log(trie.rootNode)
    console.log(proofTrie.rootNode)

    t.end()
  })
})

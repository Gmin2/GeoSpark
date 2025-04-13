import { test } from 'zinnia:test'
import { assertEquals, assertRejects } from 'zinnia:assert'
import { FilecoinRpcClient } from '../lib/filecoin-rpc.js'

test('FilecoinRpcClient.getChainHead returns valid chain head', async () => {
  const client = new FilecoinRpcClient()
  const result = await client.getChainHead()
  
  // Verify chain head has expected properties
  assertEquals(typeof result.Height, 'number')
  assertEquals(Array.isArray(result.Cids), true)
})

test('FilecoinRpcClient handles invalid method gracefully', async () => {
  const client = new FilecoinRpcClient()
  await assertRejects(
    async () => await client.call('Filecoin.InvalidMethod', []),
    Error,
    'error' 
  )
})
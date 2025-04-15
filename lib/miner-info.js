import config from './config.js'
import {
  getIndexProviderPeerId as getPeerId,
  MINER_TO_PEERID_CONTRACT_ADDRESS,
  MINER_TO_PEERID_CONTRACT_ABI,
  ethers,
} from '../vendor/deno-deps.js'

const { RPC_AUTH, RPC_URL } = config.filecoin;

// Initialize contract
const fetchRequest = new ethers.FetchRequest(RPC_URL)
fetchRequest.setHeader('Authorization', `Bearer ${RPC_AUTH}`)
const provider = new ethers.JsonRpcProvider(fetchRequest)
const smartContractClient = new ethers.Contract(
  MINER_TO_PEERID_CONTRACT_ADDRESS,
  MINER_TO_PEERID_CONTRACT_ABI,
  provider,
)

/**
 * @param {string} minerId - The ID of the miner.
 * @param {object} options - Options for the function.
 * @param {number} options.maxAttempts - The maximum number of attempts to fetch the peer ID.
 * @returns {Promise<string>} The peer ID of the miner.
 */
export async function getIndexProviderPeerId(minerId, { maxAttempts = 5 } = {}) {
  try {
    const { peerId, source } = await getPeerId(minerId, smartContractClient, {
      rpcUrl: RPC_URL,
      rpcAuth: RPC_AUTH,
      maxAttempts,
      signal: AbortSignal.timeout(60_000),
    })
    return peerId
  } catch (err) {
    console.error(err)
    throw err
  }
}
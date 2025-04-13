import { test } from 'zinnia:test'
import { assertEquals } from 'zinnia:assert'
import { ProviderAnalyzer } from '../lib/provider-analysis.js'
import { formatBytes } from '../lib/utils.js'

test('ProviderAnalyzer finds providers for region', async () => {
  const analyzer = new ProviderAnalyzer()
  const providers = await analyzer.findRegionOptimizedProviders('Asia', { limit: 2 })
  
  // We should at least find the known provider
  assertEquals(providers.length > 0, true)
})

test('formatBytes formats correctly', () => {
  assertEquals(formatBytes(0), '0 Bytes')
  assertEquals(formatBytes(1024), '1 KiB')
  assertEquals(formatBytes(1024 * 1024), '1 MiB')
  assertEquals(formatBytes(1024 * 1024 * 1024), '1 GiB')
})
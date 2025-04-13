import { test } from 'zinnia:test'
import { assertEquals } from 'zinnia:assert'
import { getContinentFromCountry } from '../lib/geo.js'

test('getContinentFromCountry returns correct continent for country code', () => {
  assertEquals(getContinentFromCountry('US'), 'North America')
  assertEquals(getContinentFromCountry('DE'), 'Europe')
  assertEquals(getContinentFromCountry('JP'), 'Asia')
  assertEquals(getContinentFromCountry('BR'), 'South America')
  assertEquals(getContinentFromCountry('ZA'), 'Africa')
  assertEquals(getContinentFromCountry('AU'), 'Oceania')
})

test('getContinentFromCountry returns Unknown for unknown country code', () => {
  assertEquals(getContinentFromCountry('XX'), 'Unknown')
  assertEquals(getContinentFromCountry(''), 'Unknown')
  assertEquals(getContinentFromCountry(null), 'Unknown')
})
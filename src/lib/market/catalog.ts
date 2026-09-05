import type { StockDefinition } from './types';

/**
 * 6 tradeable assets spanning the risk/reward curve, from a low-volatility
 * blue chip up to a wildly-swinging meme coin. `drift` is the average
 * yearly directional change; `volatility` is the max absolute random swing
 * layered on top (see `advanceMarketYear` in `engine.ts`). Both are plain
 * integers so prices stay whole dollars forever — no rounding needed.
 */
export const MARKET_CATALOG: StockDefinition[] = [
  { symbol: 'BLU', name: 'BlueChip Corp', category: 'stock', startingPrice: 100, volatility: 3, drift: 2 },
  { symbol: 'TCH', name: 'Technoire Inc', category: 'stock', startingPrice: 80, volatility: 8, drift: 4 },
  { symbol: 'ENR', name: 'Enerco Energy', category: 'stock', startingPrice: 60, volatility: 6, drift: 1 },
  { symbol: 'GLD', name: 'Golden Reserve Fund', category: 'stock', startingPrice: 150, volatility: 2, drift: 1 },
  { symbol: 'MEME', name: 'MemeCoin', category: 'crypto', startingPrice: 5, volatility: 4, drift: 0 },
  { symbol: 'LITE', name: 'LiteChain', category: 'crypto', startingPrice: 20, volatility: 10, drift: 3 },
];

export function getStockDefinitionById(symbol: string): StockDefinition | undefined {
  return MARKET_CATALOG.find((s) => s.symbol === symbol);
}

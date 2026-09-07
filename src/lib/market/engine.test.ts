import { describe, it, expect, afterEach } from 'vitest';
import { initMarket, advanceMarketYear, currentPrice, buy, sell, portfolioValue, applyMarketYearlyTick } from './engine';
import { setRngSource, resetRngSource } from '@/lib/rng';
import { baseCharacter } from '@/lib/testUtils';
import type { MarketState } from '@/lib/types';

afterEach(() => {
  resetRngSource();
});

describe('initMarket', () => {
  it('seeds every catalog symbol to its starting price', () => {
    const market = initMarket();
    expect(market.prices.BLU).toEqual([100]);
    expect(market.prices.TCH).toEqual([80]);
    expect(market.prices.ENR).toEqual([60]);
    expect(market.prices.GLD).toEqual([150]);
    expect(market.prices.MEME).toEqual([5]);
    expect(market.prices.LITE).toEqual([20]);
  });
});

describe('advanceMarketYear', () => {
  it('walks by drift alone at the RNG midpoint (BLU: volatility 3, drift 2)', () => {
    // randInt(-3, 3) with rng()=>0.5: floor(0.5 * 7) = 3 -> mapped to -3+3 = 0.
    setRngSource(() => 0.5);
    const market = advanceMarketYear(initMarket());
    expect(currentPrice(market, 'BLU')).toBe(102); // 100 + drift(2) + 0
  });

  it('walks to the low extreme at rng()=>0 (randInt returns -volatility)', () => {
    setRngSource(() => 0);
    const market = advanceMarketYear(initMarket());
    expect(currentPrice(market, 'BLU')).toBe(99); // 100 + drift(2) - volatility(3)
  });

  it('walks to the high extreme at rng() just under 1 (randInt returns +volatility)', () => {
    setRngSource(() => 0.999999);
    const market = advanceMarketYear(initMarket());
    expect(currentPrice(market, 'BLU')).toBe(105); // 100 + drift(2) + volatility(3)
  });

  it('floors at MIN_PRICE instead of going to zero or negative', () => {
    setRngSource(() => 0); // worst-case swing every year
    let market = initMarket(); // MEME starts at 5, drift 0, volatility 4
    for (let i = 0; i < 5; i++) {
      market = advanceMarketYear(market);
    }
    expect(currentPrice(market, 'MEME')).toBeGreaterThanOrEqual(1);
  });

  it('caps price history at 30 points, trimming the oldest', () => {
    setRngSource(() => 0.5);
    let market = initMarket();
    for (let i = 0; i < 40; i++) {
      market = advanceMarketYear(market);
    }
    expect(market.prices.BLU).toHaveLength(30);
  });
});

describe('buy', () => {
  it('deducts money and opens a new holding at the current price', () => {
    const char = baseCharacter({ money: 1000, market: initMarket(), portfolio: [] });
    const { character: next, success } = buy(char, 'BLU', 5);
    expect(success).toBe(true);
    expect(next.money).toBe(1000 - 5 * 100);
    expect(next.portfolio).toEqual([{ symbol: 'BLU', shares: 5, avgCost: 100 }]);
  });

  it('computes weighted-average cost basis across two purchases at different prices', () => {
    // First buy: 10 shares @ 100 (cost basis 1000). Advance the market so
    // the price moves, then buy 5 more @ 120 (cost 600).
    let market = initMarket();
    market = { ...market, prices: { ...market.prices, BLU: [100, 120] } };
    const char = baseCharacter({ money: 10_000, market, portfolio: [{ symbol: 'BLU', shares: 10, avgCost: 100 }] });
    const { character: next, success } = buy(char, 'BLU', 5);
    expect(success).toBe(true);
    // (100*10 + 120*5) / 15 = (1000 + 600) / 15 = 106.666...
    const holding = next.portfolio.find((h) => h.symbol === 'BLU');
    expect(holding?.shares).toBe(15);
    expect(holding?.avgCost).toBeCloseTo(106.6667, 3);
    expect(next.money).toBe(10_000 - 5 * 120);
  });

  it('rejects the purchase and leaves the character unchanged when funds are insufficient', () => {
    const char = baseCharacter({ money: 50, market: initMarket(), portfolio: [] });
    const { character: next, success } = buy(char, 'BLU', 5); // costs 500
    expect(success).toBe(false);
    expect(next.money).toBe(50);
    expect(next.portfolio).toEqual([]);
  });

  it('rejects a non-positive or non-integer share count', () => {
    const char = baseCharacter({ money: 1000, market: initMarket(), portfolio: [] });
    expect(buy(char, 'BLU', 0).success).toBe(false);
    expect(buy(char, 'BLU', -1).success).toBe(false);
    expect(buy(char, 'BLU', 1.5).success).toBe(false);
  });

  it('rejects an unknown symbol', () => {
    const char = baseCharacter({ money: 1000, market: initMarket(), portfolio: [] });
    const { success } = buy(char, 'NOPE', 1);
    expect(success).toBe(false);
  });
});

describe('sell', () => {
  it('sells a partial position, keeping avgCost unchanged and realizing profit', () => {
    const market = { ...initMarket(), prices: { ...initMarket().prices, BLU: [100, 130] } };
    const char = baseCharacter({ money: 0, market, portfolio: [{ symbol: 'BLU', shares: 10, avgCost: 100 }] });
    const { character: next, success } = sell(char, 'BLU', 4);
    expect(success).toBe(true);
    expect(next.money).toBe(4 * 130); // proceeds
    const holding = next.portfolio.find((h) => h.symbol === 'BLU');
    expect(holding?.shares).toBe(6);
    expect(holding?.avgCost).toBe(100); // unchanged by a partial sell
    expect(next.history.at(-1)?.text).toContain('profit of $120.00'); // (130-100)*4
  });

  it('sells the full position and removes the holding, logging a loss', () => {
    const market = { ...initMarket(), prices: { ...initMarket().prices, BLU: [100, 80] } };
    const char = baseCharacter({ money: 0, market, portfolio: [{ symbol: 'BLU', shares: 10, avgCost: 100 }] });
    const { character: next, success } = sell(char, 'BLU', 10);
    expect(success).toBe(true);
    expect(next.money).toBe(10 * 80);
    expect(next.portfolio).toEqual([]);
    expect(next.history.at(-1)?.text).toContain('loss of $200.00'); // (80-100)*10 = -200
  });

  it('rejects selling more shares than owned', () => {
    const char = baseCharacter({ money: 0, market: initMarket(), portfolio: [{ symbol: 'BLU', shares: 3, avgCost: 100 }] });
    const { character: next, success } = sell(char, 'BLU', 4);
    expect(success).toBe(false);
    expect(next).toBe(char);
  });

  it('rejects selling a symbol with no holding', () => {
    const char = baseCharacter({ money: 0, market: initMarket(), portfolio: [] });
    const { success } = sell(char, 'BLU', 1);
    expect(success).toBe(false);
  });
});

describe('portfolioValue', () => {
  it('sums shares times current price across multiple holdings', () => {
    const market = initMarket(); // BLU=100, TCH=80
    const char = baseCharacter({
      market,
      portfolio: [
        { symbol: 'BLU', shares: 3, avgCost: 90 },
        { symbol: 'TCH', shares: 2, avgCost: 70 },
      ],
    });
    expect(portfolioValue(char)).toBe(3 * 100 + 2 * 80); // 300 + 160 = 460
  });

  it('returns 0 for an empty portfolio', () => {
    const char = baseCharacter({ market: initMarket(), portfolio: [] });
    expect(portfolioValue(char)).toBe(0);
  });
});

describe('applyMarketYearlyTick', () => {
  it('advances the market for a character that already has one', () => {
    setRngSource(() => 0.5);
    const char = baseCharacter({ market: initMarket(), portfolio: [] });
    const next = applyMarketYearlyTick(char);
    expect(currentPrice(next.market, 'BLU')).toBe(102);
  });

  it('self-heals an undefined market on an old save without throwing', () => {
    const char = baseCharacter({ portfolio: [] });
    const damaged = { ...char, market: undefined as unknown as MarketState };
    expect(() => applyMarketYearlyTick(damaged)).not.toThrow();
    const next = applyMarketYearlyTick(damaged);
    expect(next.market).toBeDefined();
    expect(next.market.prices.BLU.length).toBeGreaterThan(0);
  });

  it('self-heals an undefined portfolio on an old save', () => {
    const char = baseCharacter();
    const damaged = { ...char, portfolio: undefined as unknown as never };
    const next = applyMarketYearlyTick(damaged);
    expect(next.portfolio).toEqual([]);
  });
});

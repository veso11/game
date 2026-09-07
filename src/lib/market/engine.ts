import { nanoid } from 'nanoid';
import type { Character, HistoryEntry, MarketState, StockHolding } from '@/lib/types';
import { randInt } from '@/lib/rng';
import { MARKET_CATALOG, getStockDefinitionById } from './catalog';

const MAX_HISTORY_POINTS = 30;
const MIN_PRICE = 1;

function entry(character: Character, text: string): HistoryEntry {
  return { id: nanoid(), age: character.age, text };
}

function withHistory(character: Character, text: string): Character {
  return { ...character, history: [...character.history, entry(character, text)] };
}

/**
 * Seeds every catalog symbol's price history to its starting price.
 */
export function initMarket(): MarketState {
  const prices: Record<string, number[]> = {};
  for (const stock of MARKET_CATALOG) {
    prices[stock.symbol] = [stock.startingPrice];
  }
  return { prices };
}

/**
 * Random-walks each catalog symbol by `drift ± volatility` using the
 * project's injectable rng (never raw Math.random(), so this stays
 * deterministic under `setRngSource` in tests). Price history is capped at
 * 30 points, trimming the oldest entries once exceeded. Floors at
 * MIN_PRICE so a symbol can never hit zero or go negative.
 */
export function advanceMarketYear(state: MarketState): MarketState {
  const prices: Record<string, number[]> = {};
  for (const stock of MARKET_CATALOG) {
    const history = state.prices[stock.symbol] ?? [stock.startingPrice];
    const last = history[history.length - 1] ?? stock.startingPrice;
    const change = stock.drift + randInt(-stock.volatility, stock.volatility);
    const nextPrice = Math.max(MIN_PRICE, last + change);
    const nextHistory = [...history, nextPrice];
    prices[stock.symbol] =
      nextHistory.length > MAX_HISTORY_POINTS
        ? nextHistory.slice(nextHistory.length - MAX_HISTORY_POINTS)
        : nextHistory;
  }
  return { prices };
}

export function currentPrice(state: MarketState, symbol: string): number {
  const history = state.prices[symbol];
  if (!history || history.length === 0) {
    return getStockDefinitionById(symbol)?.startingPrice ?? 0;
  }
  return history[history.length - 1];
}

/**
 * Buys `shares` of `symbol` at the current price. When adding to an
 * existing holding, the new avgCost is the weighted average of the prior
 * cost basis and this purchase's cost — the standard weighted-average
 * cost-basis approach.
 */
export function buy(
  character: Character,
  symbol: string,
  shares: number
): { character: Character; success: boolean } {
  if (!Number.isInteger(shares) || shares <= 0) return { character, success: false };
  const definition = getStockDefinitionById(symbol);
  if (!definition) return { character, success: false };

  const market = character.market ?? initMarket();
  const price = currentPrice(market, symbol);
  const cost = price * shares;

  if (character.money < cost) {
    return {
      character: withHistory(character, `You can't afford ${shares} share(s) of ${symbol}.`),
      success: false,
    };
  }

  const portfolio = character.portfolio ?? [];
  const existing = portfolio.find((h) => h.symbol === symbol);
  let nextPortfolio: StockHolding[];
  if (existing) {
    const totalShares = existing.shares + shares;
    const avgCost = (existing.avgCost * existing.shares + cost) / totalShares;
    nextPortfolio = portfolio.map((h) => (h.symbol === symbol ? { ...h, shares: totalShares, avgCost } : h));
  } else {
    nextPortfolio = [...portfolio, { symbol, shares, avgCost: price }];
  }

  const next: Character = {
    ...character,
    market,
    portfolio: nextPortfolio,
    money: character.money - cost,
  };
  return {
    character: withHistory(next, `You bought ${shares} share(s) of ${symbol} at $${price.toLocaleString()}.`),
    success: true,
  };
}

/**
 * Sells `shares` of `symbol` at the current price. Realized P/L is
 * proceeds minus (avgCost * shares sold); a partial sell leaves the
 * remaining position's avgCost unchanged, only its share count drops.
 */
export function sell(
  character: Character,
  symbol: string,
  shares: number
): { character: Character; success: boolean } {
  if (!Number.isInteger(shares) || shares <= 0) return { character, success: false };
  const portfolio = character.portfolio ?? [];
  const holding = portfolio.find((h) => h.symbol === symbol);
  if (!holding || shares > holding.shares) return { character, success: false };

  const market = character.market ?? initMarket();
  const price = currentPrice(market, symbol);
  const proceeds = price * shares;
  const costBasis = holding.avgCost * shares;
  const profit = proceeds - costBasis;
  const remainingShares = holding.shares - shares;

  const nextPortfolio =
    remainingShares > 0
      ? portfolio.map((h) => (h.symbol === symbol ? { ...h, shares: remainingShares } : h))
      : portfolio.filter((h) => h.symbol !== symbol);

  const next: Character = {
    ...character,
    market,
    portfolio: nextPortfolio,
    money: character.money + proceeds,
  };

  const plText = profit >= 0 ? `profit of $${profit.toFixed(2)}` : `loss of $${Math.abs(profit).toFixed(2)}`;
  return {
    character: withHistory(
      next,
      `You sold ${shares} share(s) of ${symbol} at $${price.toLocaleString()} (${plText}).`
    ),
    success: true,
  };
}

export function portfolioValue(character: Character): number {
  const portfolio = character.portfolio ?? [];
  const market = character.market ?? initMarket();
  return portfolio.reduce((sum, holding) => sum + holding.shares * currentPrice(market, holding.symbol), 0);
}

/**
 * Advances the market by one year. Self-heals `character.market` on old
 * (pre-Phase-4g) saves where it's undefined, seeding it fresh before the
 * walk so the save permanently gains a valid market state from here on.
 * Runs unconditionally regardless of jail status — prices move whether or
 * not the player is incarcerated.
 */
export function applyMarketYearlyTick(character: Character): Character {
  const market = character.market ?? initMarket();
  return { ...character, market: advanceMarketYear(market), portfolio: character.portfolio ?? [] };
}

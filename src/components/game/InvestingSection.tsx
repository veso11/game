'use client';

import { useGameStore } from '@/lib/store';
import { MARKET_CATALOG } from '@/lib/market/catalog';
import { initMarket, currentPrice, portfolioValue } from '@/lib/market/engine';
import { StockCard } from '@/components/game/StockCard';
import { Card } from '@/components/ui/Card';
import type { Character } from '@/lib/types';

export function InvestingSection({ character }: { character: Character }) {
  const buyStock = useGameStore((state) => state.buyStock);
  const sellStock = useGameStore((state) => state.sellStock);

  const market = character.market ?? initMarket();
  const portfolio = character.portfolio ?? [];
  const holdingsValue = portfolioValue(character);
  const netWorth = character.money + holdingsValue;

  return (
    <>
      <Card className="space-y-1">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Portfolio</p>
        <p className="text-sm text-ink">Cash: ${character.money.toLocaleString()}</p>
        <p className="text-sm text-ink">Holdings value: ${holdingsValue.toLocaleString()}</p>
        <p className="text-sm font-semibold text-ink">Net worth: ${netWorth.toLocaleString()}</p>
        {portfolio.length > 0 && (
          <div className="pt-2 space-y-1">
            {portfolio.map((holding) => {
              const price = currentPrice(market, holding.symbol);
              const pl = (price - holding.avgCost) * holding.shares;
              return (
                <p key={holding.symbol} className="text-xs text-ink-muted">
                  {holding.symbol}: {holding.shares} sh @ avg ${holding.avgCost.toFixed(2)} —{' '}
                  <span className={pl >= 0 ? 'text-accent' : 'text-danger'}>
                    {pl >= 0 ? '+' : ''}${pl.toFixed(2)}
                  </span>
                </p>
              );
            })}
          </div>
        )}
      </Card>

      {MARKET_CATALOG.map((definition) => (
        <StockCard
          key={definition.symbol}
          definition={definition}
          price={currentPrice(market, definition.symbol)}
          history={market.prices[definition.symbol] ?? [definition.startingPrice]}
          holding={portfolio.find((h) => h.symbol === definition.symbol)}
          money={character.money}
          onBuy={buyStock}
          onSell={sellStock}
        />
      ))}
    </>
  );
}

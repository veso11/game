'use client';

import { useGameStore } from '@/lib/store';
import { MARKET_CATALOG } from '@/lib/market/catalog';
import { initMarket, currentPrice, portfolioValue } from '@/lib/market/engine';
import { StockCard } from '@/components/game/StockCard';
import { Card } from '@/components/ui/Card';

export default function InvestingPage() {
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const buyStock = useGameStore((state) => state.buyStock);
  const sellStock = useGameStore((state) => state.sellStock);

  const character = activeId ? saves[activeId]?.character : undefined;
  if (!character) return null;

  const market = character.market ?? initMarket();
  const portfolio = character.portfolio ?? [];
  const holdingsValue = portfolioValue(character);
  const netWorth = character.money + holdingsValue;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      <Card className="space-y-1">
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
          Portfolio
        </p>
        <p className="text-sm text-neutral-900 dark:text-white">Cash: ${character.money.toLocaleString()}</p>
        <p className="text-sm text-neutral-900 dark:text-white">
          Holdings value: ${holdingsValue.toLocaleString()}
        </p>
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
          Net worth: ${netWorth.toLocaleString()}
        </p>
        {portfolio.length > 0 && (
          <div className="pt-2 space-y-1">
            {portfolio.map((holding) => {
              const price = currentPrice(market, holding.symbol);
              const pl = (price - holding.avgCost) * holding.shares;
              return (
                <p key={holding.symbol} className="text-xs text-neutral-500 dark:text-neutral-400">
                  {holding.symbol}: {holding.shares} sh @ avg ${holding.avgCost.toFixed(2)} —{' '}
                  <span
                    className={
                      pl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }
                  >
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
    </div>
  );
}

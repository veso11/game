export interface StockDefinition {
  symbol: string;
  name: string;
  category: 'stock' | 'crypto';
  startingPrice: number;
  volatility: number; // max absolute year-over-year random swing
  drift: number; // average directional change per year
}

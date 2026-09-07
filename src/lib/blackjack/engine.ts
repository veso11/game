import type { Card, GameState, Hand, Rank, Suit } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createShoe(numDecks = 1): Card[] {
  const deck: Card[] = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank });
      }
    }
  }
  return deck;
}

export function shuffle(deck: Card[]): Card[] {
  const next = [...deck];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function handValue(hand: Hand): number {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.rank === 'A') {
      aces += 1;
      total += 11;
    } else if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K' || card.rank === '10') {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

export function isBlackjack(hand: Hand): boolean {
  return hand.length === 2 && handValue(hand) === 21;
}

export function isBust(hand: Hand): boolean {
  return handValue(hand) > 21;
}

/**
 * Dealer draws until 17 or higher, standing on all 17s (including soft 17)
 * — the simplest common house rule.
 */
function resolveDealerTurn(state: GameState): GameState {
  const working = [...state.deck];
  let dealerHand = [...state.dealerHand];

  while (handValue(dealerHand) < 17) {
    const card = working.shift();
    if (!card) break;
    dealerHand = [...dealerHand, card];
  }

  const playerBlackjack = isBlackjack(state.playerHand);
  const dealerBlackjack = isBlackjack(dealerHand);
  const playerValue = handValue(state.playerHand);
  const dealerValue = handValue(dealerHand);

  let outcome: GameState['outcome'];
  if (playerBlackjack && dealerBlackjack) outcome = 'push';
  else if (playerBlackjack) outcome = 'blackjack';
  else if (dealerBlackjack) outcome = 'lose';
  else if (isBust(dealerHand)) outcome = 'win';
  else if (playerValue > dealerValue) outcome = 'win';
  else if (playerValue < dealerValue) outcome = 'lose';
  else outcome = 'push';

  return { ...state, deck: working, dealerHand, phase: 'settled', outcome };
}

export function dealInitial(deck: Card[], bet: number): GameState {
  const working = [...deck];
  const playerHand: Hand = [working.shift()!, working.shift()!];
  const dealerHand: Hand = [working.shift()!, working.shift()!];

  const state: GameState = { deck: working, playerHand, dealerHand, phase: 'playerTurn', bet };

  if (isBlackjack(playerHand)) {
    return resolveDealerTurn(state);
  }

  return state;
}

export function hit(state: GameState): GameState {
  if (state.phase !== 'playerTurn') return state;

  const working = [...state.deck];
  const card = working.shift();
  if (!card) return state;

  const playerHand = [...state.playerHand, card];
  const next: GameState = { ...state, deck: working, playerHand };

  if (isBust(playerHand)) {
    return { ...next, phase: 'settled', outcome: 'lose' };
  }
  return next;
}

export function stand(state: GameState): GameState {
  if (state.phase !== 'playerTurn') return state;
  return resolveDealerTurn({ ...state, phase: 'dealerTurn' });
}

/**
 * Net money delta for the settled hand: blackjack pays 1.5x the bet, a
 * regular win pays 1x, a push nets zero, and a loss forfeits the bet. The
 * bet itself is never deducted separately — this payout is the whole delta
 * to apply to the player's money.
 */
export function settle(state: GameState): { state: GameState; payout: number } {
  if (state.phase !== 'settled' || !state.outcome) return { state, payout: 0 };

  let payout = 0;
  switch (state.outcome) {
    case 'blackjack':
      payout = Math.round(state.bet * 1.5);
      break;
    case 'win':
      payout = state.bet;
      break;
    case 'push':
      payout = 0;
      break;
    case 'lose':
      payout = -state.bet;
      break;
  }

  return { state, payout };
}

/**
 * - Input format: { outfitOptions: Array<{ id: string, items: Array<{ itemId: string }>, totalPrice: { currency: string, amount: number }, notes?: string[] }>, scoringConfig?: { weights?: Record<string, number> } }
 * - Output format: { ranked: Array<{ outfitId: string, score: number, explanation: string }>, recommendedOutfitId?: string }
 * - Communicates with: assemblingOutfit.ts (receives outfit options), cart.ts (sends recommended/selected outfit for cart creation)
 */

// --- Step 1: Types and function signature ---

/** Price shape (matches shared Money type from README) */
interface Money {
  currency: string;
  amount: number;
}

/** A single outfit option produced by assemblingOutfit.ts */
export interface OutfitOption {
  id: string;
  items: Array<{ itemId: string }>;
  totalPrice: Money;
  notes?: string[];
}

/** One entry in the ranked results */
export interface RankedOutfit {
  outfitId: string;
  score: number;
  explanation: string;
}

/** Full output of the ranking engine */
export interface RankingResult {
  ranked: RankedOutfit[];
  recommendedOutfitId?: string;
}

/** Optional scoring configuration (e.g. custom weights, budget) */
export interface ScoringConfig {
  weights?: Record<string, number>;
  budget?: number; // max budget in same currency unit as items (for price-fit scoring)
}

/** Input to rankOutfits */
export interface RankOutfitsInput {
  outfitOptions: OutfitOption[];
  scoringConfig?: ScoringConfig;
}

/**
 * Ranks outfit options and recommends one.
 * Stub: returns empty result for now.
 */
export function rankOutfits(input: RankOutfitsInput): RankingResult {
  if (!input.outfitOptions || input.outfitOptions.length === 0) {
    return { ranked: [] };
  }

  // TODO Step 2: compute scores
  // TODO Step 3: sort and pick recommended
  // TODO Step 4: add explanations
  return { ranked: [] };
}

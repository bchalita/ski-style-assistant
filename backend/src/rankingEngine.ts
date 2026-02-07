/**
 * - Input format: { outfitOptions: Array<{ id: string, items: Array<{ itemId: string }>, totalPrice: { currency: string, amount: number }, notes?: string[] }>, scoringConfig?: { weights?: Record<string, number> } }
 * - Output format: { ranked: Array<{ outfitId: string, score: number, explanation: string }>, recommendedOutfitId?: string }
 * - Communicates with: assemblingOutfit.ts (receives outfit options), cart.ts (sends recommended/selected outfit for cart creation)
 */


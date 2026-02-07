/**
 * - Input format: { items: Array<{ id: string, title: string, category: string, price: number, currency: string, shop: string, url?: string, attributes?: Record<string, string | number | boolean> }>, constraints?: { budget?: { currency: string, max: number }, mustHaves?: string[], niceToHaves?: string[] } }
 * - Output format: { outfitOptions: Array<{ id: string, items: Array<{ itemId: string }>, totalPrice: { currency: string, amount: number }, notes?: string[] }>, infeasibleReason?: string }
 * - Communicates with: searchAgent.ts (receives items), rankingEngine.ts (sends outfit options for ranking)
 */


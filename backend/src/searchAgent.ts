/**
 * - Input format: { budget?: { currency: string, max: number }, deadline?: string, preferences?: Record<string, string | number | boolean>, mustHaves?: string[], niceToHaves?: string[] }
 * - Output format: { items: Array<{ id: string, title: string, category: string, price: number, currency: string, shop: string, url?: string, attributes?: Record<string, string | number | boolean> }>, missingInfo?: string[], queryMeta?: { requestedShops: string[], attemptedRequests: number } }
 * - Communicates with: requestAgent.ts (receives normalized request / may ask for missing info), fakeDatabase.ts (requests items; simulates API requests for >= 3 shops), assemblingOutfit.ts (passes items forward)
 */


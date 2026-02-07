/**
 * - Input format: { apiRequests: Array<{ shop: string, query: { categories?: string[], keywords?: string[], priceMax?: number, attributes?: Record<string, string | number | boolean> } }> } // expects at least 3 distinct shops
 * - Output format: { items: Array<{ id: string, title: string, category: string, price: number, currency: string, shop: string, url?: string, attributes?: Record<string, string | number | boolean> }> }
 * - Communicates with: searchAgent.ts (receives simulated API requests; returns items)
 */


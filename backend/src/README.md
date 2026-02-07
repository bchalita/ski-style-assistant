# Backend `src/` module map (spec + contracts)

This folder is intended to be a **small, composable TypeScript backend** where each file owns one “capability” and communicates via **typed in-memory data contracts** (not direct imports of Express objects).

At the moment most modules are **stubs** that declare their intended input/output in the file header comments. This README centralizes those contracts and the expected control flow so you can implement each module independently without interface drift.

---

## High-level flow (who calls who)

The intended end-to-end path for a “build me an outfit” request is:

1. **`index.ts` (HTTP)** receives user request and calls…
2. **`requestAgent.ts` (normalize/clarify)** → returns a normalized request (budget, must-haves, preferences, etc.) and/or clarifying questions.
3. **`searchAgent.ts` (multi-shop search planner)** → turns the normalized request into shop-specific queries and calls…
4. **`fakeDatabase.ts` (simulated catalog + multi-shop fetch)** → returns a unified list of items across **≥ 3 distinct shops**.
5. **`assemblingOutfit.ts` (outfit generator)** → transforms items + constraints into candidate outfit options.
6. **`rankingEngine.ts` (scoring/recommendation)** → ranks outfit options and returns a recommended outfit id + explanations.
7. **`cart.ts` (cart creation)** → converts the selected outfit into a cart (line items + totals).
8. **`checkout.ts` (payment/shipping simulation)** → “confirms” an order for a cart and returns confirmation/receipt.

Communication is **data-only**:
- Agents/capabilities should export functions that accept plain objects and return plain objects.
- `index.ts` is the only module that should know about Express `req/res`.

---

## Shared data model (canonical shapes)

Keep these shapes consistent across modules. If/when you introduce a shared `types.ts`, these are the core candidates.

### Money
- **`Money`**: `{ currency: string; amount: number }`
  - Use integer cents only if you decide to standardize on it. For now, `amount` is a number as described in the stubs.

### Catalog Item
- **`Item`**:
  - `id: string`
  - `title: string`
  - `category: string` (e.g. `"shoes" | "pants" | "top" | "outerwear" | "accessory"` as you formalize)
  - `price: number`
  - `currency: string`
  - `shop: string` (distinct vendor identifier)
  - `url?: string`
  - `attributes?: Record<string, string | number | boolean>` (size, color, material, etc.)

### Request normalization output
- **`NormalizedRequest`**:
  - `budget?: { currency: string; max: number }`
  - `deadline?: string` (ISO date preferred)
  - `preferences?: Record<string, string | number | boolean>`
  - `mustHaves?: string[]`
  - `niceToHaves?: string[]`
  - `clarifyingQuestions?: string[]`

### Outfit option
- **`OutfitOption`**:
  - `id: string`
  - `items: Array<{ itemId: string }>` (IDs reference `Item.id`)
  - `totalPrice: Money`
  - `notes?: string[]`

### Ranking output
- **`RankingResult`**:
  - `ranked: Array<{ outfitId: string; score: number; explanation: string }>`
  - `recommendedOutfitId?: string`

### Cart and checkout
- **`Cart`**:
  - `cartId: string`
  - `lineItems: Array<{ itemId: string; quantity: number }>`
  - `totals?: { currency: string; subtotal: number; tax?: number; shipping?: number; total: number }`

- **`CheckoutRequest`**:
  - `cartId: string`
  - `payment: { provider: string; token: string }`
  - `shipping: { name: string; address1: string; city: string; region?: string; postalCode: string; country: string }`
  - `contact?: { email?: string; phone?: string }`

- **`CheckoutResult`**:
  - `{ orderId: string; status: "confirmed" | "failed"; receiptUrl?: string; message?: string }`

---

## Module-by-module responsibilities (what each file should do)

### `index.ts` (Express HTTP boundary)
Current behavior: exposes `GET /health` and `GET /api/hello`.

What it should become:
- **HTTP routing only**: parse incoming payloads, call the capability functions below, map results to HTTP responses.
- **No business logic**: no ranking math, no outfit assembly, no cart totals.

Recommended endpoints (MVP):
- **POST `/api/agent/request`** → calls `requestAgent.normalizeUserRequest()`
- **POST `/api/search`** → calls `searchAgent.searchItems()`
- **POST `/api/outfits`** → calls `assemblingOutfit.assembleOutfits()` then `rankingEngine.rankOutfits()`
- **POST `/api/cart`** → calls `cart.createCartFromSelection()`
- **POST `/api/checkout`** → calls `checkout.checkoutCart()`

Error handling conventions:
- Validate inputs and return `400` on shape errors.
- Return `200` with `clarifyingQuestions` when the system needs user input (don’t treat it as an error).

### `requestAgent.ts` (normalize + clarify)
Goal: turn a free-form string into a structured request the rest of the pipeline can consume.

Responsibilities:
- Extract budget, currency, style hints, constraints, must-haves, sizes, colors, etc.
- Detect missing critical info (e.g., no budget / no sizing) and emit `clarifyingQuestions`.
- Keep output stable and minimal—downstream modules should not have to interpret raw text.

Non-responsibilities:
- No shop/catelog calls.
- No outfit generation.

Suggested exports:
- `normalizeUserRequest(input: { userRequest: string; context?: ... }): NormalizedRequest`

### `searchAgent.ts` (multi-shop query planner + aggregator)
Goal: transform `NormalizedRequest` into vendor queries and aggregate results.

Responsibilities:
- Convert preferences and must-haves into structured query signals:
  - categories, keywords, max price, attributes
- Ensure **≥ 3 distinct shops** are queried (per stub contract).
- Return:
  - `items` (unified list)
  - `missingInfo?: string[]` (if search can’t proceed without info)
  - `queryMeta` (observability: shops requested, number of attempts)

Internal design notes:
- Keep shop-specific query generation isolated (e.g., a map of `shop → queryBuilder()`).
- Use `fakeDatabase` as the data source in MVP; swap for real APIs later.

Suggested exports:
- `searchItems(input: NormalizedRequest): { items: Item[]; missingInfo?: string[]; queryMeta?: ... }`

### `fakeDatabase.ts` (simulated catalog + “API”)
Goal: provide deterministic, local data for development without external dependencies.

Responsibilities:
- Given an array of “API requests” (shop + query), return matching items.
- Enforce the contract expectation that callers request **at least 3 shops** (or return a clear error/missingInfo).
- Provide stable IDs so downstream `itemId` references remain valid.

Suggested exports:
- `fetchItems(input: { apiRequests: Array<{ shop: string; query: ... }> }): { items: Item[] }`

### `assemblingOutfit.ts` (outfit candidate generation)
Goal: turn a set of items into coherent outfit combinations.

Responsibilities:
- Group items by category and build outfit candidates that satisfy constraints:
  - Must-haves / required categories
  - Budget ceiling
  - Attribute constraints (sizes, colors)
- Output multiple options with:
  - Item references (`itemId`)
  - Total price
  - Notes (e.g., “budget tight—swapped outerwear”)
- If infeasible, return `infeasibleReason`.

Suggested exports:
- `assembleOutfits(input: { items: Item[]; constraints?: ... }): { outfitOptions: OutfitOption[]; infeasibleReason?: string }`

### `rankingEngine.ts` (scoring + explainability)
Goal: rank outfit options and recommend one, with a human-readable explanation.

Responsibilities:
- Compute a score per outfit based on weighted criteria:
  - Price fit vs budget
  - Coverage of must-haves / nice-to-haves
  - Diversity across shops (optional)
  - Attribute match quality (size/color/material)
- Produce an explanation string per ranked outfit.
- Choose `recommendedOutfitId` deterministically (stable ordering for ties).

Suggested exports:
- `rankOutfits(input: { outfitOptions: OutfitOption[]; scoringConfig?: ... }): RankingResult`

### `cart.ts` (cart representation + totals)
Goal: take a chosen outfit and represent it as a cart ready for checkout.

Responsibilities:
- Convert `{ outfitId, itemIds }` into `{ cartId, lineItems, totals }`.
- Decide quantities (usually 1 per item in MVP).
- Compute totals consistently (even if tax/shipping are placeholders).
- Persist cart state somewhere (MVP: in-memory map inside this module; later: DB).

Suggested exports:
- `createCartFromSelection(input: { selection: { outfitId: string; itemIds: string[] }; user?: ...; currency?: string }): Cart`
- `getCart(cartId: string): Cart | null` (useful for `checkout.ts`)

### `checkout.ts` (order confirmation simulation)
Goal: simulate payment + shipping confirmation for a cart.

Responsibilities:
- Load cart (via `cart.getCart()` or similar).
- Validate payment/shipping shapes (basic validation only).
- Return a deterministic “confirmed” vs “failed” based on simple rules in MVP:
  - e.g. fail when token is missing/invalid; otherwise confirm
- Produce an `orderId` and optional `receiptUrl`.

Suggested exports:
- `checkoutCart(input: CheckoutRequest): CheckoutResult`

---

## Cross-cutting conventions (so modules stay plug-and-play)

- **Pure functions where possible**: `requestAgent`, `rankingEngine`, `assemblingOutfit` should be easiest to unit test if they don’t do I/O.
- **Determinism**: avoid randomness unless explicitly seeded; predictable outputs make demos and tests reliable.
- **No circular dependencies**:
  - `searchAgent` may call `fakeDatabase`.
  - `assemblingOutfit` and `rankingEngine` should not import Express or the DB directly.
  - `checkout` may read cart state, but cart should not depend on checkout.
- **Explainability**: ranking results must include an `explanation` for UI display.
- **Strict TypeScript**: the repo uses `"strict": true`, so prefer explicit types for exported APIs.

---

## MVP acceptance criteria (definition of “done”)

- `POST /api/agent/request` returns either:
  - a `NormalizedRequest`, OR
  - `clarifyingQuestions` when required fields are missing.
- `POST /api/outfits` returns:
  - `items` sourced from ≥ 3 shops (via `fakeDatabase`),
  - `outfitOptions` (≥ 3),
  - `ranked` + `recommendedOutfitId`.
- `POST /api/cart` creates a cart from the recommended outfit.
- `POST /api/checkout` confirms an order and returns an `orderId`.


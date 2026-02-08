

# Connect Frontend to Backend Pipeline

The current frontend uses mock data and a Lovable Cloud edge function (`parse-constraints`) for chat. The backend (Express, running separately) has a fully implemented pipeline: `requestAgent` -> `searchAgent` -> `assemblingOutfit` -> `rankingEngine` -> `cart` -> `checkout`. 

This plan replaces the mock-data flow with real calls to the backend API, while keeping the existing UI design intact.

---

## Architecture

The backend runs as a separate Express server (default `localhost:4000`). The frontend will call it through an API service layer. We'll use an environment variable (`VITE_BACKEND_URL`) to configure the backend URL.

```text
Frontend (Vite)                    Backend (Express :4000)
+------------------+               +------------------------+
| ChatPanel        | --message-->  | POST /api/request-agent|
|   (conversation) |  <--output--  |   (normalize + clarify)|
+------------------+               +------------------------+
        |                                    |
        | (when ready)                       |
        v                                    v
+------------------+               +------------------------+
| SearchingScreen  |               | searchAgent()          |
|   (loading anim) |               | assembleOutfits()      |
+------------------+               | rankOutfits()          |
        |                          +------------------------+
        v                                    |
+------------------+               +------------------------+
| ResultsPage      |  <--outfit--  | POST /api/outfits (new)|
|   (item cards)   |               +------------------------+
+------------------+
        |
        v
+------------------+               +------------------------+
| CheckoutPage     | --confirm-->  | POST /api/cart         |
|   (payment form) |               | POST /api/checkout(new)|
+------------------+               +------------------------+
```

---

## What Changes

### 1. API Service Layer (new file)
**`src/services/api.ts`**

Create a centralized API client with functions:
- `callRequestAgent(userRequest, context)` -- POST to `/api/request-agent`
- `callOutfitPipeline(normalizedRequest)` -- POST to a new `/api/outfits` endpoint that runs search -> assemble -> rank in one call
- `callCreateCart(selection)` -- POST to `/api/cart`
- `callCheckout(checkoutData)` -- POST to `/api/checkout`

Uses `VITE_BACKEND_URL` env var (fallback to `http://localhost:4000`).

### 2. New Backend Endpoint
**`backend/src/index.ts`** -- Add `POST /api/outfits`

This endpoint chains: `searchAgent()` -> `assembleOutfits()` -> `rankOutfits()` and returns the full result (ranked outfits with item details). This is the main "find my outfit" endpoint.

Input: The normalized request output from the request agent (budget, deadline, preferences, mustHaves, etc.)

Output:
```json
{
  "items": [...],           // all matched items with full details
  "outfitOptions": [...],   // assembled outfit combos
  "ranked": [...],          // ranked with explanations  
  "recommendedOutfitId": "..."
}
```

### 3. New Backend Endpoint for Checkout
**`backend/src/index.ts`** -- Add `POST /api/checkout`

Implement the `checkout.ts` module (currently empty stub) and expose it.

### 4. Updated Types
**`src/types.ts`**

Add types that match the backend's output shapes:
- `BackendItem` (id, title, category, price, currency, shop, attributes)
- `OutfitOption` (id, items, totalPrice, notes)
- `RankedOutfit` (outfitId, score, explanation)
- Keep existing `Product` type but add a mapper function from `BackendItem` to `Product`

### 5. Updated AppContext
**`src/context/AppContext.tsx`**

Major changes:
- **Chat flow**: Replace the edge function call with `callRequestAgent()`. The backend's `requestAgent` returns structured output including `clarifyingQuestion`. When `clarifyingQuestion` is null (all info collected), trigger the outfit search.
- **Search flow**: When ready, call `callOutfitPipeline()` with the accumulated constraints. Map the returned items into the `Product` format for the existing UI.
- **State**: Store the full backend response (items, ranked outfits) so the results page can display them. Store alternatives per category (other items from the search results in the same category).
- **Remove**: Mock data imports and the Supabase edge function call.

### 6. Updated Chat Logic
**`src/components/ChatPanel.tsx`**

The chat panel itself doesn't change much -- it already sends messages and displays responses. The key change is in AppContext where:
- The assistant's response text comes from the backend's `clarifyingQuestion` field
- Quick replies are generated based on what info is missing (budget, size, items, deadline)

### 7. Results Page -- Minor Updates
**`src/components/ResultsPage.tsx`**

- Display the AI's `explanation` from the ranking engine (the "Why these items?" text)
- Items come from the backend response mapped to `Product` type

### 8. Remove Mock Data Dependency
**`src/data/mockProducts.ts`**

Keep as fallback but the primary flow uses real backend data.

---

## Detailed Flow

1. User types message in ChatPanel
2. AppContext calls `POST /api/request-agent` with `{ userRequest, context: { previousMessages, previousOutput } }`
3. Backend returns `RequestAgentOutput` with `clarifyingQuestion` or null
4. If `clarifyingQuestion` exists: display it as assistant message, continue chat
5. If `clarifyingQuestion` is null: all info gathered, transition to loading screen
6. During loading: call `POST /api/outfits` with the accumulated normalized request
7. Backend runs searchAgent -> assembleOutfits -> rankOutfits, returns full results
8. Map backend items to frontend `Product` type, populate outfit and alternatives
9. Transition to results page showing the recommended outfit
10. User confirms items, clicks checkout
11. Checkout calls `POST /api/cart` then `POST /api/checkout`

---

## Files Summary

| File | Action |
|------|--------|
| `src/services/api.ts` | New: API client for all backend calls |
| `src/types.ts` | Update: add backend response types + mapper |
| `src/context/AppContext.tsx` | Rewrite: use backend API instead of mocks/edge function |
| `src/components/ResultsPage.tsx` | Minor: show ranking explanation |
| `backend/src/index.ts` | Add: POST /api/outfits endpoint, POST /api/checkout |
| `backend/src/checkout.ts` | Implement: checkout logic (currently empty) |

---

## Important Notes

- The backend uses OpenAI for the request agent and ranking explanations. The `OPENAI_API_KEY` must be set in `backend/.env`.
- The frontend needs `VITE_BACKEND_URL` set (defaults to `http://localhost:4000`).
- Lock file: You need to run `npm install` in the root directory to generate a `package-lock.json` file, which is currently missing and required for consistent builds.
- Cart/item swapping will be addressed in a follow-up phase as mentioned.


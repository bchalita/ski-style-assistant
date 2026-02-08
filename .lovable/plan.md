

# Redesign: Alpine Gear Shopping Experience

Based on your mockups, this plan redesigns the UI across all four screens: Chat, Loading, Cart/Results, and Checkout. The existing logic (AI parsing, mock product search, state management) stays intact -- this is a visual and UX overhaul.

---

## Screen 1: Chat (Landing + Conversation)

**Current:** Emoji-based header, basic chat bubbles, text input only.
**New (matching your mockup):**

- Header bar with mountain icon + "Alpine Gear Assistant" + snowflake
- Assistant messages: left-aligned with snowflake avatar icon (light blue circle), rounded bubble with subtle border
- User messages: right-aligned, solid blue pill bubbles
- Quick-reply chips below the chat (e.g., size buttons: XS, S, M, L, XL, XXL) that the assistant can suggest contextually
- Bottom input: "Or type your own response..." placeholder + send button (paper plane icon)
- Clean white/light gray dotted background

**Files changed:** `src/components/ChatPanel.tsx`, `src/index.css` (add dotted bg pattern)

---

## Screen 2: Loading / Searching

**Current:** Ski emoji, rotating status messages, bouncing dots.
**New (matching your mockup):**

- Centered snowflake icon with pulsing ring animation
- Progress bar that fills over ~3 seconds (simulated)
- Percentage counter below (e.g., "84% complete")
- Rotating pro tips below (e.g., "Layer your ski clothing for maximum warmth...")
- Floating snowflake decorations in corners
- Mountain silhouette at the bottom (CSS shapes)

**Files changed:** `src/components/SearchingScreen.tsx`, add keyframes to `tailwind.config.ts`

---

## Screen 3: Cart / Results Page ("What we found")

**Current:** Small item cards in 2-column grid, separate cart footer, "Swap" button.
**New (matching your mockups):**

- Top nav bar: mountain icon + "Alpine Gear" left, cart icon + item count right
- Section header: snowflake + "What we found" / "Curated just for you based on your preferences" left, "Total $XXX" right in blue
- 3-column card grid (responsive), each card contains:
  - Category label chip (top-left, e.g., "Jacket")
  - Checkmark badge (top-right, turns blue when confirmed)
  - Product image (center, using existing color-tinted category images)
  - Product name + description
  - Size and Color badges
  - Price in blue
  - "Confirm to Cart" button (full-width, blue) -- toggles to "Confirmed" with checkmark
  - Dropdown chevron button to open alternatives modal
- Bottom: sticky "Checkout - $XXX" button (full-width, blue, with cart icon)
- Remove the old ConstraintsSummary panel (fold info into header area)

**Files changed:** `src/pages/Index.tsx`, `src/components/OutfitPanel.tsx` (major rewrite), `src/components/ItemCard.tsx` (major rewrite), `src/components/CartPanel.tsx` (redesign as sticky bottom bar)

**New component:** `src/components/ResultsHeader.tsx` (nav bar + "What we found" section)

---

## Screen 4: Alternatives Modal

**Current:** SwapModal with list of alternatives and "Select" buttons.
**New (matching your mockup):**

- Modal overlay with title "Alternative [category]"
- Cards in a horizontal grid showing: image, name, color/size, price, "Select" button
- Close button (X) in top right

**Files changed:** `src/components/SwapModal.tsx` (visual redesign)

---

## Screen 5: Checkout Page

**Current:** Single-column modal with form fields.
**New (matching your mockup):**

- Full page (not a modal) with "Checkout" header + mountain icon
- Two-column layout:
  - Left: "Order Summary" card with item list (image, name, size/color, price), subtotal, shipping (Free), total
  - Right: "Payment Details" card with Shipping Address section (Full Name, Address, City, Zip Code) and Card Information section (Card Number, Expiry Date, CVV)
- Bottom: "Confirm and Buy - $XXX" button with checkmark icon, light blue gradient

**Files changed:** `src/components/CheckoutModal.tsx` (major rewrite to full-page layout)

---

## State Changes

- Add `confirmedItems` tracking to `AppContext` -- a `Set<ProductCategory>` tracking which items the user has confirmed
- The "Confirm to Cart" button toggles an item in/out of confirmed state
- Checkout button only enables when all items are confirmed
- Remove the separate `CartPanel` bottom bar, replace with a sticky checkout button in the results page

---

## Technical Details

### New/Modified Files Summary

| File | Action |
|------|--------|
| `src/components/ChatPanel.tsx` | Redesign with avatar icons, quick-reply chips, dotted background |
| `src/components/SearchingScreen.tsx` | Progress bar, percentage, pro tips, mountain silhouette |
| `src/pages/Index.tsx` | New results layout with nav bar, remove CartPanel usage |
| `src/components/OutfitPanel.tsx` | 3-column card grid with confirm/change flow |
| `src/components/ItemCard.tsx` | Full redesign matching mockup card style |
| `src/components/SwapModal.tsx` | Horizontal card grid alternatives |
| `src/components/CheckoutModal.tsx` | Full-page two-column checkout |
| `src/components/CartPanel.tsx` | Replace with sticky checkout bar |
| `src/components/ResultsHeader.tsx` | New: nav bar + "What we found" header |
| `src/context/AppContext.tsx` | Add `confirmedItems` state and `toggleConfirmItem` action |
| `src/index.css` | Add dotted background pattern, mountain silhouette CSS |
| `tailwind.config.ts` | Add progress-fill keyframe animation |

### Categories Displayed

The mockups show 3 items (jacket, pants, gloves). The current app has 5 categories. The plan will keep all 5 categories but display them in a responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile) so it naturally adapts.

### No Breaking Changes

- All existing AI parsing, edge function, mock data, and state logic remain unchanged
- This is purely a frontend visual overhaul
- The product data model stays the same


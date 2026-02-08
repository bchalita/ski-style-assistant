import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import {
  addItemsToCart,
  createCartFromSelection,
  getCart,
  removeItem,
} from "./cart";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from backend" });
});

// --- Cart routes ---

/** POST /api/cart - Create a new cart from outfit selection */
app.post("/api/cart", (req, res) => {
  const body = req.body as { selection?: { outfitId?: string; itemIds?: string[]; subtotal?: number }; currency?: string };
  const { selection, currency } = body;
  if (!selection?.itemIds || !Array.isArray(selection.itemIds)) {
    res.status(400).json({ error: "Missing or invalid selection.itemIds" });
    return;
  }
  const result = createCartFromSelection({
    selection: {
      outfitId: selection.outfitId ?? "",
      itemIds: selection.itemIds,
      subtotal: selection.subtotal,
    },
    currency,
  });
  res.status(201).json(result);
});

/** GET /api/cart/:cartId - Get cart by ID */
app.get("/api/cart/:cartId", (req, res) => {
  const { cartId } = req.params;
  const cart = getCart(cartId);
  if (!cart) {
    res.status(404).json({ error: "Cart not found" });
    return;
  }
  res.json(cart);
});

/** POST /api/cart/add - Add items to existing cart */
app.post("/api/cart/add", (req, res) => {
  const body = req.body as { cartId?: string; itemIds?: string[]; subtotal?: number };
  const { cartId, itemIds, subtotal } = body;
  if (!cartId || !itemIds || !Array.isArray(itemIds)) {
    res.status(400).json({ error: "Missing or invalid cartId or itemIds" });
    return;
  }
  const cart = addItemsToCart({ cartId, itemIds, subtotal });
  if (!cart) {
    res.status(404).json({ error: "Cart not found" });
    return;
  }
  res.json(cart);
});

/** POST /api/cart/remove - Remove one item from cart */
app.post("/api/cart/remove", (req, res) => {
  const body = req.body as { cartId?: string; itemId?: string; amountToSubtract?: number };
  const { cartId, itemId, amountToSubtract } = body;
  if (!cartId || !itemId) {
    res.status(400).json({ error: "Missing cartId or itemId" });
    return;
  }
  const cart = removeItem({ cartId, itemId, amountToSubtract });
  if (!cart) {
    res.status(404).json({ error: "Cart not found" });
    return;
  }
  res.json(cart);
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});


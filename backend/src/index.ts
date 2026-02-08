import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import {
  addItemsToCart,
  createCartFromSelection,
  getCart,
  removeItem,
} from "./cart";
import { normalizeUserRequest, type RequestAgentOutput } from "./requestAgent";
import { searchAgent, type SearchInput } from "./searchAgent";
import { assembleOutfits } from "./assemblingOutfit";
import { rankOutfits } from "./rankingEngine";
import { checkout } from "./checkout";

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

// --- Request Agent ---

app.post("/api/request-agent", async (req, res) => {
  try {
    const body = req.body as unknown;
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      typeof (body as { userRequest?: unknown }).userRequest !== "string"
    ) {
      return res.status(400).json({
        error: "Invalid body. Expected { userRequest: string, context?: { ... } }",
      });
    }

    const { userRequest, context, options } = body as {
      userRequest: string;
      context?: unknown;
      options?: unknown;
    };

    const normalized = await normalizeUserRequest({
      userRequest,
      context:
        context && typeof context === "object" && !Array.isArray(context)
          ? (context as {
              userId?: string;
              locale?: string;
              todayISO?: string;
              previousMessages?: string[];
              previousOutput?: RequestAgentOutput;
            })
          : undefined,
    }, {
      model:
        options && typeof options === "object" && !Array.isArray(options)
          ? (options as { model?: string }).model
          : undefined,
      includePreviousMessages:
        options && typeof options === "object" && !Array.isArray(options)
          ? Boolean((options as { includePreviousMessages?: unknown }).includePreviousMessages)
          : false,
    });

    return res.json(normalized);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

// --- Outfit Pipeline ---

app.post("/api/outfits", async (req, res) => {
  try {
    const { normalizedRequest, userPrompt } = req.body as {
      normalizedRequest: RequestAgentOutput;
      userPrompt?: string;
    };

    if (!normalizedRequest) {
      return res.status(400).json({ error: "Missing normalizedRequest" });
    }

    // 1. Search
    const searchInput: SearchInput = {
      budget: normalizedRequest.budget ?? undefined,
      deadline: normalizedRequest.deliveryDeadline ?? undefined,
      preferences: {
        color: normalizedRequest.preferences.color ?? undefined,
      } as Record<string, string | number | boolean | string[]>,
      mustHaves: normalizedRequest.mustHaves,
      niceToHaves: normalizedRequest.niceToHaves,
    };

    // Remove undefined values from preferences
    const prefs = searchInput.preferences as Record<string, unknown>;
    for (const key of Object.keys(prefs)) {
      if (prefs[key] === undefined) delete prefs[key];
    }

    const searchResult = searchAgent(searchInput);

    if (searchResult.items.length === 0) {
      return res.json({
        items: [],
        outfitOptions: [],
        ranked: [],
        infeasibleReason: searchResult.missingInfo
          ? `Missing info: ${searchResult.missingInfo.join(", ")}`
          : "No items found matching your criteria",
      });
    }

    // 2. Assemble
    const assembleResult = assembleOutfits({
      items: searchResult.items,
      constraints: {
        budget: normalizedRequest.budget ?? undefined,
        mustHaves: normalizedRequest.mustHaves,
        niceToHaves: normalizedRequest.niceToHaves,
      },
    });

    if (assembleResult.outfitOptions.length === 0) {
      return res.json({
        items: searchResult.items,
        outfitOptions: [],
        ranked: [],
        infeasibleReason: assembleResult.infeasibleReason || "Could not assemble a complete outfit",
      });
    }

    // 3. Rank
    const rankResult = await rankOutfits({
      outfitOptions: assembleResult.outfitOptions,
      items: searchResult.items,
      userPrompt: userPrompt ?? undefined,
      scoringConfig: {
        budget: normalizedRequest.budget?.max,
      },
    });

    return res.json({
      items: searchResult.items,
      outfitOptions: assembleResult.outfitOptions,
      ranked: rankResult.ranked,
      recommendedOutfitId: rankResult.recommendedOutfitId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

// --- Cart routes ---

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

app.get("/api/cart/:cartId", (req, res) => {
  const { cartId } = req.params;
  const cart = getCart(cartId);
  if (!cart) {
    res.status(404).json({ error: "Cart not found" });
    return;
  }
  res.json(cart);
});

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

// --- Checkout ---

app.post("/api/checkout", async (req, res) => {
  try {
    const result = await checkout(req.body);
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});

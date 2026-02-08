import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { AppScreen, ChatMessage, Product, ProductCategory } from "@/types";

interface AppState {
  screen: AppScreen;
  messages: ChatMessage[];
  outfit: Record<ProductCategory, Product>;
  confirmedItems: Set<ProductCategory>;
  isLoading: boolean;
  rankingExplanation: string;
  allItems: Product[];
}

interface AppContextValue extends AppState {
  sendMessage: (text: string) => void;
  toggleConfirmItem: (category: ProductCategory) => void;
  swapItem: (category: ProductCategory, product: Product) => void;
  getAlternatives: (category: ProductCategory) => Product[];
  goToCheckout: () => void;
  goBackToResults: () => void;
  totalPrice: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

const EMPTY_OUTFIT: Record<ProductCategory, Product> = {
  jacket: { id: "", name: "", category: "jacket", price: 0, size: "", color: "", brand: "", description: "", imageUrl: "" },
  pants: { id: "", name: "", category: "pants", price: 0, size: "", color: "", brand: "", description: "", imageUrl: "" },
  gloves: { id: "", name: "", category: "gloves", price: 0, size: "", color: "", brand: "", description: "", imageUrl: "" },
  baselayer: { id: "", name: "", category: "baselayer", price: 0, size: "", color: "", brand: "", description: "", imageUrl: "" },
  boots: { id: "", name: "", category: "boots", price: 0, size: "", color: "", brand: "", description: "", imageUrl: "" },
};

const INITIAL_MESSAGE: ChatMessage = {
  id: "1",
  role: "assistant",
  text: "Welcome to Alpine Gear! 🏔️ I'll help you find the perfect ski outfit. What are you looking for today?",
  quickReplies: ["Full ski outfit", "Just a jacket", "Gloves & accessories"],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<AppScreen>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [outfit, setOutfit] = useState<Record<ProductCategory, Product>>(EMPTY_OUTFIT);
  const [confirmedItems, setConfirmedItems] = useState<Set<ProductCategory>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [rankingExplanation, setRankingExplanation] = useState("");
  const [allItems, setAllItems] = useState<Product[]>([]);

  // Accumulated state from request agent
  const [previousOutput, setPreviousOutput] = useState<any>(undefined);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Lazy-load the API module to avoid crashing if Supabase env vars aren't ready
  const getApi = useCallback(async () => {
    const api = await import("@/services/api");
    return api;
  }, []);

  const runOutfitPipeline = useCallback(async (agentOutput: any, prompt: string) => {
    setScreen("loading");
    try {
      const { callOutfitPipeline, mapBackendItemToProduct } = await getApi().then(async (api) => {
        const { mapBackendItemToProduct } = await import("@/types");
        return { callOutfitPipeline: api.callOutfitPipeline, mapBackendItemToProduct };
      });

      const result = await callOutfitPipeline(agentOutput, prompt);
      
      // Handle infeasible results
      if (result.infeasibleReason || result.outfitOptions.length === 0) {
        addMessage({
          id: Date.now().toString(),
          role: "assistant",
          text: result.infeasibleReason 
            ? `I couldn't find a complete outfit within your constraints: ${result.infeasibleReason}. Try adjusting your budget or removing some items.`
            : "I couldn't assemble a complete outfit with those constraints. Try adjusting your requirements.",
          quickReplies: ["Increase budget to $1000", "Just jacket & pants", "Best guess"],
        });
        setScreen("chat");
        return;
      }

      const products = result.items.map(mapBackendItemToProduct);
      setAllItems(products);

      const recommendedId = result.recommendedOutfitId;
      const recommendedOption = result.outfitOptions.find((o) => o.id === recommendedId) ?? result.outfitOptions[0];

      if (recommendedOption && products.length > 0) {
        const outfitRecord = { ...EMPTY_OUTFIT };
        for (const { itemId } of recommendedOption.items) {
          const product = products.find((p) => p.id === itemId);
          if (product) {
            outfitRecord[product.category] = product;
          }
        }
        setOutfit(outfitRecord);
      }

      const topRanked = result.ranked?.find((r) => r.outfitId === recommendedId) ?? result.ranked?.[0];
      if (topRanked?.explanation) {
        setRankingExplanation(topRanked.explanation);
      }

      setScreen("results");
    } catch (err) {
      console.error("Outfit pipeline failed:", err);
      addMessage({
        id: Date.now().toString(),
        role: "assistant",
        text: "Sorry, I had trouble finding outfits. Please try again.",
      });
      setScreen("chat");
    }
  }, [addMessage, getApi]);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text,
    };
    addMessage(userMsg);

    const updatedHistory = [...conversationHistory, text];
    setConversationHistory(updatedHistory);

    try {
      const api = await getApi();
      const agentOutput = await api.callRequestAgent(text, {
        previousMessages: updatedHistory,
        previousOutput,
      });

      setPreviousOutput(agentOutput);

      if (agentOutput.clarifyingQuestion) {
        const quickReplies = generateQuickReplies(agentOutput);
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: agentOutput.clarifyingQuestion,
          quickReplies,
        };
        addMessage(assistantMsg);
      } else {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Great! I have enough info to find your perfect outfit. Let me search for the best options! 🎿",
        };
        addMessage(assistantMsg);
        const fullPrompt = updatedHistory.join(". ");
        setTimeout(() => runOutfitPipeline(agentOutput, fullPrompt), 600);
      }
    } catch (err) {
      console.error("Request agent error:", err);
      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "Sorry, I couldn't process that. The backend may still be initializing — please try again in a moment.",
      });
    }
  }, [conversationHistory, previousOutput, addMessage, runOutfitPipeline, getApi]);

  const toggleConfirmItem = useCallback((category: ProductCategory) => {
    setConfirmedItems((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const swapItem = useCallback((category: ProductCategory, product: Product) => {
    setOutfit((prev) => ({ ...prev, [category]: product }));
    setConfirmedItems((prev) => {
      const next = new Set(prev);
      next.add(category);
      return next;
    });
  }, []);

  const getAlternatives = useCallback((category: ProductCategory) => {
    const currentId = outfit[category]?.id;
    return allItems.filter((p) => p.category === category && p.id !== currentId);
  }, [allItems, outfit]);

  const goToCheckout = useCallback(() => setScreen("checkout"), []);
  const goBackToResults = useCallback(() => setScreen("results"), []);

  const totalPrice = Object.values(outfit).reduce((sum, p) => sum + p.price, 0);

  return (
    <AppContext.Provider
      value={{
        screen,
        messages,
        outfit,
        confirmedItems,
        isLoading,
        rankingExplanation,
        allItems,
        sendMessage,
        toggleConfirmItem,
        swapItem,
        getAlternatives,
        goToCheckout,
        goBackToResults,
        totalPrice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

function generateQuickReplies(output: any): string[] {
  const question = output.clarifyingQuestion?.toLowerCase() ?? "";

  if (question.includes("budget")) {
    return ["Under $500", "$500–$1000", "Over $1000"];
  }
  if (question.includes("size") && question.includes("boot")) {
    return ["US 9", "US 10", "US 11"];
  }
  if (question.includes("size")) {
    return ["S", "M", "L", "XL"];
  }
  if (question.includes("items") || question.includes("which")) {
    return ["Full ski outfit", "Jacket & pants", "Just a jacket"];
  }
  if (question.includes("delivery") || question.includes("trip") || question.includes("date")) {
    return ["This week", "In 2 weeks", "No rush"];
  }
  return [];
}

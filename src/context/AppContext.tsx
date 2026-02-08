import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AppScreen, ChatMessage, Constraints, Product, ProductCategory } from "@/types";
import { mockOutfit, mockAlternatives } from "@/data/mockProducts";
import { supabase } from "@/integrations/supabase/client";

interface AppState {
  screen: AppScreen;
  messages: ChatMessage[];
  constraints: Constraints;
  outfit: Record<ProductCategory, Product>;
  confirmedItems: Set<ProductCategory>;
  isLoading: boolean;
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

const INITIAL_MESSAGE: ChatMessage = {
  id: "1",
  role: "assistant",
  text: "Welcome to Alpine Gear! 🏔️ I'll help you find the perfect ski outfit. What are you looking for today?",
  quickReplies: ["Full ski outfit", "Just a jacket", "Gloves & accessories"],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<AppScreen>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [constraints, setConstraints] = useState<Constraints>({});
  const [outfit, setOutfit] = useState<Record<ProductCategory, Product>>(mockOutfit);
  const [confirmedItems, setConfirmedItems] = useState<Set<ProductCategory>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text,
    };
    addMessage(userMsg);
    const count = messageCount + 1;
    setMessageCount(count);

    // Try AI parsing via edge function
    try {
      const { data, error } = await supabase.functions.invoke("parse-constraints", {
        body: {
          message: text,
          currentConstraints: constraints,
          conversationHistory: messages.slice(-10).map((m) => ({ role: m.role, text: m.text })),
        },
      });

      if (!error && data) {
        const updated = { ...constraints, ...data.constraints };
        setConstraints(updated);

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: data.response || "Got it! Tell me more about what you need.",
          quickReplies: data.quickReplies,
        };
        addMessage(assistantMsg);

        if (data.readyToSearch) {
          startSearch();
        }
        return;
      }
    } catch {
      // fallback below
    }

    // Fallback: after 3 messages, trigger search
    if (count >= 3) {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "Great! I have enough info to find your perfect outfit. Let me search for the best options! 🎿",
      };
      addMessage(assistantMsg);
      setTimeout(() => startSearch(), 800);
    } else {
      const followUps = [
        { text: "What's your budget range?", quickReplies: ["Under $500", "$500-$1000", "Over $1000"] },
        { text: "What size do you typically wear?", quickReplies: ["XS", "S", "M", "L", "XL", "XXL"] },
        { text: "Any color preferences?", quickReplies: ["Black", "Navy", "Red", "No preference"] },
      ];
      const followUp = followUps[count - 1] || followUps[0];
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: followUp.text,
        quickReplies: followUp.quickReplies,
      };
      addMessage(assistantMsg);
    }
  }, [messages, constraints, messageCount, addMessage]);

  const startSearch = useCallback(() => {
    setScreen("loading");
    setTimeout(() => {
      setScreen("results");
    }, 3500);
  }, []);

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
    // Auto-confirm swapped item
    setConfirmedItems((prev) => {
      const next = new Set(prev);
      next.add(category);
      return next;
    });
  }, []);

  const getAlternatives = useCallback((category: ProductCategory) => {
    return mockAlternatives[category] || [];
  }, []);

  const goToCheckout = useCallback(() => setScreen("checkout"), []);
  const goBackToResults = useCallback(() => setScreen("results"), []);

  const totalPrice = Object.values(outfit).reduce((sum, p) => sum + p.price, 0);

  return (
    <AppContext.Provider
      value={{
        screen,
        messages,
        constraints,
        outfit,
        confirmedItems,
        isLoading,
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

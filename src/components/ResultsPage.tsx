import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Mountain, ShoppingCart, Snowflake, ChevronDown, ChevronUp } from "lucide-react";
import ItemCard from "./ItemCard";
import AddItemCard from "./AddItemCard";
import { ProductCategory } from "@/types";

const CATEGORIES: ProductCategory[] = ["jacket", "pants", "gloves", "baselayer", "base_bottom", "boots"];

export default function ResultsPage() {
  const { outfit, confirmedItems, totalPrice, goToCheckout, rankingExplanation } = useApp();
  const [showExplanation, setShowExplanation] = useState(false);

  // Track which categories have items
  const activeCategories = useMemo(() => {
    const set = new Set<ProductCategory>();
    for (const cat of CATEGORIES) {
      if (outfit[cat]?.id) set.add(cat);
    }
    return set;
  }, [outfit]);

  const confirmedCount = confirmedItems.size;
  const hasConfirmed = confirmedCount > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Mountain className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Alpine Gear</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShoppingCart className="w-5 h-5" />
          <span className="text-sm font-medium">{confirmedCount}</span>
        </div>
      </header>

      {/* Section header */}
      <div className="px-6 py-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Snowflake className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">What we found</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Curated just for you based on your preferences
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">${totalPrice}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      {/* AI Explanation */}
      {rankingExplanation && (
        <div className="px-6 pb-4">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
          >
            <Snowflake className="w-4 h-4" />
            Why these items?
            {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showExplanation && (
            <div className="mt-2 p-4 rounded-xl bg-accent/50 border border-border text-sm text-foreground leading-relaxed">
              {rankingExplanation}
            </div>
          )}
        </div>
      )}

      {/* Card grid */}
      <div className="flex-1 px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((cat) => (
            outfit[cat]?.id ? <ItemCard key={cat} product={outfit[cat]} category={cat} /> : null
          ))}
          <AddItemCard existingCategories={activeCategories} />
        </div>
      </div>

      {/* Sticky checkout */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <button
          onClick={goToCheckout}
          disabled={!hasConfirmed}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5" />
          Checkout — ${totalPrice}
        </button>
        {!hasConfirmed && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Confirm at least one item to proceed
          </p>
        )}
      </div>
    </div>
  );
}

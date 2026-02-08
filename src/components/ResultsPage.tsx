import { useApp } from "@/context/AppContext";
import { Mountain, ShoppingCart, Snowflake } from "lucide-react";
import ItemCard from "./ItemCard";
import { ProductCategory } from "@/types";

const CATEGORIES: ProductCategory[] = ["jacket", "pants", "gloves", "baselayer", "boots"];

export default function ResultsPage() {
  const { outfit, confirmedItems, totalPrice, goToCheckout } = useApp();

  const confirmedCount = confirmedItems.size;
  const allConfirmed = confirmedCount === CATEGORIES.length;

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

      {/* Card grid */}
      <div className="flex-1 px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((cat) => (
            <ItemCard key={cat} product={outfit[cat]} category={cat} />
          ))}
        </div>
      </div>

      {/* Sticky checkout */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <button
          onClick={goToCheckout}
          disabled={!allConfirmed}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5" />
          Checkout — ${totalPrice}
        </button>
        {!allConfirmed && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Confirm all items to proceed
          </p>
        )}
      </div>
    </div>
  );
}

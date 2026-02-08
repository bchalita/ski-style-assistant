import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Product, ProductCategory } from "@/types";
import { Check, ChevronDown } from "lucide-react";
import SwapModal from "./SwapModal";

interface Props {
  product: Product;
  category: ProductCategory;
}

export default function ItemCard({ product, category }: Props) {
  const { confirmedItems, toggleConfirmItem } = useApp();
  const [showAlternatives, setShowAlternatives] = useState(false);
  const isConfirmed = confirmedItems.has(category);

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
        {/* Top row: category + check */}
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium capitalize">
            {category}
          </span>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              isConfirmed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <Check className="w-4 h-4" />
          </div>
        </div>

        {/* Image */}
        <div className="px-4 py-3">
          <div className="w-full aspect-square rounded-lg bg-muted overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Info */}
        <div className="px-4 pb-2">
          <h3 className="font-semibold text-foreground text-sm">{product.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground">
              {product.size}
            </span>
            <span className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground">
              {product.color}
            </span>
          </div>
          <p className="text-lg font-bold text-primary mt-2">${product.price}</p>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => toggleConfirmItem(category)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              isConfirmed
                ? "bg-primary/10 text-primary border border-primary"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isConfirmed ? (
              <>
                <Check className="w-4 h-4" /> Confirmed
              </>
            ) : (
              "Confirm to Cart"
            )}
          </button>
          <button
            onClick={() => setShowAlternatives(true)}
            className="w-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {showAlternatives && (
        <SwapModal category={category} onClose={() => setShowAlternatives(false)} />
      )}
    </>
  );
}

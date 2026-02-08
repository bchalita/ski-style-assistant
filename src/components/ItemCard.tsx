import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Product, ProductCategory } from "@/types";
import { Check, ChevronDown } from "lucide-react";
import SwapModal from "./SwapModal";
import ColorSwatch from "./ColorSwatch";

interface Props {
  product: Product;
  category: ProductCategory;
}

export default function ItemCard({ product, category }: Props) {
  const { confirmedItems, toggleConfirmItem, getAlternatives, swapItem } = useApp();
  const [showAlternatives, setShowAlternatives] = useState(false);
  const isConfirmed = confirmedItems.has(category);

  // Get color variants of the same product name
  const colorVariants = useMemo(() => {
    const alts = getAlternatives(category);
    const sameName = alts.filter(
      (a) => a.name === product.name && a.size === product.size && a.color !== product.color
    );
    // Deduplicate by color
    const seen = new Set<string>([product.color]);
    const unique: Product[] = [];
    for (const a of sameName) {
      if (!seen.has(a.color)) {
        seen.add(a.color);
        unique.push(a);
      }
    }
    return unique;
  }, [getAlternatives, category, product]);

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

        {/* Color swatches */}
        <div className="px-4 pb-1 flex items-center gap-2 flex-wrap">
          <ColorSwatch color={product.color} isActive onClick={() => {}} />
          {colorVariants.map((v) => (
            <ColorSwatch
              key={v.id}
              color={v.color}
              isActive={false}
              onClick={() => swapItem(category, v)}
            />
          ))}
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
          {isConfirmed ? (
            <button
              onClick={() => toggleConfirmItem(category)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border border-destructive text-destructive hover:bg-destructive/10"
            >
              Remove from Cart
            </button>
          ) : (
            <button
              onClick={() => toggleConfirmItem(category)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors bg-primary text-primary-foreground"
            >
              Add to Cart
            </button>
          )}
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

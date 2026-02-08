import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Product, ProductCategory } from "@/types";
import { X } from "lucide-react";
import ColorSwatch from "./ColorSwatch";

interface Props {
  category: ProductCategory;
  onClose: () => void;
}

interface ProductGroup {
  baseName: string;
  brand: string;
  size: string;
  price: number;
  variants: Product[]; // different colors
}

export default function SwapModal({ category, onClose }: Props) {
  const { getAlternatives, swapItem } = useApp();
  const alternatives = getAlternatives(category);

  // Group alternatives by name+size (same product, different colors)
  const groups = useMemo(() => {
    const map = new Map<string, ProductGroup>();
    for (const alt of alternatives) {
      const key = `${alt.name}__${alt.size}`;
      if (!map.has(key)) {
        map.set(key, {
          baseName: alt.name,
          brand: alt.brand,
          size: alt.size,
          price: alt.price,
          variants: [],
        });
      }
      // Deduplicate by color
      const group = map.get(key)!;
      if (!group.variants.some((v) => v.color === alt.color)) {
        group.variants.push(alt);
      }
    }
    return Array.from(map.values());
  }, [alternatives]);

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground capitalize">Alternative {category}s</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <GroupCard key={`${group.baseName}__${group.size}`} group={group} category={category} swapItem={swapItem} onClose={onClose} />
          ))}
          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-8">No alternatives available</p>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupCard({
  group,
  category,
  swapItem,
  onClose,
}: {
  group: ProductGroup;
  category: ProductCategory;
  swapItem: (cat: ProductCategory, p: Product) => void;
  onClose: () => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = group.variants[selectedIdx];

  return (
    <div className="border border-border rounded-xl p-3 flex flex-col">
      <div className="w-full aspect-square rounded-lg bg-muted overflow-hidden mb-3">
        <img src={selected.imageUrl} alt={selected.name} className="w-full h-full object-cover" loading="lazy" />
      </div>

      {/* Color swatches */}
      {group.variants.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {group.variants.map((v, i) => (
            <ColorSwatch
              key={v.id}
              color={v.color}
              isActive={i === selectedIdx}
              onClick={() => setSelectedIdx(i)}
              size="sm"
            />
          ))}
        </div>
      )}

      <h4 className="text-sm font-semibold text-foreground">{group.baseName}</h4>
      <div className="flex gap-1.5 mt-1">
        <span className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground">{selected.size}</span>
        <span className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground">{selected.color}</span>
      </div>
      <p className="text-base font-bold text-primary mt-2">${selected.price}</p>
      <button
        onClick={() => { swapItem(category, selected); onClose(); }}
        className="mt-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Select
      </button>
    </div>
  );
}

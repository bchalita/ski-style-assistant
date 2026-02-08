import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Product, ProductCategory } from "@/types";
import { Plus, X } from "lucide-react";
import ColorSwatch from "./ColorSwatch";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  jacket: "Jacket",
  pants: "Pants",
  gloves: "Gloves",
  baselayer: "Base Layer Top",
  boots: "Boots",
  base_bottom: "Base Layer Bottom",
};

interface ProductGroup {
  baseName: string;
  brand: string;
  price: number;
  variants: Product[];
}

export default function AddItemCard({ existingCategories }: { existingCategories: Set<ProductCategory> }) {
  const { allItems, swapItem } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

  // Categories that aren't already in the outfit
  const availableCategories = (Object.keys(CATEGORY_LABELS) as ProductCategory[]).filter(
    (cat) => !existingCategories.has(cat)
  );

  // Items for the selected category
  const groups = useMemo(() => {
    if (!selectedCategory) return [];
    const items = allItems.filter((p) => p.category === selectedCategory);
    const map = new Map<string, ProductGroup>();
    for (const item of items) {
      const key = `${item.name}__${item.size}`;
      if (!map.has(key)) {
        map.set(key, { baseName: item.name, brand: item.brand, price: item.price, variants: [] });
      }
      const group = map.get(key)!;
      if (!group.variants.some((v) => v.color === item.color)) {
        group.variants.push(item);
      }
    }
    return Array.from(map.values());
  }, [allItems, selectedCategory]);

  if (availableCategories.length === 0) return null;

  // Show category picker
  if (!selectedCategory) {
    return (
      <div className="bg-card rounded-xl border border-dashed border-border overflow-hidden animate-fade-in flex flex-col items-center justify-center p-6 min-h-[320px]">
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4">
          <Plus className="w-6 h-6 text-accent-foreground" />
        </div>
        <h3 className="font-semibold text-foreground text-sm mb-3">Add an item</h3>
        <div className="flex flex-col gap-2 w-full">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="w-full py-2 px-3 rounded-lg bg-muted text-sm text-foreground hover:bg-accent transition-colors text-left capitalize"
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Show items for selected category
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
          Add {CATEGORY_LABELS[selectedCategory]}
        </span>
        <button
          onClick={() => setSelectedCategory(null)}
          className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3 max-h-[400px] overflow-y-auto">
        {groups.map((group) => (
          <GroupItem
            key={`${group.baseName}__${group.brand}`}
            group={group}
            category={selectedCategory}
            onSelect={() => setSelectedCategory(null)}
          />
        ))}
        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No items available in this category
          </p>
        )}
      </div>
    </div>
  );
}

function GroupItem({
  group,
  category,
  onSelect,
}: {
  group: ProductGroup;
  category: ProductCategory;
  onSelect: () => void;
}) {
  const { swapItem } = useApp();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = group.variants[selectedIdx];

  return (
    <div className="border border-border rounded-lg p-3 flex gap-3">
      <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
        <img src={selected.imageUrl} alt={selected.name} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-foreground truncate">{group.baseName}</h4>
        <p className="text-xs text-muted-foreground">{group.brand}</p>
        {group.variants.length > 1 && (
          <div className="flex items-center gap-1.5 mt-1">
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
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-sm font-bold text-primary">${selected.price}</span>
          <button
            onClick={() => {
              swapItem(category, selected);
              onSelect();
            }}
            className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

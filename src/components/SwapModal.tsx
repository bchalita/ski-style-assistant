import { useApp } from "@/context/AppContext";
import { ProductCategory } from "@/types";
import { X } from "lucide-react";

interface Props {
  category: ProductCategory;
  onClose: () => void;
}

export default function SwapModal({ category, onClose }: Props) {
  const { getAlternatives, swapItem } = useApp();
  const alternatives = getAlternatives(category);

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
          {alternatives.map((alt) => (
            <div key={alt.id} className="border border-border rounded-xl p-3 flex flex-col">
              <div className="w-full aspect-square rounded-lg bg-muted overflow-hidden mb-3">
                <img src={alt.imageUrl} alt={alt.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">{alt.name}</h4>
              <div className="flex gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground">{alt.size}</span>
                <span className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground">{alt.color}</span>
              </div>
              <p className="text-base font-bold text-primary mt-2">${alt.price}</p>
              <button
                onClick={() => { swapItem(category, alt); onClose(); }}
                className="mt-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Select
              </button>
            </div>
          ))}
          {alternatives.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-8">No alternatives available</p>
          )}
        </div>
      </div>
    </div>
  );
}

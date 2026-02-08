import { useState, useEffect } from "react";
import { ShoppingBag } from "lucide-react";

const PRO_TIPS = [
  "Scanning thousands of options just for you 🔍",
  "Matching your style, budget, and preferences 🎯",
  "Comparing prices across top retailers 💰",
  "Checking availability and delivery times 📦",
  "Almost there — your perfect picks await ✨",
];

export default function SearchingScreen() {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Progress bar: fill to 100% over ~6.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(p + 1, 100);
      });
    }, 65);
    return () => clearInterval(interval);
  }, []);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % PRO_TIPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background relative overflow-hidden">
      {/* Pulsing icon */}
      <div className="relative mb-10">
        <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-primary animate-pulse-ring" />
      </div>

      {/* Progress bar */}
      <div className="w-72 h-2 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-primary rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-lg font-semibold text-foreground mb-1">{progress}% complete</p>
      <p className="text-sm text-muted-foreground mb-8">Finding the best options for you...</p>

      {/* Pro tip */}
      <div className="max-w-sm text-center px-6">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Did you know?</p>
        <p className="text-sm text-foreground animate-fade-in" key={tipIndex}>
          {PRO_TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
}

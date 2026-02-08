import { useState, useEffect } from "react";
import { Snowflake } from "lucide-react";

const PRO_TIPS = [
  "Picking the perfect outfit just for you ❄️",
  "No one will look better than you on that mountain peak 🏔️",
  "Matching colors, warmth, and style to your vibe 🎿",
  "Checking every seam, every zipper, every layer 🧤",
  "Almost there — your dream outfit awaits ⛷️",
];

export default function SearchingScreen() {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 1, 100));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % PRO_TIPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background mountain-silhouette relative overflow-hidden">
      {/* Floating snowflakes */}
      <Snowflake className="absolute top-12 left-12 w-6 h-6 text-primary opacity-20 animate-float" />
      <Snowflake className="absolute top-20 right-16 w-4 h-4 text-primary opacity-15 animate-float" style={{ animationDelay: "1s" }} />
      <Snowflake className="absolute bottom-32 left-20 w-5 h-5 text-primary opacity-10 animate-float" style={{ animationDelay: "0.5s" }} />
      <Snowflake className="absolute top-40 right-32 w-3 h-3 text-primary opacity-20 animate-float" style={{ animationDelay: "1.5s" }} />

      {/* Pulsing icon */}
      <div className="relative mb-10">
        <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
          <Snowflake className="w-10 h-10 text-primary" />
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
      <p className="text-sm text-muted-foreground mb-8">Finding your perfect outfit...</p>

      {/* Pro tip */}
      <div className="max-w-sm text-center px-6">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Pro Tip</p>
        <p className="text-sm text-foreground animate-fade-in" key={tipIndex}>
          {PRO_TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
}

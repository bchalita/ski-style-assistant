import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { ShoppingBag, ArrowLeft, Check, Home, Truck } from "lucide-react";
import { ProductCategory } from "@/types";

const CATEGORIES: ProductCategory[] = ["jacket", "pants", "gloves", "baselayer", "boots"];

export default function CheckoutPage() {
  const { outfit, confirmedItems, totalPrice, goBackToResults, goHome } = useApp();
  const [submitted, setSubmitted] = useState(false);

  const items = CATEGORIES.filter((cat) => confirmedItems.has(cat)).map((cat) => outfit[cat]);
  const cartTotal = items.reduce((sum, p) => sum + p.price, 0);
  const shipping = 0;
  const total = cartTotal + shipping;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Order Confirmed!</h2>
          <p className="text-muted-foreground mb-6">Thank you for your purchase. Your gear is on the way! 🎿</p>
          <button
            onClick={goHome}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 mx-auto hover:opacity-90 transition-opacity"
          >
            <Home className="w-5 h-5" />
            Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 bg-card border-b border-border">
        <button onClick={goBackToResults} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button onClick={goHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Checkout</h1>
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Order Summary</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.size} / {item.color}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">${item.price}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-6 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">${cartTotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-primary font-medium">Free</span>
            </div>
            <div className="flex items-center gap-2 text-sm pt-2">
              <Truck className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Estimated arrival:</span>
              <span className="text-foreground font-medium">
                {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {" – "}
                {new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
              <span className="text-foreground">Total</span>
              <span className="text-primary">${total}</span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Payment Details</h2>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Shipping Address</h3>
            <input placeholder="Full Name" className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
            <input placeholder="Address" className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="City" className="px-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
              <input placeholder="Zip Code" className="px-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <h3 className="text-sm font-semibold text-foreground pt-4">Card Information</h3>
            <input placeholder="Card Number" className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Expiry Date" className="px-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
              <input placeholder="CVV" className="px-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <button
            onClick={() => setSubmitted(true)}
            className="w-full mt-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Check className="w-5 h-5" />
            Confirm and Buy — ${total}
          </button>
        </div>
      </div>
    </div>
  );
}

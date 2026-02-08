import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Send, ShoppingBag } from "lucide-react";

export default function ChatPanel() {
  const { messages, sendMessage, goHome } = useApp();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const isInitial = messages.length <= 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const quickReplies = lastAssistantMsg?.quickReplies;

  // Initial clean centered view
  if (isInitial) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background px-6">
        {/* Logo & Brand */}
        <div className="flex flex-col items-center gap-4 mb-10 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">BuyBuddy</h1>
          <p className="text-xl text-muted-foreground">How can I help you out today?</p>
        </div>

        {/* Quick Replies */}
        {quickReplies && quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-6 animate-fade-in">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => handleQuickReply(reply)}
                className="px-5 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="w-full max-w-xl animate-fade-in">
          <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-5 py-3 shadow-sm">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation view
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <button onClick={goHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold text-foreground">BuyBuddy</h1>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 animate-fade-in ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-4 h-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border text-foreground rounded-bl-md"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick Replies */}
      {quickReplies && quickReplies.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => handleQuickReply(reply)}
              className="px-4 py-2 rounded-full border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-4 bg-card border-t border-border">
        <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

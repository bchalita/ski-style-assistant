import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Mountain, Send, Snowflake } from "lucide-react";

export default function ChatPanel() {
  const { messages, sendMessage } = useApp();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

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

  // Find last assistant message with quick replies
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const quickReplies = lastAssistantMsg?.quickReplies;

  return (
    <div className="flex flex-col h-screen bg-dotted">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Mountain className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Alpine Gear Assistant</h1>
        </div>
        <Snowflake className="w-5 h-5 text-primary opacity-60" />
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
                <Snowflake className="w-4 h-4 text-primary" />
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
            placeholder="Or type your own response..."
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

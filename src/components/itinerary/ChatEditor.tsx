"use client";

import { useState, useRef, useEffect } from "react";
import { Drawer } from "vaul";
import { motion } from "framer-motion";

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  slug: string;
  onItineraryUpdated: () => void;
  messages: ChatMessage[];
  onNewMessage: (msg: ChatMessage) => void;
}

const SUGGESTIONS = [
  "Add a sunset activity",
  "Make tomorrow more relaxed",
  "Find a veg restaurant option",
  "Add a local street food experience",
  "Replace one activity with something offbeat",
];

export function ChatEditor({ slug, onItineraryUpdated, messages, onNewMessage }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [messages, open]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    setLoading(true);

    const userMsg: ChatMessage = { role: "user", content: text };
    onNewMessage(userMsg);

    try {
      const res = await fetch(`/api/trips/${slug}/itinerary/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (res.ok) {
        onNewMessage({ role: "assistant", content: data.reply || "Done! I've updated the itinerary." });
        if (data.itineraryUpdated) {
          onItineraryUpdated();
        }
      } else {
        onNewMessage({ role: "assistant", content: "Sorry, something went wrong. Try again." });
      }
    } catch {
      onNewMessage({ role: "assistant", content: "Connection error. Try again." });
    }

    setLoading(false);
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-500 text-white text-sm font-medium shadow-md"
      >
        <span>💬</span> Edit with AI
      </button>

      <Drawer.Root open={open} onOpenChange={setOpen} modal={false} snapPoints={[0.45, 1]}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/30 z-40" />
          <Drawer.Content className="bg-white flex flex-col fixed bottom-0 left-0 right-0 max-h-[96%] rounded-t-3xl z-50 shadow-xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <Drawer.Title className="text-center text-sm font-semibold text-gray-700 pb-2 shrink-0">
              Edit itinerary with AI
            </Drawer.Title>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-3 min-h-0">
              {messages.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-6">
                  Ask me to change anything in your itinerary
                </p>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-white border border-gray-200 self-end"
                      : "bg-sky-50 text-sky-900 self-start"
                  }`}
                >
                  {msg.content}
                </motion.div>
              ))}
              {loading && (
                <div className="bg-sky-50 text-sky-900 self-start px-3.5 py-2.5 rounded-2xl text-sm">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>•</span>
                  </span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested prompts */}
            <div className="px-4 pb-2 shrink-0">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={loading}
                    className="shrink-0 text-xs bg-sky-50 text-sky-700 px-3 py-1.5 rounded-full border border-sky-100 whitespace-nowrap disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="px-4 pb-6 shrink-0 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="What should we change?"
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="px-4 py-3 rounded-2xl bg-sky-500 text-white font-medium text-sm disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}

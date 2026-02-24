"use client";

import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { AIChatMessage } from "@/lib/database.types";

interface Props {
  onClose: () => void;
  onDataChanged: () => void;
}

interface ProposedAction {
  type: string;
  peptide_id?: string;
  changes?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export default function AIAssistant({ onClose, onDataChanged }: Props) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<ProposedAction | null>(null);
  const [actionExecuting, setActionExecuting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: AIChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setPendingAction(null);

    setLoading(true);
    try {
      const res = await apiFetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      const assistantMsg: AIChatMessage = {
        role: "assistant",
        content: data.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.action) {
        setPendingAction(data.action);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble processing that. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function executeAction() {
    if (!pendingAction) return;
    setActionExecuting(true);

    try {
      const res = await apiFetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: pendingAction }),
      });

      if (res.ok) {
        const result = await res.json();

        if (result.action === "regenerate_schedule") {
          // Trigger schedule regeneration
          const recRes = await apiFetch("/api/recommendations");
          const recData = await recRes.json();
          if (recData.schedule?.length) {
            await apiFetch("/api/schedule", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ entries: recData.schedule }),
            });
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: getActionSuccessMessage(pendingAction),
          },
        ]);
        setPendingAction(null);
        onDataChanged();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Failed to execute the change. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong executing the change.",
        },
      ]);
    } finally {
      setActionExecuting(false);
    }
  }

  function dismissAction() {
    setPendingAction(null);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "No changes made. Let me know if you need anything else." },
    ]);
  }

  function getActionSuccessMessage(action: ProposedAction): string {
    switch (action.type) {
      case "update_peptide":
        return "Done! I've updated your protocol. The changes will be reflected across the app.";
      case "add_peptide":
        return "Done! The new peptide has been added to your protocol.";
      case "regenerate_schedule":
        return "Done! Your dosing schedule has been regenerated with the updated protocol.";
      default:
        return "Change applied successfully.";
    }
  }

  function getActionLabel(action: ProposedAction): string {
    switch (action.type) {
      case "update_peptide":
        return "Update Protocol";
      case "add_peptide":
        return "Add Peptide";
      case "regenerate_schedule":
        return "Regenerate Schedule";
      default:
        return "Apply Change";
    }
  }

  function renderMarkdown(text: string) {
    return text.split("\n").map((line, i) => {
      const processed = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>'
      );
      if (line.startsWith("### "))
        return <h4 key={i} className="font-semibold text-sm mt-2" dangerouslySetInnerHTML={{ __html: processed.slice(4) }} />;
      if (line.startsWith("## "))
        return <h3 key={i} className="font-semibold mt-2" dangerouslySetInnerHTML={{ __html: processed.slice(3) }} />;
      if (line.startsWith("- ") || line.startsWith("* "))
        return <li key={i} className="ml-4 text-sm" dangerouslySetInnerHTML={{ __html: "• " + processed.slice(2) }} />;
      if (/^\d+\.\s/.test(line))
        return <li key={i} className="ml-4 text-sm" dangerouslySetInnerHTML={{ __html: processed }} />;
      if (!line.trim()) return <div key={i} className="h-1.5" />;
      return <p key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between shrink-0">
        <button onClick={onClose} className="text-primary font-medium text-sm">
          Done
        </button>
        <div className="text-center">
          <h2 className="text-[15px] font-semibold">AI Assistant</h2>
          <p className="text-[11px] text-muted">Protocol advisor</p>
        </div>
        <div className="w-10" />
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-primary" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 10h.01" />
                <path d="M12 10h.01" />
                <path d="M16 10h.01" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-1">Protocol Assistant</h3>
            <p className="text-sm text-muted max-w-xs mx-auto">
              Ask me anything about your peptides. I can adjust doses, update your schedule, and help optimize your protocol.
            </p>
            <div className="mt-6 space-y-2 max-w-xs mx-auto">
              {[
                "I'm not feeling effects from BPC-157",
                "Should I increase my dose?",
                "What's the best time to take my peptides?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="w-full text-left text-sm px-4 py-2.5 rounded-2xl bg-surface border border-border/50 text-muted active:bg-surface-hover transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-lg"
                  : "bg-surface text-foreground rounded-bl-lg shadow-sm"
              }`}
            >
              {msg.role === "assistant"
                ? renderMarkdown(msg.content)
                : <p className="text-sm">{msg.content}</p>
              }
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface rounded-2xl rounded-bl-lg px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Action confirmation card */}
      {pendingAction && (
        <div className="px-4 py-3 border-t border-border/50 bg-surface shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="text-sm font-semibold">Ready to apply change</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={dismissAction}
              className="flex-1 bg-surface-hover text-foreground font-medium py-2.5 rounded-2xl text-sm"
            >
              Cancel
            </button>
            <button
              onClick={executeAction}
              disabled={actionExecuting}
              className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-2xl text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {actionExecuting ? "Applying..." : getActionLabel(pendingAction)}
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="px-4 py-3 border-t border-border/50 bg-surface/80 backdrop-blur-xl shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your protocol..."
            disabled={loading}
            className="flex-1 bg-background border border-border rounded-2xl px-4 py-2.5 text-foreground text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

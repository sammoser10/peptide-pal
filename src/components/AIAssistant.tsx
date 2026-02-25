"use client";

import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { AIChatMessage } from "@/lib/database.types";

interface Props {
  onDataChanged: () => void;
}

interface ProposedAction {
  type: string;
  peptide_id?: string;
  changes?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export default function AIAssistant({ onDataChanged }: Props) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<ProposedAction | null>(null);
  const [actionExecuting, setActionExecuting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: React.ReactNode[] = [];
    let listKey = 0;

    function flushList() {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${listKey++}`} className="space-y-1 my-1.5">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    }

    lines.forEach((line, i) => {
      // Bold
      const processed = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold">$1</strong>'
      );

      // Headers
      if (line.startsWith("### ")) {
        flushList();
        elements.push(
          <p key={i} className="text-[13px] font-semibold text-foreground mt-2.5 mb-0.5 tracking-tight" dangerouslySetInnerHTML={{ __html: processed.slice(4) }} />
        );
        return;
      }
      if (line.startsWith("## ")) {
        flushList();
        elements.push(
          <p key={i} className="text-[14px] font-semibold text-foreground mt-2.5 mb-0.5 tracking-tight" dangerouslySetInnerHTML={{ __html: processed.slice(3) }} />
        );
        return;
      }

      // Bullet list
      if (line.startsWith("- ") || line.startsWith("* ")) {
        inList = true;
        listItems.push(
          <li key={i} className="flex gap-1.5 text-[13px] leading-relaxed">
            <span className="text-primary/60 mt-0.5 shrink-0">&#8226;</span>
            <span dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />
          </li>
        );
        return;
      }

      // Numbered list
      if (/^\d+\.\s/.test(line)) {
        inList = true;
        const num = line.match(/^(\d+)\./)?.[1];
        const content = processed.replace(/^\d+\.\s*/, "");
        listItems.push(
          <li key={i} className="flex gap-1.5 text-[13px] leading-relaxed">
            <span className="text-primary/60 font-medium shrink-0 min-w-[1.2em] text-right">{num}.</span>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </li>
        );
        return;
      }

      // Empty line
      if (!line.trim()) {
        flushList();
        elements.push(<div key={i} className="h-1" />);
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={i} className="text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: processed }} />
      );
    });

    flushList();
    return elements;
  }

  return (
    <div className="flex flex-col h-full -mx-4 -my-5">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-10 animate-fade-in">
            <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 10h.01" />
                <path d="M12 10h.01" />
                <path d="M16 10h.01" />
              </svg>
            </div>
            <h3 className="font-semibold text-[17px] mb-1 tracking-tight">Protocol Assistant</h3>
            <p className="text-[13px] text-muted max-w-[260px] mx-auto leading-relaxed">
              Ask me anything about your peptides. I can adjust doses, update schedules, and optimize your protocol.
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
                  className="w-full text-left text-[13px] px-4 py-3 rounded-2xl bg-surface shadow-sm text-muted press-spring"
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
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mr-2 mt-0.5 shrink-0 shadow-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-surface text-foreground rounded-bl-md shadow-sm"
              }`}
            >
              {msg.role === "assistant"
                ? renderMarkdown(msg.content)
                : <p className="text-[14px] leading-relaxed">{msg.content}</p>
              }
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-slide-up">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mr-2 mt-0.5 shrink-0 shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="bg-surface rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center h-4">
                <div className="w-1.5 h-1.5 bg-muted rounded-full typing-dot" />
                <div className="w-1.5 h-1.5 bg-muted rounded-full typing-dot" />
                <div className="w-1.5 h-1.5 bg-muted rounded-full typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Action confirmation card */}
      {pendingAction && (
        <div className="px-4 py-3 border-t border-border/30 bg-surface/95 backdrop-blur-xl shrink-0 animate-slide-up">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="text-[14px] font-semibold tracking-tight">Ready to apply change</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={dismissAction}
              className="flex-1 bg-surface-hover text-foreground font-medium py-3 rounded-2xl text-[14px] press-spring"
            >
              Cancel
            </button>
            <button
              onClick={executeAction}
              disabled={actionExecuting}
              className="flex-1 bg-primary text-white font-semibold py-3 rounded-2xl text-[14px] disabled:opacity-50 press-spring"
            >
              {actionExecuting ? "Applying..." : getActionLabel(pendingAction)}
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="px-4 py-3 border-t border-border/30 bg-surface/95 backdrop-blur-xl shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your protocol..."
            disabled={loading}
            className="flex-1 bg-background border border-border/60 rounded-full px-4 py-2.5 text-foreground text-[15px] disabled:opacity-50 placeholder:text-muted/60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 press-spring shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

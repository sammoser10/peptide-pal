"use client";

import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { searchPeptides, type CommonPeptide } from "@/lib/peptide-database";
import type { AIChatMessage, AIPeptideResult } from "@/lib/database.types";

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

type FlowStep = "search" | "chat";

export default function AIAddPeptide({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState<FlowStep>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeptide, setSelectedPeptide] = useState<CommonPeptide | null>(null);
  const [customName, setCustomName] = useState("");

  // Chat state
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [peptideResult, setPeptideResult] = useState<AIPeptideResult | null>(null);
  const [saving, setSaving] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredPeptides = searchPeptides(searchQuery);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (step === "chat") {
      inputRef.current?.focus();
    }
  }, [step]);

  function handleSelectPeptide(peptide: CommonPeptide) {
    setSelectedPeptide(peptide);
    startChat(peptide.name, peptide);
  }

  function handleCustomPeptide() {
    if (!customName.trim()) return;
    setSelectedPeptide(null);
    startChat(customName.trim(), null);
  }

  function startChat(name: string, peptideInfo: CommonPeptide | null) {
    const initialMessage: AIChatMessage = {
      role: "user",
      content: `I want to add ${name} to my peptide tracker.`,
    };
    setMessages([initialMessage]);
    setStep("chat");
    sendToAI([initialMessage], name, peptideInfo);
  }

  async function sendToAI(
    chatMessages: AIChatMessage[],
    name?: string,
    peptideInfo?: CommonPeptide | null
  ) {
    setLoading(true);
    try {
      const peptideName = name || selectedPeptide?.name || customName;
      const res = await apiFetch("/api/ai-peptide-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          peptideName,
          peptideInfo: peptideInfo !== undefined ? peptideInfo : selectedPeptide,
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      const assistantMsg: AIChatMessage = {
        role: "assistant",
        content: data.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.done && data.peptideData) {
        setPeptideResult(data.peptideData);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble processing that. Could you try again?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: AIChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    await sendToAI(newMessages);
  }

  async function handleSavePeptide() {
    if (!peptideResult) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/peptides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(peptideResult),
      });
      if (res.ok) {
        onComplete();
      }
    } finally {
      setSaving(false);
    }
  }

  function renderMarkdown(text: string) {
    // Strip the JSON code block from display if present
    const cleanText = text.replace(/```json\s*\n[\s\S]*?\n```/g, "").trim();

    return cleanText.split("\n").map((line, i) => {
      // Bold
      const processed = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>'
      );
      // Headers
      if (line.startsWith("### "))
        return (
          <h4
            key={i}
            className="font-semibold text-sm mt-2"
            dangerouslySetInnerHTML={{ __html: processed.slice(4) }}
          />
        );
      if (line.startsWith("## "))
        return (
          <h3
            key={i}
            className="font-semibold mt-2"
            dangerouslySetInnerHTML={{ __html: processed.slice(3) }}
          />
        );
      // List items
      if (line.startsWith("- ") || line.startsWith("* "))
        return (
          <li
            key={i}
            className="ml-4 text-sm"
            dangerouslySetInnerHTML={{ __html: "• " + processed.slice(2) }}
          />
        );
      if (/^\d+\.\s/.test(line))
        return (
          <li
            key={i}
            className="ml-4 text-sm"
            dangerouslySetInnerHTML={{ __html: processed }}
          />
        );
      // Empty lines
      if (!line.trim()) return <div key={i} className="h-2" />;
      // Regular text
      return (
        <p
          key={i}
          className="text-sm"
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      );
    });
  }

  // ---- SEARCH STEP ----
  if (step === "search") {
    return (
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-[15px]">Add New with AI</h3>
          <button
            onClick={onCancel}
            className="text-muted hover:text-foreground p-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-muted">
            Search for a peptide or type a custom name. AI will help you configure it.
          </p>

          {/* Search input */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search peptides..."
              className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-3 text-foreground"
              autoFocus
            />
          </div>

          {/* Custom peptide option */}
          {searchQuery.trim() && !filteredPeptides.some(
            (p) => p.name.toLowerCase() === searchQuery.toLowerCase()
          ) && (
            <button
              onClick={() => {
                setCustomName(searchQuery.trim());
                handleCustomPeptide();
              }}
              className="w-full text-left p-3 rounded-lg border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <div className="text-sm font-medium text-primary">
                + Add &quot;{searchQuery.trim()}&quot; as custom peptide
              </div>
              <div className="text-xs text-muted mt-0.5">
                AI will still help you set it up
              </div>
            </button>
          )}

          {/* Peptide list */}
          <div className="max-h-80 overflow-y-auto space-y-1.5">
            {filteredPeptides.map((peptide) => (
              <button
                key={peptide.name}
                onClick={() => handleSelectPeptide(peptide)}
                className="w-full text-left p-3 rounded-lg border border-border bg-surface hover:bg-surface-hover hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{peptide.name}</span>
                  <span className="text-xs text-muted bg-background px-2 py-0.5 rounded-full">
                    {peptide.category}
                  </span>
                </div>
                <p className="text-xs text-muted mt-1 line-clamp-2">
                  {peptide.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- CHAT STEP ----
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col" style={{ maxHeight: "70vh" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setStep("search");
              setMessages([]);
              setPeptideResult(null);
            }}
            className="text-muted hover:text-foreground p-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h3 className="font-semibold text-sm">
              AI Setup: {selectedPeptide?.name || customName}
            </h3>
            <p className="text-xs text-muted">Peptide assistant</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-muted hover:text-foreground p-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) =>
          msg.role === "user" && i === 0 ? null : (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-surface-hover text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant"
                  ? renderMarkdown(msg.content)
                  : <p className="text-sm">{msg.content}</p>
                }
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-hover rounded-2xl rounded-bl-md px-4 py-3">
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

      {/* Result confirmation */}
      {peptideResult && (
        <div className="px-4 py-3 border-t border-border bg-success/5 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-success"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-sm font-semibold">Ready to add</span>
          </div>
          <div className="text-xs text-muted space-y-0.5 mb-3">
            <div><strong>{peptideResult.name}</strong></div>
            <div>Dose: {peptideResult.default_dose_mcg} mcg | {peptideResult.frequency_description}</div>
            {peptideResult.vial_size_mg && peptideResult.reconstitution_volume_ml && (
              <div>
                Reconstitution: {peptideResult.vial_size_mg}mg + {peptideResult.reconstitution_volume_ml}mL BAC water
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPeptideResult(null)}
              className="flex-1 bg-surface-hover text-foreground font-medium py-2.5 rounded-xl text-sm"
            >
              Adjust
            </button>
            <button
              onClick={handleSavePeptide}
              disabled={saving}
              className="flex-1 bg-success hover:bg-success/90 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Peptide"}
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      {!peptideResult && (
        <form
          onSubmit={handleSendMessage}
          className="px-4 py-3 border-t border-border shrink-0"
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response..."
              disabled={loading}
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-foreground text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

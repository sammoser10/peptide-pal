"use client";

import { useState } from "react";

interface AIRecommendationProps {
  refreshKey: number;
}

export default function AIRecommendation({ refreshKey }: AIRecommendationProps) {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  async function fetchRecommendation() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recommendations");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setRecommendation(data.recommendation);
        setLastFetched(new Date());
      }
    } catch {
      setError("Failed to connect to AI service");
    } finally {
      setLoading(false);
    }
  }

  // Simple markdown-to-html for basic formatting
  function renderMarkdown(text: string) {
    return text
      .split("\n")
      .map((line, i) => {
        // Headers
        if (line.startsWith("### "))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          );
        if (line.startsWith("## "))
          return (
            <h3 key={i} className="font-bold mt-4 mb-1">
              {line.slice(3)}
            </h3>
          );
        if (line.startsWith("# "))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-1">
              {line.slice(2)}
            </h2>
          );
        // List items
        if (line.startsWith("- ") || line.startsWith("* "))
          return (
            <li key={i} className="ml-4 text-sm">
              {formatInline(line.slice(2))}
            </li>
          );
        // Numbered list items
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 text-sm list-decimal">
              {formatInline(line.replace(/^\d+\.\s/, ""))}
            </li>
          );
        // Empty line
        if (line.trim() === "") return <br key={i} />;
        // Normal paragraph
        return (
          <p key={i} className="text-sm">
            {formatInline(line)}
          </p>
        );
      });
  }

  function formatInline(text: string) {
    // Bold
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  }

  return (
    <div className="space-y-4">
      <button
        onClick={fetchRecommendation}
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Analyzing your regimen...
          </>
        ) : (
          <>
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
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
              <path d="M9 21h6" />
              <path d="M10 21v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1" />
            </svg>
            {recommendation ? "Refresh Recommendation" : "Get AI Recommendation"}
          </>
        )}
      </button>

      {error && (
        <div className="bg-danger/10 text-danger rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {recommendation && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              AI Schedule Assistant
            </span>
            {lastFetched && (
              <span className="text-xs text-muted">
                {lastFetched.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          <div className="prose-sm text-foreground mt-2 leading-relaxed">
            {renderMarkdown(recommendation)}
          </div>
          <p className="text-xs text-muted mt-4 pt-3 border-t border-border">
            Always follow your healthcare provider&apos;s instructions. This is
            an AI assistant and does not replace medical advice.
          </p>
        </div>
      )}

      {!recommendation && !loading && (
        <p className="text-muted text-sm text-center py-4">
          Tap the button above to get personalized dosing recommendations based
          on your injection history.
        </p>
      )}
    </div>
  );
}

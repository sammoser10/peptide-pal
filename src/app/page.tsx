"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import AuthScreen from "@/components/AuthScreen";
import OnboardingFlow from "@/components/OnboardingFlow";
import LogInjectionForm from "@/components/LogInjectionForm";
import InjectionHistory from "@/components/InjectionHistory";
import CalendarView from "@/components/CalendarView";
import PeptideManager from "@/components/PeptideManager";
import AIRecommendation from "@/components/AIRecommendation";

type Tab = "log" | "history" | "calendar" | "schedule" | "peptides";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "log",
    label: "Log",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "History",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
        <path d="M9 21h6" />
      </svg>
    ),
  },
  {
    id: "peptides",
    label: "Peptides",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 3H5a2 2 0 0 0-2 2v4" />
        <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
        <path d="M15 3h4a2 2 0 0 1 2 2v4" />
        <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
        <path d="M12 7v10" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
];

export default function Home() {
  const { user, profile, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("log");
  const [refreshKey, setRefreshKey] = useState(0);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  // Not logged in -> show auth screen
  if (!user) {
    return <AuthScreen />;
  }

  // Logged in but hasn't completed onboarding -> show onboarding
  if (!profile?.onboarding_completed) {
    return <OnboardingFlow />;
  }

  function handleInjectionLogged() {
    setRefreshKey((k) => k + 1);
    setActiveTab("history");
  }

  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <header className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="w-10" />
        <h1 className="text-xl font-bold text-center">
          <span className="text-primary">Peptide</span> Pal
        </h1>
        <button
          onClick={signOut}
          className="text-muted hover:text-foreground transition-colors p-1"
          aria-label="Sign out"
          title="Sign out"
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
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </header>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {activeTab === "log" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Log Injection</h2>
            <LogInjectionForm onSuccess={handleInjectionLogged} />
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Injection History</h2>
            <InjectionHistory refreshKey={refreshKey} />
          </div>
        )}

        {activeTab === "calendar" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Calendar</h2>
            <CalendarView refreshKey={refreshKey} />
          </div>
        )}

        {activeTab === "schedule" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">AI Schedule</h2>
            <AIRecommendation refreshKey={refreshKey} />
          </div>
        )}

        {activeTab === "peptides" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">My Peptides</h2>
            <PeptideManager />
          </div>
        )}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-4 min-w-0 flex-1 transition-colors ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import AuthScreen from "@/components/AuthScreen";
import OnboardingFlow from "@/components/OnboardingFlow";
import LogInjectionForm from "@/components/LogInjectionForm";
import InjectionHistory from "@/components/InjectionHistory";
import CalendarView from "@/components/CalendarView";
import PeptideManager from "@/components/PeptideManager";
import ScheduleView from "@/components/ScheduleView";
import AIAssistant from "@/components/AIAssistant";

type Tab = "log" | "history" | "calendar" | "schedule" | "protocol" | "ai";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "log",
    label: "Log",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "History",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
        <path d="M9 21h6" />
      </svg>
    ),
  },
  {
    id: "protocol",
    label: "Protocol",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H5a2 2 0 0 0-2 2v4" />
        <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
        <path d="M15 3h4a2 2 0 0 1 2 2v4" />
        <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
        <path d="M12 7v10" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  {
    id: "ai",
    label: "AI",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 10h.01" />
        <path d="M12 10h.01" />
        <path d="M16 10h.01" />
      </svg>
    ),
  },
];

export default function Home() {
  const { user, profile, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("log");
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!profile?.onboarding_completed) {
    return <OnboardingFlow />;
  }

  function handleInjectionLogged() {
    setRefreshKey((k) => k + 1);
    setActiveTab("history");
  }

  function handleQuickLog() {
    setRefreshKey((k) => k + 1);
  }

  const pageTitle: Record<Tab, string> = {
    log: "Log Dose",
    history: "History",
    calendar: "Calendar",
    schedule: "Schedule",
    protocol: "Current Protocol",
    ai: "AI Assistant",
  };

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="w-10" />
        <h1 className="text-[17px] font-semibold tracking-tight">
          {pageTitle[activeTab]}
        </h1>
        <button
          onClick={signOut}
          className="text-primary hover:text-primary-dark transition-colors p-1"
          aria-label="Sign out"
          title="Sign out"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </header>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto px-4 py-5 pb-28">
        {activeTab === "log" && (
          <LogInjectionForm onSuccess={handleInjectionLogged} />
        )}

        {activeTab === "history" && (
          <InjectionHistory refreshKey={refreshKey} />
        )}

        {activeTab === "calendar" && (
          <CalendarView refreshKey={refreshKey} />
        )}

        {activeTab === "schedule" && (
          <ScheduleView refreshKey={refreshKey} onDoseLogged={handleQuickLog} />
        )}

        {activeTab === "protocol" && (
          <PeptideManager />
        )}

        {activeTab === "ai" && (
          <AIAssistant onDataChanged={handleQuickLog} />
        )}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-border/50 pb-[env(safe-area-inset-bottom)] z-30">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-2 min-w-0 flex-1 transition-colors ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted"
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

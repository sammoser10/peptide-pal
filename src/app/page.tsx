"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import AuthScreen from "@/components/AuthScreen";
import OnboardingFlow from "@/components/OnboardingFlow";
import LogInjectionForm from "@/components/LogInjectionForm";
import InjectionHistory from "@/components/InjectionHistory";
import CalendarView from "@/components/CalendarView";
import PeptideManager from "@/components/PeptideManager";
import ScheduleView from "@/components/ScheduleView";
import AIAssistant from "@/components/AIAssistant";
import SettingsView from "@/components/SettingsView";

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
  const [showSettings, setShowSettings] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewKey, setViewKey] = useState(0);
  const mainRef = useRef<HTMLElement>(null);

  // Trigger view animation on tab change
  useEffect(() => {
    setViewKey((k) => k + 1);
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab, showSettings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-background">
        <div className="animate-scale-pop">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
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
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      {/* Header - glass effect */}
      <header className="glass border-b border-border/40 px-4 pb-3 flex items-center justify-between shrink-0 z-30" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        {showSettings ? (
          <button
            onClick={() => setShowSettings(false)}
            className="text-primary text-[15px] font-medium w-16 text-left press-spring"
          >
            Done
          </button>
        ) : (
          <button
            onClick={() => setShowSettings(true)}
            className="text-muted active:text-foreground transition-colors p-1 w-10 press-spring"
            aria-label="Settings"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        )}
        <h1 className="text-[17px] font-semibold tracking-tight">
          {showSettings ? "Settings" : pageTitle[activeTab]}
        </h1>
        {showSettings ? (
          <button
            onClick={signOut}
            className="text-danger text-[13px] font-medium w-16 text-right press-spring"
          >
            Sign Out
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* Content area - animated view transitions */}
      <main ref={mainRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div key={viewKey} className="animate-view-appear">
          {showSettings ? (
            <SettingsView />
          ) : (
            <>
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
            </>
          )}
        </div>
      </main>

      {/* Bottom tab bar - glass with spring tab icons */}
      {!showSettings && (
        <nav className="glass border-t border-border/30 shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="flex justify-around items-center">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex flex-col items-center py-2 px-2 min-w-0 flex-1"
                >
                  <span className={`tab-transition ${isActive ? "text-primary tab-active" : "text-muted"}`}>
                    {tab.icon}
                  </span>
                  <span className={`text-[10px] mt-0.5 font-medium tab-transition ${isActive ? "text-primary" : "text-muted"}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

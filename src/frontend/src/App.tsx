import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import {
  Activity,
  Car,
  Flag,
  Gauge,
  Loader2,
  LogOut,
  MapPin,
  Target,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FeedTab } from "./components/FeedTab";
import { GarageTab } from "./components/GarageTab";
import { HpCalculatorTab } from "./components/HpCalculatorTab";
import { LeaderboardTab } from "./components/LeaderboardTab";
import { MeetTab } from "./components/MeetTab";
import { ProfileModal } from "./components/ProfileModal";
import { RaceTab } from "./components/RaceTab";
import { TasksTab } from "./components/TasksTab";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerProfile } from "./hooks/useQueries";

type Tab = "feed" | "race" | "garage" | "leaderboard" | "hp" | "meet" | "tasks";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "feed", label: "Feed", icon: Activity },
  { id: "race", label: "Race", icon: Flag },
  { id: "garage", label: "Garage", icon: Car },
  { id: "leaderboard", label: "Legends", icon: Trophy },
  { id: "hp", label: "HP", icon: Gauge },
  { id: "meet", label: "Meet", icon: MapPin },
  { id: "tasks", label: "Tasks", icon: Target },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { identity, login, clear, isLoggingIn, isLoginSuccess } =
    useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();

  const isLoggedIn = !!identity;

  // After login, if no profile, prompt creation
  useEffect(() => {
    if (isLoginSuccess && !profileLoading && !profile) {
      setShowProfileModal(true);
    }
  }, [isLoginSuccess, profile, profileLoading]);

  // Also check when profile data loads after login
  useEffect(() => {
    if (isLoggedIn && !profileLoading && profile === null) {
      setShowProfileModal(true);
    }
  }, [isLoggedIn, profile, profileLoading]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background dark scanlines">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Zap
                className="h-6 w-6 neon-cyan"
                style={{
                  filter: "drop-shadow(0 0 6px oklch(0.82 0.18 195 / 0.7))",
                }}
              />
            </div>
            <div>
              <h1 className="font-display font-black text-lg leading-none tracking-tight neon-cyan neon-glow-cyan">
                Street Legends
              </h1>
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground leading-none mt-0.5">
                Racing Social
              </p>
            </div>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 font-mono text-xs hover:bg-muted/50"
                  >
                    <Avatar className="h-6 w-6">
                      {profile?.avatarUrl && (
                        <AvatarImage
                          src={profile.avatarUrl}
                          alt={profile.name}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-mono">
                        {profile?.name?.slice(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-foreground/80 max-w-[80px] truncate">
                      {profile?.name || "Racer"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-popover border-border font-body"
                >
                  {profile && (
                    <DropdownMenuItem
                      className="text-xs text-muted-foreground font-mono cursor-default"
                      disabled
                    >
                      {identity.getPrincipal().toString().slice(0, 12)}…
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-xs cursor-pointer hover:bg-muted/50 font-body"
                    onClick={() => setShowProfileModal(true)}
                  >
                    <User className="mr-2 h-3 w-3" />
                    {profile ? "Edit Profile" : "Create Profile"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 font-body"
                    onClick={clear}
                  >
                    <LogOut className="mr-2 h-3 w-3" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className="h-8 bg-primary text-primary-foreground font-display font-bold text-xs tracking-wider hover:opacity-90 btn-neon"
                onClick={login}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Zap className="mr-1.5 h-3 w-3" />
                    Login
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "feed" && <FeedTab />}
              {activeTab === "race" && <RaceTab />}
              {activeTab === "garage" && <GarageTab />}
              {activeTab === "leaderboard" && <LeaderboardTab />}
              {activeTab === "hp" && <HpCalculatorTab />}
              {activeTab === "meet" && <MeetTab />}
              {activeTab === "tasks" && <TasksTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Tab Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-lg mx-auto px-2 h-16 flex items-center">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-lg transition-all duration-200 relative ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground/60"
                }`}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-1 rounded-md bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon
                  className={`h-5 w-5 relative z-10 transition-all ${isActive ? "neon-cyan" : ""}`}
                  style={
                    isActive
                      ? {
                          filter:
                            "drop-shadow(0 0 6px oklch(0.82 0.18 195 / 0.7))",
                        }
                      : undefined
                  }
                />
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider relative z-10 ${isActive ? "neon-cyan" : ""}`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <footer className="sr-only">
        <p>
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Profile Modal */}
      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={profile ?? undefined}
      />

      {/* Toast */}
      <Toaster
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "bg-popover border-border font-body text-sm",
            success: "border-neon-cyan/30",
            error: "border-destructive/30",
          },
        }}
      />
    </div>
  );
}
